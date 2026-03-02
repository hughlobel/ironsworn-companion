import type { PdfKey } from '$lib/data/pdf-types';

const DB_NAME = 'ironsworn-pdfs';
const DB_VERSION = 1;
const STORE_NAME = 'files';

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			req.result.createObjectStore(STORE_NAME);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

function dbGet(db: IDBDatabase, key: string): Promise<ArrayBuffer | undefined> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly');
		const req = tx.objectStore(STORE_NAME).get(key);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

function dbPut(db: IDBDatabase, key: string, value: ArrayBuffer): Promise<void> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).put(value, key);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

function dbDelete(db: IDBDatabase, key: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).delete(key);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

const ALL_KEYS: PdfKey[] = ['rulebook', 'assets', 'playkit', 'workbook'];

function createPdfStore() {
	let loadedPdfs = $state<Record<PdfKey, boolean>>({
		rulebook: false, assets: false, playkit: false, workbook: false
	});
	let blobUrls = $state<Record<PdfKey, string | null>>({
		rulebook: null, assets: null, playkit: null, workbook: null
	});
	let ready = $state(false);

	let db: IDBDatabase | null = null;

	return {
		get loadedPdfs() { return loadedPdfs; },
		get blobUrls() { return blobUrls; },
		get ready() { return ready; },

		async init() {
			try {
				db = await openDB();
				for (const key of ALL_KEYS) {
					const buf = await dbGet(db, key);
					if (buf) {
						const blob = new Blob([buf], { type: 'application/pdf' });
						blobUrls[key] = URL.createObjectURL(blob);
						loadedPdfs[key] = true;
					}
				}
			} catch (e) {
				console.warn('PDF store init failed:', e);
			}
			ready = true;
		},

		async storePdf(key: PdfKey, file: File) {
			if (!db) return;
			const buf = await file.arrayBuffer();
			await dbPut(db, key, buf);
			// Revoke old URL if any
			if (blobUrls[key]) URL.revokeObjectURL(blobUrls[key]!);
			const blob = new Blob([buf], { type: 'application/pdf' });
			blobUrls[key] = URL.createObjectURL(blob);
			loadedPdfs[key] = true;
		},

		async removePdf(key: PdfKey) {
			if (!db) return;
			await dbDelete(db, key);
			if (blobUrls[key]) URL.revokeObjectURL(blobUrls[key]!);
			blobUrls[key] = null;
			loadedPdfs[key] = false;
		},

		getViewerUrl(key: PdfKey, page: number): string | null {
			const url = blobUrls[key];
			if (!url) return null;
			return `${url}#page=${page}`;
		},

		async getPdfData(key: PdfKey): Promise<ArrayBuffer | null> {
			if (!db) return null;
			const buf = await dbGet(db, key);
			return buf ?? null;
		}
	};
}

export const pdfStore = createPdfStore();
