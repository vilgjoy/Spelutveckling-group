import Rectangle from './Rectangle.js'
import InputHandler from './InputHandler.js'

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

export default class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.inputHandler = new InputHandler(this);
        // Skapa alla objekt i spelet
        this.gameObjects = [
            new Rectangle(this, 50, 50, 100, 100, 'red'),
            new Rectangle(this, 50, 150, 150, 75, 'blue'),
            new Rectangle(this, 50, 225, 120, 120, 'green'),
        ];
    }

    update(deltaTime) {
        // Uppdatera spelet utifrån deltaTime
        this.gameObjects.forEach(obj => obj.update(deltaTime))

        // Exempel på input-hantering
        if (this.inputHandler.keys.has('r')) {
            this.gameObjects[0].velocityX += 0.001 * deltaTime
        }
        if (this.inputHandler.keys.has('b')) {
            this.gameObjects[1].velocityX -= 0.001 * deltaTime
        }
        if (this.inputHandler.keys.has('g')) {
            this.gameObjects[2].velocityX -= 0.001 * deltaTime
        }
    }

    draw(ctx) {
        // Rita bilden om den är laddad
        if (this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, 20, 20, 100, 100);
            console.log("Drawing image");
        } else {
            console.log("Image not ready");
        }
        // Rita alla spelobjekt
        this.gameObjects.forEach(obj => obj.draw(ctx));
    }
}