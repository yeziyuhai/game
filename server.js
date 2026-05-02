const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// 游戏状态
let players = [];
let readyState = { blue: false, red: false };
let gameActive = false;

// 玩家类（服务器端）
class ServerPlayer {
    constructor(color, name) {
        this.color = color;
        this.name = name;
        this.width = 30;
        this.height = 30;
        this.hp = 30;
        this.maxHp = 30;
        this.lives = 3;
        this.velX = 0;
        this.velY = 0;
        this.grounded = true;
        this.facingRight = (color === 'blue');
        this.shootCooldown = 0;
        
        // 初始位置：蓝方左边，红方右边
        if (color === 'blue') {
            this.x = 100;
            this.y = 300;
        } else {
            this.x = 620;
            this.y = 300;
        }
    }
    
    respawn() {
        if (this.color === 'blue') {
            this.x = 100;
            this.y = 300;
        } else {
            this.x = 620;
            this.y = 300;
        }
        this.hp = this.maxHp;
        this.velX = 0;
        this.velY = 0;
    }
}

let gameState = {
    players: {},
    bullets: []
};

// 平台定义
const PLATFORMS = [
    { x: 0, y: 590, width: 750, height: 15 },      // 地面
    { x: 50, y: 520, width: 130, height: 12 },     // 左一层
    { x: 570, y: 520, width: 130, height: 12 },    // 右一层
    { x: 120, y: 440, width: 110, height: 12 },    // 左二层
    { x: 520, y: 440, width: 110, height: 12 },    // 右二层
    { x: 310, y: 360, width: 130, height: 12 },    // 三层
    { x: 310, y: 280, width: 130, height: 12 }     // 四层
];

// 碰撞检测
function checkCollision(player, platforms) {
    player.grounded = false;
    for (let p of platforms) {
        if (player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y + player.height > p.y &&
            player.y < p.y + p.height) {
            
            if (player.velY >= 0 && player.y + player.height - player.velY <= p.y) {
                player.y = p.y - player.height;
                player.velY = 0;
                player.grounded = true;
            } else if (player.velY < 0 && player.y - player.velY >= p.y + p.height) {
                player.y = p.y + p.height;
                player.velY = 0;
            }
        }
    }
}

io.on('connection', (socket) => {
    console.log('新连接:', socket.id);
    
    if (players.length >= 2) {
        socket.emit('room_full');
        return;
    }
    
    const color = players.length === 0 ? 'blue' : 'red';
    players.push({ id: socket.id, color });
    socket.emit('role_assign', { color });
    console.log('分配角色:', color);
    
    io.emit('room_state', {
        blueReady: readyState.blue,
        redReady: readyState.red,
        blueConnected: players.some(p => p.color === 'blue'),
        redConnected: players.some(p => p.color === 'red')
    });
    
    socket.on('player_ready', () => {
        readyState[color] = true;
        console.log('玩家准备:', color);
        io.emit('room_state', {
            blueReady: readyState.blue,
            redReady: readyState.red,
            blueConnected: true,
            redConnected: true
        });
    });
    
    socket.on('start_game', () => {
        if (readyState.blue && readyState.red && players.length === 2) {
            console.log('游戏开始！');
            gameActive = true;
            
            // 创建新玩家
            const bluePlayer = new ServerPlayer('blue', '蓝方');
            const redPlayer = new ServerPlayer('red', '红方');
            
            gameState = {
                players: {
                    blue: bluePlayer,
                    red: redPlayer
                },
                bullets: []
            };
            
            console.log('玩家位置:', bluePlayer.x, bluePlayer.y, redPlayer.x, redPlayer.y);
            
            io.emit('game_start');
            io.emit('game_state', {
                players: gameState.players,
                bullets: gameState.bullets,
                myColor: null
            });
        }
    });
    
    socket.on('move', (data) => {
        if (gameActive && gameState.players[color]) {
            gameState.players[color].velX = data.velX || 0;
            gameState.players[color].x += gameState.players[color].velX;
            
            // 边界限制
            if (gameState.players[color].x < 20) gameState.players[color].x = 20;
            if (gameState.players[color].x + 30 > 720) gameState.players[color].x = 720 - 30;
            
            // 更新面向
            if (gameState.players[color].velX !== 0) {
                gameState.players[color].facingRight = gameState.players[color].velX > 0;
            }
        }
    });
    
    socket.on('jump', () => {
        if (gameActive && gameState.players[color] && gameState.players[color].grounded) {
            gameState.players[color].velY = -10;
            gameState.players[color].grounded = false;
            console.log('跳跃:', color);
        }
    });
    
    socket.on('shoot', () => {
        if (gameActive && gameState.players[color]) {
            const p = gameState.players[color];
            if (p.shootCooldown <= 0) {
                p.shootCooldown = 20;
                const direction = p.facingRight ? 1 : -1;
                gameState.bullets.push({
                    x: p.x + 15,
                    y: p.y + 15,
                    direction: direction,
                    owner: color,
                    damage: 8,
                    knockback: 6,
                    speed: 10
                });
                console.log('射击:', color);
            }
        }
    });
    
    socket.on('return_to_room', () => {
        console.log('返回房间');
        gameActive = false;
        readyState = { blue: false, red: false };
        players = [];
        socket.emit('redirect_to_room');
    });
    
    socket.on('disconnect', () => {
        console.log('断开连接:', socket.id);
        players = players.filter(p => p.id !== socket.id);
        readyState[color] = false;
        io.emit('room_state', {
            blueReady: readyState.blue,
            redReady: readyState.red,
            blueConnected: players.some(p => p.color === 'blue'),
            redConnected: players.some(p => p.color === 'red')
        });
    });
});

// 游戏循环
setInterval(() => {
    if (!gameActive) return;
    
    // 更新子弹
    for (let i = 0; i < gameState.bullets.length; i++) {
        const b = gameState.bullets[i];
        b.x += b.speed * b.direction;
        if (b.x < -50 || b.x > 800) {
            gameState.bullets.splice(i, 1);
            i--;
            continue;
        }
        
        // 碰撞检测
        for (let id in gameState.players) {
            if (id !== b.owner) {
                const p = gameState.players[id];
                if (b.x < p.x + p.width && b.x + 8 > p.x &&
                    b.y < p.y + p.height && b.y + 5 > p.y) {
                    
                    p.hp -= b.damage;
                    p.velX += b.knockback * b.direction;
                    gameState.bullets.splice(i, 1);
                    i--;
                    console.log('击中:', id, '剩余血量:', p.hp);
                    
                    if (p.hp <= 0) {
                        p.lives--;
                        console.log('死亡:', id, '剩余生命:', p.lives);
                        if (p.lives <= 0) {
                            gameActive = false;
                            const winner = id === 'blue' ? 'red' : 'blue';
                            console.log('游戏结束, 胜利者:', winner);
                            io.emit('game_over', { winner: winner });
                            return;
                        }
                        p.hp = p.maxHp;
                        p.respawn();
                    }
                    break;
                }
            }
        }
    }
    
    // 更新玩家物理
    for (let id in gameState.players) {
        const p = gameState.players[id];
        p.velY += 0.8;
        p.y += p.velY;
        
        checkCollision(p, PLATFORMS);
        
        // 掉落死亡
        if (p.y > 650) {
            p.lives--;
            console.log('掉落死亡:', id, '剩余生命:', p.lives);
            if (p.lives <= 0) {
                gameActive = false;
                const winner = id === 'blue' ? 'red' : 'blue';
                io.emit('game_over', { winner: winner });
                return;
            }
            p.hp = p.maxHp;
            p.respawn();
        }
        
        // 冷却
        if (p.shootCooldown > 0) p.shootCooldown--;
    }
    
    // 广播状态
    io.emit('game_state', {
        players: gameState.players,
        bullets: gameState.bullets,
        myColor: null
    });
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ 混乱大枪战服务器运行在端口 ${PORT}`);
});
