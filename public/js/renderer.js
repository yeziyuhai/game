// public/js/renderer.js - 渲染器（修复版）
class Renderer {
    constructor(canvasId, platforms) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.platforms = platforms || [];
        
        // 游戏逻辑固定尺寸
        this.GAME_WIDTH = 750;
        this.GAME_HEIGHT = 650;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
    }
    
    resize() {
        // 获取实际显示尺寸
        const container = this.canvas.parentElement;
        let displayWidth = container ? container.clientWidth : window.innerWidth;
        let displayHeight = container ? container.clientHeight : window.innerHeight;
        
        // 保持游戏比例，完整显示游戏区域
        const gameAspect = this.GAME_WIDTH / this.GAME_HEIGHT;
        const displayAspect = displayWidth / displayHeight;
        
        if (displayAspect > gameAspect) {
            // 屏幕更宽，以高度为基准
            this.canvas.height = displayHeight;
            this.canvas.width = displayHeight * gameAspect;
        } else {
            // 屏幕更高，以宽度为基准
            this.canvas.width = displayWidth;
            this.canvas.height = displayWidth / gameAspect;
        }
        
        // 居中显示
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '50%';
        this.canvas.style.left = '50%';
        this.canvas.style.transform = 'translate(-50%, -50%)';
        
        // 计算缩放比例
        this.scaleX = this.canvas.width / this.GAME_WIDTH;
        this.scaleY = this.canvas.height / this.GAME_HEIGHT;
        
        console.log('画布尺寸:', this.canvas.width, 'x', this.canvas.height);
        console.log('游戏尺寸:', this.GAME_WIDTH, 'x', this.GAME_HEIGHT);
    }
    
    // 将游戏坐标转换为画布坐标（如果需要）
    gameToCanvas(x, y) {
        return {
            x: x * this.scaleX,
            y: y * this.scaleY
        };
    }
    
    drawPlatforms() {
        if (!this.platforms) return;
        for (let p of this.platforms) {
            this.ctx.fillStyle = '#8B7355';
            this.ctx.fillRect(p.x, p.y, p.width, p.height);
            this.ctx.fillStyle = '#A0896C';
            this.ctx.fillRect(p.x + 2, p.y - 3, p.width - 4, 5);
        }
    }
    
    drawPlayer(p) {
        if (!p) return;
        
        // 身体
        this.ctx.fillStyle = p.color === 'blue' ? '#4a90d9' : '#e74c3c';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color === 'blue' ? '#4a90d9' : '#e74c3c';
        this.ctx.fillRect(p.x, p.y, p.width, p.height);
        this.ctx.shadowBlur = 0;
        
        // 眼睛（方向指示）
        this.ctx.fillStyle = 'white';
        const eyeX = p.facingRight ? p.x + p.width - 8 : p.x + 8;
        this.ctx.fillRect(eyeX - 4, p.y + 8, 6, 6);
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(eyeX - 3, p.y + 9, 4, 4);
        
        // 血条
        const hpPercent = p.hp / p.maxHp;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(p.x, p.y - 12, p.width, 6);
        this.ctx.fillStyle = p.color === 'blue' ? '#4a90d9' : '#e74c3c';
        this.ctx.fillRect(p.x, p.y - 12, p.width * hpPercent, 6);
        
        // 名字标签
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px system-ui';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(p.name, p.x + p.width/2, p.y - 18);
    }
    
    drawBullet(b) {
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillRect(b.x, b.y, 8, 5);
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.fillRect(b.x + (b.direction > 0 ? 5 : 0), b.y, 3, 5);
    }
    
    drawGame(players, bullets) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 背景
        this.ctx.fillStyle = '#1a2a3a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格线（辅助调试）
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.GAME_WIDTH; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.GAME_HEIGHT);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.GAME_WIDTH, i);
            this.ctx.stroke();
        }
        
        this.drawPlatforms();
        
        if (bullets && bullets.length > 0) {
            for (let b of bullets) {
                this.drawBullet(b);
            }
        }
        
        if (players) {
            console.log('渲染玩家:', Object.keys(players));
            for (let id in players) {
                if (players[id]) {
                    console.log('玩家位置:', id, players[id].x, players[id].y);
                    this.drawPlayer(players[id]);
                }
            }
        }
    }
    
    drawRoom() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = `${Math.floor(this.canvas.width / 15)}px system-ui`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎮 混乱大枪战', this.canvas.width / 2, this.canvas.height / 2 - 50);
    }
}
