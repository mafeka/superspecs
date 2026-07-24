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
