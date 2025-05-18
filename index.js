// File: /index.js

/*
Layout © 2025 Kai Akkermann / kighlander.de
Lizenz: CC BY-NC 4.0 – nicht-kommerzielle Nutzung, Credit-Link darf nicht entfernt werden.
Siehe LICENSE.txt für Details.
*/

document.addEventListener("DOMContentLoaded", function () {
	const sectionMap = {
		1: {col: 0, row: 0},
		2: {col: 1, row: 0},
		3: {col: 2, row: 0},
		4: {col: 0, row: 1},
		5: {col: 1, row: 1},
		6: {col: 2, row: 1},
		7: {col: 0, row: 2},
		8: {col: 1, row: 2},
		9: {col: 2, row: 2}
	};

	const container = document.getElementById('scroll-container');

	function scrollToSectionFromHash() {
		const hash = window.location.hash;
		const match = hash.match(/^#section-(\d)$/);
		if (match) {
			const num = parseInt(match[1], 10);
			const pos = sectionMap[num];
			if (pos && container) {
				container.scrollTo({
					left: pos.col * window.innerWidth,
					top: pos.row * window.innerHeight,
					behavior: "smooth"
				});
			}
		}
	}

	scrollToSectionFromHash();
	window.addEventListener("hashchange", scrollToSectionFromHash);

	document.addEventListener("keydown", function(e) {
		if (e.key >= "1" && e.key <= "9") {
			window.location.hash = "#section-" + e.key;
		}
	});

	document.addEventListener("keydown", function(e) {
		if (e.key >= "1" && e.key <= "9") {
			window.location.hash = "#section-" + e.key;
			return;
		}

		// Pfeiltasten-Navigation
		const hash = window.location.hash;
		const match = hash.match(/^#section-(\d)$/);
		let current = match ? parseInt(match[1], 10) : 5; // Standard: Mitte
		let pos = sectionMap[current];

		let targetPos = null;
		if (e.key === "ArrowUp")    targetPos = {col: pos.col, row: pos.row - 1};
		if (e.key === "ArrowDown")  targetPos = {col: pos.col, row: pos.row + 1};
		if (e.key === "ArrowLeft")  targetPos = {col: pos.col - 1, row: pos.row};
		if (e.key === "ArrowRight") targetPos = {col: pos.col + 1, row: pos.row};

		if (targetPos) {
			// Zielnummer finden
			let targetNum = null;
			for (let num in sectionMap) {
				let p = sectionMap[num];
				if (p.col === targetPos.col && p.row === targetPos.row) {
					targetNum = num;
					break;
				}
			}
			if (targetNum) {
				window.location.hash = "#section-" + targetNum;
				e.preventDefault(); // verhindert Scrollen des Browsers
			}
		}
	});
	
	// Ab hier Swipe Code
	// Swipe-Logik für den scroll-container (immer nur eine Section pro Swipe)
	let touchStartX = 0;
	let touchStartY = 0;

	if (container) {
		container.addEventListener('touchstart', function(e) {
			if (e.touches.length === 1) {
				touchStartX = e.touches[0].clientX;
				touchStartY = e.touches[0].clientY;
			}
		});

		container.addEventListener('touchend', function(e) {
			const touchEndX = e.changedTouches[0].clientX;
			const touchEndY = e.changedTouches[0].clientY;

			const dx = touchEndX - touchStartX;
			const dy = touchEndY - touchStartY;
			const minDist = 50; // Mindestdistanz zum Auslösen (px)

			// Nur eine Richtung pro Swipe: die mit der größeren Differenz
			if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minDist) {
				// Horizontaler Swipe (nur eins weiter!)
				if (dx > 0) {
					swipeTo('left');
				} else {
					swipeTo('right');
				}
			} else if (Math.abs(dy) > minDist) {
				// Vertikaler Swipe (nur eins weiter!)
				if (dy > 0) {
					swipeTo('up');
				} else {
					swipeTo('down');
				}
			}
		});
	}

	function swipeTo(direction) {
		const hash = window.location.hash;
		const match = hash.match(/^#section-(\d)$/);
		let current = match ? parseInt(match[1], 10) : 5; // Standard: Mitte
		let pos = sectionMap[current];

		let targetPos = null;
		if (direction === "up")    targetPos = {col: pos.col, row: pos.row - 1};
		if (direction === "down")  targetPos = {col: pos.col, row: pos.row + 1};
		if (direction === "left")  targetPos = {col: pos.col - 1, row: pos.row};
		if (direction === "right") targetPos = {col: pos.col + 1, row: pos.row};

		if (targetPos) {
			// Zielnummer finden
			let targetNum = null;
			for (let num in sectionMap) {
				let p = sectionMap[num];
				if (p.col === targetPos.col && p.row === targetPos.row) {
					targetNum = num;
					break;
				}
			}
			if (targetNum) {
				window.location.hash = "#section-" + targetNum;
			}
		}
	}

	// Hilfsfunktion für SVG-Pfeile
	function getArrowSvg(direction) {
		switch (direction) {
			case "up": return `<svg viewBox="0 0 36 36" fill="none"><path d="M18 24V12m0 0l-6 6m6-6l6 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
			case "down": return `<svg viewBox="0 0 36 36" fill="none"><path d="M18 12v12m0 0l6-6m-6 6l-6-6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
			case "left": return `<svg viewBox="0 0 36 36" fill="none"><path d="M24 18H12m0 0l6-6m-6 6l6 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
			case "right": return `<svg viewBox="0 0 36 36" fill="none"><path d="M12 18h12m0 0l-6-6m6 6l-6 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
			case "down-right": return `<svg viewBox="0 0 36 36" fill="none"><path d="M12 12l12 12m0 0h-9m9 0v-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
			case "down-left": return `<svg viewBox="0 0 36 36" fill="none"><path d="M24 12L12 24m0 0h9m-9 0v-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
			case "up-right": return `<svg viewBox="0 0 36 36" fill="none"><path d="M12 24l12-12m0 0v9m0-9h-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
			case "up-left": return `<svg viewBox="0 0 36 36" fill="none"><path d="M24 24L12 12m0 0v9m0-9h9" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
			default: return "";
		}
	}

	// Konfiguration für jede Seite
	const pageConfigs = {
		1: {
			nav: [
				{cls: "nav-right",   target: 2, title: "Zu Seite 2",    icon: getArrowSvg("right")},
				{cls: "nav-bottom",  target: 4, title: "Zu Seite 4",    icon: getArrowSvg("down")},
				{cls: "nav-bottom-right",  target: 5, title: "Zu Seite 5",    icon: getArrowSvg("down-right")},
			],
			gridClass: "page-grid-12x12",
			marginClasses: ["margin-top", "margin-left"]
		},
		2: {
			nav: [
				{cls: "nav-left",   target: 1, title: "Zu Seite 1",    icon: getArrowSvg("left")},
				{cls: "nav-right",  target: 3, title: "Zu Seite 3",    icon: getArrowSvg("right")},
				{cls: "nav-bottom-left",  target: 4, title: "Zu Seite 4",    icon: getArrowSvg("down-left")},
				{cls: "nav-bottom",  target: 5, title: "Zu Seite 5",    icon: getArrowSvg("down")},
				{cls: "nav-bottom-right",  target: 6, title: "Zu Seite 6",    icon: getArrowSvg("down-right")},
			],
			gridClass: "page-grid-12x12",
			marginClasses: ["margin-top"]
		},
		3: {
			nav: [
				{cls: "nav-left",   target: 2, title: "Zu Seite 2",    icon: getArrowSvg("left")},
				{cls: "nav-bottom-left",  target: 5, title: "Zu Seite 5",    icon: getArrowSvg("down-left")},
				{cls: "nav-bottom",  target: 6, title: "Zu Seite 6",    icon: getArrowSvg("down")},
			],
			gridClass: "page-grid-12x12",
			marginClasses: ["margin-top", "margin-right"]
		},
		4: {
			nav: [
				{cls: "nav-top",   target: 1, title: "Zu Seite 1",    icon: getArrowSvg("up")},
				{cls: "nav-top-right",  target: 2, title: "Zu Seite 2",    icon: getArrowSvg("up-right")},
				{cls: "nav-right",  target: 5, title: "Zu Seite 5",    icon: getArrowSvg("right")},
				{cls: "nav-bottom",  target: 7, title: "Zu Seite 7",    icon: getArrowSvg("down")},
				{cls: "nav-bottom-right", target: 8, title: "Zu Seite 8", icon: getArrowSvg("down-right")},
			],
			gridClass: "page-grid-12x12",
			marginClasses: ["margin-left"]
		},
		5: {
			nav: [
				{cls: "nav-top-left",     target: 1, title: "Zu Seite 1",    icon: getArrowSvg("up-left")},
				{cls: "nav-top",          target: 2, title: "Zu Seite 2",    icon: getArrowSvg("up")},
				{cls: "nav-top-right",    target: 3, title: "Zu Seite 3",    icon: getArrowSvg("up-right")},
				{cls: "nav-left",         target: 4, title: "Zu Seite 4",    icon: getArrowSvg("left")},
				{cls: "nav-right",        target: 6, title: "Zu Seite 6",    icon: getArrowSvg("right")},
				{cls: "nav-bottom-left",  target: 7, title: "Zu Seite 7",    icon: getArrowSvg("down-left")},
				{cls: "nav-bottom",       target: 8, title: "Zu Seite 8",    icon: getArrowSvg("down")},
				{cls: "nav-bottom-right", target: 9, title: "Zu Seite 9",    icon: getArrowSvg("down-right")},
			],
			gridClass: "page-grid-12x12",
			marginClasses: []
		},
		6: {
			nav: [
				{cls: "nav-top-left",   target: 2, title: "Zu Seite 2",    icon: getArrowSvg("up-left")},
				{cls: "nav-top",        target: 3, title: "Zu Seite 3",    icon: getArrowSvg("up")},
				{cls: "nav-left",       target: 5, title: "Zu Seite 5",    icon: getArrowSvg("left")},
				{cls: "nav-bottom-left",target: 8, title: "Zu Seite 8",    icon: getArrowSvg("down-left")},
				{cls: "nav-bottom",     target: 9, title: "Zu Seite 9",    icon: getArrowSvg("down")},
			],
			gridClass: "page-grid-12x12",
			marginClasses: ["margin-right"]
		},
		7: {
			nav: [
				{cls: "nav-top",   target: 4, title: "Zu Seite 4",    icon: getArrowSvg("up")},
				{cls: "nav-top-right",  target: 5, title: "Zu Seite 5",    icon: getArrowSvg("up-right")},
				{cls: "nav-right",  target: 8, title: "Zu Seite 8",    icon: getArrowSvg("right")},
			],
			gridClass: "page-grid-12x12",
			marginClasses: ["margin-bottom", "margin-left"]
		},
		8: {
			nav: [
				{cls: "nav-top-left",   target: 4, title: "Zu Seite 4",    icon: getArrowSvg("up-left")},
				{cls: "nav-top",        target: 5, title: "Zu Seite 5",    icon: getArrowSvg("up")},
				{cls: "nav-top-right",  target: 6, title: "Zu Seite 6",    icon: getArrowSvg("up-right")},
				{cls: "nav-left",       target: 7, title: "Zu Seite 7",    icon: getArrowSvg("left")},
				{cls: "nav-right",      target: 9, title: "Zu Seite 9",    icon: getArrowSvg("right")},
			],
			gridClass: "page-grid-12x12",
			marginClasses: ["margin-bottom"]
		},
		9: {
			nav: [
				{cls: "nav-left",        target: 8, title: "Zu Seite 8",    icon: getArrowSvg("left")},
				{cls: "nav-top",         target: 6, title: "Zu Seite 6",    icon: getArrowSvg("up")},
				{cls: "nav-top-left",    target: 5, title: "Zu Seite 5",    icon: getArrowSvg("up-left")},
			],
			gridClass: "page-grid-12x12",
			marginClasses: ["margin-bottom", "margin-right"]
		}
	};

	Object.keys(pageConfigs).forEach(function(pageNum){
		const sectionGrid = document.querySelector(`.section-${pageNum} .content-grid`);
		if (sectionGrid) {
			const config = pageConfigs[pageNum];

			// 1. Erstelle den Grid-Wrapper
			const gridWrapper = document.createElement('div');
			gridWrapper.className = config.gridClass;

			// 2. Füge Margin-Klassen ggf. zum ersten Kind (deinem Content) hinzu
			let contentBlock = sectionGrid.querySelector('.content-block');
			if (!contentBlock) {
				// Falls noch nicht vorhanden, wandle den vorhandenen Inhalt in eine Content-Block-DIV um
				contentBlock = document.createElement('div');
				contentBlock.className = 'block content-block';
				// Übertrage den bisherigen Inhalt
				while (sectionGrid.firstChild) {
					contentBlock.appendChild(sectionGrid.firstChild);
				}
				sectionGrid.appendChild(contentBlock);
			}
			// Margin-Klassen setzen
			if (config.marginClasses && config.marginClasses.length) {
				contentBlock.classList.add(...config.marginClasses);
			}

			// 3. Content-Block und Navigation in Grid-Wrapper einfügen
			gridWrapper.appendChild(contentBlock);

			// 4. Navigation erzeugen und anhängen
			config.nav.forEach(btn => {
				const button = document.createElement('button');
				button.className = `block nav-block nav-btn ${btn.cls}`;
				button.setAttribute('data-target', btn.target);
				button.setAttribute('title', btn.title);
				button.innerHTML = btn.icon;
				gridWrapper.appendChild(button);
			});

			// 5. Den alten Inhalt ersetzen
			sectionGrid.innerHTML = '';
			sectionGrid.appendChild(gridWrapper);

			// 6. Event-Listener für Buttons
			sectionGrid.querySelectorAll('.nav-btn').forEach(btn => {
				btn.addEventListener('click', e => {
					const target = btn.getAttribute('data-target');
					if (target) window.location.hash = '#section-' + target;
				});
				btn.addEventListener('keydown', e => {
					if (e.key === 'Enter' || e.key === ' ') {
						const target = btn.getAttribute('data-target');
						if (target) window.location.hash = '#section-' + target;
					}
				});
			});
		}
	});

});
// Copyright/Credit-Link dynamisch in jede Section einfügen
// DIESER TEIL DARF NICHT ENTFERNT WERDEN, ES VERSTÖSST GEGEN URHEBERRECHT
document.querySelectorAll('.content-grid').forEach(grid => {
	// Prüfen, ob schon ein Credit-Link existiert (doppelt vermeiden)
	if (!grid.querySelector('.credit-link')) {
		const link = document.createElement('a');
		link.className = 'credit-link';
		link.href = 'https://kighlander.de';
		link.target = '_blank';
		link.rel = 'noopener';
		link.title = 'Layout von Kighlander.de';
		link.textContent = '© Layout: Kighlander.de';
		grid.appendChild(link);
	}
});