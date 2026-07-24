# Final Review Fix Pass 1 — opencode-support

## Finding 1 (Important): `package.json` `files` missing OpenCode payload

`bin/install.js`'s `OPENCODE_PAYLOAD_PATHS` requires these paths to exist under
`PACKAGE_ROOT` when installing with `--host opencode` or the default `all`:

```
.opencode/command/superspec-explore.md
.opencode/command/superspec-propose.md
.opencode/command/superspec-tasks.md
.opencode/command/superspec-apply.md
.opencode/command/superspec-archive.md
.opencode/agent/superspec.md
.opencode/superspec
```

None of these were listed in `package.json`'s `files` array, so an npm-registry
install (as opposed to `npx github:...`, which clones the full repo) would ship
a tarball missing `.opencode/*` entirely and hit
`fail('Missing expected source path in this package: .opencode/...')` the
moment `--host opencode` or the (default) `all` ran.

### Fix

Added the same seven entries to `package.json`'s `files` array, immediately
after the existing `.claude/*` entries, mirroring their structure.

### Verification — `npm pack --dry-run --json`

**Before** (from the finding's own investigation): 0 files under `.opencode/`.

**After** — ran `npm pack --dry-run --json` and inspected the resulting file
list:

```
Total files: 26
OpenCode files count: 9
  .opencode/agent/superspec.md
  .opencode/command/superspec-apply.md
  .opencode/command/superspec-archive.md
  .opencode/command/superspec-explore.md
  .opencode/command/superspec-propose.md
  .opencode/command/superspec-tasks.md
  .opencode/superspec/final-reviewer-prompt.md
  .opencode/superspec/implementer-prompt.md
  .opencode/superspec/task-reviewer-prompt.md
```

All five `.opencode/command/superspec-*.md` files, `.opencode/agent/superspec.md`,
and all three files under the `.opencode/superspec` dispatch-template directory
are now present in the packed tarball, matching `OPENCODE_PAYLOAD_PATHS`.

## Finding 2 (Minor): README out of date

`README.md` described SuperSpec as being "for Claude Code" only, listed only
`.claude/*` in the installer's bullet list of what gets installed, and did not
mention the `--host` flag at all.

### Fix

- Opening description line now reads "...for Claude Code and OpenCode."
- The "Install" section's flag description now documents `--host
  <claude|opencode|all>` (default `all`) alongside the existing `--force`, with
  an added example (`npx github:mafeka/superspecs /path/to/repo --host opencode`).
- The installer bullet list now states the default installs both hosts and
  `--host claude`/`--host opencode` restricts to one, and adds two new bullets
  for `.opencode/command/superspec-*.md` and
  `.opencode/agent/superspec.md`/`.opencode/superspec/`, each annotated with
  which `--host` value skips it. Existing `.claude/*` bullets got matching
  "(Claude Code; skipped with `--host opencode`)" annotations for symmetry.

Verified against `bin/install.js`'s actual behavior directly: `VALID_HOSTS =
['claude', 'opencode', 'all']`, `host` defaults to `'all'` when `--host` is
absent (`parseArgs`), and `installPayload` only pushes `CLAUDE_PAYLOAD_PATHS`
when `host === 'claude' || host === 'all'` and only pushes
`OPENCODE_PAYLOAD_PATHS` when `host === 'opencode' || host === 'all'` — matching
what the README now describes.

## Test suite

Ran `npm test` after the `package.json` change: all 6 tests pass, 0 failures.

```
✔ Default installs both hosts
✔ Host flag restricts to one payload set
✔ Command inventory matches
✔ Frontmatter maps host-specific fields
✔ Role differentiated by prompt, not agent name
✔ Apply command stays at nesting depth 1
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

## Files touched

- `/Users/mfk/Code/superspecs/package.json`
- `/Users/mfk/Code/superspecs/README.md`
