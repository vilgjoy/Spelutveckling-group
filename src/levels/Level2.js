import Level from './Level.js'
import Platform from '../Platform.js'
import Coin from '../Coin.js'

export default class Level2 extends Level {
    createPlatforms() {
        const h = this.game.height

        this.platforms.push(
            new Platform(this.game, 0, h - 80, 400, 300),
            new Platform(this.game, 200, h - 180, 120, 20),
            new Platform(this.game, 400, h - 260, 120, 20)
        )
    }

    createCoins() {
        this.coins.push(
            new Coin(this.game, 220, this.game.height - 220),
            new Coin(this.game, 420, this.game.height - 300)
        )
    }

    createEnemies() {
        // tom tills vidare
    }

    createEndZone() {
        this.levelEndZone = {
            x: 520,
            y: this.game.height - 180,
            width: 100,
            height: 60
        }
    }
}