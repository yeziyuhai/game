// shared/constants.js - 前后端共享的游戏常量

const PLATFORMS = [
    { x: 0, y: 590, width: 750, height: 15 },
    { x: 50, y: 520, width: 130, height: 12 },
    { x: 570, y: 520, width: 130, height: 12 },
    { x: 120, y: 440, width: 110, height: 12 },
    { x: 520, y: 440, width: 110, height: 12 },
    { x: 310, y: 360, width: 130, height: 12 },
    { x: 310, y: 280, width: 130, height: 12 }
];

// 浏览器环境
if (typeof window !== 'undefined') {
    window.PLATFORMS = PLATFORMS;
}
// Node.js 环境
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PLATFORMS };
}
