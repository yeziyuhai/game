class Player {
    constructor(x, y, color, name) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.color = color; // 'blue' or 'red'
        this.name = name;
        this.hp = 30;
        this.maxHp = 30;
        this.lives = 3;
        this.velocityX = 0;
        this.velocityY = 0;
        this.grounded = false;
        this.facingRight = (color === 'blue');
        this.shootCooldown = 0;
        this.shootDelay = 30; // 射速（帧数）
        this.weapon = {
            name: '手枪',
            damage: 8,
            knockback: 8,
            bulletSpeed: 8,
            cooldown: 30
        };
    }
    
    update(platforms, gravity = 0.8) {
        // 应用重力
        this.velocityY += gravity;
        
        // 临时移动X
        this.x += this.velocityX;
        
        // X轴碰撞
        for (let platform of platforms) {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y + this.height > platform.y &&
                this.y < platform.y + platform.height) {
                
                if (this.velocityX > 0) {
                    this.x = platform.x - this.width;
                } else if (this.velocityX < 0) {
                    this.x = platform.x + platform.width;
                }
            }
        }
        
        // 临时移动Y
        this.y += this.velocityY;
        this.grounded = false;
        
        // Y轴碰撞
        for (let platform of platforms) {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y + this.height > platform.y &&
                this.y < platform.y + platform.height) {
                
                if (this.velocityY >= 0) {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.grounded = true;
                } else if (this.velocityY < 0) {
                    this.y = platform.y + platform.height;
                    this.velocityY = 0;
                }
            }
        }
        
        // 边界限制（左右不出画布）
        if (this.x < 20) this.x = 20;
        if (this.x + this.width > window.innerWidth - 20) this.x = window.innerWidth - this.width - 20;
        
        // 掉落死亡
        if (this.y > window.innerHeight) {
            this.lives--;
            this.hp = this.maxHp;
            this.respawn();
            return true; // 死亡
        }
        
        // 射击冷却
        if (this.shootCooldown > 0) this.shootCooldown--;
        
        return false;
    }
    
    respawn() {
        this.x = this.color === 'blue' ? 100 : window.innerWidth - 130;
        this.y = 200;
        this.velocityX = 0;
        this.velocityY = 0;
    }
    
    shoot() {
        if (this.shootCooldown > 0) return null;
        this.shootCooldown = this.shootDelay;
        
        return new Bullet(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.facingRight ? 1 : -1,
            this.color,
            this.weapon.damage,
            this.weapon.knockback
        );
    }
    
    draw(ctx) {
        // 绘制角色
        ctx.fillStyle = this.color === 'blue' ? '#4a90d9' : '#e74c3c';
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color === 'blue' ? '#4a90d9' : '#e74c3c';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
        
        // 绘制朝向标记（眼睛）
        ctx.fillStyle = 'white';
        const eyeX = this.facingRight ? this.x + this.width - 8 : this.x + 8;
        ctx.fillRect(eyeX - 4, this.y + 8, 6, 6);
        ctx.fillStyle = 'black';
        ctx.fillRect(eyeX - 3, this.y + 9, 4, 4);
        
        // 绘制血条
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 12, this.width, 6);
        ctx.fillStyle = this.color === 'blue' ? '#4a90d9' : '#e74c3c';
        ctx.fillRect(this.x, this.y - 12, this.width * hpPercent, 6);
    }
}
