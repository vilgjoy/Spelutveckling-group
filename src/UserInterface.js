export default class UserInterface {
    constructor(game) {
        this.game = game
        this.fontSize = 24
        this.fontFamily = 'Arial'
        this.textColor = '#FFFFFF'
        this.shadowColor = '#000000'
    }

    draw(ctx) {
        // Rita HUD (score, health, etc)
        this.drawHUD(ctx)
        
        // Rita game state overlays
        if (this.game.gameState === 'GAME_OVER') {
            this.drawGameOver(ctx)
        } else if (this.game.gameState === 'WIN') {
            this.drawWin(ctx)
        }
    }
    
    drawHUD(ctx) {
        ctx.save()
        
        // Konfigurera text
        ctx.font = `${this.fontSize}px ${this.fontFamily}`
        ctx.fillStyle = this.textColor
        ctx.shadowColor = this.shadowColor
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        ctx.shadowBlur = 3
        
        // Rita score
        ctx.fillText(`Score: ${this.game.score}`, 20, 40)
        
        // Rita time played
        const minutes = Math.floor(this.game.playTime / 60000)
        const seconds = Math.floor((this.game.playTime % 60000) / 1000)
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
        ctx.fillText(`Time: ${timeString}`, 20, 70)
        
        // Rita coins collected (bara för platform game)
        if (this.game.totalCoins > 0) {
            ctx.fillText(`Coins: ${this.game.coinsCollected}`, 20, 100)
        }
        
        ctx.restore()
        
        // Rita health bar (egen metod)
        this.drawHealthBar(ctx, 20, this.game.totalCoins > 0 ? 120 : 90)
        
        // Rita heat bar
        this.drawHeatBar(ctx, 20, this.game.totalCoins > 0 ? 145 : 115)
    }
    
    drawHealthBar(ctx, x, y) {
        const barWidth = 200
        const barHeight = 20
        const healthPercent = this.game.player.health / this.game.player.maxHealth
        
        ctx.save()
        
        // Bakgrund (grå)
        ctx.fillStyle = '#333'
        ctx.fillRect(x, y, barWidth, barHeight)
        
        // Nuvarande health (röd till grön gradient, or cyan if shield active)
        const healthWidth = barWidth * healthPercent
        
        // Färg baserat på shield eller health procent
        if (this.game.player.shield) {
            ctx.fillStyle = '#00FFFF' // Cyan when shield active
        } else if (healthPercent > 0.5) {
            ctx.fillStyle = '#4CAF50' // Grön
        } else if (healthPercent > 0.25) {
            ctx.fillStyle = '#FFC107' // Gul
        } else {
            ctx.fillStyle = '#F44336' // Röd
        }
        
        ctx.fillRect(x, y, healthWidth, barHeight)
        
        // Kant
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, barWidth, barHeight)

        ctx.restore()
    }
    
    drawHeatBar(ctx, x, y) {
        const barWidth = 200
        const barHeight = 15
        const player = this.game.player
        
        ctx.save()
        
        // Background (dark gray)
        ctx.fillStyle = '#222'
        ctx.fillRect(x, y, barWidth, barHeight)
        
        // If overheated, show cooldown timer instead
        if (player.overheated) {
            // Flash red background
            const flash = Math.floor(player.overheatTimer / 200) % 2
            if (flash === 0) {
                ctx.fillStyle = '#FF0000'
                ctx.fillRect(x, y, barWidth, barHeight)
            }
            
            // Show cooldown progress
            const cooldownPercent = player.overheatTimer / player.overheatCooldownTime
            ctx.fillStyle = '#666'
            ctx.fillRect(x, y, barWidth * cooldownPercent, barHeight)
        } else {
            // Normal heat bar
            const heatPercent = player.heat / player.maxHeat
            const heatWidth = barWidth * heatPercent
            
            // Color based on heat level
            if (heatPercent < 0.5) {
                ctx.fillStyle = '#FFA500' // Orange
            } else if (heatPercent < 0.8) {
                ctx.fillStyle = '#FF6600' // Dark orange
            } else {
                ctx.fillStyle = '#FF0000' // Red - about to overheat!
            }
            
            ctx.fillRect(x, y, heatWidth, barHeight)
        }
        
        // Border
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, barWidth, barHeight)
        
        // Label
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '12px Arial'
        const label = player.overheated ? 'OVERHEATED!' : 'HEAT'
        ctx.fillText(label, x + barWidth + 10, y + barHeight - 2)
        
        ctx.restore()
    }
    
    drawGameOver(ctx) {
        // Halvgenomskinlig bakgrund
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, this.game.width, this.game.height)
        
        // Game Over text
        ctx.save()
        ctx.fillStyle = '#FF0000'
        ctx.font = 'bold 60px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('GAME OVER', this.game.width / 2, this.game.height / 2 - 50)
        
        // Score
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '30px Arial'
        ctx.fillText(`Final Score: ${this.game.score}`, this.game.width / 2, this.game.height / 2 + 20)
        ctx.fillText(`Coins: ${this.game.coinsCollected}/${this.game.totalCoins}`, this.game.width / 2, this.game.height / 2 + 60)
        
        // Restart instruktion
        ctx.font = '24px Arial'
        ctx.fillText('Press R to Restart', this.game.width / 2, this.game.height / 2 + 120)
        ctx.restore()
    }
    
    drawWin(ctx) {
        // Halvgenomskinlig bakgrund
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'
        ctx.fillRect(0, 0, this.game.width, this.game.height)
        
        // Victory text
        ctx.save()
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 60px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('VICTORY!', this.game.width / 2, this.game.height / 2 - 50)
        
        // Score
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '30px Arial'
        ctx.fillText(`All Coins Collected!`, this.game.width / 2, this.game.height / 2 + 20)
        ctx.fillText(`Final Score: ${this.game.score}`, this.game.width / 2, this.game.height / 2 + 60)
        
        // Restart instruktion
        ctx.font = '24px Arial'
        ctx.fillText('Press R to Play Again', this.game.width / 2, this.game.height / 2 + 120)
        ctx.restore()
    }
}
