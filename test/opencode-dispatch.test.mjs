import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const superspecDir = path.join(repoRoot, '.opencode', 'superspec');
const applyCommandFile = path.join(
  repoRoot,
  '.opencode',
  'command',
  'superspec-apply.md'
);

/**
 * Minimal frontmatter splitter, adapted from test/opencode-command-set.test.mjs:
 * expects the file to start with a `---` delimited YAML block. Returns
 * { frontmatter, body } where frontmatter is a flat map of top-level
 * `key: value` pairs (good enough for the scalar fields these command files
 * use — no nested structures needed here).
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

const dispatchTemplateFiles = [
  'implementer-prompt.md',
  'task-reviewer-prompt.md',
  'final-reviewer-prompt.md',
];

test('Role differentiated by prompt, not agent name', () => {
  const contents = {};
  for (const name of dispatchTemplateFiles) {
    const fullPath = path.join(superspecDir, name);
    assert.ok(
      fs.existsSync(fullPath),
      `expected OpenCode dispatch template ${fullPath} to exist`
    );
    contents[name] = fs.readFileSync(fullPath, 'utf8');
  }

  for (const name of dispatchTemplateFiles) {
    const text = contents[name];

    assert.ok(
      text.includes('subagent_type: general') &&
        !text.includes('subagent_type: general-purpose'),
      `${name}: must dispatch with "subagent_type: general" (bare, not the Claude Code "general-purpose" value)`
    );

    assert.ok(
      !text.includes('subagent_type: general-purpose'),
      `${name}: must not use the Claude Code "general-purpose" subagent_type`
    );

    // No role-specific custom subagent_type values (e.g. "subagent_type:
    // implementer") — OpenCode's Task tool only accepts explore, general, or
    // the primary agent's own name, so every role must go through "general".
    const subagentTypeLines = text
      .split(/\r?\n/)
      .filter((line) => /subagent_type\s*:/.test(line));
    for (const line of subagentTypeLines) {
      assert.match(
        line,
        /subagent_type:\s*general\b/,
        `${name}: found a subagent_type line that isn't "general": "${line.trim()}"`
      );
    }
  }

  // The three files must be content-distinct from each other (the role
  // comes from the prompt content, not the dispatch call, which is
  // identical across all three).
  const [implementer, taskReviewer, finalReviewer] = dispatchTemplateFiles.map(
    (name) => contents[name]
  );
  assert.notEqual(implementer, taskReviewer);
  assert.notEqual(implementer, finalReviewer);
  assert.notEqual(taskReviewer, finalReviewer);
});

test('Apply command stays at nesting depth 1', () => {
  const contents = fs.readFileSync(applyCommandFile, 'utf8');
  const { frontmatter } = parseFrontmatter(contents);

  const hasSubtask = Object.prototype.hasOwnProperty.call(
    frontmatter,
    'subtask'
  );
  if (hasSubtask) {
    assert.notEqual(
      frontmatter.subtask,
      'true',
      'superspec-apply.md frontmatter must not set subtask: true — that would nest its own ' +
        'Task-tool dispatches at depth 2 instead of depth 1'
    );
  } else {
    assert.ok(
      true,
      'subtask is absent from frontmatter, which defaults to depth 1'
    );
  }
});
