# LSH26-T012-P08 — School Result Processing and GPA Engine

| Field | Value |
|---|---|
| **Team ID** | `LSH26-T012` |
| **Problem ID** | `P08` |
| **Live URL** | https://results-navy.vercel.app/ |
| **Event Code** | `LSH26-8490-C900` |
| **Repo** | `lsh26-t012-p08` |

Deterministic, fully client-side GPA engine that implements the board rules exactly (R-10 / R-11 / R-12 / R-13 / R-29), with per-student trace and office checking lists.

---

## Setup and Run

**Prerequisites:** Node 20+ or Bun 1.1+, no env vars required (Convex removed — pure client-side).

```bash
# 1. Install
bun install        # or: npm install

# 2. Dev server (http://localhost:3000)
bun run dev        # or: npm run dev

# 3. Production build + preview
bun run build
bun run preview    # or: npm run preview
# Nitro output: node .output/server/index.mjs

# 4. Lint / format
bun run check      # biome check
bun run lint
bun run format
```

**Load data:**

- Bundled default: `src/lib/defaultDataset.json` (80 students) loads automatically.
- Published fixture: click **Upload JSON** → select `P08_school_results_public.json` (any `cases[0]` or bare `CaseData` shape works).
- Reset: click **Reset** in header.

---

## Proof Each Requirement Is Met

### The four required items (AGENTS.md:5-11)

| # | Requirement (AGENTS.md) | Status | Evidence |
|---|---|---|---|
| **1** | **≥60 students across 2 classes, 6 compulsory + 1 optional, practical splits, ≥8 hard-edge students** (failed with strong avg, practical fail with passing theory, optional ≤2.0, absent) | ✅ | `src/lib/defaultDataset.json:3-50` — 9 subjects (BAN/ENG/MAT non-practical, PHY/CHE/BIO/HMT/AGR practical, REL non-practical), compulsory `[BAN,ENG,MAT,PHY,CHE,BIO]`. `src/lib/defaultDataset.json:58-2120` — **80 students** (40 Class 9 + 40 Class 10), each 7 marks. Hard edges verified via `src/lib/gpaEngine.ts:489-493`: High-avg fail 5 (`S004 4.67`, `S005 4.67`, `S011 3.83`, `S064 3.08`, `S070 3.25`), Practical fail 10 (`S002,S010,S011,S012…`), Optional ≤2.0 25 students, Absent 2 (`S032 BIO AB`, `S045 REL AB`). Shown in `src/routes/index.tsx:425-477` Hard Edges tab. |
| **2** | **Grade point per subject, final GPA and letter grade per student** | ✅ | `src/lib/gpaEngine.ts:75-83` `getGradePointAndLetter`, `src/lib/gpaEngine.ts:95-103` `getLetterFromGpa` (R-10), `src/lib/gpaEngine.ts:105-502` `evaluateStudent`/`evaluateCase` — produces `subjectTraces[].gradePoint`, `finalGpa`, `finalGrade` for every student. Rendered in Results table `src/routes/index.tsx:231-271`. |
| **3** | **Per-student trace: mark used, grade point, governing rule; high-avg failure must show causing subject** | ✅ | `src/routes/index.tsx:274-376` Trace tab: columns Subject/Type/Marks/Total/GP/Grade/Rule (`SubjectTrace.ruleApplied:31` cites `R-11`/`R-12`). Failure banner `src/routes/index.tsx:303-316` lists `failedCompulsorySubjects` + strikethrough `uncancelledGpa:260-262` + step-by-step GPA resolution `src/routes/index.tsx:348-374` showing `sumComp + max(0,opt-2) /6`. |
| **4** | **Office checking list: every student affected by optional rule, practical fail, or absent** | ✅ | `src/routes/index.tsx:380-422` Checking Lists tab with sub-tabs All / Optional ≤2.0 / Practical fail / Absent. Derived from `src/lib/gpaEngine.ts:489-492` flags. Handles overlapping lists (R-29). `src/routes/index.tsx:70-76` counts. |

### Clarifications — judges mark by these (AGENTS.md:12-19)

| Rule | Description | Evidence |
|---|---|---|
| **R-11** | Theory 75 pass 25, Practical 25 pass 8; failing either → GP 0 | `src/lib/gpaEngine.ts:153-278` — separate `th<25` / `pr<8` branches; e.g. `S011` PHY `Th60/75 pass + Pr5/25 fail → GP 0 (R-11)` at `src/lib/gpaEngine.ts:210-233` |
| **R-12** | Absent compulsory: `AB`, GP 0, overall `F`. Absent optional: contributes `0`, appears on checking list | `src/lib/gpaEngine.ts:130-146` compulsory AB, `src/lib/gpaEngine.ts:332-348` optional AB → `hasAbsentFlag` |
| **R-13** | GPA = `(sum compulsory GP + max(0, optGP-2))/6` capped `5.00` 2dp; any compulsory fail → `0.00 F`, uncancelled visible | `src/lib/gpaEngine.ts:452-469` + `src/routes/index.tsx:350-373` resolution trace; high-avg fails show `uncancelledGpa` before override |
| **R-10** | Letter from final GPA: `A+=5.00, A 4.00-4.99, A- 3.50-3.99, B 3.00-3.49, C 2.00-2.99, D 1.00-1.99, F fail` | `src/lib/gpaEngine.ts:95-103` |
| **R-29** | Checking lists: optional `GP≤2.0` (AB counts), practical `pr<8` any subject, absent `AB` any subject; student can be on multiple | `src/lib/gpaEngine.ts:489-492` + `src/routes/index.tsx:388-394` |

All rules verified against `P08_school_results_public.json` via `npx tsx` (80 default + public fixture, `S005` theory fail, `S011` practical fail, `S032`/`S045` absent, `S004` `32/100→F` edge).

---

## Major Decisions

1. **Engine isolated in `src/lib/gpaEngine.ts`** — pure functions `evaluateStudent`/`evaluateCase`/`getGradePointAndLetter`/`getLetterFromGpa` with no side effects, 100% testable and board-rule compliant. UI never computes GPA itself.
2. **Rich trace structure** — `SubjectTrace` captures `theoryMark/practicalMark/totalMark`, `gradePoint`, `letterGrade`, `failureReason` (`ABSENT`/`THEORY_FAIL`/`PRACTICAL_FAIL`/`TOTAL_FAIL`) and `ruleApplied` string citing `R-*`, plus `uncancelledGpa`/`failedCompulsorySubjects` for high-average failures.
3. **Fully client-side (Convex removed)** — no backend/DB; data is `src/lib/defaultDataset.json` + JSON upload parsed in `src/routes/index.tsx:90-110`. Keeps deployment to static Vercel possible and matches the deterministic nature of the board rules. Interactive filtering/sorting across classes, grades, and verification categories in the same route.

---

## Known Limitations

- None — all board rules and edge cases are covered. The only constraint is dataset size in memory (tested to 80+ students; scales linearly).

---

## Project Structure

```
src/lib/gpaEngine.ts        # core engine (R-10..R-29)
src/lib/defaultDataset.json # 80 students, 2 classes
src/lib/dataset.ts          # typed re-export
src/routes/index.tsx        # Results / Trace / Checking Lists / Hard Edges
src/routes/__root.tsx       # layout (no Convex)
src/components/ui/*         # shadcn + Base UI
```

## Team

- **Junaid Hossain** (@junaid-h0ssa) — GPA engine, trace viewer, checking lists, TanStack Start UI
- **Punam Chakraborty** (@punammomi)

## AI Tools

Antigravity CLI, Opencode — code generation and rule verification; output verified via `npx tsx` against public fixture and manual R-10..R-29 checks.
