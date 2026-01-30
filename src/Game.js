import Player from './Player.js'
import InputHandler from './InputHandler.js'
import UserInterface from './UserInterface.js'
import Camera from './Camera.js'
import MainMenu from './menus/MainMenu.js'
import Rectangle from './Rectangle.js'
import Plant from './Plant.js'
import themeSong from './assets/GrowingPainsTheme.mp3'
import Level1 from './levels/Level1.js'
import Level2 from './levels/Level2.js'
import Level3 from './levels/Level3.js'
import TitleScreen from './menus/TitleScreen.js'

export default class Game {
    constructor(width, height) {
        this.width = width
        this.height = height
        
        this.worldWidth = width * 3 
        this.worldHeight = height

        this.gravity = 0.002 
        this.friction = 0.00015 

        this.gameState = 'MENU' 
        this.score = 0
        this.coinsCollected = 0
        this.totalCoins = 0 
        this.currentMenu = null 
        this.plant = null
        this.gameStateExtra = null 

        // nytt
        this.isLevelTransitioning = false
        // nytt
        this.transitionCircleRadius = 0
        // nytt - music
        this.bgMusic = new Audio(themeSong)
        this.bgMusic.loop = true
        this.bgMusic.volume = 0.3

        // nytt
        this.mouse = {
            x: 0,
            y: 0,
            clicked: false
        }
        window.addEventListener('mousedown', (e) => {
            this.mouse.x = e.offsetX || e.clientX
            this.mouse.y = e.offsetY || e.clientY
        })
        window.addEventListener('mousedown', () => {
            this.mouse.clicked = true
        })
        window.addEventListener('mouseup', () => {
            this.mouse.clicked = false
        })

        this.levels = [Level1, Level2, Level3]
        this.currentLevelIndex = 0
        this.currentLevel = null
        
        this.deathZones = []
        this.platforms = []
        this.coins = []
        this.enemies = []
        this.spikes = []      
        this.gameObjects = [] 

        this.inputHandler = new InputHandler(this)
        this.ui = new UserInterface(this)

        this.debug = false
        this.debugKeyPressed = false
        // nytt
        this.muteKeyPressed = false

        this.camera = new Camera(0, 0, width, height)
        this.camera.setWorldBounds(this.worldWidth, this.worldHeight)
        
        this.init()
        
        this.gameHasStarted = false // nytt
        this.currentMenu = new TitleScreen(this)
    }

    spawnBox(x, y, w = 90, h = 100, color = '#654321') {
        const b = new Rectangle(this, x, y, w, h, color)
        b.isBox = true
        b.velocityX = 0
        b.velocityY = 0
        b.stopped = false
        b.markedForDeletion = false
        this.gameObjects.push(b)
        return b
    }

    init() {
        this.gameObjects = [] 
        this.spikes = []
        
        this.score = 0
        this.coinsCollected = 0
        
        this.camera.x = 0
        this.camera.y = 0
        this.camera.targetX = 0
        this.camera.targetY = 0
        
        this.loadLevel(this.currentLevelIndex)
    }

    loadLevel(index) {
        // nytt
        this.isLevelTransitioning = false
        this.transitionCircleRadius = Math.sqrt(this.width**2 + this.height**2)

        const LevelClass = this.levels[index]
        this.currentLevel = new LevelClass(this)
        this.currentLevel.init()

        const data = this.currentLevel.getData()

        this.platforms = data.platforms || []
        this.coins = data.coins || []
        this.enemies = data.enemies || []
        this.levelEndZone = data.levelEndZone
        this.deathZones = data.deathZones || []
        this.spikes = data.spikes || [] 
        
        this.totalCoins = this.coins.length

        this.player = new Player(
            this,
            data.playerSpawn.x,
            data.playerSpawn.y,
            50, 50, 'green'
        )

        if (this.levelEndZone) {
            const plantSize = 64
            this.plant = new Plant(
                this,
                this.levelEndZone.x + this.levelEndZone.width / 2 - (plantSize / 2),
                this.levelEndZone.y + this.levelEndZone.height,
                plantSize
            )
        } else {
            this.plant = null
        }

        this.gameStateExtra = null
    }

    handleDebugInput(){
        if (this.inputHandler.keys.has('d') || this.inputHandler.keys.has('D')) {
            if (!this.debugKeyPressed) {
                this.debug = !this.debug
                this.debugKeyPressed = true
                console.log('Debug mode:', this.debug)
            }
        } else {
            this.debugKeyPressed = false
        }
    }

    // nytt
    handleMusicInput() {
        if (this.inputHandler.keys.has('m') || this.inputHandler.keys.has('M')) {
            if (!this.muteKeyPressed) {
                this.bgMusic.muted = !this.bgMusic.muted // byt mellan tyst/ljud
                this.muteKeyPressed = true
                console.log('Music Muted:', this.bgMusic.muted)
            }
        } else {
            this.muteKeyPressed = false
        }
    }
    
    restart() {
        this.init()
        this.gameHasStarted = true // nytt
        this.gameState = 'PLAYING'
        this.currentMenu = null
        this.bgMusic.currentTime = 0 // nytt

        this.bgMusic.play().catch(error => {
            console.warn('musik kunde inte startas:', error)
        })
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

    handleMenu(deltaTime) {
        if (this.gameState === 'MENU' && this.currentMenu) {
            this.currentMenu.update(deltaTime)
            this.inputHandler.keys.clear() 
            return true
        }

        if (this.inputHandler.keys.has('Escape') && this.gameState === 'PLAYING') {
            this.gameState = 'MENU'
            this.currentMenu = new MainMenu(this)
            return true
        }

        if (
            (this.inputHandler.keys.has('r') || this.inputHandler.keys.has('R')) &&
            (this.gameState === 'WIN')
        ) {
            this.restart()
            return true
        }

        return false
    }

    isPlaying() {
        return this.gameState === 'PLAYING'
    }

    updateEntites(deltaTime) {
        this.platforms.forEach(p => p.update(deltaTime))
        this.coins.forEach(c => c.update(deltaTime))
        this.enemies.forEach(e => e.update(deltaTime))
        this.spikes.forEach(s => s.update(deltaTime))      
        this.gameObjects.forEach(o => o.update(deltaTime)) 
        this.player.update(deltaTime)
    }

    handleCollisions() {
        if (this.isLevelTransitioning) return

        this.player.isGrounded = false

        this.deathZones.forEach(zone => {
            if (this.player.intersects(zone)) {
                this.player.takeDamage(100)
            }
        })

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

        // tog bort this.spikes

        this.coins.forEach(coin => {
            if (this.player.intersects(coin) && !coin.markedForDeletion) {
                this.score += coin.value
                this.coinsCollected++
                coin.markedForDeletion = true
            }
        })

        this.enemies.forEach(enemy => {
            if (this.player.intersects(enemy)) {
                this.player.takeDamage(100)
            }
        })
        
        // tog bort this.spikes

        this.enemies.forEach((enemy, index) => {
            this.enemies.slice(index + 1).forEach(otherEnemy => {
                if (typeof enemy.handleEnemyCollision === 'function') {
                    enemy.handleEnemyCollision(otherEnemy)
                    otherEnemy.handleEnemyCollision(enemy)
                }
            })
        })

        this.gameObjects.forEach(obj => {
            if (!obj.isBox || obj.stopped) return
            const eps = 1
            const centerX = obj.x + obj.width / 2
            const stopScreenX = this.camera.width / 2 
            const worldStopX = this.camera.x + stopScreenX
            
            if (Math.abs(centerX - worldStopX) <= eps) {
                obj.x = worldStopX - obj.width / 2
                obj.velocityX = 0
                obj.stopped = true
            }
        })
    }

    cleanup() {
        this.coins = this.coins.filter(c => !c.markedForDeletion)
        this.enemies = this.enemies.filter(e => !e.markedForDeletion)
        this.spikes = this.spikes.filter(s => !s.markedForDeletion)
        this.gameObjects = this.gameObjects.filter(o => !o.markedForDeletion)

        if (!this.isLevelTransitioning) {
            if (this.player.x < 0) this.player.x = 0
            if (this.player.x + this.player.width > this.worldWidth) {
                this.player.x = this.worldWidth - this.player.width
            }
        }
    }

    updateCamera(deltaTime) {
        this.camera.follow(this.player)
        this.camera.update(deltaTime)
    }

    canWaterPlant() {
        return (
            this.gameState === 'PLAYING' &&
            this.plant && 
            !this.plant.isWatered && // bara om den inte redan växer
            this.playerInLevelEndZone() &&
            this.player.isGrounded &&
            (this.inputHandler.keys.has('e') || this.inputHandler.keys.has('E'))
        )
    }

    // nytt
    startLevelTransition() {
        this.isLevelTransitioning = true
        this.gameStateExtra = null // ta bort watering

        const maxRadius = Math.sqrt(Math.pow(this.width, 2) + Math.pow(this.height, 2)) / 2
        this.transitionCircleRadius = maxRadius

        this.player.startClimbing()
    }

    // nytt
    handleLevelTransition(deltaTime) {
        const plantCenterX = this.plant.x + this.plant.width / 2 -(this.player.width / 2)
        const lerpSpeed = 0.05

        this.player.x += (plantCenterX - this.player.x) * lerpSpeed

        const climbSpeed = 0.15
        this.player.y -= climbSpeed * deltaTime

        const shrinkSpeed = 0.4
        this.transitionCircleRadius -= shrinkSpeed * deltaTime

        // om cirkel helt stängd, då byts level
        if (this.transitionCircleRadius <= 0) {
            this.currentLevelIndex++
            if (this.currentLevelIndex >= this.levels.length) {
                this.gameState = 'WIN'
                return
            }
            this.loadLevel(this.currentLevelIndex)
        }
    }

    updatePlant(deltaTime) {
        if (!this.plant) return

        this.plant.update(deltaTime)

        // ändrat
        if (this.plant.isFullyGrown && !this.isLevelTransitioning) {
            this.startLevelTransition()
        }
     }

     // nytt
     plantStartsGrowing() {
        if (this.plant) {
            this.plant.water()
            this.gameStateExtra = 'GROWING'
        }
     }

     handlePlanting(deltaTime) {
        if (this.canWaterPlant()) {
            this.player.startWatering() // nytt
        }

        this.updatePlant(deltaTime)
     }

    update(deltaTime) {
        if (this.handleMenu(deltaTime)) return
        if (!this.isPlaying()) return

        this.handleDebugInput()
        // nytt
        this.handleMusicInput()

        // nytt
        if (this.isLevelTransitioning) {
            this.handleLevelTransition(deltaTime)
            this.player.update(deltaTime)
            this.updateCamera(deltaTime)
            return 
        }

        this.handlePlanting(deltaTime)
        this.updateEntites(deltaTime)
        this.handleCollisions()
        this.cleanup()
        this.updateCamera(deltaTime)
        // tog bort checkGameState()
    }

    draw(ctx) {
        // nytt - muted text på högra toppen
        if (this.bgMusic.muted) {
            ctx.save()
            ctx.fillStyle = 'red'
            ctx.font = 'bold 20px Arial'
            ctx.fillText('MUTED', this.width - 80, 30)
            ctx.restore()
        }

        // nytt
        if (this.gameHasStarted) {
            if (this.debug && this.levelEndZone) {
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
    
            this.platforms.forEach(platform => {
                if (this.camera.isVisible(platform)) platform.draw(ctx, this.camera)
            })
            
            this.coins.forEach(coin => {
                if (this.camera.isVisible(coin)) coin.draw(ctx, this.camera)
            })
            
            this.enemies.forEach(enemy => {
                if (this.camera.isVisible(enemy)) enemy.draw(ctx, this.camera)
            })
            
            this.spikes.forEach(spike => {
                if (this.camera.isVisible(spike)) spike.draw(ctx, this.camera)
            })
    
            this.gameObjects.forEach(obj => {
                if (this.camera.isVisible(obj)) obj.draw(ctx, this.camera)
            })
    
            if (this.playerInLevelEndZone() && this.plant && !this.plant.isWatered) {
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
            
            this.deathZones.forEach(zone => {
                if (this.camera.isVisible(zone)) zone.draw(ctx, this.camera)
            })
    
            this.player.draw(ctx, this.camera)
    
            if (this.debug) {
                ctx.save()
                ctx.strokeStyle = 'lime' 
                ctx.lineWidth = 1
    
                const drawDebugRect = (obj) => {
                    const sx = obj.x - this.camera.x
                    const sy = obj.y - this.camera.y
                    ctx.strokeRect(sx, sy, obj.width, obj.height)
                }
    
                this.platforms.forEach(drawDebugRect)
                this.enemies.forEach(drawDebugRect)
                this.coins.forEach(drawDebugRect)
                this.deathZones.forEach(drawDebugRect)
                this.spikes.forEach(drawDebugRect) 
                
                ctx.strokeStyle = 'magenta'
                drawDebugRect(this.player)
    
                ctx.restore()
            }
    
            this.ui.draw(ctx)
            
            if (this.currentMenu) {
                this.currentMenu.draw(ctx)
            }
    
            if (this.isLevelTransitioning) {
                const playerScreen = this.camera.worldToScreen(
                    this.player.x + this.player.width / 2,
                    this.player.y + this.player.height / 2
                )
    
                ctx.save()
                ctx.fillStyle = 'black'
                
                ctx.beginPath()
                
                ctx.rect(0, 0, this.width, this.height)
                ctx.arc(
                    playerScreen.x, 
                    playerScreen.y, 
                    Math.max(0, this.transitionCircleRadius), 
                    0, 
                    Math.PI * 2, 
                    true 
                )
                
                ctx.fill()
    
                ctx.restore()
            }
        }

        // nytt
        if (this.gameHasStarted) {
            this.ui.draw(ctx)
        }

        // nytt
        if (this.currentMenu) {
            this.currentMenu.draw(ctx)
        }
    }
}