const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { 
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// 游戏状态
let players = [];
let readyState = { blue: false, red: false };
let gameActive = false;
let gameState = {
    players: {},
    bullets: []
};

// 平台定义
const PLATFORMS = [
    { x: 0, y: 590, width: 750, height: 15 },
    { x: 50, y: 520, width: 130, height: 12 },
    { x: 570, y: 520, width: 130, height: 12 },
    { x: 120, y: 440, width: 110, height: 12 },
    { x: 520, y: 440, width: 110, height: 12 },
    { x: 310, y: 360, width: 130, height: 12 },
    { x: 310, y: 280, width: 130, height: 12 }
];

// 创建玩家数据（纯对象，不是类实例，方便传输）
function createPlayerData(color, x, y) {
    return {
        color: color,
        name: color === 'blue' ? '蓝方' : '红方',
        x: x,
        y: y,
        width: 30,
        height: 30,
        hp: 30,
        maxHp: 30,
        lives: 3,
        velX: 0,
        velY: 0,
        grounded: true,
        facingRight: color === 'blue',
        shootCooldown: 0
    };
}

function resetGame() {
    gameActive = true;
    gameState = {
        players: {
            blue: createPlayerData('blue', 100, 300),
            red: createPlayerData('red', 620, 300)
        },
        bullets: []
    };
    console.log('游戏重置，玩家位置:', gameState.players.blue.x, gameState.players.blue.y);
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
    console.log('分配角色:', color, '当前玩家数:', players.length);
    
    // 广播房间状态
    io.emit('room_state', {
        blueReady: readyState.blue,
        redReady: readyState.red,
        blueConnected: players.some(p => p.color === 'blue'),
        redConnected: players.some(p => p.color === 'red')
    });
    socket.on('move_down', () => {
    if (gameActive && gameState.players[color]) {
        const p = gameState.players[color];
        // 向下移动：增加 Y 坐标，让角色掉到下层平台
        p.y += 45;
        p.velY = 0;
        console.log('下平台:', color);
    }
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
            console.log('===== 游戏开始！ =====');
            resetGame();
            io.emit('game_start');
            io.emit('game_state', {
                players: gameState.players,
                bullets: gameState.bullets,
                myColor: null
            });
            console.log('发送初始游戏状态，玩家:', Object.keys(gameState.players));
        }
    });
    
socket.on('move', (data) => {
    if (gameActive && gameState.players[color]) {
        gameState.players[color].velX = data.velX || 0;
        gameState.players[color].x += gameState.players[color].velX;
        
        // 边界限制
        if (gameState.players[color].x < 20) gameState.players[color].x = 20;
        if (gameState.players[color].x + 30 > 700) gameState.players[color].x = 700 - 30;
        
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
    socket.on('request_game_state', () => {
    console.log('请求游戏状态，当前 gameActive:', gameActive);
    if (gameActive && gameState.players.blue && gameState.players.red) {
        socket.emit('game_state', {
            players: gameState.players,
            bullets: gameState.bullets,
            myColor: color
        });
        console.log('已发送游戏状态');
    }
});
    socket.on('return_to_room', () => {
        console.log('返回房间');
        gameActive = false;
        readyState = { blue: false, red: false };
        players = [];
        gameState = { players: {}, bullets: [] };
        io.emit('redirect_to_room');
    });
    
    socket.on('disconnect', () => {
        console.log('断开连接:', socket.id);
        players = players.filter(p => p.id !== socket.id);
        if (readyState[color]) readyState[color] = false;
        io.emit('room_state', {
            blueReady: readyState.blue,
            redReady: readyState.red,
            blueConnected: players.some(p => p.color === 'blue'),
            redConnected: players.some(p => p.color === 'red')
        });
    });
});

// 游戏循环（物理更新）
setInterval(() => {
    if (!gameActive) return;
    if (!gameState.players.blue || !gameState.players.red) return;
    
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
                    
                    if (p.hp <= 0) {
                        p.lives--;
                        if (p.lives <= 0) {
                            gameActive = false;
                            const winner = id === 'blue' ? 'red' : 'blue';
                            io.emit('game_over', { winner: winner });
                            return;
                        }
                        p.hp = p.maxHp;
                        if (id === 'blue') {
                            p.x = 100;
                            p.y = 300;
                        } else {
                            p.x = 620;
                            p.y = 300;
                        }
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
        
        // 平台碰撞
        p.grounded = false;
        for (let plat of PLATFORMS) {
            if (p.x < plat.x + plat.width &&
                p.x + p.width > plat.x &&
                p.y + p.height > plat.y &&
                p.y < plat.y + plat.height) {
                
                if (p.velY >= 0) {
                    p.y = plat.y - p.height;
                    p.velY = 0;
                    p.grounded = true;
                } else if (p.velY < 0) {
                    p.y = plat.y + plat.height;
                    p.velY = 0;
                }
            }
        }
        
        // 掉落死亡
        if (p.y > 650) {
            p.lives--;
            if (p.lives <= 0) {
                gameActive = false;
                const winner = id === 'blue' ? 'red' : 'blue';
                io.emit('game_over', { winner: winner });
                return;
            }
            p.hp = p.maxHp;
            if (id === 'blue') {
                p.x = 100;
                p.y = 300;
            } else {
                p.x = 620;
                p.y = 300;
            }
        }
        
        if (p.shootCooldown > 0) p.shootCooldown--;
    }
    
    // 广播更新
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
