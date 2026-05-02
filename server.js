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

// 游戏房间
let players = [];
let gameState = {
    board: Array(15).fill().map(() => Array(15).fill(null)),
    currentPlayer: 'black',
    gameActive: true,
    winLine: []
};

io.on('connection', (socket) => {
    console.log('新连接:', socket.id);
    
    let myColor = null;
    
    // 分配角色
    if (players.length === 0) {
        myColor = 'black';
        players.push({ id: socket.id, color: 'black' });
        socket.emit('role_assign', { color: 'black' });
        console.log('分配角色: 黑棋');
    } else if (players.length === 1) {
        myColor = 'white';
        players.push({ id: socket.id, color: 'white' });
        socket.emit('role_assign', { color: 'white' });
        console.log('分配角色: 白棋');
        
        // 两个玩家都齐了
        io.emit('players_ready', { black: '黑棋', white: '白棋' });
        io.emit('game_sync', gameState);
        console.log('两名玩家已就绪，游戏开始！');
    } else {
        socket.emit('room_full');
        return;
    }
    
    // 发送游戏状态
    socket.emit('game_sync', gameState);
    
    // 处理落子
    socket.on('move', (data) => {
        const { row, col, color } = data;
        
        // 验证是否是当前玩家的回合
        if (gameState.currentPlayer !== color) return;
        if (!gameState.gameActive) return;
        if (gameState.board[row][col] !== null) return;
        
        // 落子
        gameState.board[row][col] = color;
        
        // 广播给另一个玩家
        socket.broadcast.emit('opponent_move', { row, col, color });
        
        // 切换玩家
        gameState.currentPlayer = gameState.currentPlayer === 'black' ? 'white' : 'black';
        
        // 广播状态更新
        io.emit('game_sync', gameState);
    });
    
    // 游戏结束
    socket.on('game_over', (data) => {
        gameState.gameActive = false;
        io.emit('game_sync', gameState);
    });
    
    // 同步游戏（用于胜利等）
    socket.on('sync_game', (data) => {
        gameState = data;
        socket.broadcast.emit('game_sync', gameState);
    });
    
    // 重置游戏
    socket.on('reset_game', () => {
        gameState = {
            board: Array(15).fill().map(() => Array(15).fill(null)),
            currentPlayer: 'black',
            gameActive: true,
            winLine: []
        };
        io.emit('game_sync', gameState);
        console.log('游戏已重置');
    });
    
    // 断开连接
    socket.on('disconnect', () => {
        console.log('断开连接:', socket.id);
        const index = players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
            const leftPlayer = players[index];
            players.splice(index, 1);
            io.emit('player_disconnected', { color: leftPlayer.color });
            console.log('玩家离开:', leftPlayer.color);
            
            // 重置游戏状态
            gameState = {
                board: Array(15).fill().map(() => Array(15).fill(null)),
                currentPlayer: 'black',
                gameActive: true,
                winLine: []
            };
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ 五子棋服务器运行在端口 ${PORT}`);
});
