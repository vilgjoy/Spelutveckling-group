import GameObject from './GameObject.js'

export default class Dart extends GameObject {
    constructor(game, x, y, width, height, patrolDistance = null) {
        super(game, x, y, width, height)
        this.color = 'red' // Röd
        
        // Fysik
        this.velocityX = 0
        this.velocityY = 0
        this.isGrounded = false
        
        // Patrol AI
        this.startX = x
        this.patrolDistance = patrolDistance
        this.endX = patrolDistance !== null ? x + patrolDistance : null
        this.speed = 0.1
        this.direction = 1 // 1 = höger, -1 = vänster
        
        this.damage = 1 // Hur mycket skada fienden gör
        
        // TODO: Ladda sprites här
        // Använd this.loadSprite() metoden från GameObject
        // Exempel: this.loadSprite('idle', idleSprite, frames, frameInterval)
        
        this.currentAnimation = 'run'
    }

    update(deltaTime) {
        // Applicera luftmotstånd
        if (this.velocityY > 0) {
            this.velocityY -= this.game.friction * deltaTime
            if (this.velocityY < 0) this.velocityY = 0
        }
        
        // Patruller när på marken
        if (this.isGrounded) {
            this.velocityX = this.speed * this.direction
            
            // Om vi har en patrolldistans, vänd vid ändpunkter
            if (this.patrolDistance !== null) {
                if (this.x >= this.endX) {
                    this.direction = -1
                    this.x = this.endX
                } else if (this.x <= this.startX) {
                    this.direction = 1
                    this.x = this.startX
                }
            }
            // Annars fortsätter fienden tills den kolliderar med något
        } else {
            this.velocityX = 0
        }
        
        // Uppdatera position
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
        
        // Uppdatera animation state
        if (this.velocityX !== 0 && this.isGrounded) {
            this.setAnimation('run')
        } else {
            this.setAnimation('idle')
        }
        
        // Uppdatera animation frame
        this.updateAnimation(deltaTime)
    }

    handlePlatformCollision(platform) {
        const collision = this.getCollisionData(platform)
        
        if (collision) {
            if (collision.direction === 'top' && this.velocityY > 0) {
                // Fienden landar på plattformen
                this.y = platform.y - this.height
                this.velocityY = 0
                this.isGrounded = true
            } else if (collision.direction === 'bottom' && this.velocityY < 0) {
                // Fienden träffar huvudet
                this.y = platform.y + platform.height
                this.velocityY = 0
            } else if (collision.direction === 'left' && this.velocityX > 0) {
                // Fienden träffar vägg - vänd
                this.x = platform.x - this.width
                this.direction = -1
            } else if (collision.direction === 'right' && this.velocityX < 0) {
                // Fienden träffar vägg - vänd
                this.x = platform.x + platform.width
                this.direction = 1
            }
        }
    }
    
    handleEnemyCollision(otherEnemy) {
        if (this.intersects(otherEnemy)) {
            this.direction *= -1
        }
    }
    
    handleScreenBounds(gameWidth) {
        // Vänd vid skärmkanter (för fiender utan patrolDistance)
        if (this.patrolDistance === null) {
            if (this.x <= 0) {
                this.x = 0
                this.direction = 1
            } else if (this.x + this.width >= gameWidth) {
                this.x = gameWidth - this.width
                this.direction = -1
            }
        }
    }

    draw(ctx, camera = null) {
        // Beräkna screen position (om camera finns)
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        // Försök rita sprite, annars fallback till rektangel
        const spriteDrawn = this.drawSprite(ctx, camera, this.direction === -1)
        
        if (!spriteDrawn) {
            // Fallback: Rita fienden som en röd rektangel
            ctx.fillStyle = this.color
            ctx.fillRect(screenX, screenY, this.width, this.height)
        }
    }
}
