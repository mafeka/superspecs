---
name: "SuperSpec: Explore"
description: "Discovery dialogue for a SuperSpec change — think through the problem before formalizing it. Writes no artifacts."
allowed-tools: Bash(openspec:*), Read, Grep, Glob
category: Workflow
tags: [workflow, superspec, explore]
---

Enter explore mode. Think deeply, follow the conversation wherever it goes.
This is thinking time, not writing time.

**Hard rule: this command writes no files, ever.** No `proposal.md`, no
delta specs, no `design.md`. Not even if asked directly — if the user
wants something captured, that's `/superspec-propose`'s job. Say so and
move on; don't let "just this once" creep in.

**Input**: The argument after `/superspec-explore` is whatever the user
wants to think about — a vague idea, a specific problem, an existing
change name to explore further, a comparison between approaches, or
nothing (just enter the mode).

## The Stance

- **Curious, not prescriptive** — ask questions that emerge naturally
- **Open threads, not interrogation** — surface multiple directions, let
  the user follow what resonates
- **Grounded** — read the actual codebase when relevant, don't theorize
  in the abstract
- **Patient** — let the shape of the problem emerge before reaching for structure

## What You Might Do

- Ask clarifying questions, challenge assumptions, reframe the problem
- Investigate the codebase: existing architecture, integration points,
  patterns already in use
- Compare approaches: tradeoffs, sketches, a recommendation if asked
- Visualize with ASCII diagrams when that clarifies more than prose would
- Surface risks and unknowns

## Context Awareness

If existing changes might be relevant, check:
```bash
openspec list --json
```
If the user mentions a specific change, read its artifacts for context
(`openspec status --change "<name>" --json`, then read files under
`artifactPaths.<artifact>.existingOutputPaths`) — but only to inform the
conversation, never to edit them.

## Ending Discovery

There's no required ending:
- **Flows into a proposal**: "This feels solid enough to formalize — run
  `/superspec-propose` when you're ready."
- **Just provides clarity**: the user has what they need, moves on
- **Continues later**: pick it back up anytime

## Guardrails

- **Never write files** — proposal, specs, design, tasks are all out of
  scope here, no exceptions
- **Don't fake understanding** — if something is unclear, dig deeper
- **Don't rush to structure** — let patterns emerge
- **Do ground in the real codebase** — read it when relevant
- **Do question assumptions** — the user's and your own
