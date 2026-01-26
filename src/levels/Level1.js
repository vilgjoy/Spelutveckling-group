import Level from './Level.js'
import Platform from '../Platform.js'
import Coin from '../Coin.js'


export default class Level1 extends Level {
    createPlatforms() {
        const h = this.game.height

        this.platforms.push(
            new Platform(this.game, 0, h - 80, 600, 300, '#654321'),
            new Platform(this.game, 250, h - 160, 120, 20, '#654321')
        )
    }

    createCoins() {
        this.coins.push(
            new Coin(this.game, 300, this.game.height - 200)
        )
    }

    createEnemies() {
        // tom just nu
    }

    createEndZone() {
        this.levelEndZone = {
            x: 400,
            y: this.game.height - 140,
            width: 100,
            height: 60
        }
    }
}