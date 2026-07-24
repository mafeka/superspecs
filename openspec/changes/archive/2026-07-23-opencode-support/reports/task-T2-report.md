# Task T2 Report — OpenCode Subagent Dispatch Templates

## Summary

Created the three OpenCode-native dispatch templates referenced (but not yet
created) by T1's `.opencode/command/superspec-apply.md`:
`.opencode/superspec/implementer-prompt.md`,
`.opencode/superspec/task-reviewer-prompt.md`,
`.opencode/superspec/final-reviewer-prompt.md`. Verified S6 (apply command
stays at nesting depth 1) — already satisfied by T1, no fix needed.

## RED Evidence

Command: `npx --no-install node --test test/opencode-dispatch.test.mjs`

Before creating the three `.opencode/superspec/*.md` files:

```
✖ Role differentiated by prompt, not agent name (0.652042ms)
✔ Apply command stays at nesting depth 1 (1.172292ms)
ℹ tests 2
ℹ pass 1
ℹ fail 1
✖ failing tests:
test at test/opencode-dispatch.test.mjs:52:1
✖ Role differentiated by prompt, not agent name (0.652042ms)
  AssertionError [ERR_ASSERTION]: expected OpenCode dispatch template
  /Users/mfk/Code/superspecs/.opencode/superspec/implementer-prompt.md to exist
```

**S5 ("Role differentiated by prompt, not agent name")**: failed for the
expected reason — the three `.opencode/superspec/*-prompt.md` files did not
exist yet. This is genuine RED.

**S6 ("Apply command stays at nesting depth 1")**: passed immediately, with
no code changes made. This is expected, not suspicious: T1 already produced
`.opencode/command/superspec-apply.md` with frontmatter

```yaml
---
description: "..."
agent: superspec
---
```

— `subtask` is entirely absent from the frontmatter (confirmed by direct
read of the file before writing any test or template code). Per the
requirement, absent `subtask` (or `subtask: false`) is the correct,
satisfying state — there was no bug to fix here. This test is a
regression-guard against a future change accidentally introducing
`subtask: true`, not new-behavior verification. I did not modify
`.opencode/command/superspec-apply.md` at all, since it already met the
requirement.

## GREEN Evidence

Command: `npm test`

```
> superspecs@0.1.0 test
> node --test "test/**/*.test.mjs"

✔ Command inventory matches (0.756625ms)
✔ Frontmatter maps host-specific fields (1.858583ms)
✔ Role differentiated by prompt, not agent name (1.252083ms)
✔ Apply command stays at nesting depth 1 (0.231708ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 44.199417
```

All 4 tests pass (2 from T1's `opencode-command-set.test.mjs`, 2 new from
this task), output pristine.

## Files Changed

- `test/opencode-dispatch.test.mjs` (new) — tests for S5 and S6
- `.opencode/superspec/implementer-prompt.md` (new)
- `.opencode/superspec/task-reviewer-prompt.md` (new)
- `.opencode/superspec/final-reviewer-prompt.md` (new)

No existing files were modified. In particular,
`.opencode/command/superspec-apply.md` (T1's output) was read and verified
but left untouched, since its frontmatter already had no `subtask` key.

### Content provenance

Each of the three new template files is a near-verbatim copy of its Claude
Code twin (`.claude/superspec/implementer-prompt.md`,
`.claude/superspec/task-reviewer-prompt.md`,
`.claude/superspec/final-reviewer-prompt.md`), preserving the full TDD
cycle instructions, report format, self-review checklist, scenario
compliance / quality review structure, and calibration guidance verbatim.
The only substantive change per file is the top dispatch-mechanism
paragraph:

- Claude Code twin: "Dispatch via the Agent tool, `subagent_type:
  general-purpose`, fresh context (never a fork — it must not inherit the
  controlling session's history)."
- OpenCode version (all three files): "Dispatch via the Task tool,
  `subagent_type: general`, fresh context." — with an added parenthetical
  explaining *why* all three roles converge on the same `subagent_type`
  value (OpenCode's Task tool only accepts `explore`, `general`, or the
  primary agent's own name as `subagent_type` — custom role names aren't
  dispatchable), and that the role differentiation is carried entirely by
  which prompt template gets filled in and sent.

The embedded `description:`/`prompt:` YAML-ish blocks inside the fenced
code sections were left byte-for-byte identical to the Claude Code twins
(they contain no Claude-Code-specific or OpenCode-specific dispatch
mechanics — just the role content itself), which is exactly what S5
requires: the role comes from the prompt, not from the dispatch call.

## Test Names Added, Keyed by Scenario ID

- S5 -> `'Role differentiated by prompt, not agent name'`
  (in `test/opencode-dispatch.test.mjs`) — asserts each of the three
  `.opencode/superspec/*-prompt.md` files exists, contains
  `subagent_type: general` and never `subagent_type: general-purpose`,
  contains no `subagent_type:` line with any value other than `general`
  (guards against a stray custom role-specific value like
  `subagent_type: implementer`), and that the three files are pairwise
  content-distinct (the role differentiation lives in the prompt content,
  not in a shared dispatch mechanism).
- S6 -> `'Apply command stays at nesting depth 1'`
  (in `test/opencode-dispatch.test.mjs`) — parses
  `.opencode/command/superspec-apply.md`'s frontmatter (reusing the
  hand-rolled YAML-frontmatter splitter from T1's
  `test/opencode-command-set.test.mjs`) and asserts `subtask` is either
  absent or not equal to `'true'`.

## Self-Review Findings

- Every scenario (S5, S6) has exactly one named test, and each test maps
  to exactly one scenario ID.
- Tests assert against real file content (existence, substring checks,
  parsed frontmatter, pairwise inequality) — not mocks. Reading the actual
  files on disk is exactly "the thing under test" here, since the task is
  about file content correctness.
- The three dispatch templates preserve their Claude Code twins' full
  instructional content (TDD cycle, report format, review structure,
  calibration, placeholders section) — verified by direct comparison
  against the twins during writing; only the top dispatch-mechanism
  paragraph differs per file, as instructed.
- No scope creep: `bin/install.js` was not touched, no `--host` flag was
  added (that's T3's job), and none of the five command files from T1 were
  modified — `subtask` in `superspec-apply.md` was already unset, so the
  "fix it if broken" branch of the task did not apply.
- Output pristine: `npm test` produces no warnings, only the four `✔` lines
  and the summary counts.

## Concerns

None. S6 required no code change; this is called out explicitly above
rather than silently treated as a red flag, per the task instructions.
