import GameObject from './GameObject.js'

export default class Dart extends GameObject {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height)
        this.color = 'purple' // Lila för att skilja från enemies
        
        // Svävning - Dart shooters svävar på samma höjd
        this.hoverY = y // Original höjd för att sväva omkring
        this.hoverSpeed = 0.0005 // Hur snabbt den svävar upp/ner
        this.hoverAmount = 20 // Hur långt upp/ner den svävar
        this.hoverTime = 0
        
        this.damage = 1 // Skada till player
        
        // Shooting system - skjuter konstant
        this.shootCooldown = 1500 // millisekunder mellan skott
        this.shootCooldownTimer = 0
    }

    update(deltaTime) {
        // Svävning upp och ner
        this.hoverTime += deltaTime * this.hoverSpeed
        this.y = this.hoverY + Math.sin(this.hoverTime) * this.hoverAmount
        
        // Uppdatera shoot cooldown
        if (this.shootCooldownTimer > 0) {
            this.shootCooldownTimer -= deltaTime
        } else {
            // Skjut när cooldown är redo
            this.shoot()
        }
    }

    shoot() {
        // Dart shooter skjuter rakt neråt (directionY = 1)
        const projectileX = this.x + this.width / 2
        const projectileY = this.y + this.height / 2
        
        this.game.addEnemyProjectile(projectileX, projectileY, this, 1) // 1 = neråt
        
        // Återställ cooldown
        this.shootCooldownTimer = this.shootCooldown
    }

    draw(ctx, camera = null) {
        // Beräkna screen position (om camera finns)
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        // Rita dart shooter som en lila rektangel
        ctx.fillStyle = this.color
        ctx.fillRect(screenX, screenY, this.width, this.height)
    }
}
