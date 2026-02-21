/**
 * File-based context store. Reads/writes context.md.
 * @module hive-core/adapters/file-context-store
 */

import { readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Parse context.md into structured object (simplified; full parse is markdown).
 * @param {string} content
 * @returns {{ goals: string[], strategy: string, pendingTasks: string[], recentOutcomes: string[], learnings: string[] }}
 */
function parseContext(content) {
  const sections = {};
  let current = null;
  let buffer = [];

  for (const line of content.split('\n')) {
    if (line.startsWith('## ')) {
      if (current) sections[current] = buffer.join('\n').trim();
      current = line.slice(3).trim();
      buffer = [];
    } else {
      buffer.push(line);
    }
  }
  if (current) sections[current] = buffer.join('\n').trim();

  return {
    raw: content,
    goals: parseList(sections['Goals'] || sections[' goals'] || ''),
    strategy: sections['Strategy'] || sections[' strategy'] || '',
    pendingTasks: sections['Pending Tasks'] || sections[' pending tasks'] || '',
    recentOutcomes: sections['Recent Outcomes (last 10)'] || sections['Recent Outcomes'] || '',
    learnings: parseList(sections['Learnings'] || sections[' learnings'] || ''),
  };
}

function parseList(text) {
  return text
    .split('\n')
    .map((s) => s.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

/**
 * @param {string} rootDir
 * @param {string} [contextPath='context.md']
 * @returns {Promise<{ raw: string, goals: string[], strategy: string, pendingTasks: string, recentOutcomes: string, learnings: string[] }>}
 */
export async function readContext(rootDir, contextPath = 'context.md') {
  const path = join(rootDir, contextPath);
  const content = await readFile(path, 'utf-8');
  return parseContext(content);
}

/**
 * @param {string} rootDir
 * @param {string} content
 * @param {string} [contextPath='context.md']
 */
export async function writeContext(rootDir, content, contextPath = 'context.md') {
  const path = join(rootDir, contextPath);
  await writeFile(path, content);
}

export { parseContext };
