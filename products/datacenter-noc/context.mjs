/**
 * Context helpers: read/write hive context. Delegates to hive core.
 * Use from runner with HIVE_ROOT.
 */

import { readContext as readContextCore, writeContext as writeContextCore } from '../../core/index.mjs';

/**
 * @param {string} hiveRoot
 * @param {string} [contextPath='context.md']
 * @returns {Promise<{ raw: string, goals: string[], strategy: string, pendingTasks: string, recentOutcomes: string, learnings: string[] }>}
 */
export async function readContext(hiveRoot, contextPath = 'context.md') {
  return readContextCore(hiveRoot, contextPath);
}

/**
 * @param {string} hiveRoot
 * @param {string} content - Full markdown content
 * @param {string} [contextPath='context.md']
 */
export async function writeContext(hiveRoot, content, contextPath = 'context.md') {
  return writeContextCore(hiveRoot, content, contextPath);
}
