export default class Level {
    constructor(game) {
        this.game = game

        this.platforms = []
        this.coins = []
        this.enemies = []

        this.playerSpawn = {x: 50, y: 200}
    }

    init() {
        this.createPlatforms()
        this.createCoins()
        this.createEnemies()
        this.createEndZone()
    }

    createPlatforms() {}
    createCoins() {}
    createEnemies() {}
    createEndZone() {}

    getData() {
        return {
            platforms: this.platforms,
            coins: this.coins,
            enemies: this.enemies,
            playerSpawn: this.playerSpawn,
            levelEndZone: this.levelEndZone
        }
    }
}