import Game from './Game.js'
import Background from './Background.js'
import SpacePlayer from './SpacePlayer.js'
import spaceLayer from './assets/Shootem Up/Background_Space-0001.png'
import nebulaLayer from './assets/Shootem Up/Background_Nebula-0001.png'
import starsLayer from './assets/Shootem Up/Background_Stars-0001.png'
import smallStarsLayer from './assets/Shootem Up/Background_SmallStars-0001.png'

export default class SpaceShooterGame extends Game {
    constructor(width, height) {
        super(width, height)
        
        // Disable physics for space shooter
        this.gravity = 0
        this.friction = 0
        
        // Space shooter world (scrolls vertically, full width)
        this.worldWidth = width
        this.worldHeight = height * 10 // Mycket längre vertikal värld
        
        // Override backgrounds with space layers
        this.setupSpaceBackgrounds()
        
        // No background objects for now (clouds etc)
        this.backgroundObjects = []
        
        // Initialize space shooter mode
        this.initSpaceShooter()
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
    
    initSpaceShooter() {
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
        
        // Space shooter has no platforms
        this.platforms = []
        
        // Space shooter has no coins (use powerups later)
        this.coins = []
        this.coinsCollected = 0
        this.totalCoins = 0
        
        // No enemies yet
        this.enemies = []
        
        // No projectiles yet
        this.projectiles = []
        
        // Camera setup for vertical scrolling space shooter
        this.camera.x = 0 // No horizontal movement
        this.camera.y = 0
        this.camera.setWorldBounds(this.worldWidth, this.worldHeight)
    }
    
    restart() {
        this.gameState = 'PLAYING'
        this.initSpaceShooter()
    }
    
    update(deltaTime) {
        // Call parent update
        super.update(deltaTime)
        
        // Force camera to stay fixed for space shooter
        // Player movement doesn't affect world scrolling
        this.camera.x = 0
        this.camera.y = 0
        
        // Override win condition - space shooter doesn't use coins
        // Win condition will be based on waves/score/time instead
        if (this.gameState === 'WIN') {
            // Prevent coin-based win from triggering
            if (this.totalCoins === 0) {
                this.gameState = 'PLAYING'
            }
        }
    }
}
