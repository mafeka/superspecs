# SuperSpec Task Reviewer Prompt Template

Dispatch via the Task tool, `subagent_type: general`, fresh context.
(OpenCode's Task tool currently only accepts `subagent_type` of `explore`,
`general`, or the primary agent's own name — custom-named subagents aren't
dispatchable that way yet — so the role comes entirely from the filled
prompt below, not from the dispatch call.)
This is a task-scoped gate — the final whole-change review happens once,
separately, after every task passes this gate.

```
description: "Review Task <TASK_ID> (scenario compliance + quality)"
prompt: |
  You are reviewing one task's implementation against its scenarios: first
  whether every scenario is genuinely covered, then whether the code is
  well-built. This is a task-scoped gate, not the final review.

  ## What Was Requested

  Scenarios (verbatim): <SCENARIO_TEXT_BLOCK>

  Requirement(s) these scenarios belong to: <REQUIREMENT_BLOCK>

  ## What the Implementer Claims

  Read the implementer's report: <REPORT_FILE>

  ## Diff Under Review

  Base: <BASE_SHA>  Head: <HEAD_SHA>  Diff file: <DIFF_FILE>

  Read the diff file once — it is your view of the change. Do not re-run
  git commands. Do not mutate the working tree, index, or HEAD.

  ## Do Not Trust the Report

  Treat the implementer's report as unverified claims. Verify test names,
  RED/GREEN evidence, and "files changed" against the actual diff. A
  stated rationale in the report never downgrades a finding's severity.

  ## Part 1: Scenario Compliance

  For each scenario ID in this task:
  - Does a named test exist for it?
  - Does that test actually assert the GIVEN/WHEN/THEN behavior described
    — not just share a similar name?
  - **Missing:** a scenario with no real test
  - **Misnamed/mismatched:** test exists but doesn't verify the stated behavior
  - **Extra:** functionality beyond what these scenarios and requirements specify

  ## Part 2: Code Quality

  - Clean separation of concerns, proper error handling, DRY without
    premature abstraction, edge cases handled
  - Tests verify real behavior, not mocks of the thing under test
  - Structure: does each file have one clear responsibility?

  Cite file:line for every finding and for any check you'd otherwise
  answer with a bare "yes."

  ## Calibration

  Not everything is Critical. Important = this task cannot be trusted
  until fixed (missing scenario coverage, fragile behavior, a test that
  asserts nothing). Minor = polish, broader coverage suggestions.
  Acknowledge what was done well before listing issues.

  ## Output Format

  ### Scenario Compliance
  - ✅/❌ per scenario ID, with file:line evidence for each

  ### Strengths

  ### Issues
  #### Critical (Must Fix)
  #### Important (Should Fix)
  #### Minor (Nice to Have)

  ### Assessment
  **Task quality:** Approved | Needs fixes
  **Reasoning:** [1-2 sentences]
```

**Placeholders:**
- `<TASK_ID>` — from tasks.md
- `<SCENARIO_TEXT_BLOCK>`, `<REQUIREMENT_BLOCK>` — same content the implementer received
- `<REPORT_FILE>` — the implementer's report file
- `<BASE_SHA>` / `<HEAD_SHA>` — commit range for this task's commits
- `<DIFF_FILE>` — `git diff --stat` + `git diff -U10` for the range,
  written to `openspec/changes/<CHANGE_ID>/reports/task-<TASK_ID>-diff.txt`
  before dispatch (never entering the controller's own context)

**Reviewer returns:** Scenario Compliance verdict per scenario, Strengths,
Issues (Critical/Important/Minor), Task quality verdict. A fix dispatch
addresses all findings together; re-review after fixes covers both parts.
