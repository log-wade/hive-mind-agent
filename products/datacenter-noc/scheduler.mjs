#!/usr/bin/env node
/**
 * NOC scheduler: run cycle on interval and optional webhook.
 * Usage: HIVE_ROOT=/path [NOC_CYCLE_INTERVAL_MS=60000] [NOC_WEBHOOK_PORT=3743] node scheduler.mjs
 */

import { createServer } from 'http';
import { runCycle } from './runner.mjs';

const HIVE_ROOT = process.env.HIVE_ROOT || process.cwd();
const INTERVAL_MS = parseInt(process.env.NOC_CYCLE_INTERVAL_MS || '60000', 10);
const WEBHOOK_PORT = parseInt(process.env.NOC_WEBHOOK_PORT || '0', 10);

let cycleTimer = null;

async function run() {
  try {
    await runCycle(HIVE_ROOT);
  } catch (err) {
    console.error('[scheduler] cycle failed:', err.message);
  }
}

function startInterval() {
  if (cycleTimer) clearInterval(cycleTimer);
  cycleTimer = setInterval(run, INTERVAL_MS);
  console.log(`[scheduler] NOC cycle every ${INTERVAL_MS}ms`);
}

async function main() {
  await run();
  startInterval();

  if (WEBHOOK_PORT > 0) {
    const server = createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/webhook') {
        run();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(WEBHOOK_PORT, () => {
      console.log(`[scheduler] webhook http://localhost:${WEBHOOK_PORT}/webhook`);
    });
  }
}

main();
