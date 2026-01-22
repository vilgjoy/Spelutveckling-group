import Player from './Player.js'
import InputHandler from './InputHandler.js'
import UserInterface from './UserInterface.js'
import Camera from './Camera.js'
import Projectile from './Projectile.js'
import MainMenu from './menus/MainMenu.js'
import Rectangle from './Rectangle.js'
import Spikes from './spike.js'
import Flower from './flower.js'
import Plant from './Plant.js'
import Level1 from './levels/Level1.js'
import Level2 from './levels/Level2.js'

export default class Game {
    constructor(width, height) {
        this.width = width
        this.height = height

    
        // World size (större än skärmen)
        this.worldWidth = width * 3 // 3x bredare
        this.worldHeight = height

        // Fysik
        this.gravity = 0.002 // pixels per millisekund^2
        this.friction = 0.00015 // luftmotstånd för att bromsa fallhastighet

        // Game state
        this.gameState = 'MENU' // MENU, PLAYING, GAME_OVER, WIN
        this.score = 0
        this.coinsCollected = 0
        this.totalCoins = 0 // Sätts när vi skapar coins
        this.currentMenu = null // Nuvarande meny som visas
        this.plant = null
        this.gameStateExtra = null // t.ex. 'WATERING'

        // levels
        this.levels = [Level1, Level2]
        this.currentLevelIndex = 0
        this.currentLevel = null

        this.inputHandler = new InputHandler(this)
        this.ui = new UserInterface(this)

        
        // Camera
        this.camera = new Camera(0, 0, width, height)
        this.camera.setWorldBounds(this.worldWidth, this.worldHeight)
        
        // Initiera spelet
        this.init()
        
        // Skapa och visa huvudmenyn
        this.currentMenu = new MainMenu(this)
    }
    
    // Create and register a pushable box
    spawnBox(x, y, w = 90, h = 100, color = '#654321') {
        const b = new Rectangle(this, x, y, w, h, color)
        b.isBox = true
        b.velocityX = 0
        b.velocityY = 0
        b.stopped = false
        b.stopAfter = null
        b.stopTimer = 0
        b.markedForDeletion = false
        if (!this.gameObjects) this.gameObjects = []
        this.gameObjects.push(b)
        return b
    }
    

    init() {
    
        // Återställ score (men inte game state - det hanteras av constructor/restart)
        this.score = 0
        this.coinsCollected = 0
        this.loadLevel(this.currentLevelIndex)
        
        // Återställ camera
        this.camera.x = 0
        this.camera.y = 0
        this.camera.targetX = 0
        this.camera.targetY = 0

    this.gameObjects = []
    this.spawnBox(300, 399)
    this.spawnBox(490, 399)

        
        
        
        this.player = new Player(this, 50, 240, 50, 50, 'green')

        // Skapa plattformar för nivån (utspridda över hela worldWidth)
        this.platforms = [
            // Marken (hela nivån)
            new Platform(this, 0, this.height - 80, 300, 300, '#654321'),
            new Platform(this, 580, this.height - 80, 1000, 300, '#654321'),
            new Platform(this, 390, 400, 100, 300, '#654321')
            // Plattformar (utspridda över nivån)
          
        ]

        // Skapa mynt i nivån (utspridda över hela worldWidth)
        this.coins = [
            new Coin(this, 200, this.height - 400, 20, 20, 'gold'),
            // Nya mynt längre bort

        ]
        this.totalCoins = this.coins.length


        const flower = new Flower(this, 1500, 350, './src/assets/blomma.png')
        this.gameObjects.push(flower)

        // Skapa fiender i nivån (utspridda över hela worldWidth)
        this.enemies = [
            new Enemy(this, 300, this.height - 20, 90, 50, 'red', 100, 1),
            new Enemy(this, 490, this.height - 20, 90, 50, 'red', 150, 1),
        ]
        
        this.Spikes = [
            new Spikes(this, 700, 389, 28, 10),
            new Spikes(this, 850, 389, 28, 10),
        ]





        // Projektiler
        this.projectiles = []

        // Skapa andra objekt i spelet (valfritt)
        this.gameObjects = []
    }
    
    addProjectile(x, y, directionX) {
        const projectile = new Projectile(this, x, y, directionX)
        this.projectiles.push(projectile)
    }
    
    restart() {
        this.init()
        this.gameState = 'PLAYING'
        this.currentMenu = null
    }

    playerInLevelEndZone() {
        const player = this.player
        const zone = this.levelEndZone

        if (!zone) return false

        return (
            player.x < zone.x + zone.width &&
            player.x + player.width > zone.x &&
            player.y < zone.y + zone.height &&
            player.y + player.height > zone.y
        )
    }

    loadLevel(index) {
        const LevelClass = this.levels[index]
        this.currentLevel = new LevelClass(this)
        this.currentLevel.init()

        const data = this.currentLevel.getData()

        this.platforms = data.platforms
        this.coins = data.coins
        this.enemies = data.enemies
        this.levelEndZone = data.levelEndZone

        this.totalCoins = this.coins.length

        this.player = new Player(
            this,
            data.playerSpawn.x,
            data.playerSpawn.y,
            50, 50, 'green'
        )

        this.plant = null
        this.gameStateExtra = null
    }

    handleMenu(deltaTime) {
        if (this.gameState === 'MENU' && this.currentMenu) {
            this.currentMenu.update(deltaTime)
            this.inputHandler.keys.clear() // Rensa keys så de inte läcker till spelet
            this.gameObjects.filter(o => !o.markedForDeletion)
            return
            return true
        }

        if (this.inputHandler.keys.has('Escape') && this.gameState === 'PLAYING') {
            this.gameState = 'MENU'
            this.currentMenu = new MainMenu(this)
            return true
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
        
        // Uppdatera alla spelobjekt
        this.gameObjects.forEach(obj => obj.update(deltaTime))
        
        // Uppdatera plattformar (även om de är statiska)
        this.platforms.forEach(platform => platform.update(deltaTime))
        
        // Uppdatera mynt
        this.coins.forEach(coin => coin.update(deltaTime))
        
        // Uppdatera fiender
        this.enemies.forEach(enemy => enemy.update(deltaTime))

        this.Spikes.forEach(spike => spike.update(deltaTime))

        // Uppdatera spelaren
        this.player.update(deltaTime)

        


        if (
            (this.inputHandler.keys.has('r') || this.inputHandler.keys.has('R')) &&
            (this.gameState === 'GAME_OVER' || this.gameState === 'WIN')
        ) {
            this.restart()
            return true
        }

        return false
    }

        this.gameObjects.forEach(obj => {
            if (!obj.isBox) return
            const threshold = 10
            const push = 0.0008
            const px = this.player.x + this.player.width
            const bx = obj.x + obj.width/2
            const dx = bx - px
            const dist = Math.abs(dx)
            if (dist < threshold) {
                console.log('marked for deletion', { bx: bx.toFixed(1), px: px.toFixed(1), dist: dist.toFixed(1) })
                obj.markedForDeletion = true
            }
            const max = 0.8
            obj.velocityX = Math.max(-max, Math.min(max, obj.velocityX))
            obj.x += obj.velocityX * deltaTime
    isPlaying() {
        return this.gameState === 'PLAYING'
    }

    updateEntites(deltaTime) {
        this.platforms.forEach(p => p.update(deltaTime))
        this.coins.forEach(c => c.update(deltaTime))
        this.enemies.forEach(e => e.update(deltaTime))
        this.projectiles.forEach(p => p.update(deltaTime))
        this.player.update(deltaTime)
    }

        this.gameObjects.forEach(obj => {
            if (!obj.isBox || obj.stopped) return
            const eps = 1
            const centerX = obj.x + obj.width / 2
            // Convert the desired screen X (center of view) into world coordinates
            const stopScreenX = this.camera.width / 2 // use camera center instead of magic 500
            const worldStopX = this.camera.x + stopScreenX
            if (Math.abs(centerX - worldStopX) <= eps) {
                obj.x = worldStopX - obj.width / 2
                obj.velocityX = 0
                obj.stopped = true
                return
            }
            
        })
        // Antag att spelaren inte står på marken, tills vi hittar en kollision
    handleCollisions() {
        this.player.isGrounded = false

        this.platforms.forEach(p => {
            this.player.handlePlatformCollision(p)
        })

        this.enemies.forEach(enemy => {
            enemy.isGrounded = false

            this.platforms.forEach(p => {
                enemy.handlePlatformCollision(p)
            })

            enemy.handleScreenBounds(this.worldWidth)
        })

        this.Spikes.forEach(spike => {
            spike.isGrounded = false

            this.platforms.forEach(platform => {
                spike.handlePlatformCollision(platform)
            })

            // Vänd vid world bounds istället för screen bounds
            spike.handleScreenBounds(this.worldWidth)
        })

        // Kontrollera kollisioner mellan fiender
        this.enemies.forEach((enemy, index) => {
            this.enemies.slice(index + 1).forEach(otherEnemy => {
                enemy.handleEnemyCollision(otherEnemy)
                otherEnemy.handleEnemyCollision(enemy)
            })
        })



        this.Spikes.forEach((spike, index) => {
            this.Spikes.slice(index + 1).forEach(otherSpike => {
                spike.handleEnemyCollision(otherSpike)
                otherSpike.handleEnemyCollision(spike)
            })
        })
        // Kontrollera kollision med mynt

        this.coins.forEach(coin => {
            if (this.player.intersects(coin) && !coin.markedForDeletion) {
                this.score += coin.value
                this.coinsCollected++
                coin.markedForDeletion = true
            }
        })

        
        
        // Kontrollera kollision med fiender
        this.enemies.forEach(enemy => {
            if (this.player.intersects(enemy)) {
                this.player.takeDamage(1)
            }
        })

        this.Spikes.forEach(spike => {
            if (this.player.intersects(spike) && !spike.markedForDeletion) {
                // Spelaren tar skada
                this.player.takeDamage(spike.damage)
            }
        })

        // Uppdatera projektiler
        this.projectiles.forEach(projectile => {
            this.enemies.forEach(enemy => {
                if (projectile.intersects(enemy)) {
                    enemy.markedForDeletion = true
                    projectile.markedForDeletion = true
                    this.score += 50
                }
            })

            
            
            // Kolla kollision med plattformar/världen
            this.platforms.forEach(platform => {
                if (projectile.intersects(platform)) {
            this.platforms.forEach(p => {
                if (projectile.intersects(p)) {
                    projectile.markedForDeletion = true
                }
            })
        })
        
        // Ta bort alla objekt markerade för borttagning
        this.coins = this.coins.filter(coin => !coin.markedForDeletion)
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion)
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion)
        this.gameObjects = this.gameObjects.filter(obj => !obj.markedForDeletion)
        // Förhindra att spelaren går utöver world bounds
        if (this.player.x < 0) {
            this.player.x = 0
        }
    }

    cleanup() {
        this.coins = this.coins.filter(c => !c.markedForDeletion)
        this.enemies = this.enemies.filter(e => !e.markedForDeletion)
        this.projectiles = this.projectiles.filter(p => !p.markedForDeletion)

        if (this.player.x < 0) this.player.x = 0
        if (this.player.x + this.player.width > this.worldWidth) {
            this.player.x = this.worldWidth - this.player.width
        }
    }

    updateCamera(deltaTime) {
        this.camera.follow(this.player)
        this.camera.update(deltaTime)
    }

    checkGameState() {
        if (this.player.health <= 0 ) {
            this.gameState = 'GAME_OVER'
        }
    }

    canPlant() {
        return (
            this.gameState === 'PLAYING' &&
            !this.plant &&
            this.playerInLevelEndZone() &&
            this.player.isGrounded &&
            (this.inputHandler.keys.has('e') || this.inputHandler.keys.has('E'))
        )
    }

    spawnPlant() {
        this.plant = new Plant(
            this,
            this.levelEndZone.x + this.levelEndZone.width / 2 - 10,
            this.levelEndZone.y
        )
        this.gameStateExtra = 'WATERING'
    }

    updatePlant(deltaTime) {
        this.plant.update(deltaTime)

        if (this.plant.isFullyGrown) {
            this.gameStateExtra = null
            this.currentLevelIndex++

            if (this.currentLevelIndex >= this.levels.length) {
                this.gameState = 'WIN' // eller 'MENU' om du vill återgå till menyn
                return
            }

            this.loadLevel(this.currentLevelIndex)
            return
        }
     }

     handlePlanting(deltaTime) {
        if (!this.plant && this.canPlant()) {
            this.spawnPlant()
        }

        if (this.gameStateExtra === 'WATERING' && this.plant) {
            this.updatePlant(deltaTime)
        }
     }

    update(deltaTime) {
        if (this.handleMenu(deltaTime)) return
        if (!this.isPlaying()) return

        this.handlePlanting(deltaTime)
        this.updateEntites(deltaTime)
        this.handleCollisions()
        this.cleanup()
        this.updateCamera(deltaTime)
        this.checkGameState()

    }

    draw(ctx) {
        // debug tool för end zone
        if (this.levelEndZone) {
            ctx.save()
            ctx.strokeStyle = 'yellow'
            ctx.lineWidth = 3
            ctx.strokeRect(
                this.levelEndZone.x - this.camera.x,
                this.levelEndZone.y - this.camera.y,
                this.levelEndZone.width,
                this.levelEndZone.height
            )
            ctx.restore()
        }


        // Rita alla plattformar med camera offset
        this.platforms.forEach(platform => {
            if (this.camera.isVisible(platform)) {
                platform.draw(ctx, this.camera)
            }
        })
        
        // Rita mynt med camera offset
        this.coins.forEach(coin => {
            if (this.camera.isVisible(coin)) {
                coin.draw(ctx, this.camera)
            }
        })
        
        // Rita fiender med camera offset
        this.enemies.forEach(enemy => {
            if (this.camera.isVisible(enemy)) {
                enemy.draw(ctx, this.camera)
            }
        })

        this.Spikes.forEach(spike => {
            if (this.camera.isVisible(spike)) {
                spike.draw(ctx, this.camera)
            }
        })
        
        // Rita projektiler med camera offset
        this.projectiles.forEach(projectile => {
            if (this.camera.isVisible(projectile)) {
                projectile.draw(ctx, this.camera)
            }
        })
        
        // Rita andra spelobjekt med camera offset
        this.gameObjects.forEach(obj => {
            if (this.camera.isVisible(obj)) {
                obj.draw(ctx, this.camera)
            }
        })

        if (this.playerInLevelEndZone() && !this.plant) {
            ctx.fillStyle = 'white'
            ctx.font = '16px Arial'
            ctx.fillText(
                'Press E',
                this.levelEndZone.x - this.camera.x,
                this.levelEndZone.y - 10 - this.camera.y
            )
        }

        if (this.plant && this.camera.isVisible(this.plant)) {
            this.plant.draw(ctx, this.camera)
        }
        
        // Rita spelaren med camera offset
        this.player.draw(ctx, this.camera)
        
        // Rita UI sist (utan camera offset - alltid synligt)
        this.ui.draw(ctx)
        
        // Rita meny överst om den är aktiv
        if (this.currentMenu) {
            this.currentMenu.draw(ctx)
        }
    }
}