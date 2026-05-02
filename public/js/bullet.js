
// public/js/bullet.js - 子弹类
class Bullet {
    constructor(x, y, direction, owner, damage, knockback) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 5;
        this.direction = direction;
        this.owner = owner;
        this.damage = damage;
        this.knockback = knockback;
        this.speed = 10;
    }
    
    update() {
        this.x += this.speed * this.direction;
        return this.x > -50 && this.x < 800;
    }
}
