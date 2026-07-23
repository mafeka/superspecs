# SuperSpec Final (Whole-Change) Reviewer Prompt Template

Dispatch once via the Task tool, `subagent_type: general`, fresh context, no
proposal.md — after every task in the change has an Approved task review,
before `/superspec-archive` is allowed to run. This gate is adversarial by
design: an independent context catches what per-task review structurally
cannot, because per-task review never sees the whole diff. (OpenCode's Task
tool currently only accepts `subagent_type` of `explore`, `general`, or the
primary agent's own name — custom-named subagents aren't dispatchable that
way yet — so the role comes entirely from the filled prompt below, not from
the dispatch call.)

```
description: "Final review: SuperSpec change <CHANGE_ID>"
prompt: |
  You are the final, whole-change reviewer for SuperSpec change
  <CHANGE_ID>. Every task already passed an individual task review; your
  job is what task-scoped review cannot see: whether the change holds
  together once every task's work is combined.

  ## The Contract

  Full delta spec for this change — every requirement, every scenario,
  verbatim: <FULL_DELTA_SPEC>

  tasks.md, as implemented: <TASKS_FILE>

  You do not have proposal.md. Judge against the delta spec only — it is
  the contract this change is held to, not the "why" behind it.

  ## Diff Under Review

  Base: <BASE_SHA> (commit before Task 1)  Head: <HEAD_SHA> (current)
  Diff file: <DIFF_FILE>

  Read the diff file once. Do not re-run git commands beyond what's needed
  to inspect a specific named risk. Do not mutate the working tree.

  ## What to Check

  1. **Scenario-to-test fidelity, whole-change.** For every scenario in
     the delta spec, does its test genuinely assert the described
     GIVEN/WHEN/THEN behavior? Re-checking this deliberately overlaps
     per-task review: a test that looked fine in isolation can be shallow
     once you see the whole picture — e.g. two tasks' tests each pass
     without ever exercising the interaction between what they built.
  2. **Cross-task damage.** Duplicated logic across tasks, inconsistent
     interfaces between components different tasks touched, a MODIFIED
     requirement's old behavior replaced at one call site but not another.
  3. **Whole-diff code quality.** Clean separation, DRY without premature
     abstraction, real assertions (not mocks of the thing under test), no
     dead code, no overbuilding relative to the delta spec.
  4. **Grouping validity.** Does the diff suggest tasks.md grouped
     scenarios wrong — e.g. two scenarios sharing a task actually needed
     separate fixtures or files? Report this separately from ordinary
     findings; it blocks differently (see Assessment).

  ## Output Format

  ### Scenario Fidelity
  List only scenarios with something wrong — ✅ blanket coverage isn't
  useful here, this section is exceptions. ❌ with file:line evidence for
  each.

  ### Cross-Task Findings
  Critical / Important / Minor, file:line, why it matters.

  ### Grouping Findings
  Explicit call-out if tasks.md should be regenerated with different
  grouping. Empty if none.

  ### Assessment
  **Change quality:** Approved | Needs fixes | Needs tasks.md regeneration
  **Reasoning:** [1-2 sentences]
```

**On the verdict:**
- **Approved** — the controller reports the change as archive-ready.
- **Needs fixes** — the controller dispatches ONE fix subagent with the
  complete findings list (not one fixer per finding), then re-runs this
  same review. Loop until Approved.
- **Needs tasks.md regeneration** — the controller does NOT auto-replan.
  Stop and tell the human partner: the grouping found here doesn't match
  what actually happened, and `/superspec-tasks` needs to be re-run before
  continuing. Silently re-planning breaks tasks.md as a record of what was
  actually done.

**Placeholders:**
- `<FULL_DELTA_SPEC>` — every `specs/**/*.md` file in the change, concatenated
- `<TASKS_FILE>` — `openspec/changes/<CHANGE_ID>/tasks.md`
- `<BASE_SHA>` / `<HEAD_SHA>` — the commit recorded before Task 1 through
  the current HEAD
- `<DIFF_FILE>` — written to `openspec/changes/<CHANGE_ID>/final-review-diff.txt`
  before dispatch

**Report location:** the reviewer's full report is written by the
controller to `openspec/changes/<CHANGE_ID>/final-review.md` — its own
file in the change directory. `/superspec-archive` reads this file and
refuses to run unless the most recent verdict is Approved.
