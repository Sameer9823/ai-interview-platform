# Accessibility debt register

Known issues, tracked like technical debt. Status as of this build. "Unverified" means not yet tested, not known to be fine.

## Summary

| # | Issue | Severity | WCAG | Status |
|---|---|---|---|---|
| 1 | No real browser testing at any viewport or zoom level | Major (unknown) | 1.4.10, 1.4.4, 1.3.4 | Open, blocked in sandbox |
| 2 | No automated axe scan | Major (unknown) | various | Open, blocked in sandbox |
| 3 | No screen reader testing | Major (unknown) | 4.1.2, 1.3.1 | Open |
| 4 | Landing menu overlay does not trap focus or inert the page | Major | 2.4.3, 2.1.2 | Open |
| 5 | Form errors do not move focus or show a summary | Major | 3.3.1, 2.4.3 | Open |
| 6 | Theme does not follow the system preference | Minor | 1.4.x (preference) | Open, deliberate default |
| 7 | Collapsed sidebar names rely on `title` | Minor | 2.5.3 | Open |
| 8 | Notification popover lacks arrow key navigation | Minor | 2.1.1 | Open |
| 9 | Touch target size set in CSS, not measured | Minor (unknown) | 2.5.8 | Open |
| 10 | 67 inline styles block consistent text spacing overrides | Minor | 1.4.12 | Open |

## Records

### 1. Responsive, zoom and orientation not tested in a real browser
- **Who is affected:** low vision users who zoom to 200 percent or 400 percent, phone users, people who mount a device in one orientation.
- **Where:** every page.
- **What is in place:** rem type, fluid max width containers, a drawer sidebar under 768px, no orientation lock, wrapped tabs, 44px targets on touch.
- **Discovered:** this build, review against the responsive checklist. The sandbox cannot download a browser, so none of the six viewports (320, 375, 768, 1024, 1280, 1440) or the 150 and 200 percent zoom cases were run.
- **Remediation:** run `npm run test:e2e`, add axe checks at each width, and check 200 percent zoom at 1280px for horizontal scroll. Owner: whoever runs Phase 1 acceptance. Target: before launch.

### 2. No automated axe scan
- Same blocker as 1. Add `@axe-core/playwright` to `e2e/` and fail the build on serious or critical issues.

### 3. No screen reader testing
- Fields, errors, tabs, the progress bar and the sidebar use native elements and ARIA, but no screen reader has been used on them. Test with VoiceOver and NVDA on sign up, onboarding and the dashboard.

### 4. Landing menu overlay does not trap focus
- **Who:** keyboard and screen reader users on small screens.
- **Where:** `components/landing/landing-header.tsx`.
- **Detail:** Escape closes the menu and the closed menu is hidden from focus, but while open, Tab can still reach the page behind it. Fix: mark the page `inert` while the menu is open and move focus to the first link.

### 5. Form errors do not receive focus
- **Where:** all server action forms.
- **Detail:** each error is a `role="alert"` message, so it is announced, but focus stays on the submit button and there is no summary. Fix: focus the first invalid field after a failed submit.

### 6. Theme ignores the system preference
- Dark is the ChaiUI default. People who set a light system theme see dark first and must use the toggle. The choice is remembered in a cookie. Option: follow `prefers-color-scheme` until the person chooses.

### 7 to 10
- Collapsed sidebar: the accessible name comes from the `title` attribute. Add a visually hidden label.
- Notification popover: Escape and outside click work, arrow keys do not.
- Touch targets: `@media (pointer: coarse)` sets 44px minimums. Measure them in a browser.
- Inline styles: users who override text spacing may find fixed values in a few cards. Move them to classes.

## Fixed in this phase

- Input borders now reach 3:1 in both themes.
- Errors carry text and a thicker border, not colour alone.
- Type is in rem.
- Notification popover closes with Escape and returns focus.
- Contrast is now enforced by a test.

## Added in Phase 2 (all unverified in a real browser)

| # | Issue | Severity | WCAG | Status |
|---|---|---|---|---|
| 11 | Admin forms show per field errors but no summary and do not move focus to the first error | Major | 3.3.1, 2.4.3 | Open |
| 12 | Pagination Previous and Next are links marked `aria-disabled` at the ends. Not tested with a screen reader | Minor | 4.1.2 | Open |
| 13 | Wide admin tables scroll sideways inside their own container. Row actions are links, so no hidden controls, but not tested at 320px | Minor (unknown) | 1.4.10 | Open |
| 14 | Answers sit in native `details` widgets. Behaviour with screen readers and in print not tested | Minor (unknown) | 4.1.2 | Open |
| 15 | Bulk selection has a label per checkbox but no "select all" | Minor | 2.4.6 | Open |
| 16 | Flash messages after admin actions come from the URL and have `role` set, but disappear only on navigation | Minor | 4.1.3 | Open |

What is in place for these pages: every table has a caption and column headers with `scope`, every control has a label, filters are real `form` elements with `role="search"`, status is always written as text (never colour only), provenance is stated in words, breadcrumbs use `nav`, and nothing depends on JavaScript for reading or filtering content.
