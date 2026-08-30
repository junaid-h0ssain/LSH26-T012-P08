# Licenses

This file lists every framework, library, starter/template, UI kit, font, icon and asset used in **LSH26-T012-P08** and their licenses. All code is used under its respective open-source license.

> Evaluation manifest references this file via `licenses_file: LICENSES.md`. No vendored copies are redistributed beyond `node_modules`.

## 1. Starter / Template

| Name | Version | License | Source |
|---|---|---|---|
| TanStack Start starter (`create-tsrouter` / `file-router` preset) | — | **MIT** | https://github.com/TanStack/router |

## 2. Frameworks & Build

| Name | Version (package.json) | License | Source |
|---|---|---|---|
| React | `^19.2.0` | **MIT** | https://github.com/facebook/react |
| React DOM | `^19.2.0` | **MIT** | https://github.com/facebook/react |
| TanStack Router | `latest` | **MIT** | https://github.com/TanStack/router |
| TanStack Start (`@tanstack/react-start`) | `latest` | **MIT** | https://github.com/TanStack/router |
| TanStack Router CLI (`@tanstack/router-cli`) | `^1.132.0` | **MIT** | https://github.com/TanStack/router |
| TanStack Devtools (`@tanstack/devtools-vite`, `@tanstack/react-devtools`, `@tanstack/react-router-devtools`) | `latest` | **MIT** | https://github.com/TanStack/devtools |
| Vite | `^8.0.0` | **MIT** | https://github.com/vitejs/vite |
| @vitejs/plugin-react | `^6.0.1` | **MIT** | https://github.com/vitejs/vite-plugin-react |
| Nitro | `3.0.260610-beta` | **MIT** | https://github.com/nitrojs/nitro |
| Tailwind CSS | `^4.1.18` | **MIT** | https://github.com/tailwindlabs/tailwindcss |
| @tailwindcss/vite | `^4.1.18` | **MIT** | https://github.com/tailwindlabs/tailwindcss |
| TypeScript | `^6.0.2` | **Apache-2.0** | https://github.com/microsoft/TypeScript |
| @rolldown/plugin-babel | `^0.2.3` | **MIT** | https://github.com/rolldown/rolldown |
| babel-plugin-react-compiler | `^1.0.0` | **MIT** | https://github.com/facebook/react |

## 3. UI Kit / Components / Utilities

| Name | Version | License | Source |
|---|---|---|---|
| shadcn/ui (CLI `shadcn` `^4.19.0` + generated components in `src/components/ui/*`) | `^4.19.0` | **MIT** | https://github.com/shadcn-ui/ui |
| Base UI React (`@base-ui/react`) | `^1.7.0` | **MIT** | https://github.com/mui/base-ui |
| class-variance-authority | `^0.7.1` | **Apache-2.0** | https://github.com/joe-bell/cva |
| clsx | `^2.1.1` | **MIT** | https://github.com/lukeed/clsx |
| tailwind-merge | `^3.6.0` | **MIT** | https://github.com/dcastil/tailwind-merge |
| tw-animate-css | `^1.4.0` | **MIT** | https://github.com/Wombosvideo/tw-animate-css |

## 4. Lint / Format / Types

| Name | Version | License | Source |
|---|---|---|---|
| Biome (`@biomejs/biome`) | `2.4.5` | **MIT** + **Apache-2.0** (dual) | https://github.com/biomejs/biome |
| @types/node | `^22.10.2` | **MIT** | https://github.com/DefinitelyTyped/DefinitelyTyped |
| @types/react | `^19.2.0` | **MIT** | https://github.com/DefinitelyTyped/DefinitelyTyped |
| @types/react-dom | `^19.2.0` | **MIT** | https://github.com/DefinitelyTyped/DefinitelyTyped |

## 5. Fonts

| Name | Version | License | Source |
|---|---|---|---|
| Inter Variable (`@fontsource-variable/inter`) | `^5.3.0` | **SIL OFL 1.1** (font) + **MIT** (package) | https://github.com/fontsource/font-files — Inter by Rasmus Andersson |
| Instrument Sans Variable (`@fontsource-variable/instrument-sans`) | `^5.3.0` | **SIL OFL 1.1** (font) + **MIT** (package) | https://github.com/fontsource/font-files |

- Package wrappers are MIT (`fontsource`); the font files themselves are SIL Open Font License 1.1.

## 6. Icons

| Name | Version | License | Source |
|---|---|---|---|
| Lucide React (`lucide-react`) | `^0.577.0` | **ISC** (MIT-compatible) | https://github.com/lucide-icons/lucide |

## 7. Assets / Data

| Name | License | Notes |
|---|---|---|
| `P08_school_results_public.json` (80-student board fixture) | **Board-provided for evaluation** | Not redistributed under an OSS license; used as input fixture via Upload JSON |
| `src/lib/defaultDataset.json` (80 students, 2 classes) | **Generated for this project** | Same schema as board fixture; no third-party license |
| `src/styles.css`, `src/components/*` (app code) | **Private — project code** | Authored by team LSH26-T012 |

## 8. Notes

- No Convex, no other backend SDKs remain (removed — see `package.json:17-35`). The app is fully client-side.
- All licenses allow commercial use, modification and distribution with attribution. No GPL/AGPL copyleft components are included.
- Full license texts are in each package's `LICENSE` file inside `node_modules/<package>/` after `bun install` / `npm install`.
