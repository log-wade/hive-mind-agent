/**
 * Hive-mind core. Platform-agnostic orchestrator interfaces.
 * @module hive-core
 */

export { readContext, writeContext, parseContext } from './adapters/file-context-store.mjs';
export { readOutcome, writeOutcome, listOutcomes } from './adapters/file-outcome-store.mjs';
export {
  createCursorProvider,
  createAnthropicProvider,
  createOpenAIProvider,
  createOllamaProvider,
  createLLMProvider,
} from './adapters/llm-provider.mjs';

/**
 * Load config from hive root.
 * @param {string} rootDir
 * @returns {Promise<import('./types.js').HiveConfig | null>}
 */
export async function loadConfig(rootDir) {
  const { readFile } = await import('fs/promises');
  const { join } = await import('path');
  const paths = [
    join(rootDir, 'hive.config.json'),
    join(rootDir, '.hive', 'config.json'),
  ];
  for (const p of paths) {
    try {
      const content = await readFile(p, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
  return null;
}
