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

There is no `tailwind.config` file (Tailwind v4). Colors and shadows are applied as **semantic token utilities** (`bg-primary`, `text-ink`, `shadow-card`) defined in `globals.css` — never as arbitrary hex values. See section 3.

Global CSS lives in `src/app/styles/globals.css` and holds exactly four things: the font import and resets; the `@theme` token block plus its `[data-theme="dark"]` counterpart (§3); the shadow and `brand-mark` utilities that must stay theme-swappable (§3.4, §3.6); and the shared overlay-entrance `@keyframes` + `animate-*` utilities (§7). Do not add component-specific CSS there.

---

## 2. Design Language

The system is a flat, softly-rounded, institutional green theme for Cavite State University – Bacoor City Campus ("Extension Projects Management System").

Core rules:

1. **Everything is rounded, on a three-step scale.** Surfaces, the blocks inset within them, and controls each take one radius — see §6.10 for the full table:
   - `rounded-lg` on **surfaces**: cards, page sections, dialogs, popovers, toasts, stat cards, the public shell header, the admin content pane.
   - `rounded-md` on **inset blocks and controls**: callouts and info panels nested inside a surface, chips, preview panes, buttons, text inputs, selects, textareas, and anything styled as one (a `<label>` acting as a file-picker button, a `<Link>` or `<a>` with button classes, bordered choice rows).
   - `rounded-lg` on the authentication screens' controls **and their inset alert boxes**, which are visually larger and read as a front door.
   - `rounded-full` on avatar circles and loading spinners.
   - **Square stays square for full-bleed chrome:** the admin sidebar, the top header bar, the mobile drawer, and full-viewport scrims have no radius — they are attached to the viewport edge, where a corner would read as a rendering fault rather than a choice.
   - **A rounded surface with edge-to-edge children needs `overflow-hidden`.** Tinted table header rows, toolbars, and `bg-row-hover` footer action strips are square and will paint over the corners otherwise. Add it to any card whose children reach its border; cards that pad their own content (`px-5 py-4`) do not need it. Do not add `overflow-hidden` to a surface containing an absolutely-positioned menu — it would clip it.
2. **Flat surfaces, 1px borders.** Depth comes from borders and the occasional soft green-tinted shadow (section 3.4) — never from gradients or heavy elevation.
3. **Light and dark, one class each.** Both themes ship. Components never carry `dark:` variants — they use semantic tokens (§3) that resolve per theme, so a component is dark-ready by construction. A color that looks wrong in dark is a token bug, not a component bug.
4. **Whitespace over dividers.** Use `space-y-*` / `gap-*` for rhythm; borders mark container boundaries and table rows.

---

## 3. Color Scheme

**Never write a raw hex in a component.** Every color is a semantic token defined in
`src/app/styles/globals.css` and used as an ordinary Tailwind utility (`bg-surface`,
`text-ink`, `border-line`). A hex typed into a class string cannot follow the theme, so it is a
defect in both themes at once — it will look right in light and wrong in dark.

Tokens are declared in `@theme`, which makes Tailwind compile `bg-surface` to
`background-color: var(--color-surface)`. The dark theme redefines those same variables under
`[data-theme="dark"]`, so one attribute on `<html>` repaints the entire app. Components carry
**one** class per color — there are no `dark:` variants in this codebase, and adding them is
the wrong fix for a color that looks wrong in dark; correct the token instead.

Opacity modifiers work as usual (`bg-ink/45`).

### 3.1 Base surfaces

| Token | Light | Dark | Usage |
|---|---|---|---|
| `app` | `#f4f7f1` | `#030705` | Page/body background |
| `surface` | `#ffffff` | `#0b1410` | Cards, sidebar, header, modals, tables |
| `surface-tint` | `#f7faf6` | `#111c16` | Table header rows, secondary button bg, disabled input bg, chips |
| `surface-alt` | `#f1f6f0` | `#152218` | Active nav item background |
| `hover-tint` | `#f6faf5` | `#131f17` | Hover of bordered/secondary buttons and menu items |
| `row-hover` | `#fbfdf9` | `#0e1712` | Table row hover, modal footer bg |
| `skeleton` | `#edf3ea` | `#18261d` | Loading placeholder bars (`animate-pulse`) |

In light mode surfaces get *darker* as they recede; in dark mode they get *lighter* as they come
forward. That inversion is deliberate — on a dark ground, elevation reads as added light.

### 3.2 Brand green

| Token | Light | Dark | Usage |
|---|---|---|---|
| `primary` | `#1f5d3b` | `#2f7a4f` | Filled surfaces: primary buttons, avatar bg, meter fill, active nav border |
| `primary-hover` | `#18492e` | `#348254` | Hover of primary buttons |
| `primary-accent` | `#1f5d3b` | `#74cf97` | The green *as ink on a surface*: link text, icons, focus borders, `accent-*` on checkboxes, spinner arc |
| `ink` | `#123524` | `#f2f8f3` | Headings, primary text |

**`primary` and `primary-accent` are the same value in light and must not be merged.** They
diverge in dark because one fills a surface and the other is read against one: `#1f5d3b` as text
on the dark surface measures 1.5:1, far below AA, while a green light enough to read as text is
too light to carry white button text. Use `primary` when the green is the background, and
`primary-accent` when the green is the thing being read.

The modal scrim (`bg-[#123524]/45`), the mobile drawer scrim (`/20`), and the login brand panel
(`bg-[#123524]`, wash `/80`) are the **only** sanctioned raw hexes in components. They are dark
in both themes by design — a scrim that lightens with the theme stops being a scrim.

### 3.3 Text

| Token | Light | Dark | Usage |
|---|---|---|---|
| `ink` | `#123524` | `#f2f8f3` | h1–h4, labels, button text on light |
| `body` | `#506552` | `#cddbd0` | Paragraphs, descriptions |
| `cell` | `#445846` | `#c3d3c7` | Table rows, nav item resting state |
| `cell-strong` | `#5d705e` | `#bccbc0` | Emphasised cell text |
| `muted` | `#617462` | `#adc0b1` | Captions, meta text, inactive chip text |
| `muted-alt` | `#6a7f6d` | `#a8bcac` | Small secondary text (e.g. role under name) |
| `muted-strong` | `#7d8d7c` | `#b3c5b6` | Secondary meta |
| `muted-soft` | `#91a091` | `#a4b8a8` | Faint helper text |
| `muted-faint` | `#7e8d7a` | `#aabfae` | Pagination ellipsis |
| `eyebrow` | `#73856f` | `#a3b8a7` | Uppercase eyebrows |
| `label` | `#6d7f6b` | `#a9bdad` | Filter/table-header labels |
| `disabled` | `#8a9989` | `#869b8a` | Disabled nav items |
| `placeholder` | `#819181` | `#96ab9a` | Input placeholders |
| `icon-muted` | `#60755f` | `#b0c6b3` | Icon-only buttons at rest |

`text-white` stays literal white: it only ever sits on `primary`/`danger` fills or the green
login panel, all of which are dark in both themes.

### 3.4 Borders & elevation

| Token | Light | Dark | Usage |
|---|---|---|---|
| `line` | `#d8e1d4` | `#28402f` | Cards, modals, sidebar, buttons, inputs at rest |
| `divider` | `#e7eee3` | `#203127` | Borders between card header/body/footer |
| `row-divider` | `#eef2eb` | `#1c2c22` | Table rows, list separators |
| `control-border` | `#cad5c7` | `#3a5c46` | Header controls, login inputs |

| Shadow | Light | Dark |
|---|---|---|
| `shadow-card` | `0 12px 30px rgba(18,53,36,0.05)` | `0 12px 30px rgba(0,0,0,0.35)` |
| `shadow-dropdown` | `0 12px 30px rgba(18,53,36,0.08)` | `0 12px 30px rgba(0,0,0,0.45)` |
| `shadow-toast` | `0 18px 40px rgba(18,53,36,0.12)` | `0 18px 40px rgba(0,0,0,0.5)` |
| `shadow-modal` | `0 28px 80px rgba(18,53,36,0.18)` | `0 28px 80px rgba(0,0,0,0.6)` |

Shadow color is green-tinted in light and black in dark — a green tint carries no depth against
a green-black ground. **The four shadow tokens are declared outside `@theme`, as plain custom
properties read back by `@utility`.** A `--shadow-*` inside `@theme` gets compiled into the
utility with its color inlined, which silently breaks per-theme overrides. Add new shadows the
same way.

### 3.5 Semantic

| Token | Light | Dark | Usage |
|---|---|---|---|
| `danger` | `#9f2f2f` | `#b04545` | Destructive button bg/border, white text |
| `danger-hover` | `#832424` | `#c25555` | Hover of destructive buttons |
| `danger-text` | `#8a2d2d` | `#f5b8b8` | Error text |
| `danger-strong` | `#b93838` | `#f8c4c4` | Inline field errors |
| `danger-border` / `-soft` / `-dashed` | `#e3c9c9` / `#ead7d7` / `#d5c4c4` | `#5c3232` / `#4f2c2c` / `#513434` | Alert, callout, dashed placeholder borders |
| `danger-bg` / `-soft` / `-faint` | `#fff5f5` / `#fff7f7` / `#fff8f8` | `#1f1414` / `#1a1010` / `#180f0f` | Alert and callout backgrounds |
| `success-border` | `#bfd3c0` | `#2e4b37` | Success chip border |
| `success-bg` | `#f3f9f2` | `#102217` | Success chip background (text is `primary-accent`) |
| `warning` | `#7b6542` | `#e3caa0` | Read-only notices |
| `info-border` / `info-bg` / `info-text` | `#c8e0ef` / `#eef8fd` / `#075274` | `#2f4a5c` / `#0e1a21` / `#b0dcf2` | Informational callouts |

### 3.6 Theming

- **Switching** is `ThemeToggle` (§6.14) writing `data-theme` to `<html>` via
  `src/shared/theme/themeStore.ts`. Preference is `system` (default), `light`, or `dark`;
  `system` keeps following the OS through a `prefers-color-scheme` listener, and any explicit
  choice persists to `localStorage` under `cems-theme`.
- **The no-flash script in `index.html` is load-bearing.** It sets `data-theme` before first
  paint; without it every load flashes white for a dark-theme user. It duplicates the storage
  key and the resolution rule from `themeStore.ts` — **change the two together.**
- **Every new text/background pairing must be contrast-checked in both themes** before it ships:
  4.5:1 for normal text, 3:1 for disabled/decorative. The current dark palette clears AA on all
  30 pairs the app actually renders. Do not lighten `primary-hover` past `#348254`, where white
  button text sits at 4.70:1.
- **The university seal needs the `brand-mark` class** wherever `/logo.png` is rendered.
  The file is an opaque palette PNG with a white backing, so on a dark surface it would be a raw
  white square; `brand-mark` turns that backing into a deliberate padded white plate in dark and
  is a no-op in light.
- **PDFs are server-generated** and rendered to a canvas by `pdfjs-dist`, so exported and printed
  documents are unaffected by the theme. The viewer *frame* around them follows the theme; the
  page itself stays white, as in any PDF reader.


## 4. Typography

- **Font:** `"Google Sans", sans-serif` everywhere. Loaded via Google Fonts `@import` in `globals.css`. Never introduce another font family (exception: `font-mono` for IDs in tables).
- **Base:** `line-height: 1.5`, `font-weight: 400`.

Scale (Tailwind classes — use exactly these combinations):

| Element | Classes |
|---|---|
| Page title (login) | `text-2xl font-semibold tracking-[-0.04em] text-ink` |
| Header title | `text-base md:text-lg font-semibold tracking-[-0.02em]` |
| Section heading (h3/h4) | `text-lg` or `text-xl` `font-semibold tracking-[-0.02em]`/`tracking-[-0.03em]` |
| Stat value | `text-3xl font-semibold tracking-[-0.03em]` |
| Eyebrow | `text-[11px] font-semibold uppercase tracking-[0.18em] text-eyebrow` |
| Field/table-header label | `text-xs font-semibold uppercase tracking-[0.12em] text-label` |
| Body copy | `text-sm leading-6 text-body` (`leading-7` for long paragraphs) |
| Meta/caption | `text-sm text-muted` or `text-xs text-muted-alt` |
| Buttons / inputs / table cells | `text-sm font-medium` (cells: no `font-medium`) |

Conventions: headings use negative tracking; all-caps labels use wide positive tracking (`0.12em`–`0.18em`). Sentence case for headings and buttons ("Create New User" style title case is allowed on primary CTAs).

---

## 5. Layout

### 5.1 App shell (`AdminLayout`)

```
┌──────────────────────────────────────────────┐
│ ┌────────┐ ┌──────────────────────────────┐  │  h-screen, overflow-hidden,
│ │Sidebar │ │ Header (white, border-b)     │  │  bg-app, text-ink,
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
- **Sidebar:** white, `border-r border-line`; width `w-[280px]`, collapsed `w-[88px]` (`transition-[width] duration-200`). Hidden below `md`; mobile uses a full-screen drawer (same 280px sidebar) over a `bg-[#123524]/20` overlay at `z-50`.
- Sidebar structure: campus logo block (logo `h-11 w-11`) → scrollable nav → bordered logout footer.
- **Collapsing hides labels, never controls.** When `collapsed`, the sidebar keeps every actionable item reachable and only drops its text: nav items and the logout button center their icon (`justify-center`, padding narrows to `px-2`/`px-3`) and move their label into a `sr-only` span, gaining `aria-label` + `title` so the icon still announces itself and shows a tooltip. Do not `hidden` a control to make it fit the 88px rail — a collapsed sidebar that drops sign-out strands the user.
- Nav items: `border-l-2` accent; active = `border-primary bg-surface-alt text-ink`; rest = `border-transparent text-cell hover:bg-surface-tint hover:text-ink`; disabled = `text-disabled`.
- **Expandable nav groups** (e.g. "Settings" holding User Management + Activity Log): a group renders a header button with the group icon, label, and a trailing `ExpandLessRounded`/`ExpandMoreRounded` chevron (chevron hidden when the sidebar is collapsed). The header carries `aria-expanded` + `aria-controls` pointing at the child container; children are ordinary nav items with the same accent/active/hover styles, indented `pl-8 pr-4 py-2.5` when expanded and centered like any other item on the 88px rail. A group defaults to open when one of its children matches the route, and an explicit toggle overrides that default. While a group is closed and holds the active route, its header takes the active style so the current section is still visible. Grouped sections sit at the bottom of the nav, below the flat items.
- **Header:** `bg-surface`, `border-b border-line`, `px-4 py-4`; left side = the sidebar collapse toggle followed by the eyebrow breadcrumb ("Administration / Section") over the system title; right side = the theme toggle (§6.14), then the profile button (a `UserAvatar`, §6.12 — photo or initials) and mobile menu button.
- **Profile menu** (§6.7 dropdown, anchored under the profile button): an identity block at the top — `UserAvatar` at `md` beside the name, email and role — then the account actions, "Profile Settings" (`ManageAccountsOutlined`, navigates to `/admin/profile`) before "Sign out" (danger hover). Navigating closes the menu.
- **Sidebar collapse toggle lives in the header, not the sidebar.** `hidden h-10 w-10 shrink-0 cursor-pointer items-center justify-center border border-control-border text-ink transition-colors hover:bg-hover-tint md:inline-flex`, with `ChevronLeftRounded` when expanded / `ChevronRightRounded` when collapsed. It sits `md:`-only (its mobile counterpart is the menu button on the right, at the same `h-10 w-10`), and carries `aria-label` + `title` plus `aria-expanded` and `aria-controls="admin-sidebar"` pointing at the `<aside>`. The title block beside it is `min-w-0` with a `truncate` heading so a narrow header shortens the title rather than displacing the toggle.
- All routed pages render inside the white content panel via `<Outlet />`.

### 5.2 Page composition

- Pages return `<div className="space-y-6">`.
- Page header block: eyebrow → `h4` title (`mt-2`) → description `p` (`mt-3 max-w-3xl`), with action buttons aligned right on `xl` (`flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between`).
- Content sits in bordered white sections: `border border-line bg-surface` with internal `px-5 py-4` header/footer strips separated by `border-divider`.
- Grids: stats `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`; two-column content `xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]`.

### 5.3 Auth pages

#### 5.3.1 Login — split screen

The login screen (`/login`) uses a **full-bleed two-column split**; it is the only screen with this layout.

```
┌────────────────────────┬────────────────────────┐
│  White form column     │  Green brand panel     │
│  bg-surface              │  campus photo + wash   │
│                        │                        │
│  logo + wordmark       │  Vision                │
│  "Sign in" h1          │  Mission               │
│  form (space-y-5)      │  Core Values (chips)   │
│                        │  Quality Policy        │
│                        │  ─── Privacy notice    │
└────────────────────────┴────────────────────────┘
   lg:grid-cols-2 · below lg the columns stack, panel second
```

- Shell: `<main className="min-h-screen bg-surface text-ink lg:grid lg:grid-cols-2">` — no page padding on the shell; each column owns its own padding. No outer card, no shadow, no border between the columns (the color change is the seam).
- **Form column:** `flex flex-col justify-center px-6 py-12 sm:px-10 lg:min-h-screen lg:px-16`, inner `mx-auto w-full max-w-[400px]`. Order: logo + wordmark block → `h1` title → description → form (`mt-8 space-y-5`).
  - Title on this screen is the short action ("Sign in"), not the system name — the system name lives in the wordmark above it.
  - `min-h-screen` is applied only from `lg`, so on phones the column sizes to its content.
- **Brand panel (`LoginBrandPanel`):** `relative flex flex-col justify-center bg-[#123524] px-6 py-12 text-white sm:px-10 lg:px-16`, inner `mx-auto w-full max-w-[400px] space-y-7 lg:mx-0 lg:max-w-lg`.
  - Carries the university's Vision, Mission, Core Values and Quality Policy, closing with a link to the public privacy notice (`/privacy`). Institutional copy is quoted verbatim from the university's published wording — do not paraphrase or "fix" it (the Quality Policy's mid-sentence capitals and its three-value list against the four Core Values are both as published).
  - **It renders at every breakpoint** and stacks below the form column on phones. It holds the only login-screen link to the privacy notice, so it must not be `hidden` at any size.
  - **The section must not clip.** `overflow-hidden` belongs on the decorative wrapper (`absolute inset-0 overflow-hidden`, `aria-hidden="true"`), never on the section — the copy is long enough to be cut off at short viewport heights otherwise.
  - Structure: heading per block is an `h2` at eyebrow scale; body `mt-2 text-sm leading-6`; Core Values render as a `ul` of chips (`inline-flex rounded-md border border-white/25 px-2.5 py-1 text-xs font-medium`), matching §6.4 chip geometry in white tints.
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

Forgot password, reset password, and change password keep the centered-card layout: `max-w-[420px] border border-line bg-surface p-8 md:p-10 shadow-card` on the `#f4f7f1` background, with eyebrow → title → description → form (`mt-4 space-y-5`).

### 5.4 Public survey layout (`/s/:token`)

The public needs-assessment form is the one screen served to **unauthenticated respondents on a phone**. It deliberately sits outside the `AdminLayout` shell and outside `RequireAuth`.

- Shell: `min-h-screen bg-app px-4 py-8`, single centered column `mx-auto w-full max-w-[640px] space-y-6`. **No sidebar, no header chrome, no profile menu.**
- A bordered white card at the top carries the campus brand block — the seal (`/logo.png`, `h-12 w-12 shrink-0 object-contain`) beside the full campus name from `CAMPUS_CONTACT.campusName` as the uppercase eyebrow, with the page subtitle beneath. The name comes from config, never a string literal, so the public pages cannot drift from the login screen. Every subsequent block (intro, demographic block, each question, privacy notice) is its own `border border-line bg-surface px-5 py-5` section.
- **Back navigation on public pages sits at the top, not the foot of the stack.** When a public page has somewhere to return to, the shell's `backTo`/`backLabel` props render it as a `border-b border-divider px-5 py-3` strip above the brand block — an `ArrowBackRounded` (`fontSize="small"`) followed by the label, in `#1f5d3b`. A visitor who has read enough should not have to scroll past the whole document to leave.
- **Touch targets are larger than in the admin UI**: body/inputs step up from `text-sm` to `text-base`, inputs use `py-3`, and radio/checkbox choices are full-width bordered rows (`flex items-center gap-3 border border-line px-4 py-3 hover:bg-hover-tint`) rather than bare inputs. The primary submit is full-width (`w-full ... py-3`).
- Rating (1–5) renders as a `grid grid-cols-5 gap-2` of toggle buttons (`rounded-md` like every other control, §6.10); the selected value is primary-filled (`border-primary bg-primary text-white`), with "1 — Very poor" / "5 — Very good" anchors beneath.
- Terminal states (closed, not found, already responded, thank-you) render as a single centered `Notice` card with an `@mui/icons-material` icon (`fontSize="large"`), title, and one explanatory paragraph — never a toast, since the respondent has no app shell to return to.
- Palette, corner treatment, and Google Sans are unchanged — this is the same design system at a larger touch scale, not a second one. Controls take the standard `rounded-md` (§6.10), including the bordered choice rows, and the cards and sections around them take the standard surface `rounded-lg`. **The auth control `rounded-lg` does not apply here.**
- The shell is the shared `PublicShell` (`src/features/public-survey/components/PublicShell.tsx`); its `subtitle` prop names the page under the campus eyebrow. Every public page reuses it rather than re-declaring the layout — currently the survey form (`/s/:token`) and the privacy notice (`/privacy`).
- **Public privacy notice (`/privacy`)** — required by §5.3 (RA 10173). Renders in `PublicShell` as a stack of `border border-line bg-surface px-5 py-5` sections, one per topic (what we collect / how we use it / who can see it / your rights / contact), with "Back to sign in" in the shell header (`backTo="/login"`) rather than a trailing card. The survey form keeps its short inline notice above the consent checkbox and links here for the long form; the two must not contradict each other — edit both together.

### 5.5 Breakpoints

Standard Tailwind breakpoints. Conventions: `md` = sidebar/desktop-header threshold; `sm`/`lg`/`xl` for progressive grid/flex expansion; body has `min-width: 320px`. Tables never squeeze — wrap in `overflow-x-auto` with a `min-w-[1080px]` table.

---

## 6. Components

### 6.1 Buttons

All buttons: `rounded-md` (`rounded-lg` on auth screens — see §6.10), `text-sm font-medium`, `transition-colors`, `cursor-pointer`, and `disabled:cursor-not-allowed disabled:opacity-60` (icon buttons and pagination use `opacity-45`). The variant tables below omit the radius class for brevity; it is required on every one of them.

| Variant | Classes |
|---|---|
| Primary | `border border-primary bg-primary px-4 py-2.5 text-white hover:bg-primary-hover` (full-width forms use `py-3`) |
| Secondary / outline | `border border-line px-4 py-2.5 text-ink hover:bg-hover-tint` |
| Tinted secondary | `border border-line bg-surface-tint px-4 py-2.5 text-ink hover:bg-row-divider` |
| Destructive | `border border-danger bg-danger px-4 py-2.5 text-white hover:bg-danger-hover` |
| Icon action (tables) | `flex h-9 w-9 items-center justify-center border border-line text-ink hover:bg-hover-tint` — destructive variant: border `#e3c9c9`, text `#9f2f2f`, hover bg `#fff7f7` |

- Loading state: swap the icon for a spinner and change the label to progressive form — "Sign in" → "Signing in...", "Delete User" → "Deleting...".
- Spinner: `h-4 w-4 animate-spin rounded-full border-2` + `border-white/35 border-t-white` on dark buttons, `border-line border-t-primary-accent` on light (h-5 w-5 for full-page loaders).
- Icon buttons must have `aria-label` and `title`.

### 6.2 Inputs & selects

- Text input: `w-full border border-control-border bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-placeholder focus:border-primary-accent disabled:cursor-not-allowed disabled:bg-surface-tint disabled:text-muted-strong` (compact filter variant: `h-10 px-3`, border `#d8e1d4`).
- Selects: same as compact input plus `cursor-pointer`.
- Corners are `rounded-md` (`rounded-lg` on auth screens) — see §6.10. The class strings above omit it for brevity; it is required.
- Focus = border color change to `#1f5d3b` only. No focus rings, no shadows.
- Labels: block label above the field, `mb-2 text-sm font-medium text-ink` (forms) or stacked `flex flex-col gap-1.5` with the uppercase `text-xs` label (filters).
- **Optional fields say so in the label** — "Middle Name (optional)", "Password (optional)" — rather than marking required ones with an asterisk. Required is the default; the exception is the thing that gets called out. Keep the client's required/optional split identical to the API's validation, and where a field is optional, submit blank as blank and let the server store it as null.
- Password fields: relative wrapper, `pr-12`, absolute right visibility-toggle button using MUI `VisibilityRounded`/`VisibilityOffRounded`.

### 6.3 Tables

- Wrapper: `overflow-x-auto`, table `min-w-[1080px] table-auto border-collapse`.
- Header row: `border-b border-divider bg-surface-tint text-left text-xs font-semibold uppercase tracking-[0.12em] text-label`, cells `px-5 py-3`. Actions column right-aligned.
- Body rows: `border-b border-row-divider text-sm text-cell last:border-b-0 hover:bg-row-hover`, cells `px-5 py-4`. IDs use `font-mono text-xs text-cell-strong`; empty values render `-`.
- Empty state: single cell `colSpan`, `px-5 py-12 text-center text-sm text-muted`.
- Loading: keep the header, render 5 skeleton rows of `h-4 animate-pulse bg-skeleton` bars, with an `aria-busy` strip above ("Loading ... records...").
- Pagination footer: "Page X of Y" left; Previous / numbered pages (ellipsis collapse) / Next right. Active page = primary-filled; buttons `px-3 py-2 min-w-10`.

**Shared `DataTable` (`src/shared/table`).** Reuse this for data grids rather than hand-rolling `<table>` markup; it renders the header/body/skeleton/empty states above and adds:
- **Frozen columns:** mark leading columns `frozen: true` with an explicit `width` (px). They stick to the left (`position: sticky`) while the rest scroll horizontally, get an opaque background that follows row hover (`group-hover`), and the last frozen column carries a `border-r border-divider` seam. Keep frozen columns to the stable identity fields (e.g. a person's name) and give them `truncate` cells. Offsets are computed via a small inline `style` (the §1 exception).
- **Row selection:** `selectable` adds a leading checkbox column + a select-all header checkbox (with indeterminate state). Checkboxes are native, styled `h-4 w-4 cursor-pointer accent-primary-accent`; disable non-selectable rows via `isRowSelectable` (e.g. the signed-in user's own row). Selection state is controlled by the page (`selectedIds` / `onSelectionChange`); clear it whenever the query (page/filter/search) changes.
- **Bulk actions:** while ≥1 row is selected, a bar renders above the table — `border-b border-divider bg-surface-tint px-5 py-3`, "N selected" on the left and the caller's action buttons (from `bulkActions(selectedIds)`) on the right. Destructive bulk actions confirm through an `AdminDialog` (§6.5) before running.
- **Column sorting:** sortable columns declare a `sortKey`; their header becomes a button with a trailing arrow icon (`ArrowUpwardRounded` / `ArrowDownwardRounded` when active in `#1f5d3b`, muted `UnfoldMoreRounded` in `#9caf9a` when inactive). The page owns sort state (`sortKey`/`sortDirection`/`onSortChange`) and toggles asc/desc on the active column. **Sort lives on the headers, not in a separate Sort/Order filter row.**
- Pagination stays **outside** the component (the page composes it below), as does the section header/filters.

### 6.4 Chips / badges

`inline-flex border px-2.5 py-1 text-xs font-medium` — neutral: `border-line bg-surface-tint text-ink`; active/success: `border-success-border bg-success-bg text-primary-accent`; inactive: neutral border/bg with `text-muted`. Status placeholders in action columns ("Protected", "Read only") use `px-3 py-2`.

**Priority chips** (need-assessment priorities, and any future four-level severity scale) use the same base classes with these tones, ordered by descending visual weight — no new colors, all four values come from §3:

| Priority | Classes |
|---|---|
| Critical | `border-danger-border bg-danger-bg text-danger-text` |
| High | `border-line bg-surface-tint text-warning` |
| Moderate | `border-success-border bg-success-bg text-primary-accent` |
| Low | `border-line bg-surface-tint text-muted` |

**Decision-status chips** (recommendation pending/accepted/modified/rejected, and any future decision state) reuse exactly these four tones — rejected takes the critical tone, modified the high tone, accepted the moderate/success tone, pending the low/neutral tone. Do not introduce a fifth colour for a status.

### 6.5 Modals — `AdminDialog`

All dialogs MUST use `src/features/users/components/AdminDialog.tsx` (or follow it exactly):

- Fixed overlay `z-50`, backdrop `bg-[#123524]/45 backdrop-blur-[1px]` rendered as a close button; Escape closes; body scroll locked while open; `role="dialog" aria-modal="true"` with `aria-labelledby`/`aria-describedby`.
- Panel: `border border-line bg-surface shadow-modal`, `max-h-[calc(100vh-3rem)]`; width via `maxWidthClassName` (`max-w-xl` confirmations, `max-w-3xl` forms).
- Structure: bordered header (title `text-lg font-semibold tracking-[-0.02em]` + description + Close button) → scrollable body `px-5 py-5 sm:px-6` → footer `border-t bg-row-hover` with buttons right-aligned (`sm:justify-end`), Cancel (secondary) before the confirming action.
- While an operation is in flight: disable close (`closeDisabled`), keep the modal open, show the button loading state.
- Destructive confirmations include a warning callout: `border border-danger-border-soft bg-danger-bg-soft px-4 py-3 text-danger-text`.
- **A photo inside a form modal** (e.g. the user's profile photo on Create/Edit User) sits in a tinted block at the top of the form — `border border-divider bg-row-hover px-4 py-4` — with a `lg` `UserAvatar` beside the same picker controls as §6.13. The picked file previews through a local object URL and is **applied as a follow-up request after the record is saved** (on create the account has to exist first). That second call must not fail the save: report it with a warning toast that says the record was saved and the photo was not.

### 6.6 Alerts & toasts

- Inline error alert: `border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-text`, placed above the form/table it concerns, with a Retry secondary button where applicable. Use inline alerts for **section-scoped** state (a failed table load, a form-field summary), not for transient action feedback.
- **Global toast (single system — `src/shared/toast`).** All transient notifications go through the shared toast, never a per-page toast. Push from anywhere with `notify.success | error | warning | info(message, duration?)`; the `ToastViewport` is mounted once at the app root.
  - Placement: fixed stack, bottom-right — `inset-x-4 bottom-6 z-40 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6`; container is `pointer-events-none`, each toast `pointer-events-auto`. Newest sits nearest the corner; multiple stack.
  - Card: `w-full max-w-sm border border-line bg-surface` + toast shadow, inner `flex items-start gap-3 border-l-4 px-4 py-3` — a leading `@mui/icons-material` icon (`fontSize="small"`), the `flex-1 text-sm leading-6` message, then a trailing `Dismiss` icon button (`CloseRounded`, `aria-label`+`title`).
  - Tones (left accent / icon / text): **success** `#1f5d3b` / `#1f5d3b` / `#123524` (`CheckCircleOutlineRounded`); **error** `#9f2f2f` / `#9f2f2f` / `#8a2d2d` (`ErrorOutlineRounded`); **warning** `#7b6542` / `#7b6542` / `#7b6542` (`WarningAmberRounded`); **info** `#123524` / `#506552` / `#123524` (`InfoOutlined`).
  - Behavior: auto-dismiss after **20 s** (`DEFAULT_TOAST_DURATION`) or on the X button. `role="status" aria-live="polite"`.

### 6.7 Dropdown menus

Anchored `absolute right-0 top-[calc(100%+8px)] z-20 min-w-[220px]` white panel with `border-line` and dropdown shadow; closes on outside `mousedown` and Escape.

### 6.8 z-index scale

`z-20` dropdowns · `z-40` toasts · `z-50` modals & mobile drawer. Do not introduce other layers.

### 6.9 Score meter (`ScoreBar`)

For 0–100 scores (recommendation match scores, and any future normalized score), use the shared `ScoreBar` (`src/features/recommendations/components/ScoreBar.tsx`) — never a hand-rolled progress bar.

- **Segmented, not continuous:** 20 equal segments (`flex h-2 w-full gap-px`, each `flex-1`), filled left to right. This is deliberate, not a compromise — Tailwind v4 extracts classes statically, so a computed `w-[73.33%]` would never be generated, and inline `style` is reserved for `DataTable`'s sticky offsets (§1). Segments stay square — they are hairline marks, not surfaces (§6.10).
- **Tones:** filled `bg-primary` (primary) or `bg-meter-muted` (muted — for scores on rejected/superseded records); unfilled always `bg-skeleton`.
- **The number is the source of truth.** A meter must always sit next to its exact value rendered as text (stat-value scale, `tabular-nums`); segments round to the nearest 5% and are an at-a-glance indicator only.
- **Accessibility:** `role="progressbar"` with `aria-label`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-valuenow`, and an `aria-valuetext` carrying the precise value.
- No labels, ticks, or gradients inside the meter. Where a score needs justifying, pair it with an explainer dialog (§6.5) rather than annotating the bar.

### 6.10 Radius scale

Radius is chosen by an element's **role**, not by taste, and never per instance. Three steps:

| Role | Radius | Examples |
|---|---|---|
| Surface — a card the layout stacks | `rounded-lg` | page sections, stat cards, `AdminDialog`, toasts, the profile menu popover, `AuthCard`, `PublicShell`'s header, the admin content pane |
| Inset block — a bordered box *inside* a surface | `rounded-md` | callouts and info panels, chips (§6.4), the print-preview pane, scrollable sub-lists |
| Control | `rounded-md` | `<button>`, text/email/password/tel/number/date inputs, `<select>`, `<textarea>`, and anything reading as one — a `<label>` carrying button classes over a hidden file input (§6.13), a `<Link>`/`<a>` styled as a button, the bordered choice rows on the public survey (§5.4) |

- **Authentication pages step up one:** on `LoginPage`, forgot/reset/change password, and the inverted controls in the login public column (§5.3.1), controls *and* inset alert boxes take `rounded-lg` so they agree with the larger front-door scale. The `AuthCard` surface is `rounded-lg` like every other surface.
- **No radius at all on:** the sidebar, top header bar, mobile drawer, full-screen scrims rendered as `<button>` (the modal backdrop, the drawer overlay), native checkboxes and radios, the reCAPTCHA widget, and `SplitMeter` segments (§6.11) — full-bleed chrome and hairline segments read wrong with corners.
- **Surfaces whose children reach the edge carry `overflow-hidden`** (§2) so tinted table headers, toolbars, and footer action strips are clipped to the corner instead of painting over it.
- **A control inside another control matches its neighbour's corner, not its own:** the password field's absolute visibility toggle takes `rounded-r-md` (`rounded-r-lg` on auth pages) so it follows the input's right corners instead of overhanging them.
- **One radius per element.** When a control's classes come from a hoisted const, the radius lives in the const — do not add a second one at the call site (`rounded-lg` + `rounded-md` on one element is a bug; which wins depends on CSS order, not class order).
- Buttons with no border or background of their own (a sortable table header, an icon-only dismiss) still carry the radius so a hover surface added later lands correctly.

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

### 6.12 User avatar (`UserAvatar`)

A person is pictured one way everywhere: the shared `UserAvatar`
(`src/features/auth/components/UserAvatar.tsx`). Never hand-roll an initials circle.

- **Photo or initials, same circle.** With a photo it renders `<img class="h-full w-full object-cover">`; without one it renders the initials on `bg-primary` in white `font-semibold`. Both go in the same `rounded-full overflow-hidden` box, so the two are interchangeable in any slot and a missing photo never changes the layout. This and spinners are the only `rounded-full` in the system (§2).
- **Sizes** are fixed by the component — `sm` `h-9 w-9 text-sm` (header profile button), `md` `h-10 w-10 text-sm` (profile menu, mobile header trigger), `lg` `h-20 w-20 text-2xl` (Profile Settings). Do not pass ad-hoc size classes.
- **Initials come from `getUserInitials`** (first + last initial, falling back to the email) — the same helper the rest of the app uses.
- **The photo is fetched, not linked.** Avatar bytes sit behind the bearer token like every other upload, so the auth store fetches the blob once per session and keeps an object URL in `avatarUrl`; components take that URL as a prop. The store revokes the previous URL on every replacement and on sign-out. A failed fetch is not a session error — it falls back to initials silently.
- `alt` is `"{name} profile photo"`; the initials fallback needs no extra ARIA (the name is rendered beside it in every current use).

### 6.13 Settings pages

Self-service and configuration screens (currently Profile Settings, `/admin/profile`) follow §5.2 page composition with one addition: **one bordered white `<section>` per concern**, each with a `border-b border-divider px-5 py-4` header (title at `text-lg font-semibold tracking-[-0.02em]` + one-line description), a `px-5 py-5` body, and — where the section is a form — a right-aligned action strip `border-t border-divider bg-row-hover px-5 py-4` holding its single primary button.

- **Each section saves independently.** Its own submit, its own loading state, its own inline error alert (§6.6) above the fields, and a success toast on completion. Never a single page-wide Save that spans unrelated concerns.
- **Fields the user may not edit are shown, disabled, and explained** — e.g. the email on Profile Settings renders `disabled readOnly` with a `text-xs text-warning` note saying who can change it. Do not hide them.
- **File pickers:** the `<input type="file">` is `sr-only` and its `<label htmlFor>` carries the button classes (§6.1 secondary); the label takes `pointer-events-none opacity-60` while the upload is in flight. Clear `event.target.value` after reading the file so re-picking the same file still fires. Validate type and size client-side against the same limits the API enforces, and show the failure in the section's alert.

### 6.14 Theme toggle (`ThemeToggle`)

`src/shared/theme/ThemeToggle.tsx` — the light/dark switch, rendered in the admin header to the
left of the profile button (§5.2).

- Geometry matches every other header control: `h-10 w-10`, `rounded-md text-ink
  hover:bg-hover-tint`, icon at `fontSize="small"`. Borderless — it reads as an icon action next
  to the profile button, not as a bordered control like the sidebar collapse toggle.
- **The icon shows the theme it switches *to*** — `DarkModeRounded` while light, `LightModeRounded`
  while dark — with `aria-label`/`title` spelling out the action ("Switch to dark theme") and
  `aria-pressed` reflecting whether dark is active.
- It reads and writes `useThemeStore` only. It does not restyle anything itself; the whole repaint
  is the `data-theme` attribute swapping token values (§3.6).
- One toggle, one place. Do not add a second switch to public pages — those follow the stored
  preference (or the OS) already, and a respondent has no session to persist a choice into.

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
2. Keep it consistent with the existing language (flat surfaces on the §6.10 radius scale, green palette, Google Sans).
3. Never fork the system — one pattern per problem.
