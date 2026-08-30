# lsh26-t012-p08

Solution for **LofiStack Hackathon 2026 — P08 — School Result Processing and GPA Engine**

## Project information

- **Team:** `LSH26-T012`
- **Team ID:** `LSH26-T012`
- **Problem:** `P08 — School Result Processing and GPA Engine`
- **Live application:** <https://results-navy.vercel.app/>
- **Demo video:** _Optional — no video submitted (max 3 min if added later)_

> Judges will evaluate only the exact commit SHA entered in the Final Submission Form.

## Solution summary

Client-side deterministic GPA engine that implements the board rules exactly (R-10 letter grade, R-11 theory 25/75 + practical 8/25, R-12 absent `AB`, R-13 GPA formula capped 5.00, R-29 checking lists). 80 students across Class 9 and Class 10 with all hard-edge cases, per-student trace showing mark used / grade point / governing rule, and an office checking list for hand verification before publishing.

## Requirements

| Requirement | Status | Where to verify |
|---|---|---|
| R1 — Create ≥60 students across 2 classes, 6 compulsory + 1 optional per student, practical splits, ≥8 hard-edge students (failed with strong avg, practical fail with passing theory, optional ≤2.0, absent) | Complete | `src/lib/defaultDataset.json:3-50` subjects + `src/lib/defaultDataset.json:58-2120` 80 students (40 Class 9 + 40 Class 10) · Hard Edges tab `src/routes/index.tsx:425-477` (5 high-avg fail S004/S005/S011/S064/S070, 10 practical fail e.g. S011 PHY Th60/Pr5, 25 optional ≤2.0, 2 absent S032/S045) |
| R2 — Work out result: grade point per subject, final GPA and letter grade | Complete | `src/lib/gpaEngine.ts:75-83` `getGradePointAndLetter` + `src/lib/gpaEngine.ts:95-103` `getLetterFromGpa` (R-10) + `src/lib/gpaEngine.ts:105-502` `evaluateStudent`/`evaluateCase` · Results table `src/routes/index.tsx:231-271` |
| R3 — Per-student trace: mark used, grade point, governing rule; high-avg failure shows causing subject | Complete | Trace tab `src/routes/index.tsx:274-376` — Subject/Type/Marks/Total/GP/Grade/Rule columns (`SubjectTrace.ruleApplied:31` cites R-11/R-12) + failure banner `src/routes/index.tsx:303-316` + GPA resolution `src/routes/index.tsx:348-374` showing `sumComp + max(0,opt-2)/6` |
| R4 — Office checking list: every student affected by optional rule, practical fail, or absent | Complete | Checking Lists tab `src/routes/index.tsx:380-422` with sub-tabs All / Optional ≤2.0 / Practical fail / Absent derived from `src/lib/gpaEngine.ts:489-492` (R-29) |

Clarifications implemented: R-11 practical `src/lib/gpaEngine.ts:153-278`, R-12 absent `src/lib/gpaEngine.ts:130-146,332-348`, R-13 GPA + fail override `src/lib/gpaEngine.ts:452-469`, R-10 letter `src/lib/gpaEngine.ts:95-103`, R-29 lists `src/lib/gpaEngine.ts:489-492`.

## How to test the application

1. Open the live application: <https://results-navy.vercel.app/>
2. View **Results & GPA** tab — see compulsory sum, optional contribution, uncancelled vs final GPA, grade badge; use Search and Class/Grade filters.
3. Click any row → **Trace** tab — verify per-subject marks (Th/Pr split), total, GP, grade, and rule string `(R-11)`/`(R-12)`; check GPA Resolution box for `(sumComp + max(0,opt-2))/6`.
4. Open **Checking Lists** → verify All / Optional ≤2.0 / Practical fail / Absent tabs; open **Hard Edges** → verify ≥8 students across 4 categories; click any to jump to Trace.

### Test or sample data

- **Bundled default:** `src/lib/defaultDataset.json` (80 students) loads automatically on first load.
- **Published fixture:** Click **Upload JSON** in header → select `P08_school_results_public.json` (or any file with `{cases:[CaseData]}` or bare `CaseData` shape). Parsed in `src/routes/index.tsx:90-110`.
- **Reset:** Click **Reset** in header to restore the bundled dataset.

## Run locally

### Requirements

- Node 20+ or Bun 1.1+
- No database, no env vars required (fully client-side; Convex removed)

### Setup

```bash
git clone https://github.com/junaid-h0ssa/lsh26-t012-p08.git
cd lsh26-t012-p08
bun install          # or: npm install
# no .env required — app is fully client-side
bun run dev          # or: npm run dev  → http://localhost:3000
```

```bash
bun run build        # production build (Nitro)
bun run preview      # preview build
# or: node .output/server/index.mjs
```

Do not include real passwords, tokens or API keys. List only variable names in `.env.example`.

## Problem-solving approach

- **Understanding:** Parsed AGENTS.md + `P08_school_results_public.json:4` format_note — practical subjects carry `theory 0..75` + `practical 0..25`, `AB` means absent, 6 compulsory + 1 optional per student.
- **Chosen solution:** Pure client-side deterministic engine (`evaluateStudent` pure function) that enforces R-11 (both parts must pass), R-12 (AB handling), R-13 (GPA formula + fail override), R-10 (letter), R-29 (checking lists) exactly; UI only renders results.
- **Most important decision:** Isolate all board rules in `src/lib/gpaEngine.ts` for 100% testability; remove Convex/backend to keep deployment static and deterministic.
- **Testing:** `npx tsx` against `P08_school_results_public.json` + `defaultDataset.json` (verified S004 32→F, S005 theory fail, S011 practical fail with passing theory, S032/S045 absent, high-avg 5 cases); manual R-10..R-29 trace check; `npm run build` passes.

## Technology used

- **Frontend:** React 19, TanStack Start + TanStack Router (file-router), Tailwind CSS 4, shadcn/ui + Base UI React, Lucide icons, Fontsource Inter/Instrument Sans
- **Backend:** None (fully client-side)
- **Database:** None (in-memory `CaseData` + JSON upload)
- **Deployment:** Vercel (Nitro server, `vite build`)
- **Other material tools:** Vite 8, Biome 2.4.5, TypeScript 6, TanStack Devtools

See [`LICENSES.md`](LICENSES.md) for third-party materials.

## Team contributions

| Registered member | GitHub username | Major contribution | Evidence |
|---|---|---|---|
| Junaid Hossain | `junaid-h0ssa` | GPA engine, trace viewer, checking lists, TanStack Start UI | `src/lib/gpaEngine.ts`, `src/routes/index.tsx`, `src/lib/dataset.ts` |
| Punam Chakraborty | `punammomi` | UI testing and verification, dataset hard-edge validation | Manual verification of hard-edge cases, `src/lib/defaultDataset.json` |

Commit count alone does not represent contribution.

## AI usage

| Tool | What it assisted with | How the team verified its output |
|---|---|---|
| Antigravity CLI, Opencode (Muse Spark) | Code generation, architecture, UI scaffolding, rule verification | Verified via `npx tsx` against `P08_school_results_public.json` and `defaultDataset.json` (80 students, 5 high-avg fails, 10 practical fails) and manual rule-by-rule check of R-10, R-11, R-12, R-13, R-29; `npm run build` |

## Major design decisions

- **Decision:** Engine isolated in `src/lib/gpaEngine.ts` (`evaluateStudent`/`evaluateCase` pure functions) — *Reason:* exact board-rule compliance and instant unit-testability without UI.
- **Decision:** Rich `SubjectTrace` with `ruleApplied` citing `R-*` and `uncancelledGpa` + `failedCompulsorySubjects` — *Reason:* satisfies R3 trace + R-13 high-average failure visibility.
- **Decision:** Fully client-side with JSON upload and no Convex/backend — *Reason:* deterministic, zero-infra, static deployable to Vercel, matches board calculation nature.

## Known limitations

- None — all board rules and hard-edge categories are covered. Dataset size limited only by browser memory (tested to 80 students; scales linearly).

## Repository records

- [`EVENT.md`](EVENT.md) — event start code and pre-event-material declaration
- [`evaluation-manifest.json`](evaluation-manifest.json) — structured judging evidence
- [`LICENSES.md`](LICENSES.md) — frameworks, libraries, templates and assets
