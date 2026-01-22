import GameObject from './GameObject.js'

export default class Flower extends GameObject {
    constructor(game, x, y, imagePath) {
        super(game, x, y, 50, 50)
        this.image = new Image()
        this.image.src = imagePath
    }

    update(deltaTime) {
        // Blomman gör ingenting
    }

    draw(ctx, camera = null) {
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        if (this.image.complete) {
            ctx.drawImage(this.image, screenX, screenY, this.width, this.height)
        }
    }
}