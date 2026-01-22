# Steg 9: Sprites och animation

I detta steg ersätter vi de färgade rektanglarna med riktiga sprites och lägger till frame-baserad animation. Vi använder sprite sheets från [Pixel Adventure](https://pixelfrog-assets.itch.io/pixel-adventure-1) asset pack och implementerar ett flexibelt animationssystem.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Sprite Loading** - Ladda bilder med Vite's asset import
- **Frame-based Animation** - Rita ut olika frames från sprite sheets
- **Animation States** - Byt mellan idle, run, jump, fall
- **Sprite Flipping** - Spegelvända sprites med canvas transform
- **GameObject Integration** - Vi skriver animationslogiken i GameObject för återanvändning

## Problemet - Färgade rektanglar

Hittills består vårt spel bara av färgade rektanglar, vi har våran charmiga gröna kub som spelaren, men fienderna är trista röda lådor. Det är dags att byta ut dessa mot riktiga sprites!

## Sprite Sheets - Vad är det?

En **sprite sheet** är en bild som innehåller flera frames av en animation i en rad eller rutnät. Istället för att ha 12 separata bilder för en "run"-animation har vi en bild med alla 12 frames bredvid varandra.

**Fördelar:**
- Färre HTTP requests (viktigt för webbspel)
- Lättare att organisera och hantera assets
- Enklare att använda med canvas drawImage()

**Exempel:** `Run (32x32).png` innehåller 12 frames à 32x32 pixels = 384x32 pixels total.

Här är det dock viktigt att varje frame är just 32x32 pixlar och att karaktären är på samma position i varje frame. Annars kommer animationen se hoppig ut och vi kan inte rita rätt del av bilden.

## Ladda bilder med Vite

Med Vite så kan vi ladda saker som bilder med hjälp av import statements. Detta gör att Vite kan optimera och hantera bilderna korrekt. Det är dock viktigt att komma ihåg att när Vite gör det så får varje bild en "hashed" path i produktion, så vi kan inte bara skriva in en sträng med sökvägen.

```javascript
import idleSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Idle (32x32).png'
```

### Mina bilder laddas inte!

**Viktigt:** Eftersom många av bilderna kan vara små assets så behöver vi konfigurera Vite att inte inline:a dem som base64 i JavaScript-koden. Detta gör vi genom att sätta `assetsInlineLimit: 0` i `vite.config.js`.

Kolla filen [vite.config.js](./vite.config.js) för detaljer.

## GameObject - Animation Base Class

För att undvika duplicerad kod skriver vi animations-logiken i `GameObject`. Det låter oss undvika att varje subklass (Player, Enemy, Coin) skulle behöva implementera samma animation code.

### Hur fungerar frame-baserad animation?

Frame-baserad animation innebär att vi **byter bild** över tid för att skapa en illusion av rörelse. Tänk dig en flipbook - varje sida är ett "frame" och när du bläddrar snabbt ser det ut som rörelse.

**Grundkonceptet:**
```
Frame:     0      1      2      3      4  ...  11     0  (loop)
Tid:      0ms   80ms  160ms  240ms  320ms ... 880ms  960ms
Action:   [Visa frame 0] → [Visa frame 1] → ... → [Tillbaka till 0]
```

**Sprite sheet layout:**
```
Run (32x32).png (384x32 pixels total)
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ 0  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │ 8  │ 9  │ 10 │ 11 │  
│32x │32x │32x │32x │32x │32x │32x │32x │32x │32x │32x │32x │
│32  │32  │32  │32  │32  │32  │32  │32  │32  │32  │32  │32  │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
     ↑ frameIndex bestämmer vilket frame vi ritar
```

**Animation loop:**
```
Game Loop (varje frame ~16ms @ 60fps)
    ↓
frameTimer += deltaTime (ackumulera tid)
    ↓
frameTimer >= frameInterval? (80ms passerat?)
    ↓ JA
frameIndex = (frameIndex + 1) % frames (0→1→2→...→11→0)
frameTimer = 0 (reset)
    ↓
drawImage() → Rita frame[frameIndex] från sprite sheet
```

**Exempel med 3 frames:**
```
Time: 0ms
frameTimer: 0    frameIndex: 0    [Drawing: 😀¹]

Time: 80ms
frameTimer: 80   frameIndex: 1    [Drawing: 😁²]

Time: 160ms
frameTimer: 160  frameIndex: 2    [Drawing: 😂³]

Time: 240ms
frameTimer: 240  frameIndex: 0    [Drawing: 😀¹] ← Loop!
```

**Varför modulo (%) operator?**
```javascript
frameIndex = (frameIndex + 1) % frames
// frames = 12
// 11 + 1 = 12 % 12 = 0  ← Går tillbaka till början!
```

### Uppdatera GameObject.js

Det är väldigt omfattande ändringar i GameObject. Du kan se den kompletta koden i [GameObject.js](./src/GameObject.js).

### Viktiga delar

#### setAnimation()
Denna metod byter animation state och återställer `frameIndex` till 0. Detta är viktigt för att undvika att animationen blinker när vi byter animation.

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

Lägg till imports högst upp, om du vill se alla imports kolla i [Player.js](./src/Player.js):

```javascript
import GameObject from './GameObject.js'
import idleSprite from './assets/Pixel Adventure 1/Main Characters/Ninja Frog/Idle (32x32).png'

...

export default class Player extends GameObject {
```

### Ladda Sprites i Constructor

För att ladda in bilderna med loadSprite skriver vi i konstruktorn:

```javascript
constructor(game, x, y, width, height, color) {
    super(game, x, y, width, height)
    this.color = color
    
    // ... befintlig kod (velocity, physics, health, shooting)
    
    // Sprite animation system - ladda sprites
    this.loadSprite('idle', idleSprite, 11, 150)
    this.loadSprite('run', runSprite, 12, 80)
    this.loadSprite('jump', jumpSprite, 1)
    this.loadSprite('fall', fallSprite, 1)
    
    this.currentAnimation = 'idle'
}
```

Här ser du hur vi laddar varje animation och anger antalet frames och hur snabbt de ska spelas.
Jump och fall är statiska frames så vi anger bara 1 frame och hoppar över frameInterval.

Vi sätter sedan `this.currentAnimation = 'idle'` för att starta med idle-animationen.

### Uppdatera Animation State i update()

När vi väl har laddat in bilderna i `Player` behöver vi uppdatera animation state baserat på spelarens rörelse i `update()`-metoden. Det blir en ganska liten ändring just för att logiken för att animera sprites finns i `GameObject`.

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

Draw metoden blir dock lite mer komplex eftersom vi nu försöker rita sprites istället för bara rektanglar. Vi behåller fallback-logiken för att rita en rektangel om sprite inte är laddad än.

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

## Canvas drawImage - Sprite Slicing

Det här är den viktigaste delen att förstå för sprite animation! Vi använder `ctx.drawImage()` med 9 parametrar för att "klippa ut" ett frame från sprite sheet.

### Visualisering av sprite slicing

Tänk dig sprite sheet som ett "fönster" vi tittar genom:

```
Sprite Sheet: Run (32x32).png - Total storlek 384x32 pixels
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ 0  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │ 7  │ 8  │ 9  │ 10 │ 11 │  
│32px│32px│32px│32px│32px│32px│32px│32px│32px│32px│32px│32px│
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
  0   32   64   96  128  160  192  224  256  288  320  352  384
```

**När frameIndex = 2, vi vill rita frame #2:**

```
Source (från sprite sheet):
┌────────────────────────────────────────────────────────────┐
│                    ┏━━━━━━━┓                                │
│                    ┃Frame 2┃  ← Vi klipper ut denna del    │
│                    ┗━━━━━━━┛                                │
└────────────────────────────────────────────────────────────┘
Position: x = 64 (2 * 32)
Size: 32x32

Destination (på canvas):
┌─────────────────┐
│   ┏━━━━━━━━━━━┓ │
│   ┃  Frame 2  ┃ │ ← Skalas till spelarens storlek (50x50)
│   ┃ (scaled)  ┃ │
│   ┗━━━━━━━━━━━┛ │
└─────────────────┘
Position: screenX, screenY
Size: this.width x this.height (50x50)
```

### 9-parameter drawImage

Funktionen `ctx.drawImage()` har flera overloads (varianter). För att rita en hel bild använder vi 3 eller 5 parametrar, men för att rita ut en specifik del av en bild använder vi `ctx.drawImage()` med 9 parametrar. När vi använder `ctx.drawImage()` på detta sätt kan vi specificera exakt vilken del av källbilden vi vill rita och var på canvas vi vill rita den.

```javascript
ctx.drawImage(
    image,              // Bilden att rita från
    sourceX,            // X-position i source (vilket frame)
    sourceY,            // Y-position i source (vilken rad)
    sourceWidth,        // Bredd att klippa ut
    sourceHeight,       // Höjd att klippa ut
    destinationX,              // X-position att rita på canvas
    destinationY,              // Y-position att rita på canvas
    destinationWidth,          // Bredd att rita (kan skala)
    destinationHeight          // Höjd att rita (kan skala)
)
```

För att rita frame 3 från vår run-sprite så använder vi:

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

### frameRow och fler rader

Om vi hade en sprite sheet med flera rader (t.ex. olika animationer på olika rader) så skulle vi behöva en `frameRow` parameter för att veta vilken rad vi ska rita ifrån.

```javascript
const frameRow = 1  // Andra raden (0-indexed)
ctx.drawImage(
    spriteSheet,
    frameIndex * frameWidth,
    frameRow * frameHeight,  // Använd frameRow för Y-position
    frameWidth,
    frameHeight,
    screenX,
    screenY,
    this.width,
    this.height
)
```

I det systemet så behöver vi byta `frameRow` när vi byter animation (t.ex. idle på rad 0, run på rad 1) till skillnad från vårt nuvarande system där varje animation är en separat bild.

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

## Horizontal Flip med Canvas Transform

När en spelare byter håll så vill vi att sprite ska vända sig åt rätt håll. Det är något som skulle kunna göras med att ha separata sprites för vänster och höger. Det är dock mer effektivt att använda canvas transform för att spegelvända bilden horisontellt.

När vi gör en transform på canvas så påverkar det ALLT vi ritar efteråt, så vi måste spara och återställa context state med `ctx.save()` och `ctx.restore()` för att inte påverka andra ritningar.

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

Med denna metod kan vi enkelt rita sprites åt båda hållen utan att behöva separata bilder.

## Error Handling

När vi laddar in bilderna i spelet är det viktigt att hantera fel om bilden inte kan laddas (t.ex. felaktig path, felstavning och så vidare). I `loadSprite()` metoden lägger vi till en `onerror` handler

```javascript
img.onerror = () => {
    console.error(`Failed to load sprite: ${imagePath} for animation: ${animationName}`)
}
```

Du kan testa fel-hanteringen genom att ändra en import path till något som inte finns och kolla console.

## Animation Completion Callback

Ibland så kan vi vilja spela upp en animation EN gång och sedan göra något när den är klar, t.ex. en dödsanimation. För detta kan vi använda `onAnimationComplete` callbacken som anropas när en animation loopar.
Funktionen låter oss definiera vad som ska hända när en animation är klar.

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

## Uppgifter

### Enemy.js sprites

Som första steg så ska du nu implementera sprites för `Enemy`-klassen med samma mönster som `Player`.

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

## Ta skada

När spelaren tar skada så har vi tidigare bara blinkat rektangeln. Men nu har vi tillgång till sprites!
Använd Hit animationen från "Ninja Frog" för att visa en skada-animation när spelaren blir träffad. Om du vill behålla blink-effekten kan du kombinera båda.

Att fundera på för detta är hur du vill att animationen ska fungera:
- Ska hit-animationen spelas en gång och sedan återgå till idle/run?
- Ska blink-effekten vara kvar under hit-animationen?

## Byt ut Coin till frukter

I assets så hittar du en mapp med frukter under `./assets/Pixel Adventure 1/Items/Fruits/`. Byt ut coin-sprites mot dessa frukter för att göra spelet mer färgglatt! Frukter kanske dessutom ger olika poäng och det kanske är slumpmässigt vilken frukt som spawnas?

Vissa frukter kanske tillochmed är power-ups som ger spelaren extra liv eller snabbare rörelse under en kort tid!

## Att dyka upp och försvinna med stil

I assets så hittar du även två animationer i `Main Characters` som heter `Appear` och `Disappear`. Dessa kan vi använda för att göra så att spelaren dyker upp med en snygg animation när spelet startar, och försvinner med stil när spelaren dör.

Du kan här använda dig av `onAnimationComplete` callbacken för att starta spelet när appear-animationen är klar, och för att avsluta spelet eller visa "Game Over" när disappear-animationen är klar.

```javascript
this.onAnimationComplete = (animationName) => {
    if (animationName === 'appear') {
        this.gameStarted = true
    } else if (animationName === 'disappear') {
        this.gameOver = true
    }
}
```

## Testfrågor

1. Förklara vad en sprite sheet är och varför vi använder dem istället för separata bildfiler för varje frame.
2. Om en sprite sheet är 480x32 pixels och varje frame är 32x32 pixels, hur många frames innehåller sprite sheet:en?
3. Vad gör modulo-operatorn (%) i uttrycket `frameIndex = (frameIndex + 1) % frames`? Förklara med ett exempel där frames = 4.
4. Varför behöver vi `frameTimer` och `frameInterval` i animationssystemet? Vad skulle hända om vi bara ökade `frameIndex` varje frame utan dessa?
5. Förklara de 9 parametrarna i `ctx.drawImage()` som används för sprite slicing. Vilka 4 parametrar bestämmer "källan" och vilka 4 bestämmer "destinationen"?
6. I `setAnimation()` metoden nollställer vi `frameIndex = 0`. Varför är detta viktigt? Ge ett exempel på vad som kan gå fel om vi inte gör detta.
7. Hur fungerar horizontal flip med canvas transforms? Förklara varför vi behöver både `translate()` och `scale(-1, 1)`.
8. Varför lägger vi animations-logiken i `GameObject` istället för att kopiera den till varje subklass (Player, Enemy, Coin)?
9. Förklara animation state priority i Player.update(). I vilken ordning kollar vi states (jump, fall, run, idle) och varför just den ordningen?

## Nästa steg
