import InputHandler from './InputHandler.js'
import UserInterface from './UserInterface.js'
import Camera from './Camera.js'

export default class GameBase {
    constructor(width, height) {
        this.width = width
        this.height = height
        
        // Game state
        this.gameState = 'PLAYING' // PLAYING, GAME_OVER, WIN
        this.score = 0
        this.debug = false // Debug mode toggle
        
        // Common systems
        this.inputHandler = new InputHandler(this)
        this.ui = new UserInterface(this)
        this.camera = new Camera(0, 0, width, height)
        
        // Common game object arrays
        this.enemies = []
        this.projectiles = []
        this.powerups = []
        
        // Abstract method - må implementeras av subklasser
        if (this.constructor === GameBase) {
            throw new Error("GameBase is abstract and cannot be instantiated directly")
        }
    }
    
    // Abstract methods - måste implementeras av subklasser
    init() {
        throw new Error('init() must be implemented by subclass')
    }
    
    restart() {
        throw new Error('restart() must be implemented by subclass')
    }
    
    // Helper method for powerup drops
    tryDropPowerup(enemy) {
        // This can be overridden by subclasses
        // Default: no powerup drops
    }
    
    // Common update loop
    update(deltaTime) {
        // Toggle debug mode
        if (this.inputHandler.keys.has('p') || this.inputHandler.keys.has('P')) {
            if (!this.debugKeyPressed) {
                this.debug = !this.debug
                this.debugKeyPressed = true
            }
        } else {
            this.debugKeyPressed = false
        }
        
        // Kolla restart input
        if (this.inputHandler.keys.has('r') || this.inputHandler.keys.has('R')) {
            if (this.gameState === 'GAME_OVER' || this.gameState === 'WIN') {
                this.restart()
                return
            }
        }
        
        // Uppdatera bara om spelet är i PLAYING state
        if (this.gameState !== 'PLAYING') return
        
        // Uppdatera spelaren (implementeras av subklass)
        if (this.player) {
            this.player.update(deltaTime)
        }
        
        // Uppdatera fiender
        this.enemies.forEach(enemy => enemy.update(deltaTime))
        
        // Uppdatera projektiler
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime)
            
            // Kolla kollision med fiender
            this.enemies.forEach(enemy => {
                if (projectile.intersects(enemy) && !enemy.markedForDeletion && !projectile.markedForDeletion) {
                    enemy.takeDamage(1)
                    projectile.markedForDeletion = true
                    // Add points and check for powerup drop if enemy dies
                    if (enemy.markedForDeletion && enemy.points) {
                        this.score += enemy.points
                        // Try to drop powerup
                        this.tryDropPowerup(enemy)
                    }
                }
            })
        })
        
        // Uppdatera powerups
        this.powerups.forEach(powerup => powerup.update(deltaTime))
        
        // Kontrollera kollision med fiender
        if (this.player) {
            this.enemies.forEach(enemy => {
                if (this.player.intersects(enemy) && !enemy.markedForDeletion) {
                    // Spelaren tar skada
                    this.player.takeDamage(enemy.damage)
                    // Mark enemy for deletion after hitting player
                    enemy.markedForDeletion = true
                }
            })
            
            // Kontrollera kollision med powerups
            this.powerups.forEach(powerup => {
                if (this.player.intersects(powerup) && !powerup.markedForDeletion) {
                    powerup.apply(this.player)
                }
            })
        }
        
        // Ta bort alla objekt markerade för borttagning
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion)
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion)
        this.powerups = this.powerups.filter(powerup => !powerup.markedForDeletion)
        
        // Uppdatera kameran
        this.camera.update(deltaTime)
        
        // Kolla lose condition - spelaren är död
        if (this.player && this.player.health <= 0 && this.gameState === 'PLAYING') {
            this.gameState = 'GAME_OVER'
        }
    }
    
    // Common draw loop
    draw(ctx) {
        // Rita spelaren (om finns)
        if (this.player) {
            this.player.draw(ctx, this.camera)
        }
        
        // Rita fiender
        this.enemies.forEach(enemy => enemy.draw(ctx, this.camera))
        
        // Rita projektiler
        this.projectiles.forEach(projectile => projectile.draw(ctx, this.camera))
        
        // Rita powerups
        this.powerups.forEach(powerup => powerup.draw(ctx, this.camera))
        
        // Rita UI sist (längst fram)
        this.ui.draw(ctx)
    }
}
