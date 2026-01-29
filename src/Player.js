import GameObject from './GameObject.js'
import idleSprite from './assets/Sprite-idle.png'
import runSprite from './assets/Sprite-run.png'
import deadSprite from './assets/Sprite-ded.png'
import jumpSprite from './assets/Sprite-jump.png'
import climbSprite from './assets/Sprite-climb.png'
import waterSprite from './assets/Sprite-watering.png'

// nytt
import jumpSfx from './assets/jump.mp3'
import deathSfx from './assets/death.mp3'

export default class Player extends GameObject {
    constructor(game, x, y, width, height, color) {
        super(game, x, y, width, height)
        this.color = color
        
        // hastighet
        this.velocityX = 0
        this.velocityY = 0

        // rörelse
        this.moveSpeed = 0.3
        this.directionX = 0
        this.directionY = 0
        this.lastDirectionX = 1

        // fysik
        this.jumpPower = -0.7 
        this.isGrounded = false 
        this.isClimbing = false
        // nytt
        this.isLanding = false
        this.wasGrounded = false
        this.isWatering = false
        
        this.maxHealth = 1
        this.health = this.maxHealth

        // nytt - sfx
        this.jumpAudio = new Audio(jumpSfx)
        this.deathAudio = new Audio(deathSfx)
        this.jumpAudio.volume = 0.5 // kan ändras
        this.deathAudio.volume = 0.5 // kan ändras


        this.loadSprite('idle', idleSprite, 10, 0, 9, 200)
        this.loadSprite('run', runSprite, 10, 0, 9, 100)
        this.loadSprite('dead', deadSprite, 9, 0, 9, 80)
        this.loadSprite('jump', jumpSprite, 14, 0, 5, 100)
        this.loadSprite('fall', jumpSprite, 14, 6, 8, 100) 
        // nytt
        this.loadSprite('climb', climbSprite, 10, 0, 10, 100) 
        this.loadSprite('land', jumpSprite, 14, 9, 13, 60) 
        this.loadSprite('water', waterSprite, 6, 0, 5, 150)
        
        this.currentAnimation = 'idle'

        this.onAnimationComplete = (animationName) => {
            if (animationName === 'dead') {
                this.game.restart()
            }
            
            // nytt
            if (animationName === 'land') {
                this.isLanding = false
            }

            if (animationName === 'water') {
                this.isWatering = false
                this.setAnimation('idle')
                this.game.plantStartsGrowing()
            }
        }
    }

    // nytt
    startWatering() {
        this.isWatering = true
        this.velocityX = 0
        this.velocityY = 0
        this.setAnimation('water')
    }

    // nytt
    startClimbing() {
        this.isClimbing = true
        this.velocityX = 0
        this.velocityY = 0
        this.setAnimation('climb')
    }

    // nytt
    playSound(audio) {
        if (!this.game.bgMusic.muted) {
            audio.currentTime = 0
            audio.play().catch(e => console.log(e))
        }
    }

    update(deltaTime) {
        this.wasGrounded = this.isGrounded // nytt
        if (this.health <= 0) {
            this.setAnimation('dead')
            this.updateAnimation(deltaTime)
            // väntar på att onAnimationComplete ska trigga restart
            return 
        }

        // nytt
        if (this.isWatering || this.game.gameStateExtra === 'GROWING') {
            this.updateAnimation(deltaTime)
            return
        }

        if (this.isClimbing) {
            this.updateAnimation(deltaTime)
            return
        }

        if (this.game.inputHandler.keys.has('ArrowLeft')) {
            this.velocityX = -this.moveSpeed
            this.directionX = -1
            this.lastDirectionX = -1 
        } else if (this.game.inputHandler.keys.has('ArrowRight')) {
            this.velocityX = this.moveSpeed
            this.directionX = 1
            this.lastDirectionX = 1
        } else {
            this.velocityX = 0
            this.directionX = 0
        }

        if (this.game.inputHandler.keys.has(' ') && this.isGrounded) {
            this.velocityY = this.jumpPower
            this.isGrounded = false
            // nytt
            this.playSound(this.jumpAudio)
        }

        this.velocityY += this.game.gravity * deltaTime
        
        if (this.velocityY > 0) {
            this.velocityY -= this.game.friction * deltaTime
            if (this.velocityY < 0) this.velocityY = 0
        }

        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
        
        // nytt
        if (!this.isGrounded) {
            this.isLanding = false // Om vi faller av en kant ska vi inte landa
            if (this.velocityY < 0) {
                this.setAnimation('jump') // frames 0-5
            } else {
                this.setAnimation('fall') // frames 6-8
            }
        } 
        else if (this.isLanding) {
            this.setAnimation('land') // frames 9-13
        }
        else if (this.velocityX !== 0) {
            this.setAnimation('run')
        } 
        else {
            this.setAnimation('idle')
        }
        
        this.updateAnimation(deltaTime)
    }
    
    // döda spelaren direkt
    takeDamage(amount) {
        // nytt
        if (this.health > 0) {
            this.playSound(this.deathAudio)
        }
        this.health = 0
    }
    
    // nytt, använde mig av en annan version så loading sprites ska funka.
    handlePlatformCollision(platform) {
        const collision = this.getCollisionData(platform)
        if (collision) {
            if (collision.direction === 'top' && this.velocityY > 0) {
                if (!this.wasGrounded) {
                    this.isLanding = true
                    // kanske spela upp ett "duns"-ljud här
                }

                this.y = platform.y - this.height
                this.velocityY = 0
                this.isGrounded = true
            } else if (collision.direction === 'bottom' && this.velocityY < 0) {
                this.y = platform.y + platform.height
                this.velocityY = 0
            } else if (collision.direction === 'left' && this.velocityX > 0) {
                this.x = platform.x - this.width
            } else if (collision.direction === 'right' && this.velocityX < 0) {
                this.x = platform.x + platform.width
            }
        }
    }

    draw(ctx, camera = null) {
        const spriteDrawn = this.drawSprite(ctx, camera, this.lastDirectionX === -1)
        
        if (!spriteDrawn) {
            const screenX = camera ? this.x - camera.x : this.x
            const screenY = camera ? this.y - camera.y : this.y
            ctx.fillStyle = this.color
            ctx.fillRect(screenX, screenY, this.width, this.height)
        }
    }
}