# Final Review — opencode-support

Base: 09e3bc9c8d4080f4073e6fedcff9fd5aaba4decf
Head: 307510c3c0553387a1dccba6ceda91f4ae30c765

## History

- First pass (Head 73ef568): **Needs fixes** — Important: `package.json`'s `files`
  array missing the `.opencode/*` payload (confirmed via `npm pack --dry-run`,
  would break npm-registry-distributed installs). Minor: README undocumented
  the `--host` flag and both-host support.
- Fix commit `307510c`: added the `.opencode/*` paths to `package.json`'s `files`
  array; updated README to describe both-host support and `--host <claude|opencode|all>`.
- Re-review (this pass, Head 307510c): **Approved**.

## Scenario Fidelity

None — all six scenarios (S1-S6) hold, independently re-verified:
- S1/S2 (Host-Targeted Install): `test/installer-host.test.mjs` passes; `npm pack
  --dry-run --json` confirms both host payload sets ship in the actual tarball.
- S3/S4 (OpenCode Command Set): `test/opencode-command-set.test.mjs` passes; 5
  command files present, `agent:` frontmatter used (no `allowed-tools`).
- S5/S6 (OpenCode Subagent Dispatch): `test/opencode-dispatch.test.mjs` passes;
  `subagent_type: general` used exclusively, no `subtask: true` in
  `superspec-apply.md`.

## Cross-Task Findings

**Important (prior) — RESOLVED.** `package.json`'s `files` array now lists all 7
`.opencode/*` paths, matching `bin/install.js`'s `OPENCODE_PAYLOAD_PATHS` exactly.
`npm pack --dry-run --json` confirms the tarball actually contains all three files
under `.opencode/superspec/`, the 5 command files, and the agent file. No
`--host opencode`/default-`all` install would hit "Missing expected source path"
from an npm-registry tarball anymore.

**Minor (prior) — RESOLVED.** README now documents `--host <claude|opencode|all>`
(default `all`), checked line-by-line against `bin/install.js`'s actual behavior
(`parseArgs`, `toolsForHost`, `installPayload`) — no inaccuracies found.

No new findings. `npm test` reproduced all 6 passing tests independently. Fix
commit's diff is scoped exactly to `package.json` and `README.md` — no test files,
`.opencode/*`, `.claude/*`, or `bin/install.js` logic touched.

## Grouping Findings

None. The packaging/docs gap was fixed post-hoc without touching scenario/task
boundaries.

## Assessment

**Change quality:** Approved
**Reasoning:** Both prior findings are verified fixed with independent commands
(npm pack, npm test, direct code comparison), the fix commit's diff is scoped
exactly to `package.json` and `README.md` as expected, and all six scenarios still
pass with no regressions introduced.
