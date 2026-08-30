# Third-Party Material and AI Disclosure

List material frameworks, libraries, starters, templates, UI kits, fonts, icons and assets used in this repository.

| Name | Version or source URL | Licence | Used for |
|---|---|---|---|
| TanStack Start starter (file-router preset) | https://github.com/TanStack/router | MIT | Project starter / file-router scaffold |
| React | `19.2.0` (package.json) | MIT | Frontend framework |
| React DOM | `19.2.0` | MIT | React rendering |
| TanStack Router | `latest` | MIT | File-based routing |
| TanStack Start (`@tanstack/react-start`) | `latest` | MIT | SSR / Start framework |
| TanStack Router CLI (`@tanstack/router-cli`) | `^1.132.0` | MIT | Route generation (`tsr generate`) |
| TanStack Devtools (`@tanstack/devtools-vite`, `@tanstack/react-devtools`, `@tanstack/react-router-devtools`) | `latest` | MIT | Devtools |
| Vite | `^8.0.0` | MIT | Build tool |
| @vitejs/plugin-react | `^6.0.1` | MIT | Vite React plugin |
| Nitro | `3.0.260610-beta` | MIT | Server adapter / build |
| Tailwind CSS | `^4.1.18` | MIT | Styling |
| @tailwindcss/vite | `^4.1.18` | MIT | Tailwind Vite plugin |
| TypeScript | `^6.0.2` | Apache-2.0 | Type checking |
| @rolldown/plugin-babel | `^0.2.3` | MIT | Build plugin |
| babel-plugin-react-compiler | `^1.0.0` | MIT | React Compiler |
| shadcn/ui (CLI `shadcn` + generated `src/components/ui/*`) | `^4.19.0` — https://github.com/shadcn-ui/ui | MIT | UI kit / components |
| Base UI React (`@base-ui/react`) | `^1.7.0` | MIT | Headless UI primitives (Button etc.) |
| class-variance-authority | `^0.7.1` | Apache-2.0 | Variant styling |
| clsx | `^2.1.1` | MIT | Class concatenation |
| tailwind-merge | `^3.6.0` | MIT | Tailwind class merging |
| tw-animate-css | `^1.4.0` | MIT | Animation utilities |
| Biome (`@biomejs/biome`) | `2.4.5` | MIT + Apache-2.0 (dual) | Lint / format |
| @types/node | `^22.10.2` | MIT | Type definitions |
| @types/react | `^19.2.0` | MIT | Type definitions |
| @types/react-dom | `^19.2.0` | MIT | Type definitions |
| Inter Variable (`@fontsource-variable/inter`) | `^5.3.0` — https://github.com/fontsource/font-files | SIL OFL 1.1 (font) + MIT (package) | Body font |
| Instrument Sans Variable (`@fontsource-variable/instrument-sans`) | `^5.3.0` | SIL OFL 1.1 (font) + MIT (package) | Heading font |
| Lucide React (`lucide-react`) | `^0.577.0` — https://github.com/lucide-icons/lucide | ISC (MIT-compatible) | Icons |
| P08_school_results_public.json | Board-provided fixture | Board-provided for evaluation | Sample input via Upload JSON |
| src/lib/defaultDataset.json | Generated for this project | Original work | 80-student default dataset |

## AI tools

List each AI tool in `evaluation-manifest.json`, what it was used for and how the output was verified. Write `None` if no AI tool was used.

| Tool | What it assisted with | How the team verified its output |
|---|---|---|
| Antigravity CLI, Opencode (Muse Spark) | Code generation, architecture, UI scaffolding, rule verification against public fixture | Verified via `npx tsx` against `P08_school_results_public.json` and `src/lib/defaultDataset.json` (80 students, 5 high-avg fails, 10 practical fails) and manual rule-by-rule check of R-10, R-11, R-12, R-13, R-29; `npm run build` passes |

## Original-work statement

Everything not declared in this file or `EVENT.md` was created by the registered team during the event window.
