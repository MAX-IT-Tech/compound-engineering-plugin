# Visual Communication in Requirements Documents

Visual aids are conditional on content patterns, not on depth classification — a Lightweight brainstorm about a complex workflow may warrant a diagram; a Deep brainstorm about a straightforward feature may not.

**Triggers (load-bearing).** Include a visual aid for EVERY trigger the requirements doc satisfies. This is a hard rule, not a soft recommendation. "I'll skip the diagram to save tokens" is NOT a valid reason to omit a triggered visual; recognizing a trigger and then skipping the rendering is a defect.

| Trigger condition | Required visual | Placement |
|---|---|---|
| Any Key Flow with 3+ steps | Mermaid sequence or flow diagram | Inline with that flow, or under `## User Flow` for substantial flows (>10 nodes) |
| Any Key Flow with 2+ actors handing off | Mermaid sequence diagram (lifelines per actor) | Inline with that flow |
| 3+ behavioral modes, variants, or states described in Requirements | Markdown comparison table | Within the Requirements section |
| 3+ interacting participants (user roles, agents, external services) named in Actors | Mermaid or ASCII relationship/context diagram | After Problem Frame, or under `## Context` |
| Entity lifecycle with 3+ states (created → paid → shipped → …) | Mermaid state diagram | Inline at the section that introduces the entity |
| Acceptance examples that span 3+ steps with branching | Mermaid sequence diagram per distinct path | Inline with the acceptance example |
| Multiple competing approaches being compared during Phase 2 | Comparison table | Within Phase 2 approach exploration |

**Trigger fires per shape, not per visual.** If the doc satisfies multiple triggers (e.g., a 5-step user flow AND a 4-actor permissions matrix AND a 3-state entity lifecycle), include a separate visual for each. One diagram combining all three would clutter; one per shape stays clear. Anti-padding rule: each visual must add information the others don't. Don't render redundant views of the same content.

**Skip a visual ONLY when no trigger fires** for that content category. Specifically: prose is sufficient ONLY when none of the trigger conditions above hold. Other narrow exceptions:
- The visual describes implementation architecture, data schemas, state-machine implementations, or code structure (that belongs in `ce-plan`, not in a requirements doc).
- The brainstorm is genuinely simple and linear with no multi-step flows, mode comparisons, multi-participant interactions, or lifecycles to describe.

**Format selection:**
- **Mermaid** (default) for simple flows — 5-15 nodes, no in-box annotations, standard flowchart shapes. Use `TB` (top-to-bottom) direction so diagrams stay narrow in both rendered and source form. Source should be readable as fallback in diff views and terminals.
- **ASCII/box-drawing diagrams** for annotated flows that need rich in-box content — CLI commands at each step, decision logic branches, file path layouts, multi-column spatial arrangements. More expressive than mermaid when the diagram's value comes from annotations within steps. Follow 80-column max for code blocks, use vertical stacking.
- **Markdown tables** for mode/variant comparisons and approach comparisons.
- Keep diagrams proportionate to the content. A simple 5-step workflow gets 5-10 nodes. A complex workflow with decision branches and annotations at each step may need 15-20 nodes — that is fine if every node earns its place.
- Place inline at the point of relevance, not in a separate section.
- Conceptual level only — user flows, information flows, mode comparisons, component responsibilities. Not implementation architecture, data schemas, or code structure.
- Prose is authoritative: when a visual aid and surrounding prose disagree, the prose governs.

After generating a visual aid, verify it accurately represents the prose requirements — correct sequence, no missing branches, no merged steps. Diagrams without code to validate against carry higher inaccuracy risk than code-backed diagrams.
