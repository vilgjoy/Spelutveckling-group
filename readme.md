# Spelmotor för 2D-spel

## Introduktion

Vi ska jobba med spel och spelutveckling! I det här repot går vi steg för steg igenom hur du skapar en spelmotor samtidigt som du använder den till ett spel. Tanken är att du ska se hur arbetet med att skapa spel är iterativt, det vill säga att man bygger spelet i små, hanterbara delar som tillsammans blir ett komplett spel. Vi lägger alltså till bit för bit allt eftersom vi går igenom repot, det kan kallas för inkrementell utveckling.

### Varför bygger vi ett spel?

För dig som elev är målet förmodligen att **skapa ett kul spel**. Men bakom kulisserna lär du dig något ännu viktigare: **Objektorienterad Programmering (OOP)** och modulär arkitektur - färdigheter som används i alla större programmeringsprojekt, inte bara spel.

### Iterativ och inkrementell utveckling

Vi bygger spelet i **små, testbara steg**:
1. Först får vi något att visas på skärmen (MVP - Minimum Viable Product)
2. Sedan lägger vi till rörelse
3. Därefter kollision
4. Sen fysik som gravitation
5. Och så vidare...

Varje steg ger ett **fungerande spel** som du kan testa direkt. Vi använder **placeholders** - enkla rektanglar och former - tills strukturen är på plats. Sen kan vi byta ut grafiken när vi vill.

Detta arbetssätt kallas **iterativ utveckling** och är standarden i spelindustrin. Det minskar risken för stora misstag och ger kontinuerlig feedback.

### Vad lär du dig egentligen?

**Objektorienterad Programmering (OOP):**
- **Klasser och Instanser** - En klass är en ritning, ett objekt är en konkret instans av den ritningen
- **Arv (Inheritance)** - `Player` ärver från `GameObject`, vilket betyder "en spelare ÄR EN typ av spelobjekt"
- **Inkapsling (Encapsulation)** - Varje klass äger sina egna data och beteenden. `Coin` vet sitt eget värde, `Enemy` äger sin skada
- **Separation of Concerns** - Varje klass har ett tydligt ansvar. Game organiserar, Player hanterar spelarens logik, Enemy hanterar fiendens logik

**Arkitekturmönster:**
- **Game Loop** - Hur spel uppdateras 60 gånger per sekund
- **Component Pattern** - Bygga komplexa objekt från enkla delar
- **State Management** - Hantera spelets tillstånd (score, health, etc.)

## Setup

Vi använder [Vite](https://vitejs.dev/) för snabb utveckling med moderna JavaScript-funktioner och modulhantering:

```bash
npm create vite@latest
```

Men det är redan gjort i  detta repo, så du kan klona det direkt och börja utveckla ditt spel.

```bash
git clone <repo-url>
cd <repo-directory>
npm install
npm run dev
```

### Filstruktur

- `index.html`: Huvud-HTML-filen som laddar spelet.
- `src/`: Källkoden för spelet.
  - `Game.js`: Huvudklassen för spelet som hanterar spelloopen och spelobjekten.
  - `GameObject.js`: Bas-klass för alla spelobjekt.
  - `Rectangle.js`: Exempel på ett spelobjekt som är en rektangel.
  - `InputHandler.js`: Hanterar användarinput från tangentbordet.
- `style.css`: Grundläggande CSS för spelet.

### Kodstil

I det här projektet så använder vi import och export för att hantera moduler. Varje klass är sin egen fil och importeras där den behövs.

**Namnkonventioner:**
- Variabler och funktioner: `camelCase` (t.ex. `deltaTime`, `gameObjects`)
- Klasser: `PascalCase` (t.ex. `GameObject`, `Rectangle`)
- Klassfiler: `PascalCase.js` (t.ex. `Game.js`, `GameObject.js`)
- Konstanter: `UPPER_SNAKE_CASE` (t.ex. `MAX_SPEED`, `CANVAS_WIDTH`)

**Kodformat:**
- Inga semikolon i slutet av rader (modern JavaScript-standard)
- 4 mellanslag för indentering
- En klass per fil

## Förklaring av koden

Här är en överblick över strukturen i `main` branchen - vår utgångspunkt:

### main.js - Spelets startmotor

Denna fil startar spelet genom att skapa en instans av `Game`-klassen och initiera **game loopen**. Detta är den centrala loop som körs 60 gånger per sekund och uppdaterar samt ritar om allt i spelet.

**Game loop är fundamentalt i spelutveckling:**
```
while (spelet körs) {
    1. Läs input
    2. Uppdatera spellogik
    3. Rita allt på skärmen
}
```

Det praktiska **gameloop** som gör att vårt spel körs är inte att förväxla med när vi pratar om en **gameloop** i spelet. När vi pratar om en gameloop i spelet menar vi den logik som styr spelets gång. Med det menas vad spelaren gör och upplever. Den **gameloop** som spelaren uppelever kan förklaras utifrån vad som sker i spelet, vad som får spelaren att reagera och hur spelet förändras över tid. Det kan vara sådant som att plocka upp objekt, undvika fiender, samla poäng, och så vidare.

Gameloopen i main.js är den faktiska koden som körs varje frame för att uppdatera och rita spelet.

### Game.js - Spelets koordinator och hjärta

`Game`-klassen är **spelkontrollern** - den organiserar och koordinerar alla andra objekt. Den ansvarar för:
- **Skapandet av spelobjekt** - Instansierar Player, Platform, Coin, Enemy
- **Uppdateringsloopen** - Kallar på `update()` för alla objekt
- **Rendering** - Kallar på `draw()` för alla objekt
- **Kollisionshantering** - Organiserar vilka objekt som ska kolla kollision mot varandra

**Viktigt OOP-koncept:** Game äger inte logiken för *hur* en spelare rör sig eller *hur* en kollision hanteras - den bara **organiserar** när dessa saker ska hända. Detta är **Separation of Concerns** i praktiken.

### GameObject.js - Basklassen (Superclass)

Detta är spelets **ritning** som alla andra spelobjekt bygger på. Den definierar:
- **Grundläggande attribut**: position (x, y), storlek (width, height)
- **Delade metoder**: `intersects()` för kollision, `getCollisionData()` för detaljerad kollision
- **Lifecycle-metoder**: `update()` och `draw()` som alla barn-klasser kan överrida

**OOP-koncept i praktiken:**
- **Arv (Inheritance)**: Player, Enemy, Coin ärver alla från GameObject, det gör att vi vet att alla dessa objekt har en position och storlek.
- **Polymorfism**: Varje klass implementerar `draw()` på sitt eget sätt, men Game kan kalla alla med samma metod. Det underlättar när vi vill rita ut objekt i spelloopen. Vi behöver inte bry oss om *hur* varje objekt ritas, bara att det har en `draw()` metod.
- **Inkapsling**: GameObject döljer komplexiteten av kollisionsdetektering bakom enkla metoder. Det gör att vår kod blir renare och lättare att underhålla. Med det menas att vi enklare kan veta var "något sker" när vi behöver ändra eller felsöka objekt.

### Rectangle.js - En konkret implementation

Ett exempel på hur man skapar en **konkret klass** genom arv från GameObject. Den:
- **Ärver** alla egenskaper från GameObject
- **Implementerar** sin egen `draw()` metod för att rita en rektangel
- **Utökar** funktionaliteten genom att lägga till färg

Detta är en **placeholder** - en enkel form vi använder för att testa strukturen innan vi lägger till komplexa grafik.

### InputHandler.js - Separat ansvar

En specialiserad klass som **endast** hanterar tangentbordsinput. Den:
- Lyssnar på tangentbordsevent
- Sparar status för nedtryckta tangenter i en `Set`
- Tillhandahåller metoder för att fråga vilka tangenter som är aktiva

**Separation of Concerns:** InputHandler vet inget om spelet. Player vet inget om hur input detekteras. De kommunicerar via ett enkelt gränssnitt.

## Uppgifter

### Rita något med rektanglar!

**Du lär dig hur du skapar spelobjekt och positionerar dem i spelet.**

Använd Rectangle-klassen för att skapa något med rektanglar. Det kan vara ett hus, en bil, ett träd eller vad du vill. Använd din fantasi!

Du kan styra canvasets bakgrundsfärg genom att ändra `style.css`-filen.

### En ny form

**Du lär dig hur du skapar egna spelobjekt genom arv.**

Skapa en ny klass som ärver från GameObject, till exempel en cirkel eller en triangel. Implementera dess egna render-metod för att rita den på canvas. Lägg sedan till några instanser av denna nya klass i spelet och se hur de beter sig tillsammans med rektanglarna.

För att rita cirklar på canvas så behöver du använda `arc`-metoden.

```javascript
ctx.beginPath();
ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
ctx.fill();
```

### Visa tid

**Du lär dig hur du ritar text på canvas.**

Rita en text på canvas som visar hur många sekunder spelet har varit igång. Använd `fillText`-metoden på canvas-kontexten för att rita text.

```javascript
ctx.fillStyle = 'black';
ctx.font = '20px Arial';
ctx.fillText(`Tid: ${(this.elapsedTime / 1000).toFixed(2)} s`, 10, 30);
```

### Kombinera former för att rita en figur

**Du lär dig hur du kombinerar ritmetoderna och placerar dem i spelet för att skapa en mer komplex figur.**

Använd både rektanglar och din nya form (t.ex. cirklar) för att skapa en mer komplex figur, som en robot eller ett djur. Placera formerna på rätt positioner för att få dem att se ut som en enhetlig figur.

Om du önskar kan du placera figuren i en separat klass som hanterar dess delar och deras positioner relativt till varandra.

```
   .---.
  /     \
 | o   o |
 |   ^   |
 \_/\_/\_/
 ```

## Sammanfattning

Det här repot ger en grundläggande struktur för att skapa 2D-spel med JavaScript och HTML5 Canvas. Genom att använda klasser och moduler kan vi organisera koden på ett tydligt sätt och enkelt utöka funktionaliteten. 

### Testfrågor

Innan du går vidare, testa din förståelse:

1. **OOP Grundkoncept:** Vad är de tre huvudsakliga ansvarsområdena för Game-klassen? Hur relaterar detta till Separation of Concerns?
2. **Game Loop:** Vad betyder deltaTime och varför används det i uppdateringsloopen? Vad skulle hända om vi inte använde det?
3. **Klasser och Instanser:** Vilka tre egenskaper definierar position och storlek i GameObject-klassen? Varför definieras de i basklassen istället för i varje subklass?
4. **Arv (Inheritance):** Hur fungerar arv i spelmotorn? Ge ett exempel på en "är-en" relation (t.ex. "En Player ÄR EN GameObject").
5. **Kodstil:** Vilken namnkonvention används för konstanter och ge ett exempel? Varför är konsekventa namnkonventioner viktiga?
6. **Game Loop igen:** Vad händer i main.js och varför behövs requestAnimationFrame? Hur ofta körs game loopen?
7. **State Management:** Hur sparar InputHandler information om nedtryckta tangenter? Varför använder vi en `Set` istället för en array?
8. **Rendering:** Vilken Canvas-metod rensar skärmen mellan varje frame och varför behövs det?

**Reflektionsfrågor:**
- Varför är det viktigt att separera InputHandler från Player-klassen?
- Hur hjälper arv oss att undvika kodduplicering?
- Vad menar vi med "placeholder" grafik och varför är det smart att börja med enkla former?

## Nästa steg

För att fortsätta med nästa steg så behöver du byta branch till `01-player`. Du kan göra det genom att ändra branch längst ned i vänstra hörnet i VSCode, eller genom att köra följande kommando i terminalen:

```bash
git checkout 01-player
```

Läs sedan **[Steg 1 - Player](01-player.md)** för att fortsätta!