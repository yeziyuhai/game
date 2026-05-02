// public/js/controls.js - 触摸/摇杆控制（修复版）
class Controls {
    constructor() {
        this.moveLeft = false;
        this.moveRight = false;
        this.onShoot = null;
        this.onJump = null;
        this.initJoystick();
        this.initButtons();
        console.log('Controls 初始化完成');
    }
    
    initJoystick() {
        const joystickArea = document.getElementById('joystickArea');
        const joystickKnob = document.getElementById('joystickKnob');
        
        if (!joystickArea) {
            console.error('找不到 joystickArea');
            return;
        }
        
        console.log('摇杆初始化');
        
        const updateJoystick = (touch) => {
            const rect = joystickArea.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            let dx = touch.clientX - centerX;
            let dy = touch.clientY - centerY;
            const distance = Math.min(Math.hypot(dx, dy), 45);
            const angle = Math.atan2(dy, dx);
            const knobX = Math.cos(angle) * distance;
            const knobY = Math.sin(angle) * distance;
            
            if (joystickKnob) {
                joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
            }
            
            // 死区判断
            this.moveLeft = dx < -25;
            this.moveRight = dx > 25;
            
            // 调试输出
            if (this.moveLeft || this.moveRight) {
                console.log('移动方向:', this.moveLeft ? '左' : (this.moveRight ? '右' : '停止'));
            }
        };
        
        const resetJoystick = () => {
            this.moveLeft = false;
            this.moveRight = false;
            if (joystickKnob) {
                joystickKnob.style.transform = 'translate(0px, 0px)';
            }
        };
        
        joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches[0]) updateJoystick(e.touches[0]);
        });
        
        joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches[0]) updateJoystick(e.touches[0]);
        });
        
        joystickArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            resetJoystick();
        });
    }
    
    initButtons() {
        const shootBtn = document.getElementById('shootBtn');
        const jumpBtn = document.getElementById('jumpBtn');
        
        if (shootBtn) {
            shootBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log('射击按钮按下');
                if (this.onShoot) this.onShoot();
            });
        } else {
            console.error('找不到 shootBtn');
        }
        
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                console.log('跳跃按钮按下');
                if (this.onJump) this.onJump();
            });
        } else {
            console.error('找不到 jumpBtn');
        }
    }
    
    getVelocityX() {
        let vel = 0;
        if (this.moveLeft) vel = -4;
        if (this.moveRight) vel = 4;
        return vel;
    }
}
