# Steg 9: Sprites och animation

I detta steg ersätter vi de färgade rektanglarna med riktiga sprites och lägger till frame-baserad animation. Vi använder sprite sheets från Pixel Adventure asset pack och implementerar ett flexibelt animationssystem.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Sprite Loading** - Ladda bilder med Vite's asset import
- **Frame-based Animation** - Rita ut olika frames från sprite sheets
- **Animation States** - Byt mellan idle, run, jump, fall
- **Sprite Flipping** - Spegelvända sprites med canvas transform
- **Reusable Animation System** - Flytta animation logic till GameObject
- **Variable Animation Speed** - Olika animationshastigheter per animation
- **Error Handling** - Hantera bilder som inte laddas

## Översikt

För att lägga till sprites behöver vi:
1. **Import sprites** - Använd Vite för att importera bilder
2. **Animation system** - Hålla koll på frames, timing, states
3. **drawImage** - Rita sprites istället för fillRect
4. **Horizontal flip** - Spegelvända sprites baserat på riktning
5. **GameObject integration** - Flytta duplicerad kod till basklassen

## Problemet - Färgade rektanglar

Hittills består vårt spel bara av färgade rektanglar:
- Spelaren är en grön fyrkant med ögon
- Fiender är röda fyrkanter
- Ser inte proffsigt ut
- Svårt att se animation och rörelse

**Detta skapar:**
- Bristande visuell polish
- Svårt att kommunicera animation states
- Tråkigt utseende

## Sprite Sheets - Vad är det?

En **sprite sheet** är en bild som innehåller flera frames av en animation i en rad eller rutnät. Istället för att ha 12 separata bilder för en "run"-animation har vi en bild med alla 12 frames bredvid varandra.

**Fördelar:**
- Färre HTTP requests (viktigt för webbspel)
- Lättare att organisera och hantera assets
- Enklare att använda med canvas drawImage()

**Exempel:** `Run (32x32).png` innehåller 12 frames à 32x32 pixels = 384x32 pixels total.

## Ladda Sprites med Vite

Vite gör det enkelt att importera assets som bilder. Vi kan importera dem direkt i JavaScript-filen:

```javascript
import idleSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Idle (32x32).png'
import runSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Run (32x32).png'
import jumpSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Jump (32x32).png'
import fallSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Fall (32x32).png'
```

**Vite gör:**
- Optimerar bilderna automatiskt
- Skapar korrekta paths i build
- Möjliggör hot reload under utveckling

## GameObject - Animation Base Class

För att undvika duplicerad kod flyttar vi animation-logiken till `GameObject`. Detta gör det enkelt att lägga till sprites på alla objekt senare (coins, projectiles, etc.).

### Uppdatera GameObject.js

Lägg till animation properties i constructor:

```javascript
// Basklass för alla objekt i spelet
export default class GameObject {
    constructor(game, x = 0, y = 0, width = 0, height = 0) {
        this.game = game
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        this.markedForDeletion = false
        
        // Animation properties (optional - används endast om subklasser har sprites)
        this.animations = null
        this.currentAnimation = null
        this.frameIndex = 0
        this.frameTimer = 0
        this.frameInterval = 100 // default millisekunder per frame
        this.spriteLoaded = false
    }
    
    // ... befintlig kod (intersects, getCollisionData)
}
```

### Lägg till Animation Methods

```javascript
// Uppdatera animation state och återställ frame vid ändring
setAnimation(animationName) {
    if (this.currentAnimation !== animationName) {
        this.currentAnimation = animationName
        this.frameIndex = 0
        this.frameTimer = 0
    }
}

// Hjälpmetod för att ladda sprite med error handling
loadSprite(animationName, imagePath, frames, frameInterval = null) {
    if (!this.animations) {
        this.animations = {}
    }
    
    const img = new Image()
    img.src = imagePath
    
    img.onload = () => {
        this.spriteLoaded = true
    }
    
    img.onerror = () => {
        console.error(`Failed to load sprite: ${imagePath} for animation: ${animationName}`)
    }
    
    this.animations[animationName] = {
        image: img,
        frames: frames,
        frameInterval: frameInterval
    }
}

// Uppdatera animation frame (anropa i subklassens update)
updateAnimation(deltaTime) {
    if (!this.animations || !this.currentAnimation) return
    
    const anim = this.animations[this.currentAnimation]
    if (anim.frames > 1) {
        // Använd animation-specifik frameInterval om den finns, annars default
        const interval = anim.frameInterval || this.frameInterval
        
        this.frameTimer += deltaTime
        if (this.frameTimer >= interval) {
            const wasLastFrame = this.frameIndex === anim.frames - 1
            this.frameIndex = (this.frameIndex + 1) % anim.frames
            this.frameTimer = 0
            
            // Anropa completion callback när animation är klar
            if (wasLastFrame && this.onAnimationComplete) {
                this.onAnimationComplete(this.currentAnimation)
            }
        }
    }
}

// Rita sprite (anropa i subklassens draw för att rita sprite)
drawSprite(ctx, camera = null, flipHorizontal = false) {
    if (!this.spriteLoaded || !this.animations || !this.currentAnimation) return false
    
    const anim = this.animations[this.currentAnimation]
    const frameWidth = anim.image.width / anim.frames
    const frameHeight = anim.image.height
    
    const screenX = camera ? this.x - camera.x : this.x
    const screenY = camera ? this.y - camera.y : this.y
    
    ctx.save()
    
    if (flipHorizontal) {
        ctx.translate(screenX + this.width, screenY)
        ctx.scale(-1, 1)
        ctx.drawImage(
            anim.image,
            this.frameIndex * frameWidth,
            0,
            frameWidth,
            frameHeight,
            0,
            0,
            this.width,
            this.height
        )
    } else {
        ctx.drawImage(
            anim.image,
            this.frameIndex * frameWidth,
            0,
            frameWidth,
            frameHeight,
            screenX,
            screenY,
            this.width,
            this.height
        )
    }
    
    ctx.restore()
    return true // Returnera true om sprite ritades
}
```

### Viktiga delar

#### setAnimation()
Denna metod byter animation state och återställer `frameIndex` till 0. Detta är **kritiskt viktigt** för att undvika flickering när vi byter från en multi-frame animation (t.ex. run med 12 frames) till en single-frame animation (t.ex. jump med 1 frame).

**Problem utan reset:** Om `frameIndex = 11` när vi byter till jump-animation försöker vi rita frame 11 av en 1-frame sprite = undefined behavior/flicker.

#### loadSprite()
Denna hjälpmetod skapar `Image`-objektet, sätter src, och lägger till error handling. Den tar även en `frameInterval` parameter som gör att vi kan ha olika animationshastigheter:
- Idle: 150ms (långsammare, mer avslappnad)
- Run: 80ms (snabbare, mer energisk)

#### updateAnimation()
Uppdaterar frame timer och incrementar `frameIndex`. Endast för animationer med `frames > 1` (annars är det bara en statisk bild). Inkluderar även en `onAnimationComplete` callback som anropas när en animation loopar - användbart för one-shot animations som död eller hit-effekter.

#### drawSprite()
Ritar sprite med `ctx.drawImage()` och hanterar horizontal flip med canvas transforms:
```javascript
ctx.translate(screenX + this.width, screenY)  // Flytta till höger kant
ctx.scale(-1, 1)                              // Spegelvända horisontellt
```

**Varför returnera boolean?** Så att subklasser kan ha fallback-rendering:
```javascript
if (!this.drawSprite(ctx, camera, flip)) {
    // Sprite laddas fortfarande, rita färgad rektangel
    ctx.fillRect(screenX, screenY, this.width, this.height)
}
```

## Uppdatera Player.js

### Import Sprites

Lägg till imports högst upp:

```javascript
import GameObject from './GameObject.js'
import idleSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Idle (32x32).png'
import runSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Run (32x32).png'
import jumpSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Jump (32x32).png'
import fallSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Fall (32x32).png'

export default class Player extends GameObject {
```

### Ladda Sprites i Constructor

Ersätt sprite-koden med `loadSprite()`:

```javascript
constructor(game, x, y, width, height, color) {
    super(game, x, y, width, height)
    this.color = color
    
    // ... befintlig kod (velocity, physics, health, shooting)
    
    // Sprite animation system - ladda sprites med olika hastigheter
    this.loadSprite('idle', idleSprite, 11, 150)  // Långsammare idle
    this.loadSprite('run', runSprite, 12, 80)     // Snabbare spring
    this.loadSprite('jump', jumpSprite, 1)
    this.loadSprite('fall', fallSprite, 1)
    
    this.currentAnimation = 'idle'
}
```

**Varför olika frameInterval?**
- **Idle (150ms):** Långsammare = mer avslappnad, vilar
- **Run (80ms):** Snabbare = mer energi, rörelse
- **Jump/Fall:** Singel-frame, ingen animation

### Uppdatera Animation State i update()

Lägg till efter position update:

```javascript
update(deltaTime) {
    // ... befintlig kod (input, physics, position update)
    
    // Uppdatera animation state baserat på rörelse
    if (!this.isGrounded && this.velocityY < 0) {
        this.setAnimation('jump')
    } else if (!this.isGrounded && this.velocityY > 0) {
        this.setAnimation('fall')
    } else if (this.velocityX !== 0) {
        this.setAnimation('run')
    } else {
        this.setAnimation('idle')
    }
    
    // Uppdatera animation frame
    this.updateAnimation(deltaTime)
    
    // ... rest av update (invulnerability, shooting)
}
```

**State priority:**
1. **Airborne states** - Jump/Fall har högst prioritet (hoppar/faller)
2. **Movement** - Run om spelaren rör sig horisontellt
3. **Idle** - Default när spelaren står still

### Uppdatera draw() med Sprites

Ersätt draw-metoden:

```javascript
draw(ctx, camera = null) {
    // Blinka när spelaren är invulnerable
    if (this.invulnerable) {
        const blinkSpeed = 100
        if (Math.floor(this.invulnerableTimer / blinkSpeed) % 2 === 0) {
            return
        }
    }
    
    const screenX = camera ? this.x - camera.x : this.x
    const screenY = camera ? this.y - camera.y : this.y
    
    // Försök rita sprite, annars fallback till rektangel
    const spriteDrawn = this.drawSprite(ctx, camera, this.lastDirectionX === -1)
    
    if (!spriteDrawn) {
        // Fallback: Rita spelaren som en rektangel med ögon
        ctx.fillStyle = this.color
        ctx.fillRect(screenX, screenY, this.width, this.height)
        // ... ögon och mun (behåll befintlig kod)
    }
}
```

**Flip logic:** `this.lastDirectionX === -1` = vänd sprite när spelaren rör sig vänster.

## Uppdatera Enemy.js (Uppgift)

Nu är det din tur! Implementera sprites för `Enemy`-klassen med samma pattern som `Player`.

### Din uppgift:

1. **Importera sprites:**
   - Använd "Mask Dude" character från assets
   - Behöver: Idle och Run sprites

2. **Ladda sprites i constructor:**
   - Använd `this.loadSprite()`
   - Idle: 11 frames, 150ms
   - Run: 12 frames, 90ms

3. **Uppdatera animation state:**
   - Run när `velocityX !== 0 && isGrounded`
   - Idle annars

4. **Rita sprite i draw():**
   - Använd `this.drawSprite()`
   - Flip baserat på `this.direction === -1`
   - Fallback till röd rektangel

### Tips:

- Kolla hur Player.js gör det
- Import path: `./assets/Pixel Adventure 1/Main Characters/Mask Dude/`
- Testa att fienden flippar när den vänder
- Kontrollera console för fel om sprites inte laddas

<details>
<summary>Lösning (expandera om du fastnar)</summary>

```javascript
import GameObject from './GameObject.js'
import idleSprite from './assets/Pixel Adventure 1/Main Characters/Mask Dude/Idle (32x32).png'
import runSprite from './assets/Pixel Adventure 1/Main Characters/Mask Dude/Run (32x32).png'

export default class Enemy extends GameObject {
    constructor(game, x, y, width, height, patrolDistance = null) {
        super(game, x, y, width, height)
        this.color = 'red'
        
        // ... befintlig kod
        
        // Sprite animation system
        this.loadSprite('idle', idleSprite, 11, 150)
        this.loadSprite('run', runSprite, 12, 90)
        
        this.currentAnimation = 'run'
    }
    
    update(deltaTime) {
        // ... befintlig kod
        
        // Uppdatera animation state
        if (this.velocityX !== 0 && this.isGrounded) {
            this.setAnimation('run')
        } else {
            this.setAnimation('idle')
        }
        
        this.updateAnimation(deltaTime)
    }
    
    draw(ctx, camera = null) {
        const screenX = camera ? this.x - camera.x : this.x
        const screenY = camera ? this.y - camera.y : this.y
        
        const spriteDrawn = this.drawSprite(ctx, camera, this.direction === -1)
        
        if (!spriteDrawn) {
            ctx.fillStyle = this.color
            ctx.fillRect(screenX, screenY, this.width, this.height)
        }
    }
}
```
</details>

## Canvas drawImage - Sprite Slicing

`ctx.drawImage()` har flera signatures. Vi använder 9-parameter versionen för att "klippa ut" ett frame från sprite sheet:

```javascript
ctx.drawImage(
    image,              // Bilden att rita från
    sourceX,            // X-position i source (vilket frame)
    sourceY,            // Y-position i source (vilken rad)
    sourceWidth,        // Bredd att klippa ut
    sourceHeight,       // Höjd att klippa ut
    destX,              // X-position att rita på canvas
    destY,              // Y-position att rita på canvas
    destWidth,          // Bredd att rita (kan skala)
    destHeight          // Höjd att rita (kan skala)
)
```

**För att rita frame 3 av run-animation:**
```javascript
const frameWidth = 384 / 12  // = 32px per frame
const frameIndex = 3

ctx.drawImage(
    runSprite,
    frameIndex * frameWidth,  // 3 * 32 = 96px från vänster
    0,                        // Rad 0 (vi har bara en rad)
    frameWidth,               // 32px bredd
    32,                       // 32px höjd
    screenX,                  // Rita på spelarens position
    screenY,
    this.width,               // Skala till spelarens storlek
    this.height
)
```

## Animation Timing

Med `frameInterval` kan vi kontrollera hur snabbt animationen spelar:

```javascript
this.frameTimer += deltaTime  // Öka timer med tid sedan senaste frame

if (this.frameTimer >= interval) {
    // Dags att byta frame!
    this.frameIndex = (this.frameIndex + 1) % anim.frames
    this.frameTimer = 0
}
```

**Exempel:**
- `frameInterval = 80ms`
- Om game loop kör på 60fps ≈ 16ms per frame
- Behöver ~5 game frames innan vi byter sprite frame
- 12 sprite frames * 80ms = 960ms för hela run-animationen

## Horizontal Flip med Canvas Transform

För att spegelvända sprites använder vi canvas transforms:

```javascript
ctx.save()  // Spara context state

// Flytta origin till höger kant av sprite
ctx.translate(screenX + this.width, screenY)

// Spegelvända horisontellt
ctx.scale(-1, 1)

// Rita på position (0, 0) - nu flippat!
ctx.drawImage(image, ..., 0, 0, width, height)

ctx.restore()  // Återställ context state
```

**Varför translate först?**
- `scale(-1, 1)` spegelvänder runt origin (0, 0)
- Utan translate skulle sprite rita utanför skärmen
- Vi flyttar origin så sprite hamnar rätt efter flip

## Error Handling

`loadSprite()` inkluderar error handling:

```javascript
img.onerror = () => {
    console.error(`Failed to load sprite: ${imagePath} for animation: ${animationName}`)
}
```

**Vanliga fel:**
- Felstavad path
- Bild finns inte i assets-mappen
- Felaktigt filformat

**Testa error handling:** Ändra en import path till något som inte finns och kolla console.

## Animation Completion Callback

GameObject har stöd för `onAnimationComplete` callback:

```javascript
// I en subclass constructor eller init
this.onAnimationComplete = (animationName) => {
    if (animationName === 'death') {
        this.markedForDeletion = true
    }
}
```

Detta är användbart för:
- **Death animations** - Ta bort objekt när död-animationen är klar
- **Hit effects** - Återgå till idle efter hit
- **Attack animations** - Spawna projektil vid rätt frame
- **Power-ups** - Aktivera effekt när animation är klar

## Testa spelet

Kör spelet och se sprites i action:
1. **Idle animation** - Spelaren andas/rör sig när still
2. **Run animation** - Benen springer när du rör dig
3. **Jump** - Statisk hoppruta
4. **Fall** - Statisk fallruta
5. **Flip** - Sprites vänder sig åt rätt håll
6. **Enemies** - Fiender animerar när de patrullerar (efter din uppgift)

## Utmaningar

1. **Hit Animation:**
   - Lägg till "Hit (32x32).png" sprite
   - Spela när spelaren tar skada
   - Återgå till idle när klar

2. **Coin Spin:**
   - Lägg till sprites på `Coin` klassen
   - Använd "Fruits" från assets
   - Rotera genom frames kontinuerligt

3. **Projectile Sprite:**
   - Lägg till sprite för projektiler
   - Rotera baserat på riktning

4. **Death Animation:**
   - Lägg till död-animation för fiender
   - Använd `onAnimationComplete` för att ta bort

5. **Animation Speed Control:**
   - Lägg till property för att ändra hastighet dynamiskt
   - Sakta ner när spelaren tar skada
   - Snabba upp vid power-ups

## Sammanfattning

Du har nu:
- ✅ Laddat sprites med Vite asset imports
- ✅ Implementerat frame-baserad animation
- ✅ Skapat reusable animation system i GameObject
- ✅ Lagt till sprite flipping för riktning
- ✅ Variabel animationshastighet per animation
- ✅ Error handling för image loading
- ✅ Animation completion callbacks

**Nästa steg:** Game menus och UI polish - skapa title screen, pause menu, och settings.

## Reflektion

**Varför GameObject för animation?**
- Undviker duplicerad kod mellan Player, Enemy, Coin, etc.
- Lättare att lägga till sprites på nya objekt
- Konsekvent beteende för all animation
- Enklare att underhålla och debugga

**Varför inte en separat Sprite-klass?**
- För denna teaching context är det onödig abstraktion
- Subklasser behöver fortfarande hålla koll på sin animation state
- GameObject är redan basen för allt som ritas

**När skulle en Sprite-klass vara bra?**
- Komplex sprite rendering (layers, effects, shaders)
- Sprite sheets med multipla rader (olika animations på samma bild)
- Avancerad animation system (easing, blend trees)
- Particle systems med tusentals sprites
