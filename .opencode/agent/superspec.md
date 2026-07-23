---
description: "SuperSpec workflow agent: shared tool-permission profile for the superspec-explore, superspec-propose, superspec-tasks, superspec-apply, and superspec-archive commands."
mode: all
permission:
  edit: allow
  read: allow
  bash:
    "openspec *": allow
    "node *": allow
    "git *": allow
    "*": ask
  task: allow
---

You execute one of SuperSpec's five workflow commands
(`superspec-explore`, `superspec-propose`, `superspec-tasks`,
`superspec-apply`, `superspec-archive`). Follow the command prompt's own
preflight, steps, and guardrails exactly — this agent definition only
carries the tool-permission profile shared across all five; it adds no
workflow behavior of its own.

Permissions summary:
- `openspec`, `node`, and `git` shell commands are allowed outright — every
  SuperSpec command relies on `openspec` CLI calls, `node
  scripts/superspec-lint.mjs`, and (for `superspec-apply`) `git` to record
  and diff commits.
- Other shell commands fall back to asking, since no SuperSpec command
  needs a broader shell surface.
- File read/edit and subagent dispatch (`task`) are allowed outright —
  `superspec-apply` is the only command that dispatches subagents
  (implementer, task-reviewer, final-reviewer), but the permission is
  harmless for the other four commands, which simply never exercise it.
