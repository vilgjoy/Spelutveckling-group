import Level from './Level.js'
import Platform from '../Platform.js'
import Coin from '../Coin.js'
import Spike from '../Spikes.js'
import DeathZone from '../DeathZone.js' // Glöm inte importera denna!

export default class Level1 extends Level {
    createPlatforms() {
        const h = this.game.height
        
        // --- LEVEL DESIGN: THE FLOOR IS LAVA ---
        
        this.platforms.push(
            // 1. Startplattform (Säker zon)
            new Platform(this.game, 0, h - 96, 192, 320),

            // 2. Första ö-gruppen (Små hopp)
            new Platform(this.game, 300, h - 96, 64, 320),  // Liten pelare
            new Platform(this.game, 450, h - 128, 96, 352), // Lite högre

            // 3. Spik-gauntlet (Lång plattform men med spikar på)
            new Platform(this.game, 650, h - 96, 512, 320), 

            // 4. Precisionshopp över gapet (Luftplattformar)
            // Notera: Max hopphöjd är ca 120px. Här måste man tajma.
            new Platform(this.game, 1300, h - 160, 64, 32),
            new Platform(this.game, 1500, h - 224, 64, 32),
            new Platform(this.game, 1750, h - 160, 64, 32), // Ner igen

            // 5. Slutsträckan
            new Platform(this.game, 2000, h - 96, 500, 320)
        )
    }

    createSpikes() {
        const h = this.game.height

        this.spikes.push(
            // Spikar på den långa plattformen (nr 3)
            new Spike(this.game, 750, h - 112),
            new Spike(this.game, 850, h - 112),
            new Spike(this.game, 950, h - 112),

            // En elak spik precis vid landningen på sista plattformen
            new Spike(this.game, 2040, h - 112) 
        )
    }

    createDeathZones() {
        const h = this.game.height
        // Hela golvet är dödligt om man missar plattformarna
        this.deathZones.push(
            new DeathZone(this.game, 0, h - 10, 3000, 100) 
        )
    }

    createCoins() {
        const h = this.game.height
        this.coins.push(
            new Coin(this.game, 465, h - 250), // Ovanför pelaren
            new Coin(this.game, 800, h - 200), // Mellan spikar
            new Coin(this.game, 1530, h - 350) // Högt uppe på luftplattformen (Riskabelt)
        )
    }

    createEnemies() {
        // Lägg till fiender här om du vill öka svårigheten ytterligare
    }

    createEndZone() {
        // Målet är långt bort till höger
        this.levelEndZone = {
            x: 2300,
            y: this.game.height - 150,
            width: 100,
            height: 60
        }
    }
}