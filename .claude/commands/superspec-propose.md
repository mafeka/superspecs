---
name: "SuperSpec: Propose"
description: Write proposal.md and terse GIVEN/WHEN/THEN delta specs for a new or existing SuperSpec change, gated on openspec validate --strict.
allowed-tools: Bash(openspec:*), Read, Write, Edit
category: Workflow
tags: [workflow, superspec, propose]
---

Create a SuperSpec change's `proposal.md` and delta spec files. Does not
touch `design.md` or `tasks.md` — design is optional and out of scope here
(write it by hand later if the change needs one), and `tasks.md` is
`/superspec-tasks`'s job, run after this one.

**Input**: The argument after `/superspec-propose` is the change name
(kebab-case), or a description of what to build.

**Steps**

1. **If no input, ask what to build.** Use **AskUserQuestion** (open-ended):
   > "What change do you want to propose? Describe what you want to build or fix."
   Derive a kebab-case name from the description. Do not proceed without
   understanding what's being built.

2. **Create the change**, if it doesn't already exist:
   ```bash
   openspec new change "<name>"
   ```
   The project's `openspec/config.yaml` defaults to the `superspec`
   schema, so no `--schema` flag is needed. If the change already exists,
   confirm with the user before overwriting its proposal or specs.

3. **Identify capabilities.** Before writing anything, work out which
   capabilities this change touches:
   - **New**: kebab-case names, each becomes `specs/<name>/spec.md`
   - **Modified**: check `openspec/specs/` for existing capability names
     whose requirements are changing (not just implementation)

4. **Write `proposal.md`** — four sections, **20 lines total, hard cap**:
   - **Why**: 1-2 sentences — the problem or opportunity
   - **What Changes**: bullet list, specific, mark **BREAKING** where it applies
   - **Capabilities**: New Capabilities / Modified Capabilities, from step 3.
     This section is not optional even under the line cap — it's the
     contract the specs step reads next; a proposal that omits it produces
     specs with no capability to attach to.
   - **Impact**: affected code/APIs/dependencies, 1-3 lines

   No rationale beyond the Why line — that's what the 20-line cap enforces.

5. **Write delta specs**, one file per capability from step 3:
   ```bash
   openspec instructions specs --change "<name>" --json
   ```
   Read the returned `template` and `instruction` — both already carry
   this project's terse constraint (one SHALL sentence, 1-3 scenarios,
   GIVEN/WHEN/THEN, exactly four hashtags on scenario headers) and a
   bloated-vs-terse example. Follow the template exactly.
   - **New capability**: `## ADDED Requirements`
   - **Modified capability**: read the existing `openspec/specs/<capability>/spec.md`
     first, copy the entire requirement block being changed under
     `## MODIFIED Requirements`, then edit it — partial content loses
     detail at archive time

6. **Validate — hard gate:**
   ```bash
   openspec validate "<name>" --strict
   ```
   If it fails, fix the proposal or specs and re-run until it passes.
   Do not hand back a change that fails `--strict`.

**Output**

Summarize: change name and location, capabilities created/modified,
proposal line count, validation result. Point to next step:
"Run `/superspec-tasks` to derive the implementation task list."

**Guardrails**
- Proposal stays at or under 20 lines including the Capabilities section
- Every capability named in the proposal needs a corresponding delta spec file
- Delta specs follow the schema's template and instruction verbatim — don't
  freehand the format
- `--strict` failure is a hard stop, not a warning to note and move past
- Don't create `design.md` or `tasks.md` here
