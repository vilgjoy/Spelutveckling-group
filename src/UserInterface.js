export default class UserInterface {
    constructor(game) {
        this.game = game
        this.fontSize = 24
        this.fontFamily = 'Arial'
        this.textColor = '#FFFFFF'
        this.shadowColor = '#000000'
    }

    draw(ctx) {
        ctx.save()
        
        // Konfigurera text
        ctx.font = `${this.fontSize}px ${this.fontFamily}`
        ctx.fillStyle = this.textColor
        ctx.shadowColor = this.shadowColor
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
        ctx.shadowBlur = 3
        
        // Rita score
        const scoreText = `Score: ${this.game.score}`
        ctx.fillText(scoreText, 20, 40)
        
        // Rita coins collected
        const coinsText = `Coins: ${this.game.coinsCollected}`
        ctx.fillText(coinsText, 20, 70)
        
        // Rita health
        const healthText = `Health: ${this.game.player.health}/${this.game.player.maxHealth}`
        ctx.fillText(healthText, 20, 100)
        
        // Rita health bars som hjärtan
        for (let i = 0; i < this.game.player.maxHealth; i++) {
            const heartX = 20 + i * 30
            const heartY = 110
            
            if (i < this.game.player.health) {
                // Fyllt hjärta
                ctx.fillStyle = '#FF0000'
            } else {
                // Tomt hjärta
                ctx.fillStyle = '#333333'
            }
            
            // Rita enkelt hjärta (rektangel för enkelhetens skull)
            ctx.fillRect(heartX, heartY, 20, 20)
        }
        
        ctx.restore()
    }
}
