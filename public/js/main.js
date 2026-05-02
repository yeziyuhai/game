
// public/js/main.js - 游戏主入口
(function() {
    // 检测当前页面
    if (window.location.pathname === '/game.html') {
        initGame();
    } else {
        initRoom();
    }
})();

function initRoom() {
    const network = new Network();
    const renderer = new Renderer('gameCanvas', PLATFORMS);
    
    let myColor = null;
    let isReady = false;
    
    // DOM 元素
    const blueReadySpan = document.getElementById('blueReady');
    const redReadySpan = document.getElementById('redReady');
    const readyBtn = document.getElementById('readyBtn');
    const startBtn = document.getElementById('startBtn');
    const waitingDiv = document.getElementById('waiting');
    
    network.onRoomState = (state) => {
        blueReadySpan.innerHTML = state.blueReady ? '✓ 已准备' : '未准备';
        blueReadySpan.className = state.blueReady ? 'ready' : 'not-ready';
        redReadySpan.innerHTML = state.redReady ? '✓ 已准备' : '未准备';
        redReadySpan.className = state.redReady ? 'ready' : 'not-ready';
        
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
        window.location.href = '/game.html';
    };
    
    // 获取角色
    const originalRoleAssign = network.socket.on;
    network.socket.on('role_assign', (data) => {
        myColor = data.color;
        waitingDiv.innerHTML = `你是 ${myColor === 'blue' ? '🔵 蓝方' : '🔴 红方'}`;
    });
    
    readyBtn.onclick = () => {
        if (!isReady) {
            isReady = true;
            network.sendReady();
            readyBtn.innerHTML = '✅ 已准备';
            readyBtn.style.background = '#27ae60';
        }
    };
    
    startBtn.onclick = () => {
        if (myColor === 'blue') {
            network.sendStartGame();
        }
    };
    
    // 简单房间渲染
    function renderLoop() {
        renderer.drawRoom();
        requestAnimationFrame(renderLoop);
    }
    renderLoop();
}

function initGame() {
    const network = new Network();
    const controls = new Controls();
    const game = new GameLogic();
    const renderer = new Renderer('gameCanvas', PLATFORMS);
    
    let myColor = null;
    
    // UI 元素
    const blueHpSpan = document.getElementById('blueHp');
    const blueLivesSpan = document.getElementById('blueLives');
    const redHpSpan = document.getElementById('redHp');
    const redLivesSpan = document.getElementById('redLives');
    
    // 更新 UI
    function updateUI() {
        if (game.players.blue) {
            blueHpSpan.innerHTML = game.players.blue.hp;
            blueLivesSpan.innerHTML = game.players.blue.lives;
        }
        if (game.players.red) {
            redHpSpan.innerHTML = game.players.red.hp;
            redLivesSpan.innerHTML = game.players.red.lives;
        }
    }
    
    // 网络回调
    network.onGameState = (state) => {
        game.updateFromServer(state);
        myColor = state.myColor || myColor;
        updateUI();
    };
    
    network.onGameOver = (data) => {
        game.gameActive = false;
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
        document.getElementById('returnBtn').onclick = () => {
            network.sendReturnToRoom();
        };
    };
    
    network.onRedirect = () => {
        window.location.href = '/';
    };
    
    // 控制回调
    controls.onShoot = () => {
        if (game.gameActive) network.sendShoot();
    };
    
    controls.onJump = () => {
        if (game.gameActive) network.sendJump();
    };
    
    // 发送移动
    setInterval(() => {
        if (game.gameActive && myColor) {
            const velX = controls.getVelocityX();
            if (velX !== 0) network.sendMove(velX);
        }
    }, 1000 / 30);
    
    // 渲染循环
    function renderLoop() {
        const state = game.getGameStateForRender();
        renderer.drawGame(state.players, state.bullets);
        requestAnimationFrame(renderLoop);
    }
    renderLoop();
}
