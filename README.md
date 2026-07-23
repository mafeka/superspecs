# SuperSpec

A spec-driven development workflow that wraps the [OpenSpec](https://github.com/Fission-AI/OpenSpec)
CLI with TDD discipline and subagent-based implementation, for Claude Code.

The core idea: **a Given/When/Then scenario and a test case are the same object.**
Requirements are terse (one SHALL sentence, 1-3 scenarios) and every scenario
maps to exactly one named test, enforced by a semantic lint script that runs
alongside `openspec validate --strict`.

## Install

Into an existing repository (installs into the current directory by default):

```bash
curl -fsSL https://raw.githubusercontent.com/mafeka/superspecs/main/install.sh | bash
```

Or with `npx`:

```bash
npx github:mafeka/superspecs
```

Both accept a target directory and `--force` (overwrite files already installed):

```bash
curl -fsSL https://raw.githubusercontent.com/mafeka/superspecs/main/install.sh | bash -s -- /path/to/repo --force
npx github:mafeka/superspecs /path/to/repo --force
```

**Requirements in the target repo:** `git`, `node` (>= 18), and either the
`openspec` CLI on `PATH` or a `package.json` the installer can add it to as a
devDependency. The target should be (or become) a git repository —
`/superspec-apply`'s task and final reviews both work from `git diff`.

The installer is idempotent: re-running it skips files that already exist
unless `--force` is passed. It will:

- Add `openspec/schemas/superspec/` — the forked OpenSpec schema enforcing
  the terse requirement format
- Add `scripts/superspec-lint.mjs` — the semantic lint (scenario coverage,
  task-size cap, one-sentence requirements)
- Add `.claude/commands/superspec-*.md` — the five slash commands below
- Add `.claude/superspec/` — subagent dispatch prompt templates used by `/superspec-apply`
- Run `openspec init` if the target has no `openspec/` root yet
- Set `openspec/config.yaml`'s default schema to `superspec`

## Commands

| Command | Behavior |
|---|---|
| `/superspec-explore` | Discovery dialogue. Writes no artifacts. |
| `/superspec-propose` | Writes `proposal.md` and terse delta specs, gated on `openspec validate --strict`. |
| `/superspec-tasks` | Derives `tasks.md` with explicit scenario grouping, gated on the semantic lint. |
| `/superspec-apply` | Dispatches one fresh implementer subagent per task (per-task TDD cycle), a fresh reviewer per task, then an adversarial whole-change review that gates archive. |
| `/superspec-archive` | Archives the change — refuses to run until the final review reports Approved. |

Typical flow: `/superspec-propose` → `/superspec-tasks` → `/superspec-apply` → `/superspec-archive`.

## Local development

```bash
node bin/install.js /path/to/target [--force]
```

runs the installer directly from a checkout, without going through `install.sh` or `npx`.
