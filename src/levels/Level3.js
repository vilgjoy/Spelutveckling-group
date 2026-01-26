import Level from './Level.js'
import Platform from '../Platform.js'
import Coin from '../Coin.js'

export default class Level3 extends Level {

    createPlatforms() {
        const h = this.game.height

        // Mark
        this.platforms.push(
            new Platform(this.game, 0, h - 80, 700, 300)
        )

        // Plattformar uppåt (klättring)
        this.platforms.push(
            new Platform(this.game, 200, h - 160, 120, 20),
            new Platform(this.game, 350, h - 240, 120, 20),
            new Platform(this.game, 520, h - 320, 120, 20),
            new Platform(this.game, 700, h - 400, 150, 20)
        )
    }

    createCoins() {
        this.coins.push(
            new Coin(this.game, 230, this.game.height - 200),
            new Coin(this.game, 380, this.game.height - 280),
            new Coin(this.game, 550, this.game.height - 360)
        )
    }

    createEnemies() {
        // Tom för nu – lätt att lägga till senare
    }

    createEndZone() {
        // End zone på sista, högsta plattformen
        this.levelEndZone = {
            x: 720,
            y: this.game.height - 460,
            width: 100,
            height: 60
        }
    }
}