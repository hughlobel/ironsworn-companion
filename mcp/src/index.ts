#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { CampaignState } from './state.js';
import { startHttpServer, notifySseClients } from './http.js';
import type { Move, OracleTable, AssetDefinition, RulebookSection } from './types.js';

import { registerDiceTools } from './tools/dice-tools.js';
import { registerOracleTools } from './tools/oracle-tools.js';
import { registerMoveTools } from './tools/move-tools.js';
import { registerCharacterTools } from './tools/character-tools.js';
import { registerCampaignTools } from './tools/campaign-tools.js';
import { registerWorldTools } from './tools/world-tools.js';
import { registerRulebookTools } from './tools/rulebook-tools.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadJson<T>(filename: string): T {
	const path = resolve(__dirname, 'data', filename);
	return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

// Load data
const movesData = loadJson<{ moves: Move[]; categories: { id: string; name: string; category: string }[] }>('moves.json');
const oraclesData = loadJson<{ tables: OracleTable[] }>('oracles.json');
const assetsData = loadJson<{ assets: AssetDefinition[] }>('assets.json');
const rulebookData = loadJson<{ sections: RulebookSection[] }>('rulebook-index.json');

// Init state
const state = new CampaignState();
startHttpServer(() => state.exportCampaign());
state.onSave(() => notifySseClients(state.exportCampaign()));

// Create server
const server = new McpServer({
	name: 'ironsworn',
	version: '1.0.0'
});

// Register all tools
registerDiceTools(server, state);
registerOracleTools(server, state, oraclesData.tables);
registerMoveTools(server, state, movesData.moves);
registerCharacterTools(server, state, assetsData.assets);
registerCampaignTools(server, state);
registerWorldTools(server, state, oraclesData.tables);
registerRulebookTools(server, rulebookData.sections);

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
