
// public/js/platform.js - 平台类
class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw(ctx) {
        // 平台主体
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 平台顶部装饰
        ctx.fillStyle = '#A0896C';
        ctx.fillRect(this.x + 2, this.y - 3, this.width - 4, 5);
        
        // 平台阴影
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(this.x, this.y + this.height, this.width, 4);
    }
}

// 创建所有平台（静态方法）
Platform.createPlatforms = function(gameWidth, gameHeight) {
    const platforms = [];
    
    // 地面层 (y = 590)
    platforms.push(new Platform(0, 590, gameWidth || 750, 15));
    
    // 第一层平台（左右两端）
    platforms.push(new Platform(50, 520, 130, 12));
    platforms.push(new Platform(570, 520, 130, 12));
    
    // 第二层平台
    platforms.push(new Platform(120, 440, 110, 12));
    platforms.push(new Platform(520, 440, 110, 12));
    
    // 第三层平台（中央）
    platforms.push(new Platform(310, 360, 130, 12));
    
    // 第四层平台（最高层）
    platforms.push(new Platform(310, 280, 130, 12));
    
    return platforms;
};

// 导出（兼容多种环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Platform };
}
