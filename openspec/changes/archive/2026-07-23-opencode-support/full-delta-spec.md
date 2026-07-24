## specs/installer/spec.md

## ADDED Requirements

### Requirement: Host-Targeted Install
The installer SHALL install only the payload set(s) selected by a `--host` flag (`claude`, `opencode`, or `all`), defaulting to `all` when the flag is omitted.

#### Scenario: Default installs both hosts
- **GIVEN** a target repo with no existing SuperSpec files
- **WHEN** `node bin/install.js <target>` runs with no `--host` flag
- **THEN** both the Claude Code and OpenCode payload sets are installed

#### Scenario: Host flag restricts to one payload set
- **GIVEN** a target repo
- **WHEN** `node bin/install.js <target> --host opencode` runs
- **THEN** only the OpenCode payload set is installed and no `.claude/` files are created

## specs/opencode-commands/spec.md

## ADDED Requirements

### Requirement: OpenCode Command Set
SuperSpec SHALL provide OpenCode-native command files for `superspec-explore`, `superspec-propose`, `superspec-tasks`, `superspec-apply`, and `superspec-archive`, each preserving its Claude Code counterpart's preflight, step, and guardrail logic.

#### Scenario: Command inventory matches
- **GIVEN** `.opencode/command/` after install
- **WHEN** listing files matching `superspec-*.md`
- **THEN** there are exactly five, one per Claude Code slash command

#### Scenario: Frontmatter maps host-specific fields
- **GIVEN** an OpenCode command file
- **WHEN** compared to its Claude Code twin
- **THEN** tool restrictions are expressed via the `agent` frontmatter field (pointing at `superspec.md`) instead of `allowed-tools`

### Requirement: OpenCode Subagent Dispatch
`superspec-apply`'s OpenCode command SHALL dispatch implementer, task-reviewer, and final-reviewer roles through the Task tool using `subagent_type: general` with role-specific prompt content, running itself as the primary agent so its own dispatches stay at Task-tool nesting depth 1.

#### Scenario: Role differentiated by prompt, not agent name
- **GIVEN** the OpenCode dispatch templates
- **WHEN** an implementer, task-reviewer, or final-reviewer is dispatched
- **THEN** each Task-tool call uses `subagent_type: general` and the role comes entirely from the filled prompt template

#### Scenario: Apply command stays at nesting depth 1
- **GIVEN** the `.opencode/command/superspec-apply.md` frontmatter
- **WHEN** the command executes
- **THEN** `subtask` is not set to `true`, so its own Task-tool dispatches occur at depth 1 rather than depth 2
