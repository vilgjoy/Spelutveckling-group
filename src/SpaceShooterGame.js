import GameBase from './GameBase.js'
import Background from './Background.js'
import SpacePlayer from './SpacePlayer.js'
import SpaceEnemy from './SpaceEnemy.js'
import PowerUp from './PowerUp.js'
import spaceLayer from './assets/Shootem Up/Background_Space-0001.png'
import nebulaLayer from './assets/Shootem Up/Background_Nebula-0001.png'
import starsLayer from './assets/Shootem Up/Background_Stars-0001.png'
import smallStarsLayer from './assets/Shootem Up/Background_SmallStars-0001.png'

export default class SpaceShooterGame extends GameBase {
    constructor(width, height) {
        super(width, height)
        
        // Space shooter world (scrolls vertically, full width)
        this.worldWidth = width
        this.worldHeight = height * 10 // Mycket längre vertikal värld
        
        // Setup space backgrounds with parallax
        this.setupSpaceBackgrounds()
        
        // Enemy spawning system
        this.enemySpawnTimer = 0
        this.enemySpawnInterval = 1500 // Spawn var 1.5 sekund
        this.minSpawnInterval = 500 // Minsta spawn intervall
        this.spawnIntervalDecrease = 50 // Minska intervall över tid
        
        // Initialize game
        this.init()
    }
    
    setupSpaceBackgrounds() {
        // Parallax layers for space (from far to near)
        // Auto-scroll uppåt (negativ Y) för att simulera flyga framåt
        // Stretch X (inte tiling), tile Y för vertikalt scrollande
        this.backgrounds = [
            // Deep space (darkest, slowest)
            new Background(this, spaceLayer, {
                tiled: true,
                tileWidth: 320,
                tileHeight: 320,
                tileX: false, // Stretch på X
                tileY: true,  // Tile på Y
                scrollSpeed: 0.1,
                autoScrollY: -0.02 // Långsam scroll uppåt
            }),
            // Nebula (colorful clouds)
            new Background(this, nebulaLayer, {
                tiled: true,
                tileWidth: 320,
                tileHeight: 320,
                tileX: false,
                tileY: true,
                scrollSpeed: 0.3,
                autoScrollY: -0.05 // Medium scroll uppåt
            }),
            // Large stars
            new Background(this, starsLayer, {
                tiled: true,
                tileWidth: 320,
                tileHeight: 320,
                tileX: false,
                tileY: true,
                scrollSpeed: 0.5,
                autoScrollY: -0.08 // Snabbare scroll uppåt
            }),
            // Small stars (closest, fastest)
            new Background(this, smallStarsLayer, {
                tiled: true,
                tileWidth: 320,
                tileHeight: 320,
                tileX: false,
                tileY: true,
                scrollSpeed: 0.7,
                autoScrollY: -0.12 // Snabbast scroll uppåt (närmast)
            })
        ]
    }
    
    init() {
        // Reset score
        this.score = 0
        
        // Create space player (centered horizontally, near bottom)
        this.player = new SpacePlayer(
            this,
            this.width / 2 - 25, // Centered
            this.height - 100,    // Near bottom
            50,
            50
        )
        
        // Reset enemies and projectiles
        this.enemies = []
        this.projectiles = []
        this.powerups = []
        
        // Reset enemy spawning
        this.enemySpawnTimer = 0
        this.enemySpawnInterval = 1500
        
        // Camera setup for vertical scrolling space shooter
        this.camera.x = 0
        this.camera.y = 0
        this.camera.setWorldBounds(this.worldWidth, this.worldHeight)
    }
    
    restart() {
        this.gameState = 'PLAYING'
        this.init()
    }
    
    spawnEnemy() {
        // Random X position across screen width
        const x = Math.random() * (this.width - 50)
        const y = -60 // Spawn ovanför skärmen
        
        // Random enemy type (0-11: 3 rader x 4 kolumner)
        const enemyType = Math.floor(Math.random() * 12)
        
        const enemy = new SpaceEnemy(this, x, y, 50, 50, enemyType)
        this.enemies.push(enemy)
    }
    
    tryDropPowerup(enemy) {
        // Check if enemy drops a powerup based on dropChance
        if (Math.random() < enemy.dropChance) {
            // 50/50 chance between health and shield
            const powerupType = Math.random() < 0.5 ? 'health' : 'shield'
            const powerup = new PowerUp(
                this,
                enemy.x + enemy.width / 2 - 15, // Center on enemy
                enemy.y,
                powerupType
            )
            this.powerups.push(powerup)
        }
    }
    
    update(deltaTime) {
        // Uppdatera backgrounds
        this.backgrounds.forEach(bg => bg.update(deltaTime))
        
        // Call parent update for common game logic
        super.update(deltaTime)
        
        // Force camera to stay fixed for space shooter
        // Player movement doesn't affect world scrolling
        this.camera.x = 0
        this.camera.y = 0
        
        // Enemy spawning system (only when playing)
        if (this.gameState === 'PLAYING') {
            this.enemySpawnTimer += deltaTime
            
            if (this.enemySpawnTimer >= this.enemySpawnInterval) {
                this.spawnEnemy()
                this.enemySpawnTimer = 0
                
                // Gradually increase difficulty by reducing spawn interval
                if (this.enemySpawnInterval > this.minSpawnInterval) {
                    this.enemySpawnInterval -= this.spawnIntervalDecrease
                }
            }
        }
    }
    
    draw(ctx) {
        // Rita backgrounds först (längst bak)
        this.backgrounds.forEach(bg => bg.draw(ctx, this.camera))
        
        // Call parent draw for common rendering
        super.draw(ctx)
    }
}
