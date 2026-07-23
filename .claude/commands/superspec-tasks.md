---
name: "SuperSpec: Tasks"
description: Derive tasks.md from a SuperSpec change's delta specs, with explicit scenario grouping and a hard semantic-lint gate.
allowed-tools: Bash(openspec:*), Bash(node:*), Read, Write, Edit, Grep, Glob
category: Workflow
tags: [workflow, superspec, tasks]
---

Derive `tasks.md` for a SuperSpec change: group its scenarios into tasks,
record the grouping in machine-readable form, and gate on semantic lint.
Grouping is decided here and only here — `/superspec-apply` reads and
dispatches, it does not replan.

**Input**: Optionally a change name (e.g. `/superspec-tasks token-refresh`).
If omitted, infer from conversation context; if ambiguous, run
`openspec list --json` and use **AskUserQuestion** to let the user pick.
Announce "Using change: <name>".

**Steps**

1. **Select the change**, then confirm its schema:
   ```bash
   openspec status --change "<name>" --json
   ```
   If `schemaName` is not `superspec`, stop — this command only applies to
   the superspec schema.

   Check the `tasks` artifact's status in the `artifacts` array. If
   `blocked`, report `missingDeps` and stop (usually means specs aren't
   done yet). If `done`, tasks.md already exists — confirm with the user
   before overwriting.

2. **Read the source material**:
   - `proposal.md` — for the capability list and any grouping hint it recorded
   - Every delta spec file under `artifactPaths.specs.existingOutputPaths`
   - `design.md` if `artifactPaths.design.existingOutputPaths` is non-empty
     (it's optional — proceed without it if absent)
   - The relevant parts of the actual codebase the proposal's Impact
     section names — enough to judge what shares a fixture/test file and
     what doesn't, and to pick realistic target test file paths that match
     this project's existing test conventions
   - The tasks format itself:
     ```bash
     openspec instructions tasks --change "<name>" --json
     ```
     Read the returned `template` and `instruction` — they're the
     authoritative source for the `[scenarios: ...] [test: ...]` task-line
     format and the 4-scenario cap. Follow them exactly; don't rely on
     memory of what the format looked like last time you ran this — the
     schema is what `scripts/superspec-lint.mjs` and `/superspec-apply`
     are actually built against, so it's what wins on drift.

3. **Get the authoritative scenario ID list** — never invent IDs, never
   derive them by reading spec markdown yourself:
   ```bash
   node scripts/superspec-lint.mjs --list-scenarios "<name>"
   ```
   This prints a JSON array of `{id, spec, operation, requirementIndex,
   requirementText}` in document order. `requirementIndex` is a global
   1-based counter over every requirement in the change (including
   REMOVED/RENAMED, so it reflects true document position) — it's what
   disambiguates two requirements that happen to share identical SHALL
   text. Only `ADDED`/`MODIFIED` requirements produce scenario entries;
   `REMOVED`/`RENAMED` contribute none, and need no tasks.

4. **Bind each scenario ID to its name and text.** Consecutive entries
   sharing the same `requirementIndex` belong to the same requirement, in
   order — grouping this way is exact, `requirementIndex` never collides.
   For each such group: open the group's `spec` capability's delta file,
   and find the `### Requirement:` block whose SHALL sentence matches
   `requirementText`. If exactly one block in that file matches, use it.
   If more than one matches (only possible when two requirements in the
   same file are textually identical), disambiguate by counting
   `### Requirement:` blocks in document order across *all* of this
   change's delta files, in the same order `--list-scenarios` iterated
   them, and take the one at position `requirementIndex`. Then zip that
   requirement's `#### Scenario:` headings top-to-bottom against the
   group's scenario IDs in order. This gives you, per ID: capability,
   requirement block, scenario name, and verbatim GIVEN/WHEN/THEN text.

5. **Group scenarios into tasks:**
   - Group scenarios that share a test fixture or touch the same unit
   - Split scenarios that would produce independent test files
   - Hard cap: 4 scenarios per task
   - Use the proposal's grouping hint as a starting point, but verify it
     against what you actually found reading the codebase — the hint may
     be wrong once the code's real shape is known

6. **Write `tasks.md`** using the `template` from step 2, with the
   grouping made explicit per the `[scenarios: ...] [test: ...]` format it
   specifies. The `[scenarios: ...]` tag is required and lint-checked. The
   `[test: ...]` tag and the indented scenario-name sub-bullets are for
   `/superspec-apply` and for humans; they aren't lint-checked, but keep
   them accurate — apply resolves each task's delta-spec section by
   re-reading the ID/name/spec binding you record here, it does not
   re-derive it.

7. **Gate on semantic lint** — this is a hard failure, not a warning:
   ```bash
   node scripts/superspec-lint.mjs "<name>"
   ```
   If it fails, fix `tasks.md` yourself and re-run until it passes. Do not
   hand back a tasks.md that fails lint.

8. **Report**: schema, scenario count, task count, lint result, and the
   task list with its scenario/test-file groupings.

**Guardrails**
- Grouping decisions belong here, not at propose or apply time
- Every scenario ID must come from `--list-scenarios` output — never
  hand-numbered or guessed
- Every scenario must end up in exactly one task (lint enforces this, but
  don't rely on lint to catch a mistake you could avoid)
- 4-scenario cap is hard, not a suggestion
- Don't touch proposal.md or the delta spec files — this command only writes tasks.md
