# Enemies - Fiender och Health System

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

### takeDamage() metod

När spelaren krockar med en fiende anropar vi `takeDamage()`. Metoden ansvarar för att minska health, sätta invulnerability och markera spelaren för borttagning om health når 0.

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

## 5. Kollisioner i Game.js - Simplified

Game.js organiserar kollisionskontroller och låter objekten hantera sin respons:

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

## 6. UI för Health

Vi uppdaterar `UserInterface` för att visa health:

```javascript
// Rita health text
const healthText = `Health: ${this.game.player.health}/${this.game.player.maxHealth}`
ctx.fillText(healthText, 20, 100)

// Rita health bars som hjärtan
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

**Visuell representation:**
- Text visar exakt värde (3/3)
- Hjärtan ger snabb visuell feedback
- Röda = health kvar, grå = förlorad health

## 7. Game Over State

När `health <= 0` markeras spelaren för borttagning:

```javascript
if (this.health <= 0) {
    this.markedForDeletion = true
}
```

**För senare implementation:**
- Detektera när spelaren är borttagen
- Visa "Game Over" skärm
- Reset/Restart funktionalitet

## Testa spelet

Nu kan du:
1. **Undvik fiender** - Röda fiender patruller
erar på plattformar
2. **Ta skada** - Spelaren blinkar och förlorar health
3. **Se health** - UI visar health som text och hjärtan
4. **Invulnerability** - Du kan inte ta skada direkt efter en hit
5. **Dö** - När health når 0 försvinner spelaren

## Förbättringar och utvidgningar

### 1. Olika fiendetyper

```javascript
class FastEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, 30, 30)
        this.speed = 0.2 // Snabbare
        this.damage = 1
        this.color = '#FF6666'
    }
}

class StrongEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, 60, 60)
        this.speed = 0.05 // Långsammare
        this.damage = 2 // Mer skada
        this.color = '#CC0000'
    }
}
```

### 2. Health pickups

```javascript
class HealthPickup extends GameObject {
    constructor(game, x, y) {
        super(game, x, y, 20, 20)
        this.healAmount = 1
        this.color = '#00FF00'
    }
}

// I Game.js
if (this.player.intersects(healthPickup)) {
    this.player.health = Math.min(
        this.player.health + healthPickup.healAmount,
        this.player.maxHealth
    )
    healthPickup.markedForDeletion = true
}
```

### 3. Olika AI-beteenden

```javascript
// Följe AI - jagar spelaren
update(deltaTime) {
    if (this.player.x < this.x) {
        this.x -= this.speed * deltaTime
    } else {
        this.x += this.speed * deltaTime
    }
}

// Jump AI - hoppar periodiskt
if (this.isGrounded && Math.random() < 0.01) {
    this.velocityY = -0.5
}
```

### 4. Knockback effekt

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

### 5. Fiender med health

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

## Designmönster

### 1. markedForDeletion för Game Over

Använder samma mönster för spelarens död:
```javascript
// Player tar dödlig skada
this.markedForDeletion = true

// Game upptäcker detta (senare implementation)
if (this.player.markedForDeletion) {
    this.gameOver = true
}
```

### 2. Timer Pattern

Invulnerability timer är ett vanligt mönster:
```javascript
// Sätt timer
this.timer = this.duration

// Räkna ner
this.timer -= deltaTime

// Kolla om klar
if (this.timer <= 0) {
    // Timer klar
}
```

Användbart för:
- Cooldowns
- Buff/debuff duration
- Animations
- Delayed events

### 3. Separation of Concerns - Refactored

**Enemy äger:**
- Sin AI och rörelse
- Sitt damage-värde
- Sin rendering
- Sin kollisionsrespons (handlePlatformCollision, handleEnemyCollision, handleScreenBounds)

**Player äger:**
- Sin health
- Invulnerability state
- Hur skada tas emot
- Sin kollisionsrespons (handlePlatformCollision)

**Game ansvarar för:**
- Organisera kollisionskontroller (vilka objekt ska kolla mot varandra)
- Kalla på `takeDamage()` när spelaren träffar fiende
- Cleanup av borttagna objekt

Detta gör det enkelt att ändra eller utöka varje del oberoende. Om vi vill ändra hur en fiende reagerar på kollisioner behöver vi bara ändra i Enemy-klassen.

## Nästa steg

Med enemies på plats kan vi nu lägga till:
- **Projectiles** - Spelaren kan skjuta på fiender
- **Enemy health** - Fiender kan dö
- **Spawn system** - Fiender spawnar över tid
- **Score för döda fiender** - Poäng när fiender dör

## Testfrågor

1. **Varför använder Enemy `markedForDeletion` även om vi inte dödar fiender än? Hur förbereder detta för framtida funktionalitet?**

2. **Förklara hur patrol AI fungerar. Vad händer när fienden når `endX` eller `startX`?**

3. **Varför behöver vi `invulnerable` flaggan? Vad skulle hända utan den?**

4. **Hur fungerar blink-effekten matematiskt? Förklara `Math.floor(this.invulnerableTimer / blinkSpeed) % 2`.**

5. **Varför äger Enemy sitt eget `damage`-värde istället för att ha det i Game? (Separation of concerns)**

6. **Vad händer om `health` blir negativ? Varför kontrollerar vi `if (this.health < 0) this.health = 0`?**

7. **Förklara skillnaden mellan hur vi använder `intersects()` för coins vs enemies. Varför samma metod men olika beteende?**

8. **I takeDamage(), varför sätter vi `markedForDeletion = true` istället för att direkt ta bort spelaren från spelet?**

9. **Hur skulle du implementera knockback när spelaren tar skada? Vilka properties behöver ändras?**

10. **Beskriv flödet från att spelaren kolliderar med en fiende till att spelaren blinkar. Vilka metoder anropas i vilken ordning?**
