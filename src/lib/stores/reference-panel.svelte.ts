import { RULEBOOK_SECTIONS } from '$lib/data/rulebook-index';

const STORAGE_KEY = 'reference-panel-width';
const DEFAULT_WIDTH = 500;
const MIN_WIDTH = 300;
const MAX_WIDTH = 1200;

function createReferencePanelStore() {
	let isOpen = $state(false);
	let isFullscreen = $state(false);
	let currentSection = $state<string | null>(null);
	let panelWidth = $state(loadWidth());

	function loadWidth(): number {
		if (typeof localStorage === 'undefined') return DEFAULT_WIDTH;
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const n = parseInt(stored, 10);
			if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n;
		}
		return DEFAULT_WIDTH;
	}

	function currentIndex(): number {
		if (!currentSection) return -1;
		return RULEBOOK_SECTIONS.findIndex(s => s.slug === currentSection);
	}

	return {
		get isOpen() { return isOpen; },
		get isFullscreen() { return isFullscreen; },
		get currentSection() { return currentSection; },
		get panelWidth() { return panelWidth; },
		get canGoPrev() { return currentIndex() > 0; },
		get canGoNext() { return currentIndex() < RULEBOOK_SECTIONS.length - 1 && currentIndex() >= 0; },
		get prevSection() {
			const idx = currentIndex();
			return idx > 0 ? RULEBOOK_SECTIONS[idx - 1] : null;
		},
		get nextSection() {
			const idx = currentIndex();
			return idx >= 0 && idx < RULEBOOK_SECTIONS.length - 1 ? RULEBOOK_SECTIONS[idx + 1] : null;
		},

		openSection(slug: string) {
			currentSection = slug;
			isOpen = true;
		},

		close() {
			isOpen = false;
			isFullscreen = false;
		},

		toggleFullscreen() {
			isFullscreen = !isFullscreen;
		},

		goPrev() {
			const idx = currentIndex();
			if (idx > 0) {
				currentSection = RULEBOOK_SECTIONS[idx - 1].slug;
			}
		},

		goNext() {
			const idx = currentIndex();
			if (idx >= 0 && idx < RULEBOOK_SECTIONS.length - 1) {
				currentSection = RULEBOOK_SECTIONS[idx + 1].slug;
			}
		},

		setPanelWidth(w: number) {
			panelWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w));
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(STORAGE_KEY, String(panelWidth));
			}
		},

		MIN_WIDTH,
		MAX_WIDTH,
	};
}

export const referencePanelStore = createReferencePanelStore();
