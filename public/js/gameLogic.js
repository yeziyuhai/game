
// public/js/gameLogic.js - 游戏逻辑（纯前端渲染，不依赖后端物理）
class GameLogic {
    constructor() {
        this.players = {};
        this.bullets = [];
        this.myColor = null;
        this.gameActive = true;
    }
    
    updateFromServer(state) {
        if (state.players) {
            // 保留本地玩家的射击冷却
            const localPlayer = this.myColor ? this.players[this.myColor] : null;
            const localCooldown = localPlayer ? localPlayer.shootCooldown : 0;
            
            this.players = state.players;
            this.bullets = state.bullets || [];
            this.myColor = state.myColor;
            
            if (localPlayer && this.players[this.myColor]) {
                this.players[this.myColor].shootCooldown = localCooldown;
            }
        }
    }
    
    getGameStateForRender() {
        return {
            players: this.players,
            bullets: this.bullets
        };
    }
}
