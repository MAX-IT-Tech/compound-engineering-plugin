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

  test("specifies < escape rule for </script> injection prevention", () => {
    expect(
      /&lt;|escape/i.test(REFERENCE),
      "Reference must specify the < → &lt; escape rule to prevent </script> injection from frontmatter values.",
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
})
