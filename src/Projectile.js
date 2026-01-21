import GameObject from './GameObject.js'

export default class Projectile extends GameObject {
    constructor(game, x, y, directionX, directionY = 0, owner = null) {
        super(game, x, y, 12, 6) 
        this.directionY = directionY // -1 för upp, 1 för ner
        this.speed = 0.5 // pixels per millisekund
        this.startY = y
        this.maxDistance = 800 // Max en skärm långt
        this.color = 'green' // Grön projektil
    }
    
    update(deltaTime) {
        // Flytta projektilen
        this.y += this.directionY * this.speed * deltaTime
        
        // Kolla om projektilen har flugit för långt
        const distanceTraveled = Math.hypot(this.x - this.startX, this.y - this.startY)
        if (distanceTraveled > this.maxDistance) {
            this.markedForDeletion = true
        }
    }
    
    draw(ctx, camera = null) {
        // Beräkna screen position
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        // Rita projektilen som en avlång rektangel
        ctx.fillStyle = this.color
        ctx.fillRect(screenX, screenY, this.width, this.height)
    }
}
