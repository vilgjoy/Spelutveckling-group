import Platform from './Platform.js'

export default class HiddenPlatform extends Platform {
    constructor(game, x, y, width, height) {
        super(game, x, y, width, height)
        
        this.isVisible = false 
        this.hasBeenDiscovered = false 
    }

    update(deltaTime) {
        if (this.hasBeenDiscovered) return

        const platCenterX = this.x + this.width / 2
        const platCenterY = this.y + this.height / 2
        
        const playerCenterX = this.game.player.x + this.game.player.width / 2
        const playerCenterY = this.game.player.y + this.game.player.height / 2

        const dx = platCenterX - playerCenterX
        const dy = platCenterY - playerCenterY
        
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 150) {
            this.isVisible = true
            this.hasBeenDiscovered = true
        }
    }

    draw(ctx, camera) {
        if (this.isVisible || this.game.debug) {
            
            if (!this.isVisible && this.game.debug) {
                ctx.globalAlpha = 0.5
            }

            super.draw(ctx, camera)

            ctx.globalAlpha = 1.0
        }
    }
}