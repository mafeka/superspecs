import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const installerPath = path.join(repoRoot, 'bin', 'install.js');

function makeTempRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'superspecs-installer-'));
  execFileSync('git', ['init'], { cwd: dir, stdio: 'ignore' });
  return dir;
}

function runInstaller(targetDir, extraArgs = []) {
  return execFileSync('node', [installerPath, targetDir, ...extraArgs], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

test('Default installs both hosts', () => {
  const target = makeTempRepo();
  try {
    runInstaller(target);

    // Claude Code payload set present.
    assert.ok(
      fs.existsSync(path.join(target, '.claude', 'commands', 'superspec-apply.md')),
      '.claude/commands/superspec-apply.md should be installed by default'
    );
    assert.ok(
      fs.existsSync(path.join(target, '.claude', 'superspec')),
      '.claude/superspec should be installed by default'
    );

    // OpenCode payload set present.
    assert.ok(
      fs.existsSync(path.join(target, '.opencode', 'command', 'superspec-apply.md')),
      '.opencode/command/superspec-apply.md should be installed by default'
    );
    assert.ok(
      fs.existsSync(path.join(target, '.opencode', 'agent', 'superspec.md')),
      '.opencode/agent/superspec.md should be installed by default'
    );
    assert.ok(
      fs.existsSync(path.join(target, '.opencode', 'superspec')),
      '.opencode/superspec should be installed by default'
    );
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});

test('Host flag restricts to one payload set', () => {
  const target = makeTempRepo();
  try {
    runInstaller(target, ['--host', 'opencode']);

    // OpenCode payload set present.
    assert.ok(
      fs.existsSync(path.join(target, '.opencode', 'command', 'superspec-apply.md')),
      '.opencode/command/superspec-apply.md should be installed with --host opencode'
    );
    assert.ok(
      fs.existsSync(path.join(target, '.opencode', 'agent', 'superspec.md')),
      '.opencode/agent/superspec.md should be installed with --host opencode'
    );
    assert.ok(
      fs.existsSync(path.join(target, '.opencode', 'superspec')),
      '.opencode/superspec should be installed with --host opencode'
    );

    // No .claude/ at all.
    assert.ok(
      !fs.existsSync(path.join(target, '.claude')),
      '.claude/ should not be created when --host opencode is passed'
    );
  } finally {
    fs.rmSync(target, { recursive: true, force: true });
  }
});
