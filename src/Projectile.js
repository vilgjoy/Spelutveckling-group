import GameObject from './GameObject.js'

export default class Projectile extends GameObject {
    constructor(game, x, y, directionX, owner = null, directionY = 0) {
        super(game, x, y, 12, 6)
        this.directionX = directionX // -1 för vänster, 1 för höger
        this.directionY = directionY
        this.speed = 0.5 // pixels per millisekund
        this.startX = x // Spara startposition
        this.maxDistance = 800 // Max en skärm långt
        
        // Identifiera vem som skjuter
        this.owner = owner
        this.color = owner && owner.constructor.name === 'Enemy' ? 'black' : 'orange'
    }
    
    update(deltaTime) {
        // Flytta projektilen
        this.x += this.directionX * this.speed * deltaTime
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
