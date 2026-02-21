/**
 * File-based outcome store. Reads/writes outcomes/YYYY-MM-DD-slug.md
 * @module hive-core/adapters/file-outcome-store
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * @param {string} rootDir
 * @param {string} outcomesPath
 * @param {string} slug
 * @param {string} content
 * @param {string} [date] YYYY-MM-DD
 */
export async function writeOutcome(rootDir, outcomesPath, slug, content, date = new Date().toISOString().slice(0, 10)) {
  const dir = join(rootDir, outcomesPath);
  await mkdir(dir, { recursive: true });
  const filename = `${date}-${slug}.md`;
  const path = join(dir, filename);
  await writeFile(path, content);
  return path;
}

/**
 * @param {string} rootDir
 * @param {string} outcomesPath
 * @returns {Promise<string[]>} Sorted outcome filenames (newest first)
 */
export async function listOutcomes(rootDir, outcomesPath) {
  const dir = join(rootDir, outcomesPath);
  try {
    const files = await readdir(dir);
    return files.filter((f) => f.endsWith('.md')).sort().reverse();
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

/**
 * @param {string} rootDir
 * @param {string} outcomesPath
 * @param {string} filename
 * @returns {Promise<string>}
 */
export async function readOutcome(rootDir, outcomesPath, filename) {
  const path = join(rootDir, outcomesPath, filename);
  return readFile(path, 'utf-8');
}
