#!/usr/bin/env node
// Installs SuperSpec into a target repository: the forked openspec schema,
// the semantic lint script, and the /superspec-* slash commands + their
// dispatch templates. Safe to re-run — existing files are skipped unless
// --force is passed.
//
// Usage:
//   node bin/install.js [target-dir] [--force]
//   npx github:mafeka/superspecs [target-dir] [--force]

import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const PAYLOAD_PATHS = [
  'openspec/schemas/superspec',
  'scripts/superspec-lint.mjs',
  '.claude/commands/superspec-explore.md',
  '.claude/commands/superspec-propose.md',
  '.claude/commands/superspec-tasks.md',
  '.claude/commands/superspec-apply.md',
  '.claude/commands/superspec-archive.md',
  '.claude/superspec',
];

function log(message) {
  console.log(`[superspecs] ${message}`);
}

function fail(message) {
  console.error(`[superspecs] ERROR: ${message}`);
  process.exit(1);
}

function commandExists(cmd) {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  return spawnSync(probe, [cmd], { stdio: 'ignore' }).status === 0;
}

function run(cmd, args, cwd) {
  execFileSync(cmd, args, { stdio: 'inherit', cwd });
}

function parseArgs(argv) {
  const force = argv.includes('--force');
  const positional = argv.filter((a) => !a.startsWith('--'));
  const target = positional[0] ? resolve(positional[0]) : process.cwd();
  return { target, force };
}

function ensureGit(target) {
  if (!commandExists('git')) {
    fail('git is required (task review and the final review in /superspec-apply both work from git diffs).');
  }
  if (!existsSync(join(target, '.git'))) {
    log('Target is not a git repository yet.');
    log('/superspec-apply requires one — run `git init` there before using it. Continuing with the rest of setup.');
  }
}

// Returns the openspec binary to use for the rest of this run: the global
// command if present, otherwise the local devDependency's binary. A plain
// `npm install --save-dev` does not put node_modules/.bin on this script's
// own PATH, so every later `openspec` invocation must go through this
// resolved path rather than the bare string 'openspec'.
function resolveOpenspecBin(target) {
  if (commandExists('openspec')) return 'openspec';

  const localBin = join(target, 'node_modules', '.bin', 'openspec');
  if (existsSync(localBin)) return localBin;

  if (existsSync(join(target, 'package.json'))) {
    log('openspec CLI not found on PATH — adding it as a devDependency...');
    run('npm', ['install', '--save-dev', '@fission-ai/openspec'], target);
    if (existsSync(localBin)) return localBin;
    fail('Installed @fission-ai/openspec but could not find its binary at node_modules/.bin/openspec afterward.');
  }

  fail(
    'openspec CLI not found, and there is no package.json in the target to add it to.\n' +
    '  Install it with `npm install -g @fission-ai/openspec` and re-run this installer.'
  );
}

function ensureOpenspecRoot(openspecBin, target) {
  if (existsSync(join(target, 'openspec'))) {
    log('openspec/ already exists — skipping `openspec init`.');
    return;
  }
  log('Running `openspec init --tools claude`...');
  run(openspecBin, ['init', '.', '--tools', 'claude'], target);
}

function installPayload(target, force) {
  for (const rel of PAYLOAD_PATHS) {
    const src = join(PACKAGE_ROOT, rel);
    const dest = join(target, rel);

    if (!existsSync(src)) {
      fail(`Missing expected source path in this package: ${rel}`);
    }
    if (existsSync(dest) && !force) {
      log(`Skipping ${rel} (already exists — pass --force to overwrite)`);
      continue;
    }

    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true, force: true });
    log(`Installed ${rel}`);
  }
}

function setDefaultSchema(target) {
  const configPath = join(target, 'openspec', 'config.yaml');
  if (!existsSync(configPath)) {
    log('No openspec/config.yaml found — skipping default-schema setup.');
    return;
  }

  const content = readFileSync(configPath, 'utf8');
  const updated = /^schema:\s*\S+/m.test(content)
    ? content.replace(/^schema:\s*\S+/m, 'schema: superspec')
    : `schema: superspec\n${content}`;

  if (updated !== content) {
    writeFileSync(configPath, updated);
    log('Set default schema to `superspec` in openspec/config.yaml');
  } else {
    log('openspec/config.yaml already defaults to `superspec`.');
  }
}

function validateSchema(openspecBin, target) {
  log('Validating the superspec schema...');
  run(openspecBin, ['schema', 'validate', 'superspec'], target);
}

function main() {
  const { target, force } = parseArgs(process.argv.slice(2));

  if (!existsSync(target)) {
    fail(`Target directory does not exist: ${target}`);
  }

  log(`Installing into ${target}${force ? ' (--force: overwriting existing files)' : ''}`);

  ensureGit(target);
  const openspecBin = resolveOpenspecBin(target);
  ensureOpenspecRoot(openspecBin, target);
  installPayload(target, force);
  setDefaultSchema(target);
  validateSchema(openspecBin, target);

  log('Done.');
  log('Restart your IDE (or reload the Claude Code window) to pick up the new slash commands.');
  log('Then try: /superspec-explore, /superspec-propose, /superspec-tasks, /superspec-apply, /superspec-archive');
}

main();
