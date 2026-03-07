#!/usr/bin/env node
/**
 * Agentic workflow runner: 24/7 scheduled workflows.
 * Loads workflows from workflows/workflows.json, runs LLM single-turn per schedule,
 * writes outcomes to outcomes/.
 *
 * Usage:
 *   HIVE_ROOT=/path/to/hive node workflows/runner.mjs
 *   PORT and HIVE_ROOT from env; uses hive.config.json for contextPath, outcomesPath, adapters.llm.
 */

import { createRequire } from 'module';
import { resolve, join } from 'path';
import { readFile } from 'fs/promises';
import {
  loadConfig,
  readContext,
  writeOutcome,
  createLLMProvider,
} from '../core/index.mjs';

const require = createRequire(import.meta.url);
const cron = require('node-cron');

const HIVE_ROOT = resolve(process.env.HIVE_ROOT || process.cwd());
const WORKFLOWS_FILE = 'workflows.json';

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

/**
 * Resolve workflow definitions: workflows/workflows.json in HIVE_ROOT, or hive.config.workflows.
 * @returns {Promise<Array<{ id: string, name: string, schedule: string, systemPrompt: string, promptTemplate: string, outcomeSlug: string, enabled?: boolean }>>}
 */
async function loadWorkflows() {
  const workflowsPath = join(HIVE_ROOT, 'workflows', WORKFLOWS_FILE);
  try {
    const raw = await readFile(workflowsPath, 'utf-8');
    const data = JSON.parse(raw);
    const list = Array.isArray(data.workflows) ? data.workflows : data;
    return list.filter((w) => w.schedule && w.promptTemplate && w.outcomeSlug && w.id);
  } catch (e) {
    if (e.code === 'ENOENT') {
      log(`No ${WORKFLOWS_FILE} found at ${workflowsPath}; no scheduled workflows.`);
      return [];
    }
    throw e;
  }
}

/**
 * Render prompt template with context and date.
 * Placeholders: {{context.raw}}, {{date}}, {{goals}}, {{strategy}}, {{pendingTasks}}, {{learnings}}, {{outcomeSlug}}
 */
function renderTemplate(template, context, outcomeSlug) {
  const date = new Date().toISOString().slice(0, 10);
  const goals = (context.goals || []).join('\n');
  const learnings = (context.learnings || []).join('\n');
  return template
    .replace(/\{\{context\.raw\}\}/g, context.raw || '')
    .replace(/\{\{date\}\}/g, date)
    .replace(/\{\{goals\}\}/g, goals)
    .replace(/\{\{strategy\}\}/g, context.strategy || '')
    .replace(/\{\{pendingTasks\}\}/g, context.pendingTasks || '')
    .replace(/\{\{learnings\}\}/g, learnings)
    .replace(/\{\{outcomeSlug\}\}/g, outcomeSlug || '');
}

/**
 * Run a single workflow once: read context, call LLM, write outcome.
 */
async function runWorkflow(workflow, config, llm) {
  const { id, name, systemPrompt, promptTemplate, outcomeSlug } = workflow;
  const contextPath = config?.contextPath ?? 'context.md';
  const outcomesPath = config?.outcomesPath ?? 'outcomes';

  let context;
  try {
    context = await readContext(HIVE_ROOT, contextPath);
  } catch (e) {
    log(`[${id}] Skip: could not read context: ${e.message}`);
    return;
  }

  const prompt = renderTemplate(promptTemplate, context, outcomeSlug);
  log(`[${id}] Running: ${name}`);

  let response;
  try {
    response = await llm.complete({
      prompt,
      systemPrompt: systemPrompt || 'You are a helpful assistant. Respond in markdown.',
      maxTokens: 8192,
    });
  } catch (e) {
    log(`[${id}] LLM error: ${e.message}`);
    const errorOutcome = `# Outcome: ${name}\n\n**Status:** failed\n\n## Error\n${e.message}\n`;
    await writeOutcome(HIVE_ROOT, outcomesPath, outcomeSlug, errorOutcome);
    return;
  }

  const outcomeContent = `# Outcome: ${name}\n\n**Status:** success\n**Generated:** ${new Date().toISOString()}\n\n## Result\n\n${response}\n`;
  await writeOutcome(HIVE_ROOT, outcomesPath, outcomeSlug, outcomeContent);
  log(`[${id}] Wrote outcome: ${outcomesPath} (slug: ${outcomeSlug})`);
}

async function main() {
  log(`HIVE_ROOT: ${HIVE_ROOT}`);

  const config = await loadConfig(HIVE_ROOT);
  if (!config) {
    log('No hive.config.json found; runner will use defaults for context/outcomes paths.');
  }

  const llmConfig = config?.adapters?.llm;
  if (!llmConfig || llmConfig.type === 'cursor' || !llmConfig.type) {
    log(
      'Set adapters.llm in hive.config.json to anthropic, openai, or ollama for headless runs. ' +
        'Example: "adapters": { "llm": { "type": "anthropic" } }. Exiting.'
    );
    process.exit(1);
  }

  const llm = createLLMProvider(llmConfig);
  const workflows = await loadWorkflows();
  if (workflows.length === 0) {
    log('No workflows to schedule. Create workflows/workflows.json (see workflows/workflows.example.json). Exiting.');
    process.exit(0);
  }

  for (const w of workflows) {
    if (w.enabled === false) {
      log(`Skip disabled workflow: ${w.id}`);
      continue;
    }
    const valid = cron.validate(w.schedule);
    if (!valid) {
      log(`Invalid cron "${w.schedule}" for ${w.id}; skip.`);
      continue;
    }
    cron.schedule(w.schedule, async () => {
      await runWorkflow(w, config, llm);
    });
    log(`Scheduled: ${w.id} (${w.name}) at ${w.schedule}`);
  }

  log('Workflow runner is live. Press Ctrl+C to stop.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
