import { createServer } from 'http';
import type { IncomingMessage, ServerResponse } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = join(__dirname, '..', '..', 'build');

const MIME: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'application/javascript',
	'.css': 'text/css',
	'.svg': 'image/svg+xml',
	'.json': 'application/json',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.ico': 'image/x-icon',
	'.woff2': 'font/woff2',
	'.woff': 'font/woff',
	'.ttf': 'font/ttf',
	'.map': 'application/json',
};

const sseClients = new Set<ServerResponse>();

function toSseLine(campaignJson: string): string {
	// SSE requires data on a single line — compact the JSON to strip newlines
	return `data: ${JSON.stringify(JSON.parse(campaignJson))}\n\n`;
}

export function notifySseClients(campaignJson: string): void {
	const msg = toSseLine(campaignJson);
	for (const client of sseClients) {
		try {
			client.write(msg);
		} catch {
			sseClients.delete(client);
		}
	}
}

function serveFile(filePath: string, res: ServerResponse): boolean {
	if (!existsSync(filePath)) return false;
	if (!statSync(filePath).isFile()) return false;
	const mime = MIME[extname(filePath)] ?? 'application/octet-stream';
	res.writeHead(200, { 'Content-Type': mime });
	res.end(readFileSync(filePath));
	return true;
}

function handleRequest(req: IncomingMessage, res: ServerResponse, getCampaignJson: () => string): void {
	const url = (req.url ?? '/').split('?')[0];

	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.writeHead(204);
		res.end();
		return;
	}

	// SSE sync stream
	if (url === '/api/sync/stream') {
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
		});
		res.write(toSseLine(getCampaignJson()));
		sseClients.add(res);
		req.on('close', () => sseClients.delete(res));
		return;
	}

	// Campaign JSON for manual fetch
	if (url === '/api/campaign') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(getCampaignJson());
		return;
	}

	// Static file serving with SPA fallback
	if (existsSync(STATIC_DIR)) {
		if (serveFile(join(STATIC_DIR, url), res)) return;
		if (serveFile(join(STATIC_DIR, 'index.html'), res)) return;
	}

	res.writeHead(404);
	res.end('Not found');
}

export function startHttpServer(getCampaignJson: () => string, port = 7474): void {
	const server = createServer((req, res) => handleRequest(req, res, getCampaignJson));
	server.listen(port, '127.0.0.1', () => {
		process.stderr.write(`[ironsworn] Companion: http://localhost:${port}\n`);
	});
}
