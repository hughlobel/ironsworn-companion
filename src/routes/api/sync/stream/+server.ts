import { readFileSync, watch } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';
import type { RequestHandler } from '@sveltejs/kit';

export const prerender = false;

const STATE_DIR = join(homedir(), '.ironsworn-mcp');
const STATE_FILE = join(STATE_DIR, 'campaign.json');

export const GET: RequestHandler = () => {
	const encoder = new TextEncoder();
	let watcher: ReturnType<typeof watch> | null = null;

	const stream = new ReadableStream({
		start(controller) {
			function send(data: string) {
				controller.enqueue(encoder.encode(`data: ${data}\n\n`));
			}

			function readCompact(): string | null {
				try {
					return JSON.stringify(JSON.parse(readFileSync(STATE_FILE, 'utf-8')));
				} catch {
					return null;
				}
			}

			// Send current state immediately on connect
			const initial = readCompact();
			send(initial ?? 'null');

			// Watch the directory — more reliable than watching the file directly,
			// since the MCP does an atomic rename (campaign.json.tmp → campaign.json)
			try {
				watcher = watch(STATE_DIR, (_event, filename) => {
					if (filename && basename(filename) !== 'campaign.json') return;
					// Small delay to let the rename fully settle on Windows
					setTimeout(() => {
						const data = readCompact();
						if (data) send(data);
					}, 50);
				});
			} catch {
				// STATE_DIR doesn't exist yet — no watcher, but initial state
				// was already sent above so the client isn't left empty
			}
		},
		cancel() {
			watcher?.close();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
};
