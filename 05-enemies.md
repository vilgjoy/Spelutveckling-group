# Steg 5 - Enemies - Fiender och Health System

I detta steg lägger vi till fiender med enkel AI (diskutabelt vad som räknas som AI, att patrullera fram och tillbaka är intelligens?) och ett health-system för spelaren. Detta introducerar en ny gameloop i spelet, risk och utmaning.

## Översikt

För att skapa ett enemy-system behöver vi:
1. **Enemy-klass** - Fiender som patrullerar och skadar spelaren.
2. **Health system** - Spelaren har health som minskar vid skada.
3. **Invulnerability** - Diskutabelt om det behövs, men det förbättrar spelupplevelsen. Det ger spelaren en kort paus efter att ha tagit skada så att de inte omedelbart tar mer skada. Det här är såklart något spelaren kan utnyttja för att undvika mer skada när de plockar upp mynt.
4. **Kollision för fiender** - Fiender kolliderar med plattformar, skärmkanter och varandra.
5. **UI för health** - Visa spelarens hälsa. 

## Fiender, skurakar och andra hemskheter

Vid det här laget så bör du vara ganska inne i arbetssättet vi har för att utveckla nya delar i spelet. Vi skapar en `Enemy` klass som ärver från `GameObject`, i klassen kan vi sedan börja lägga till det som gör en fiende till en fiende.

```javascript
export default class Enemy extends GameObject {
    constructor(game, x, y, width, height, patrolDistance = null) {
        super(game, x, y, width, height)
        this.color = 'red'
        
        // Fysik,samma som Player
        this.velocityX = 0
        this.velocityY = 0
        this.isGrounded = false
        
        // Patrol AI
        this.startX = x
        this.patrolDistance = patrolDistance
        this.endX = patrolDistance !== null ? x + patrolDistance : null
        this.speed = 0.1
        this.direction = 1 // 1 = höger, -1 = vänster
        
        this.damage = 1 // Hur mycket skada fienden gör
    }

    update(deltaTime) {
        // Applicera gravitation
        this.velocityY += this.game.gravity * deltaTime
        
        // Applicera luftmotstånd
        if (this.velocityY > 0) {
            this.velocityY -= this.game.friction * deltaTime
            if (this.velocityY < 0) this.velocityY = 0
        }
        
        // Patruller när på marken
        if (this.isGrounded) {
            this.velocityX = this.speed * this.direction
            
            // Om vi har en patrolldistans, vänd vid ändpunkter
            if (this.patrolDistance !== null) {
                if (this.x >= this.endX) {
                    this.direction = -1
                    this.x = this.endX
                } else if (this.x <= this.startX) {
                    this.direction = 1
                    this.x = this.startX
                }
            }
        } else {
            this.velocityX = 0
        }
        
        // Uppdatera position
        this.x += this.velocityX * deltaTime
        this.y += this.velocityY * deltaTime
    }
}
```

### Viktiga delar:

- **Ärver från GameObject** - Får `markedForDeletion`, `intersects()`, `getCollisionData()`.
- **Fysik** - Gravity och friction appliceras precis som för Player. Vi har viss duplicering av kod här men det är okej.
- **isGrounded** - Patruller endast när fienden står på en plattform.
- **Konfigurerbar patrol** - `patrolDistance = null` betyder kontinuerlig rörelse tills kollision.
- **Direction** - Håller reda på vilken riktning fienden rör sig.
- **Damage property** - Varje fiende äger sin egen skademängd.

## Kollisionen och många objekt i Game.js

Logiken i Game.js börjar bli lite rörig med alla olika kollisionskontroller. Med fler objektstyper (fiender, power-ups, projektilel etc) kommer detta bara bli värre. Så lösningen på detta är att låta varje objekt hantera sin egen kollisionsrespons.
Vi iterar genom objekten i Game.js och kallar på deras respektive kollisionshanteringsmetoder.

### Player.handlePlatformCollision()

Den här koden är nu flyttad från Game.js till Player-klassen.

```javascript
handlePlatformCollision(platform) {
    const collision = this.getCollisionData(platform)
    
    if (collision) {
        if (collision.direction === 'top' && this.velocityY > 0) {
            this.y = platform.y - this.height
            this.velocityY = 0
            this.isGrounded = true
        } else if (collision.direction === 'bottom' && this.velocityY < 0) {
            this.y = platform.y + platform.height
            this.velocityY = 0
        } else if (collision.direction === 'left' && this.velocityX > 0) {
            this.x = platform.x - this.width
        } else if (collision.direction === 'right' && this.velocityX < 0) {
            this.x = platform.x + platform.width
        }
    }
}
```

### Enemy.handlePlatformCollision()

Precis som för spelaren så flyttar vi kollisionen med plattformar till fienden. Koden i sig är på det stora hela identisk koden för spelaren. Utifrån det kan vi senare göra en avvägning om vi vill konsolidera denna kod i en gemensam plats (t.ex. GameObject) eller behålla den duplicerad för tydlighetens skull.

```javascript
handlePlatformCollision(platform) {
    const collision = this.getCollisionData(platform)
    
    if (collision) {
        if (collision.direction === 'top' && this.velocityY > 0) {
            this.y = platform.y - this.height
            this.velocityY = 0
            this.isGrounded = true
        } else if (collision.direction === 'bottom' && this.velocityY < 0) {
            this.y = platform.y + platform.height
            this.velocityY = 0
        } else if (collision.direction === 'left' && this.velocityX > 0) {
            this.x = platform.x - this.width
            this.direction = -1 // Vänd riktning
        } else if (collision.direction === 'right' && this.velocityX < 0) {
            this.x = platform.x + platform.width
            this.direction = 1 // Vänd riktning
        }
    }
}
```

### Enemy.handleEnemyCollision()

För att fiender ska krocka med varandra så använder vi intersects metoden för att se om de krockar, om så är fallet så byter vi fiendens riktning.

```javascript
handleEnemyCollision(otherEnemy) {
    if (this.intersects(otherEnemy)) {
        this.direction *= -1
    }
}
```

### Enemy.handleScreenBounds()

Eftersom fienden patrullerar fram och tillbaka så vill vi att den ska vända när den når skärmens kanter (om den inte har en patrolDistance satt).

```javascript
handleScreenBounds(gameWidth) {
    if (this.patrolDistance === null) {
        if (this.x <= 0) {
            this.x = 0
            this.direction = 1
        } else if (this.x + this.width >= gameWidth) {
            this.x = gameWidth - this.width
            this.direction = -1
        }
    }
}
```

**Varför denna struktur?**
- Varje klass ansvarar för sin egen kollisionsrespons
- Game.js behöver bara organisera vilka objekt som ska kolla mot varandra
- Lättare att underhålla och utöka
- Följer de principer vi arbetar med, vem äger vad (Separation of Concerns). Spelklassen blir inte överbelastad med logik som inte hör hemma där.

## Att krocka med en fiende gör ont

För att skapa en känsla av fara så kan vi lägga till hälsa för spelaren som vi minskar när spelaren krockar med en fiende. Vi lägger också till en kort period av invulnerability efter att ha tagit skada för att förbättra spelupplevelsen.

```javascript
// Health system
this.maxHealth = 3
this.health = this.maxHealth
this.invulnerable = false // Immun mot skada
this.invulnerableTimer = 0
this.invulnerableDuration = 1000 // 1 sekund
```

### Player.takeDamage() metod

När spelaren krockar med en fiende anropar vi `takeDamage(amount)`. Metoden ansvarar för att minska health, sätta invulnerability och markera spelaren för borttagning om health når 0. Vi kan styra hur mycket skada spelaren tar genom att skicka in ett värde som parameter, det låter oss skapa fiender med olika skadenivåer i framtiden.

```javascript
takeDamage(amount) {
    if (this.invulnerable) return
    
    this.health -= amount
    if (this.health < 0) this.health = 0
    
    // Sätt invulnerability
    this.invulnerable = true
    this.invulnerableTimer = this.invulnerableDuration
    
    // Spelaren dör om health når 0
    if (this.health <= 0) {
        this.markedForDeletion = true
    }
}
```

Invulnerability förhindrar att spelaren tar skada flera gånger i snabb följd. Det ger även spelaren en chans att reagera efter att ha tagit skada samtidigt som spelaren kan utnyttja detta för att undvika mer skada när de plockar upp mynt.

### Invulnerability timer

Vår update metod använder hela tiden delta time för att räkna. Vi kan använda den för att skapa events som räknar med en timer. Detta passar perfekt för vår invulnerability period.

```javascript
if (this.invulnerable) {
    this.invulnerableTimer -= deltaTime
    if (this.invulnerableTimer <= 0) {
        this.invulnerable = false
    }
}
```

Timern räknar ner och när den når 0 kan spelaren skadas igen.

## Visuell feedback - berätta för spelaren att den är skadad / invulnerable

För att visa att spelaren är invulnerable så gör vi så att spelaren blinkar. Det är ett väldigt vanligt sätt att visa invulnerability i spel, så det är utmärkt att återanvända då detta mönster är välkänt av spelare.

```javascript
draw(ctx) {
    // Blinka när spelaren är invulnerable
    if (this.invulnerable) {
        const blinkSpeed = 100 // millisekunder per blink
        if (Math.floor(this.invulnerableTimer / blinkSpeed) % 2 === 0) {
            return // Skippa rendering för blink-effekt
        }
    }
    // ... normal rendering
}
```

**Hur det fungerar:**
- Delar `invulnerableTimer` med `blinkSpeed` (100ms)
- `Math.floor()` ger ett heltal
- `% 2` ger 0 eller 1 (jämnt eller udda)
- På jämna frames skippar vi rendering = blink

## Refaktoriserad kollisionshantering i Game.js

Game.js organiserar nu kollisionskontrollerna men varje objekt hanterar sin repons, det vill säga att vi har flyttat koden för plattformskollisioner till Player och Enemy klasserna. Förhoppningsvis ser du nyttan av det här direkt när du jämför koden i Game.js före och efter refaktoriseringen.

```javascript
// Spelarkollisioner med plattformar
this.player.isGrounded = false
this.platforms.forEach(platform => {
    this.player.handlePlatformCollision(platform)
})

// Fiendekollisioner
this.enemies.forEach(enemy => {
    enemy.isGrounded = false
    
    // Plattformskollisioner
    this.platforms.forEach(platform => {
        enemy.handlePlatformCollision(platform)
    })
    
    // Skärmkanter
    enemy.handleScreenBounds(this.width)
})

// Fiende-fiende kollisioner
this.enemies.forEach((enemy, index) => {
    this.enemies.slice(index + 1).forEach(otherEnemy => {
        enemy.handleEnemyCollision(otherEnemy)
        otherEnemy.handleEnemyCollision(enemy)
    })
})

// Spelaren tar skada från fiender
this.enemies.forEach(enemy => {
    if (this.player.intersects(enemy) && !enemy.markedForDeletion) {
        this.player.takeDamage(enemy.damage)
    }
})
```

**Varför intersects() för damage?**
- Vi behöver bara veta OM kollision sker
- Ingen riktning behövs (spelaren tar alltid skada)
- Enklare och snabbare än `getCollisionData()`

**Fördelar med denna struktur:**
- Game.js är tydligare och kortare
- Varje klass äger sin egen kollisionslogik
- Lätt att lägga till nya objekttyper
- Följer separation of concerns

## Berätta för spelaren hur mycket health den har kvar

Det är viktigt att spelaren vet hur mycket health den har kvar. Vi kan visa detta i UI genom att rita text och hjärtan som representerar health. I det här fallet gör vi båda, men det är valfritt.

Vi använder oss av en loop så att om vi ändrar `maxHealth` så anpassas UI automatiskt.

```javascript
// Rita health text
const healthText = `Health: ${this.game.player.health}/${this.game.player.maxHealth}`
ctx.fillText(healthText, 20, 100)

// Rita hälso-fyrkanter
for (let i = 0; i < this.game.player.maxHealth; i++) {
    const heartX = 20 + i * 30
    const heartY = 110
    
    if (i < this.game.player.health) {
        ctx.fillStyle = '#FF0000' // Fyllt hjärta
    } else {
        ctx.fillStyle = '#333333' // Tomt hjärta
    }
    
    ctx.fillRect(heartX, heartY, 20, 20)
}
```

## Testa spelet

Nu kan du:
1. **Undvik fiender** - Röda fiender patruller
erar på plattformar
2. **Ta skada** - Spelaren blinkar och förlorar health
3. **Se health** - UI visar health som text och hjärtan
4. **Invulnerability** - Du kan inte ta skada direkt efter en hit

## Uppgifter

### En räserfiende

Testa nu att skapa olika typer av fiender, det kan vara en snabbare fiende som gör mindre skada, eller en starkare fiende som gör mer skada.
Du har kontroll över dessa egenskaper via `speed` och `damage` properties i Enemy-klassen.

### Hälsa och power-ups

Lägg till en power-up som återställer spelarens health när den plockas upp. Du kan skapa en ny klass `HealthPack` som ärver från `GameObject` och när spelaren krockar med den så ökar du spelarens health.
Du kan begränsa health till maxHealth så att den inte ökar för mycket.

Du kan också prova att göra en power-up som ger spelaren temporär ökad speed eller minskad skada från fiender. Du får då utgå från koden där vi skapade en timer för invulnerability. Hur kan du använda samma mönster för att skapa en temporär buff?

#### En health-bar

Om du vill så kan du testa att skapa en health-bar istället för hjärtan. En health-bar är en rektangel som fylls upp baserat på spelarens health. Du kan rita en rektangel med bredd baserad på `(player.health / player.maxHealth) * this.totalBarWidth`.

### Jakten på spelaren

Du kanske vill prova att skapa en fiende som jagar spelaren istället för att patrullera. Här är ett enkelt exempel på hur du kan implementera detta i `update()` metoden för en ny fiendetyp:

```javascript
// Följe AI - jagar spelaren
update(deltaTime) {
    if (this.player.x < this.x) {
        this.x -= this.speed * deltaTime
    } else {
        this.x += this.speed * deltaTime
    }
}
```

### Krocka med känsla

Ett sätt att få interaktionen att kännas bättre är att lägga till knockback när spelaren tar skada. Detta kan göras genom att justera spelarens velocity när `takeDamage()` anropas.

```javascript
takeDamage(amount, knockbackX = 0) {
    if (this.invulnerable) return
    
    this.health -= amount
    this.invulnerable = true
    this.invulnerableTimer = this.invulnerableDuration
    
    // Knockback
    this.velocityX = knockbackX
    this.velocityY = -0.3 // Studsa upp lite
}
```

### En fiende med massor av hälsa

Det här kräver att vi lägger till en `health` property i Enemy-klassen och en `takeDamage()` metod som minskar fiendens health när den träffas av spelaren (t.ex. via ett projektil). När health når 0 så markeras fienden för borttagning.

Du kan börja med implementeringen genom att göra så att fienden tar skada precis som spelaren gör när de krockar.

```javascript
// I Enemy.js
this.health = 3

takeDamage(amount) {
    this.health -= amount
    if (this.health <= 0) {
        this.markedForDeletion = true
        // Spawna coin eller poäng
    }
}
```

### Hoppa på fiender

Vi har i systemet redan metoden för att kontrollera från vilket håll spelaren krockar med fienden. Använd detta för att implementera att spelaren kan hoppa på fiender för att skada dem istället för att ta skada själv.

Du får då använda `getCollisionData()` för att avgöra om spelaren krockar med fienden från toppen. Om så är fallet så anropar du fiendens `takeDamage()` metod och studsar spelaren uppåt.

## Sammanfattning

I detta steg har vi lagt till fiender med enkel patrullerande AI och ett health-system för spelaren. Vi har också implementerat invulnerability efter att ha tagit skada för att förbättra spelupplevelsen. Kollisioner hanteras nu av respektive objekt, vilket gör koden mer organiserad och lättare att underhålla. Slutligen har vi lagt till visuell feedback för spelarens health i UI.


## Testfrågor

1. Varför använder Enemy `markedForDeletion` även om vi inte dödar fiender än? Hur förbereder detta för framtida funktionalitet?
2. Förklara hur patrol AI fungerar. Vad händer när fienden når `endX` eller `startX`?
3. Varför behöver vi `invulnerable` flaggan? Vad skulle hända utan den?
4. Varför äger Enemy sitt eget `damage`-värde istället för att ha det i Game? (Separation of concerns)
5. Förklara skillnaden mellan hur vi använder `intersects()` för coins vs enemies. Varför samma metod men olika beteende?
6. Beskriv flödet från att spelaren kolliderar med en fiende till att spelaren blinkar. Vilka metoder anropas i vilken ordning?
