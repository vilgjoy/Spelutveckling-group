import Level from './Level.js'
import Platform from '../Platform.js'
import Coin from '../Coin.js'
import Spike from '../Spikes.js'
import DeathZone from '../DeathZone.js'
import HiddenPlatform from '../HiddenPlatform.js'

export default class Level3 extends Level {

    createPlatforms() {
        const h = this.game.height

        this.platforms.push(
            new Platform(this.game, 0, h - 64, 256, 100),

            new Platform(this.game, 300, h - 160, 96, 32),
            new Platform(this.game, 500, h - 256, 96, 32),
            
            new Platform(this.game, 700, h - 320, 320, 32),

            new Platform(this.game, 1100, h - 200, 64, 32),
            new Platform(this.game, 1300, h - 200, 64, 32),

            new Platform(this.game, 1500, h - 300, 96, 32),
            new Platform(this.game, 1700, h - 400, 96, 32),

            new HiddenPlatform(this.game, 1880, h - 320, 80, 32),

            new Platform(this.game, 2000, h - 400, 400, 400) 
        )
    }

    createSpikes() {
        const h = this.game.height
        this.spikes.push(
            new Spike(this.game, 800, h - 336),
            new Spike(this.game, 900, h - 336),
            
            new Spike(this.game, 2020, h - 416)
        )
    }

    createDeathZones() {
        const h = this.game.height
        this.deathZones.push(
            new DeathZone(this.game, 0, h - 10, 4000, 100)
        )
    }

    createCoins() {
        const h = this.game.height
        this.coins.push(
            new Coin(this.game, 520, h - 350),
            new Coin(this.game, 1200, h - 300),
            new Coin(this.game, 1720, h - 480)
        )
    }

    createEnemies() {}

    createEndZone() {
        this.levelEndZone = {
            x: 2200,
            y: this.game.height - 460,
            width: 100,
            height: 60
        }
    }
}