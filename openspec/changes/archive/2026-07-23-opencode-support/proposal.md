## Why

SuperSpec's five-command TDD-dispatch workflow only runs on Claude Code today. OpenCode exposes an equivalent Task-tool/agent primitive, so the same workflow can run there too.

## What Changes

- Add `.opencode/command/superspec-*.md`: OpenCode-native twins of the five commands, same preflight/loop/guardrail logic
- Add `.opencode/agent/superspec.md` carrying tool permissions (OpenCode has no per-command `allowed-tools`)
- Add OpenCode dispatch-template twins (implementer/task-reviewer/final-reviewer) using Task tool `subagent_type: general`; role lives in the prompt, not the agent name — OpenCode can't Task-dispatch custom-named subagents yet
- `superspec-apply`'s OpenCode command runs as primary (`subtask: false`) so its dispatches stay at Task-tool nesting depth 1
- `bin/install.js` gains `--host <claude|opencode|all>` (default `all`)

## Capabilities

### New Capabilities
- `installer`: host-targeted install via `--host` selecting claude/opencode/all payload sets
- `opencode-commands`: OpenCode-native commands, agent permissions, and dispatch templates

## Impact
`bin/install.js`, new `.opencode/command/*.md`, `.opencode/agent/superspec.md`, OpenCode dispatch templates, `package.json` files list, README.
