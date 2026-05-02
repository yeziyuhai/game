class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw(ctx) {
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#A0896C';
        ctx.fillRect(this.x + 2, this.y - 3, this.width - 4, 5);
    }
    
    static createPlatforms(canvasWidth, canvasHeight) {
        const platforms = [];
        const groundY = canvasHeight - 60;
        
        // 地面层
        platforms.push(new Platform(0, groundY, canvasWidth, 20));
        
        // 第一层平台（左右两端）
        platforms.push(new Platform(30, groundY - 80, 150, 15));
        platforms.push(new Platform(canvasWidth - 180, groundY - 80, 150, 15));
        
        // 第二层平台
        platforms.push(new Platform(80, groundY - 160, 120, 15));
        platforms.push(new Platform(canvasWidth - 200, groundY - 160, 120, 15));
        
        // 第三层平台（中央高层）
        platforms.push(new Platform(canvasWidth / 2 - 80, groundY - 240, 160, 15));
        
        // 第四层平台（最高层）
        platforms.push(new Platform(canvasWidth / 2 - 50, groundY - 320, 100, 15));
        
        return platforms;
    }
}
