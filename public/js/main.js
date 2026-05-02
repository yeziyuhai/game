// public/js/main.js - 游戏主入口（完整版，支持上下平台）
(function() {
    console.log('Main.js 启动, 当前路径:', window.location.pathname);
    
    // 检测当前页面
    if (window.location.pathname === '/game.html') {
        initGame();
    } else {
        initRoom();
    }
})();

function initRoom() {
    console.log('初始化房间...');
    const network = new Network();
    
    let myColor = null;
    let isReady = false;
    
    const blueReadySpan = document.getElementById('blueReady');
    const redReadySpan = document.getElementById('redReady');
    const readyBtn = document.getElementById('readyBtn');
    const startBtn = document.getElementById('startBtn');
    const waitingDiv = document.getElementById('waiting');
    
    if (!blueReadySpan || !redReadySpan) {
        console.error('房间UI元素找不到');
        return;
    }
    
    network.onRoomState = (state) => {
        console.log('房间状态更新:', state);
        blueReadySpan.innerHTML = state.blueReady ? '✓ 已准备' : '未准备';
        blueReadySpan.className = state.blueReady ? 'ready-status ready' : 'ready-status not-ready';
        redReadySpan.innerHTML = state.redReady ? '✓ 已准备' : '未准备';
        redReadySpan.className = state.redReady ? 'ready-status ready' : 'ready-status not-ready';
        
        if (state.blueReady && state.redReady) {
            waitingDiv.innerHTML = '两人都已准备！';
            if (myColor === 'blue') startBtn.disabled = false;
        } else {
            startBtn.disabled = true;
            if (!state.blueConnected || !state.redConnected) {
                waitingDiv.innerHTML = '等待第二名玩家...';
            } else {
                waitingDiv.innerHTML = '等待双方准备...';
            }
        }
    };
    
    network.onGameStart = () => {
        console.log('游戏开始，跳转到 game.html');
        window.location.href = '/game.html';
    };
    
    // 获取角色
    network.socket.on('role_assign', (data) => {
        myColor = data.color;
        waitingDiv.innerHTML = `你是 ${myColor === 'blue' ? '🔵 蓝方' : '🔴 红方'}`;
        console.log('角色分配:', myColor);
    });
    
    if (readyBtn) {
        readyBtn.onclick = () => {
            if (!isReady) {
                isReady = true;
                network.sendReady();
                readyBtn.innerHTML = '✅ 已准备';
                readyBtn.style.background = '#27ae60';
                console.log('发送准备');
            }
        };
    }
    
    if (startBtn) {
        startBtn.onclick = () => {
            if (myColor === 'blue') {
                console.log('发送开始游戏');
                network.sendStartGame();
            }
        };
    }
}

function initGame() {
    console.log('初始化游戏对战...');
    
    // 等待 DOM 完全加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => startGame());
    } else {
        startGame();
    }
}

function startGame() {
    console.log('startGame 执行');
    
    // 获取 Canvas
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('找不到 gameCanvas');
        return;
    }
    
    // 获取平台数据
    let platforms = [];
    if (typeof window.PLATFORMS !== 'undefined') {
        platforms = window.PLATFORMS;
    } else {
        // 默认平台数据
        platforms = [
            { x: 0, y: 590, width: 750, height: 15 },
            { x: 50, y: 520, width: 130, height: 12 },
            { x: 570, y: 520, width: 130, height: 12 },
            { x: 120, y: 440, width: 110, height: 12 },
            { x: 520, y: 440, width: 110, height: 12 },
            { x: 310, y: 360, width: 130, height: 12 },
            { x: 310, y: 280, width: 130, height: 12 }
        ];
    }
    
    console.log('平台数据:', platforms.length);
    
    // 初始化各个模块
    const network = new Network();
    const controls = new Controls();
    const game = new GameLogic();
    const renderer = new Renderer('gameCanvas', platforms);
    
    let myColor = null;
    let moveInterval = null;
    
    // UI 元素
    const blueHpSpan = document.getElementById('blueHp');
    const blueLivesSpan = document.getElementById('blueLives');
    const redHpSpan = document.getElementById('redHp');
    const redLivesSpan = document.getElementById('redLives');
    
    console.log('UI元素:', { blueHpSpan, blueLivesSpan, redHpSpan, redLivesSpan });
    
    function updateUI() {
        if (game.players && game.players.blue && blueHpSpan) {
            blueHpSpan.innerHTML = game.players.blue.hp;
            blueLivesSpan.innerHTML = game.players.blue.lives;
        }
        if (game.players && game.players.red && redHpSpan) {
            redHpSpan.innerHTML = game.players.red.hp;
            redLivesSpan.innerHTML = game.players.red.lives;
        }
    }
    
    // 网络回调
    network.onGameState = (state) => {
        console.log('onGameState 被调用, state:', state ? '有数据' : '无数据');
        if (state && state.players) {
            game.updateFromServer(state);
            if (state.myColor) myColor = state.myColor;
            updateUI();
            
            // 调试：打印玩家位置
            if (game.players.blue) {
                console.log('蓝方位置:', game.players.blue.x, game.players.blue.y);
            }
            if (game.players.red) {
                console.log('红方位置:', game.players.red.x, game.players.red.y);
            }
        }
    };
    
    network.onGameStart = () => {
        console.log('游戏开始事件');
        // 不需要跳转，已经在 game.html
    };
    
    network.onGameOver = (data) => {
        console.log('游戏结束，胜者:', data.winner);
        game.gameActive = false;
        if (moveInterval) clearInterval(moveInterval);
        
        const isWinner = (data.winner === myColor);
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-overlay';
        resultDiv.innerHTML = `
            <div class="result-card">
                <h1 style="color: ${isWinner ? '#ffd700' : '#e74c3c'}">${isWinner ? '🏆 胜利！ 🏆' : '💀 失败... 💀'}</h1>
                <button class="result-btn" id="returnBtn">返回房间</button>
            </div>
        `;
        document.body.appendChild(resultDiv);
        const returnBtn = document.getElementById('returnBtn');
        if (returnBtn) {
            returnBtn.onclick = () => {
                network.sendReturnToRoom();
            };
        }
    };
    
    network.onRedirect = () => {
        console.log('重定向到房间');
        if (moveInterval) clearInterval(moveInterval);
        window.location.href = '/';
    };
    
    // 控制回调
    controls.onShoot = () => {
        if (game.gameActive && myColor) {
            console.log('发送射击');
            network.sendShoot();
        }
    };
    
    controls.onJump = () => {
        if (game.gameActive && myColor) {
            console.log('发送跳跃（上平台）');
            network.sendJump();
        }
    };
    
    // 下平台回调
    controls.setOnDown(() => {
        if (game.gameActive && myColor) {
            console.log('发送下平台');
            network.sendMoveDown();
        }
    });
    
    // 定期发送移动指令
    moveInterval = setInterval(() => {
        if (game.gameActive && myColor) {
            const velX = controls.getVelocityX();
            if (velX !== 0) {
                network.sendMove(velX);
            }
        }
    }, 1000 / 30);
    
    // 渲染循环
    function renderLoop() {
        const state = game.getGameStateForRender();
        if (renderer && renderer.ctx) {
            renderer.drawGame(state.players, state.bullets);
        }
        requestAnimationFrame(renderLoop);
    }
    renderLoop();
    
    // 请求一次初始状态
    setTimeout(() => {
        console.log('请求初始游戏状态');
        if (network && network.socket) {
            network.socket.emit('request_game_state');
        }
    }, 1000);
    
    console.log('游戏初始化完成');
}
