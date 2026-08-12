# Waylo Design System

> Living design source of truth for the Waylo Telegram Mini App. Update this file when a visual rule, shared component, or primary navigation pattern changes.

**Last updated:** 2026-08-12  
**Product:** Mobile-first shared trip planner  
**Primary surface:** Telegram Mini App on iOS, Android, and Desktop  
**Design direction:** Playful, calm, compact, and travel-focused

## 1. Product experience

Waylo helps friends, couples, and small groups turn an idea into a shared trip. A user should be able to create or join a trip, plan each day, find places, see the route, prepare a budget, pack, and preserve memories without feeling like they are operating project-management software.

### Experience principles

1. **The trip comes first.** Destination, dates, itinerary progress, and the next action receive the strongest hierarchy. Weather, budget, packing, and collaboration support the trip rather than dominating the screen.
2. **Playful, not childish.** Rounded forms, friendly type, illustration, and gentle motion give Waylo warmth. Layout, contrast, and interaction remain precise.
3. **One clear primary action.** A screen should not present several equally prominent green buttons. Use hierarchy: primary, secondary outline, then quiet icon action.
4. **Shared state is visible.** Members, live editing, read-only access, budget balances, and room status should be understandable without explanation.
5. **Progress feels encouraging.** Use completion meters, upcoming-trip messages, compact checklists, and celebration states. Avoid guilt-heavy or alarming language.
6. **Mobile behavior is the reference.** Desktop centers the mobile shell; it does not become a stretched dashboard.

## 2. Brand personality

Waylo should feel like an optimistic travel companion: friendly, curious, reliable, and lightly adventurous.

Use short, conversational language:

- “Start planning”
- “2 days still need plans”
- “Siem Reap is almost here”
- “Ready for the adventure?”

Avoid corporate language, technical backend terms, or instructions that blame the user. Translate errors into a clear next step.

### Visual signature

- Waylo green as the single primary accent
- Playful rounded display type
- Warm neutral light theme and quiet charcoal dark theme
- Glass used selectively for floating controls and navigation
- Soft travel illustration around the edges, with a readable center
- Rounded outline SVG icons for interface actions
- Category emoji or small image markers only where they carry content meaning

## 3. Design tokens

Tokens are defined in `src/styles/theme.css`. Components must use CSS variables instead of hard-coded light or dark theme colors.

### Core color tokens

| Token | Dark | Light | Purpose |
|---|---:|---:|---|
| `--bg` | `#0F0F0F` | `#F7F5F0` | App canvas |
| `--card` | `#1C1C1C` | `#FFFFFF` | Cards, inputs, sheets |
| `--card-hover` | `#242424` | `#EFEDE6` | Quiet controls and hover/selected wells |
| `--heading` | `#FFFFFF` | `#090908` | Headings and highest-emphasis data |
| `--text` | `#F2F2F0` | `#1A1A18` | Main body text |
| `--text-secondary` | `#9A9A96` | `#5C5C57` | Supporting copy |
| `--text-muted` | `#6B6B68` | `#8C8C86` | Labels and metadata |
| `--border` | `#2E2E2B` | `#E2E0D6` | Dividers and control borders |
| `--accent` | `#2ECC71` | `#2ECC71` | Primary actions and active state |
| `--danger` | `#E2504A` | `#E2504A` | Destructive actions and critical errors |
| `--header-bg` | `#1C1C1C` | `#F5F4EF` | Sticky app header |

### Glass tokens

Use `--glass-bg`, `--glass-border`, `--glass-shadow`, and `--glass-active-text`. Glass is appropriate for the bottom navigation, theme/language controls, map overlays, and transient floating controls. Do not place every card on glass.

### Semantic color rules

- Green means primary, active, ready, successful, or on track.
- Amber means coming soon or needs preparation.
- Red means destructive, failed, or urgent. Do not use it only for decoration.
- Blue and teal may support weather and map information, but must not compete with Waylo green.
- Never communicate a state by color alone; pair it with text or an icon.

## 4. Typography

All UI reads from `--font-display`.

- English: **Baloo 2**
- Khmer: **Kantumruy Pro**
- Fallback: `sans-serif`

The Khmer font switch is controlled by `body[data-language="km"]`. Do not hard-code Baloo 2 inside components.

| Role | Size | Weight | Guidance |
|---|---:|---:|---|
| Display / greeting | 28px | 800 | One main message per screen |
| Screen title | 22–23px | 800 | Destination or task title |
| Card title | 16–18px | 700–800 | Keep to one or two lines |
| Body | 15–16px | 500–600 | Primary readable content |
| Control label | 13–16px | 700 | Buttons, tabs, filters |
| Metadata | 12–13px | 600 | Dates, counts, status |
| Micro label | 9–11px | 700–800 | Short uppercase labels only |

Use sentence case. Reserve uppercase for compact code labels or tiny status metadata. Use `font-variant-numeric: tabular-nums` for dates, codes, temperatures, and money.

## 5. Layout and spacing

### App shell

- Maximum content width: **420px**
- Minimum height: full viewport
- Desktop: center the 420px app shell on the page
- Standard screen padding: **24px**
- Map: may fill the available app viewport beneath the header
- Bottom content padding must include `--bottom-nav-height` and `env(safe-area-inset-bottom)`
- Header and bottom navigation must respect Telegram and device safe areas

Recommended spacing scale: **4, 6, 8, 10, 12, 14, 16, 20, 24, 32px**. Prefer these values to isolated one-off gaps.

### Responsive checkpoints

Test at these viewport widths:

- 320px: narrow Android / embedded browser
- 350–360px: compact Telegram WebView
- 375–390px: common iPhone sizes
- 420px: maximum app shell
- Desktop: centered shell, no horizontal expansion

At widths below 350px, reduce internal gaps and control widths before shrinking readable text. Labels must never be clipped into ambiguous abbreviations.

### Radius scale

| Radius | Use |
|---:|---|
| 10px | Standard fields and full-width buttons |
| 14px | Date fields and compact controls |
| 16–18px | Standard cards and panels |
| 20–24px | Feature cards, sheets, and large media |
| 999px | Pills, avatars, segmented controls, floating navigation |

### Elevation

Use borders first, then soft shadows. Waylo should not look like a stack of floating admin panels.

- Standard card: 1px `--border`, little or no shadow
- Floating control: soft green-tinted or neutral shadow
- Bottom sheet: stronger top separation and backdrop
- Glass control: blur plus a subtle inner highlight

## 6. App shell and navigation

### Header

The shared header contains:

- Waylo logo on the left
- One theme icon button
- One language flag button

The header is compact, sticky where appropriate, and visually attached to the top. Theme and language controls are icon-only, circular, and must include accessible labels.

Do not add screen-specific actions to the global header. Put those in the screen header or content area.

### Bottom navigation

The bottom navigation is a floating glass pill. Primary destinations are:

- Home
- Itinerary
- Map
- Profile

Behavior:

- Inactive items are circular icon buttons.
- The active item expands and reveals its full text label.
- The pill must not change total width when the selected tab changes.
- Active color is the Waylo green gradient with dark text.
- Use smooth width and label transitions; honor reduced motion.
- Pushed/detail screens hide the bottom navigation and provide a consistent back control.

### Trip-level navigation

Destination, Itinerary, and Budget are peer tabs in `TripSummaryHeader`, not separate navigation stacks. Use the shared pill-style segmented control and keep title, dates, and member count above it.

Do not introduce a second “Plan” concept that duplicates Itinerary.

## 7. Background and illustration

`AnimatedTravelBackground` is environmental, not content.

- Keep the center 65–70% quiet and readable.
- Decorative hills, plants, clouds, contours, and travel icons stay near edges.
- Do not restore location pins, dotted routes, or dense map lines to the decorative background.
- Light theme uses warm off-white, pale mint/sage, and soft peach.
- Dark theme uses midnight navy, forest teal, muted violet, and low-opacity contours.
- Bottom hills visually meet the bottom navigation area without obscuring controls.

Ambient motion must be subtle: slow cloud drift, leaf sway, and extremely light parallax. No camera motion, shaking, or distracting loops.

## 8. Component standards

### Buttons

1. **Primary:** solid `--accent`, dark text, bold label.
2. **Secondary:** transparent/card background with `--border` or accent stroke.
3. **Danger:** `--danger`, white text; only after clear destructive intent.
4. **Icon:** circular, usually 40px visual size with at least a 44px interactive target.

Rules:

- Button labels are bold and use verbs.
- Adjacent buttons share height, radius, icon scale, and baseline.
- Do not pair one soft-filled icon button with one stark outline button unless hierarchy requires it.
- Disabled buttons retain readable labels and do not rely only on low opacity.
- All icon-only buttons require `aria-label`.

### Cards

Cards should answer one question. Recommended anatomy:

1. Short title or primary number
2. One line of metadata
3. Optional progress/state
4. Optional single action or chevron

Avoid large explanatory paragraphs inside recurring cards. If users primarily need a money value, date, status, or count, make that data the focal point.

### Forms

- Default field text: 16px to avoid iOS zoom
- Minimum field height: 44px; shared date trigger is 50px
- Labels sit above controls
- Focus uses an accent outline and 1px offset
- Dates use `DatePickerField` and the Waylo bottom-sheet calendar pattern
- Time entry should scroll into view when the mobile keyboard opens
- Validation appears close to the field and explains how to recover
- Optional Google Maps links are supporting input, never the only way to add a place

### Segmented controls and day tabs

- Use a neutral pill well and a clear selected surface
- Text is 13–15px, 700 weight; avoid oversized heavy labels
- Tabs scroll horizontally when days do not fit
- Preserve at least part of the next item only when it intentionally signals horizontal scrolling

### Bottom sheets and modals

- Use a dim backdrop and a rounded white/dark card anchored to the bottom
- Keep the title and action area visible above the keyboard
- Primary action on the right, cancel on the left for two-action confirmations
- Destructive action uses red and specific wording
- Do not stack persistent alerts beneath modal content; use field errors or a top toast

### Toasts

- Position at the top center, above the sticky header and all normal content
- Use a compact icon plus a short message such as “Copied”
- Dismiss automatically after about 2 seconds
- Avoid duplicate success text beneath the original control

### Avatars and members

- Member previews use circular avatars, Instagram-style
- Show each avatar separately; do not overlap unless space is genuinely constrained
- Default size: 36–44px depending on context
- Clicking the member group opens the complete member list
- Profile images should use `object-fit: cover`; initials are the fallback
- A member who leaves or deletes a joined trip must disappear from the trip member list

### Icons and emoji

- Interface icons: editable outline SVG, rounded line caps/joins, approximately 1.8–2.4px stroke
- Use one coherent family and optical size
- Emoji/images: packing categories, itinerary categories, and map stop markers only
- Map stop markers show the selected category emoji/image without an extra generic user circle
- The green circular live-location marker is reserved for a live user position

### Images

- Use `object-fit: cover` for hero and category cards
- Keep subject placement readable after a mobile crop
- Add a subtle dark gradient behind white text on photos
- Keep card image radius consistent with the container
- Do not add decorative shadows or stacked-card effects unless the interaction represents an actual stack

## 9. Screen hierarchy

### Home

When a trip exists:

1. Greeting and trip headline
2. Compact weather action
3. Active trip overview with date, member count, budget, and itinerary progress
4. “Needs your attention” actions
5. Discover gallery
6. My trips
7. Memories
8. Start another trip

Weather is a compact supporting control on Home. Tapping it may open the detailed Weather screen, but the Home layout must remain focused on trip planning.

When no trip exists, lead with the greeting, inspiration gallery, and trip creation form/action.

### Itinerary

1. Trip summary and peer tabs
2. Invite and packing actions
3. Collaboration/presence state when active
4. Planning progress
5. Horizontally scrollable day tabs
6. Date and timeline
7. Add activity or read-only empty state

Timeline cards must share icon, title, note, and time alignment. Drag/reorder affordances must not appear in read-only mode.

### Map

- The map fills the usable screen beneath the header and behind floating controls.
- Search begins as one icon and expands smoothly from right to left into a compact input.
- Suggestions update while typing and correspond to real map coordinates.
- Selecting a result moves the map and reveals a compact place action/gallery.
- Live location requires explicit consent before tracking begins.
- The map must remain usable if location access is denied.
- Avoid permanent instructional banners over the map.

### Budget

Prioritize numbers and decisions:

1. Target budget, planned amount, and remaining/over amount
2. Category breakdown
3. Add expense
4. Member balances and settlement guidance

Explanatory copy should be short. Use tabular numerals and never hide currency.

### Profile

Use a simple identity summary, language/theme preferences where applicable, data controls, and safe destructive actions. The global header may be omitted when the Profile screen supplies its own structure.

### Memories and recap

Media is the focal point. Use smaller horizontal scrolling cards on Home and larger grids/details after navigation. Preserve readable titles and time metadata over image crops.

### Detail and utility screens

My Trips, Trip Details, Documents, Templates, Budget Tracker, Photos, and Recap are pushed screens. They use the shared friendly circular back button and hide the floating bottom navigation.

## 10. States and feedback

Every major surface must account for:

- Loading
- Empty
- Success
- Recoverable error
- Offline/unavailable service
- Disabled/read-only
- Permission denied
- No active trip

### Trip timing

- Upcoming soon: compact amber preparation tag
- Starts tomorrow/today: stronger warm alert, still friendly
- Ongoing: green active state
- Past: quiet neutral state with recap action

### Weather

Weather uses live Open-Meteo data and may represent sunny, partly cloudy, cloudy, fog, rain, snow, thunderstorm, hot, cold, or windy conditions. Visual treatment may change with condition, but card structure and size stay consistent.

Weather failures should not block trip content. Hide the compact reading or show a quiet retry state.

### Success

Trip creation uses a celebratory overlay with concise congratulations and a clear next action. The celebration may be playful, but it must not delay navigation or trap the user.

### Error language

Prefer:

- “Search is unavailable right now. Try again.”
- “We couldn’t find that place. Try another name.”

Avoid exposing Redis, D1, API, Worker, HTTP, or provider-specific terminology in user-facing messages.

## 11. Motion

| Motion | Duration | Easing |
|---|---:|---|
| Tap/press feedback | 120–180ms | ease-out or spring |
| Hover/focus surface | 160–220ms | ease |
| Tab/nav morph | 320–420ms | `cubic-bezier(.2,.8,.2,1)` |
| Sheet/modal | 240–360ms | ease-out |
| Toast | 180–240ms in, 140–200ms out | ease-out |
| Ambient background | 5–8s loop | smooth in-out |
| Theme sky arc | about 3.2s | smooth continuous arc |

Motion rules:

- Animate opacity and transform before layout properties when possible.
- Navigation may morph width, but the containing pill must remain stable.
- Do not pause the sun/moon at the center.
- Avoid triangular or angular motion paths for celestial animation.
- Disable non-essential animation under `prefers-reduced-motion: reduce`.

## 12. Accessibility and platform behavior

- Target WCAG AA contrast for text and controls.
- Maintain a minimum 44×44px interactive hit area.
- Use visible `:focus-visible` states.
- Support keyboard Enter/Space on card-like buttons.
- Do not use placeholder text as the only label.
- Set `aria-current`, `aria-selected`, `role="status"`, and modal semantics where appropriate.
- Decorative SVGs use `aria-hidden="true"`; meaningful images have alt text.
- Keep essential text at 13px or larger; micro labels must be short and high contrast.
- Inputs and textareas remain selectable even when app content protection is active.
- Account for iOS keyboard, Android Telegram WebView, Desktop Telegram, safe-area insets, and dynamic viewport height.
- Location tracking requires clear consent, a visible active state, and a way to stop.

## 13. Localization

English and Khmer are first-class layouts.

- All visible strings require English and Khmer variants.
- Never use Telegram `username` when the requested identity is the Telegram shown/display name.
- Expect Khmer labels to have different width and line-height than English.
- Controls should grow or wrap gracefully; do not shorten Khmer into unclear text.
- Date, currency, pluralization, and day-count formatting should use shared helpers.
- Flag controls use accessible SVG representations for English/USA and Khmer/Cambodia.

## 14. Implementation rules

### CSS

- Import screen/component styles through `src/styles/index.css`.
- Use theme variables from `theme.css`.
- Scope new styles to a feature prefix to avoid collisions.
- Prefer CSS classes over repeated inline styles.
- Add dark-theme overrides only when tokens cannot express the difference.
- Include reduced-motion behavior for meaningful animations.

### Important structural constraint

Top-level views use `<section className="active">`, and global CSS hides ordinary `section` elements by default. Do **not** use nested `<section>` elements as generic cards or content groups unless their display behavior is explicitly overridden. Prefer semantic `<div>`, `<article>`, or a scoped class.

### React

- Reuse shared components before creating another visual variant.
- Keep visual state driven by `AppContext` and domain hooks rather than direct DOM mutation.
- Use native buttons for actions; do not make clickable `<div>` elements without complete keyboard behavior.
- Keep remote API failure isolated so one service cannot blank the main trip experience.
- Preserve read-only behavior for joined/shared trips.

## 15. File map

| Area | Location |
|---|---|
| Global tokens and theme motion | `src/styles/theme.css` |
| Base type, forms, buttons, shared headers | `src/styles/base.css` |
| Floating navigation | `src/styles/nav.css` |
| Animated travel background | `src/styles/travel-background.css` |
| Home and dashboard | `src/components/home/`, `src/styles/home.css` |
| Compact/detailed weather | `src/components/shared/WeatherIcon.tsx`, `src/styles/weather-alert.css`, `src/views/WeatherView.tsx` |
| Itinerary and timeline | `src/views/ItineraryView.tsx`, `src/styles/itinerary.css` |
| Map | `src/views/MapView.tsx`, `src/styles/map.css` |
| Budget | `src/views/BudgetView.tsx`, `src/styles/budget.css` |
| Shared trip controls | `src/components/shared/TripSummaryHeader.tsx`, `TripInviteButton.tsx`, `TripMembers.tsx` |
| Bottom sheets and dialogs | `src/components/modals/`, `src/styles/modals.css` |
| Navigation and view routing | `src/App.tsx`, `src/components/nav/BottomNav.tsx` |

## 16. Design QA checklist

Before shipping a UI change, verify:

- [ ] Trip planning remains the strongest hierarchy.
- [ ] The screen works in light and dark themes.
- [ ] English and Khmer both fit without clipping.
- [ ] 320px, 360px, 390px, and 420px layouts are usable.
- [ ] iOS and Android keyboards do not hide the active field/action.
- [ ] Telegram safe areas and bottom navigation padding are respected.
- [ ] Tap targets are at least 44px.
- [ ] Icon style, button height, radius, and text weight match neighboring components.
- [ ] Loading, empty, error, disabled, and read-only states are covered.
- [ ] Focus states and accessible names are present.
- [ ] Motion is smooth and reduced-motion safe.
- [ ] No decorative element blocks the central content area.
- [ ] No backend/provider terminology is exposed to users.
- [ ] No nested generic `<section>` is accidentally hidden by global CSS.
- [ ] `npm run build` passes before deployment.

## 17. Change workflow

For visual work:

1. Reuse tokens and shared components.
2. Test the smallest viewport first.
3. Check both themes and both languages.
4. Run `npm run build`.
5. Review the changed files with `git diff`.
6. Commit and push manually when ready.

Cloudflare deployment behavior depends on the repository integration. A manual deployment remains available through `npm run deploy`.
