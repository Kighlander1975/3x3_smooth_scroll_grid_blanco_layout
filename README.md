# 3x3 Smooth Scroll Grid Blanco-Layout

[![License: CC BY-NC 4.0](https://img.shields.io/badge/license-CC--BY--NC%204.0-blue.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
![Responsive](https://img.shields.io/badge/Responsive-Yes-2ecc71?logo=responsive&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=fff&style=flat)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=fff&style=flat)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=222&style=flat)

Ein modernes, responsives 3x3-Grid-Layout mit sanfter, eingerasteter
Navigation, Tastatursteuerung, Desktop-Hot-Zones und Mobile-Swipe.

Das Layout eignet sich als Blanco-Grundlage fuer kreative Onepager,
Landingpages, Portfolios, experimentelle Startseiten oder interaktive
Web-Oberflaechen, die nicht klassisch von oben nach unten aufgebaut sind.

Die aktuelle Projektvariante wird als Prototyp fuer verschachtelte Scroll-,
Drag- und Pager-Interaktionen weiterentwickelt.

![Made with Love](https://img.shields.io/badge/Made%20with-%E2%9D%A4-red)

---

## Grundidee

Das Layout besteht aus neun vollwertigen Sections in einem festen 3x3-Raster:

```text
1 2 3
4 5 6
7 8 9
```

Jede Section bildet eine eigene Viewport-Flaeche. Die aktuelle Startseite ist
Section 5 in der Mitte.

Die Navigation springt immer exakt von einer Section zur naechsten. Sichtbare
Zwischenpositionen sollen nicht dauerhaft bestehen bleiben.

## Features

- **3x3 Grid:** Neun Sections in einem festen Raster.
- **Eingerastete Navigation:** Zielpositionen werden zentral aus dem Raster berechnet.
- **Hash-Navigation:** `#section-1` bis `#section-9` funktionieren direkt.
- **Startseite:** Section 5 ist die aktuelle Default-Startsection.
- **Desktop-Hot-Zones:** Unsichtbare Randbereiche fuer Mausnavigation.
- **Mobile-Swipe:** Touch-/Pointer-Gesten fuer Section-Wechsel.
- **Tastatursteuerung:** Zahlenreihe, Pfeiltasten und raeumliches Numpad-Mapping.
- **Interne Scrollbereiche:** Vertikale und horizontale Testcontainer innerhalb der Cards.
- **Desktop Wheel-Isolation:** Mausrad/Trackpad scrollt Content, nicht den aeusseren Pager.
- **Desktop Click-and-Drag:** Interne Inhalte koennen mit der Maus gezogen werden.
- **Vanilla Code:** HTML, CSS und JavaScript ohne Frameworks oder externe Libraries.
- **Farbenfroher Hintergrund:** Radialer Farbverlauf ueber das gesamte 3x3-Raster.

## Technik

- **HTML5**
- **CSS3** mit Grid, Flexbox, Media Queries, Custom Properties und `dvh`-Fallbacks
- **Vanilla JavaScript**
- Keine externen Abhaengigkeiten
- Kein Build-System

Die aktuelle Umsetzung liegt in:

```text
web/index.html
web/index.css
web/index.js
```

## Nutzung

1. Projekt lokal oeffnen oder in eine Website integrieren.
2. Inhalte der neun Sections in `web/index.html` austauschen.
3. Layout- und Interaktionsregeln in `web/index.css` und `web/index.js` bei Bedarf anpassen.
4. Bei neuen interaktiven Inhalten Drag-/Scroll-Konflikte auf Desktop und Mobile testen.

Fuer normale Inhaltsarbeit sind vor allem die Section-Inhalte relevant. Die
Navigation selbst ist zentral gekapselt und sollte nicht an mehreren Stellen
parallel nachgebaut werden.

---

## Navigation

### Hash

Direktes Laden von URLs wie:

```text
#section-1
#section-5
#section-9
```

springt zur passenden Section.

### Tastatur

Normale Zahlenreihe:

```text
1 -> Section 1
2 -> Section 2
...
9 -> Section 9
```

Pfeiltasten:

```text
ArrowUp    -> eine Section nach oben
ArrowRight -> eine Section nach rechts
ArrowDown  -> eine Section nach unten
ArrowLeft  -> eine Section nach links
```

Numpad wird raeumlich interpretiert:

```text
Numpad 7 8 9 -> Section 1 2 3
Numpad 4 5 6 -> Section 4 5 6
Numpad 1 2 3 -> Section 7 8 9
```

### Start und Reload

- Section 5 ist der Default.
- Reloads innerhalb derselben Browser-Session versuchen, die aktuelle Section per `sessionStorage` zu erhalten.
- Hard Reload und normaler Reload lassen sich im Browser nicht immer eindeutig unterscheiden.

## Desktop-Bedienung

Desktop nutzt ein globales Overlay mit vier Hot-Zones:

```text
oben
rechts
unten
links
```

Die Hot-Zones liegen am Viewport-Rand und werden nur fuer Geraete mit echter
Hover-/Fine-Pointer-Unterstuetzung aktiviert:

```css
@media (hover: hover) and (pointer: fine)
```

Beim Hover ueber eine aktive Hot-Zone erscheint der passende Button. Die
gesamte Hot-Zone ist klickbar. Die Ecken sind bewusst inaktiv; es gibt keine
diagonale Mausnavigation.

Desktop-Variablen:

```css
--desktop-nav-button-size: 56px;
--desktop-nav-padding: 8px;
--desktop-nav-hot-zone-size: 72px;
--desktop-card-gap: 8px;
--desktop-card-inset: 80px;
```

Die Desktop-Card ist rundherum um `--desktop-card-inset` eingerueckt. Dadurch
liegen Card-Inhalt und Hot-Zones geometrisch getrennt.

## Desktop Wheel und Trackpad

Grundsatz:

```text
Wheel = Content
Trackpad = Content
Hot-Zone = Section-Navigation
Keyboard/Numpad = Section-Navigation
```

Der aeussere 3x3-Pager darf per Wheel oder Trackpad nicht pixelweise zwischen
Sections stehen bleiben.

Die Wheel-Logik:

- blockiert freies Scrollen des aeusseren Pagers
- scrollt interne vertikale Bereiche per `scrollTop += deltaY`
- scrollt interne horizontale Bereiche per `scrollLeft += deltaX`
- snappt den aeusseren Pager wieder auf die aktuelle Section

Es gibt keinen automatischen Section-Wechsel per Wheel oder Trackpad.

## Desktop Click-and-Drag

Interne scrollbare Inhalte koennen auf Desktop auch per Maus gezogen werden.

Drag startet nur:

- auf Desktop/Fine-Pointer
- mit linker Maustaste
- ausserhalb der Desktop-Hot-Zones
- ab `DESKTOP_DRAG_MIN_DISTANCE = 5`

Scrollberechnung:

```js
scrollTop = startScrollTop - dy
scrollLeft = startScrollLeft - dx
```

Die dominante Achse wird einmal bestimmt und bleibt fuer die Geste stabil:

```text
abs(dx) > abs(dy) -> horizontal
sonst             -> vertical
```

Nach echtem Drag wird der anschliessende Click unterdrueckt. Normale Klicks
ohne Drag bleiben erhalten.

Cursor-Regeln auf Desktop:

- Links, Buttons und Controls -> `pointer`
- horizontal scrollbare Bereiche -> `grab`
- waehrend aktivem Drag -> `grabbing`
- normaler Card-Bereich -> Default-Cursor

## Mobile-Bedienung

Mobile Navigation erfolgt ueber Pointer-/Touch-Gesten.

Grundmodell:

- langsames Ziehen innerhalb scrollbarer Inhalte -> interner Scrollbereich
- schneller Flick -> aeusserer 3x3-Pager
- pro Flick maximal eine benachbarte Section
- keine Sections ueberspringen
- Aussenkanten bleiben auf der aktuellen Section eingerastet

Aktuelle Schwellenwerte:

```js
MOBILE_SWIPE_MIN_DISTANCE = 72
MOBILE_SWIPE_MIN_FLICK_DISTANCE = 28
MOBILE_SWIPE_MIN_VELOCITY = 0.45
MOBILE_SWIPE_AXIS_RATIO = 1.35
GESTURE_LOCK_MIN_DISTANCE = 8
```

Gesture-States:

```text
undecided
pager
content_scroll
```

Auf Mobile sind die Navigationsbuttons ausgeblendet. Die Card nutzt nahezu
die gesamte Section.

Pinch-to-Zoom ist fuer den aktuellen Teststand ueber den Viewport-Meta-Tag
deaktiviert. Einzelne Browser koennen solche Sperren aus Accessibility-Gruenden
teilweise ignorieren.

## Interne Scrollbereiche

Jede Section enthaelt im aktuellen Prototypen einen vertikalen Testbereich:

```html
<div class="section-scroll-y">
    ...
</div>
```

Section 5 und Section 8 enthalten zusaetzlich horizontale Testbereiche:

```html
<div class="section-scroll-x">
    <div class="horizontal-test-card">...</div>
</div>
```

Section 5 enthaelt zusaetzliche Testelemente fuer Klick-vs-Drag:

- Button H-02
- Link H-04
- Button H-06

Normales Klicken loest einen `alert()` aus. Wird daraus ein echter Drag,
wird der Click unterdrueckt.

## Einrasten

Die Zielposition wird zentral aus `sectionMap` berechnet:

```text
left = col * viewportWidth
top  = row * viewportHeight
```

Nach Navigation oder sicherheitsrelevanten Eingaben wird die Position wieder
auf die aktuelle Section eingerastet.

## Lizenz

Dieses Layout basiert auf dem urspruenglichen 3x3 Smooth Scroll Grid
Blanco-Layout von Kai Akkermann / kighlander.de.

Die urspruengliche Lizenzdatei liegt im Projekt als:

```text
LICENCE.txt
```

Das urspruengliche Layout steht unter der Creative Commons
Namensnennung-NichtKommerziell 4.0 International Lizenz (CC BY-NC 4.0).

Der sichtbare Credit-Link wird in dieser Projektvariante nicht mehr ausgegeben.
Der Credit bleibt stattdessen als Kommentar im Code verankert.

## Kontakt / Credits

Layout und urspruengliche Entwicklung:

**Kai Akkermann**

[kighlander.de](https://kighlander.de)

## Bekannte Einschraenkungen

- Hard Reload und normaler Reload lassen sich im Browser nicht immer eindeutig unterscheiden.
- Mobile Momentum/Inertia fuer intern per JS gesteuerte Touch-Scrolls ist im Prototypen bewusst nicht nachgebaut.
- Die Testinhalte sind Dummy-Inhalte und dienen nur zur Pruefung von Navigation, Scroll-Konflikten und Drag-Verhalten.

---

