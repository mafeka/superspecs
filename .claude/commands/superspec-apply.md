---
name: "SuperSpec: Apply"
description: Dispatch one fresh implementer subagent per task with a per-task TDD cycle, review each against its scenarios, then run an adversarial whole-change review that gates archive.
allowed-tools: Bash(openspec:*), Bash(node:*), Bash(git:*), Agent, Read, Write, Edit
category: Workflow
tags: [workflow, superspec, apply, tdd]
---

Implement a SuperSpec change task-by-task: fresh implementer subagent per
task (per-task RED/GREEN/REFACTOR across all of that task's scenarios),
fresh reviewer subagent per task (scenario compliance + quality), then one
adversarial whole-change reviewer after every task is approved. The final
reviewer's verdict gates `/superspec-archive`.

**Input**: Optionally a change name. If omitted, infer from context; if
ambiguous, run `openspec list --json` and use **AskUserQuestion**.

**Preflight**

1. Confirm this is a git repository (`git rev-parse --is-inside-work-tree`).
   Task review and the final review both work from git diffs — if this
   isn't a git repo, stop and ask whether to `git init` before continuing.

2. Select the change, confirm schema is `superspec` via
   `openspec status --change "<name>" --json`, and confirm the `tasks`
   artifact is `done` (tasks.md exists). If not, stop and point at
   `/superspec-tasks`.

3. Run the semantic lint before touching any code:
   ```bash
   node scripts/superspec-lint.mjs "<name>"
   ```
   If it fails, stop. Implementing against an inconsistent tasks.md
   produces work that doesn't match what tasks.md claims — fix it via
   `/superspec-tasks` first, don't patch around a failing lint here.

4. Record `CHANGE_BASE_SHA` = current `git rev-parse HEAD` — the commit
   before Task 1. This is the base for the final review's diff; never
   derive it as `HEAD~N`, which silently drops commits if a task makes more
   than one.

5. Check for an existing ledger at `openspec/changes/<name>/progress.md`.
   Tasks it lists as complete are done — skip re-dispatching them, resume
   at the first task not marked complete. This file is scoped to this
   change specifically so it never collides with another change's progress.

**Per-Task Loop** (sequential — never dispatch implementers for two tasks
in parallel; the review loop and TDD cycle assume one task in flight)

For each pending task in `tasks.md`, in order:

1. Resolve the task's delta-spec section: using the scenario IDs, spec
   names, and scenario names recorded on the task's line and its indented
   sub-bullets, pull the exact verbatim GIVEN/WHEN/THEN text and the owning
   `### Requirement:` block(s) from the relevant `specs/<capability>/spec.md`
   file. This is all the subagent gets from the spec — no proposal.md.

2. Record `TASK_BASE_SHA` = current `git rev-parse HEAD`.

3. Dispatch an implementer subagent using
   `.claude/superspec/implementer-prompt.md`, filled with this task's
   scenarios, requirement block(s), test file path (from the task's
   `[test: ...]` tag), and a report file path
   (`openspec/changes/<name>/reports/task-<TASK_ID>-report.md`, e.g.
   `task-T1-report.md` — always the task's `T`-prefixed ID, never a bare
   loop index).

4. **Handle implementer status:**
   - **DONE / DONE_WITH_CONCERNS**: proceed to review. For CONCERNS, read
     them first — address correctness/scope doubts before dispatching the
     reviewer, note-and-proceed for pure observations.
   - **NEEDS_CONTEXT**: provide what's missing, re-dispatch the same subagent.
   - **BLOCKED**: assess why. Context gap → provide it and re-dispatch.
     Needs more reasoning → this project has no model-tiering config, so
     re-dispatch is on the same model with a more explicit brief. Task
     genuinely too large → this is a grouping problem, stop and point at
     `/superspec-tasks` for regeneration, don't split it yourself here.

5. Generate the review package: `git diff --stat` and `git diff -U10` for
   `TASK_BASE_SHA..HEAD`, written to
   `openspec/changes/<name>/reports/task-<TASK_ID>-diff.txt`.

6. Dispatch a task reviewer using
   `.claude/superspec/task-reviewer-prompt.md`, filled with the same
   scenario/requirement text the implementer got, the report file, and the
   diff file.

7. **On "Needs fixes"**: dispatch the same implementer subagent lineage
   with the complete findings list (all Critical/Important items — not one
   fixer call per finding), then re-review. Loop until Approved. Never
   proceed with open Critical/Important issues.

8. **On Approved**: mark the task's checkbox `- [x]` in tasks.md, and
   append one line to `openspec/changes/<name>/progress.md`:
   `Task <TASK_ID>: complete (commits <base7>..<head7>, review approved)`.

9. Continue to the next pending task without pausing to check in. Stop
   only for: a BLOCKED status you can't resolve, ambiguity that genuinely
   blocks progress, or all tasks complete.

**Final Review** (once every task is complete and approved)

1. Concatenate every `specs/**/*.md` delta file in the change into
   `<FULL_DELTA_SPEC>`.

2. Generate the whole-change diff: `git diff --stat` and `git diff -U10`
   for `CHANGE_BASE_SHA..HEAD`, written to
   `openspec/changes/<name>/final-review-diff.txt`.

3. Dispatch the final reviewer using
   `.claude/superspec/final-reviewer-prompt.md` — fresh subagent, no
   proposal.md, the full delta spec, tasks.md, and the diff file.

4. Write its full report to `openspec/changes/<name>/final-review.md`.

5. **On the verdict:**
   - **Approved**: report the change as archive-ready. `/superspec-archive`
     will check this same file before running.
   - **Needs fixes**: dispatch ONE fix subagent with the complete findings
     list, re-run the final review against the new diff, loop until Approved.
   - **Needs tasks.md regeneration**: STOP. Tell the user directly — the
     grouping this review found doesn't match how the change actually
     came together, and `/superspec-tasks` needs to regenerate it. Do not
     silently replan `tasks.md` yourself.

**Guardrails**
- One implementer subagent in flight at a time — never parallel
- Never skip a task review, and never accept a report missing either
  verdict half (scenario compliance AND quality)
- Never move to the next task with open Critical/Important issues
- The ledger (`progress.md`) lives inside `openspec/changes/<name>/` —
  never write it to a global or repo-root location
- The final reviewer never receives proposal.md — it judges the delta
  spec only
- Don't dispatch a fix for a "Needs tasks.md regeneration" verdict — that
  path ends in a stop, not a fix loop

**Output**

Report progress per task as it completes (task N/M, status, one-line test
summary), and a final summary: total tasks, ledger state, final review
verdict, and whether `/superspec-archive` is unblocked.
