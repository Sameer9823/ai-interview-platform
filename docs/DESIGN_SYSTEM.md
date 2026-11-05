# Design system

Look: the ChaiUI style (near black page, warm hairline borders, cream highlight phrase, solid white buttons with asymmetric corners). Tokens live at the top of `app/globals.css`. Dark is the default. Light is a toggle.

> The Phase 1 brief asked for white and blue. You rejected that palette earlier and chose ChaiUI, so ChaiUI is what is built.

## Tokens

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | #0a0a0a | #ffffff | Page |
| `--fg` | #fafafa | #0a0a0a | Body text, focus ring |
| `--mut` | #a3a3a3 | #525252 | Secondary text |
| `--hl` | #ffedd5 | #854d0e | One highlight phrase per paragraph |
| `--line` / `--lineh` | cream 15% / 30% | brown 15% / 30% | Decorative borders, hover borders |
| `--field` | cream 50% | #737373 | Input and choice borders (must reach 3:1) |
| `--err` | #f87171 | #b91c1c | Error text |
| `--hover` | #FF7D0C | #C2410C | Link hover text |
| `--brand` | #FF7D0C | #FF7D0C | Logo mark only |

The accent orange never fills a surface. The only filled control is the white (dark) or black (light) primary button.

## Type scale

Font families: Manrope (body, headings), Montserrat (card titles, highlight phrase), Onest (wordmark). All sizes are in rem so they follow the user's text size setting.

Sizes in use (rem): 0.6875rem 0.75rem 0.875rem 1rem 1.25rem 1.5rem 1.875rem 2.25rem 3rem 3.75rem 4.5rem 
Steps follow the Tailwind scale (0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.875, 2.25, 3, 3.75, 4.5), not a strict ratio, because the landing page rules require Tailwind steps. Body is 1rem on 1.5rem. Display sizes use a line height of 1. Weights: 400, 500, 600 only.

## Components

| Component | Variants and states | Accessibility notes |
|---|---|---|
| Button | solid, outline (mirrored corners), danger. Hover, active (scale .97), disabled, pending label | Default type is "button". 44px minimum on touch screens |
| TextField, SelectField, TextAreaField | default, error, disabled, hint | Label bound by id. Error has "Error:" text, a 2px border and role=alert, never colour alone |
| ChoiceGroup | radio or checkbox cards | Real inputs inside a fieldset with a legend. Checked state is border plus fill plus the native control |
| Card, Badge, EmptyState, ProgressBar | ProgressBar exposes aria values | Percent is always printed next to the bar |
| AppShell | expanded, collapsed (icons only, title tooltips), mobile drawer | aria-current on the active item, "Soon" text on unavailable items |
| NotificationMenu | closed, open, empty | Escape closes and returns focus. Click outside closes |
| LocalTime | renders in the visitor's time zone | hydration warning suppressed on purpose |

## Motion

Only transform and opacity animate. Entrances use cubic-bezier(0.23, 1, 0.32, 1) at 600ms. The drawer and menu use cubic-bezier(0.32, 0.72, 0, 1). Buttons press to 97%. Hover effects only run on devices that hover. Reduced motion removes movement and keeps short fades. Frequent actions (tab switches, form submits) are not animated.

## Contrast (measured from the real CSS)

Run `npm run contrast`. The same numbers are enforced by `tests/contrast.test.ts`.

Problems found and fixed in this phase (measured before the fix):
- Input borders were 1.45:1 (dark) and 1.29:1 (light). Needed 3:1. Now `--field`.
- Link hover orange on white was 2.56:1. Needed 4.5:1. Now `--hover`.

| Theme | Pair | Ratio | Needs | Result |
|---|---|---|---|---|
| dark | Body text on page | 18.97:1 | 4.5:1 | Pass |
| dark | Muted text on page | 7.85:1 | 4.5:1 | Pass |
| dark | Muted text on card | 7.6:1 | 4.5:1 | Pass |
| dark | Muted text on filled surface | 6.68:1 | 4.5:1 | Pass |
| dark | Highlight phrase on page | 17.28:1 | 4.5:1 | Pass |
| dark | Error text on page | 7.16:1 | 4.5:1 | Pass |
| dark | Link hover colour on page | 7.72:1 | 4.5:1 | Pass |
| dark | Button label on button | 18.97:1 | 4.5:1 | Pass |
| dark | Input border on page (UI component) | 5.08:1 | 3:1 | Pass |
| dark | Focus ring on page (UI component) | 18.97:1 | 3:1 | Pass |
| light | Body text on page | 18.97:1 | 4.5:1 | Pass |
| light | Muted text on page | 7.85:1 | 4.5:1 | Pass |
| light | Muted text on card | 7.6:1 | 4.5:1 | Pass |
| light | Muted text on filled surface | 6.68:1 | 4.5:1 | Pass |
| light | Highlight phrase on page | 17.28:1 | 4.5:1 | Pass |
| light | Error text on page | 7.16:1 | 4.5:1 | Pass |
| light | Link hover colour on page | 7.72:1 | 4.5:1 | Pass |
| light | Button label on button | 18.97:1 | 4.5:1 | Pass |
| light | Input border on page (UI component) | 5.08:1 | 3:1 | Pass |
| light | Focus ring on page (UI component) | 18.97:1 | 3:1 | Pass |

## Colour independence audit

| Meaning | Carried by colour | Also carried by |
|---|---|---|
| Field error | red text and border | "Error:" prefix, text message, role=alert, thicker border |
| Selected choice | border and fill | native checked control |
| Current page in sidebar | fill | aria-current, bold weight |
| Current settings tab | fill | aria-current, underline |
| Feature availability | none | "Coming soon" and "Available now" text badges, "Soon" text in the sidebar |
| Profile progress | bar fill | printed percentage |
| Links in body copy | colour | underline |

## Audit: hardcoded values

- Hex colours in TSX: 0.
- Inline `style` attributes in TSX: 67, mostly one off margins and max widths. This is design system debt. Next step: add spacing utility classes and a `Stack` component, then remove them.
- Raw colours in CSS outside the token blocks: modal scrim, drawer scrim, hexagon mask, a brand tinted footer rule and the notification dot text. All are overlays or fixed brand details. Candidates for tokens.

## Why these decisions (business view)

Phase 1 has no revenue. The design moves two lines that decide whether later phases matter:

- Activation: the share of sign ups who finish onboarding. The wizard is three short steps, optional fields are skippable and a missed field jumps back to the right step.
- Return use: profile completion and goals give the dashboard something honest to show. Empty states say what to do next instead of showing invented progress.

Neither number is measured yet. Instrument sign up, onboarding completed and profile completion before judging the design.
