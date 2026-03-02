import type { PdfKey } from '$lib/data/pdf-types';

const STORAGE_KEY = 'pdf-panel-width';
const DEFAULT_WIDTH = 500;
const MIN_WIDTH = 300;
const MAX_WIDTH = 1200;

function createPdfPanelStore() {
	let isOpen = $state(false);
	let isFullscreen = $state(false);
	let pdfKey = $state<PdfKey | null>(null);
	let currentPage = $state(1);
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

	return {
		get isOpen() { return isOpen; },
		get isFullscreen() { return isFullscreen; },
		get pdfKey() { return pdfKey; },
		get currentPage() { return currentPage; },
		get panelWidth() { return panelWidth; },

		openPdf(key: PdfKey, page: number = 1) {
			pdfKey = key;
			currentPage = page;
			isOpen = true;
		},

		close() {
			isOpen = false;
			isFullscreen = false;
		},

		toggleFullscreen() {
			isFullscreen = !isFullscreen;
		},

		setPage(page: number) {
			currentPage = page;
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

export const pdfPanelStore = createPdfPanelStore();
