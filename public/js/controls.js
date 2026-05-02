// public/js/controls.js - 触摸/摇杆控制
class Controls {
    constructor() {
        this.moveLeft = false;
        this.moveRight = false;
        this.onShoot = null;
        this.onJump = null;
        this.initJoystick();
        this.initButtons();
    }
    
    initJoystick() {
        const joystickArea = document.getElementById('joystickArea');
        const joystickKnob = document.getElementById('joystickKnob');
        
        if (!joystickArea) return;
        
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
            joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
            this.moveLeft = dx < -20;
            this.moveRight = dx > 20;
        };
        
        joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            updateJoystick(e.touches[0]);
        });
        
        joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            updateJoystick(e.touches[0]);
        });
        
        joystickArea.addEventListener('touchend', () => {
            this.moveLeft = false;
            this.moveRight = false;
            joystickKnob.style.transform = 'translate(0px, 0px)';
        });
    }
    
    initButtons() {
        const shootBtn = document.getElementById('shootBtn');
        const jumpBtn = document.getElementById('jumpBtn');
        
        if (shootBtn) {
            shootBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.onShoot) this.onShoot();
            });
        }
        
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
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
}
