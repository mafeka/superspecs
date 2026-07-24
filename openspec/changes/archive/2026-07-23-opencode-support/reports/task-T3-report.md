# Task T3 Report — Host-Targeted Install

## Summary

Added a `--host <claude|opencode|all>` flag to `bin/install.js` (default `all`),
splitting the previously single `PAYLOAD_PATHS` list into `SHARED_PAYLOAD_PATHS`
(always installed), `CLAUDE_PAYLOAD_PATHS`, and `OPENCODE_PAYLOAD_PATHS`. Invalid
`--host` values fail loudly via the existing `fail()` helper.

## Files changed

- `bin/install.js` — modified (see diff below)
- `test/installer-host.test.mjs` — new test file

## Test names added, keyed by scenario ID

- S1 -> `"Default installs both hosts"`
- S2 -> `"Host flag restricts to one payload set"`

## RED evidence

Command: `node --test test/installer-host.test.mjs` (run against unmodified `bin/install.js`, before any implementation change)

```
✖ Default installs both hosts (1195.83125ms)
  AssertionError [ERR_ASSERTION]: .opencode/command/superspec-apply.md should be installed by default
✖ Host flag restricts to one payload set (1083.0815ms)
  AssertionError [ERR_ASSERTION]: .opencode/command/superspec-apply.md should be installed with --host opencode
ℹ tests 2
ℹ pass 0
ℹ fail 2
```

Both failed for the expected reason: the unmodified installer has no concept of
an OpenCode payload or a `--host` flag at all — it only ever installs the five
`.claude/commands/superspec-*.md` files and `.claude/superspec`, so
`.opencode/command/superspec-apply.md` never exists regardless of arguments.
Not a typo/setup error — verified by reading the pre-change source, which had
a single hardcoded `PAYLOAD_PATHS` array with only `.claude/*` entries.

## GREEN evidence

Command: `npm test`

```
✔ Default installs both hosts (1130.601875ms)
✔ Host flag restricts to one payload set (1091.278125ms)
✔ Command inventory matches (0.774167ms)
✔ Frontmatter maps host-specific fields (1.714209ms)
✔ Role differentiated by prompt, not agent name (1.535458ms)
✔ Apply command stays at nesting depth 1 (0.203625ms)
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

All 6 tests pass, including the pre-existing T1/T2 tests (unaffected).

## Diff (bin/install.js)

```diff
-const PAYLOAD_PATHS = [
+const SHARED_PAYLOAD_PATHS = [
   'openspec/schemas/superspec',
   'scripts/superspec-lint.mjs',
+];
+
+const CLAUDE_PAYLOAD_PATHS = [
   '.claude/commands/superspec-explore.md',
   '.claude/commands/superspec-propose.md',
   '.claude/commands/superspec-tasks.md',
@@
   '.claude/superspec',
 ];
 
+const OPENCODE_PAYLOAD_PATHS = [
+  '.opencode/command/superspec-explore.md',
+  '.opencode/command/superspec-propose.md',
+  '.opencode/command/superspec-tasks.md',
+  '.opencode/command/superspec-apply.md',
+  '.opencode/command/superspec-archive.md',
+  '.opencode/agent/superspec.md',
+  '.opencode/superspec',
+];
+
+const VALID_HOSTS = ['claude', 'opencode', 'all'];
+
 function parseArgs(argv) {
   const force = argv.includes('--force');
-  const positional = argv.filter((a) => !a.startsWith('--'));
+
+  const hostFlagIndex = argv.indexOf('--host');
+  const host = hostFlagIndex === -1 ? 'all' : argv[hostFlagIndex + 1];
+  if (!VALID_HOSTS.includes(host)) {
+    fail(`Invalid --host value: ${host}. Expected one of: ${VALID_HOSTS.join(', ')}`);
+  }
+
+  const positional = argv.filter((a, i) => {
+    if (a.startsWith('--')) return false;
+    if (i === hostFlagIndex + 1 && hostFlagIndex !== -1) return false; // the --host value itself
+    return true;
+  });
   const target = positional[0] ? resolve(positional[0]) : process.cwd();
-  return { target, force };
+  return { target, force, host };
 }
 
-function installPayload(target, force) {
-  for (const rel of PAYLOAD_PATHS) {
+function installPayload(target, force, host) {
+  const paths = [...SHARED_PAYLOAD_PATHS];
+  if (host === 'claude' || host === 'all') paths.push(...CLAUDE_PAYLOAD_PATHS);
+  if (host === 'opencode' || host === 'all') paths.push(...OPENCODE_PAYLOAD_PATHS);
+
+  for (const rel of paths) {
     ...
 
 function main() {
-  const { target, force } = parseArgs(process.argv.slice(2));
+  const { target, force, host } = parseArgs(process.argv.slice(2));
   ...
-  log(`Installing into ${target}${force ? ' ...' : ''}`);
+  log(`Installing into ${target}${force ? ' ...' : ''} [host: ${host}]`);
   ...
-  installPayload(target, force);
+  installPayload(target, force, host);
```

`resolveOpenspecBin`, `setDefaultSchema`, `validateSchema`, and `package.json`'s
`files` array are untouched. `ensureOpenspecRoot` *was* subsequently modified
(coordinator-approved — see "Follow-up fix" section below) to derive its
`--tools` argument from `host` instead of hardcoding `claude`.

## Self-review

- Every scenario has exactly one named test (S1, S2 above), each asserting on
  real files on disk after a real `execFileSync` child-process run of
  `bin/install.js` against a fresh `mkdtempSync` + `git init` target — no
  mocking of the installer itself, and the real `openspec` CLI on PATH is
  exercised end-to-end (init + schema validate), per instructions.
- Confirmed the default (`node bin/install.js <target>`, no `--host`) now
  installs BOTH `.claude/*` and `.opencode/*` payload sets — this is the
  intended behavior change from before (previously Claude-only), matching
  S1's wording.
- `package.json`'s `files` array, `resolveOpenspecBin`, `setDefaultSchema`, and
  `validateSchema` are byte-for-byte unchanged (confirmed via `git diff`
  showing only `bin/install.js` touched, and the diff above shows no edits to
  those functions). `ensureOpenspecRoot` was intentionally modified per the
  coordinator's follow-up instruction (see "Follow-up fix" section) to make
  its `--tools` argument host-aware — this was explicitly re-approved after
  the coordinator verified `openspec init --help` supports `opencode` and
  comma-separated `--tools` values.
- Test cleanup: each test removes its temp dir in a `finally` block via
  `fs.rmSync(dir, { recursive: true, force: true })`.
- Tests never read/write this repo's own `.claude/` or `.opencode/` — they
  only read `PACKAGE_ROOT` (the repo) as the installer's copy *source*, and
  all assertions target the temp destination directory.
- Output is otherwise pristine. Note: `openspec init`'s own progress/status
  lines ("- Setting up Claude Code...", "✔ Setup complete...") print directly
  to the terminal during the test run even though the test captures the
  installer's stdout via `execFileSync`. This is because those specific lines
  are written to **stderr** by the `openspec` CLI, and `execFileSync`'s
  default `stdio` inherits stderr to the parent process while only piping
  stdout into the captured return value (verified with an isolated repro).
  This is expected, harmless subprocess chatter from a real dependency, not a
  test defect — `npm test`'s final tap-style summary (pass/fail counts) is
  unaffected and clean.

## Follow-up fix — ensureOpenspecRoot made host-aware (coordinator-approved)

The coordinator checked `openspec init --help` and confirmed `--tools` genuinely
accepts `opencode` as a first-class value (and comma-separated lists like
`claude,opencode`), so the original "don't touch `ensureOpenspecRoot`"
instruction was based on a wrong assumption, not a real constraint. Approved fix:

- Added `toolsForHost(host)`: `'claude'` -> `'claude'`, `'opencode'` -> `'opencode'`,
  `'all'` -> `'claude,opencode'`.
- Threaded `host` through to `ensureOpenspecRoot(openspecBin, target, host)`,
  which now runs `openspec init . --tools <toolsForHost(host)>` instead of the
  hardcoded `--tools claude`.
- Reverted the S2 test assertion back to the literal scenario wording: with
  `--host opencode`, no `.claude/` directory exists at all. Removed the
  narrowing comment/workaround.

### RED (re-confirmed against the still-hardcoded `--tools claude` call, before the fix)

Command: `node --test test/installer-host.test.mjs` (test reverted to literal
`!fs.existsSync(path.join(target, '.claude'))`, `ensureOpenspecRoot` not yet changed)

```
✔ Default installs both hosts (1188.618292ms)
✖ Host flag restricts to one payload set (1086.871666ms)
  AssertionError [ERR_ASSERTION]: .claude/ should not be created when --host opencode is passed
      actual: false
      expected: true
ℹ tests 2
ℹ pass 1
ℹ fail 1
```

Failed for the expected reason: `ensureOpenspecRoot` still hardcoded
`--tools claude`, so `openspec init` unconditionally scaffolded
`.claude/commands/opsx/*` and `.claude/skills/*` even under `--host opencode`.

### GREEN (after making `ensureOpenspecRoot` host-aware)

Command: `node --test test/installer-host.test.mjs`

```
- Setting up Claude Code...
✔ Setup complete for Claude Code
- Setting up OpenCode...
✔ Setup complete for OpenCode
Note: Schema commands are experimental and may change.
- Setting up OpenCode...
✔ Setup complete for OpenCode
Note: Schema commands are experimental and may change.
✔ Default installs both hosts (1128.564625ms)
✔ Host flag restricts to one payload set (1069.775084ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

The stderr chatter confirms the correct `--tools` value is chosen per run: the
default/`all` test triggers both "Setting up Claude Code" and "Setting up
OpenCode"; the `--host opencode` test triggers only "Setting up OpenCode".

Manual sanity check of the third `host` value not directly exercised by S1/S2
(`--host claude`): confirmed `openspec init --tools claude` is invoked, no
`.opencode/` is created, and `.claude/commands/superspec-*.md` are installed —
consistent with `toolsForHost('claude') === 'claude'`.

### Full-suite re-run after the fix

Command: `npm test`

```
✔ Default installs both hosts (1080.59225ms)
✔ Host flag restricts to one payload set (1095.059542ms)
✔ Command inventory matches (0.645416ms)
✔ Frontmatter maps host-specific fields (0.932375ms)
✔ Role differentiated by prompt, not agent name (1.113ms)
✔ Apply command stays at nesting depth 1 (0.222833ms)
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

All 6 tests pass — T1/T2's tests unaffected, T3's S1/S2 now assert the literal
scenario wording with no narrowing.

### Diff (fix only)

```diff
-function ensureOpenspecRoot(openspecBin, target) {
+function toolsForHost(host) {
+  if (host === 'claude') return 'claude';
+  if (host === 'opencode') return 'opencode';
+  return 'claude,opencode';
+}
+
+function ensureOpenspecRoot(openspecBin, target, host) {
   if (existsSync(join(target, 'openspec'))) {
     log('openspec/ already exists — skipping `openspec init`.');
     return;
   }
-  log('Running `openspec init --tools claude`...');
-  run(openspecBin, ['init', '.', '--tools', 'claude'], target);
+  const tools = toolsForHost(host);
+  log(`Running \`openspec init --tools ${tools}\`...`);
+  run(openspecBin, ['init', '.', '--tools', tools], target);
 }
```

```diff
-  ensureOpenspecRoot(openspecBin, target);
+  ensureOpenspecRoot(openspecBin, target, host);
   installPayload(target, force, host);
```

## Concern — RESOLVED: ensureOpenspecRoot now host-aware, no longer open

Originally flagged: I verified empirically (before writing any implementation
code, by running the *unmodified* installer against a fresh temp git repo)
that `ensureOpenspecRoot`'s hardcoded `openspec init . --tools claude` call —
which I was initially told not to touch — unconditionally scaffolded its own
`.claude/commands/opsx/*` and `.claude/skills/*` files on every fresh install,
regardless of `--host`. This meant the literal scenario wording ("no `.claude/`
files are created") was not achievable without editing `ensureOpenspecRoot`.

**Resolution:** the coordinator checked `openspec init --help`, confirmed
`--tools` genuinely accepts `opencode` and comma-separated lists (e.g.
`claude,opencode`) as first-class values, and confirmed the original
"don't touch" instruction was based on a wrong assumption rather than a real
constraint. `ensureOpenspecRoot` was made host-aware (see "Follow-up fix"
section above): `host === 'claude'` -> `--tools claude`,
`host === 'opencode'` -> `--tools opencode`, `host === 'all'` ->
`--tools claude,opencode`. S2's assertion was reverted to the literal
scenario wording (`.claude/` does not exist at all under `--host opencode`)
with the narrowing comment removed, and both RED (against the old hardcoded
call) and GREEN (with the fix) were reconfirmed — see evidence above. No
concerns remain open.
