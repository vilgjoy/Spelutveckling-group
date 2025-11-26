# Steg 1 - Player

I den här delen skapar vi en `Player`-klass som ärver från `GameObject`. Denna klass representerar spelaren i spelet och hanterar dess rörelse och rendering.

## Vad lär vi oss?

I detta steg fokuserar vi på:
- **Arv (Inheritance)** - Player är ett GameObject.
- **Inkapsling (Encapsulation)** - Player äger sin egen rörelsefunktionalitet.
- **Separation of Concerns** - Input, logik och rendering är separerade men samverkar.
- **DeltaTime** - Framerate-oberoende rörelse.

Klassen använder `InputHandler` för att läsa av tangentbordsinput och uppdatera spelarens position baserat på detta.

### Tankesätt: Komponentbaserad design

Även om vi använder arv här, är det värt att fundera på hur `Player`-klassen faktiskt innehåller flera olika **ansvarsområden**:
- **Rörelse/Fysik** - Hastighet, position, deltaTime
- **Input-hantering** - Läsa tangentbordet
- **Rendering** - Rita ut spelaren

I större spelmotorer (som Unity eller Unreal) använder man ofta **Component Pattern** där varje ansvarsområde är en separat komponent:
```
Player (GameObject)
├── PhysicsComponent (hanterar rörelse)
├── InputComponent (läser input)
└── RenderComponent (ritar grafik)
```

Detta kallas **komposition** ("har-en" relation) istället för **arv** ("är-en" relation).

**Varför nämner vi detta?**
- Just nu är allt hårdkodat i Player-klassen, vilket fungerar bra för enkla spel
- Men om vi vill ha 10 olika fiender med olika beteenden blir arv problematiskt
- Komposition är mer flexibelt: "En fiende HAR EN AI-komponent" istället av "En fiende ÄR EN GameObject ÄR EN MovingObject ÄR EN..."

Vi kommer se fördelarna med komposition när vi senare lägger till `handlePlatformCollision()` - det är faktiskt ett steg mot komponentbaserad design! Det är alltså båda delar av att jobba objektorienterat, men det komponentbaserade tänker är en vidareutveckling av grundläggande OOP-principer som löser problem som kan uppstå med arv i större system (spel).

## Konstruktor - Inkapsling i praktiken

Konstruktorn tar emot `game`-instansen samt position och storlek för spelaren. Den initierar även hastighet och riktning.

```javascript
    constructor(game, x, y, width, height, color = "green") {
        super(game, x, y, width, height)
        this.color = color
        
        // Nuvarande hastighet (pixels per millisekund)
        this.velocityX = 0
        this.velocityY = 0

        // Rörelsehastighet (hur snabbt spelaren accelererar/rör sig)
        this.moveSpeed = 0.5
        this.directionX = 0
        this.directionY = 0
    }
```

**OOP-principer här:**
- **Inkapsling**: Alla spelarens egenskaper är samlade i klassen. Inget annat objekt kan direkt ändra `velocityX` - det måste ske genom Player-klassens metoder
- **Default-värden**: `color = "green"` är en standardparameter - vi kan skapa en grön spelare utan att ange färg
- **Arv**: `super()` anropar GameObject's konstruktor och initierar de delade egenskaperna (x, y, width, height)

**Reflektion:** Varför separera `velocity` (nuvarande hastighet) från `moveSpeed` (maxhastighet)? Detta förbereder för mer avancerad fysik där acceleration och friktion påverkar hastigheten.

## Uppdateringsmetod - Game Loop i praktiken

I uppdateringsmetoden händer det en hel del. Vi kollar vilka tangenter som är nedtryckta och uppdaterar spelarens hastighet och riktning baserat på detta. För att flytta spelaren så sätter vi först `velocity` till `moveSpeed` när en tangent är nedtryckt, annars sätter vi den till 0. Sedan uppdaterar vi positionen baserat på hastigheten och `deltaTime`. Vi använder `deltaTime` för att göra rörelsen framerate-oberoende.

```javascript
    update(deltaTime) {
        // Kolla input för rörelse
        if (this.game.input.isKeyPressed('ArrowUp')) {
            this.velocityY = -this.moveSpeed
            this.directionY = -1
        } else if (this.game.input.isKeyPressed('ArrowDown')) {
            this.velocityY = this.moveSpeed
            this.directionY = 1
        } else {
            this.velocityY = 0
            this.directionY = 0
        }

        // ... samma för vänster och höger

        // Uppdatera position baserat på hastighet
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
    }
```

**Separation of Concerns:**
1. **Input Layer**: `this.game.input.isKeyPressed()` - vi frågar InputHandler om status
2. **Logic Layer**: Vi uppdaterar velocity baserat på input
3. **Physics Layer**: Vi applicerar velocity på position med deltaTime

**Viktigt mönster:** Vi hanterar X- och Y-rörelsen i **separata if-satser** istället för `else if`. Varför?
- Så spelaren kan röra sig diagonalt!
- Om vi använde `else if` skulle spelaren bara kunna röra sig i en riktning åt gången

**DeltaTime-principen:**
```javascript
this.x += this.velocityX * deltaTime
```
Detta gör rörelsen **framerate-oberoende**. Om spelet kör 60 FPS eller 30 FPS spelar ingen roll - spelaren rör sig lika snabbt. DeltaTime kompenserar för variationen mellan frames.

**Komponenttänk:** 
Tänk dig att denna update-metod faktiskt gör tre saker:
1. Läser input → (skulle kunna vara InputComponent)
2. Uppdaterar velocity → (skulle kunna vara MovementComponent)  
3. Applicerar velocity på position → (skulle kunna vara PhysicsComponent)

I en mer modulär design skulle varje del vara separat!

### Stoppa spelaren från att gå utanför canvas

Om du vill kan du lägga till kod för att stoppa spelaren från att gå utanför canvasens gränser. Lägg till följande kod i slutet av `update`-metoden men innan vi uppdaterar positionen för spelaren.

```javascript
// stoppa från att gå utanför canvas
if (this.x < 0) this.x = 0
if (this.x + this.width > this.game.width) this.x = this.game.width - this.width
if (this.y < 0) this.y = 0
if (this.y + this.height > this.game.height) this.y = this.game.height - this.height
```

## Renderingsmetod - Presentation Layer

I draw ritar vi ut spelaren som en rektangel. Detta sker likadant som i `Rectangle`-klassen vi skapade tidigare. Men här lägger vi även till ögon som "tittar" i den riktning spelaren rör sig.

**Varför ögon med riktning?**
- Ger spelaren **karaktär** och **feedback** till spelaren
- Visar tydligt vilket håll spelaren rör sig
- Visuell användning av `directionX` och `directionY` som sätts i update()

**Separation mellan State och Presentation:**
- `update()` sätter `directionX` och `directionY` (game state)
- `draw()` använder dessa värden för att rita (presentation)
- Detta är **Model-View** separation - logiken vet inte om rendering, rendering vet inte om logik

För att flytta på ögonen använder vi `directionX` och `directionY` som vi satte i `update`-metoden:

```javascript
// Rita pupiller som "tittar" i rörelseriktningen
ctx.fillRect(
    this.x + this.width * 0.25 + this.directionX * this.width * 0.05,
    this.y + this.height * 0.25 + this.directionY * this.width * 0.05,
    this.width * 0.1,
    this.height * 0.1
)
```

**Komponenttänk:** Denna draw-metod är vår "RenderComponent". Den vet bara hur man ritar spelaren, inte hur den rör sig eller tar input.

### Rita mun

I slutet av `draw`-metoden så ritar vi även en mun som ett streck. Detta gör vi med hjälp av `beginPath`, `moveTo`, `lineTo` och `stroke`-metoderna på canvas-kontexten.

```javascript
        // rita mun som ett streck
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(this.x + this.width * 0.3, this.y + this.height * 0.65)
        ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.65)
        ctx.stroke()
```

Detta ger spelaren ett enkelt ansikte med ögon och mun, vilket gör den mer levande och karaktärsfull.

## Uppgifter

### Glad och ledsen mun

**Du lär dig att rita med canvas-metoder och styra beteende**

Hur kan vi göra spelarens mun mer uttrycksfull? Experimentera med ritmetoderna för att göra munnen glad eller ledsen. Testa att styra det med inputs, eller varför inte göra spelaren ledsen när den inte rör sig?

### Animationer

**Du lär dig att kontrollera animationer och tidsbaserat beteende**

Kan du göra spelaren mer levande genom att lägga till animationer? Till exempel att ögonen blinkar, munnen rör sig, eller att spelaren "hoppar" när den rör sig snabbt?

Att få animationer att fungera kräver ofta att du håller koll på tid och tillstånd. Fundera på hur du kan använda `deltaTime` för att styra när en animation ska spelas upp eller ändras. Du behöver alltså någon form av timer eller räknare som uppdateras i `update()` och används i `draw()` för att byta mellan olika animationstillstånd.

### Accelererande rörelse

**Du lär dig hur du jobbar med tidsbaserat beteende och fysik**

Istället för att spelaren direkt får full hastighet när en tangent trycks ned, försök implementera mjuk acceleration och inbromsning. Detta ger en mer realistisk känsla.

Utgå då från att du har en `acceleration`-egenskap och en `friction`-egenskap i konstruktorn, och uppdatera hastigheten i `update`-metoden baserat på dessa. Det vill säga att innan du nått maxhastigheten så ökar du hastigheten med `acceleration` varje frame när en tangent är nedtryckt. När ingen tangent är nedtryckt så minskar du hastigheten med `friction` tills den når 0.

## Sammanfattning

I den här filen har vi skapat en `Player`-klass som hanterar spelarens rörelse och rendering. Vi har använt `InputHandler` för att läsa av tangentbordsinput och uppdaterat spelarens position baserat på detta.

Vi har även gett spelaren ett enkelt ansikte med ögon som tittar i rörelseriktningen för att göra den mer karaktärsfull. Du har nu en grund för att skapa ett spel där spelaren kan röra sig runt på canvasen.

### Testfrågor

**OOP och Arkitektur:**
1. **Arv vs Komposition:** Förklara skillnaden mellan "Player ÄR EN GameObject" (arv) och "Player HAR EN PhysicsComponent" (komposition). Vilka fördelar har respektive?
2. **Separation of Concerns:** Identifiera tre separata ansvarsområden i Player-klassen. Hur skulle dessa kunna separeras till egna komponenter?
3. **Inkapsling:** Varför är det bra att velocityX och velocityY är privata properties i Player? Vad skulle hända om Game.js kunde ändra dem direkt?

**Tekniska koncept:**
4. **Diagonal rörelse:** Varför hanterar vi X- och Y-rörelsen i separata if-satser istället för att använda `else if`? Vad händer om vi ändrar till else if?
5. **DeltaTime:** Förklara varför `this.x += this.velocityX * deltaTime` gör rörelsen framerate-oberoende. Vad händer utan deltaTime?
6. **Rendering:** Hur används `directionX` och `directionY` för att få ögonen att "titta" åt rätt håll? Varför sätts dessa i update() istället för draw()?
7. **Boundary checking:** Hur fungerar koden som stoppar spelaren från att gå utanför canvasens gränser? Varför subtraherar vi width när vi kollar höger kant?

**Design och arkitektur:**
8. **State vs Presentation:** Ge exempel på hur Player separerar "game state" (data) från "presentation" (rendering). Varför är denna separation viktig?
9. **Monolitisk hierarki:** Om vi skulle skapa Enemy, NPC, Boss - alla med liknande rörelse men olika AI - skulle arv från GameObject räcka? Diskutera problematiken.
10. **Canvas-metoder:** Vilka Canvas-metoder används för att rita spelarens mun som ett streck? Varför beginPath() och stroke()?

**Reflektionsfrågor:**
- Hur skulle du implementera "Player HAR EN InputComponent" istället för att läsa input direkt i update()?
- Varför är placeholder-grafik (enkla rektanglar) bra när vi utvecklar spellogiken?
- Om 10 olika fiender alla behöver rörelse, rendering och AI - är arv den bästa lösningen?

## Nästa steg

**Vad du lärt dig:**
- Arv från GameObject
- Inkapsling av spelarens egenskaper
- Separation mellan input, logik och rendering
- DeltaTime för framerate-oberoende rörelse
- Första steget mot komponentbaserad design

**Nästa:** Kollisionsdetektering - hur spelaren kan interagera med andra objekt!

Byt till `02-collision` branchen:

```bash
git checkout 02-collision
```

Läs sedan **[Steg 2 - Collision](02-collision.md)** för att fortsätta!