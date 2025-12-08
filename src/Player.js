import GameObject from './GameObject.js'
import idleSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Idle (32x32).png'
import runSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Run (32x32).png'
import jumpSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Jump (32x32).png'
import fallSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Fall (32x32).png'

export default class Player extends GameObject {
    constructor(game, x, y, width, height, color) {
        super(game, x, y, width, height)
        this.color = color
        
        // Nuvarande hastighet (pixels per millisekund)
        this.velocityX = 0
        this.velocityY = 0

        // Rörelsehastighet (hur snabbt spelaren accelererar/rör sig)
        this.moveSpeed = 0.3
        this.directionX = 0
        this.directionY = 0

        // Fysik egenskaper
        this.jumpPower = -0.6 // negativ hastighet för att hoppa uppåt
        this.isGrounded = false // om spelaren står på marken
        
        // Health system
        this.maxHealth = 3
        this.health = this.maxHealth
        this.invulnerable = false // Immun mot skada efter att ha blivit träffad
        this.invulnerableTimer = 0
        this.invulnerableDuration = 1000 // 1 sekund i millisekunder
        
        // Shooting system
        this.canShoot = true
        this.shootCooldown = 300 // millisekunder mellan skott
        this.shootCooldownTimer = 0
        this.lastDirectionX = 1 // Kom ihåg senaste riktningen för skjutning
        
        // Sprite animation system
        this.spriteLoaded = false
        this.animations = {
            idle: { image: new Image(), frames: 11, row: 0 },
            run: { image: new Image(), frames: 12, row: 0 },
            jump: { image: new Image(), frames: 1, row: 0 },
            fall: { image: new Image(), frames: 1, row: 0 }
        }
        
        // Ladda sprites
        this.animations.idle.image.src = idleSprite
        this.animations.run.image.src = runSprite
        this.animations.jump.image.src = jumpSprite
        this.animations.fall.image.src = fallSprite
        
        // Vänta på att första bilden laddas
        this.animations.idle.image.onload = () => {
            this.spriteLoaded = true
        }
        
        this.currentAnimation = 'idle'
        this.frameIndex = 0
        this.frameTimer = 0
        this.frameInterval = 100 // millisekunder per frame
    }

    update(deltaTime) {
        // Horisontell rörelse
        if (this.game.inputHandler.keys.has('ArrowLeft')) {
            this.velocityX = -this.moveSpeed
            this.directionX = -1
            this.lastDirectionX = -1 // Spara riktning
        } else if (this.game.inputHandler.keys.has('ArrowRight')) {
            this.velocityX = this.moveSpeed
            this.directionX = 1
            this.lastDirectionX = 1 // Spara riktning
        } else {
            this.velocityX = 0
            this.directionX = 0
        }

        // Hopp - endast om spelaren är på marken
        if (this.game.inputHandler.keys.has(' ') && this.isGrounded) {
            this.velocityY = this.jumpPower
            this.isGrounded = false
        }

        // Applicera gravitation
        this.velocityY += this.game.gravity * deltaTime
        
        // Applicera luftmotstånd (friktion)
        if (this.velocityY > 0) {
            this.velocityY -= this.game.friction * deltaTime
            if (this.velocityY < 0) this.velocityY = 0
        }

        // Sätt directionY baserat på vertikal hastighet för ögonrörelse
        if (this.velocityY < -0.1) {
            this.directionY = -1 // tittar upp när man hoppar
        } else if (this.velocityY > 0.1) {
            this.directionY = 1 // tittar ner när man faller
        } else {
            this.directionY = 0
        }

        // Uppdatera position baserat på hastighet
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
        
        // Uppdatera animation state baserat på rörelse
        if (!this.isGrounded && this.velocityY < 0) {
            this.currentAnimation = 'jump'
        } else if (!this.isGrounded && this.velocityY > 0) {
            this.currentAnimation = 'fall'
        } else if (this.velocityX !== 0) {
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
        
        // Uppdatera invulnerability timer
        if (this.invulnerable) {
            this.invulnerableTimer -= deltaTime
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false
            }
        }
        
        // Uppdatera shoot cooldown
        if (!this.canShoot) {
            this.shootCooldownTimer -= deltaTime
            if (this.shootCooldownTimer <= 0) {
                this.canShoot = true
            }
        }
        
        // Skjut med X-tangenten
        if ((this.game.inputHandler.keys.has('x') || this.game.inputHandler.keys.has('X')) && this.canShoot) {
            this.shoot()
        }
    }
    
    shoot() {
        // Skjut i senaste riktningen spelaren rörde sig
        const projectileX = this.x + this.width / 2
        const projectileY = this.y + this.height / 2
        
        this.game.addProjectile(projectileX, projectileY, this.lastDirectionX)
        
        // Sätt cooldown
        this.canShoot = false
        this.shootCooldownTimer = this.shootCooldown
    }
    
    takeDamage(amount) {
        if (this.invulnerable) return
        
        this.health -= amount
        if (this.health < 0) this.health = 0
        
        // Sätt invulnerability efter att ha tagit skada
        this.invulnerable = true
        this.invulnerableTimer = this.invulnerableDuration
    }
    
    handlePlatformCollision(platform) {
        const collision = this.getCollisionData(platform)
        
        if (collision) {
            if (collision.direction === 'top' && this.velocityY > 0) {
                // Kollision från ovan - spelaren landar på plattformen
                this.y = platform.y - this.height
                this.velocityY = 0
                this.isGrounded = true
            } else if (collision.direction === 'bottom' && this.velocityY < 0) {
                // Kollision från nedan - spelaren träffar huvudet
                this.y = platform.y + platform.height
                this.velocityY = 0
            } else if (collision.direction === 'left' && this.velocityX > 0) {
                // Kollision från vänster
                this.x = platform.x - this.width
            } else if (collision.direction === 'right' && this.velocityX < 0) {
                // Kollision från höger
                this.x = platform.x + platform.width
            }
        }
    }

    draw(ctx, camera = null) {
        // Blinka när spelaren är invulnerable
        if (this.invulnerable) {
            const blinkSpeed = 100 // millisekunder per blink
            if (Math.floor(this.invulnerableTimer / blinkSpeed) % 2 === 0) {
                return // Skippa rendering denna frame för blink-effekt
            }
        }
        
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
            
            // Flippa om spelaren rör sig åt vänster
            if (this.lastDirectionX === -1) {
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
            // Fallback: Rita spelaren som en rektangel
            ctx.fillStyle = this.color
            ctx.fillRect(screenX, screenY, this.width, this.height)

            // Rita ögon
            ctx.fillStyle = 'white'
            ctx.fillRect(screenX + this.width * 0.2, screenY + this.height * 0.2, this.width * 0.2, this.height * 0.2)
            ctx.fillRect(screenX + this.width * 0.6, screenY + this.height * 0.2, this.width * 0.2, this.height * 0.2)
            
            // Rita pupiller
            ctx.fillStyle = 'black'
            ctx.fillRect(
                screenX + this.width * 0.25 + this.directionX * this.width * 0.05, 
                screenY + this.height * 0.25 + this.directionY * this.width * 0.05, 
                this.width * 0.1, 
                this.height * 0.1
            )
            ctx.fillRect(
                screenX + this.width * 0.65 + this.directionX * this.width * 0.05, 
                screenY + this.height * 0.25 + this.directionY * this.width * 0.05, 
                this.width * 0.1, 
                this.height * 0.1
            )
            // rita mun som ett streck
            ctx.strokeStyle = 'black'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(screenX + this.width * 0.3, screenY + this.height * 0.65)
            ctx.lineTo(screenX + this.width * 0.7, screenY + this.height * 0.65)
            ctx.stroke()
        }
    }
}