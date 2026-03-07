#!/usr/bin/env node
/**
 * NOC cycle: ingest alerts, single-turn LLM triage, write outcome.
 * Usage: HIVE_ROOT=/path node runner.mjs
 */

import { resolve } from 'path';
import { loadConfig, createLLMProvider, writeOutcome } from '../../core/index.mjs';
import { readContext, writeContext } from './context.mjs';
import { createMockAdapter } from './adapters/mock.mjs';
import { createTools } from './tools.mjs';
import { getSystemPrompt } from './prompts.mjs';

const HIVE_ROOT = resolve(process.env.HIVE_ROOT || process.cwd());

export async function runCycle(hiveRoot, config = null) {
  const hiveConfig = config || (await loadConfig(hiveRoot));
  const contextPath = hiveConfig?.contextPath ?? 'context.md';
  const outcomesPath = hiveConfig?.outcomesPath ?? 'outcomes';

  const llmConfig = hiveConfig?.adapters?.llm;
  if (!llmConfig || llmConfig.type === 'cursor' || !llmConfig.type) {
    throw new Error('Set adapters.llm in hive.config.json to anthropic, openai, or ollama for NOC cycles.');
  }
  const llm = createLLMProvider(llmConfig);

  const adapter = createMockAdapter();
  const tools = createTools(adapter, {
    hiveRoot,
    readContext: (root) => readContext(root, contextPath),
    writeContext: (root, content) => writeContext(root, content),
  });

  let contextSummary = '';
  try {
    const ctx = await tools.read_context();
    contextSummary = typeof ctx.raw === 'string' ? ctx.raw.slice(0, 2000) : JSON.stringify(ctx).slice(0, 2000);
  } catch {
    contextSummary = '(no context)';
  }

  const alerts = await tools.read_alerts({});
  const userMessage = `Current context (excerpt):\n${contextSummary}\n\nIngested alerts (${alerts.length}):\n${JSON.stringify(alerts, null, 2)}\n\nTriage these alerts. Summarize your decisions and any recommended actions in 2-4 sentences.`;

  const response = await llm.complete({
    prompt: userMessage,
    systemPrompt: getSystemPrompt(),
    maxTokens: 2048,
  });

  const outcomeContent = `# NOC cycle outcome\n\n**Generated:** ${new Date().toISOString()}\n\n## Triage summary\n\n${response}\n`;
  await writeOutcome(hiveRoot, outcomesPath, 'noc-cycle', outcomeContent);

  return { ok: true, summary: response.slice(0, 500) };
}

async function main() {
  try {
    const result = await runCycle(HIVE_ROOT);
    console.log('Cycle complete:', result.summary?.slice(0, 100) ?? 'ok');
  } catch (err) {
    console.error('Cycle failed:', err.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
