---
description: "Archive a completed SuperSpec change, blocked until its final whole-change review reports Approved."
agent: superspec
---

Archive a completed SuperSpec change. This is a thin wrapper around
`openspec archive`, with one real check in front of it: the change's
`/superspec-apply` final review must have approved it.

**Input**: Optionally a change name via `$ARGUMENTS`. If omitted, infer
from context; if ambiguous, run `openspec list --json` and ask the user
directly.

**Steps**

1. **Select the change**, confirm its schema is `superspec`:
   ```bash
   openspec status --change "<name>" --json
   ```

2. **Check the final review gate.** Read
   `openspec/changes/<name>/final-review.md`.
   - **Missing**: stop. `/superspec-apply` hasn't produced a final review
     for this change yet — either it hasn't been run, or not every task is
     complete. Point at `/superspec-apply`.
   - **Present but its most recent "Change quality:" verdict is not
     Approved**: stop. Report the verdict (`Needs fixes` or
     `Needs tasks.md regeneration`) and what it means — don't archive an
     unapproved change, and don't try to resolve the finding yourself here.
   - **Approved**: proceed.

3. **Archive:**
   ```bash
   openspec archive "<name>"
   ```

4. **Report** the result: which capabilities' base specs were
   updated/created, and the change's new archived location.

**Guardrails**
- Never run `openspec archive` without first confirming an Approved final
  review — this is the one thing that makes this command more than a
  shell wrapper, don't skip it under time pressure
- Don't attempt to fix a non-Approved verdict yourself — that's
  `/superspec-apply`'s fix loop, not this command's job
