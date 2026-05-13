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

  test("specifies < → \\u003c JSON-Unicode escape (not the HTML entity) for </script> injection prevention", () => {
    // <script type="application/json"> is HTML raw-text content where HTML
    // entities are NOT decoded. Escaping `<` as `&lt;` would prevent the
    // </script> termination but corrupt round-tripping — .textContent returns
    // the literal four characters '&lt;', not '<'. The correct escape is the
    // JSON Unicode escape <, which JSON parsers natively decode back to
    // '<'. Two prior rounds of this PR shipped the wrong escape (&lt;); this
    // test now pins the correct one and forbids the wrong-escape regression.
    expect(
      /\\u003c/.test(REFERENCE),
      "Reference must specify `\\u003c` (JSON Unicode escape) as the escape target. The earlier HTML-entity `&lt;` recommendation was wrong because <script> raw-text content does not decode HTML entities.",
    ).toBe(true)
    // The escape rule must sit near a <script> / </script> mention so the
    // contract is unambiguous.
    expect(
      /\\u003c[\s\S]{0,400}script|script[\s\S]{0,400}\\u003c/i.test(REFERENCE),
      "The `\\u003c` escape mention must sit near a reference to `<script>` / `</script>` so the contract is unambiguous.",
    ).toBe(true)
    // Must explicitly warn against using &lt; as the escape — defends against
    // regression to the prior buggy recommendation.
    expect(
      /(Do NOT use the HTML entity `&lt;`|not.*the HTML entity `&lt;`|`&lt;`.*would.*corrupt|`&lt;`.*not be decoded)/i.test(REFERENCE),
      "Reference must explicitly warn against using the HTML entity `&lt;` as the escape target, naming the round-trip failure mode so a future maintainer can't unintentionally regress.",
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

  test("distinguishes content from design when treating markdown as a source", () => {
    // The earlier framing said "markdown is the content source, not the
    // structural authority" — which implied chat context was the authoritative
    // source. That's not right: when the user names a markdown doc as input,
    // the markdown IS a valid source alongside chat context. The actual rule
    // is about WHICH ASPECT of the source the agent treats as authoritative:
    // content/semantics yes, design/presentation no.
    expect(
      /source of content, not a source of design|not a 1:1 transformation|do NOT treat its bullet|not.*authoritative|re-choose the rendering per content shape/i.test(REFERENCE),
      "Reference must distinguish content (authoritative — use the markdown's semantic information) from design (not authoritative — don't mirror the markdown's bullet/section/table presentation choices). Without this, agents inherit the markdown's structural defaults for content that would scan faster with different HTML affordances.",
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

  test("dark-mode accent palette is muted, not high-saturation", () => {
    // The previous fallback used --accent: #5eead4 (bright cyan-teal) and
    // --accent-text: #99f6e4 (even brighter) in dark mode. When the agent
    // styled .kd-list strong with var(--accent-text), every bold in a 10-item
    // Key Technical Decisions section became bright teal — visually
    // overwhelming. Reduced to --accent: #2dd4bf and --accent-text: #5eead4.
    // The palette tweak is a safety net; the harder rule is in the next test.
    expect(
      /--accent:\s*#2dd4bf/.test(REFERENCE),
      "Dark-mode --accent must be #2dd4bf (muted teal) in the fallback CSS, not #5eead4 (too saturated for body emphasis).",
    ).toBe(true)
    expect(
      /--accent-text:\s*#5eead4/.test(REFERENCE),
      "Dark-mode --accent-text must be #5eead4 in the fallback CSS, one notch less saturated than the previous #99f6e4.",
    ).toBe(true)
  })

  test("forbids coloring body <strong> by default", () => {
    // The fundamental fix: don't color <strong> by default. Bold weight alone
    // carries emphasis; coloring every <strong> in a long list (e.g., 10+
    // Key Technical Decisions) overwhelms the eye in dark mode regardless
    // of which accent hue is chosen.
    expect(
      /Reserve `--accent`.*Do NOT color `<strong>`|Do NOT color `<strong>`.*by default|color: inherit/i.test(REFERENCE),
      "Reference must instruct the agent NOT to color <strong> body text by default. The accent color is reserved for status chips, ID chips, links, and section borders.",
    ).toBe(true)
    expect(
      /Color usage rules/i.test(REFERENCE),
      "Reference must include a 'Color usage rules' section so the rule is discoverable, not buried in a single bullet.",
    ).toBe(true)
  })

  test("diagram trigger is load-bearing, not a soft recommendation", () => {
    // The first version of the architecture trigger said "Render an inline SVG
    // diagram when the doc describes any of these shapes" — phrased as a
    // recommendation. Real-world dogfood with three triggers firing produced
    // zero diagrams because the agent read it as optional. The fix is to mark
    // it load-bearing (same weight as the uniform-shape rule) and explicitly
    // reject token-economy as a skip reason.
    expect(
      /Architecture trigger \(load-bearing\)|hard rule on the same footing|NOT a soft recommendation/i.test(REFERENCE),
      "Architecture trigger must carry the load-bearing marker so agents read it with the same enforcement weight as the uniform-shape table rule.",
    ).toBe(true)
    expect(
      /[Tt]oken cost is not.*valid reason|NOT.*valid reason to (skip|omit) a triggered diagram|recognizing a trigger and then skipping/i.test(REFERENCE),
      "Reference must explicitly forbid token-economy as a justification for skipping a triggered diagram. This was the actual failure mode observed in dogfood.",
    ).toBe(true)
  })

  test("post-compose audit includes presence audits for missing diagrams, tables, and accent-bold misuse", () => {
    // The earlier audit only flagged style issues in diagrams/tables THAT
    // EXIST. It missed "the doc has 3+ components but no SVG diagram." This
    // is the highest-value audit step because it catches the most common
    // dogfood failure (agent saw trigger, agent skipped rendering).
    const auditStart = REFERENCE.indexOf("## Post-compose audit")
    expect(auditStart).toBeGreaterThan(-1)
    const auditRegion = REFERENCE.slice(auditStart)
    expect(
      /[Dd]iagram-presence audit|count of SVGs must be at least|verify the output contains a matching `<svg>`/i.test(auditRegion),
      "Post-compose audit must include a diagram-presence step: count the architecture triggers the content satisfies; count the SVGs in the output; the SVG count must be at least the count of firing trigger shapes.",
    ).toBe(true)
    expect(
      /[Tt]able-presence audit|verify the output contains a `<table>`/i.test(auditRegion),
      "Post-compose audit must also include a table-presence step (uniform-shape rule firing → <table> required, not <ul>).",
    ).toBe(true)
    expect(
      /[Bb]ody-bold color audit|`<strong>`.*NOT.*colored|accent palette belongs on status chips/i.test(auditRegion),
      "Post-compose audit must include a body-bold color audit confirming <strong> isn't colored by default.",
    ).toBe(true)
  })

  test("diagram trigger fires per diagrammatic shape, not per diagram", () => {
    // The earlier framing was a soft "Inline SVG flowcharts/sequences/data-flow
    // for branching or temporal logic" — easy to answer "no" to. Real-world
    // dogfood with architectural content (cli-printing-press cloak plan)
    // produced zero SVGs because the rule had no trigger threshold. New
    // framing: explicit triggers (3+ X) per shape category, multiple diagrams
    // welcome when multiple shapes are present, anti-padding rule prevents
    // redundancy.
    expect(
      /Diagrams: when and how many|Architecture trigger/i.test(REFERENCE),
      "Reference must include a dedicated 'Diagrams: when and how many' section with explicit triggers, not a soft idiom buried in the affordance list.",
    ).toBe(true)
    expect(
      /per diagrammatic shape, not per diagram|one diagram per shape/i.test(REFERENCE),
      "Diagram rule must state the per-shape trigger logic explicitly so a plan with both topology AND a sequence renders two diagrams, not one combined.",
    ).toBe(true)
    // The five canonical shapes must be named so the agent recognizes them.
    expect(/Component topology|component topology/i.test(REFERENCE)).toBe(true)
    expect(/[Ss]equence/i.test(REFERENCE)).toBe(true)
    expect(/[Ss]tate machine/i.test(REFERENCE)).toBe(true)
    expect(/[Ff]lowchart/i.test(REFERENCE)).toBe(true)
    expect(/[Dd]ata-?flow|[Dd]ata flow/i.test(REFERENCE)).toBe(true)
    // Anti-padding rule must be present to prevent the agent from rendering
    // redundant diagrams to look thorough.
    expect(
      /[Aa]nti-pattern.*padding|padding for thoroughness|redundant diagrams|each diagram add information/i.test(REFERENCE),
      "Reference must include an anti-padding rule with the 'each diagram adds info not in the others' test, otherwise agents may render multiple views of the same architecture to look comprehensive.",
    ).toBe(true)
  })

  test("default-closed for unit details collapsibles is explicit", () => {
    // Earlier framing relied on 'expand only what they need' to imply
    // closed-by-default. Real-world output (cloak plan) had <details open>
    // on the Approach subsection — the agent filled in an unspecified
    // default. Rule must be explicit.
    expect(
      /All collapsibles start closed|no `open` attribute|start closed.*no.*open/i.test(REFERENCE),
      "Reference must state explicitly that <details> inside repeating cards start closed (no `open` attribute). Without this, agents fill in their own default and can leave subsections expanded.",
    ).toBe(true)
  })

  test("webfont CDN <link rel=\"stylesheet\"> is permitted with fallback (no internal contradiction)", () => {
    // An earlier draft had "Never emit a <link rel='stylesheet'> to an
    // external sheet" inside the active-recall block, while the Fallback
    // default style section showed a <link rel="stylesheet"> to Google Fonts
    // CSS. Both could not be right. The webfont exception is the documented
    // intent; the absolute "never emit" was the bug. The reference must not
    // contain an absolute prohibition that contradicts its own webfont
    // example.
    expect(
      /Never emit a `<link rel="stylesheet">` to an external sheet\.\s*$/m.test(REFERENCE),
      "Reference must NOT contain an absolute 'Never emit a <link rel=\"stylesheet\"> to an external sheet' clause — that contradicts the documented webfont exception. Qualify the rule to scope it to layout/typography stylesheets, not webfont CSS.",
    ).toBe(false)
    // And the webfont exception must remain explicit.
    expect(
      /webfont.*<link.*permitted|<link rel="stylesheet">.*permitted.*webfont|permitted only for CDN webfont/i.test(REFERENCE),
      "Reference must explicitly permit <link rel=\"stylesheet\"> for CDN webfont CSS with the offline-fallback condition stated nearby.",
    ).toBe(true)
  })
})
