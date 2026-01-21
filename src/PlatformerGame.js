import Projectile from "./Projectile";
import Player from "./Player";
import GameBase from "./GameBase.js";

export default class PlatformerGame extends GameBase {
    constructor(width, height) {
        super(width, height);

        // Spel-specifika egenskaper
        this.gravity = 0.001; // Gravitationens styrka
        this.friction = 0.0005; // Luftmotståndets styrka

        // Hantera input
        this.inputHandler = new inputHandler();

        // Användargränssnitt
        this.ui = new Userinterface(this);

        // Kamera
        this.camera = new camera(this, 0, 0, width, height);

        // Spelobjekt listor
        this.players = [];
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
    }

    addProjectile(x, y, directionX, owner = null, directionY = 0) {
        const projectile = new Projectile(this, x, y, directionX, owner, directionY)
        this.projectiles.push(projectile)
    }

    addEnemyProjectile(x, y, owner = null, directionY = 0) {
        const directionX = owner.direction
        const projectile = new Projectile(this, x, y, directionX, owner, directionY)
        this.enemyProjectiles.push(projectile)
    }
}
