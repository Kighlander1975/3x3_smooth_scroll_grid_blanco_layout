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
	const DEFAULT_SECTION = 5;
	const CURRENT_SECTION_STORAGE_KEY = 'alleinerziehend-vernetzt.currentSection';
	const MOBILE_SWIPE_MIN_DISTANCE = 72;
	const MOBILE_SWIPE_MIN_FLICK_DISTANCE = 28;
	const MOBILE_SWIPE_MIN_VELOCITY = 0.45;
	const MOBILE_SWIPE_AXIS_RATIO = 1.35;
	const MOBILE_SWIPE_SNAP_DELAY = 380;
	const GESTURE_LOCK_MIN_DISTANCE = 8;
	const GESTURE_MODE_UNDECIDED = 'undecided';
	const GESTURE_MODE_PAGER = 'pager';
	const GESTURE_MODE_CONTENT_SCROLL = 'content_scroll';
	const GESTURE_AXIS_HORIZONTAL = 'horizontal';
	const GESTURE_AXIS_VERTICAL = 'vertical';
	const DEBUG_GESTURES = false;
	const DESKTOP_DRAG_MIN_DISTANCE = 5;
	const INTERACTIVE_CONTENT_SELECTOR = 'a, button, input, select, textarea, label, summary, [role="button"], [tabindex]';
	let currentSection = getInitialSection();
	let snapTimeout = null;
	let activeDesktopDrag = null;
	let suppressNextDesktopClick = false;

	function getSectionFromHash() {
		const match = window.location.hash.match(/^#section-(\d)$/);
		const sectionNumber = match ? parseInt(match[1], 10) : null;
		return sectionMap[sectionNumber] ? sectionNumber : null;
	}

	function getInitialSection() {
		return getSectionFromHash() || getReloadSection() || DEFAULT_SECTION;
	}

	function getReloadSection() {
		if (getNavigationType() !== 'reload') return null;

		return getStoredSection();
	}

	function getNavigationType() {
		const entries = performance.getEntriesByType ? performance.getEntriesByType('navigation') : [];
		return entries.length ? entries[0].type : null;
	}

	function getStoredSection() {
		try {
			const sectionNumber = parseInt(sessionStorage.getItem(CURRENT_SECTION_STORAGE_KEY), 10);
			return sectionMap[sectionNumber] ? sectionNumber : null;
		} catch (e) {
			return null;
		}
	}

	function storeCurrentSection(sectionNumber) {
		if (!sectionMap[sectionNumber]) return;

		try {
			sessionStorage.setItem(CURRENT_SECTION_STORAGE_KEY, String(sectionNumber));
		} catch (e) {
			// Session storage is optional; navigation must still work without it.
		}
	}

	function getNearestSectionFromScroll() {
		if (!container) return null;

		const col = Math.round(container.scrollLeft / getViewportWidth());
		const row = Math.round(container.scrollTop / getViewportHeight());

		return findSectionByPosition(col, row);
	}

	function getViewportWidth() {
		return container ? container.clientWidth : window.innerWidth;
	}

	function getViewportHeight() {
		return container ? container.clientHeight : window.innerHeight;
	}

	function findScrollableAncestor(target) {
		let current = target;
		const result = {
			x: null,
			y: null
		};

		while (current && current !== container) {
			if (!result.y && isScrollableOnAxis(current, 'y')) {
				result.y = current;
			}
			if (!result.x && isScrollableOnAxis(current, 'x')) {
				result.x = current;
			}
			if (result.x && result.y) break;
			current = current.parentElement;
		}

		return result;
	}

	function isScrollableOnAxis(element, axis) {
		const style = window.getComputedStyle(element);
		const overflow = axis === 'x' ? style.overflowX : style.overflowY;
		const allowsScroll = overflow === 'auto' || overflow === 'scroll';

		if (!allowsScroll) return false;

		if (axis === 'x') {
			return element.scrollWidth > element.clientWidth;
		}

		return element.scrollHeight > element.clientHeight;
	}

	function findSectionByPosition(col, row) {
		for (let num in sectionMap) {
			const pos = sectionMap[num];
			if (pos.col === col && pos.row === row) {
				return parseInt(num, 10);
			}
		}

		return null;
	}

	function setContainerPosition(sectionNumber, behavior) {
		if (!container || !sectionMap[sectionNumber]) return;

		const pos = sectionMap[sectionNumber];
		container.scrollTo({
			left: pos.col * getViewportWidth(),
			top: pos.row * getViewportHeight(),
			behavior: behavior
		});
	}

	function snapToSection(sectionNumber) {
		if (!container || !sectionMap[sectionNumber]) return;

		const previousScrollBehavior = container.style.scrollBehavior;
		container.style.scrollBehavior = 'auto';
		setContainerPosition(sectionNumber, 'auto');
		container.style.scrollBehavior = previousScrollBehavior;
	}

	function navigateToSection(sectionNumber, options) {
		if (!sectionMap[sectionNumber]) return false;

		const settings = Object.assign({
			behavior: 'smooth',
			updateHash: true,
			replaceHash: false
		}, options || {});

		currentSection = sectionNumber;
		storeCurrentSection(sectionNumber);
		setContainerPosition(sectionNumber, settings.behavior);

		window.clearTimeout(snapTimeout);
		if (settings.behavior === 'smooth') {
			snapTimeout = window.setTimeout(function() {
				snapToSection(sectionNumber);
			}, MOBILE_SWIPE_SNAP_DELAY);
		} else {
			snapToSection(sectionNumber);
		}

		const nextHash = '#section-' + sectionNumber;
		if (settings.updateHash && window.location.hash !== nextHash) {
			if (settings.replaceHash) {
				window.history.replaceState(null, '', nextHash);
			} else {
				window.history.pushState(null, '', nextHash);
			}
		}

		updateDesktopNavOverlay();
		return true;
	}

	function navigateFromHash(options) {
		const sectionNumber = getSectionFromHash();
		if (sectionNumber) {
			navigateToSection(sectionNumber, Object.assign({
				updateHash: false
			}, options || {}));
		}
	}

	function navigateByOffset(colDelta, rowDelta, options) {
		const current = currentSection || getSectionFromHash() || getNearestSectionFromScroll() || DEFAULT_SECTION;
		const pos = sectionMap[current];
		const targetSection = findSectionByPosition(pos.col + colDelta, pos.row + rowDelta);

		if (!targetSection) {
			navigateToSection(current, Object.assign({
				behavior: 'auto',
				updateHash: false
			}, options || {}));
			return false;
		}

		return navigateToSection(targetSection, options);
	}

	if (getSectionFromHash()) {
		navigateFromHash({behavior: 'auto'});
	} else {
		navigateToSection(currentSection, {behavior: 'auto', updateHash: false});
	}
	window.addEventListener("hashchange", function() {
		navigateFromHash({behavior: 'smooth'});
	});
	window.addEventListener("popstate", function() {
		navigateFromHash({behavior: 'smooth'});
	});

	document.addEventListener("keydown", function(e) {
		const numpadSectionMap = {
			Numpad7: 1,
			Numpad8: 2,
			Numpad9: 3,
			Numpad4: 4,
			Numpad5: 5,
			Numpad6: 6,
			Numpad1: 7,
			Numpad2: 8,
			Numpad3: 9
		};

		if (numpadSectionMap[e.code]) {
			navigateToSection(numpadSectionMap[e.code]);
			return;
		}

		if (e.key >= "1" && e.key <= "9") {
			navigateToSection(parseInt(e.key, 10));
			return;
		}

		if (e.key === "ArrowUp")    navigateByOffset(0, -1);
		if (e.key === "ArrowDown")  navigateByOffset(0, 1);
		if (e.key === "ArrowLeft")  navigateByOffset(-1, 0);
		if (e.key === "ArrowRight") navigateByOffset(1, 0);

		if (e.key.startsWith("Arrow")) e.preventDefault();
	});
	document.addEventListener('wheel', handleDesktopWheel, {passive: false, capture: true});
	document.addEventListener('pointerdown', startDesktopDrag);
	document.addEventListener('pointermove', moveDesktopDrag, {passive: false});
	document.addEventListener('pointerup', finishDesktopDrag);
	document.addEventListener('pointercancel', cancelDesktopDrag);
	document.addEventListener('click', suppressDesktopDragClick, true);

	// Ab hier Swipe Code
	// Swipe-Logik für den scroll-container (immer nur eine Section pro Swipe).
	let activePointerGesture = null;

	if (container) {
		container.addEventListener('pointerdown', function(e) {
			if (!e.isPrimary || e.pointerType === 'mouse') return;

			const scrollableAncestor = findScrollableAncestor(e.target);
			activePointerGesture = {
				pointerId: e.pointerId,
				startX: e.clientX,
				startY: e.clientY,
				lastX: e.clientX,
				lastY: e.clientY,
				startTime: performance.now(),
				section: currentSection || getSectionFromHash() || getNearestSectionFromScroll() || DEFAULT_SECTION,
				scrollableAncestor: scrollableAncestor,
				mode: GESTURE_MODE_UNDECIDED,
				axis: null,
				scrollElement: null,
				startScrollLeft: 0,
				startScrollTop: 0
			};
		});

		container.addEventListener('pointermove', function(e) {
			if (!activePointerGesture || e.pointerId !== activePointerGesture.pointerId) return;

			activePointerGesture.lastX = e.clientX;
			activePointerGesture.lastY = e.clientY;
			classifyPointerGesture(activePointerGesture);

			if (activePointerGesture.mode !== GESTURE_MODE_UNDECIDED) {
				e.preventDefault();
			}

			if (activePointerGesture.mode === GESTURE_MODE_CONTENT_SCROLL) {
				scrollGestureContent(activePointerGesture);
			}
		}, {passive: false});

		container.addEventListener('pointerup', finishPointerGesture);
		container.addEventListener('pointercancel', cancelPointerGesture);
	}

	function handleDesktopWheel(e) {
		if (!isDesktopPointer()) return;

		const scrollableAncestor = findScrollableAncestor(e.target);

		e.preventDefault();

		if (scrollableAncestor.x && e.deltaX !== 0) {
			scrollableAncestor.x.scrollLeft += e.deltaX;
		}
		if (scrollableAncestor.y && e.deltaY !== 0) {
			scrollableAncestor.y.scrollTop += e.deltaY;
		}

		snapToSection(currentSection);
	}

	function isDesktopPointer() {
		return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	}

	function startDesktopDrag(e) {
		if (!isDesktopPointer() || e.pointerType !== 'mouse' || e.button !== 0) return;
		if (e.target.closest('.desktop-nav-zone')) return;

		const scrollableAncestor = findScrollableAncestor(e.target);
		if (!scrollableAncestor.x && !scrollableAncestor.y) return;

		activeDesktopDrag = {
			pointerId: e.pointerId,
			startX: e.clientX,
			startY: e.clientY,
			lastX: e.clientX,
			lastY: e.clientY,
			scrollableAncestor: scrollableAncestor,
			axis: null,
			scrollElement: null,
			captureElement: e.target,
			startedOnInteractive: Boolean(e.target.closest(INTERACTIVE_CONTENT_SELECTOR)),
			startScrollLeft: 0,
			startScrollTop: 0,
			didDrag: false
		};
	}

	function moveDesktopDrag(e) {
		if (!activeDesktopDrag || e.pointerId !== activeDesktopDrag.pointerId) return;

		if ((e.buttons & 1) !== 1) {
			cancelDesktopDrag(e);
			return;
		}

		activeDesktopDrag.lastX = e.clientX;
		activeDesktopDrag.lastY = e.clientY;

		if (!activeDesktopDrag.axis) {
			lockDesktopDragAxis(activeDesktopDrag);
		}

		if (!activeDesktopDrag || !activeDesktopDrag.scrollElement) return;

		activeDesktopDrag.didDrag = true;
		e.preventDefault();

		if (activeDesktopDrag.axis === GESTURE_AXIS_HORIZONTAL) {
			activeDesktopDrag.scrollElement.scrollLeft =
				activeDesktopDrag.startScrollLeft - (activeDesktopDrag.lastX - activeDesktopDrag.startX);
		} else {
			activeDesktopDrag.scrollElement.scrollTop =
				activeDesktopDrag.startScrollTop - (activeDesktopDrag.lastY - activeDesktopDrag.startY);
		}

		snapToSection(currentSection);
	}

	function lockDesktopDragAxis(drag) {
		const dx = drag.lastX - drag.startX;
		const dy = drag.lastY - drag.startY;
		const absX = Math.abs(dx);
		const absY = Math.abs(dy);

		if (Math.max(absX, absY) < DESKTOP_DRAG_MIN_DISTANCE) return;

		const axis = absX > absY ? GESTURE_AXIS_HORIZONTAL : GESTURE_AXIS_VERTICAL;
		const scrollElement = axis === GESTURE_AXIS_HORIZONTAL ?
			drag.scrollableAncestor.x :
			drag.scrollableAncestor.y;

		if (!scrollElement) {
			activeDesktopDrag = null;
			return;
		}

		drag.axis = axis;
		drag.scrollElement = scrollElement;
		drag.startScrollLeft = scrollElement.scrollLeft;
		drag.startScrollTop = scrollElement.scrollTop;
		scrollElement.classList.add('is-dragging');

		if (drag.captureElement.setPointerCapture) {
			drag.captureElement.setPointerCapture(drag.pointerId);
		}
	}

	function finishDesktopDrag(e) {
		if (!activeDesktopDrag || e.pointerId !== activeDesktopDrag.pointerId) return;

		if (activeDesktopDrag.didDrag) {
			suppressNextDesktopClick = true;
			window.setTimeout(function() {
				suppressNextDesktopClick = false;
			}, 250);
		}

		cancelDesktopDrag(e);
	}

	function cancelDesktopDrag(e) {
		if (!activeDesktopDrag || e.pointerId !== activeDesktopDrag.pointerId) return;

		if (activeDesktopDrag.scrollElement) {
			activeDesktopDrag.scrollElement.classList.remove('is-dragging');
		}
		if (activeDesktopDrag.captureElement &&
			activeDesktopDrag.captureElement.hasPointerCapture &&
			activeDesktopDrag.captureElement.hasPointerCapture(e.pointerId)) {
			activeDesktopDrag.captureElement.releasePointerCapture(e.pointerId);
		}

		activeDesktopDrag = null;
		snapToSection(currentSection);
	}

	function suppressDesktopDragClick(e) {
		if (!suppressNextDesktopClick) return;

		suppressNextDesktopClick = false;
		e.preventDefault();
		e.stopPropagation();
	}

	function finishPointerGesture(e) {
		if (!activePointerGesture || e.pointerId !== activePointerGesture.pointerId) return;

		activePointerGesture.lastX = e.clientX;
		activePointerGesture.lastY = e.clientY;
		handlePointerGesture(activePointerGesture);
		cancelPointerGesture(e);
	}

	function cancelPointerGesture(e) {
		if (!activePointerGesture || e.pointerId !== activePointerGesture.pointerId) return;

		if (container.hasPointerCapture(e.pointerId)) {
			container.releasePointerCapture(e.pointerId);
		}
		activePointerGesture = null;
	}

	function classifyPointerGesture(gesture) {
		if (gesture.mode !== GESTURE_MODE_UNDECIDED) return;

		const metrics = getGestureMetrics(gesture);
		if (metrics.dominantDistance < GESTURE_LOCK_MIN_DISTANCE) return;
		if (!metrics.isClearAxis) return;

		if (!gesture.axis) {
			gesture.axis = metrics.isHorizontal ? GESTURE_AXIS_HORIZONTAL : GESTURE_AXIS_VERTICAL;
		}

		if (isGestureFlick(metrics, gesture.axis)) {
			lockGestureMode(gesture, GESTURE_MODE_PAGER, null, metrics);
			return;
		}

		const scrollElement = gesture.axis === GESTURE_AXIS_HORIZONTAL ?
			gesture.scrollableAncestor.x :
			gesture.scrollableAncestor.y;

		if (scrollElement) {
			if (getAxisVelocity(metrics, gesture.axis) >= MOBILE_SWIPE_MIN_VELOCITY &&
				getAxisDistance(metrics, gesture.axis) < MOBILE_SWIPE_MIN_FLICK_DISTANCE) {
				return;
			}

			lockGestureMode(gesture, GESTURE_MODE_CONTENT_SCROLL, scrollElement, metrics);
			return;
		}

		lockGestureMode(gesture, GESTURE_MODE_PAGER, null, metrics);
	}

	function lockGestureMode(gesture, mode, scrollElement, metrics) {
		gesture.mode = mode;
		gesture.scrollElement = scrollElement;

		if (scrollElement) {
			gesture.startScrollLeft = scrollElement.scrollLeft;
			gesture.startScrollTop = scrollElement.scrollTop;
		}

		if (!container.hasPointerCapture(gesture.pointerId)) {
			container.setPointerCapture(gesture.pointerId);
		}

		debugGesture(gesture, metrics);
	}

	function scrollGestureContent(gesture) {
		if (!gesture.scrollElement) return;

		const dx = gesture.lastX - gesture.startX;
		const dy = gesture.lastY - gesture.startY;

		if (gesture.axis === GESTURE_AXIS_HORIZONTAL) {
			gesture.scrollElement.scrollLeft = gesture.startScrollLeft - dx;
			return;
		}

		gesture.scrollElement.scrollTop = gesture.startScrollTop - dy;
	}

	function handlePointerGesture(gesture) {
		if (gesture.mode === GESTURE_MODE_CONTENT_SCROLL) {
			navigateToSection(gesture.section, {behavior: 'auto', updateHash: false});
			return;
		}

		const dx = gesture.lastX - gesture.startX;
		const dy = gesture.lastY - gesture.startY;
		const metrics = getGestureMetrics(gesture);
		const hasDistance = getAxisDistance(metrics, gesture.axis) >= MOBILE_SWIPE_MIN_DISTANCE;
		const hasFlickVelocity = isGestureFlick(metrics, gesture.axis);

		currentSection = gesture.section;

		if (gesture.mode !== GESTURE_MODE_PAGER || !metrics.isClearAxis || (!hasDistance && !hasFlickVelocity)) {
			navigateToSection(gesture.section, {behavior: 'auto', updateHash: false});
			return;
		}

		if (gesture.axis === GESTURE_AXIS_HORIZONTAL) {
			navigateByOffset(dx < 0 ? 1 : -1, 0);
			return;
		}

		navigateByOffset(0, dy < 0 ? 1 : -1);
	}

	function getGestureMetrics(gesture) {
		const dx = gesture.lastX - gesture.startX;
		const dy = gesture.lastY - gesture.startY;
		const duration = Math.max(performance.now() - gesture.startTime, 1);
		const absX = Math.abs(dx);
		const absY = Math.abs(dy);
		const dominantDistance = Math.max(absX, absY);
		const secondaryDistance = Math.min(absX, absY);
		const velocity = dominantDistance / duration;
		const isHorizontal = absX > absY;
		const isClearAxis = secondaryDistance === 0 || dominantDistance / secondaryDistance >= MOBILE_SWIPE_AXIS_RATIO;

		return {
			dx: dx,
			dy: dy,
			duration: duration,
			dominantDistance: dominantDistance,
			absX: absX,
			absY: absY,
			velocity: velocity,
			isHorizontal: isHorizontal,
			isClearAxis: isClearAxis
		};
	}

	function isGestureFlick(metrics, axis) {
		return metrics.isClearAxis &&
			getAxisDistance(metrics, axis) >= MOBILE_SWIPE_MIN_FLICK_DISTANCE &&
			getAxisVelocity(metrics, axis) >= MOBILE_SWIPE_MIN_VELOCITY;
	}

	function getAxisDistance(metrics, axis) {
		return axis === GESTURE_AXIS_HORIZONTAL ? metrics.absX : metrics.absY;
	}

	function getAxisVelocity(metrics, axis) {
		return getAxisDistance(metrics, axis) / metrics.duration;
	}

	function debugGesture(gesture, metrics) {
		if (!DEBUG_GESTURES) return;

		console.log('gesture', {
			axis: gesture.axis,
			mode: gesture.mode,
			distance: Math.round(getAxisDistance(metrics, gesture.axis)),
			duration: Math.round(metrics.duration),
			velocity: Number(getAxisVelocity(metrics, gesture.axis).toFixed(2))
		});
	}

	window.addEventListener('resize', function() {
		navigateToSection(currentSection, {
			behavior: 'auto',
			updateHash: false
		});
	});

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

	function createDesktopNavOverlay() {
		const directions = [
			{direction: 'up', className: 'desktop-nav-top', colDelta: 0, rowDelta: -1},
			{direction: 'right', className: 'desktop-nav-right', colDelta: 1, rowDelta: 0},
			{direction: 'down', className: 'desktop-nav-bottom', colDelta: 0, rowDelta: 1},
			{direction: 'left', className: 'desktop-nav-left', colDelta: -1, rowDelta: 0}
		];
		const overlay = document.createElement('div');
		overlay.className = 'desktop-nav-overlay';

		directions.forEach(function(config) {
			const zone = document.createElement('div');
			const button = document.createElement('button');

			zone.className = 'desktop-nav-zone ' + config.className;
			zone.setAttribute('data-direction', config.direction);
			button.className = 'desktop-nav-btn';
			button.type = 'button';
			button.innerHTML = getArrowSvg(config.direction);

			zone.addEventListener('click', function() {
				const target = getSectionByOffset(currentSection, config.colDelta, config.rowDelta);
				if (target) {
					navigateToSection(target);
					button.blur();
				}
			});
			button.addEventListener('click', function(e) {
				e.stopPropagation();
				zone.click();
			});

			zone.appendChild(button);
			overlay.appendChild(zone);
		});

		document.body.appendChild(overlay);
		updateDesktopNavOverlay();
	}

	function updateDesktopNavOverlay() {
		const overlay = document.querySelector('.desktop-nav-overlay');
		if (!overlay) return;

		const directionMap = {
			up: {colDelta: 0, rowDelta: -1},
			right: {colDelta: 1, rowDelta: 0},
			down: {colDelta: 0, rowDelta: 1},
			left: {colDelta: -1, rowDelta: 0}
		};

		overlay.querySelectorAll('.desktop-nav-zone').forEach(function(zone) {
			const direction = zone.getAttribute('data-direction');
			const offset = directionMap[direction];
			const target = offset ? getSectionByOffset(currentSection, offset.colDelta, offset.rowDelta) : null;

			zone.classList.toggle('is-disabled', !target);
			zone.setAttribute('aria-hidden', target ? 'false' : 'true');
		});
	}

	function getSectionByOffset(sectionNumber, colDelta, rowDelta) {
		const pos = sectionMap[sectionNumber];
		if (!pos) return null;

		return findSectionByPosition(pos.col + colDelta, pos.row + rowDelta);
	}

	createDesktopNavOverlay();

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
					const target = parseInt(btn.getAttribute('data-target'), 10);
					if (target) navigateToSection(target);
				});
				btn.addEventListener('keydown', e => {
					if (e.key === 'Enter' || e.key === ' ') {
						const target = parseInt(btn.getAttribute('data-target'), 10);
						if (target) navigateToSection(target);
					}
				});
			});
		}
	});

	document.querySelectorAll('[data-alert-message]').forEach(function(element) {
		element.addEventListener('dragstart', function(e) {
			e.preventDefault();
		});
		element.addEventListener('click', function(e) {
			e.preventDefault();
			window.alert(element.getAttribute('data-alert-message'));
		});
	});

});

// Layout credit: Kai Akkermann / kighlander.de.
// Der sichtbare Copyright-Hinweis wird in diesem Projekt nicht ausgegeben.
