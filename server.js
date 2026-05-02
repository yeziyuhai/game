const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// 房间数据
let players = [];
let ready = { blue: false, red: false };
let gameActive = false;

// 游戏状态
let gameState = {
    players: {},
    bullets: []
};

// 平台定义
const PLATFORMS = [
    { x: 0, y: 470, w: 400, h: 10 }, { x: 50, y: 400, w: 120, h: 10 },
    { x: 230, y: 400, w: 120, h: 10 }, { x: 100, y: 330, w: 100, h: 10 },
    { x: 200, y: 330, w: 100, h: 10 }, { x: 140, y: 260, w: 120, h: 10 },
    { x: 140, y: 190, w: 120, h: 10 }
];

function createPlayer(color, x, y) {
    return { color, name: color==='blue'?'蓝方':'红方', x, y, width:28, height:28, hp:30, maxHp:30, lives:3, facingRight: color==='blue' };
}

function resetGame() {
    gameActive = true;
    gameState = {
        players: {
            blue: createPlayer('blue', 60, 440),
            red: createPlayer('red', 310, 440)
        },
        bullets: []
    };
}

io.on('connection', (socket) => {
    if (players.length >= 2) { socket.emit('room_full'); return; }
    const color = players.length === 0 ? 'blue' : 'red';
    players.push({ id: socket.id, color });
    socket.emit('role_assign', { color });

    io.emit('room_state', {
        blueReady: ready.blue, redReady: ready.red,
        blueConnected: players.some(p=>p.color==='blue'),
        redConnected: players.some(p=>p.color==='red')
    });

    socket.on('player_ready', () => {
        ready[color] = true;
        io.emit('room_state', {
            blueReady: ready.blue, redReady: ready.red,
            blueConnected: true, redConnected: true
        });
    });

    socket.on('start_game', () => {
        if (ready.blue && ready.red && players.length === 2) {
            resetGame();
            io.emit('game_start');
            io.emit('game_state', { players: gameState.players, bullets: [] });
        }
    });

    socket.on('move', (data) => {
        if (gameActive && gameState.players[color]) {
            gameState.players[color].x = data.x;
            gameState.players[color].facingRight = data.facingRight;
        }
    });

    socket.on('move_up', (data) => {
        if (gameActive && gameState.players[color]) {
            gameState.players[color].y = data.y;
        }
    });

    socket.on('move_down', (data) => {
        if (gameActive && gameState.players[color]) {
            gameState.players[color].y = data.y;
        }
    });

    socket.on('shoot', (data) => {
        if (gameActive && gameState.players[color]) {
            gameState.bullets.push({
                x: data.x, y: data.y, dir: data.dir,
                owner: color, damage: 8, speed: 8
            });
        }
    });

    socket.on('return_to_room', () => {
        gameActive = false;
        ready = { blue: false, red: false };
        players = [];
        io.emit('redirect_to_room');
    });

    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        ready[color] = false;
        io.emit('room_state', {
            blueReady: ready.blue, redReady: ready.red,
            blueConnected: players.some(p=>p.color==='blue'),
            redConnected: players.some(p=>p.color==='red')
        });
    });
});

// 游戏循环（子弹更新）
setInterval(() => {
    if (!gameActive) return;
    for (let i=0; i<gameState.bullets.length; i++) {
        let b = gameState.bullets[i];
        b.x += b.speed * b.dir;
        if (b.x < -50 || b.x > 450) { gameState.bullets.splice(i,1); i--; continue; }
        for (let id in gameState.players) {
            if (id !== b.owner) {
                let p = gameState.players[id];
                if (b.x < p.x+p.width && b.x+8 > p.x && b.y < p.y+p.height && b.y+4 > p.y) {
                    p.hp -= b.damage;
                    gameState.bullets.splice(i,1); i--;
                    if (p.hp <= 0) {
                        p.lives--;
                        if (p.lives <= 0) {
                            gameActive = false;
                            io.emit('game_over', { winner: id==='blue'?'red':'blue' });
                            return;
                        }
                        p.hp = p.maxHp;
                        p.x = id==='blue' ? 60 : 310;
                        p.y = 440;
                    }
                    break;
                }
            }
        }
    }
    io.emit('game_state', { players: gameState.players, bullets: gameState.bullets });
}, 1000/60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`✅ 服务器运行在端口 ${PORT}`));
