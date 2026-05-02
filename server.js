const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 游戏房间状态
let players = [];
let gameState = {
    p1: { hp: 100, maxHp: 100, name: '花见' },
    p2: { hp: 100, maxHp: 100, name: '雪风' },
    currentTurn: 'p1',
    gameActive: true,
    waitingForAction: false
};

io.on('connection', (socket) => {
    console.log('新连接:', socket.id);
    
    // 分配角色
    let role = null;
    if (players.length === 0) {
        role = 'p1';
        players.push({ id: socket.id, role: 'p1' });
        socket.emit('role_assign', { role: 'p1' });
        console.log('分配角色: p1');
    } else if (players.length === 1) {
        role = 'p2';
        players.push({ id: socket.id, role: 'p2' });
        socket.emit('role_assign', { role: 'p2' });
        console.log('分配角色: p2');
        
        // 两个玩家都齐了，广播游戏开始
        io.emit('players_ready', {});
        io.emit('game_state_sync', gameState);
        console.log('两名玩家已就绪，游戏开始！');
    } else {
        // 房间已满
        socket.emit('room_full', { message: '房间已满' });
        return;
    }
    
    // 发送当前游戏状态
    socket.emit('game_state_sync', gameState);
    
    // 处理游戏动作
    socket.on('game_action', (data) => {
        console.log('收到动作:', data);
        
        if (data.type === 'attack') {
            gameState = {
                ...gameState,
                p2: { ...gameState.p2, hp: data.newHp },
                currentTurn: data.currentTurn,
                gameActive: data.gameActive
            };
        } else if (data.type === 'heal') {
            const player = data.player;
            gameState = {
                ...gameState,
                [player]: { ...gameState[player], hp: data.newHp },
                currentTurn: data.currentTurn,
                gameActive: data.gameActive
            };
        } else if (data.type === 'reset') {
            gameState = {
                p1: { hp: 100, maxHp: 100, name: '花见' },
                p2: { hp: 100, maxHp: 100, name: '雪风' },
                currentTurn: 'p1',
                gameActive: true,
                waitingForAction: false
            };
        } else if (data.type === 'game_over') {
            gameState.gameActive = false;
        }
        
        // 广播给所有玩家
        io.emit('opponent_action', { gameState: gameState });
        io.emit('game_state_sync', gameState);
    });
    
    // 断开连接
    socket.on('disconnect', () => {
        console.log('断开连接:', socket.id);
        const index = players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
            const leftPlayer = players[index];
            players.splice(index, 1);
            io.emit('player_disconnected', { role: leftPlayer.role });
            console.log('玩家离开:', leftPlayer.role);
            
            // 重置游戏状态
            gameState = {
                p1: { hp: 100, maxHp: 100, name: '花见' },
                p2: { hp: 100, maxHp: 100, name: '雪风' },
                currentTurn: 'p1',
                gameActive: true,
                waitingForAction: false
            };
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ 服务器运行在端口 ${PORT}`);
});
