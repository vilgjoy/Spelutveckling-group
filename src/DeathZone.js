import GameObject from "./GameObject";

export default class DeathZone extends GameObject {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height);
        this.color = 'rgba(255, 0, 0, 0.5)'; // debug
    }

    update(deltaTime) {
        // gör inge
    }

    draw(ctx, camera = null) {
        if (this.game.debug) {
            const drawX = this.x - camera.x
            const drawY = this.y - camera.y
    
            ctx.fillStyle = this.color
            ctx.fillRect(drawX, drawY, this.width, this.height)
        }
    }
}