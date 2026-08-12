# CEMS UI Guidelines

**Status: MANDATORY.** This document defines the UI system for the CEMS client (`cems-client`). Every UI change — new pages, components, or edits to existing ones — MUST follow these rules. Deviations are not allowed without updating this document first. Do not bypass, "temporarily" override, or introduce parallel styling systems.

---

## 1. Technology Stack

| Concern | Tool | Rule |
|---|---|---|
| Framework | React 19 + TypeScript | Function components only, typed props |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) | Utility classes only — no CSS modules, no styled-components, no inline `style` objects. **One exception:** the shared `DataTable` uses inline `style` solely for computed sticky-column `left`/`width` offsets, which Tailwind's static extraction can't express. Do not use inline styles anywhere else. |
| Icons | `@mui/icons-material` | Icons ONLY. `Outlined` or `Rounded` variants, always `fontSize="small"` |
| MUI components | `@mui/material` | **FORBIDDEN in new code.** Legacy usage (old `UserForm`, `AdminUserCreatePage`, `AdminUserEditPage`, `AdminUserViewPage`, `UserStatusChip`) is deprecated and routes to it are redirected. Never extend it — replace with Tailwind equivalents when touched |
| Routing | `react-router` v7 | Routes declared in `src/app/App.tsx` |
| State | Zustand stores per feature | e.g. `features/auth/store/authStore.ts` |
| HTTP | axios via `src/shared/api/http.ts` | All API calls go through feature `api/` modules |

There is no `tailwind.config` file (Tailwind v4). Colors and shadows are applied with arbitrary values (e.g. `bg-[#1f5d3b]`) using ONLY the palette in section 3.

Global CSS lives in `src/app/styles/globals.css` and must stay minimal: font import, resets, body colors, and the shared overlay-entrance `@keyframes` + `animate-*` utilities (§7). Do not add component-specific CSS there.

---

## 2. Design Language

The system is a flat, sharp-cornered, institutional green theme for Cavite State University – Bacoor City Campus ("Extension Projects Management System").

Core rules:

1. **No rounded corners.** Containers, buttons, inputs, tables, chips, and modals all have square edges. Never add `rounded-*` to them. The exceptions are:
   - `rounded-full` on avatar circles and loading spinners.
   - **Auth screens only** — form controls (text inputs and buttons) on the authentication pages use a soft `rounded-lg` radius (see §5.3 and §6.10). Containers, panels, and cards on those pages stay square. This exception does NOT extend to the admin shell, tables, modals, chips, or the public survey.
2. **Flat surfaces, 1px borders.** Depth comes from borders and the occasional soft green-tinted shadow (section 3.4) — never from gradients or heavy elevation.
3. **Light theme only.** `color-scheme: light` is set in `globals.css`. Do not add dark mode styling.
4. **Whitespace over dividers.** Use `space-y-*` / `gap-*` for rhythm; borders mark container boundaries and table rows.

---

## 3. Color Scheme

Use these exact hex values. Do not invent new colors, do not use Tailwind's named palette (`green-600`, `gray-500`, etc.).

### 3.1 Base

| Role | Hex | Usage |
|---|---|---|
| App background | `#f4f7f1` | Page/body background |
| Surface | `#ffffff` | Cards, sidebar, header, modals, tables |
| Surface tint | `#f7faf6` | Table header rows, secondary button bg, disabled input bg, chips |
| Surface tint (alt) | `#f1f6f0` | Active nav item background |
| Hover tint | `#f6faf5` | Hover state of bordered/secondary buttons and menu items |
| Row hover | `#fbfdf9` | Table row hover, modal footer bg |
| Skeleton | `#edf3ea` | Loading placeholder bars (`animate-pulse`) |

### 3.2 Brand green (primary)

| Role | Hex | Usage |
|---|---|---|
| Primary | `#1f5d3b` | Primary buttons, active nav accent, spinner accent, avatar bg, active pagination |
| Primary hover | `#18492e` | Hover of primary buttons |
| Ink (headings/body emphasis) | `#123524` | Headings, primary text, overlay tint (`bg-[#123524]/45` for modal backdrop, `/20` mobile drawer) |

### 3.3 Text

| Role | Hex | Usage |
|---|---|---|
| Heading / emphasis | `#123524` | h1–h4, labels, button text on light |
| Body | `#506552` | Paragraphs, descriptions (`text-sm leading-6` or `leading-7`) |
| Table cell text | `#445846` | Table rows, nav item resting state |
| Muted | `#617462` | Captions, meta text, inactive chip text |
| Muted (alt) | `#6a7f6d` | Small secondary text (e.g. role under name) |
| Eyebrow / section label | `#73856f` | Uppercase eyebrows |
| Field label (uppercase) | `#6d7f6b` | Filter/table-header labels |
| Disabled text | `#8a9989` | Disabled nav items, placeholder-ish text |
| Placeholder | `#819181` | Input placeholders |
| Icon muted | `#60755f` | Icon-only buttons at rest |

### 3.4 Borders & shadows

| Role | Value |
|---|---|
| Container border | `#d8e1d4` — cards, modals, sidebar, buttons, inputs at rest |
| Section divider | `#e7eee3` — borders between card header/body/footer |
| Row divider | `#eef2eb` — table rows, list separators |
| Interactive control border | `#cad5c7` — header controls, login inputs |
| Card shadow | `shadow-[0_12px_30px_rgba(18,53,36,0.05)]` |
| Dropdown shadow | `shadow-[0_12px_30px_rgba(18,53,36,0.08)]` |
| Toast shadow | `shadow-[0_18px_40px_rgba(18,53,36,0.12)]` |
| Modal shadow | `shadow-[0_28px_80px_rgba(18,53,36,0.18)]` |

Shadow color is always green-tinted `rgba(18,53,36,x)` — never plain black.

### 3.5 Semantic

| Role | Values |
|---|---|
| Danger action | bg/border `#9f2f2f`, hover `#832424`, white text |
| Danger text | `#8a2d2d` |
| Danger borders | `#e3c9c9` (alerts/buttons), `#ead7d7` (callouts) |
| Danger backgrounds | `#fff5f5` (alerts), `#fff7f7` (callouts, destructive hover) |
| Success chip | border `#bfd3c0`, bg `#f3f9f2`, text `#1f5d3b` |
| Warning text | `#7b6542` (e.g. read-only notices) |

---

## 4. Typography

- **Font:** `"Google Sans", sans-serif` everywhere. Loaded via Google Fonts `@import` in `globals.css`. Never introduce another font family (exception: `font-mono` for IDs in tables).
- **Base:** `line-height: 1.5`, `font-weight: 400`.

Scale (Tailwind classes — use exactly these combinations):

| Element | Classes |
|---|---|
| Page title (login) | `text-2xl font-semibold tracking-[-0.04em] text-[#123524]` |
| Header title | `text-base md:text-lg font-semibold tracking-[-0.02em]` |
| Section heading (h3/h4) | `text-lg` or `text-xl` `font-semibold tracking-[-0.02em]`/`tracking-[-0.03em]` |
| Stat value | `text-3xl font-semibold tracking-[-0.03em]` |
| Eyebrow | `text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73856f]` |
| Field/table-header label | `text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]` |
| Body copy | `text-sm leading-6 text-[#506552]` (`leading-7` for long paragraphs) |
| Meta/caption | `text-sm text-[#617462]` or `text-xs text-[#6a7f6d]` |
| Buttons / inputs / table cells | `text-sm font-medium` (cells: no `font-medium`) |

Conventions: headings use negative tracking; all-caps labels use wide positive tracking (`0.12em`–`0.18em`). Sentence case for headings and buttons ("Create New User" style title case is allowed on primary CTAs).

---

## 5. Layout

### 5.1 App shell (`AdminLayout`)

```
┌──────────────────────────────────────────────┐
│ ┌────────┐ ┌──────────────────────────────┐  │  h-screen, overflow-hidden,
│ │Sidebar │ │ Header (white, border-b)     │  │  bg-[#f4f7f1], text-[#123524],
│ │ white  │ ├──────────────────────────────┤  │  centered max-w-[1600px]
│ │border-r│ │ Main: overflow-y-auto p-4    │  │
│ │        │ │  ┌────────────────────────┐  │  │
│ │        │ │  │ White content panel    │  │  │
│ │        │ │  │ border #d8e1d4         │  │  │
│ │        │ │  │ p-4 md:p-6             │  │  │
│ └────────┘ └──└────────────────────────┘──┘  │
└──────────────────────────────────────────────┘
```

- Shell: `h-screen overflow-hidden`; only `<main>` scrolls (`min-h-0 flex-1 overflow-y-auto`).
- **Sidebar:** white, `border-r border-[#d8e1d4]`; width `w-[280px]`, collapsed `w-[88px]` (`transition-[width] duration-200`). Hidden below `md`; mobile uses a full-screen drawer (same 280px sidebar) over a `bg-[#123524]/20` overlay at `z-50`.
- Sidebar structure: campus logo block (logo `h-11 w-11`) → scrollable nav → bordered logout footer.
- **Collapsing hides labels, never controls.** When `collapsed`, the sidebar keeps every actionable item reachable and only drops its text: nav items and the logout button center their icon (`justify-center`, padding narrows to `px-2`/`px-3`) and move their label into a `sr-only` span, gaining `aria-label` + `title` so the icon still announces itself and shows a tooltip. Do not `hidden` a control to make it fit the 88px rail — a collapsed sidebar that drops sign-out strands the user.
- Nav items: `border-l-2` accent; active = `border-[#1f5d3b] bg-[#f1f6f0] text-[#123524]`; rest = `border-transparent text-[#445846] hover:bg-[#f7faf6] hover:text-[#123524]`; disabled = `text-[#8a9989]`.
- **Header:** white, `border-b border-[#d8e1d4]`, `px-4 py-4`; left side = the sidebar collapse toggle followed by the eyebrow breadcrumb ("Administration / Section") over the system title; right side = profile button (avatar circle `h-9 w-9 rounded-full bg-[#1f5d3b]` with initials) and mobile menu button.
- **Sidebar collapse toggle lives in the header, not the sidebar.** `hidden h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-[#cad5c7] text-[#123524] transition-colors hover:bg-[#f6faf5] md:inline-flex`, with `ChevronLeftRounded` when expanded / `ChevronRightRounded` when collapsed. It sits `md:`-only (its mobile counterpart is the menu button on the right, at the same `h-10 w-10`), and carries `aria-label` + `title` plus `aria-expanded` and `aria-controls="admin-sidebar"` pointing at the `<aside>`. The title block beside it is `min-w-0` with a `truncate` heading so a narrow header shortens the title rather than displacing the toggle.
- All routed pages render inside the white content panel via `<Outlet />`.

### 5.2 Page composition

- Pages return `<div className="space-y-6">`.
- Page header block: eyebrow → `h4` title (`mt-2`) → description `p` (`mt-3 max-w-3xl`), with action buttons aligned right on `xl` (`flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between`).
- Content sits in bordered white sections: `border border-[#d8e1d4] bg-white` with internal `px-5 py-4` header/footer strips separated by `border-[#e7eee3]`.
- Grids: stats `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`; two-column content `xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]`.

### 5.3 Auth pages

#### 5.3.1 Login — split screen

The login screen (`/login`) uses a **full-bleed two-column split**; it is the only screen with this layout.

```
┌────────────────────────┬────────────────────────┐
│  White form column     │  Green brand panel     │
│  bg-white              │  campus photo + wash   │
│                        │                        │
│  logo + wordmark       │  Vision                │
│  "Sign in" h1          │  Mission               │
│  form (space-y-5)      │  Core Values (chips)   │
│                        │  Quality Policy        │
│                        │  ─── Privacy notice    │
└────────────────────────┴────────────────────────┘
   lg:grid-cols-2 · below lg the columns stack, panel second
```

- Shell: `<main className="min-h-screen bg-white text-[#123524] lg:grid lg:grid-cols-2">` — no page padding on the shell; each column owns its own padding. No outer card, no shadow, no border between the columns (the color change is the seam).
- **Form column:** `flex flex-col justify-center px-6 py-12 sm:px-10 lg:min-h-screen lg:px-16`, inner `mx-auto w-full max-w-[400px]`. Order: logo + wordmark block → `h1` title → description → form (`mt-8 space-y-5`).
  - Title on this screen is the short action ("Sign in"), not the system name — the system name lives in the wordmark above it.
  - `min-h-screen` is applied only from `lg`, so on phones the column sizes to its content.
- **Brand panel (`LoginBrandPanel`):** `relative flex flex-col justify-center bg-[#123524] px-6 py-12 text-white sm:px-10 lg:px-16`, inner `mx-auto w-full max-w-[400px] space-y-7 lg:mx-0 lg:max-w-lg`.
  - Carries the university's Vision, Mission, Core Values and Quality Policy, closing with a link to the public privacy notice (`/privacy`). Institutional copy is quoted verbatim from the university's published wording — do not paraphrase or "fix" it (the Quality Policy's mid-sentence capitals and its three-value list against the four Core Values are both as published).
  - **It renders at every breakpoint** and stacks below the form column on phones. It holds the only login-screen link to the privacy notice, so it must not be `hidden` at any size.
  - **The section must not clip.** `overflow-hidden` belongs on the decorative wrapper (`absolute inset-0 overflow-hidden`, `aria-hidden="true"`), never on the section — the copy is long enough to be cut off at short viewport heights otherwise.
  - Structure: heading per block is an `h2` at eyebrow scale; body `mt-2 text-sm leading-6`; Core Values render as a `ul` of square chips (`inline-flex border border-white/25 px-2.5 py-1 text-xs font-medium`), matching §6.4 chip geometry in white tints.
  - **Text tints are set by measured contrast, not taste.** Against the brightest point of the washed photo (~`rgb(65,93,79)`), pure white measures 7.2:1 and `text-white/80` 5.4:1 — both clear WCAG AA for normal text. `text-white/60` measures 3.8:1 and **fails**; do not use it here or on any text over the photo. Re-measure if the photograph or the wash changes.
- **Photograph** (`public/cvsubacoor.jpg`): `absolute inset-x-0 top-0 h-[135%] w-full object-cover object-[90%_top] opacity-60` over the `bg-[#123524]` ground, under a `bg-[#123524]/80` wash.
  - The source is landscape and carries a white "BACOOR CAMPUS" caption banner across its foot. `object-cover` in this column fits it vertically, which would put that banner on screen as a pale band. The image box is therefore oversized to `h-[135%]` and anchored `object-top` so the wrapper's `overflow-hidden` clips the banner away. **`h-[135%]`, `object-top`, and the wrapper's `overflow-hidden` must stay together.** The visible vertical slice is `1/1.35 ≈ 74%` at any viewport size, which is what keeps the banner out at every breakpoint including the stacked layout.
  - `object-[90%_top]` frames the "I ♥ CvSU / Bacoor City Campus" signage. The horizontal crop tightens as the column gets taller and narrower — expect the sign to clip slightly at tall viewports. That is inherent to a landscape source in a portrait column, not a bug to chase.
  - Photo `opacity` and the wash are a pair, and they now also carry the text contrast above. Changing either one requires re-checking both legibility and tone.
- **Line-work:** absolutely-positioned `rotate-45` squares bled off the edges (`border-white/10`, `border-white/[0.07]`, `border-white/[0.06]`) echoing the diamond of the CvSU seal. Square corners are preserved — these are rotated squares, not circles. Static `rotate-45` for decoration is permitted here; §7's ban on transforms still applies to interaction states.
- Colors on green come from white opacity tints only. Never introduce new hex values or §3 light-surface colors here.
- A previous treatment used the seal itself as a ghosted watermark via `grayscale invert mix-blend-screen` (`public/logo.png` is an opaque palette PNG with no alpha, so plain `opacity` shows its white backing as a pale rectangle). If that is ever revived, all three classes are required together.
- An alternative panel — survey-code entry, contact block, privacy link on a plain green field — is kept at `src/features/auth/components/LoginPublicPanel.tsx`. It is self-contained and not mounted; swapping it in is a one-line change in `LoginPage`. Do not let both render.

**Reachability rule for the login screen.** Anything an account-less visitor needs — the privacy notice, and the survey-code entry if it is restored — must render at every breakpoint. Community survey respondents are on phones by definition (spec Module 3 §3), so a `hidden … lg:` wrapper around any of it is a defect, not a style choice.

#### 5.3.2 Other auth pages

Forgot password, reset password, and change password keep the centered-card layout: `max-w-[420px] border border-[#d8e1d4] bg-white p-8 md:p-10 shadow-[0_12px_30px_rgba(18,53,36,0.05)]` on the `#f4f7f1` background, with eyebrow → title → description → form (`mt-4 space-y-5`).

### 5.4 Public survey layout (`/s/:token`)

The public needs-assessment form is the one screen served to **unauthenticated respondents on a phone**. It deliberately sits outside the `AdminLayout` shell and outside `RequireAuth`.

- Shell: `min-h-screen bg-[#f4f7f1] px-4 py-8`, single centered column `mx-auto w-full max-w-[640px] space-y-6`. **No sidebar, no header chrome, no profile menu.**
- A small bordered white card at the top carries the campus eyebrow + "Community Needs Assessment"; every subsequent block (intro, demographic block, each question, privacy notice) is its own `border border-[#d8e1d4] bg-white px-5 py-5` section.
- **Touch targets are larger than in the admin UI**: body/inputs step up from `text-sm` to `text-base`, inputs use `py-3`, and radio/checkbox choices are full-width bordered rows (`flex items-center gap-3 border border-[#d8e1d4] px-4 py-3 hover:bg-[#f6faf5]`) rather than bare inputs. The primary submit is full-width (`w-full ... py-3`).
- Rating (1–5) renders as a `grid grid-cols-5 gap-2` of square toggle buttons; the selected value is primary-filled (`border-[#1f5d3b] bg-[#1f5d3b] text-white`), with "1 — Very poor" / "5 — Very good" anchors beneath.
- Terminal states (closed, not found, already responded, thank-you) render as a single centered `Notice` card with an `@mui/icons-material` icon (`fontSize="large"`), title, and one explanatory paragraph — never a toast, since the respondent has no app shell to return to.
- Palette, square corners, and Google Sans are unchanged — this is the same design system at a larger touch scale, not a second one. **The §6.10 auth radius does not apply here** — public-survey controls stay square.
- The shell is the shared `PublicShell` (`src/features/public-survey/components/PublicShell.tsx`); its `subtitle` prop names the page under the campus eyebrow. Every public page reuses it rather than re-declaring the layout — currently the survey form (`/s/:token`) and the privacy notice (`/privacy`).
- **Public privacy notice (`/privacy`)** — required by §5.3 (RA 10173). Renders in `PublicShell` as a stack of `border border-[#d8e1d4] bg-white px-5 py-5` sections, one per topic (what we collect / how we use it / who can see it / your rights / contact), closing with a "Back to sign in" link. The survey form keeps its short inline notice above the consent checkbox and links here for the long form; the two must not contradict each other — edit both together.

### 5.5 Breakpoints

Standard Tailwind breakpoints. Conventions: `md` = sidebar/desktop-header threshold; `sm`/`lg`/`xl` for progressive grid/flex expansion; body has `min-width: 320px`. Tables never squeeze — wrap in `overflow-x-auto` with a `min-w-[1080px]` table.

---

## 6. Components

### 6.1 Buttons

All buttons: square corners (**except on auth screens** — see §6.10), `text-sm font-medium`, `transition-colors`, `cursor-pointer`, and `disabled:cursor-not-allowed disabled:opacity-60` (icon buttons and pagination use `opacity-45`).

| Variant | Classes |
|---|---|
| Primary | `border border-[#1f5d3b] bg-[#1f5d3b] px-4 py-2.5 text-white hover:bg-[#18492e]` (full-width forms use `py-3`) |
| Secondary / outline | `border border-[#d8e1d4] px-4 py-2.5 text-[#123524] hover:bg-[#f6faf5]` |
| Tinted secondary | `border border-[#d8e1d4] bg-[#f7faf6] px-4 py-2.5 text-[#123524] hover:bg-[#edf4ea]` |
| Destructive | `border border-[#9f2f2f] bg-[#9f2f2f] px-4 py-2.5 text-white hover:bg-[#832424]` |
| Icon action (tables) | `flex h-9 w-9 items-center justify-center border border-[#d8e1d4] text-[#123524] hover:bg-[#f6faf5]` — destructive variant: border `#e3c9c9`, text `#9f2f2f`, hover bg `#fff7f7` |

- Loading state: swap the icon for a spinner and change the label to progressive form — "Sign in" → "Signing in...", "Delete User" → "Deleting...".
- Spinner: `h-4 w-4 animate-spin rounded-full border-2` + `border-white/35 border-t-white` on dark buttons, `border-[#d8e1d4] border-t-[#1f5d3b]` on light (h-5 w-5 for full-page loaders).
- Icon buttons must have `aria-label` and `title`.

### 6.2 Inputs & selects

- Text input: `w-full border border-[#cad5c7] bg-white px-4 py-3 text-sm text-[#123524] outline-none transition-colors placeholder:text-[#819181] focus:border-[#1f5d3b] disabled:cursor-not-allowed disabled:bg-[#f7faf6] disabled:text-[#7d8d7c]` (compact filter variant: `h-10 px-3`, border `#d8e1d4`).
- Selects: same as compact input plus `cursor-pointer`.
- Corners are square **except on auth screens** — see §6.10.
- Focus = border color change to `#1f5d3b` only. No focus rings, no shadows.
- Labels: block label above the field, `mb-2 text-sm font-medium text-[#123524]` (forms) or stacked `flex flex-col gap-1.5` with the uppercase `text-xs` label (filters).
- Password fields: relative wrapper, `pr-12`, absolute right visibility-toggle button using MUI `VisibilityRounded`/`VisibilityOffRounded`.

### 6.3 Tables

- Wrapper: `overflow-x-auto`, table `min-w-[1080px] table-auto border-collapse`.
- Header row: `border-b border-[#e7eee3] bg-[#f7faf6] text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#6d7f6b]`, cells `px-5 py-3`. Actions column right-aligned.
- Body rows: `border-b border-[#eef2eb] text-sm text-[#445846] last:border-b-0 hover:bg-[#fbfdf9]`, cells `px-5 py-4`. IDs use `font-mono text-xs text-[#5d705e]`; empty values render `-`.
- Empty state: single cell `colSpan`, `px-5 py-12 text-center text-sm text-[#617462]`.
- Loading: keep the header, render 5 skeleton rows of `h-4 animate-pulse bg-[#edf3ea]` bars, with an `aria-busy` strip above ("Loading ... records...").
- Pagination footer: "Page X of Y" left; Previous / numbered pages (ellipsis collapse) / Next right. Active page = primary-filled; buttons `px-3 py-2 min-w-10`.

**Shared `DataTable` (`src/shared/table`).** Reuse this for data grids rather than hand-rolling `<table>` markup; it renders the header/body/skeleton/empty states above and adds:
- **Frozen columns:** mark leading columns `frozen: true` with an explicit `width` (px). They stick to the left (`position: sticky`) while the rest scroll horizontally, get an opaque background that follows row hover (`group-hover`), and the last frozen column carries a `border-r border-[#e7eee3]` seam. Keep frozen columns to the stable identity fields (e.g. a person's name) and give them `truncate` cells. Offsets are computed via a small inline `style` (the §1 exception).
- **Row selection:** `selectable` adds a leading checkbox column + a select-all header checkbox (with indeterminate state). Checkboxes are native, styled `h-4 w-4 cursor-pointer accent-[#1f5d3b]`; disable non-selectable rows via `isRowSelectable` (e.g. the signed-in user's own row). Selection state is controlled by the page (`selectedIds` / `onSelectionChange`); clear it whenever the query (page/filter/search) changes.
- **Bulk actions:** while ≥1 row is selected, a bar renders above the table — `border-b border-[#e7eee3] bg-[#f7faf6] px-5 py-3`, "N selected" on the left and the caller's action buttons (from `bulkActions(selectedIds)`) on the right. Destructive bulk actions confirm through an `AdminDialog` (§6.5) before running.
- **Column sorting:** sortable columns declare a `sortKey`; their header becomes a button with a trailing arrow icon (`ArrowUpwardRounded` / `ArrowDownwardRounded` when active in `#1f5d3b`, muted `UnfoldMoreRounded` in `#9caf9a` when inactive). The page owns sort state (`sortKey`/`sortDirection`/`onSortChange`) and toggles asc/desc on the active column. **Sort lives on the headers, not in a separate Sort/Order filter row.**
- Pagination stays **outside** the component (the page composes it below), as does the section header/filters.

### 6.4 Chips / badges

`inline-flex border px-2.5 py-1 text-xs font-medium` — neutral: `border-[#d8e1d4] bg-[#f7faf6] text-[#123524]`; active/success: `border-[#bfd3c0] bg-[#f3f9f2] text-[#1f5d3b]`; inactive: neutral border/bg with `text-[#617462]`. Status placeholders in action columns ("Protected", "Read only") use `px-3 py-2`.

**Priority chips** (need-assessment priorities, and any future four-level severity scale) use the same base classes with these tones, ordered by descending visual weight — no new colors, all four values come from §3:

| Priority | Classes |
|---|---|
| Critical | `border-[#e3c9c9] bg-[#fff5f5] text-[#8a2d2d]` |
| High | `border-[#d8e1d4] bg-[#f7faf6] text-[#7b6542]` |
| Moderate | `border-[#bfd3c0] bg-[#f3f9f2] text-[#1f5d3b]` |
| Low | `border-[#d8e1d4] bg-[#f7faf6] text-[#617462]` |

**Decision-status chips** (recommendation pending/accepted/modified/rejected, and any future decision state) reuse exactly these four tones — rejected takes the critical tone, modified the high tone, accepted the moderate/success tone, pending the low/neutral tone. Do not introduce a fifth colour for a status.

### 6.5 Modals — `AdminDialog`

All dialogs MUST use `src/features/users/components/AdminDialog.tsx` (or follow it exactly):

- Fixed overlay `z-50`, backdrop `bg-[#123524]/45 backdrop-blur-[1px]` rendered as a close button; Escape closes; body scroll locked while open; `role="dialog" aria-modal="true"` with `aria-labelledby`/`aria-describedby`.
- Panel: `border border-[#d8e1d4] bg-white shadow-[0_28px_80px_rgba(18,53,36,0.18)]`, `max-h-[calc(100vh-3rem)]`; width via `maxWidthClassName` (`max-w-xl` confirmations, `max-w-3xl` forms).
- Structure: bordered header (title `text-lg font-semibold tracking-[-0.02em]` + description + Close button) → scrollable body `px-5 py-5 sm:px-6` → footer `border-t bg-[#fbfdf9]` with buttons right-aligned (`sm:justify-end`), Cancel (secondary) before the confirming action.
- While an operation is in flight: disable close (`closeDisabled`), keep the modal open, show the button loading state.
- Destructive confirmations include a warning callout: `border border-[#ead7d7] bg-[#fff7f7] px-4 py-3 text-[#8a2d2d]`.

### 6.6 Alerts & toasts

- Inline error alert: `border border-[#e3c9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#8a2d2d]`, placed above the form/table it concerns, with a Retry secondary button where applicable. Use inline alerts for **section-scoped** state (a failed table load, a form-field summary), not for transient action feedback.
- **Global toast (single system — `src/shared/toast`).** All transient notifications go through the shared toast, never a per-page toast. Push from anywhere with `notify.success | error | warning | info(message, duration?)`; the `ToastViewport` is mounted once at the app root.
  - Placement: fixed stack, bottom-right — `inset-x-4 bottom-6 z-40 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6`; container is `pointer-events-none`, each toast `pointer-events-auto`. Newest sits nearest the corner; multiple stack.
  - Card: `w-full max-w-sm border border-[#d8e1d4] bg-white` + toast shadow, inner `flex items-start gap-3 border-l-4 px-4 py-3` — a leading `@mui/icons-material` icon (`fontSize="small"`), the `flex-1 text-sm leading-6` message, then a trailing `Dismiss` icon button (`CloseRounded`, `aria-label`+`title`).
  - Tones (left accent / icon / text): **success** `#1f5d3b` / `#1f5d3b` / `#123524` (`CheckCircleOutlineRounded`); **error** `#9f2f2f` / `#9f2f2f` / `#8a2d2d` (`ErrorOutlineRounded`); **warning** `#7b6542` / `#7b6542` / `#7b6542` (`WarningAmberRounded`); **info** `#123524` / `#506552` / `#123524` (`InfoOutlined`).
  - Behavior: auto-dismiss after **20 s** (`DEFAULT_TOAST_DURATION`) or on the X button. `role="status" aria-live="polite"`.

### 6.7 Dropdown menus

Anchored `absolute right-0 top-[calc(100%+8px)] z-20 min-w-[220px]` white panel with `border-[#d8e1d4]` and dropdown shadow; closes on outside `mousedown` and Escape.

### 6.8 z-index scale

`z-20` dropdowns · `z-40` toasts · `z-50` modals & mobile drawer. Do not introduce other layers.

### 6.9 Score meter (`ScoreBar`)

For 0–100 scores (recommendation match scores, and any future normalized score), use the shared `ScoreBar` (`src/features/recommendations/components/ScoreBar.tsx`) — never a hand-rolled progress bar.

- **Segmented, not continuous:** 20 equal segments (`flex h-2 w-full gap-px`, each `flex-1`), filled left to right. This is deliberate, not a compromise — Tailwind v4 extracts classes statically, so a computed `w-[73.33%]` would never be generated, and inline `style` is reserved for `DataTable`'s sticky offsets (§1). It also reads as flat and square, in keeping with §2.
- **Tones:** filled `bg-[#1f5d3b]` (primary) or `bg-[#9caf9a]` (muted — for scores on rejected/superseded records); unfilled always `bg-[#edf3ea]`.
- **The number is the source of truth.** A meter must always sit next to its exact value rendered as text (stat-value scale, `tabular-nums`); segments round to the nearest 5% and are an at-a-glance indicator only.
- **Accessibility:** `role="progressbar"` with `aria-label`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-valuenow`, and an `aria-valuetext` carrying the precise value.
- No labels, ticks, or gradients inside the meter. Where a score needs justifying, pair it with an explainer dialog (§6.5) rather than annotating the bar.

### 6.10 Auth control radius

On the authentication pages only, text inputs and buttons carry a soft radius so the sign-in screen reads as a welcoming front door rather than an admin grid.

- **Radius:** `rounded-lg` (0.5rem). One value only — do not mix `rounded-md`/`rounded-xl`, and do not pick a radius per control.
- **Applies to:** text/email/password inputs and their password-visibility affordance, and buttons (primary submit, secondary, links styled as buttons). This includes the inverted controls in the login public column (§5.3.1).
- **Does NOT apply to:** the page/columns themselves, cards, alerts, checkboxes, the reCAPTCHA widget, or anything outside the auth pages — including the public survey and privacy notice (§5.4). Everything else stays square per §2.
- The password field's absolute visibility toggle keeps `rounded-r-lg` so it does not overhang the input's rounded corner.
- Currently adopted on: `LoginPage`. Other auth pages keep square controls until they are migrated in a later change — when they are, update this list rather than adding a second radius.

### 6.11 Split meter (`SplitMeter`)

For **part-to-whole counts** — above all the sex-disaggregated figures the GAD rule requires on every
count surface — use the shared `SplitMeter` (`src/shared/meter`). `ScoreBar` (§6.9) stays the meter
for a single 0–100 score; this one shows how a total divides.

- **Same geometry as `ScoreBar`:** 20 fixed segments (`flex h-2 w-full gap-px`, each `flex-1`), for
  the same reason — Tailwind v4 extracts classes statically, so a computed `w-[50.6%]` would never be
  generated, and inline `style` is reserved for `DataTable` (§1). Segments are allocated by
  **largest remainder**, with a floor of one segment for any non-zero part, so they always total 20
  and a small minority never rounds away to nothing.
- **Tones** are a single-hue lightness ramp, applied in this order: `primary` `#1f5d3b` →
  `muted` `#9caf9a` → `neutral` `#617462`; unfilled is `#edf3ea`. `#617462` is §3.3's muted-text
  colour used as a fill — that is its only non-text usage, and there is no fourth tone. **A split
  with more than three parts is not a meter** — use a table.
- **Why lightness and not hue:** the palette is mono-green by §3, so separation has to come from
  lightness. Measured on the adjacent pairs, the ramp gives ΔE ≈ 19.5 under protanopia, deuteranopia
  and tritanopia (target ≥ 8), so it is safe under every colour-vision deficiency. `#9caf9a` sits at
  2.33:1 against white, below the 3:1 mark for a mark carrying meaning alone — **which is why the
  legend is mandatory, not optional.** Re-measure if a tone changes.
- **The legend is always rendered** and names every part with its exact count and share. Identity is
  therefore never carried by colour alone, and the numbers — not the segments — are the source of
  truth.
- **Accessibility:** the bar is `role="img"` with an `aria-label` spelling out the whole split
  ("Respondents by sex: Female 18 (60.0%), Male 12 (40.0%)"). It is not a `progressbar` — there is no
  single value to report.
- Pass the page's own number formatter via `formatValue` so grouping matches the surrounding copy.
  Where part of the population has no split recorded, say so in text beside the meter rather than
  inventing a bucket for it.

---

## 7. Interaction & Motion

- Interactive elements use only `transition-colors` (default duration); the sidebar collapse uses `transition-[width] duration-200`; loaders use `animate-spin`/`animate-pulse`. **No hover scale/translate effects.** Static transforms on purely decorative, `aria-hidden` elements are exempt (see the login brand panel, §5.3.1) — the ban is on transforms as interaction feedback.
- **Entrance motion for overlays** is allowed via four shared utility classes defined in `globals.css` (all ease-out, 160–220 ms, both-fill, and disabled under `prefers-reduced-motion`). Do not write bespoke keyframes elsewhere — reuse these:
  - `animate-fade-in` — backdrops/overlays (modal scrim, drawer scrim).
  - `animate-pop-in` — modal panels and dropdown/popover menus (subtle fade + rise + scale).
  - `animate-slide-in-up` — toasts.
  - `animate-slide-in-right` — side drawers/panels.
  These apply on mount only (entrance); exits are immediate. No other animations.
- Every async action has all three states rendered: loading (spinner + progressive label / skeletons), error (inline alert or error toast), success (toast + data refresh).
- Search inputs debounce 350 ms and reset to page 1; filter changes reset to page 1.
- Dates render through `formatDateTime` (`Intl.DateTimeFormat 'en-US'`, e.g. "Aug 12, 2024, 08:30 AM").

---

## 8. Code Conventions

- **Structure:** feature-first — `src/features/<feature>/{api,components,lib,pages,store,types.ts,index.ts}` with public exports through `index.ts`; shared plumbing in `src/shared/`; app wiring (routes, providers, global styles) in `src/app/`. Import via the `@/` alias.
- **Naming:** components/pages `PascalCase.tsx` (pages end in `Page`, layouts in `Layout`, modals in `Modal`); lib/api/store files `camelCase.ts`.
- **Class strings:** static lists inline; conditional composition via array `.join(' ')`; repeated class sets hoisted to module-level `const` (e.g. `inputClassName`, `actionButtonClassName`). No `clsx`/`tailwind-merge`.
- **Accessibility is not optional:** labels bound with `htmlFor`/`id`, `aria-label` + `title` on icon-only buttons, `aria-pressed` on toggles, `aria-busy`/`aria-live` on loading regions, `sr-only` for visually hidden text, Escape + outside-click handling on overlays.
- Role-gate UI (`hasAnyRole`) — hide or downgrade controls the user cannot use (e.g. "Read only" chip instead of action buttons).

---

## 9. Amending This Document

If a change genuinely requires a new pattern (new color, component variant, layout type):

1. Update this document in the same PR, adding the pattern to the relevant section.
2. Keep it consistent with the existing language (flat, square, green palette, Google Sans).
3. Never fork the system — one pattern per problem.
