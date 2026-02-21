#!/usr/bin/env node
/**
 * Install hive-mind-orchestrator skill to ~/.cursor/skills/
 * Run: npm run skill:install
 */

import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILL_SOURCE = join(ROOT, 'skill');
const SKILL_DEST = join(process.env.HOME || process.env.USERPROFILE, '.cursor', 'skills', 'hive-mind-orchestrator');

const FILES = ['SKILL.md', 'reference.md', 'CONTEXT_TEMPLATE.md'];

async function install() {
  try {
    await readdir(SKILL_SOURCE);
  } catch (e) {
    console.error('Skill source not found at', SKILL_SOURCE);
    process.exit(1);
  }

  await mkdir(SKILL_DEST, { recursive: true });
  for (const f of FILES) {
    const src = join(SKILL_SOURCE, f);
    try {
      const content = await readFile(src, 'utf-8');
      await writeFile(join(SKILL_DEST, f), content);
      console.log('  Installed', f);
    } catch (e) {
      if (e.code === 'ENOENT') console.log('  Skipped (missing)', f);
      else throw e;
    }
  }
  console.log('\nSkill installed to', SKILL_DEST);
  console.log('Restart Cursor or reload the window for the skill to be discovered.');
}

install().catch((e) => {
  console.error(e);
  process.exit(1);
});
