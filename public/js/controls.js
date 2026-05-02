// public/js/controls.js - 方向按钮控制
class Controls {
    constructor() {
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;   // 上平台
        this.moveDown = false; // 下平台
        this.onShoot = null;
        this.onJump = null;
        this.initButtons();
        console.log('Controls 初始化完成（方向按钮模式）');
    }
    
    initButtons() {
        // 左移按钮
        const leftBtn = document.getElementById('btnLeft');
        if (leftBtn) {
            leftBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.moveLeft = true;
                console.log('左移开始');
            });
            leftBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.moveLeft = false;
            });
            leftBtn.addEventListener('mousedown', () => { this.moveLeft = true; });
            leftBtn.addEventListener('mouseup', () => { this.moveLeft = false; });
        }
        
        // 右移按钮
        const rightBtn = document.getElementById('btnRight');
        if (rightBtn) {
            rightBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.moveRight = true;
                console.log('右移开始');
            });
            rightBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.moveRight = false;
            });
            rightBtn.addEventListener('mousedown', () => { this.moveRight = true; });
            rightBtn.addEventListener('mouseup', () => { this.moveRight = false; });
        }
        
        // 上平台按钮
        const upBtn = document.getElementById('btnUp');
        if (upBtn) {
            upBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.moveUp = true;
                console.log('上平台');
                if (this.onJump) this.onJump();  // 复用跳跃逻辑上平台
                setTimeout(() => { this.moveUp = false; }, 100);
            });
            upBtn.addEventListener('mousedown', () => {
                this.moveUp = true;
                if (this.onJump) this.onJump();
                setTimeout(() => { this.moveUp = false; }, 100);
            });
        }
        
        // 下平台按钮
        const downBtn = document.getElementById('btnDown');
        if (downBtn) {
            downBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.moveDown = true;
                console.log('下平台');
                // 下平台：发送向下移动的指令（通过服务器处理）
                if (this.onDown) this.onDown();
                setTimeout(() => { this.moveDown = false; }, 100);
            });
            downBtn.addEventListener('mousedown', () => {
                this.moveDown = true;
                if (this.onDown) this.onDown();
                setTimeout(() => { this.moveDown = false; }, 100);
            });
        }
        
        // 射击按钮
        const shootBtn = document.getElementById('shootBtn');
        if (shootBtn) {
            shootBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log('射击按钮按下');
                if (this.onShoot) this.onShoot();
            });
            shootBtn.addEventListener('mousedown', () => {
                if (this.onShoot) this.onShoot();
            });
        }
        
        // 跳跃按钮（上平台）只做跳跃
        const jumpBtn = document.getElementById('jumpBtn');
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log('跳跃按钮按下');
                if (this.onJump) this.onJump();
            });
            jumpBtn.addEventListener('mousedown', () => {
                if (this.onJump) this.onJump();
            });
        }
    }
    
    getVelocityX() {
        let vel = 0;
        if (this.moveLeft) vel = -4;
        if (this.moveRight) vel = 4;
        return vel;
    }
    
    setOnDown(callback) {
        this.onDown = callback;
    }
}
