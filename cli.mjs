#!/usr/bin/env node
/**
 * Hive CLI. Bootstrap and run hive cycles.
 * Usage: node cli.mjs init | advance [--cycles N]
 */

import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, readContext, writeContext, listOutcomes } from './core/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONTEXT_TEMPLATE = `# Hive Context

## Goals

- **Primary:** [Describe the main objective]
- **Target product:** [Product name and path]

## Strategy

[Current approach]

## Pending Tasks

| ID | Description | Assigned | Status |
|----|-------------|----------|--------|
| 1  | [Task]      | -        | pending |

## Recent Outcomes (last 10)

| Date | Task | Status | Result |
|------|------|--------|--------|
|      |      |        |        |

## Learnings

-
`;

const CONFIG_TEMPLATE = {
  version: 1,
  targetProducts: [],
  workspaceRoots: [],
  adapters: {
    context: { type: 'file', options: {} },
    outcome: { type: 'file', options: {} },
    worker: { type: 'cursor', options: {} },
    llm: { type: 'cursor', options: {} },
  },
  maxParallelTasks: 3,
  contextPath: 'context.md',
  outcomesPath: 'outcomes',
};

async function init(cwd = process.cwd()) {
  const configPath = join(cwd, 'hive.config.json');
  const contextPath = join(cwd, 'context.md');
  const outcomesDir = join(cwd, 'outcomes');

  try {
    await readFile(configPath);
    console.log('hive.config.json already exists');
  } catch {
    await writeFile(configPath, JSON.stringify(CONFIG_TEMPLATE, null, 2));
    console.log('Created hive.config.json');
  }

  try {
    await readFile(contextPath);
    console.log('context.md already exists');
  } catch {
    await writeFile(contextPath, CONTEXT_TEMPLATE);
    console.log('Created context.md');
  }

  await mkdir(outcomesDir, { recursive: true });
  console.log('Ensured outcomes/ directory');

  console.log('\nHive initialized. Edit hive.config.json and context.md, then run: hive advance');
}

async function advance(cwd = process.cwd(), cycles = 1) {
  const config = await loadConfig(cwd);
  const contextPath = config?.contextPath ?? 'context.md';
  const outcomesPath = config?.outcomesPath ?? 'outcomes';

  console.log('Hive advance (Cursor mode)');
  console.log('---');
  console.log('When running via CLI, the central brain logic runs in Cursor.');
  console.log('This CLI is for bootstrapping and file inspection.\n');

  const parsed = await readContext(cwd, contextPath);
  console.log('Context summary:');
  console.log('  Goals:', parsed.goals?.length ?? 0);
  console.log('  Strategy:', parsed.strategy ? parsed.strategy.slice(0, 80) + '...' : '(empty)');
  console.log('  Pending tasks: see context.md');

  const outcomes = await listOutcomes(cwd, outcomesPath);
  console.log('  Recent outcomes:', outcomes.length);

  console.log('\nTo run a cycle: open this project in Cursor, enable the hive-mind-central-brain rule, and say "Advance the hive" or "Unleash the hive".');
}

const cmd = process.argv[2] ?? 'help';
const cycles = parseInt(process.argv.find((a) => a.startsWith('--cycles='))?.split('=')[1] ?? '1', 10);
const cwd = process.cwd();

if (cmd === 'init') {
  init(cwd).catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else if (cmd === 'advance') {
  advance(cwd, cycles).catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else {
  console.log(`
Hive CLI — Multi-agent orchestration

Usage:
  node cli.mjs init           Bootstrap hive in current directory
  node cli.mjs advance        Inspect context (full cycle runs in Cursor)

Or: npm run hive:init | hive:advance
`);
}
