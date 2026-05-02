// public/js/main.js - 游戏主入口
(function() {
    console.log('Main.js 启动, 当前路径:', window.location.pathname);
    
    if (window.location.pathname === '/game.html') {
        initGame();
    } else {
        initRoom();
    }
})();

function initRoom() {
    console.log('初始化房间...');
    const network = new Network();
    
    // ... 其余房间代码保持不变
}

function initGame() {
    console.log('初始化游戏对战...');
    
    const network = new Network();
    const controls = new Controls();
    const game = new GameLogic();
    const renderer = new Renderer('gameCanvas', window.PLATFORMS || []);
    
    let myColor = null;
    let moveInterval = null;
    
    // UI 元素
    const blueHpSpan = document.getElementById('blueHp');
    const blueLivesSpan = document.getElementById('blueLives');
    const redHpSpan = document.getElementById('redHp');
    const redLivesSpan = document.getElementById('redLives');
    
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
    
    network.onGameState = (state) => {
        console.log('onGameState 被调用');
        game.updateFromServer(state);
        if (state && state.myColor) myColor = state.myColor;
        updateUI();
    };
    
    network.onGameStart = () => {
        console.log('游戏开始！');
        // 不需要跳转，已经在 game.html
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
        network.socket.emit('request_game_state');
    }, 500);
}
