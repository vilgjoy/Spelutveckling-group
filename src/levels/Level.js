export default class Level {
    constructor(game) {
        this.game = game

        this.platforms = []
        this.coins = []
        this.enemies = []
        this.deathZones = []
        this.spikes = []

        

        this.playerSpawn = {x: 50, y: 200}
    }

    init() {
        this.createPlatforms()
        this.createCoins()
        this.createEnemies()
        this.createSpikes()
        this.createEndZone()
        this.createDeathZones()
        
        

    }

    createPlatforms() {}
    createCoins() {}
    createEnemies() {}
    createSpikes() {}
    createEndZone() {}
    createDeathZones() {}
    
    

    getData() {
        return {
            platforms: this.platforms,
            coins: this.coins,
            enemies: this.enemies,
            deathZones: this.deathZones,
            spikes: this.spikes,
            playerSpawn: this.playerSpawn,
            levelEndZone: this.levelEndZone,
        
        }
    }
}