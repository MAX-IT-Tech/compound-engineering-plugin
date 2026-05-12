# HTML Output

Compose a single self-contained HTML rendering of the markdown document. Markdown remains the canonical source; HTML is a projection that the agent composes per artifact from this reference.

## Precedence stack for style preferences

Honor user style preferences in this order (highest to lowest):

1. **In-session conversation** — explicit direction the user has given in this run.
2. **Preferred stylesheet reference** — any reference the user has named in loaded agent-instruction context (typically AGENTS.md / CLAUDE.md, but do not enumerate locations — scan loaded context). The reference may be a file path (`docs/style.css`), a URL, a named library ("Tailwind"), or a style brand ("Stripe docs"). This tier sits above DESIGN.md because agent-instruction files carry deliberate agent-aware preferences.
3. **DESIGN.md** — file discovered on the filesystem (see "DESIGN.md discovery" below).
4. **Fallback default** — the opinionated default style at the bottom of this reference.

## Active-recall instruction (run at compose time)

Before writing the CSS, scan the loaded context for any *stylesheet reference* the user has indicated for documents like this — file path, URL, named library, or style brand. If found and inlinable (short local file, fetchable URL within budget), inline it into `<style>`. If found but not inlinable (large framework, paywalled stylesheet, named system without a fetchable source), compose CSS in its spirit — typography, color, density cues drawn from the named system. Only fall back to the default style when no preference signal exists anywhere.

The single-file invariant is preserved either way. The CSS that styles the doc must live inline in `<style>`. External `<link rel="stylesheet">` is permitted only for CDN webfont CSS (the documented webfont exception below) and only when paired with a complete offline-readable fallback font stack so the doc still reads when the CDN is unreachable. Never link to an external stylesheet that carries layout, color, or typography rules the doc cannot read offline.

## Hard invariants

- **Single self-contained HTML5 file.** No companion `.css`, `.js`, or `.svg` files. CSS lives in `<style>`, SVG lives inline, images live as base64 data URIs or inline SVG. The one permitted exception is a `<link rel="stylesheet">` to a CDN webfont CSS endpoint (Google Fonts, Bunny Fonts, etc.), which is allowed under the webfont rule below — the webfont CSS is style for typography only, and the fallback font stack makes the doc readable when the CDN is unreachable. No other external `<link rel="stylesheet">` (no layout, no color, no design-system stylesheets — those must inline).
- **CDN webfonts permitted only with an offline-readable fallback font stack.** The doc must remain readable when the CDN is unreachable. A typical pattern: `font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`.
- **ASCII identifiers.** Class names, IDs, data attribute names are ASCII-only.
- **Frontmatter preserved as `<script type="application/json" id="<skill>-frontmatter">`.** Round-trips to the source document's frontmatter keys. Escape every `<` character in any string value as the literal six-character JSON Unicode escape sequence `\u003c` (backslash, lowercase u, zero, zero, three, c) inside the JSON payload. This prevents `</script>` from terminating the script tag when any frontmatter value contains the literal substring. JSON parsers natively decode `\u003c` back to `<`, so values round-trip correctly. Do NOT use the HTML entity `&lt;` here — `<script type="application/json">` is HTML raw-text content where entities are NOT decoded; `.textContent` would return the literal four-character string `&lt;` and corrupt any value that originally contained `<`. For symmetry and defense, escape `>` as `\u003e` too, though only `<` is strictly required to break the `</script>` close-tag pattern.
- **R-IDs, U-IDs, A-IDs, F-IDs, AE-IDs preserved as anchor IDs.** Use `id="r1"`, `id="u1"`, etc. The ID also appears as visible text in the heading or table cell so any reader (human or agent) finds it as text.

## DESIGN.md discovery

When step 3 of the precedence stack applies (no preferred stylesheet reference found in context), look for a DESIGN.md file at these locations, first match wins:

1. Worktree root (resolve via `git rev-parse --show-toplevel`).
2. `docs/DESIGN.md`.
3. `.compound-engineering/DESIGN.md`.

DESIGN.md is the only file actively read from the filesystem; all other preference signals flow through loaded context. Read once at HTML compose time. Absent → fall through to the fallback default.

Worktree-root only — do not fall through to the main checkout. Users working from a worktree who want HTML defaults can add config and DESIGN.md to the worktree.

## Composition timing

Compose the HTML **after** `ce-doc-review`'s `safe_auto` fixes have been applied to the markdown, so the first HTML emission already reflects autofixes. Within a single skill run, re-compose whenever the markdown is mutated (deepen fast path, post-doc-review, HITL Proof resync).

The HTML re-renders only inside the same skill run that mutated the markdown. Across multi-run lifecycles (a user edits the markdown by hand outside the skill), the HTML may drift. This is an acceptable limitation; the staleness banner makes drift visible to readers.

## Content-shape questions

**Markdown is the content source, not the structural authority.** The markdown source uses lists, sections, and tables as its presentation defaults. HTML composition is not a 1:1 transformation — re-derive structure from semantic content per section. If markdown rendered 13 requirements as a bulleted list, that does NOT mean HTML must render them as a list; ask whether the semantic content (13 items sharing uniform `ID + body` shape) deserves a different rendering.

Read the markdown content and ask, per section:

- **Uniform-shape rule (load-bearing).** If 5+ items in a section share uniform structure (`ID + body`, `name + value`, `label + description`, `decision + rationale`, `risk + mitigation`), render as `<table>` regardless of how the markdown source structured them. Lists with chip-IDs are visually appealing but tables scan faster at that scale and make scanning across rows of the same field trivial. Tables also unlock additional columns (status, traceability, severity) that a list cannot accommodate cleanly.
- Is anything else tabular or comparative? Would a `<table>` scan faster than the list or prose currently expressing it?
- Is anything spatial, relational, or sequential that prose flattens? Would an inline SVG diagram land faster?
- Are there decision points or branches that a matrix or flowchart would scan faster than nested bullets?
- Is anything carrying variance in status, severity, or readiness that color or visual emphasis would land?
- Is anything genuinely benefitting from interactivity (collapsibles, native disclosure), or is the proposed interactivity decoration?
- Are there repeating rich-content cards (Implementation Units, finding cards, persona reviews) where secondary subsections would scan better as collapsibles than as always-expanded blocks?
- **Are ID-anchored items reverse-traceable?** Requirements (R-IDs) are typically referenced FROM Implementation Units (U-IDs); the doc reads forward easily but reverse lookup ("which units satisfy R3?") requires scanning every unit. When rendering Requirements as a table, add a column showing which downstream IDs reference each row (e.g., R3 → `U2, U5, U7`). Same pattern for any ID-anchored content with downstream references.
- **Is the doc long enough to need navigation aids?** Count top-level sections and total line count. If the doc has 5+ top-level sections OR exceeds ~400 lines, include a sticky TOC sidebar (see Affordance idioms). Single-column scroll-only on a long plan is a real UX miss.

Phrase each answer in terms of THIS artifact's content, not in the abstract. A doc with one unit and short sub-content does not need collapsibles; a doc with twelve persona-finding cards probably does.

## Affordance idioms

Reach for these idioms when content warrants. None are required, except where the content-shape questions above name a hard rule.

- **Sticky TOC sidebar with active-section indicator** when the doc has 5+ top-level sections OR exceeds ~400 lines. Two-column layout on desktop (`grid-template-columns: minmax(200px, 240px) minmax(0, 1fr)`), sticky `<nav>` on the left with section anchors, collapses to top of page on mobile (`@media (max-width: 900px) { .layout { display: block; } nav.toc { position: static; } }`). Pair with a small inline `IntersectionObserver` script that toggles an `.active` class on the matching nav anchor as the user scrolls — single-file invariant preserved because the script is inline. A bare `<script>` for active-section tracking and anchor-permalink behavior is acceptable; the no-JS-framework rule applies to React/Vue/etc., not to ~15 lines of vanilla observer code.
- **`<table>` for uniform-shape content (5+ items sharing the same field structure).** Required per the content-shape questions, not optional. Add a "covered by" or "references" column for reverse traceability when ID-anchored rows have downstream references.
- **`<details>` + `<summary>`** for collapsible subsections inside repeating rich-content cards. Keep the card's headline metadata (Goal, primary IDs, file lists) always visible above the collapsibles; wrap each secondary subsection (Approach, Test scenarios, Verification) in its own `<details>` so readers expand only what they need. Native HTML, no JS required, single-file invariant preserved.
- **Inline SVG flowcharts / sequences / data-flow** for branching or temporal logic that prose flattens. Place overrides, exceptions, and side-effects spatially separated from the main flow with a labeled connector or a "FIRST CHECK" banner — spatial position must match logical scope.
- **Two-column lists** for compact heterogeneous bibliographies (Sources & References) when items are short.
- **Tinted callout cards or accent-bordered subsections** for content that is "different in kind" (Deferred to Follow-Up, Open Questions, advisory notes) — variety budget that breaks visual sameness without inventing a new layout system.

## Fallback default style

Inline approximately this CSS (or its equivalent under any active stylesheet preference) into `<style>`. Extend the baseline with content-specific styling (pills, cards, diagrams, tables) as needed.

```css
:root {
  color-scheme: light dark;
  --bg: #fafaf9;
  --surface: #ffffff;
  --surface-tint: #f5f5f4;
  --text: #1a1a1a;
  --text-muted: #525252;
  --border: #e7e5e4;
  --accent: #0d7d6b;
  --accent-soft: #d1f1ea;
  --accent-text: #0a5d4f;
  --code-bg: #f5f5f4;
  --radius: 8px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f0f10;
    --surface: #18181b;
    --surface-tint: #1f1f23;
    --text: #f5f5f5;
    --text-muted: #a3a3a3;
    --border: #2a2a2d;
    --accent: #5eead4;
    --accent-soft: #0e3a32;
    --accent-text: #99f6e4;
    --code-bg: #1f1f23;
  }
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
main { max-width: 980px; margin: 0 auto; padding: 32px; }
h1 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 16px; }
h2 { font-size: 1.5rem; font-weight: 700; margin: 36px 0 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); scroll-margin-top: 24px; }
h3 { font-size: 1.05rem; font-weight: 600; margin: 28px 0 12px; }
p, ul, ol { max-width: 72ch; }
a { color: var(--accent); text-underline-offset: 0.18em; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.88em; background: var(--code-bg); border: 1px solid var(--border); border-radius: 4px; padding: 0.12em 0.4em; }
pre { background: var(--code-bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 16px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
th { background: var(--surface-tint); font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
@media (max-width: 768px) { main { padding: 20px; } }
```

Webfont CDN link (optional, pair with the fallback stack above):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

The doc must remain readable if the CDN is unreachable — the fallback font stack on `body` is what makes that true.

## Agent-consumability rules

A downstream agent (`ce-work`, `ce-doc-review`, future consumers) reads the HTML file as text linearly, not via DOM extraction. Compose so that semantic understanding is reachable in source:

- **Use semantic HTML elements over `<div>` soup.** `<article>` per unit card, `<dl>` for metadata pairs, `<table>` for tabular content, `<details>` / `<summary>` for collapsibles, `<section>` for top-level doc sections. Structure markers carry meaning to a text-reading agent.
- **Render field labels as visible text, not as attributes.** Emit `<dt>GOAL</dt><dd>...</dd>`, not `<dd data-field="goal">...</dd>`. The label is the semantic anchor.
- **Keep U-IDs and similar IDs as visible text** in headings and table cells, not only as `id=""` attributes. The agent finds "U1." in source the same way it finds "U1." in the markdown.
- **Match the markdown template's section order and field vocabulary.** An agent that knows the markdown structure finds the same labels in the same order in the HTML.
- **All semantic content lives in actual HTML text.** No CSS `::before { content: "..." }` carrying meaning, no background images as content, no semantic info that only renders. Whatever the agent sees in source is what it knows.
- **Stable structure is the public API.** Element types, the ID and label scheme, and the field-label vocabulary do not break across versions. Visual styling can change freely.

## Staleness signal

Include a small banner near the footer (or in the document header) noting source path and composition timestamp:

```html
<footer>
  <p>Generated from <code>docs/plans/2026-05-11-001-feat-output-html-mode-plan.md</code> at 2026-05-11T22:00:00Z. Markdown remains the canonical source.</p>
</footer>
```

Embed the same path and timestamp inside the frontmatter JSON block so programmatic staleness detection is possible.

## Anti-patterns

- Do not invent a single fixed visual template; the agent picks affordances per artifact.
- Do not lock specific pill classes, anchor schemes, or layout primitives beyond R/U/A/F/AE preservation. The element types and ID/label vocabulary are the contract; everything else is open to per-artifact judgment.
- Do not add JS framework dependencies. A small inline `<script>` for active-TOC tracking or anchor-permalink behavior is acceptable; React, Vue, or any framework runtime is not.
- Do not add process-exhaust callouts to the artifact (e.g., "Re-run without `--html` to produce markdown"). The reader does not need engineering process metadata.
- Do not strip or hide content for "agent consumption." Vision-capable agents see the rendered page; text-reading agents read the source. Neither benefits from removed content.

## Post-compose audit

Before returning the artifact, scan it for common slips:

- Each heading level (H2 / H3 / H4 / `<summary>`) is visually distinct from one another and from inline bold. Two collapsing levels (e.g., H3 styled as "smaller-bold" indistinguishable from `<strong>` text) is a defect.
- No template placeholders (`{skill}`, `<value>`, `[plan title]`) leaked into output. Substitute with concrete values or rewrite as `<plan|brainstorm>`-style explicit notation.
- Every anchored heading or row carries a visible permalink affordance (a `#` glyph beside the heading or row, opacity 0 by default and 1 on hover, with `href="#<id>"`).
- The staleness signal (source path + composition timestamp) is present.
- If 5+ sections share identical card styling, at least one is varied. Total visual sameness is dull.
- For each diagram, spatial position matches logical scope. Overrides, exceptions, and side-effects are spatially separated from the main flow.
- Table column widths match the content shape rather than leaving prose columns squeezed by narrow label columns.
