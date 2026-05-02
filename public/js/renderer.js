// public/js/renderer.js - 渲染器（修复版）
class Renderer {
    constructor(canvasId, platforms) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.platforms = platforms || [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
    }
    
    resize() {
        // 获取实际显示尺寸
        const container = this.canvas.parentElement;
        this.canvas.width = container ? container.clientWidth : window.innerWidth;
        this.canvas.height = container ? container.clientHeight : window.innerHeight;
        
        // 计算缩放比例（游戏逻辑基于 750x650）
        this.scaleX = this.canvas.width / 750;
        this.scaleY = this.canvas.height / 650;
        
        console.log('画布尺寸:', this.canvas.width, 'x', this.canvas.height);
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
        
        // 眼睛
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
    }
    
    drawBullet(b) {
        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillRect(b.x, b.y, 8, 5);
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.fillRect(b.x + (b.direction > 0 ? 5 : 0), b.y, 3, 5);
    }
    
    drawGame(players, bullets) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 背景渐变
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, '#1a2a3a');
        grad.addColorStop(1, '#0f1a24');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawPlatforms();
        
        if (bullets) {
            for (let b of bullets) {
                this.drawBullet(b);
            }
        }
        
        if (players) {
            for (let id in players) {
                this.drawPlayer(players[id]);
            }
        }
    }
    
    drawRoom() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 模糊背景
        this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 装饰图案
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = `${Math.floor(this.canvas.width / 15)}px system-ui`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎮', this.canvas.width / 2, this.canvas.height / 2 - 50);
    }
}
