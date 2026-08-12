# Waylo Figma End-to-End Design Specification

> Figma production plan for designing, prototyping, reviewing, and handing off the complete Waylo Telegram Mini App. Use this together with `DESIGN.md`, which remains the visual and implementation source of truth.

**Status:** Ready for Figma production  
**Last updated:** 2026-08-12  
**Reference viewport:** 390 × 844px  
**Supported app width:** 320–420px  
**Themes:** Light and dark  
**Languages:** English and Khmer

## 1. Figma project objective

Create a complete, clickable Waylo design that covers the real trip-planning journey from first launch through post-trip memories. The Figma file must be usable for:

- Product and visual review
- English and Khmer layout validation
- Light and dark theme review
- Telegram Mini App interaction testing
- Developer handoff to the existing React/Vite application
- Component reuse for future screens

The design must feel like a friendly shared travel companion, not a generic dashboard or booking site.

## 2. Product promise

Waylo helps a traveler and their friends:

1. Create or join a trip
2. Add destinations and daily stops
3. Search and review places on a map
4. Coordinate members and packing
5. Plan and settle a shared budget
6. Check useful weather conditions
7. Save trip memories and view a recap

### Primary design principle

**The trip is always the hero.** Weather, packing, collaboration, budget, and memories support the current trip. They should never overpower the destination, dates, plan, or next action.

### Waylo signature

The distinctive element is a calm, edge-based travel atmosphere: layered hills, plants, soft topographic traces, and gentle theme transitions that surround a quiet central content lane. This signature should appear consistently without becoming a wallpaper pattern or reducing readability.

## 3. Figma file architecture

Create one Figma design file named:

`Waylo — Product Design System & App Flows`

Use the following pages in this exact order:

| Page | Purpose |
|---|---|
| `00 · Cover` | Product title, file status, owner, version, links |
| `01 · Foundations` | Variables, colors, type, spacing, radius, grid, effects, icon rules |
| `02 · Components` | Production components and complete variants |
| `03 · Patterns` | Reusable compositions such as headers, sheets, empty states, timelines |
| `04 · Flows · Create & Join` | First launch, create trip, join room, success |
| `05 · Flows · Plan` | Itinerary, add stop, packing, collaboration, edit dates |
| `06 · Flows · Map` | Map search, results, place preview, live location consent |
| `07 · Flows · Budget` | Budget setup, expenses, member balances, settlement |
| `08 · Flows · Trips & Memories` | My Trips, details, documents, templates, memories, recap |
| `09 · Flows · Profile & Settings` | Profile, language, theme, clear data, leave trip |
| `10 · Prototype` | Connected presentation-ready journeys |
| `11 · Responsive QA` | 320, 360, 390, 420, Khmer, dark mode, keyboard states |
| `12 · Handoff` | Redlines, behavior notes, assets, code mapping, release checklist |
| `99 · Archive` | Deprecated explorations; never mix with approved components |

### Section organization

On each page, use Figma sections with this naming pattern:

`[Flow number] · [Step] · [State]`

Examples:

- `C01 · Home · No trip`
- `C04 · Create trip · Dates selected`
- `P06 · Itinerary · Day with stops`
- `M03 · Search · Suggestions loading`
- `B05 · Budget · Expense saved`

## 4. Frame system

### Production frames

| Frame | Size | Use |
|---|---:|---|
| `Mobile / Reference` | 390 × 844 | Primary design and prototype |
| `Mobile / Compact` | 360 × 800 | Android and smaller Telegram WebView |
| `Mobile / Narrow QA` | 320 × 720 | Stress test only |
| `Mobile / Max` | 420 × 900 | Maximum application shell |
| `Desktop / Telegram preview` | 1440 × 1024 | Centered 420px app shell presentation |

The app UI begins at the WebView content boundary. Do not permanently draw Telegram’s native top bar inside production components. A separate presentation frame may show Telegram chrome for context.

### Layout grid

Apply this grid to mobile content frames:

- Columns: 4
- Type: Stretch
- Margin: 24px
- Gutter: 12px

Map frames may use zero content margin for the map canvas, while floating controls align to the 16px or 24px content edge.

### Safe areas

Create visible but non-exporting guides for:

- Top device/Telegram safe area
- Sticky Waylo header
- Dynamic keyboard boundary
- Bottom navigation and `safe-area-inset-bottom`

Do not place required actions below the keyboard boundary in form prototypes.

## 5. Figma variables

Use variables instead of manually restyling theme variants.

### Collection: `Waylo / Color`

Modes: `Light`, `Dark`

| Variable | Light | Dark |
|---|---:|---:|
| `color/bg/base` | `#F7F5F0` | `#0F0F0F` |
| `color/surface/card` | `#FFFFFF` | `#1C1C1C` |
| `color/surface/quiet` | `#EFEDE6` | `#242424` |
| `color/surface/header` | `#F5F4EF` | `#1C1C1C` |
| `color/text/heading` | `#090908` | `#FFFFFF` |
| `color/text/body` | `#1A1A18` | `#F2F2F0` |
| `color/text/secondary` | `#5C5C57` | `#9A9A96` |
| `color/text/muted` | `#8C8C86` | `#6B6B68` |
| `color/border/default` | `#E2E0D6` | `#2E2E2B` |
| `color/action/primary` | `#2ECC71` | `#2ECC71` |
| `color/action/on-primary` | `#071A0F` | `#071A0F` |
| `color/status/danger` | `#E2504A` | `#E2504A` |
| `color/status/warning` | `#F0A545` | `#F0A545` |
| `color/status/info` | `#4E9BD8` | `#68AFE4` |
| `color/status/success-soft` | `#EAF9F0` | `#183526` |
| `color/overlay/scrim` | `rgba(9,9,8,.45)` | `rgba(0,0,0,.62)` |

Create additional glass variables matching `--glass-bg`, `--glass-border`, `--glass-shadow`, and `--glass-active-text` from the application.

### Collection: `Waylo / Number`

| Group | Variables |
|---|---|
| Spacing | `space/4`, `6`, `8`, `10`, `12`, `14`, `16`, `20`, `24`, `32` |
| Radius | `radius/10`, `14`, `16`, `18`, `20`, `24`, `pill` |
| Control | `control/min-hit = 44`, `control/icon = 40`, `control/field = 50` |
| Layout | `layout/screen-padding = 24`, `layout/app-max = 420` |
| Stroke | `stroke/icon = 2`, `stroke/border = 1` |

### Collection: `Waylo / Motion`

Record motion values as documentation variables:

- `motion/press = 160ms`
- `motion/control = 200ms`
- `motion/sheet = 320ms`
- `motion/nav-morph = 400ms`
- `motion/ambient = 6000ms`
- `motion/ease-standard = cubic-bezier(.2,.8,.2,1)`
- `motion/ease-spring = cubic-bezier(.34,1.56,.64,1)`

### Collection: `Waylo / Locale`

Modes: `EN`, `KM`

Use string variables only for recurring shared labels such as Home, Itinerary, Map, Profile, Budget, Cancel, Save, Add activity, Invite friend, and Join room. Long content and error text should stay editable in the individual flow frames so wrapping can be reviewed intentionally.

## 6. Figma styles

### Text styles

Create these styles using Baloo 2 for English and equivalent Khmer frames using Kantumruy Pro:

| Style | Font specification |
|---|---|
| `Display / 28 / ExtraBold` | 28px, 800, 34px line height |
| `Heading / 23 / ExtraBold` | 23px, 800, 29px line height |
| `Heading / 20 / ExtraBold` | 20px, 800, 25px line height |
| `Title / 18 / Bold` | 18px, 700, 23px line height |
| `Title / 16 / Bold` | 16px, 700, 21px line height |
| `Body / 16 / Medium` | 16px, 500, 23px line height |
| `Body / 15 / Medium` | 15px, 500, 21px line height |
| `Control / 14 / Bold` | 14px, 700, 18px line height |
| `Meta / 13 / SemiBold` | 13px, 600, 18px line height |
| `Caption / 12 / SemiBold` | 12px, 600, 16px line height |
| `Micro / 10 / Bold` | 10px, 700, 13px line height |

Use sentence case. Use tabular numerals for dates, invitation codes, money, progress, time, and weather.

### Effect styles

Create only these shared effects:

- `Effect / Card / Soft`
- `Effect / Floating / Neutral`
- `Effect / Floating / Green`
- `Effect / Glass / Light`
- `Effect / Glass / Dark`
- `Effect / Sheet / Top`
- `Effect / Focus / Accent`

Keep shadows soft and low contrast. Standard cards should normally use a border instead of a prominent shadow.

## 7. Component naming and construction

Name components with slash-separated hierarchy:

`Category / Component / Variant`

Examples:

- `Button / Primary / Default`
- `Navigation / Bottom / Home active`
- `Card / Trip / Upcoming`
- `Form / Date field / Filled`

Use Auto Layout for every production component. Avoid absolute positioning except for image overlays, map markers, and intentionally floating controls.

### Required component properties

Use component properties consistently:

- `Theme`: Light, Dark
- `State`: Default, Hover, Focus, Pressed, Disabled, Loading, Error where relevant
- `Size`: Small, Medium, Large where relevant
- `Icon`: Boolean or instance swap
- `Label`: Text property
- `Read only`: Boolean where relevant
- `Selected`: Boolean where relevant

Do not create a separate component for every label. Use text properties and instance swaps.

## 8. Component library inventory

### A. Actions

#### `Button / Primary`

- Heights: 44px compact, 50px standard
- Fill: primary green
- Text: on-primary, bold
- Properties: label, leading icon, loading, disabled

#### `Button / Secondary`

- Same dimensions as primary
- Card or transparent surface with border
- Use for cancel, alternate path, or lower-priority action

#### `Button / Danger`

- Reserved for delete, clear, or leave
- Never use for ordinary back/cancel behavior

#### `Button / Icon`

- 40px visual circle inside a 44px minimum hit frame
- Variants: default, glass, accent outline, danger quiet
- Required for back, theme, language, invite, copy, search, close, location

### B. Navigation

#### `Navigation / App header`

- Logo left
- Theme and language buttons right
- Themes: light/dark
- Compact, safe-area aware

#### `Navigation / Bottom`

- Fixed-width glass pill
- Four items: Home, Itinerary, Map, Profile
- Active item expands and reveals full text
- Component property: `Active item`
- All variants must keep the same total width

#### `Navigation / Trip tabs`

- Destination, Itinerary, Budget
- Neutral pill well with one selected surface
- Component property: `Active tab`

#### `Navigation / Day tabs`

- Selected, unselected, live-editing variants
- Horizontally scrollable pattern

### C. Inputs

- `Form / Text field`
- `Form / Text area`
- `Form / Date field`
- `Form / Time field`
- `Form / Search compact`
- `Form / Search expanded`
- `Form / Room code`
- `Form / Currency amount`
- `Form / Select row`

Each needs default, focus, filled, error, and disabled states. Inputs use 16px text to avoid iOS zoom.

### D. Trip components

- `Card / Trip / Current`
- `Card / Trip / Upcoming`
- `Card / Trip / Ongoing`
- `Card / Trip / Past`
- `Card / Trip / Read only`
- `Card / Dashboard summary`
- `Card / Attention row`
- `Header / Trip summary`
- `Action / Invite friend`
- `Action / Room code`
- `Members / Avatar list`
- `Members / Presence banner`
- `Progress / Itinerary`
- `Progress / Budget`

Trip card differences must come from meaningful status, not inconsistent padding, radius, or type.

### E. Itinerary components

- `Timeline / Rail`
- `Timeline / Activity card`
- `Timeline / Empty day`
- `Timeline / Add activity`
- `Activity / Category picker`
- `Packing / Checklist row`
- `Packing / Suggested item`
- `Packing / Progress`

Activity cards align category, title, note, and time consistently. Emoji/category images represent the place category, not generic interface actions.

### F. Map components

- `Map / Search button`
- `Map / Search field expanded`
- `Map / Suggestion row`
- `Map / Search status`
- `Map / Zoom controls`
- `Map / Live location control`
- `Map / Stop marker`
- `Map / Live user marker`
- `Map / Place preview`
- `Map / Photo gallery strip`

Stop markers show only the chosen category emoji/image. The green circular location marker is reserved for a live person.

### G. Budget components

- `Budget / Summary numbers`
- `Budget / Target progress`
- `Budget / Category row`
- `Budget / Expense row`
- `Budget / Member balance`
- `Budget / Settlement row`
- `Budget / Empty state`

Money data receives the strongest hierarchy. Supporting text remains compact.

### H. Weather components

- `Weather / Compact home`
- `Weather / Condition card`
- `Weather / Alert strip`
- `Weather / Metric`
- `Weather / Loading`
- `Weather / Unavailable`

Conditions: clear, partly cloudy, cloudy, fog, rain, snow, thunderstorm, hot, cold, windy. Card structure stays stable across conditions.

### I. Memories and media

- `Media / Hero category`
- `Media / Memory card compact`
- `Media / Memory grid item`
- `Media / Moment detail`
- `Media / Empty photo`
- `Media / Recap hero`

Use image cover crops and a subtle gradient behind overlaid text.

### J. Feedback and overlays

- `Overlay / Bottom sheet`
- `Overlay / Confirmation`
- `Overlay / Date picker`
- `Overlay / Toast`
- `Overlay / Trip success`
- `Overlay / Location consent`
- `State / Loading`
- `State / Empty`
- `State / Error`
- `State / Offline`

## 9. Reusable patterns

Build these on `03 · Patterns` from library instances only:

1. Global app shell with background, header, content, and floating navigation
2. Pushed screen with centered title and circular back control
3. Trip summary plus Destination/Itinerary/Budget tabs
4. Content list with section title and “See all” action
5. Timeline with empty and populated days
6. Form inside a keyboard-safe bottom sheet
7. Search overlay on a full-screen map
8. Status toast above the sticky header
9. Confirmation sheet with cancel and destructive action
10. Loading, empty, permission denied, and service unavailable states

## 10. End-to-end screen inventory

Every listed screen needs a light reference frame. Frames marked `Dark` or `KM` must also have those explicit QA variants.

### Flow C — Create a trip

| ID | Screen/state | Required variants |
|---|---|---|
| C01 | Home, no active trip | Light, Dark, KM |
| C02 | Create trip form, empty | Light |
| C03 | Destination filled | Light |
| C04 | Date picker bottom sheet | Light, keyboard-safe |
| C05 | Form validation error | Light |
| C06 | Creating/loading | Light |
| C07 | Trip created celebration | Light, reduced-motion note |
| C08 | New itinerary, empty Day 1 | Light, Dark, KM |

### Flow J — Join a trip room

| ID | Screen/state | Required variants |
|---|---|---|
| J01 | Join trip room entry point | Light |
| J02 | Room code bottom sheet, empty | Light |
| J03 | Code filled and valid | Light |
| J04 | Invalid/unavailable code | Light |
| J05 | Joining/loading | Light |
| J06 | Joined trip, read-only state | Light, KM |
| J07 | Member avatars expanded | Light |

### Flow P — Plan an itinerary

| ID | Screen/state | Required variants |
|---|---|---|
| P01 | Itinerary, empty day | Light, Dark, KM |
| P02 | Add activity sheet, empty | Light, keyboard visible |
| P03 | Category selected | Light |
| P04 | Google Maps link added | Light |
| P05 | Activity saved toast | Light |
| P06 | Itinerary with multiple stops | Light, Dark |
| P07 | Day tabs overflow/scroll | 320px, 390px |
| P08 | Another member editing | Light |
| P09 | Packing checklist | Light, KM |
| P10 | Edit trip dates | Light |

### Flow M — Search and map

| ID | Screen/state | Required variants |
|---|---|---|
| M01 | Full-screen map, no stop selected | Light, Dark |
| M02 | Search icon pressed/morph start | Prototype keyframe |
| M03 | Expanded search, typing | Light, keyboard visible |
| M04 | Live suggestions | Light |
| M05 | Search loading | Light |
| M06 | No results/retry | Light |
| M07 | Result selected on map | Light |
| M08 | Place preview with gallery | Light |
| M09 | Location permission request | Light |
| M10 | Live location active | Light, Android and iOS notes |
| M11 | Location denied/unavailable | Light |

### Flow B — Plan a budget

| ID | Screen/state | Required variants |
|---|---|---|
| B01 | Budget empty | Light, Dark, KM |
| B02 | Target amount entry | Light, keyboard visible |
| B03 | Budget target saved | Light |
| B04 | Add expense | Light |
| B05 | Budget with category totals | Light |
| B06 | Member balances | Light |
| B07 | Settlement guidance | Light |
| B08 | Over budget | Light |
| B09 | Read-only shared budget | Light |

### Flow T — Manage trips

| ID | Screen/state | Required variants |
|---|---|---|
| T01 | Home with current trip dashboard | Light, Dark, KM |
| T02 | My Trips, horizontally scrollable cards | Light |
| T03 | Upcoming trip card | Light |
| T04 | Ongoing trip card | Light |
| T05 | Past trip card | Light |
| T06 | Swipe-to-delete reveal | Light |
| T07 | Trip details | Light |
| T08 | Documents | Light |
| T09 | Trip templates | Light |
| T10 | Invite code copied toast | Light |

### Flow R — Memories and recap

| ID | Screen/state | Required variants |
|---|---|---|
| R01 | Home memories compact row | Light |
| R02 | All photos | Light, empty and populated |
| R03 | Memory collection | Light |
| R04 | Moment detail | Light |
| R05 | Trip recap | Light, Dark |
| R06 | Delete photo confirmation | Light |

### Flow S — Profile and settings

| ID | Screen/state | Required variants |
|---|---|---|
| S01 | Profile | Light, Dark, KM |
| S02 | Edit profile | Light |
| S03 | Language changes to Khmer | Smart-animate prototype |
| S04 | Theme changes to dark | Celestial transition prototype |
| S05 | Clear data confirmation | Light |
| S06 | Leave joined trip confirmation | Light |

### Flow W — Weather

| ID | Screen/state | Required variants |
|---|---|---|
| W01 | Compact weather on Home | Light, Dark |
| W02 | Weather detail, clear | Light |
| W03 | Weather detail, rain | Light |
| W04 | Weather detail, thunderstorm | Dark |
| W05 | Weather alert strip | Light |
| W06 | Weather unavailable | Light |

## 11. Prototype journeys

Build these connected prototypes on `10 · Prototype`.

### Prototype 1: Create and plan

`Home empty → Create trip → Pick dates → Success → Itinerary → Add activity → Saved activity`

Success condition: a tester can create a trip and understand how to add the first stop without instruction.

### Prototype 2: Search a place

`Itinerary → Destination tab → Search icon → Expanded search → Suggestions → Select place → Place preview → Add as stop`

Success condition: the search control visibly expands from right to left and the selected place is reflected on the map.

### Prototype 3: Invite and collaborate

`Itinerary → Invite → Copy code → Copied toast → Join flow → Member list → Live editing presence`

Success condition: owner and member roles, invitation state, and collaboration state are clear.

### Prototype 4: Budget together

`Budget empty → Add target → Add expense → Category totals → Member balances → Settlement`

Success condition: a tester can explain the target, planned amount, remaining amount, and who owes whom.

### Prototype 5: Prepare and travel

`Home current trip → Attention item → Packing checklist → Weather → Map → Live location consent`

Success condition: preparation features feel connected to the trip and do not resemble separate apps.

### Prototype 6: Complete and remember

`Past trip → Recap → Memory collection → Moment detail → All photos`

Success condition: post-trip content feels celebratory and media-first.

## 12. Prototype motion specification

### Bottom navigation

- Trigger: tap item
- Active background: Smart Animate
- Duration: 400ms
- Easing: gentle ease-out
- Active label fades and slides 4px into place
- Total navigation width remains fixed

### Map search expansion

- Search icon is anchored to the right
- Input container expands from right to left
- Duration: 320ms
- Search icon keeps its optical center
- Input text fades in after the container begins expanding
- Clear action appears only when text exists

### Bottom sheets

- Open: move in from bottom plus scrim fade
- Duration: 300–340ms
- Close: 220–260ms
- Preserve visible title and primary action when keyboard frames are shown

### Theme transition

- Day: sun travels in a smooth arc from left to right
- Night: moon travels in a smooth arc from right to left
- No pause at center
- Full atmospheric transition: approximately 3.2 seconds
- Prototype may use keyframes with matching layer names

### Toast

- Enter from top by 8px and fade in
- Remain for about 1.6 seconds
- Fade out without shifting surrounding layout
- Layer above header

### Reduced motion

Add a prototype note and alternate frames showing:

- Instant tab state changes
- No ambient background animation
- Theme changes with a short crossfade instead of a celestial arc
- Sheets retain a short opacity transition

## 13. Content specification

Use realistic Waylo content in approved frames.

### Default trip

- Destination: Siem Reap
- Dates: Aug 13 – Aug 16 · 4 days
- Members: 3 travelers
- Example stops: Angkor Wat, Srah Srang, Old Market, Phnom Bakheng
- Currency: USD

### Content rules

- Use Telegram display names, not usernames
- Use specific place names instead of “Location 1”
- Button text starts with a verb
- Empty states explain the next action
- Errors explain recovery
- Keep invitation codes short and visually grouped
- Do not expose API, Redis, D1, Worker, provider, or hosting terminology

## 14. English and Khmer design QA

Do not treat Khmer as a final translation pass.

For each primary flow:

1. Duplicate the approved English reference frame
2. Apply Kantumruy Pro and Khmer content
3. Allow components to grow vertically
4. Check button labels at 320px
5. Check segmented controls and bottom navigation
6. Check dates, counts, currency, and plural meaning
7. Check that icons remain aligned with taller Khmer text

Never reduce Khmer to an unreadably small size to preserve an English layout.

## 15. Accessibility annotations

Add accessibility notes in the Handoff page for:

- Accessible name for every icon-only button
- Reading order
- Focus order
- Modal focus trap and return target
- Status messages announced by screen readers
- 44 × 44px minimum hit areas
- Contrast requirements
- Non-color state indicators
- Reduced motion behavior
- Map alternative actions when location permission is denied

Use Figma annotations or a dedicated note component named `Annotation / Accessibility`.

## 16. Design-to-code mapping

| Figma component/pattern | React/CSS reference |
|---|---|
| App shell | `src/App.tsx`, `src/styles/base.css` |
| App header | `src/components/shared/AppHeader.tsx` |
| Theme transition | `src/components/shared/ThemeSkyTransition.tsx`, `src/styles/theme.css` |
| Travel background | `src/components/shared/AnimatedTravelBackground.tsx`, `src/styles/travel-background.css` |
| Bottom navigation | `src/components/nav/BottomNav.tsx`, `src/styles/nav.css` |
| Trip tabs/header | `src/components/shared/TripSummaryHeader.tsx` |
| Home dashboard | `src/components/home/TripDashboardCard.tsx`, `src/styles/home.css` |
| Trip cards | `src/components/shared/TripCard.tsx` |
| Itinerary | `src/views/ItineraryView.tsx`, `src/styles/itinerary.css` |
| Stop card | `src/components/shared/StopCard.tsx` |
| Date field | `src/components/shared/DatePickerField.tsx` |
| Map | `src/views/MapView.tsx`, `src/styles/map.css` |
| Budget | `src/views/BudgetView.tsx`, `src/styles/budget.css` |
| Weather | `src/components/shared/WeatherIcon.tsx`, `src/views/WeatherView.tsx` |
| Members | `src/components/shared/TripMembers.tsx`, `PersonAvatar.tsx` |
| Bottom sheets/modals | `src/components/modals/`, `src/styles/modals.css` |
| Trip success | `src/components/shared/TripSuccessCelebration.tsx` |

Figma layer and property names should match code concepts where practical. Do not rename a shared design concept only to make the Figma file appear more decorative.

## 17. Developer handoff requirements

Every approved flow section must include:

- Final reference frame
- Frame size and theme
- Component instances, not detached copies
- Interaction notes
- Scrolling behavior
- Empty/loading/error variants
- Keyboard and safe-area notes
- Exportable assets marked for export
- Code mapping note

### Asset export

- Interface icons: SVG
- Decorative vector backgrounds: SVG
- Illustrations/photos: WebP or optimized PNG only when vector is not appropriate
- Use `@1x` for vector-derived app assets; raster assets may include `@2x`
- Names use lowercase kebab case
- Do not export text inside images

## 18. Review gates

### Gate 1 — Foundations approved

- Color variables match code
- Typography and Khmer font are installed
- Grids, spacing, radius, and effects are documented
- Light and dark modes switch correctly

### Gate 2 — Components approved

- All required states exist
- Auto Layout resizes correctly
- Text properties and instance swaps work
- Components survive 320px and Khmer content
- No unnecessary detached instances

### Gate 3 — Flows approved

- All primary flows are complete
- Loading, empty, error, disabled, permission, and read-only states exist
- Navigation and back behavior are consistent
- Trip remains the strongest hierarchy

### Gate 4 — Prototype approved

- Six prototype journeys are connected
- Motion matches the specification
- No dead ends
- Overlays close and return to the correct state
- Reduced-motion behavior is documented

### Gate 5 — Handoff approved

- Screens map to current React views/components
- Assets are export-ready
- Accessibility annotations are complete
- Engineering questions are resolved or visibly tracked

## 19. Figma QA checklist

- [ ] File pages use the required order and naming.
- [ ] All production components use Auto Layout.
- [ ] Color values are variables, not isolated fills.
- [ ] Light and dark variants use modes.
- [ ] Reference screens are 390px wide.
- [ ] 320, 360, and 420px QA frames are included.
- [ ] English and Khmer primary flows are reviewed.
- [ ] No primary label is truncated.
- [ ] Touch targets are at least 44px.
- [ ] Navigation retains a stable total width.
- [ ] Map search expands from right to left.
- [ ] Keyboard frames keep fields and actions visible.
- [ ] All overlays have open, close, and error behavior.
- [ ] Empty, loading, unavailable, read-only, and permission states exist.
- [ ] Weather remains secondary to trip planning.
- [ ] Stop markers and live-user markers are visually distinct.
- [ ] Decorative travel art stays outside the central content lane.
- [ ] Motion has a reduced-motion alternative.
- [ ] Approved screens use components rather than detached copies.
- [ ] Handoff frames include code references.

## 20. Definition of done

The Figma design is end-to-end complete when a reviewer can:

1. Start with no trip
2. Create a trip and select dates
3. Add itinerary stops
4. Search and select a real place on the map
5. Invite or join another traveler
6. Review members and collaborative state
7. Create a budget and understand settlement
8. Complete packing and view weather
9. Navigate all primary and pushed screens
10. View trip memories and recap
11. Repeat the primary experience in Khmer
12. Review the same system in dark mode

At that point, every approved visual decision should be traceable to a Figma variable, style, component, or documented exception, and every primary frame should map to an existing or planned React implementation.
