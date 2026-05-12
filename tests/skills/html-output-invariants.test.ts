import { readFileSync } from "fs"
import path from "path"
import { describe, expect, test } from "bun:test"

// The html-output.md reference is duplicated byte-for-byte between ce-plan
// and ce-brainstorm (enforced by tests/compound-support-files.test.ts). These
// invariant tests read one copy and assert the hard rules that any HTML
// artifact must follow. Tests assert STRUCTURE of the reference content, not
// generated output — the reference is what the agent reads at compose time.
const REFERENCE_PATH = path.join(
  process.cwd(),
  "plugins/compound-engineering/skills/ce-plan/references/html-output.md",
)
const REFERENCE = readFileSync(REFERENCE_PATH, "utf8")

describe("html-output.md reference content invariants", () => {
  test("declares single-self-contained-file invariant", () => {
    expect(
      /single self-contained/i.test(REFERENCE),
      "Reference must declare the single-self-contained-HTML-file invariant — no companion .css/.js/.svg files.",
    ).toBe(true)
    expect(
      /no companion/i.test(REFERENCE),
      "Reference must say no companion files.",
    ).toBe(true)
  })

  test("declares inline-CSS rule", () => {
    expect(
      /inline CSS|<style>/.test(REFERENCE),
      "Reference must state that CSS lives inline (in `<style>`), not in companion stylesheets.",
    ).toBe(true)
  })

  test("declares inline-SVG rule", () => {
    expect(
      /inline SVG/i.test(REFERENCE),
      "Reference must state that SVG lives inline, not as companion .svg files.",
    ).toBe(true)
  })

  test("permits CDN webfonts only with a fallback stack", () => {
    expect(
      /CDN webfont/i.test(REFERENCE) && /fallback/i.test(REFERENCE),
      "Reference must permit CDN webfonts only with an offline-readable fallback font stack.",
    ).toBe(true)
  })

  test("specifies frontmatter as <script type=\"application/json\">", () => {
    expect(
      /<script type="application\/json"/.test(REFERENCE),
      'Reference must specify frontmatter as `<script type="application/json">` for round-trip.',
    ).toBe(true)
  })

  test("specifies < → &lt; escape rule for </script> injection prevention", () => {
    // The reference text must literally show the HTML entity `&lt;` (not just
    // mention the word "escape"). An earlier draft of this test allowed either
    // and missed a no-op where the prose said "escape `<` as `<`" — both
    // characters being the literal `<`. Require the entity itself.
    expect(
      /&lt;/.test(REFERENCE),
      "Reference must specify the HTML entity `&lt;` as the escape target. Writing 'escape `<` as `<`' is a no-op and was the bug this test now guards against.",
    ).toBe(true)
    // Also require the escape rule to appear in a sentence about <script>
    // injection, so a stray &lt; somewhere unrelated wouldn't satisfy the test.
    expect(
      /&lt;[\s\S]{0,200}script|script[\s\S]{0,200}&lt;/i.test(REFERENCE),
      "The `&lt;` escape mention must sit near a reference to `<script>` / `</script>` injection so the contract is unambiguous.",
    ).toBe(true)
  })

  test("requires R-IDs / U-IDs / A-IDs / F-IDs / AE-IDs preserved as anchor IDs", () => {
    expect(
      /R-IDs.*U-IDs|U-IDs.*R-IDs|anchor ID/i.test(REFERENCE),
      "Reference must require requirement/unit IDs to be preserved as stable anchor IDs.",
    ).toBe(true)
  })

  test("states the precedence stack for style preferences", () => {
    expect(
      /Precedence stack/i.test(REFERENCE),
      "Reference must include a Precedence stack section.",
    ).toBe(true)
    // The four precedence tiers (conversation, preferred stylesheet ref,
    // DESIGN.md, fallback) must all be named so an agent reading the reference
    // resolves preferences predictably.
    expect(/conversation/i.test(REFERENCE)).toBe(true)
    expect(/preferred stylesheet|stylesheet reference/i.test(REFERENCE)).toBe(true)
    expect(/DESIGN\.md/.test(REFERENCE)).toBe(true)
    expect(/fallback|default style/i.test(REFERENCE)).toBe(true)
  })

  test("includes the active-recall instruction", () => {
    expect(
      /Active-recall instruction/i.test(REFERENCE),
      "Reference must include the Active-recall instruction so the agent scans loaded context for stylesheet references at compose time.",
    ).toBe(true)
  })

  test("documents DESIGN.md discovery paths in worktree-root order", () => {
    expect(
      /DESIGN\.md discovery/i.test(REFERENCE),
      "Reference must include a DESIGN.md discovery section.",
    ).toBe(true)
    // All three documented lookup paths must be named.
    expect(/worktree root|git rev-parse --show-toplevel/i.test(REFERENCE)).toBe(true)
    expect(/docs\/DESIGN\.md/.test(REFERENCE)).toBe(true)
    expect(/\.compound-engineering\/DESIGN\.md/.test(REFERENCE)).toBe(true)
  })

  test("declares composition timing rule (after safe_auto)", () => {
    expect(
      /Composition timing/i.test(REFERENCE),
      "Reference must declare composition timing rule (HTML composes after safe_auto fixes).",
    ).toBe(true)
    expect(
      /safe_auto/i.test(REFERENCE),
      "Composition timing rule must name `safe_auto` explicitly.",
    ).toBe(true)
  })

  test("includes content-shape questions framed as agent prompts", () => {
    expect(
      /Content-shape questions/i.test(REFERENCE),
      "Reference must include Content-shape questions section.",
    ).toBe(true)
    // The questions must be phrased as actual questions the agent answers.
    const questionMarks = (REFERENCE.match(/\?/g) ?? []).length
    expect(questionMarks).toBeGreaterThanOrEqual(5)
  })

  test("provides at least the named affordance idioms", () => {
    expect(/Affordance idioms/i.test(REFERENCE)).toBe(true)
    // The four named affordances we expect the agent to know about.
    expect(/<details>/.test(REFERENCE)).toBe(true)
    expect(/inline SVG/i.test(REFERENCE)).toBe(true)
    expect(/two-column/i.test(REFERENCE)).toBe(true)
    expect(/tinted|callout/i.test(REFERENCE)).toBe(true)
  })

  test("provides a fallback default style as concrete CSS", () => {
    expect(/Fallback default style/i.test(REFERENCE)).toBe(true)
    expect(
      /prefers-color-scheme/.test(REFERENCE),
      "Fallback CSS must include prefers-color-scheme: dark variant.",
    ).toBe(true)
    expect(
      /@media/.test(REFERENCE),
      "Fallback CSS must include media queries for responsive behavior.",
    ).toBe(true)
  })

  test("includes agent-consumability rules", () => {
    expect(/Agent-consumability rules/i.test(REFERENCE)).toBe(true)
    // Semantic HTML elements over div soup is the key rule.
    expect(/semantic HTML|<article>|<dl>|<section>/i.test(REFERENCE)).toBe(true)
    // Field labels visible in source.
    expect(/visible text|label/i.test(REFERENCE)).toBe(true)
  })

  test("forbids JS framework dependencies", () => {
    expect(
      /(no|not|do not add) (JS|JavaScript) framework/i.test(REFERENCE),
      "Reference must forbid JS framework dependencies in anti-patterns.",
    ).toBe(true)
  })

  test("includes the staleness-signal requirement", () => {
    expect(
      /Generated from|composition timestamp|staleness/i.test(REFERENCE),
      "Reference must require a staleness signal (source path + composition timestamp) so readers can detect drift.",
    ).toBe(true)
  })

  test("includes the post-compose audit checklist", () => {
    expect(
      /Post-compose audit/i.test(REFERENCE),
      "Reference must include a Post-compose audit section listing common slips to verify before returning.",
    ).toBe(true)
  })

  // Below: invariants added after observing a real-world plan that diverged
  // from the dogfood. The earlier reference under-prescribed on these four
  // axes, so different runs produced visibly different artifacts even with
  // identical reference content loaded. See the cloak-browser plan in the
  // cli-printing-press repo (2026-05-12) for the motivating example.

  test("warns that markdown is content source, not structural authority", () => {
    expect(
      /Markdown is the content source.*not the structural authority|re-derive structure from semantic content|not a 1:1 transformation/i.test(REFERENCE),
      "Reference must tell the agent that markdown's structural choices (lists vs sections vs tables) are presentation defaults, NOT semantic ground truth. Without this, agents inherit markdown's bullet-list rendering for content that should be tabular.",
    ).toBe(true)
  })

  test("requires <table> for uniform-shape content (5+ items)", () => {
    // The cloak-browser plan rendered 13 requirements as a styled bullet list
    // because the markdown source rendered them that way. The reference must
    // make this a hard rule, not a soft suggestion answerable as "no".
    const reqIdx = REFERENCE.search(/Uniform-shape rule|5\+ items.*uniform structure|uniform structure.*5\+/i)
    expect(
      reqIdx,
      "Reference must include a hard uniform-shape rule: 5+ items sharing the same field structure render as <table>, regardless of how the markdown source structured them.",
    ).toBeGreaterThan(-1)
    // Within ~600 chars of that rule, expect at least one example of the
    // uniform shapes ('ID + body' / 'name + value' / 'label + description' /
    // 'decision + rationale') so the agent understands what counts.
    const region = REFERENCE.slice(reqIdx, reqIdx + 800)
    expect(
      /ID \+ body|name \+ value|label \+ description|decision \+ rationale/.test(region),
      "The uniform-shape rule must name at least one concrete example shape ('ID + body', 'name + value', 'label + description', 'decision + rationale') so the agent recognizes the pattern.",
    ).toBe(true)
  })

  test("requires sticky TOC sidebar for long docs", () => {
    expect(
      /sticky TOC|sticky.*sidebar|navigation aid.*long/i.test(REFERENCE),
      "Reference must include sticky TOC sidebar as an affordance idiom for docs over a section/length threshold. Single-column-only on a long plan is a real UX miss.",
    ).toBe(true)
    // The trigger threshold must be stated concretely so the agent can apply
    // it without guessing.
    expect(
      /5\+ top-level sections|400.{0,10}lines|400-line|long doc/i.test(REFERENCE),
      "Sticky-TOC affordance must name a concrete trigger threshold (e.g., '5+ top-level sections' or '~400 lines') so the agent can decide whether to include one.",
    ).toBe(true)
  })

  test("requires reverse traceability for ID-anchored content", () => {
    expect(
      /reverse[\s-]?traceability|reverse lookup|covered by|references.*column|downstream references|downstream IDs/i.test(REFERENCE),
      "Reference must call out reverse traceability for ID-anchored items (R-IDs in Requirements should show which U-IDs satisfy each one when rendered as a table).",
    ).toBe(true)
  })

  test("permits inline JS for active-section TOC tracking", () => {
    // The no-JS-framework rule should not be read as banning a small inline
    // IntersectionObserver. The sticky-TOC affordance needs an active-section
    // indicator, and the cleanest implementation is ~15 lines of vanilla JS.
    // The reference must clarify the boundary so the agent doesn't ship a
    // dead-static TOC.
    expect(
      /IntersectionObserver|inline.*script.*acceptable|active[\s-]section.*script|active.*tracking/i.test(REFERENCE),
      "Reference must clarify that a small inline <script> for active-section tracking / anchor-permalink behavior is acceptable. The no-JS-framework rule applies to React/Vue/etc., not to ~15 lines of vanilla observer code.",
    ).toBe(true)
  })
})
