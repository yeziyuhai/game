// public/js/network.js - 网络通信
class Network {
    constructor() {
        this.socket = io();
        this.myColor = null;
        this.onGameState = null;
        this.onGameStart = null;
        this.onGameOver = null;
        this.onRedirect = null;
        this.onRoomState = null;
        this.initEvents();
    }
    
    initEvents() {
        this.socket.on('role_assign', (data) => {
            this.myColor = data.color;
        });
        
        this.socket.on('game_state', (state) => {
            if (this.onGameState) this.onGameState(state);
        });
        
        this.socket.on('game_start', () => {
            if (this.onGameStart) this.onGameStart();
        });
        
        this.socket.on('game_over', (data) => {
            if (this.onGameOver) this.onGameOver(data);
        });
        
        this.socket.on('redirect_to_room', () => {
            if (this.onRedirect) this.onRedirect();
        });
        
        this.socket.on('room_state', (state) => {
            if (this.onRoomState) this.onRoomState(state);
        });
    }
    
    sendMove(velX) {
        this.socket.emit('move', { velX });
    }
    sendMoveDown() {
    this.socket.emit('move_down');
}
    sendJump() {
        this.socket.emit('jump');
    }
    
    sendShoot() {
        this.socket.emit('shoot');
    }
    
    sendReady() {
        this.socket.emit('player_ready');
    }
    
    sendStartGame() {
        this.socket.emit('start_game');
    }
    
    sendReturnToRoom() {
        this.socket.emit('return_to_room');
    }
}
