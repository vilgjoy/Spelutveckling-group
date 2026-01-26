import Level from './Level.js'
import Platform from '../Platform.js'
import DeathZone from '../DeathZone.js'

export default class Level2 extends Level {
    createPlatforms() {
        // Golv
        this.platforms.push(new Platform(this.game, 0, 430, 1200, 50))

        // Fake säker plattform
        this.platforms.push(new Platform(this.game, 400, 350, 120, 20))

        // Hög plattform
        this.platforms.push(new Platform(this.game, 700, 300, 150, 20))
    }

    createDeathZones() {
        // Hela hålet under fake plattformen
        this.deathZones.push(new DeathZone(this.game, 350, 370, 220, 110))

        // Klassisk troll: precis före mål
        this.deathZones.push(new DeathZone(this.game, 1050, 400, 100, 50))
    }

    createEndZone() {
        this.levelEndZone = {
            x: 1150,
            y: 380,
            width: 60,
            height: 50
        }
    }
}