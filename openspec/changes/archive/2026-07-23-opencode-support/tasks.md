## 1. OpenCode Command Set

- [x] T1 [scenarios: S3, S4] [test: test/opencode-command-set.test.mjs] OpenCode-native command files for the five superspec commands, with tool access via an `agent` frontmatter field instead of `allowed-tools`
  - S3 (opencode-commands): Command inventory matches
  - S4 (opencode-commands): Frontmatter maps host-specific fields

## 2. OpenCode Subagent Dispatch

- [x] T2 [scenarios: S5, S6] [test: test/opencode-dispatch.test.mjs] Dispatch templates use Task-tool `subagent_type: general` with role baked into the prompt, and `superspec-apply`'s command frontmatter keeps `subtask` unset so its own dispatches land at nesting depth 1
  - S5 (opencode-commands): Role differentiated by prompt, not agent name
  - S6 (opencode-commands): Apply command stays at nesting depth 1

## 3. Installer Host Targeting

- [x] T3 [scenarios: S1, S2] [test: test/installer-host.test.mjs] `bin/install.js` gains a `--host <claude|opencode|all>` flag (default `all`) selecting which payload set(s) get installed
  - S1 (installer): Default installs both hosts
  - S2 (installer): Host flag restricts to one payload set
