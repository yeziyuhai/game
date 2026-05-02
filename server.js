const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname)));
app.use('/js', express.static(path.join(__dirname, 'js')));

// 房间状态
let players = [];
let readyState = { p1: false, p2: false };
let gameActive = false;
let gameState = {
    players: {},
    bullets: []
};

// 游戏参数
const GRAVITY = 0.8;
const JUMP_POWER = -12;

// 更新游戏
function updateGame() {
    if (!gameActive) return;
    
    // 更新子弹
    gameState.bullets = gameState.bullets.filter(b => {
        b.x += b.speed * b.direction;
        return b.x > 0 && b.x < 2000;
    });
    
    // 子弹碰撞检测
    for (let i = 0; i < gameState.bullets.length; i++) {
        const bullet = gameState.bullets[i];
        for (let id in gameState.players) {
            if (id !== bullet.owner) {
                const p = gameState.players[id];
                if (bullet.x < p.x + p.width && bullet.x + 8 > p.x &&
                    bullet.y < p.y + p.height && bullet.y + 5 > p.y) {
                    
                    p.hp -= bullet.damage;
                    p.velocityX += bullet.knockback * bullet.direction;
                    gameState.bullets.splice(i, 1);
                    
                    // 死亡判定
                    if (p.hp <= 0) {
                        p.lives--;
                        if (p.lives <= 0) {
                            gameActive = false;
                            io.emit('game_over', { winner: id === 'blue' ? 'red' : 'blue' });
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
    
    // 更新玩家位置
    for (let id in gameState.players) {
        const p = gameState.players[id];
        p.velocityY += GRAVITY;
        p.x += p.velocityX;
        p.y += p.velocityY;
        
        // 简化碰撞（完整版需要平台碰撞）
        if (p.y > 600) {
            p.lives--;
            if (p.lives <= 0) {
                gameActive = false;
                io.emit('game_over', { winner: id === 'blue' ? 'red' : 'blue' });
                return;
            }
            p.hp = p.maxHp;
            p.respawn();
        }
        
        if (p.x < 0) p.x = 0;
        if (p.x + p.width > 1200) p.x = 1200 - p.width;
    }
    
    io.emit('game_state', { players: gameState.players, bullets: gameState.bullets, myColor: null });
}

setInterval(updateGame, 1000 / 60);

io.on('connection', (socket) => {
    console.log('新连接:', socket.id);
    
    if (players.length >= 2) {
        socket.emit('room_full');
        return;
    }
    
    const color = players.length === 0 ? 'blue' : 'red';
    const startX = color === 'blue' ? 100 : 700;
    const name = color === 'blue' ? '蓝方' : '红方';
    
    players.push({ id: socket.id, color, name });
    socket.emit('role_assign', { color });
    
    // 等待界面
    io.emit('room_state', { p1Ready: readyState.p1, p2Ready: readyState.p2, p1Connected: players.length >= 1, p2Connected: players.length >= 2 });
    
    socket.on('player_ready', () => {
        if (color === 'blue') readyState.p1 = true;
        else readyState.p2 = true;
        io.emit('room_state', { p1Ready: readyState.p1, p2Ready: readyState.p2, p1Connected: true, p2Connected: players.length >= 2 });
    });
    
    socket.on('start_game', () => {
        if (readyState.p1 && readyState.p2 && players.length === 2) {
            gameActive = true;
            gameState = {
                players: {
                    blue: new (require('./js/player.js'))(100, 300, 'blue', '蓝方'),
                    red: new (require('./js/player.js'))(700, 300, 'red', '红方')
                },
                bullets: []
            };
            io.emit('game_start');
            io.emit('game_state', { players: gameState.players, bullets: [], myColor: null });
        }
    });
    
    socket.on('move', (data) => {
        if (gameState.players[color]) {
            gameState.players[color].x = data.x;
            gameState.players[color].y = data.y;
            gameState.players[color].velocityX = data.velocityX;
        }
    });
    
    socket.on('shoot', () => {
        if (gameState.players[color]) {
            const bullet = gameState.players[color].shoot();
            if (bullet) gameState.bullets.push(bullet);
        }
    });
    
    socket.on('jump', () => {
        if (gameState.players[color] && gameState.players[color].grounded) {
            gameState.players[color].velocityY = JUMP_POWER;
            gameState.players[color].grounded = false;
        }
    });
    
    socket.on('return_to_room', () => {
        gameActive = false;
        readyState = { p1: false, p2: false };
        socket.emit('redirect_to_room');
    });
    
    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        if (color === 'blue') readyState.p1 = false;
        else readyState.p2 = false;
        io.emit('room_state', { p1Ready: readyState.p
