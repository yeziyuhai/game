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
        return this.x > 0 && this.x < window.innerWidth;
    }
    
    draw(ctx) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(this.x + (this.direction > 0 ? this.width - 3 : 0), this.y, 3, this.height);
    }
}
