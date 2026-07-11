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

1. **No rounded corners.** Containers, buttons, inputs, tables, chips, and modals all have square edges. Never add `rounded-*` to them. The ONLY exceptions: `rounded-full` on avatar circles and loading spinners.
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
- Nav items: `border-l-2` accent; active = `border-[#1f5d3b] bg-[#f1f6f0] text-[#123524]`; rest = `border-transparent text-[#445846] hover:bg-[#f7faf6] hover:text-[#123524]`; disabled = `text-[#8a9989]`.
- **Header:** white, `border-b border-[#d8e1d4]`, `px-4 py-4`; left side = eyebrow breadcrumb ("Administration / Section") over the system title; right side = profile button (avatar circle `h-9 w-9 rounded-full bg-[#1f5d3b]` with initials) and mobile menu button.
- All routed pages render inside the white content panel via `<Outlet />`.

### 5.2 Page composition

- Pages return `<div className="space-y-6">`.
- Page header block: eyebrow → `h4` title (`mt-2`) → description `p` (`mt-3 max-w-3xl`), with action buttons aligned right on `xl` (`flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between`).
- Content sits in bordered white sections: `border border-[#d8e1d4] bg-white` with internal `px-5 py-4` header/footer strips separated by `border-[#e7eee3]`.
- Grids: stats `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`; two-column content `xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]`.

### 5.3 Auth pages

Centered card on the app background: `max-w-[420px] border border-[#d8e1d4] bg-white p-8 md:p-10 shadow-[0_12px_30px_rgba(18,53,36,0.05)]`, with eyebrow → title → description → form (`mt-4 space-y-5`).

### 5.4 Breakpoints

Standard Tailwind breakpoints. Conventions: `md` = sidebar/desktop-header threshold; `sm`/`lg`/`xl` for progressive grid/flex expansion; body has `min-width: 320px`. Tables never squeeze — wrap in `overflow-x-auto` with a `min-w-[1080px]` table.

---

## 6. Components

### 6.1 Buttons

All buttons: square corners, `text-sm font-medium`, `transition-colors`, `cursor-pointer`, and `disabled:cursor-not-allowed disabled:opacity-60` (icon buttons and pagination use `opacity-45`).

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

---

## 7. Interaction & Motion

- Interactive elements use only `transition-colors` (default duration); the sidebar collapse uses `transition-[width] duration-200`; loaders use `animate-spin`/`animate-pulse`. **No hover scale/translate effects.**
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
