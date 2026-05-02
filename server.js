const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// 游戏状态
let players = [];
let readyState = { blue: false, red: false };
let gameActive = false;

// 玩家类（服务器端简化版）
class ServerPlayer {
    constructor(x, y, color, name) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.color = color;
        this.name = name;
        this.hp = 30;
        this.maxHp = 30;
        this.lives = 3;
        this.velX = 0;
        this.velY = 0;
        this.grounded = true;
        this.facingRight = (color === 'blue');
        this.shootCooldown = 0;
    }
    
    respawn() {
        this.x = this.color === 'blue' ? 100 : 620;
        this.y = 300;
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
    { x: 0, y: 590, width: 750, height: 15 },
    { x: 50, y: 520, width: 130, height: 12 },
    { x: 570, y: 520, width: 130, height: 12 },
    { x: 120, y: 440, width: 110, height: 12 },
    { x: 520, y: 440, width: 110, height: 12 },
    { x: 310, y: 360, width: 130, height: 12 },
    { x: 310, y: 280, width: 130, height: 12 }
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
            } else if (player.velY < 0) {
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
    
    io.emit('room_state', {
        blueReady: readyState.blue,
        redReady: readyState.red,
        blueConnected: players.some(p => p.color === 'blue'),
        redConnected: players.some(p => p.color === 'red')
    });
    
    socket.on('player_ready', () => {
        readyState[color] = true;
        io.emit('room_state', {
            blueReady: readyState.blue,
            redReady: readyState.red,
            blueConnected: true,
            redConnected: true
        });
    });
    
    socket.on('start_game', () => {
        if (readyState.blue && readyState.red && players.length === 2) {
            gameActive = true;
            gameState = {
                players: {
                    blue: new ServerPlayer(100, 300, 'blue', '蓝方'),
                    red: new ServerPlayer(620, 300, 'red', '红方')
                },
                bullets: []
            };
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
            if (gameState.players[color].x < 20) gameState.players[color].x = 20;
            if (gameState.players[color].x + 30 > 730) gameState.players[color].x = 730 - 30;
        }
    });
    
    socket.on('jump', () => {
        if (gameActive && gameState.players[color] && gameState.players[color].grounded) {
            gameState.players[color].velY = -10;
            gameState.players[color].grounded = false;
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
            }
        }
    });
    
    socket.on('return_to_room', () => {
        gameActive = false;
        readyState = { blue: false, red: false };
        players = [];
        socket.emit('redirect_to_room');
    });
    
    socket.on('
