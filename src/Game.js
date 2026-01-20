import Player from './Player.js'
import InputHandler from './InputHandler.js'
import Platform from './Platform.js'
import Coin from './Coin.js'
import Enemy from './Enemy.js'
import UserInterface from './UserInterface.js'
import Camera from './Camera.js'
import Projectile from './Projectile.js'
import MainMenu from './menus/MainMenu.js'
import Rectangle from './Rectangle.js'

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
    

    init() {
        // Återställ score (men inte game state - det hanteras av constructor/restart)
        this.score = 0
        this.coinsCollected = 0
        
        // Återställ camera
        this.camera.x = 0
        this.camera.y = 0
        this.camera.targetX = 0
        this.camera.targetY = 0

        this.gameObjects = []
        const box = new Rectangle(this, 300, 399, 90, 100, '#654321')
        box.isBox = true
        box.velocityX = 0
        box.velocityY = 0
        this.gameObjects.push(box)
        

    

        this.player = new Player(this, 50, 240, 50, 50, 'green')

        // Skapa plattformar för nivån (utspridda över hela worldWidth)
        this.platforms = [
            // Marken (hela nivån)
            new Platform(this, 0, this.height - 80, 300, 300, '#654321'),
            new Platform(this, 390, this.height - 80, 1000, 300, '#654321'),

            // Plattformar (utspridda över nivån)
          
        ]

        // Skapa mynt i nivån (utspridda över hela worldWidth)
        this.coins = [
            new Coin(this, 200, this.height - 400, 20, 20, 'gold'),
            // Nya mynt längre bort

        ]
        this.totalCoins = this.coins.length

        // Skapa fiender i nivån (utspridda över hela worldWidth)
        this.enemies = [
        
        ]
        
        // Projektiler
        this.projectiles = []

        // Skapa andra objekt i spelet (valfritt)
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

    update(deltaTime) {
        // Uppdatera menyn om den är aktiv
        if (this.gameState === 'MENU' && this.currentMenu) {
            this.currentMenu.update(deltaTime)
            this.inputHandler.keys.clear() // Rensa keys så de inte läcker till spelet
            return
        }
        
        // Kolla Escape för att öppna menyn under spel
        if (this.inputHandler.keys.has('Escape') && this.gameState === 'PLAYING') {
            this.gameState = 'MENU'
            this.currentMenu = new MainMenu(this)
            return
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
        
        // Uppdatera spelaren
        this.player.update(deltaTime)


        

        this.gameObjects.forEach(obj => {
            if (!obj.isBox) return
            const threshold = 30
            const push = 0.0008
            const px = this.player.x + this.player.width
            const bx = obj.x + obj.width/2
            const dx = bx - px
            const dist = Math.abs(dx)
            if (dist < threshold) {
                const dir = 1
                obj.velocityX = (obj.velocityX || 0) + dir * push * deltaTime
            }
            const max = 0.8
            obj.velocityX = Math.max(-max, Math.min(max, obj.velocityX))
            obj.x += obj.velocityX * deltaTime

        })
        // Antag att spelaren inte står på marken, tills vi hittar en kollision
        this.player.isGrounded = false

        // Kontrollera kollisioner med plattformar
        this.platforms.forEach(platform => {
            this.player.handlePlatformCollision(platform)
        })

        // Kontrollera kollisioner för fiender med plattformar
        this.enemies.forEach(enemy => {
            enemy.isGrounded = false
            
            this.platforms.forEach(platform => {
                enemy.handlePlatformCollision(platform)
            })
            
            // Vänd vid world bounds istället för screen bounds
            enemy.handleScreenBounds(this.worldWidth)
        })
        
        // Kontrollera kollisioner mellan fiender
        this.enemies.forEach((enemy, index) => {
            this.enemies.slice(index + 1).forEach(otherEnemy => {
                enemy.handleEnemyCollision(otherEnemy)
                otherEnemy.handleEnemyCollision(enemy)
            })
        })

        // Kontrollera kollision med mynt
        this.coins.forEach(coin => {
            if (this.player.intersects(coin) && !coin.markedForDeletion) {
                // Plocka upp myntet
                this.score += coin.value
                this.coinsCollected++
                coin.markedForDeletion = true
            }
        })
        
        // Kontrollera kollision med fiender
        this.enemies.forEach(enemy => {
            if (this.player.intersects(enemy) && !enemy.markedForDeletion) {
                // Spelaren tar skada
                this.player.takeDamage(enemy.damage)
            }
        })
        
        // Uppdatera projektiler
        this.projectiles.forEach(projectile => {
            projectile.update(deltaTime)
            
            // Kolla kollision med fiender
            this.enemies.forEach(enemy => {
                if (projectile.intersects(enemy) && !enemy.markedForDeletion) {
                    enemy.markedForDeletion = true
                    projectile.markedForDeletion = true
                    this.score += 50 // Bonuspoäng för att döda fiende
                }
            })
            
            // Kolla kollision med plattformar/världen
            this.platforms.forEach(platform => {
                if (projectile.intersects(platform)) {
                    projectile.markedForDeletion = true
                }
            })
        })
        
        // Ta bort alla objekt markerade för borttagning
        this.coins = this.coins.filter(coin => !coin.markedForDeletion)
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion)
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion)

        // Förhindra att spelaren går utöver world bounds
        if (this.player.x < 0) {
            this.player.x = 0
        }
        if (this.player.x + this.player.width > this.worldWidth) {
            this.player.x = this.worldWidth - this.player.width
        }
        
        // Uppdatera kameran för att följa spelaren
        this.camera.follow(this.player)
        this.camera.update(deltaTime)
        
        // Kolla win condition - alla mynt samlade
        if (this.coinsCollected === this.totalCoins && this.gameState === 'PLAYING') {
            this.gameState = 'WIN'
        }
        
        // Kolla lose condition - spelaren är död
        if (this.player.health <= 0 && this.gameState === 'PLAYING') {
            this.gameState = 'GAME_OVER'
        }
    }

    draw(ctx) {
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