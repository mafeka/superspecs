import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const commandDir = path.join(repoRoot, '.opencode', 'command');
const agentDir = path.join(repoRoot, '.opencode', 'agent');

/**
 * Minimal frontmatter splitter: expects the file to start with a `---`
 * delimited YAML block. Returns { frontmatter, body } where frontmatter is a
 * flat map of top-level `key: value` pairs (good enough for the scalar
 * fields these command files use — no nested structures needed here).
 */
function parseFrontmatter(fileContents) {
  const match = fileContents.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  assert.ok(match, 'file must start with a --- delimited frontmatter block');
  const [, rawFrontmatter, body] = match;
  const frontmatter = {};
  for (const line of rawFrontmatter.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }
  return { frontmatter, body };
}

test('Command inventory matches', () => {
  const files = fs
    .readdirSync(commandDir)
    .filter((name) => /^superspec-.*\.md$/.test(name));
  assert.equal(
    files.length,
    5,
    `expected exactly 5 superspec-*.md command files, found ${files.length}: ${files.join(', ')}`
  );
});

test('Frontmatter maps host-specific fields', () => {
  const files = fs
    .readdirSync(commandDir)
    .filter((name) => /^superspec-.*\.md$/.test(name));
  assert.ok(files.length > 0, 'no command files found to check');

  for (const file of files) {
    const fullPath = path.join(commandDir, file);
    const contents = fs.readFileSync(fullPath, 'utf8');
    const { frontmatter } = parseFrontmatter(contents);

    assert.ok(
      Object.prototype.hasOwnProperty.call(frontmatter, 'agent'),
      `${file}: frontmatter must declare an "agent" field`
    );
    assert.ok(
      !Object.prototype.hasOwnProperty.call(frontmatter, 'allowed-tools'),
      `${file}: frontmatter must not declare "allowed-tools" (that's the Claude Code twin's field)`
    );

    const agentName = frontmatter.agent;
    const agentFile = path.join(agentDir, `${agentName}.md`);
    assert.ok(
      fs.existsSync(agentFile),
      `${file}: agent field "${agentName}" must resolve to .opencode/agent/${agentName}.md`
    );
  }
});
