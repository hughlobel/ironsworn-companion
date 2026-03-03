import { createServer } from 'http';
import type { IncomingMessage, ServerResponse } from 'http';

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

function readBody(req: IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		let body = '';
		req.on('data', chunk => { body += chunk; });
		req.on('end', () => resolve(body));
		req.on('error', reject);
	});
}

function handleRequest(
	req: IncomingMessage,
	res: ServerResponse,
	getCampaignJson: () => string,
	importCampaign: (json: string) => void
): void {
	const url = (req.url ?? '/').split('?')[0];

	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

	// Campaign JSON — GET to fetch, POST to update from web app
	if (url === '/api/campaign') {
		if (req.method === 'POST') {
			readBody(req).then(body => {
				try {
					importCampaign(body);
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end('{"ok":true}');
				} catch (err) {
					res.writeHead(400, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({ ok: false, error: String(err) }));
				}
			}).catch(() => {
				res.writeHead(500);
				res.end('{"ok":false}');
			});
			return;
		}
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(getCampaignJson());
		return;
	}

	res.writeHead(404);
	res.end('Not found');
}

export function startHttpServer(
	getCampaignJson: () => string,
	importCampaign: (json: string) => void,
	port = 7474
): void {
	const server = createServer((req, res) => handleRequest(req, res, getCampaignJson, importCampaign));
	server.listen(port, '127.0.0.1', () => {
		process.stderr.write(`[ironsworn] Companion: http://localhost:${port}\n`);
	});
}
