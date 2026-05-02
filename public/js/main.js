// public/js/main.js - 游戏主入口（修复版）
(function() {
    console.log('Main.js 启动, 当前路径:', window.location.pathname);
    
    // 检测当前页面
    if (window.location.pathname === '/game.html') {
        console.log('进入游戏对战页面');
        initGame();
    } else {
        console.log('进入房间页面');
        initRoom();
    }
})();
function initGame() {
    console.log('初始化游戏对战...');
    console.log('PLATFORMS:', typeof PLATFORMS, PLATFORMS);
    
    // ... 后面保持原有代码
}
function initRoom() {
    console.log('初始化房间...');
    const network = new Network();
    const renderer = new Renderer('gameCanvas', PLATFORMS);
    
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
    
    // 渲染房间背景
    function renderLoop() {
        if (renderer && renderer.ctx) {
            renderer.drawRoom();
        }
        requestAnimationFrame(renderLoop);
    }
    renderLoop();
}

function initGame() {
    console.log('初始化游戏对战...');
    
    const network = new Network();
    const controls = new Controls();
    const game = new GameLogic();
    const renderer = new Renderer('gameCanvas', PLATFORMS);
    
    let myColor = null;
    let moveInterval = null;
    
    const blueHpSpan = document.getElementById('blueHp');
    const blueLivesSpan = document.getElementById('blueLives');
    const redHpSpan = document.getElementById('redHp');
    const redLivesSpan = document.getElementById('redLives');
    
    function updateUI() {
        if (game.players.blue && blueHpSpan) {
            blueHpSpan.innerHTML = game.players.blue.hp;
            blueLivesSpan.innerHTML = game.players.blue.lives;
        }
        if (game.players.red && redHpSpan) {
            redHpSpan.innerHTML = game.players.red.hp;
            redLivesSpan.innerHTML = game.players.red.lives;
        }
    }
    
    network.onGameState = (state) => {
        game.updateFromServer(state);
        if (state.myColor) myColor = state.myColor;
        updateUI();
        console.log('游戏状态更新, myColor:', myColor);
    };
    
    network.onGameOver = (data) => {
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
            returnBtn.onclick = () => network.sendReturnToRoom();
        }
    };
    
    network.onRedirect = () => {
        if (moveInterval) clearInterval(moveInterval);
        window.location.href = '/';
    };
    
    controls.onShoot = () => {
        if (game.gameActive && myColor) {
            console.log('发送射击');
            network.sendShoot();
        }
    };
    
    controls.onJump = () => {
        if (game.gameActive && myColor) {
            console.log('发送跳跃');
            network.sendJump();
        }
    };
    
    // 定期发送移动指令
    moveInterval = setInterval(() => {
        if (game.gameActive && myColor) {
            const velX = controls.getVelocityX();
            if (velX !== 0) {
                network.sendMove(velX);
            }
        }
    }, 1000 / 30);
    
    function renderLoop() {
        const state = game.getGameStateForRender();
        if (renderer && renderer.ctx) {
            renderer.drawGame(state.players, state.bullets);
        }
        requestAnimationFrame(renderLoop);
    }
    renderLoop();
}
