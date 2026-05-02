
// shared/constants.js - 前后端共享的游戏常量

// 画布配置
const CANVAS = {
    WIDTH: 750,
    HEIGHT: 650
};

// 玩家配置
const PLAYER = {
    WIDTH: 30,
    HEIGHT: 30,
    SPEED: 4,
    JUMP_POWER: -10,
    GRAVITY: 0.8,
    BASE_HP: 30,
    MAX_LIVES: 3
};

// 武器配置
const WEAPONS = {
    PISTOL: {
        name: '手枪',
        damage: 8,
        knockback: 6,
        bulletSpeed: 10,
        cooldown: 20,
        color: '#ffd700'
    }
};

// 平台配置
const PLATFORMS = [
    { x: 0, y: 590, width: 750, height: 15 },           // 地面
    { x: 50, y: 520, width: 130, height: 12 },          // 左一层
    { x: 570, y: 520, width: 130, height: 12 },         // 右一层
    { x: 120, y: 440, width: 110, height: 12 },         // 左二层
    { x: 520, y: 440, width: 110, height: 12 },         // 右二层
    { x: 310, y: 360, width: 130, height: 12 },         // 三层
    { x: 310, y: 280, width: 130, height: 12 }          // 四层
];

// 导出（Node.js 和 浏览器通用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CANVAS, PLAYER, WEAPONS, PLATFORMS };
}
