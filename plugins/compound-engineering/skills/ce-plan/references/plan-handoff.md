# Plan Handoff

This file contains post-plan-writing instructions: document review, post-generation options, and issue creation. Load it after the plan file has been written and the confidence check (5.3.1-5.3.7) is complete.

## 5.3.8 Document Review

After the confidence check (and any deepening), run the `ce-doc-review` skill with `mode:headless` on the plan file. Pass `mode:headless <plan-path>` as the skill arguments. When this step is reached, it is mandatory — do not skip it because the confidence check already ran. The two tools catch different classes of issues.

Headless is the default at this phase because most users want to start work after planning, not adjudicate every reviewer concern up front. Headless applies `safe_auto` fixes silently and returns structured findings text — no walkthrough, no per-finding routing, no blocking prompts. The post-generation menu (see 5.4) offers `Run deeper doc review` as a first-class option so users can opt into the full interactive walkthrough when they want it.

The confidence check and ce-doc-review are complementary:
- The confidence check strengthens rationale, sequencing, risk treatment, and grounding
- Document-review checks coherence, feasibility, scope alignment, and surfaces role-specific issues

Capture the headless envelope so it can drive the contextual summary above the post-generation menu:
- The number of fixes auto-applied
- The count of remaining findings, broken out by user-facing bucket (proposed fixes, decisions, FYI observations)
- The severity breakdown of decisions and proposed fixes (specifically the P0/P1 count, since those benefit from explicit user attention)

When ce-doc-review returns "Review complete", proceed to Final Checks.

**Pipeline mode:** Pipeline runs (LFG or any `disable-model-invocation` context) also run `ce-doc-review` with `mode:headless` and the plan path — the headless mode is identical to the interactive default at this phase. No further routing is offered in pipeline mode; the caller decides what to do with the returned findings. Address any P0/P1 findings before returning control to the caller.

## 5.3.9 Final Checks and Cleanup

Before proceeding to post-generation options:
- Confirm the plan is stronger in specific ways, not merely longer
- Confirm the planning boundary is intact
- Confirm origin decisions were preserved when an origin document exists

If artifact-backed mode was used:
- Clean up the temporary scratch directory after the plan is safely updated
- If cleanup is not practical on the current platform, note where the artifacts were left

**HTML composition.** Compose the HTML rendering now — after all `.md` mutations in this run have settled (initial write, deepening synthesis, ce-doc-review `safe_auto` fixes) — when BOTH conditions hold:

1. `OUTPUT_FORMAT` (resolved in SKILL.md Phase 0.0) is `html`, OR Phase 0.1 marked an existing `.html` sibling for re-render.
2. The run is not in pipeline mode. Pipeline mode (LFG or any `disable-model-invocation` context) forces md-only emission regardless of CLI or config preference, including suppressing sibling re-render. The pipeline-mode override at Phase 0.0 is absolute: ce-work and downstream consumers always get markdown, and emitting an HTML sibling in pipeline runs would violate that guarantee even on resume.

When both conditions hold, read `references/html-output.md` for composition rules: invariants, precedence stack, content-shape questions, affordance idioms, fallback default style, agent-consumability rules, and the post-compose audit. Write the HTML to the same path as the `.md` with `.html` extension. Confirm with a second line:

```text
HTML view written to <absolute path to .html>
```

If a later phase in this run mutates the `.md` again (HITL Proof resync), re-compose the HTML at that point — same two-condition gate — so the view stays aligned with the markdown source.

## 5.4 Post-Generation Options

**Pipeline mode:** If invoked from an automated workflow such as LFG or any `disable-model-invocation` context, skip the interactive menu below and return control to the caller immediately. The plan file has already been written, the confidence check has already run, and ce-doc-review has already run — the caller (e.g., lfg) determines the next step.

**Path format:** Use absolute paths for chat-output file references — relative paths are not auto-linked as clickable in most terminals.

**Summary line above the menu (always):** Print a single concise line summarizing the headless review state — e.g., `Doc review applied 3 fixes. 2 decisions, 1 proposed fix, 4 FYI observations remain (1 at P1).` When no fixes were applied and no findings remain, print `Doc review clean — no fixes needed.` This line establishes what the autofix pass did so the user has the context to choose between the menu options below.

**Question:** "Plan ready at `<absolute path to plan>`. What would you like to do next?"

**Options:**
1. **Start `/ce-work`** (recommended) - Begin implementing this plan in the current session
2. **Run deeper doc review** - Walk through the remaining findings interactively (full ce-doc-review walkthrough)
3. **Create Issue** - Create a tracked issue from this plan in your configured issue tracker (GitHub or Linear)
4. **Open in Proof (web app) — review and comment to iterate with the agent** - Open the doc in Every's Proof editor, iterate with the agent via comments, or copy a link to share with others. **Render this label only when no HTML was emitted this run** (i.e., `OUTPUT_FORMAT=md` AND no `.html` sibling was re-rendered).
4. **Open in browser** - Open the `.html` sibling locally for review and sharing. **Render this label whenever an HTML artifact was produced this run** — `OUTPUT_FORMAT=html` OR Phase 0.1 marked an `.html` sibling for re-render. Replaces "Open in Proof" at the same slot.
5. **Done for now** - Pause; the plan file is saved and can be resumed later

**Mutual exclusion on option 4.** Option 4 has two mutually exclusive labels: render exactly one based on whether an HTML artifact was produced this run. The "HTML emitted" predicate is `OUTPUT_FORMAT=html` OR Phase 0.1 marked an `.html` sibling for re-render — the same gate section 5.3.9 uses for composition. The menu gate MUST match the composition gate exactly; otherwise a resume run that regenerated the HTML would still surface Proof and hide the fresh HTML output. Proof operates on markdown plans (it ingests the `.md` source and rewrites markdown), so it does not work as a review surface for HTML output. The single-label rendering avoids a confusing "show both" outcome, keeps the menu within its 5-option cap, and prevents an HTML-emitting run from showing Proof and losing the user's fresh HTML in the handoff. `/ce-work` remains the recommended option in both modes — `ce-work` consumes the markdown plan that always exists, and HTML is a richer review/share surface, not a review gate.

**Menu rendering:** The menu has 5 options, which exceeds the `AskUserQuestion` 4-option cap. Per the AGENTS.md narrow exception for legitimate option overflow, render this menu as a numbered list in chat with the hint "Pick a number or describe what you want." rather than trimming to fit the cap. Each option is a distinct destination/workflow and none are removable without losing real user choice (deeper review, issue creation, Proof, ce-work, and pause are each separately requested in practice). On platforms where blocking question tools have no option cap (e.g., Codex `request_user_input`, Pi `ask_user`), use the platform's blocking tool with all 5 options. When the platform's blocking tool is unavailable or errors (e.g., Codex edit modes where `request_user_input` is not exposed, or `ask_user` returns no match), fall back to the same numbered-list-in-chat rendering with the "Pick a number or describe what you want." hint — the same fallback the `AskUserQuestion` overflow path uses. Never silently skip the question.

**Hide `Run deeper doc review` when no actionable findings remain.** Show option 2 only when the headless envelope reports `proposed_fixes_count + decisions_count > 0` — i.e., at least one `gated_auto` or `manual` finding at confidence anchor `75` or `100`. Drop the option in any other case, including FYI-only state. FYI observations (anchor `50`) do not enter `ce-doc-review`'s interactive routing question or walkthrough — that flow is gated to actionable findings — so a `Run deeper doc review` option that only has FYIs to show is a dead-end: ce-doc-review would re-dispatch the persona team, find the same FYIs, skip the routing question, and fall through to the terminal question with nothing to walk through. The user paid the dispatch cost for no engagement surface. When option 2 is dropped, the menu becomes 4 options (1, 3, 4, 5 above), falls back to `AskUserQuestion` on Claude Code, and renumbers 1-4 in display so users see a clean sequence. The summary line above the menu still names the FYI count when present (`Doc review applied 3 fixes. 2 FYI observations remain.`) so the user sees what was found, even though there is no menu action attached to it — the FYIs are visible in the headless envelope text the menu rendered alongside.

Based on selection (the bare per-option routing is also stated inline in the SKILL.md so it cannot be missed when this reference is not loaded; the elaborate sub-flows below are the reason this reference still exists):
- **Start `/ce-work`** -> Invoke the `ce-work` skill via the platform's skill-invocation primitive (`Skill` in Claude Code, `Skill` in Codex, the equivalent on Gemini/Pi), passing the plan path as the skill argument. Do not merely tell the user to type `/ce-work` — fire the invocation now so the plan executes in this session.
- **Run deeper doc review** -> Re-invoke the `ce-doc-review` skill on the plan path **without** `mode:headless` so the interactive routing question and walkthrough fire. The headless pass already applied `safe_auto` fixes and recorded its findings in the session, so the interactive pass picks up where headless stopped — its R29 suppression rule prevents prior-round Skipped/Deferred entries from re-raising. After it returns, re-render this menu with the refreshed counts so the user can pick what to do next.
- **Create Issue** -> Follow the Issue Creation section below
- **Open in Proof (web app) — review and comment to iterate with the agent** -> Load the `ce-proof` skill in HITL-review mode with:
  - source file: `docs/plans/<plan_filename>.md`
  - doc title: `Plan: <plan title from frontmatter>`
  - identity: `ai:compound-engineering` / `Compound Engineering`
  - recommended next step: `/ce-work` (shown in the ce-proof skill's final terminal output)

  Follow `references/hitl-review.md` in the ce-proof skill. It uploads the plan, prompts the user for review in Proof's web UI, ingests each thread by reading it fresh and replying in-thread, applies agreed edits as tracked suggestions, and syncs the final markdown back to the plan file atomically on proceed.

  When the ce-proof skill returns:
  - `status: proceeded` with `localSynced: true` -> the plan on disk now reflects the review. Re-run `ce-doc-review` on the updated plan before re-rendering the menu — HITL can materially rewrite the plan body, so the prior ce-doc-review pass no longer covers the current file and section 5.3.8 requires a review before any handoff option is offered. Re-apply section 5.3.9's HTML composition rule before re-rendering the menu — the markdown was just mutated, and the rule's two-condition gate (HTML wanted AND not in pipeline mode) decides whether to re-compose. Then return to the post-generation options with the refreshed residual findings.
  - `status: proceeded` with `localSynced: false` -> the reviewed version lives in Proof at `docUrl` but the local copy is stale. Offer to pull the Proof doc to `localPath` using the ce-proof skill's Pull workflow. If the pull happened, re-run `ce-doc-review` on the pulled file AND re-apply section 5.3.9's HTML composition rule before re-rendering the options (same 5.3.8 rationale — the local plan was materially updated by the pull; the rule's two-condition gate decides whether to re-compose HTML). If the pull was declined, include a one-line note above the menu that `<localPath>` is stale vs. Proof — otherwise `Start /ce-work` or `Create Issue` will silently use the pre-review copy.
  - `status: done_for_now` -> the plan on disk may be stale if the user edited in Proof before leaving. Offer to pull the Proof doc to `localPath` so the local plan file stays in sync. If the pull happened, re-run `ce-doc-review` on the pulled file AND re-apply section 5.3.9's HTML composition rule before re-rendering the options (same 5.3.8 rationale). If the pull was declined, include the stale-local note above the menu. `done_for_now` means the user stopped the HITL loop — it does not mean they ended the whole plan session; they may still want to start work or create an issue.
  - `status: aborted` -> fall back to the options without changes.

  If the initial upload fails (network error, Proof API down), retry once after a short wait. If it still fails, tell the user the upload didn't succeed and briefly explain why, then return to the options — don't leave them wondering why the option did nothing.
- **Open in browser** -> When an HTML artifact was produced this run (`OUTPUT_FORMAT=html` OR Phase 0.1 marked an `.html` sibling for re-render — the same predicate the menu gate and Phase 5.3.9 composition gate use), display the absolute path to the `.html` sibling so the user can open it locally. Where the platform exposes a browser-opening primitive (e.g., `open` on macOS, `xdg-open` on Linux, `start` on Windows), the agent may invoke it directly; otherwise print the absolute path and let the user open it. Do not invoke `ce-work` from this option — `ce-work` still consumes the markdown plan, and the user picked HTML for review/sharing, not handoff. After the path is displayed (or the browser is opened), return to the post-generation options so the user can pick a follow-up action.
- **Done for now** -> Display a brief confirmation that the plan file is saved and end the turn. Do not start follow-up work without an explicit further user prompt.
- **Free-form prompts that target the findings** (e.g., the user types "review", "walk through", "deep review" instead of picking a numbered option) -> route as if they had picked `Run deeper doc review`. Do not loop back to the menu without firing the deeper review.
- **Other free-form input** -> Accept revisions to the plan and loop back to options.

## Issue Creation

When the user selects "Create Issue", detect their project tracker:

1. Read `AGENTS.md` (or `CLAUDE.md` for compatibility) at the repo root and look for `project_tracker: github` or `project_tracker: linear`.
2. If `project_tracker: github`:

   ```bash
   gh issue create --title "<type>: <title>" --body-file <plan_path>
   ```

3. If `project_tracker: linear`:

   ```bash
   linear issue create --title "<title>" --description "$(cat <plan_path>)"
   ```

4. If no tracker is configured, ask the user which tracker they use with the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex, `ask_user` in Gemini, `ask_user` in Pi (requires the `pi-ask-user` extension). Fall back to asking in chat only when no blocking tool exists or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip. Options: `GitHub`, `Linear`, `Skip`. Then:
   - Proceed with the chosen tracker's command above
   - Offer to persist the choice by adding `project_tracker: <value>` to `AGENTS.md`, where `<value>` is the lowercase tracker key (`github` or `linear`) — not the display label — so future runs match the detector in step 1 and skip this prompt
   - If `Skip`, return to the options without creating an issue

5. If the detected tracker's CLI is not installed or not authenticated, surface a clear error (e.g., "`gh` CLI not found — install it or create the issue manually") and return to the options.

After issue creation:
- Display the issue URL
- Ask whether to proceed to `/ce-work` using the platform's blocking question tool
