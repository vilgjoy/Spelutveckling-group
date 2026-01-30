import Level from './Level.js'
import Platform from '../Platform.js'
import Coin from '../Coin.js'
import Spike from '../Spikes.js'
// nytt
// import Fakespikes from '../fakeSpikes'
// import Box from '../Box.js'

export default class Level1 extends Level {
    createPlatforms() {
        const h = this.game.height

        // MATTE FÖR SPRITES 
        // jag har gjort så att platformerna ha spritesen
        // men för att det ska se snyggt ut försöker försök använda mått som är delbara med 32.
        
        this.platforms.push(
            // GOLVET
            // gammal kod - width 600. Nytt: 608 (19 st rutor * 32)
            // gammal kod - height 300. Nytt: 320 (10 st rutor * 32)
            new Platform(this.game, 0, h - 96, 608, 320),

            // LUFT-PLATTFORMEN
            // gammal kod - width 120. Nytt: 128 (4 st rutor * 32)
            // gammal kod - height 20. Nytt: 32 (1 st ruta * 32) - minsta höjden för att se gräset snyggt
            new Platform(this.game, 250, h - 192, 128, 32)
        )
    }

    createSpikes() {
        const h = this.game.height

        this.spikes.push(
            new Spike(this.game, 300, h - 112),
            new Spike(this.game, 340, h - 112)
        )
    }

    createCoins() {
        this.coins.push(
            new Coin(this.game, 300, this.game.height - 250)
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