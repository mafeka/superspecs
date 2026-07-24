# Task T1 Report — OpenCode Command Set

## Summary

Created five OpenCode-native command files under `.opencode/command/`
(`superspec-explore.md`, `superspec-propose.md`, `superspec-tasks.md`,
`superspec-apply.md`, `superspec-archive.md`) as twins of the existing
`.claude/commands/superspec-*.md` files, plus one OpenCode agent
definition (`.opencode/agent/superspec.md`) carrying the tool-permission
profile the Claude commands express via `allowed-tools`. Added
`test/opencode-command-set.test.mjs` (Node's built-in `node:test` runner)
and a `test` script in `package.json`.

## TDD Cycle

### RED (before any `.opencode/*` files existed)

Command run:
```
npm test
```
(`"test": "node --test \"test/**/*.test.mjs\""` in package.json)

Relevant output:
```
✖ Command inventory matches (0.374875ms)
  Error: ENOENT: no such file or directory, scandir '/Users/mfk/Code/superspecs/.opencode/command'
      at Object.readdirSync (node:fs:1884:26)
      at TestContext.<anonymous> (file:///Users/mfk/Code/superspecs/test/opencode-command-set.test.mjs:43:6)
      ...

✖ Frontmatter maps host-specific fields (0.087084ms)
  Error: ENOENT: no such file or directory, scandir '/Users/mfk/Code/superspecs/.opencode/command'
      at Object.readdirSync (node:fs:1884:26)
      at TestContext.<anonymous> (file:///Users/mfk/Code/superspecs/test/opencode-command-set.test.mjs:54:6)
      ...

ℹ tests 2
ℹ pass 0
ℹ fail 2
```

**Why this is the expected failure**: both tests call
`fs.readdirSync('.opencode/command')` before doing anything else. Neither
`.opencode/command/` nor `.opencode/agent/` existed yet, so both scenarios
fail at the same first line, for the same reason (directory doesn't
exist) — not a typo in the test, not a wrong assertion. Confirmed by
reading the stack trace: it points at the `readdirSync` call inside each
test body, not at an import error or syntax problem.

Note on tooling: a bare `node --test` (no path argument) recurses into a
gitignored `_assets/` directory in this working tree (vendored
skill/tooling assets, unrelated to this repo's own code) and picks up
unrelated failing tests (e.g. a missing `ws` module). To keep this
project's `npm test` scoped and pristine, the script is
`node --test "test/**/*.test.mjs"` rather than a bare `node --test`. This
was discovered during the RED step and fixed before recording the
above (clean) RED output.

### Verify RED

Confirmed: both failures are `ENOENT` on `.opencode/command`, exactly the
missing-files reason expected — not a test-authoring mistake.

### GREEN (after creating the five command files and the agent file)

Command run:
```
npm test
```

Output:
```
> superspecs@0.1.0 test
> node --test "test/**/*.test.mjs"

✔ Command inventory matches (0.4735ms)
✔ Frontmatter maps host-specific fields (0.866541ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 42.348208
```

Pristine: 2/2 passing, no warnings, no stray output.

### REFACTOR

No refactor needed beyond the test-script scoping fix already folded into
RED above. Command file bodies were diffed line-by-line against their
Claude Code twins (see Self-Review below) to confirm only the intended
deltas exist; no further cleanup required.

## Files Changed

- `test/opencode-command-set.test.mjs` (new) — two tests, one per scenario
- `package.json` (modified) — added `"scripts": { "test": "node --test \"test/**/*.test.mjs\"" }`
- `.opencode/agent/superspec.md` (new) — agent definition with `permission` block
- `.opencode/command/superspec-explore.md` (new)
- `.opencode/command/superspec-propose.md` (new)
- `.opencode/command/superspec-tasks.md` (new)
- `.opencode/command/superspec-apply.md` (new)
- `.opencode/command/superspec-archive.md` (new)

## Test Names Added, Keyed by Scenario ID

- S3 -> `"Command inventory matches"` — asserts `.opencode/command/superspec-*.md` count === 5
- S4 -> `"Frontmatter maps host-specific fields"` — for every such file, asserts frontmatter has
  an `agent` key, has no `allowed-tools` key, and that the `agent` value resolves to an existing
  `.opencode/agent/<agent>.md` file (i.e. `superspec.md`)

## What Changed Between Each Command and Its Claude Code Twin

Frontmatter: dropped `name`, `allowed-tools`, `category`, `tags` (not part
of the OpenCode command frontmatter contract given); kept `description`
verbatim; added `agent: superspec`. `subtask` is left unset on all five
files (explicit requirement for `superspec-apply`; left unset on the
other four for consistency, as instructed).

Body: preflight/step/guardrail logic copied verbatim except:
- Prose `**Input**: The argument after \`/superspec-x\` is...` replaced
  with `**Input**: ... via \`$ARGUMENTS\` ...` (OpenCode's argument
  placeholder convention, in place of Claude Code's prose convention)
- `**AskUserQuestion**` (a Claude Code-specific tool name) replaced with
  neutral prose ("ask the user directly") in propose/tasks/apply/archive
- In `superspec-apply.md`, the three dispatch-template path references
  (`implementer-prompt.md`, `task-reviewer-prompt.md`,
  `final-reviewer-prompt.md`) were repointed from `.claude/superspec/` to
  `.opencode/superspec/` — the host-specific directory these templates
  will live in once T2 creates them. T1 does not create those template
  files; that's explicitly T2's job. The Task-tool `subagent_type: general`
  dispatch mechanics (Requirement: OpenCode Subagent Dispatch, scenarios
  S5/S6) were deliberately left untouched here — T2's own test file
  (`test/opencode-dispatch.test.mjs`) covers that, and building it now
  would be scope creep.

Full diffs were inspected file-by-file (`diff` against each Claude Code
twin's body) — confirmed every line outside the deltas above is
character-identical.

## Self-Review

- Every scenario (S3, S4) has exactly one named test, no test covers both
- Tests assert against real files on disk (`fs.readdirSync`,
  `fs.readFileSync`, `fs.existsSync`) — no mocking of the thing under test
- All five command bodies preserve their twins' preflight/step/guardrail
  logic verbatim aside from the documented, intentional deltas (input
  placeholder syntax, AskUserQuestion→prose, and the apply.md dispatch
  template path prefix)
- No scope creep: did not build T2's dispatch templates/mechanics, did not
  touch `bin/install.js` or add a `--host` flag (T3), did not add
  `.opencode/*` paths to `package.json`'s `files` array (that's an
  installer/packaging concern, T3's territory)
- `npm test` output is pristine: 2 passing, 0 failing, no warnings

### Concerns

- The `agent` frontmatter field's exact expected value/shape for
  "pointing at `superspec.md`" isn't pinned down anywhere beyond the
  proposal text; I resolved it as `agent: superspec` (bare name, OpenCode
  convention resolves it to `.opencode/agent/superspec.md`) and asserted
  that resolution in the test itself, rather than hardcoding the literal
  string `superspec.md`. If a later task expects the frontmatter value to
  literally be the filename `superspec.md` (including extension), this
  would need revisiting — but the bare-name form matches the "Agent
  files" convention description given for this task (`agent:` names an
  agent, not a path).
- `package.json`'s `test` script uses a glob (`test/**/*.test.mjs`) rather
  than a bare `node --test` because a bare invocation on this checkout
  picks up an unrelated, gitignored `_assets/` tree with pre-existing
  failing tests (missing `ws` dependency, unrelated assertions). This
  keeps `npm test` scoped to this project's own `test/` directory and its
  output pristine, but is a deviation worth flagging since the task
  description suggested a plain `"node --test"` script.
