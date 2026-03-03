import type { Campaign } from '$lib/data/types';
import { campaignStore } from './campaign.svelte';

const STORAGE_KEY = 'ironsworn-campaign';

export function saveToLocalStorage() {
	try {
		const data = campaignStore.toCampaign();
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (e) {
		console.error('Failed to save campaign:', e);
	}
}

export function loadFromLocalStorage(): boolean {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return false;
		const data: Campaign = JSON.parse(raw);
		campaignStore.loadCampaign(data);
		return true;
	} catch (e) {
		console.error('Failed to load campaign:', e);
		return false;
	}
}

export function clearLocalStorage() {
	localStorage.removeItem(STORAGE_KEY);
}

export function exportCampaignJSON(): string {
	const data = campaignStore.toCampaign();
	return JSON.stringify(data, null, 2);
}

export function importCampaignJSON(json: string): boolean {
	try {
		const data: Campaign = JSON.parse(json);
		if (!data.id || !data.character || !data.name) {
			throw new Error('Invalid campaign data');
		}
		campaignStore.loadCampaign(data);
		saveToLocalStorage();
		return true;
	} catch (e) {
		console.error('Failed to import campaign:', e);
		return false;
	}
}

export async function saveToMcp(): Promise<void> {
	try {
		const res = await fetch('/api/campaign', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: exportCampaignJSON()
		});
		if (!res.ok) {
			console.error('[MCP sync] POST failed:', res.status, await res.text().catch(() => ''));
		}
	} catch {
		// MCP server not running — degrade gracefully
	}
}

export function downloadCampaignFile() {
	const json = exportCampaignJSON();
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${campaignStore.campaignName.replace(/\s+/g, '-').toLowerCase()}.ironsworn.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export function uploadCampaignFile(): Promise<boolean> {
	return new Promise((resolve) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json,.ironsworn.json';
		input.onchange = async () => {
			const file = input.files?.[0];
			if (!file) return resolve(false);
			try {
				const text = await file.text();
				resolve(importCampaignJSON(text));
			} catch {
				resolve(false);
			}
		};
		input.click();
	});
}
