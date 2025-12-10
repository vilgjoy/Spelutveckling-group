# Steg 13: Space Shooter - Abstraktion och arkitektur

I detta steg bygger vi ett komplett space shooter-spel genom att refaktorera vår kodbas till en mer abstrakt och återanvändbar arkitektur. Vi skapar en abstrakt `GameBase`-klass som innehåller gemensam spellogik, och extenderar den med `SpaceShooterGame` som implementerar specifik space shooter-funktionalitet.

Syftet med det här steget är förvisso att ni ska lära er saker, men framförallt så är det att ge exempel på hur man kan strukturera större spelprojekt på ett skalbart och underhållbart sätt. Denna arkitektur gör det enkelt att skapa nya speltyper i framtiden genom att återanvända gemensam infrastruktur.

Det finns öven exempel på hur ni kan tänka för sprites, fiender och bossar.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Abstrakt basklasser** - Template Method pattern för återanvändbara spelstrukturer
- **Separation of Concerns** - Spawning-logik separerad från spel-loop
- **Objektorienterad design** - Inheritance och polymorfism
- **Game Systems** - Heat management, powerups, boss fights
- **Vertical scrolling** - Fast kamera med auto-scrolling backgrounds
- **Progressive difficulty** - Scaling enemy spawns och boss mechanics

## Problemet - Monolitisk Game-klass

Den ursprungliga `Game.js` innehöll:
- Platform game-specifik logik (gravity, jumping, platforms)
- Meny-system som konfliktar med space shooter-flöde
- Hårdkodad state management
- Svårt att skapa alternativa speltyper

Vi behöver en arkitektur som:
- **Separerar gemensam logik** från spelspecifik
- **Tillåter olika speltyper** att dela infrastruktur
- **Gör det enkelt att testa** enskilda komponenter
- **Följer SOLID-principerna** för underhållbar kod

## Arkitekturlösning - Abstract GameBase

### GameBase - Den abstrakta basen

`GameBase` innehåller all gemensam spellogik:

```javascript
export default class GameBase {
    constructor(width, height) {
        // Förhindra direkt instansiering av abstrakt klass
        if (this.constructor === GameBase) {
            throw new Error("GameBase is abstract")
        }
        
        // Gemensamma system
        this.inputHandler = new InputHandler(this)
        this.camera = new Camera(0, 0, width, height)
        this.ui = new UserInterface(this)
        
        // Gemensamma arrayer
        this.enemies = []
        this.projectiles = []
        this.powerups = []
    }
    
    // Abstrakta metoder - måste implementeras av subklass
    init() { throw new Error('Must implement init()') }
    restart() { throw new Error('Must implement restart()') }
}
```

**Viktiga delar:**
- **Constructor check** - Kastar fel om man försöker instansiera GameBase direkt
- **Gemensamma system** - InputHandler, Camera, UI delas av alla speltyper
- **Abstract methods** - `init()` och `restart()` måste implementeras av subklasser
- **Common update/draw** - Bas-implementationer som kan kallas via `super.update()`

### SpaceShooterGame - Konkret implementation

`SpaceShooterGame` utökar `GameBase` och implementerar space shooter-specifik logik:

```javascript
export default class SpaceShooterGame extends GameBase {
    constructor(width, height) {
        super(width, height)
        
        this.setupSpaceBackgrounds()
        this.enemySpawner = new EnemySpawner(this)
        this.backgroundMusic = new Audio(stormMusic)
        
        this.init()
    }
    
    init() {
        this.score = 0
        this.playTime = 0
        this.player = new SpacePlayer(...)
        this.enemySpawner.reset()
        // Starta musik
    }
}
```

## EnemySpawner - Separation of Concerns

Istället för att ha all spawning-logik i game-loopen, skapar vi en dedikerad `EnemySpawner`-klass:

### Varför en separat spawner?

**Fördelar:**
- **Single Responsibility** - Spawner hanterar bara spawning
- **Testbarhet** - Kan testa spawn-logik isolerat
- **Flexibilitet** - Enkelt att byta spawn-patterns
- **Läsbarhet** - Game-klassen fokuserar på orchestration

### Enemy Type System

```javascript
this.enemyTypes = {
    random: () => Math.floor(Math.random() * 12),
    tiny: () => [3, 7, 11][Math.floor(Math.random() * 3)],
    medium: () => [1, 5, 9][Math.floor(Math.random() * 3)],
    large: () => [0, 4, 8][Math.floor(Math.random() * 3)]
}

// Användning:
spawner.spawnEnemy('tiny')  // Spawnar en liten enemy
```

Detta gör det enkelt att lägga till nya enemy-typer utan att röra spawning-logiken. Vi kan även skapa nya spawn-mönster genom att lägga till fler funktioner i `enemyTypes`.

### Boss Spawning och Progressive Difficulty

När vi ska göra saker svårare i spel, över tid eller med någon annan faktor som level så är det vanligt att vi gör det med hjälp av "scaling". Det är parametrar som ändras över tid för att göra spelet svårare och vi multiplicerar ofta med en faktor som baseras på tid eller poäng.

```javascript
updateRegularSpawning(deltaTime) {
    this.enemySpawnTimer += deltaTime
    
    if (this.enemySpawnTimer >= this.enemySpawnInterval) {
        this.spawnEnemy('random')
        this.enemySpawnTimer = 0
        
        // Progressivt svårare
        if (this.enemySpawnInterval > this.minSpawnInterval) {
            this.enemySpawnInterval -= this.spawnIntervalDecrease
        }
    }
}
```

Som spelet är gjort nu så spawnar en boss var 2000 poäng. När en boss spawnar så slutar andra fiender att spawnas tills bossen är besegrad. Bossens svårighetsgrad skalar med en "level" som baseras på hur många bossar spelaren har besegrat.

När en boss besegras så spawnas automatiskt en powerup. Detta visar hur vi kan koppla ihop olika system i spelet. Bossen skulle teoretiskt sätt kunna explodera till 5 stycken små fiender också, eller släppa en hälsopack.

## Space Shooter Features

### Portrait Mode och Fixed Camera

Till skillnad från platform-spelet använder space shootern:
- **Portrait orientation** - 480x854 (9:16)
- **Fixed camera** - Kameran flyttar sig inte, spelaren rör sig på skärmen
- **Auto-scrolling backgrounds** - Bakgrunder scrollar uppåt automatiskt

Vi bygger vidare på de system vi har, men uppdaterar nu bakgrunder och låser kameran vid (0,0).

```javascript
update(deltaTime) {
    // Backgrounds scrollar automatiskt
    this.backgrounds.forEach(bg => bg.update(deltaTime))
    
    // Kameran låses vid 0,0
    this.camera.x = 0
    this.camera.y = 0
}
```

### Heat Management System

För att förhindra oändligt skjutande implementerade vi ett heat-system:

**Klassisk overheat-mekanism:**
- Varje skott genererar 8ish heat (justera efter testning)
- Heat kyls ner kontinuerligt med 20/sekund
- Vid 100% heat: 3 sekunders cooldown-period
- Efter cooldown: Heat återställs till 0

```javascript
// I SpacePlayer
shoot() {
    this.heat += this.heatPerShot
    if (this.heat >= this.maxHeat) {
        this.overheated = true  // Låser skjutning
    }
}

update(deltaTime) {
    if (this.overheated) {
        this.overheatTimer += deltaTime
        if (this.overheatTimer >= 3000) {
            this.overheated = false
            this.heat = 0
        }
    }
}
```

**UI Feedback:**
- Normal: Orange→Röd gradient bar
- Overheated: Flashande röd bar med "OVERHEATED!" text
- Cooldown progress visas i baren

### PowerUp System

Två powerup-typer dropar från enemies:

**Health Powerup:**
- Återställer 1 HP
- **Bonus:** Om vid full health, reducera heat med 30 istället
- Belönar skickliga spelare som undviker skada

**Shield Powerup:**
- 5 sekunders skydd
- Blockerar ett hit helt
- Visuell cyan barrier-sprite
- Health bar blir cyan när aktiv

**Drop rates baserat på enemy size:**
- Large (40%), Medium (25%), Small (10%), Tiny (5%)
- Boss (100% - alltid dropar powerup)

Här finns mycket utrymme för expansion, t.ex. olika powerup-typer, durationer, multipliers etc.
Kolla i assets foldern för fler powerup-idéer!

### Boss System

Boss spawnar baserat på score och skalar i svårighetsgrad:

**Boss attributes:**
```javascript
constructor(game, x, y, level = 0) {
    // Skalar med level
    this.maxHealth = 20 + (level * 10)
    this.moveSpeed = 0.1 + (level * 0.02)
    this.shootCooldown = Math.max(800, 1500 - (level * 100))
}
```

**Boss behavior:**
- Rör sig ner till toppen av skärmen
- Side-to-side movement pattern
- Skjuter tre projektiler i spread-pattern
- Kräver 3000 poäng mellan bossar (boss ger 500, måste döda regulära enemies)

## Sprite Sheet Management

### Enemy Sprites

Enemy sprite sheet (256x256) har 3 rader × 4 kolumner (12 typer), men fienderna är av olika storlek och därför så kan vi inte bara dela upp dem i ett jämnt grid. Av den anledningen så kan vi sätta start och width för varje enemy-typ.


```javascript
const enemyData = [
    { startX: 30, width: 50, health: 3, points: 100 },
    { startX: 85, width: 40, health: 2, points: 50 },
    { startX: 135, width: 30, health: 2, points: 30 },
    { startX: 175, width: 20, health: 1, points: 10 }
]
```

## Debug Mode

Tryck 'P' för att toggla debug mode:
- Rita hitboxes runt enemies och projektiler
- Användbart för collision tuning
- Simple keypress toggle med state tracking

```javascript
update(deltaTime) {
    if (this.inputHandler.keys.has('p') && !this.debugKeyPressed) {
        this.debug = !this.debug
        this.debugKeyPressed = true
    } else if (!this.inputHandler.keys.has('p')) {
        this.debugKeyPressed = false
    }
}
```

## Ljud och Musik

Background music loop:
- Storm.mp3 från assets
- 30% volume (inte för högt)
- Loop: true
- Startar i init() med autoplay error handling

```javascript
this.backgroundMusic = new Audio(stormMusic)
this.backgroundMusic.loop = true
this.backgroundMusic.volume = 0.3

// I init()
this.backgroundMusic.play().catch(err => {
    // Browsers kan blockera autoplay
    console.log('Autoplay prevented:', err)
})
```

## Sammanfattning - Arkitektoniska principer

### Template Method Pattern
- **GameBase** definierar game loop struktur
- **Subklasser** implementerar specifik logik via `init()`, `restart()`
- Gemensam logik i `update()` och `draw()` kan kallas via `super`

### Single Responsibility Principle
- **EnemySpawner** - Endast spawning-logik
- **GameBase** - Gemensam game infrastructure
- **SpaceShooterGame** - Space shooter orchestration
- **Varje klass har en tydlig ansvarsområde**

### Open/Closed Principle
- **Öppen för extension** - Lägg till nya speltyper genom att extendera GameBase
- **Stängd för modification** - Behöver inte ändra GameBase för nya features

### Fördelar med arkitekturen

**Återanvändbarhet:**
- Kan enkelt skapa nya speltyper (top-down shooter, bullet hell, etc.)
- Gemensamma system (input, camera, UI) delas automatiskt

**Testbarhet:**
- EnemySpawner kan testas isolerat
- Mock game-objekt för unit testing
- Tydliga gränssnitt mellan komponenter

**Underhållbarhet:**
- Logisk separation gör det lätt att hitta kod
- Ändringar i spawning påverkar inte game loop
- Nya features går till rätt klass

**Skalbarhet:**
- Enkelt att lägga till nya enemy-typer via type system
- Wave patterns kan läggas till i spawner
- Boss mechanics kan extenderas utan att röra base-klassen

## Nästa steg

Möjliga förbättringar:
- **Achievement system** - Tracka prestationer över game sessions
- **Weapon upgrades** - Olika skjutmönster som powerups
- **Enemy formations** - Organiserade attack-patterns
- **Story mode** - Level progression med olika bossar
- **Local storage** - Spara high scores
- **Particle effects** - Explosioner och visual feedback

Arkitekturen vi har nu gör det enkelt att lägga till dessa features utan att skriva om grundstrukturen!
