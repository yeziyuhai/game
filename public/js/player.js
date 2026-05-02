
// public/js/player.js - 玩家类
class Player {
    constructor(color, name, x, y) {
        this.color = color;      // 'blue' or 'red'
        this.name = name;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.hp = 30;
        this.maxHp = 30;
        this.lives = 3;
        this.velX = 0;
        this.velY = 0;
        this.grounded = true;
        this.facingRight = (color === 'blue');
        this.shootCooldown = 0;
    }
    
    // 重置位置
    respawn() {
        this.x = this.color === 'blue' ? 100 : 620;
        this.y = 300;
        this.hp = this.maxHp;
        this.velX = 0;
        this.velY = 0;
    }
    
    // 受到伤害
    takeDamage(amount, knockbackDir) {
        this.hp -= amount;
        this.velX += knockbackDir * 6;
        return this.hp <= 0;
    }
    
    // 更新射击冷却
    updateCooldown() {
        if (this.shootCooldown > 0) this.shootCooldown--;
    }
    
    // 是否可以射击
    canShoot() {
        return this.shootCooldown <= 0;
    }
    
    // 射击
    shoot() {
        if (!this.canShoot()) return null;
        this.shootCooldown = 20;
        return new Bullet(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.facingRight ? 1 : -1,
            this.color,
            8,  // damage
            6   // knockback
        );
    }
}
