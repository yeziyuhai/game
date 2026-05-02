// js/game.js - 简化版
const socket = io();

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');

let players = {};
let bullets = [];
let platforms = [];
let myColor = null;
let gameActive = true;

let moveLeft = false, moveRight = false;

// 摇杆元素
let joystickKnob = document.getElementById('joystickKnob');
let joystickArea = document.getElementById('joystickArea');

// 初始化画布
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// 摇杆控制
joystickArea.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    updateJoystick(touch.clientX, touch.clientY);
});

joystickArea.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    updateJoystick(touch.clientX, touch.clientY);
});

joystickArea.addEventListener('touchend', () => {
    moveLeft = false;
    moveRight = false;
    joystickKnob.style.transform = 'translate(0px, 0px)';
});

function updateJoystick(touchX, touchY) {
    const rect = joystickArea.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = touchX - centerX;
    let dy = touchY - centerY;
    const distance = Math.min(Math.hypot(dx, dy), 50);
    const angle = Math.atan2(dy, dx);
    const knobX = Math.cos(angle) * distance;
    const knobY = Math.sin(angle) * distance;
    joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
    
    moveLeft = dx < -20;
    moveRight = dx > 20;
}

// 射击按钮
document.getElementById('shootBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (myColor) socket.emit('shoot');
});

// 跳跃按钮
document.getElementById('jumpBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (myColor) socket.emit('jump');
});

// 接收游戏状态
socket.on('game_state', (state) => {
    players = state.players;
    bullets = state.bullets || [];
    myColor = state.myColor;
    
    // 更新血条
    if (players.blue) {
        document.getElementById('blueHealthFill').style.width = `${(players.blue.hp / players.blue.maxHp) * 100}%`;
        document.getElementById('blueLives').innerHTML = `❤️ x ${players.blue.lives}`;
    }
    if (players.red) {
        document.getElementById('redHealthFill').style.width = `${(players.red.hp / players.red.maxHp) * 100}%`;
        document.getElementById('redLives').innerHTML = `❤️ x ${players.red.lives}`;
    }
});

// 游戏结束
socket.on('game_over', (data) => {
    gameActive = false;
    showResult(data.winner === myColor);
});

// 返回房间
socket.on('redirect_to_room', () => {
    window.location.href = '/';
});

// 结算画面
function showResult(isWinner) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-overlay';
    resultDiv.innerHTML = `
        <div class="result-card">
            <h1>${isWinner ? '🏆 胜利！ 🏆' : '💀 失败... 💀'}</h1>
            <button class="result-btn" id="returnBtn">返回房间</button>
        </div>
    `;
    document.body.appendChild(resultDiv);
    document.getElementById('returnBtn').onclick = () => {
        socket.emit('return_to_room');
    };
}

// 发送移动
setInterval(() => {
    if (players[myColor] && gameActive) {
        const p = players[myColor];
        let velX = 0;
        if (moveLeft) velX = -4;
        if (moveRight) velX = 4;
        socket.emit('move', { velX });
    }
}, 1000 / 30);

// 绘制
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制平台（简单版）
    ctx.fillStyle = '#8B7355';
    const groundY = canvas.height - 60;
    ctx.fillRect(0, groundY, canvas.width, 20);
    
    // 绘制玩家
    for (let id in players) {
        const p = players[id];
        ctx.fillStyle = p.color === 'blue' ? '#4a90d9' : '#e74c3c';
        ctx.fillRect(p.x, p.y, 30, 30);
        
        // 绘制血条
        const hpPercent = p.hp / p.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(p.x, p.y - 12, 30, 6);
        ctx.fillStyle = p.color === 'blue' ? '#4a90d9' : '#e74c3c';
        ctx.fillRect(p.x, p.y - 12, 30 * hpPercent, 6);
    }
    
    // 绘制子弹
    for (let b of bullets) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(b.x, b.y, 8, 5);
    }
}

function renderLoop() {
    draw();
    requestAnimationFrame(renderLoop);
}
renderLoop();
