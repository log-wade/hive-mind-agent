#!/usr/bin/env node
/**
 * NOC cycle: ingest alerts, triage with LLM tool loop, write outcome.
 * Usage: HIVE_ROOT=/path node runner.mjs
 */

import { resolve } from 'path';
import { loadConfig, createLLMProvider, writeOutcome } from '../../core/index.mjs';
import { readContext, writeContext } from './context.mjs';
import { createMockAdapter } from './adapters/mock.mjs';
import { createTools } from './tools.mjs';
import { getSystemPrompt, getToolLoopSystemPrompt } from './prompts.mjs';

const HIVE_ROOT = resolve(process.env.HIVE_ROOT || process.cwd());
const MAX_TOOL_TURNS = 30;

function parseJsonResponse(text) {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

async function invokeTool(tools, toolName, args = {}) {
  const fn = tools[toolName];
  if (typeof fn !== 'function') return { error: `Unknown tool: ${toolName}` };
  try {
    const result = await fn(args);
    return typeof result === 'object' && result !== null ? result : { result };
  } catch (err) {
    return { error: err.message };
  }
}

export async function runCycle(hiveRoot, config = null) {
  const hiveConfig = config || (await loadConfig(hiveRoot));
  const contextPath = hiveConfig?.contextPath ?? 'context.md';
  const outcomesPath = hiveConfig?.outcomesPath ?? 'outcomes';
  let nocConfig = hiveConfig?.noc || {};
  try {
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');
    const nocPath = join(hiveRoot, 'noc.config.json');
    const raw = await readFile(nocPath, 'utf-8').catch(() => null);
    if (raw) nocConfig = { ...nocConfig, ...JSON.parse(raw) };
  } catch {
    // use hiveConfig.noc only
  }
  const remediationAllowList = nocConfig.remediationAllowList ?? [];
  const shadowMode = nocConfig.shadowMode === true;

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
    remediationAllowList,
    shadowMode,
  });

  let contextSummary = '';
  try {
    const ctx = await tools.read_context();
    contextSummary = typeof ctx.raw === 'string' ? ctx.raw.slice(0, 2000) : JSON.stringify(ctx).slice(0, 2000);
  } catch {
    contextSummary = '(no context)';
  }

  const alerts = await tools.read_alerts({});
  let prompt = `Current context (excerpt):\n${contextSummary}\n\nIngested alerts (${alerts.length}):\n${JSON.stringify(alerts, null, 2)}\n\nTriage using tools. When done, respond with {"complete_task": "your summary"}.`;

  for (let i = 0; i < MAX_TOOL_TURNS; i++) {
    const response = await llm.complete({
      prompt,
      systemPrompt: getToolLoopSystemPrompt(),
      maxTokens: 1024,
    });

    const parsed = parseJsonResponse(response);
    if (!parsed) {
      prompt += `\n\nAssistant (invalid JSON, retry with JSON only):\n${response}`;
      continue;
    }

    if (parsed.complete_task != null) {
      const summary = String(parsed.complete_task);
      const outcomeContent = `# NOC cycle outcome\n\n**Generated:** ${new Date().toISOString()}\n\n## Triage summary\n\n${summary}\n`;
      await writeOutcome(hiveRoot, outcomesPath, 'noc-cycle', outcomeContent);
      return { ok: true, summary };
    }

    if (parsed.tool && typeof parsed.tool === 'string') {
      const toolResult = await invokeTool(tools, parsed.tool, parsed.args || {});
      prompt += `\n\nAssistant:\n${response}\n\nTool result (${parsed.tool}):\n${JSON.stringify(toolResult)}\n\nContinue or respond with {"complete_task": "summary"}.`;
    } else {
      prompt += `\n\nAssistant:\n${response}\n\nRespond with a tool call or complete_task.`;
    }
  }

  const outcomeContent = `# NOC cycle outcome (incomplete)\n\n**Generated:** ${new Date().toISOString()}\n\nMax tool turns reached; manual review recommended.\n`;
  await writeOutcome(hiveRoot, outcomesPath, 'noc-cycle', outcomeContent);
  return { ok: false, summary: 'Cycle incomplete (max turns)' };
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
