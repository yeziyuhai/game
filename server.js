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

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// 游戏状态
let players = [];
let readyState = { blue: false, red: false };
let gameActive = false;

// 平台定义
const PLATFORMS = [
    { x: 0, y: 470, width: 400, height: 10 },
    { x: 50, y: 400, width: 120, height: 10 },
    { x: 230, y: 400, width: 120, height: 10 },
    { x: 100, y: 330, width: 100, height: 10 },
    { x: 200, y: 330, width: 100, height: 10 },
    { x: 140, y: 260, width: 120, height: 10 },
    { x: 140, y: 190, width: 120, height: 10 }
];

// 创建玩家数据
function createPlayerData(color, x, y) {
    return {
        color: color,
        name: color === 'blue' ? '蓝方' : '红方',
        x: x,
        y: y,
        width: 28,
        height: 28,
        hp: 30,
        maxHp: 30,
        lives: 3,
        facingRight: color === 'blue'
    };
}

// 游戏状态
let gameState = {
    players: {},
    bullets: []
};

// 重置游戏
function resetGame() {
    gameActive = true;
    gameState = {
        players: {
            blue: createPlayerData('blue', 60, 440),
            red: createPlayerData('red', 310, 440)
        },
        bullets: []
    };
    console.log('游戏重置，蓝方位置:', gameState.players.blue.x, gameState.players.blue.y);
    console.log('红方位置:', gameState.players.red.x, gameState.players.red.y);
}

// 获取玩家当前所在的平台Y坐标
function getCurrentPlatformY(playerY) {
    for (let p of PLATFORMS) {
        if (playerY + 28 >= p.y && playerY + 28 <= p.y + 15) {
            return p.y;
        }
    }
    return 470;
}

// 获取上一层平台的Y坐标
function getUpperPlatformY(currentY) {
    let upperY = null;
    const sortedPlatforms = [...PLATFORMS].sort((a, b) => a.y - b.y);
    for (let p of sortedPlatforms) {
        if (p.y < currentY) {
            upperY = p.y;
        } else {
            break;
        }
    }
    return upperY;
}

// 获取下一层平台的Y坐标
function getLowerPlatformY(currentY) {
    const sortedPlatforms = [...PLATFORMS].sort((a, b) => a.y - b.y);
    for (let p of sortedPlatforms) {
        if (p.y > currentY) {
            return p.y;
        }
    }
    return currentY;
}

io.on('connection', (socket) => {
    console.log('新连接:', socket.id);
    
    // 房间满判断
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
    
    // 玩家准备
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
    
    // 开始游戏
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
            console.log('发送初始游戏状态');
        }
    });
    
    // 移动
    socket.on('move', (data) => {
        if (gameActive && gameState.players[color]) {
            gameState.players[color].x = data.x;
            gameState.players[color].facingRight = data.facingRight;
        }
    });
    
    // 上平台
    socket.on('move_up', (data) => {
        if (gameActive && gameState.players[color]) {
            gameState.players[color].y = data.y;
            console.log('上平台:', color, '新Y:', data.y);
        }
    });
    
    // 下平台
    socket.on('move_down', (data) => {
        if (gameActive && gameState.players[color]) {
            gameState.players[color].y = data.y;
            console.log('下平台:', color, '新Y:', data.y);
        }
    });
    
    // 射击
    socket.on('shoot', (data) => {
        if (gameActive && gameState.players[color]) {
            gameState.bullets.push({
                x: data.x,
                y: data.y,
                direction: data.direction,
                owner: color,
                damage: 8,
                speed: 8
            });
            console.log('射击:', color);
        }
    });
    
    // 请求游戏状态
    socket.on('request_game_state', () => {
        if (gameActive && gameState.players.blue && gameState.players.red) {
            socket.emit('game_state', {
                players: gameState.players,
                bullets: gameState.bullets,
                myColor: color
            });
            console.log('发送游戏状态给:', color);
        }
    });
    
    // 返回房间
    socket.on('return_to_room', () => {
        console.log('返回房间');
        gameActive = false;
        readyState = { blue: false, red: false };
        players = [];
        gameState = { players: {}, bullets: [] };
        io.emit('redirect_to_room');
    });
    
    // 断开连接
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

// 游戏循环 - 更新子弹和碰撞
setInterval(() => {
    if (!gameActive) return;
    if (!gameState.players.blue || !gameState.players.red) return;
    
    // 更新子弹
    for (let i = 0; i < gameState.bullets.length; i++) {
        const b = gameState.bullets[i];
        b.x += b.speed * b.direction;
        
        // 超出边界移除
        if (b.x < -50 || b.x > 450) {
            gameState.bullets.splice(i, 1);
            i--;
            continue;
        }
        
        // 碰撞检测
        for (let id in gameState.players) {
            if (id !== b.owner) {
                const p = gameState.players[id];
                if (b.x < p.x + p.width && b.x + 8 > p.x &&
                    b.y < p.y + p.height && b.y + 4 > p.y) {
                    
                    p.hp -= b.damage;
                    gameState.bullets.splice(i, 1);
                    i--;
                    
                    console.log('击中:', id, '剩余血量:', p.hp);
                    
                    // 死亡判断
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
                        
                        // 重生
                        p.hp = p.maxHp;
                        if (id === 'blue') {
                            p.x = 60;
                            p.y = 440;
                        } else {
                            p.x = 310;
                            p.y = 440;
                        }
                    }
                    break;
                }
            }
        }
    }
    
    // 广播游戏状态
    io.emit('game_state', {
        players: gameState.players,
        bullets: gameState.bullets,
        myColor: null
    });
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ 混乱大枪战服务器运行在端口 ${PORT}`);
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
});
