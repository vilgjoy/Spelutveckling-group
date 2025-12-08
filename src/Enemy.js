import GameObject from './GameObject.js'
import idleSprite from './assets/Pixel Adventure 1/Main Characters/Mask Dude/Idle (32x32).png'
import runSprite from './assets/Pixel Adventure 1/Main Characters/Mask Dude/Run (32x32).png'

export default class Enemy extends GameObject {
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
        
        // Sprite animation system
        this.spriteLoaded = false
        this.animations = {
            idle: { image: new Image(), frames: 11, row: 0 },
            run: { image: new Image(), frames: 12, row: 0 }
        }
        
        // Ladda sprites
        this.animations.idle.image.src = idleSprite
        this.animations.run.image.src = runSprite
        
        // Vänta på att första bilden laddas
        this.animations.idle.image.onload = () => {
            this.spriteLoaded = true
        }
        
        this.currentAnimation = 'run'
        this.frameIndex = 0
        this.frameTimer = 0
        this.frameInterval = 100 // millisekunder per frame
    }

    update(deltaTime) {
        // Applicera gravitation
        this.velocityY += this.game.gravity * deltaTime
        
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
            this.currentAnimation = 'run'
        } else {
            this.currentAnimation = 'idle'
        }
        
        // Uppdatera animation frame
        this.frameTimer += deltaTime
        if (this.frameTimer >= this.frameInterval) {
            const anim = this.animations[this.currentAnimation]
            this.frameIndex = (this.frameIndex + 1) % anim.frames
            this.frameTimer = 0
        }
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
        
        // Rita sprite om den är laddad, annars rita färgad rektangel
        if (this.spriteLoaded) {
            const anim = this.animations[this.currentAnimation]
            const frameWidth = anim.image.width / anim.frames
            const frameHeight = anim.image.height
            
            // Spara context state för flip
            ctx.save()
            
            // Flippa om fienden rör sig åt vänster
            if (this.direction === -1) {
                ctx.translate(screenX + this.width, screenY)
                ctx.scale(-1, 1)
                ctx.drawImage(
                    anim.image,
                    this.frameIndex * frameWidth, // source x
                    0,                            // source y
                    frameWidth,                   // source width
                    frameHeight,                  // source height
                    0,                            // dest x (0 efter flip)
                    0,                            // dest y
                    this.width,                   // dest width
                    this.height                   // dest height
                )
            } else {
                ctx.drawImage(
                    anim.image,
                    this.frameIndex * frameWidth, // source x
                    0,                            // source y
                    frameWidth,                   // source width
                    frameHeight,                  // source height
                    screenX,                      // dest x
                    screenY,                      // dest y
                    this.width,                   // dest width
                    this.height                   // dest height
                )
            }
            
            ctx.restore()
        } else {
            // Fallback: Rita fienden som en röd rektangel
            ctx.fillStyle = this.color
            ctx.fillRect(screenX, screenY, this.width, this.height)
        }
    }
}
