import GameObject from './GameObject.js'
import SpaceProjectile from './SpaceProjectile.js'
import playerShip from './assets/Shootem Up/SpaceShips_Player-0001.png'
import barrierImage from './assets/Shootem Up/Barrier-0001.png'

export default class SpacePlayer extends GameObject {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height)
        
        // Load spaceship sprite
        this.image = new Image()
        this.image.src = playerShip
        this.imageLoaded = false
        
        this.image.onload = () => {
            this.imageLoaded = true
        }
        
        // Load barrier sprite for shield
        this.barrierImage = new Image()
        this.barrierImage.src = barrierImage
        this.barrierImageLoaded = false
        
        this.barrierImage.onload = () => {
            this.barrierImageLoaded = true
        }
        
        // Barrier sprite info (176x176, 2 rows x 2 columns)
        // We want row 0, column 1 (second item)
        this.barrierSpriteWidth = 176 / 2 // 88px per barrier
        this.barrierSpriteHeight = 176 / 2 // 88px per row
        this.barrierSpriteX = this.barrierSpriteWidth // Column 1
        this.barrierSpriteY = 0 // Row 0
        
        // Load spaceship sprite
        this.image = new Image()
        this.image.src = playerShip
        this.imageLoaded = false
        
        this.image.onload = () => {
            this.imageLoaded = true
        }
        
        // Sprite sheet info (256x256, 4 ships per rad)
        this.spriteWidth = 64 // 256 / 4 = 64
        this.spriteHeight = 64 // Första raden
        this.spriteX = 0 // Första skeppet i raden
        this.spriteY = 0 // Första raden
        
        // Movement (direct velocity, no physics)
        this.velocityX = 0
        this.velocityY = 0
        this.moveSpeed = 0.4 // Pixels per millisecond
        
        // Health system
        this.maxHealth = 3
        this.health = this.maxHealth
        this.invulnerable = false
        this.invulnerableTimer = 0
        this.invulnerableDuration = 1000 // 1 second
        
        // Shield system (from powerup)
        this.shield = false
        this.shieldDuration = 0
        
        // Shooting system
        this.canShoot = true
        this.shootCooldown = 200 // Faster shooting in space
        this.shootCooldownTimer = 0
    }
    
    update(deltaTime) {
        // Direct movement (no acceleration/physics)
        this.velocityX = 0
        this.velocityY = 0
        
        if (this.game.inputHandler.keys.has('ArrowLeft')) {
            this.velocityX = -this.moveSpeed
        }
        if (this.game.inputHandler.keys.has('ArrowRight')) {
            this.velocityX = this.moveSpeed
        }
        if (this.game.inputHandler.keys.has('ArrowUp')) {
            this.velocityY = -this.moveSpeed
        }
        if (this.game.inputHandler.keys.has('ArrowDown')) {
            this.velocityY = this.moveSpeed
        }
        
        // Update position
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
        
        // Keep player within screen bounds (not world bounds)
        if (this.x < 0) this.x = 0
        if (this.x > this.game.width - this.width) {
            this.x = this.game.width - this.width
        }
        if (this.y < 0) this.y = 0
        if (this.y > this.game.height - this.height) {
            this.y = this.game.height - this.height
        }
        
        // Update invulnerability timer
        if (this.invulnerable) {
            this.invulnerableTimer += deltaTime
            if (this.invulnerableTimer >= this.invulnerableDuration) {
                this.invulnerable = false
                this.invulnerableTimer = 0
            }
        }
        
        // Update shield timer
        if (this.shield) {
            this.shieldDuration -= deltaTime
            if (this.shieldDuration <= 0) {
                this.shield = false
                this.shieldDuration = 0
            }
        }
        
        // Update shoot cooldown
        if (!this.canShoot) {
            this.shootCooldownTimer += deltaTime
            if (this.shootCooldownTimer >= this.shootCooldown) {
                this.canShoot = true
                this.shootCooldownTimer = 0
            }
        }
        
        // Shooting
        if (this.game.inputHandler.keys.has(' ') && this.canShoot) {
            this.shoot()
        }
    }
    
    shoot() {
        // Skapa projektil som flyger uppåt (framåt)
        const projectile = new SpaceProjectile(
            this.game,
            this.x + this.width / 2 - 2, // Centrera på skeppet
            this.y, // Från toppen av skeppet
            4, // Smal projektil
            10, // Lång projektil
            0, // Ingen horisontell rörelse
            -0.8 // Flyg uppåt (framåt)
        )
        this.game.projectiles.push(projectile)
        
        this.canShoot = false
        this.shootCooldownTimer = 0
    }
    
    takeDamage(amount) {
        // Shield blocks damage
        if (this.shield) {
            this.shield = false
            this.shieldDuration = 0
            return
        }
        
        if (this.invulnerable) return
        
        this.health -= amount
        this.invulnerable = true
        this.invulnerableTimer = 0
        
        if (this.health <= 0) {
            this.health = 0
            this.game.gameState = 'GAME_OVER'
        }
    }
    
    draw(ctx, camera) {
        if (!this.imageLoaded) {
            // Fallback rectangle if image not loaded
            ctx.fillStyle = 'cyan'
            ctx.fillRect(this.x, this.y, this.width, this.height)
            return
        }
        
        // Flash effect when invulnerable
        if (this.invulnerable) {
            const flash = Math.floor(this.invulnerableTimer / 100) % 2
            if (flash === 0) return // Skip drawing every other frame
        }
        
        // Draw spaceship from sprite sheet (no camera offset - player stays on screen)
        ctx.drawImage(
            this.image,
            this.spriteX, this.spriteY, // Source position i sprite sheet
            this.spriteWidth, this.spriteHeight, // Source size
            this.x, this.y, // Destination position
            this.width, this.height // Destination size
        )
        
        // Draw barrier sprite on top of player when shield is active
        if (this.shield && this.barrierImageLoaded) {
            const barrierSize = this.width * 1.8 // Make barrier larger than player
            ctx.drawImage(
                this.barrierImage,
                this.barrierSpriteX, this.barrierSpriteY,
                this.barrierSpriteWidth, this.barrierSpriteHeight,
                this.x + this.width / 2 - barrierSize / 2,
                this.y + this.height / 2 - barrierSize / 2,
                barrierSize, barrierSize
            )
        }
        
        // Debug hitbox
        if (this.game.debug) {
            ctx.strokeStyle = 'yellow'
            ctx.lineWidth = 2
            ctx.strokeRect(this.x, this.y, this.width, this.height)
        }
    }
}
