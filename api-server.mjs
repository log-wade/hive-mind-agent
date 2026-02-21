#!/usr/bin/env node
/**
 * Hive API server. Exposes context and cycle endpoints.
 * Run: HIVE_ROOT=/path/to/hive node api-server.mjs
 * Endpoints:
 *   GET  /api/hive/context  - Read context
 *   PUT  /api/hive/context  - Update context (body: raw markdown)
 *   GET  /api/hive/config   - Get config
 *   GET  /api/hive/outcomes - List outcomes
 *   POST /api/hive/cycle    - Run one cycle (requires LLM; in Cursor mode returns instructions)
 */

import { createServer } from 'http';
import { loadConfig, readContext, writeContext, listOutcomes, createLLMProvider } from './core/index.mjs';
import { resolve } from 'path';

const HIVE_ROOT = process.env.HIVE_ROOT || process.cwd();
const PORT = parseInt(process.env.PORT || '3742', 10);

async function getContextPath() {
  const config = await loadConfig(HIVE_ROOT);
  return config?.contextPath ?? 'context.md';
}

async function getOutcomesPath() {
  const config = await loadConfig(HIVE_ROOT);
  return config?.outcomesPath ?? 'outcomes';
}

async function readRawContext() {
  const { readFile } = await import('fs/promises');
  const { join } = await import('path');
  const contextPath = await getContextPath();
  const path = join(HIVE_ROOT, contextPath);
  return readFile(path, 'utf-8');
}

async function writeRawContext(content) {
  const { writeFile } = await import('fs/promises');
  const { join } = await import('path');
  const contextPath = await getContextPath();
  const path = join(HIVE_ROOT, contextPath);
  await writeFile(path, content);
}

async function handleGetContext(res) {
  try {
    const content = await readRawContext();
    res.writeHead(200, { 'Content-Type': 'text/markdown' });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function handlePutContext(req, res) {
  let body = '';
  for await (const chunk of req) body += chunk;
  try {
    await writeRawContext(body);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function handleGetConfig(res) {
  try {
    const config = await loadConfig(HIVE_ROOT);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(config || {}));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function handleGetOutcomes(res) {
  try {
    const outcomesPath = await getOutcomesPath();
    const outcomes = await listOutcomes(HIVE_ROOT, outcomesPath);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(outcomes));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function handlePostCycle(res) {
  const config = await loadConfig(HIVE_ROOT);
  const llmConfig = config?.adapters?.llm;
  const llm = createLLMProvider(llmConfig);

  if (llmConfig?.type === 'cursor' || !llmConfig?.type) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        message:
          'Cursor mode: run cycle in Cursor. Say "Advance the hive" or "Unleash the hive" to orchestrate.',
        hint: 'Set adapters.llm.type to anthropic, openai, or ollama for headless cycles.',
      })
    );
    return;
  }

  try {
    const contextPath = await getContextPath();
    const parsed = await readContext(HIVE_ROOT, contextPath);
    const systemPrompt = `You are the central brain of a hive-mind. Given the context, decide 2-3 independent tasks.
Return JSON: { "tasks": [ { "description": "...", "prompt": "...", "subagentType": "explore|shell|generalPurpose" } ] }
Only return valid JSON, no markdown.`;
    const prompt = `Context:\nGoals: ${JSON.stringify(parsed.goals)}\nStrategy: ${parsed.strategy}\nPending: ${parsed.pendingTasks}\n\nDecide tasks.`;
    const out = await llm.complete({ prompt, systemPrompt });
    const json = JSON.parse(out.replace(/```json?\n?|\n?```/g, '').trim());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        tasks: json.tasks || [],
        message: 'Tasks decided. Worker execution not implemented in API; use Cursor or MCP.',
      })
    );
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (path === '/api/hive/context' && method === 'GET') return handleGetContext(res);
  if (path === '/api/hive/context' && method === 'PUT') return handlePutContext(req, res);
  if (path === '/api/hive/config' && method === 'GET') return handleGetConfig(res);
  if (path === '/api/hive/outcomes' && method === 'GET') return handleGetOutcomes(res);
  if (path === '/api/hive/cycle' && method === 'POST') return handlePostCycle(res);

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Hive API server on http://localhost:${PORT}`);
  console.log(`HIVE_ROOT: ${HIVE_ROOT}`);
  console.log('Endpoints: GET/PUT /api/hive/context, GET /api/hive/config, GET /api/hive/outcomes, POST /api/hive/cycle');
});
