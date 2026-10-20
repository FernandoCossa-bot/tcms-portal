# TCMS Core UI and UX Design Brief

Version: 0.1  
Date: 20 October 2026  
Product: TCMS — Tzu Chi Mozambique System  
Scope: Core portal and shared interface conventions  
Companion: TCMS-Core-PRD.md  


This brief specifies the first functional Core experience, including the transport integration entry point. It does not redesign all four business modules. UI language is English and can be translated to Traditional Chinese and Portugues. 

The current PRD identifies the expanded product name in its confirmed decisions, although its open-question table still contains a naming question. This brief uses the confirmed name without modifying the PRD. Restricted-administrator capabilities and the meaning of general access remain unresolved: the interface must reflect approved backend capabilities, not silently settle these questions.

## 1. Three Design Principles

### 1. Make the next action and its consequence clear

Every screen has a descriptive heading, a short purpose statement and one dominant task. Approval, access assignment and administrative promotion are different actions with different explanations. A successful registration must never look like immediate authorization.

### 2. Show real operational truth

No fabricated metrics, healthy-status lights, notification counts or working-looking future modules. Differentiate account approval, assigned role, module availability and health. Report stale or missing information explicitly. The portal is an operational tool, not a sales dashboard.

### 3. Share the structure without hiding responsibility

Use consistent navigation, forms, status language and account operations across Core and modules. A coordinator sees a simple workspace; an administrator sees additional tools. Ownership and powerful actions remain explicit and backend-enforced.

## 2. Visual Direction

### Mood and identity

Create a calm, contemporary workspace for a humanitarian organization: trustworthy blue, supportive green, generous white surfaces and dark navy equivalents. The design should feel deliberate and complete without resembling a trading terminal, gaming interface or generic metrics dashboard.

- Blue identifies navigation and primary actions.
- Green identifies confirmed positive outcomes; it is not a decorative permission indicator.
- Neutral surfaces carry dense administrative work.
- Amber and red are reserved for warnings and errors; the brand palette does not prohibit necessary semantic colors.
- Use a TCMS wordmark and simple geometric mark initially. Do not fabricate an official Foundation logo.
- Identify the environment with a visible `Demo environment` label and a concise synthetic-data notice.

### Depth and motion

The public Home page may include an abstract, isometric arrangement of one Core tile and four connected module tiles. It communicates the actual architecture. This is decorative, not a live integration diagram.

Use shallow layered shadows, subtle perspective and a single short entrance transition. Do not require WebGL, a 3D model or an external animation service. A static version is the MVP fallback.

Motion rules:

- Hover/focus feedback: 120–160 ms.
- Panels and dialogs: 180–220 ms, without dramatic zoom.
- Decorative entrance: no more than 600 ms, once per page visit.
- Hover elevation: at most 2 px; never change layout or move an active form control.
- No autoplay looping movement, parallax scrolling, pointer-following tilt or animated background behind forms.
- Reduced-motion preference removes decorative transforms and transitions.
- Loading remains understandable without moving shimmer or spinning animation.

### What to avoid

Avoid full-screen gradients, low-contrast glass panels, oversized greeting banners inside administration, stock photos unrelated to the task, emoji navigation, invented charts and excessively rounded controls. Do not add search, notification bells, support links or export actions unless they work.

## 3. Design Tokens

### Color tokens

Use semantic names rather than scattering hex values across individual screens.

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| canvas | #F3F7FB | #0B1423 | Page background |
| surface | #FFFFFF | #14243A | Cards, forms, dialogs |
| surface-subtle | #EAF1F8 | #1B304A | Grouped content; not an interactive border |
| text | #172B4D | #EDF4FF | Main text and headings |
| text-muted | #52647A | #ACBBD0 | Supporting text, not disabled content |
| border-subtle | #D9E3EF | #34485F | Decorative separators |
| border-control | #66788F | #7890AD | Necessary input/control boundaries |
| action | #175CD3 | #80B4FF | Primary buttons and links |
| action-hover | #124AA8 | #A6CBFF | Hovered primary buttons |
| on-action | #FFFFFF | #102033 | Primary-button text |
| positive | #087F5B | #65D6AD | Confirmed success and positive actions |
| on-positive | #FFFFFF | #102033 | Text on solid positive surfaces |
| warning | #8A4B08 | #F5C16C | Warnings on the standard surface |
| danger | #B42318 | #FCA5A5 | Error text and destructive-action emphasis |
| focus | #175CD3 | #80B4FF | Keyboard focus ring |

Status badges use semantic-colored text, a matching icon and a written label on the standard surface. Do not rely on a tinted background or color alone. Coming Soon and Not Checked use neutral styling.

Calculated solid-color reference pairs:

| Foreground/background | Contrast |
| --- | ---: |
| Light main text / white surface | 14.10:1 |
| Light muted text / white surface | 6.06:1 |
| Light muted text / canvas | 5.63:1 |
| White / blue action | 5.99:1 |
| White / green positive | 5.00:1 |
| Dark main text / dark surface | 14.13:1 |
| Dark muted text / dark surface | 8.02:1 |
| Dark action text / blue action | 7.75:1 |
| Dark action text / green positive | 9.23:1 |
| Light control border / white surface | 4.52:1 |
| Dark control border / dark surface | 4.76:1 |
| Light danger text / white surface | 6.57:1 |
| Dark danger text / dark surface | 8.24:1 |

These calculations validate only the named pairs. Hover, selected, warning, focus and any translucent combinations require implementation-stage checking. Decorative borders must not be the only means of identifying an input.

### Typography

Use a local system sans-serif stack: `Segoe UI`, `Roboto`, `Helvetica Neue`, Arial, sans-serif. This supports a reliable Windows classroom demonstration without a font download and remains familiar on other devices. No remote font is required.

| Role | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| Public hero | 48 / 56 px desktop; 32 / 40 px mobile | 700 | Landing page only |
| Page title | 32 / 40 px; 28 / 36 px mobile | 700 | One primary heading per screen |
| Section heading | 24 / 32 px | 600 | Major groups |
| Card heading | 20 / 28 px | 600 | Module and section cards |
| Body / inputs | 16 / 24 px | 400 | Default reading and editing |
| Labels / buttons | 14 / 20 px | 600 | Short interface labels |
| Metadata | 13 / 20 px | 400 | Versions and timestamps |

Use relative units in implementation so user text settings remain effective. Never use metadata size for long explanations. Use tabular numerals for comparable counts; use a monospace stack only for module codes and diagnostic identifiers.

### Spacing, geometry and elevation

- Spacing scale: 4, 8, 12, 16, 24, 32, 48 and 64 px.
- Form field gap: 20–24 px. Label-to-control: 8 px. Helper-text gap: 4 px.
- Card padding: 24 px desktop, 16 px mobile.
- Main content: maximum 1200 px inside the application workspace; public content maximum 1280 px.
- Reading/form content: 640 px maximum; authentication card: 440 px maximum.
- Control radius: 10 px; card radius: 16 px; dialog radius: 20 px.
- Status badges may use a pill radius; buttons are not pills.
- Light card shadow: `0 4px 16px rgba(23,43,77,0.06)`.
- Light overlay shadow: `0 16px 48px rgba(23,43,77,0.16)`.
- Dark card shadow: `0 4px 16px rgba(0,0,0,0.18)` plus a border.
- Dark overlay shadow: `0 16px 48px rgba(0,0,0,0.40)`.
- No shadow-only distinction for selected or focused states.

### Theme behavior

Offer System, Light and Dark in a labelled theme control available before and after login. Default to the system preference until the user chooses otherwise. Store only this presentation preference locally; do not store approval or effective roles as trusted local preferences. Avoid a light flash when opening a dark page.

## 4. Screen Inventory

These are separate page-level destinations, not sections of one long page. Route names are design identifiers; final filenames depend on deployment. Direct links, refresh, back navigation and page titles must work on the chosen host.

| ID | Screen | Audience and purpose |
| --- | --- | --- |
| S01 | Public Home | Explain TCMS and provide sign-in/registration |
| S02 | Sign In | Authenticate an existing user |
| S03 | Create Account | Submit public registration |
| S04 | Verify Email / Authentication Callback | Explain verification and handle trusted authentication outcomes |
| S05 | Account Status | Pending, rejected, suspended or incomplete-onboarding feedback |
| S06 | Forgot Password | Request a recovery email |
| S07 | Reset Password | Set a new password through a valid recovery session |
| S08 | Workspace Home | Approved user's immediate tasks and available modules |
| S09 | My Modules | Full list of assigned modules and their availability |
| S10 | My Account | Own identity summary, account status and theme preference |
| S11 | Administration Overview | Authorized administrative priorities and accurate summaries |
| S12 | Users and Approvals | Search/filter users and review pending registrations |
| S13 | User Details and Access | Inspect one user; perform permitted status/access changes |
| S14 | Module Catalogue | Administratively register and inspect module integrations |
| S15 | Module Details | Edit authorized metadata; review version and integration readiness |
| S16 | Audit History | Inspect allowed administrative events |
| S17 | System Health | Inspect module checks and timestamps |
| S18 | Access Denied | Explain lack of authorization without disclosing protected details |
| S19 | Module Unavailable | Explain known maintenance/unavailability and offer return |
| S20 | Page Not Found | Recover from an invalid destination |
| S21 | Transport Module Handoff | Consistent navigation boundary to the existing real module |

Dialogs, not additional page destinations: approve account, reject/suspend account, grant/edit/deactivate module access, privileged role change, module activation and unsaved-changes confirmation.

MVP excludes a general notification center, global search, a helpdesk and a database console.

## 5. Core User Flows

### A. Public registration and approval

1. Public Home → Create Account.
2. Enter display name, email and password; read approval explanation.
3. Submit once. Show progress without losing form context.
4. Show the appropriate check-email/onboarding outcome only after the Auth response.
5. After successful verification, fetch current account state.
6. Pending account → Account Status, not Workspace Home.
7. Administrator reviews the application separately.
8. On a later sign-in or explicit status refresh, Approved → Workspace Home.
9. If no module is assigned, show `No modules assigned` and explain that approval and module access are separate.

Verification and approval ordering must match the final Auth policy. The UI must not invent a successful verification or display an unverified job title as an effective role.

### B. Login and session routing

1. Sign In → authenticate → retrieve current account state and capabilities.
2. Approved → Workspace Home; Pending/Rejected/Suspended → Account Status.
3. Provisioning error → safe status screen with retry; never a temporary admin shell.
4. If returning to a requested module, check permission and destination allowlist first.
5. Expired session → Sign In with an explanatory message; do not retain protected details on screen.

### C. Password recovery

1. Forgot Password → submit email.
2. Show a generic response: `If an account matches this email, you will receive recovery instructions.`
3. Valid recovery link → Reset Password.
4. Successful reset → confirmation and the configured sign-in continuation.
5. Invalid/expired link → explain and link to a new recovery request.

### D. Approve an applicant

1. Administration → Users and Approvals → Pending filter.
2. Open the user details and review submitted identity information.
3. Choose Approve only when the backend capability allows it.
4. Confirmation states: `Approval allows platform sign-in. Module access is assigned separately.`
5. Submit, await authoritative result, update the account status and show the recorded result.
6. Offer `Manage module access` as the next separate action.

### E. Grant, modify and deactivate module access

1. User Details → Module Access.
2. Choose a module and an allowed role; show existing assignments.
3. Review the user, module, role and effective change.
4. Submit through the authorized operation; show success only after confirmation.
5. A role edit follows the same review pattern.
6. Deactivation requires confirmation naming the user/module and explaining the consequence.
7. Refresh the affected state. Revoked users receive an appropriate denied result on later protected operations.

### F. Administrative privilege changes

1. Owner opens the dedicated platform-role section.
2. Select a permitted change, review its elevated impact and supply the required reason.
3. Backend checks self/last-owner and other protections.
4. On success, show the updated assignment and recorded change.
5. Restricted administrators do not receive an editable version of this form.

Exact restricted-administrator actions remain conditional on the open PRD decisions.

### G. Enter transport and return

1. Select `Open Logistics & Transport` from an authorized module card.
2. Recheck current capability and module lifecycle; do not rely on a stale card.
3. Navigate using the agreed session integration; no token-bearing ordinary URL.
4. The module identifies itself and provides `Back to TCMS`.
5. Demonstrate the existing related data plus authorized add/edit actions.
6. Return to the portal without an unrelated sign-in experience; test the agreed behavior.

The portal does not imply that every logged-in user may edit vehicles.

### H. Inspect health and audit

1. Authorized administrator opens Health or Audit History.
2. Choose module/date/status filters as appropriate.
3. Inspect a sanitized result and its timestamp/version.
4. `Run checks` is shown only if a real authorized check exists; otherwise provide the last recorded result.
5. Audit detail is read-only and never offers Edit/Delete.

## 6. Per-Screen Layout and Hierarchy

### Shared shells

**Public shell:** wordmark at top left; theme control and Sign In at right; a concise footer with environment/version where known. No authenticated navigation.

**Authentication shell:** small brand header, centered form card, brief supporting context and Back to Home. A restrained brand illustration may occupy the left side on wide screens; the form always comes first in reading order.

**Application shell:** 248 px desktop sidebar, 64 px top bar, breadcrumbs when useful and a bounded content area. Sidebar groups Workspace and Administration. Persistent account/Sign Out controls remain reachable. No sidebar item is rendered before capabilities are resolved.

**Status shell:** minimal account-aware header and one clear status panel, without protected administration or module content.

### Screen composition

| Screen | Sections in reading order | Primary action and key components |
| --- | --- | --- |
| S01 Public Home | Brand → concise product promise → Sign In/Create Account → illustrative Core/module structure → three factual capabilities → demo notice | Sign In; secondary Create Account; no invented statistics |
| S02 Sign In | Heading → email → password with reveal control → Forgot Password → submit → registration link | Sign In; field validation and form status |
| S03 Create Account | Heading → approval notice → display name/email/password → submit → Sign In link | Create Account; no effective-role selector |
| S04 Verify/Callback | Heading → processing or check-email explanation → outcome → permitted next step | Continue after verified outcome, or resend if supported; no raw token display |
| S05 Account Status | Status heading/icon → explanation → available next step → Sign Out | Check status for Pending; other actions depend on actual policy |
| S06 Forgot Password | Heading → recovery explanation → email field → submit → return link | Send recovery instructions |
| S07 Reset Password | Validity check → password and confirmation → requirements → submit | Reset password; invalid link offers Request a new link |
| S08 Workspace Home | Greeting and account context → My Modules → concise account/access summary | Open an authorized module; no admin-only metrics |
| S09 My Modules | Heading → filter only if useful → assigned-module cards → no-results guidance | Open module per card |
| S10 My Account | Own identity read-only summary → approval status → separate module roles → theme → recovery link | Change password via recovery flow; no unsupported profile-save action |
| S11 Admin Overview | Heading → real counts for pending approvals/approved users/active modules → pending queue preview → health summary | Review pending registrations |
| S12 Users/Approvals | Heading → search + approval filter → results/count → pagination | Review user; per-row explicit link rather than hidden row click |
| S13 User Details | Breadcrumb → identity + status → review information → status actions → module access → owner-only platform roles → allowed recent changes | Contextual Approve or Assign module; dangerous actions separated |
| S14 Module Catalogue | Heading → owner-only Register module → lifecycle filter → module list | Register module for owner; View details for others |
| S15 Module Details | Identity/version → lifecycle and health shown separately → metadata → integration checklist → change history | Save changes if editable; activation is a separate confirmed action |
| S16 Audit History | Heading → actor/module/action/date filters → events table → read-only detail | View event; no export until explicitly implemented |
| S17 System Health | Heading + last checked → honest summary → per-module check list → sanitized diagnostic details | Run checks if supported; otherwise Refresh recorded results |
| S18 Access Denied | Generic denied heading → brief reason safe to disclose → return action | Back to workspace; Sign In for unauthenticated access |
| S19 Module Unavailable | Module name if authorized → availability explanation → last known update → return | Back to My Modules; Retry when meaningful |
| S20 Not Found | Not found heading → recovery guidance | Back to Home or Workspace according to current session |
| S21 Transport | Shared context/header → module-owned navigation and content | Module-owned add/edit controls with TCMS return link |

Home and My Modules may reuse the same module-card component, but Home shows a compact overview rather than duplicating a large module catalogue.

### Administration interaction details

- User details use visible sections rather than hiding essential permissions behind nested menus.
- Forms are single-column by default; related module metadata may use two columns on desktop.
- Full user details have a dedicated page, not a narrow drawer.
- Short approval/access edits use a dialog with a clear title, named target, consequence, Cancel and one specific action.
- Use `Deactivate access`, not vague labels such as `Confirm` or destructive labels such as `Delete user` when no deletion occurs.
- Focus initially goes to the heading or first ordinary field; for consequential confirmation, prefer the safe Cancel action.
- A refresh conflict preserves the user's context and asks them to review the latest record.
- No bulk approval, bulk role change or delete-all operation in the MVP.

## 7. Reusable Component Library

| Component | Variants | Required states and behavior |
| --- | --- | --- |
| App shell / public shell | Public, authenticated, status | Resolving session, authorized, expired; never flash protected content |
| Sidebar navigation | Workspace, administration | Current page, focus, expanded/collapsed mobile; text labels always available |
| Page header | Standard, breadcrumb, with primary action | Long titles wrap; action stacks on mobile |
| Button / link | Primary blue, secondary outlined, quiet, positive, danger | Default, hover, focus, pressed, disabled, busy; links navigate and buttons act |
| Text field | Text, email, password, URL, search | Empty, filled, focused, invalid, read-only, disabled; persistent label |
| Select control | Single module/role/status/theme | Default, selected, invalid, loading, unavailable; prefer native behavior initially |
| Checkbox | Boolean confirmation/filter where necessary | Checked, unchecked, focus, disabled; never preselect consent |
| Status badge | Account, lifecycle, health, role | Label + icon; separate semantic families rather than one universal green state |
| Module card | Authorized, maintenance, unavailable; future catalogue entry | Real title/version/state; one clear action; no nested interactive card wrapper |
| Summary metric | Count with label | Loading, actual count including zero, unavailable; never render missing data as zero |
| Data table | Users, modules, events, access | Loading, populated, empty, filtered empty, error; headers and explicit row actions |
| Filter bar | Search, status, date/module where relevant | Pending query, applied filters, Clear filters; submit or restrained debounce |
| Pagination | Previous/Next + count | First/last page, loading; no infinite scroll for admin records |
| Confirmation dialog | Approval, access, role, lifecycle | Open, submitting, server error, success close; focus restore and keyboard containment |
| Inline notice | Info, warning, error, success, offline | Persistent when consequential; message and actionable recovery |
| Toast | Noncritical saved/refreshed feedback | Short-lived supplementary feedback; not sole error/success evidence |
| Empty state | No assignments, no records, no matching filters | Explain distinction and offer an action the viewer is allowed to take |
| Skeleton / progress | Cards, table, form submission | Stable layout; accompanying text; no fake percentage |
| Theme control | System, Light, Dark | Labelled selection; keyboard-operable |
| Event detail | Read-only metadata/change summary | Missing actor display fallback; no secrets or mutable event content |
| Integration checklist | Required checks with version/time | Passed, Failed, Not run; status comes from evidence |

Component behavior rules:

- Disable submission only while actually submitting or when a clear prerequisite is missing. Show why a prerequisite is missing.
- For ordinary validation, let users submit and receive specific field errors rather than leaving an unexplained disabled button.
- Unknown authorization means no sensitive action, not presumed permission.
- Do not present nonfunctional placeholder actions.
- An unavailable module keeps a readable reason; do not use an unlabeled disabled link.

## 8. Empty, Loading, Error, Success and Offline States

| Screen family | Empty | Loading | Error | Success | Offline |
| --- | --- | --- | --- | --- | --- |
| Public Home | No metrics needed | Reserve illustration area | Preserve core navigation if artwork fails | Page ready; no success banner | Explain connection is required for account actions |
| Sign In / Register | Labelled blank form | Submitting message; prevent duplicate submit | Specific safe form error; retain non-secret input | Route using actual account state | Keep typed non-secret input in memory; do not queue credentials |
| Verify / Account Status | Profile missing is an onboarding issue, not approval | Checking account status | Unable to verify; retry | Verified/approved only from backend | Status cannot be refreshed; do not assume approval |
| Recovery / Reset | Clear form instructions | Sending/resetting | Link invalid or operation failed | Generic email response / password changed | No queued recovery/reset action |
| Home / My Modules | No modules assigned | Stable card skeletons | Could not load modules; Retry | Authorized cards and actual availability | Show offline notice; do not open protected modules from stale grants |
| My Account | Missing optional title shown as Not provided | Profile skeleton | Unable to load account | Current account details | Stale data labelled; no claim that permissions are current |
| Admin Overview | No pending approvals | Metric placeholders, not zeroes | Per-section failure; no all-system failure unless appropriate | Accurate counts | Disable privileged mutations; do not cache admin directories persistently |
| Users / User Details | No users vs no matching users; no assignments | Table/detail skeleton | Access denied, load failure or conflict distinctly | Saved state and persistent summary | No approvals or assignments queued for reconnection |
| Catalogue / Module Details | No modules registered | List/form loading | Invalid metadata, denied action or integration failure | Saved metadata; activation separately confirmed | Preserve unsaved non-secret fields in memory only |
| Audit History | No events for filter | Table loading | Unable to retrieve events | Read-only events | Clear stale label; no claim that audit stream is current |
| System Health | Not Checked | Checking with timestamp context | Failed check distinct from failed retrieval | Actual result, including unhealthy outcomes | Unreachable from this device does not prove the module is globally down |
| Denied / Unavailable / Not Found | Not applicable | Only if retry is checking | The page itself explains the condition | Return to a safe destination | Safe local explanation; no claim a retry succeeded |
| Transport boundary | Module-defined empty state | Validate session and access | Access denied vs module unavailable | Open real module | No silent queue of transport writes |

### Writing and behavior

- Pending: `Your account is awaiting approval. Module access will be assigned separately.`
- No assignments: `Your account is approved, but no modules have been assigned yet.`
- Granted: `Access to Logistics & Transport has been granted.`
- Revoked: `Your access to this module has changed. Return to your workspace.`
- Conflict: `This record was updated by someone else. Review the latest version before saving.`
- Offline: `You appear to be offline. Changes cannot be saved right now.`
- Uncertain result after a timeout: `We could not confirm whether the change was saved. Refresh the record before trying again.`

Never use an optimistic success for approval, authorization or role changes. A successful health-check request does not mean the checked system is healthy.

Show business timestamps in Mozambique time with `UTC+02:00` explicitly labelled. The user's Taiwan-based classroom time does not silently change the application's operational timestamp display.

## 9. Responsive Behavior

### Mobile: below 768 px

- Single content column, 16 px outer padding, 16 px card padding.
- 56 px header with menu, compact wordmark and account access.
- Sidebar becomes a labelled modal navigation drawer; close it after navigation.
- Module cards stack; primary form buttons may span available width.
- Decorative hero illustration is reduced or removed before reducing form space.
- Dialogs use a near-full-width panel with safe viewport margins and internal scrolling when needed.
- User/module lists may become labelled record cards. Preserve data and actions; do not silently discard permission fields.
- Audit/relational tables may use a labelled horizontal-scroll region when their relationships require columns.

### Tablet: 768–1199 px

- 24 px content padding; up to two module-card columns.
- Use the same navigation drawer rather than an unlabeled icon-only rail.
- Forms remain bounded; metadata may use two columns when labels fit.
- Table controls wrap without horizontal page scrolling.

### Desktop: 1200 px and above

- Persistent 248 px sidebar; content padding 32 px.
- Public hero may use a 55/45 text/illustration composition.
- Module grid supports up to three columns; do not stretch a single module card across the entire page.
- Administration may use two content columns for summary/secondary information, not for long unrelated forms.
- Very wide screens keep the content maximum width.

### Cross-device rules

- Use content wrapping and flexible widths rather than fixed-height text cards.
- At 320 CSS px, content reflows without page-level horizontal scrolling except genuinely two-dimensional data.
- Check at 200% text zoom and 400% browser zoom.
- Sticky headers/actions must not cover focused elements, errors or final table rows.
- Preserve filters on return to a list; never encode secrets in URLs.
- Landing layout and navigation must still work with a long translated label later, although MVP copy is English.

## 10. Accessibility and Validation

Target WCAG 2.2 AA; this is an implementation target, not a conformance claim. Reference: [W3C WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/).

- Text contrast: at least 4.5:1 normally; 3:1 for qualifying large text. Necessary control/state graphics require 3:1 contrast.
- Support keyboard access, visible and unobscured focus, meaningful focus order and bypass navigation.
- Do not use color alone to convey status.
- Use persistent labels, clear instructions and programmatically associated errors.
- Announce important status messages without unnecessary focus movement.
- Permit password managers and pasting credentials.
- Respect reflow and text resizing.

### TCMS implementation checklist

- [ ] English document language, unique descriptive page titles and one primary heading.
- [ ] Native landmarks, buttons, links, inputs and tables before custom ARIA widgets.
- [ ] Skip to main content; `aria-current="page"` on the active navigation item.
- [ ] Focus order follows reading order; no positive tabindex values.
- [ ] A 3 px focus ring with a 2 px surface-colored gap stays visible on blue/green controls in both themes.
- [ ] Every interactive target is designed for at least 44 × 44 CSS px; this is the TCMS ergonomic target.
- [ ] Labelled reveal-password button describes its current action.
- [ ] Field errors connected through descriptions; invalid fields marked programmatically.
- [ ] On failed submission, focus the error summary or first invalid field without erasing entries.
- [ ] Dialog title/description, contained keyboard focus, Escape/Cancel behavior and trigger-focus restoration.
- [ ] `role="status"`/polite announcements for progress; assertive alerts reserved for blocking errors.
- [ ] Busy regions marked without repeated whole-page announcements.
- [ ] Header cells identify table columns; any sort button announces direction.
- [ ] Icons beside labels are decorative; icon-only controls have an accessible name.
- [ ] Decoration has no focusable or screen-reader-only noise.
- [ ] Reduced-motion, high-contrast and both theme modes tested.
- [ ] Screen-reader check for registration, approval and access deactivation.
- [ ] All actions work without hover or drag.
- [ ] No inaccessible puzzle is introduced as the only authentication path.

### Review gates before UI code is considered complete

1. Approve the proposed visual direction and initial screen layouts.
2. Check every core journey with an ordinary and privileged test account.
3. Verify both themes and all specified device widths.
4. Confirm the listed color combinations in rendered components.
5. Exercise empty, loading, error, success, offline and stale-data outcomes.
6. Confirm protected content does not flash before authorization resolves.
7. Confirm backend permission failures are represented accurately.
8. Record unfinished screens and functions instead of hiding them behind polished placeholders.

### First screen to design

Start with Sign In, Workspace Home and User Details/Module Access. Together they establish the public/account shell, authenticated shell and the most important administrative interaction. Review their layout before producing the remaining screens. The public landing illustration is secondary to these working flows.
