import GameObject from './GameObject.js'

export default class Coin extends GameObject {
    constructor(game, x, y, size = 20, value = 10) {
        super(game, x, y, size, size)
        this.size = size
        this.color = 'yellow'
        this.value = value // Poäng för detta mynt
        
        // Bob animation
        this.bobOffset = 0
        this.bobSpeed = 0.006 // hur snabbt myntet gungar
        this.bobDistance = 5 // hur långt upp/ner myntet rör sig
    }

    update(deltaTime) {
        // Gungar myntet upp och ner
        this.bobOffset += this.bobSpeed * deltaTime
    }

    draw(ctx, camera = null) {
        // Beräkna screen position (om camera finns)
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        // Beräkna y-position med bob
        const bobY = Math.sin(this.bobOffset) * this.bobDistance
        // Rita myntet som en cirkel
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(screenX + this.size / 2, screenY + this.size / 2 + bobY, this.size / 2, 0, Math.PI * 2)
        ctx.fill()
    }
}
