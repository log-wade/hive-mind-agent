#!/usr/bin/env node
/**
 * Hive MCP server. Exposes hive context and outcomes as MCP tools.
 * Run: HIVE_ROOT=/path/to/hive node mcp-server/index.mjs
 * Or: node mcp-server/index.mjs (uses process.cwd())
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadConfig, readContext, listOutcomes, readOutcome } from '../core/index.mjs';
import { resolve } from 'path';

const HIVE_ROOT = process.env.HIVE_ROOT || process.cwd();

const server = new McpServer({
  name: 'hive-mind',
  version: '1.0.0',
});

server.registerTool(
  'hive_read_context',
  {
    description: 'Read the hive shared context (goals, strategy, pending tasks, recent outcomes, learnings). Use HIVE_ROOT env to set hive directory.',
    inputSchema: z.object({
      root: z.string().optional().describe('Hive root directory (default: HIVE_ROOT or cwd)'),
    }),
  },
  async (args) => {
    try {
      const root = args.root ? resolve(args.root) : HIVE_ROOT;
      const config = await loadConfig(root);
      const contextPath = config?.contextPath ?? 'context.md';
      const parsed = await readContext(root, contextPath);
      return {
        content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
    }
  }
);

server.registerTool(
  'hive_write_context',
  {
    description: 'Write updated context to the hive. Pass full markdown content.',
    inputSchema: z.object({
      content: z.string().describe('Full context.md markdown content'),
      root: z.string().optional().describe('Hive root directory'),
    }),
  },
  async (args) => {
    try {
      const root = args.root ? resolve(args.root) : HIVE_ROOT;
      const config = await loadConfig(root);
      const contextPath = config?.contextPath ?? 'context.md';
      const { writeFile } = await import('fs/promises');
      const { join } = await import('path');
      const path = join(root, contextPath);
      await writeFile(path, args.content);
      return { content: [{ type: 'text', text: `Written to ${path}` }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
    }
  }
);

server.registerTool(
  'hive_list_outcomes',
  {
    description: 'List outcome files in the hive outcomes directory (newest first).',
    inputSchema: z.object({
      root: z.string().optional().describe('Hive root directory'),
      limit: z.number().optional().describe('Max outcomes to return (default 20)'),
    }),
  },
  async (args) => {
    try {
      const root = args.root ? resolve(args.root) : HIVE_ROOT;
      const config = await loadConfig(root);
      const outcomesPath = config?.outcomesPath ?? 'outcomes';
      const outcomes = await listOutcomes(root, outcomesPath);
      const limit = args.limit ?? 20;
      const limited = outcomes.slice(0, limit);
      return {
        content: [{ type: 'text', text: JSON.stringify(limited) }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
    }
  }
);

server.registerTool(
  'hive_read_outcome',
  {
    description: 'Read a single outcome file by filename (e.g. 2024-01-15-auth-explore.md).',
    inputSchema: z.object({
      filename: z.string().describe('Outcome filename'),
      root: z.string().optional().describe('Hive root directory'),
    }),
  },
  async (args) => {
    try {
      const root = args.root ? resolve(args.root) : HIVE_ROOT;
      const config = await loadConfig(root);
      const outcomesPath = config?.outcomesPath ?? 'outcomes';
      const content = await readOutcome(root, outcomesPath, args.filename);
      return { content: [{ type: 'text', text: content }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
    }
  }
);

server.registerTool(
  'hive_get_config',
  {
    description: 'Get the hive configuration (targetProducts, paths, adapters).',
    inputSchema: z.object({
      root: z.string().optional().describe('Hive root directory'),
    }),
  },
  async (args) => {
    try {
      const root = args.root ? resolve(args.root) : HIVE_ROOT;
      const config = await loadConfig(root);
      return {
        content: [{ type: 'text', text: JSON.stringify(config || {}, null, 2) }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
