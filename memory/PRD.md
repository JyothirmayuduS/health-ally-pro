# Maple Hospital — Reception Management System (PRD)

## Problem statement (verbatim)
Reception is the front door of the hospital. Build a Hospital Reception Management
System with 7 core screens (Dashboard, Patient Registration, Patient Search &
Profile, Appointment Scheduling, Check-in, Queue Management, Token / Waiting
Room Display) plus future modules (Walk-in fast track, Billing at front desk,
Insurance & documents, Doctor on-duty directory, Notifications, Reports).

User design rules (explicit, verbatim):
- "dont use darkblues, gradients, glassmorphism"
- "this is for an hospital ok make it professional"
- "use mock data only" (confirmed during clarification)

## Architecture
- **Stack**: React 19 + React Router 7 + Tailwind 3 (shadcn UI components), Sonner for toasts.
- **State**: React Context (`/app/frontend/src/lib/store.js`) — patients, doctors, appointments live in-memory and reset on page refresh.
- **Mock seed data**: `/app/frontend/src/lib/mockData.js` — 5 doctors, 8 patients, 9 today-appointments, 15-min time slot grid.
- **No backend changes**: server.py untouched, no MongoDB writes.

## Design system
- Theme archetype: Organic & Earthy (Clinical Warmth, light theme).
- Palette: bone background `#F9F9F6`, sage primary `#2C5E4E`, soft sage `#E9F0EE`,
  ink scale, amber/sky/green/red status tokens. No dark blues. No gradients. No glass.
- Typography: Work Sans (headings), IBM Plex Sans (body), IBM Plex Mono (numbers, MRN, tokens).
- Component idiom: flat surfaces, 1px ink-200 borders, sharp-ish corners (`rounded-sm`),
  high density tables, status pills with dot + label, kbd-style mono badges.
- Token-display kiosk is the ONE exception to light theme (charcoal `#0e0f0d`).

## User persona
Reception desk staff at a multi-specialty OPD — needs to move quickly across
patient lookup, booking, check-in, queue control, and the lobby TV without ever
leaving the keyboard.

## Implemented (Feb 2026)
Routes built:
- `/reception` — Dashboard (5 live KPIs, 4 quick actions, per-doctor queue snapshot, upcoming today, footer ledger)
- `/reception/register` — Patient registration (demographics, emergency contact, medical & insurance, ID upload area, live duplicate-check via phone/name+DOB)
- `/reception/patients` — Patient list (search by name/MRN/phone) + detail panel (visit history, upcoming, balance, allergies)
- `/reception/appointments` — Day list with filter pills, doctor filter, prev/next/today nav, inline cancel/no-show actions
- `/reception/appointments/new` — Booking form: patient picker, doctor + date + visit type + duration + slot grid (taken slots disabled, conflict warning)
- `/reception/check-in` — Today's not-arrived list, search, one-click check-in that issues a per-doctor token, last-token receipt card, walk-in fast track entry
- `/reception/queue` — One card per on-duty doctor: now-serving, call-next, mark-complete, skip, re-call, transfer-to-another-doctor modal, mark-no-show, wait timer
- `/reception/token-display` — Lobby kiosk (no sidebar), one column per on-duty doctor, massive token numbers, next-up chips, live clock, full-screen toggle
- `/reception/billing` (Iter 2) — Invoice list (search + status pills) + detail pane with editable line items, discount, tax (5%), receipt totals; collect-payment dialog (Cash/Card/UPI/Insurance); auto-creates invoices for today's billable appointments
- `/reception/cash-drawer` (Iter 3) — Multi-shift drawer management. Live shift card with cash collected derived from invoices.paidAt ≥ shift.openedAt; Open shift / Close shift dialogs with denomination tally, variance calculation, handover note. Per-staff totals + closed-shift history table.
- `/reception/insurance` (Iter 3) — Pre-authorization workflow. Claim list with status pills (Pending/Submitted/Approved/Partial/Rejected/Not-required), claim detail with status-flow stepper, amounts, documents attach, and Submit/Approve/Partial/Reject actions.
- `/reception/reports` (Iter 2, expanded Iter 3) — 4-tab analytics: **Overview** (Footfall area chart, status mix donut, wait distribution, registrations donut), **Revenue** (cumulative trend with bars, by method horizontal bar, by doctor bar), **Operations** (no-show by doctor, doctor utilization radial-bar, wait buckets), **Insurance** (claims status donut, claims by provider horizontal bar, provider approval rate). Export CSV includes shifts + claims.

Design refresh (Iter 2 + 3):
- Module accent palette (earthy, non-blue): clay `#B85C38`, mustard `#A87826`, plum `#7A4A6B`, teal `#2C7873`, money `#15803D`.
- Pill button system (`.btn-primary` sage, `.btn-money`, `.btn-clay`, `.btn-plum`, `.btn-mustard`, `.btn-teal`, `.btn-outline`, `.btn-ghost`, `.btn-icon`).
- Chip system (`.chip-money`, `.chip-mustard`, `.chip-clay`, `.chip-plum`, `.chip-teal`, `.chip-sage`, `.chip-ink`).
- Section heading dots (`.dot-*`) used as small accent prefixes.
- Bumped `--radius` to `0.5rem` — every card, dialog, input is softly rounded (`rounded-md/xl`); buttons stay `rounded-full` pills.

All interactive + key informational elements expose kebab-case `data-testid` attributes.

## Test status
- Frontend testing agent (iteration_1.json): **100% pass**, no functional issues.
- Only finding: a dev-only hydration warning from the Emergent visual-edit wrapper around `<option>` children — mitigated by precomputing the option label string.

## Prioritized backlog
P0
- [ ] Real persistence layer (MongoDB) when user wants data to survive refresh.

P1
- [ ] Walk-in fast-track single flow (currently 2 clicks).
- [ ] Billing at front desk (consultation fee, copay, receipt) — link to /billing module.
- [ ] Doctor on-duty directory + room map screen.

P2
- [ ] SMS/email notifications (Twilio) — "Your turn" + appointment reminders.
- [ ] Reception reports (footfall, no-shows, avg wait, revenue at desk).
- [ ] Insurance pre-authorization workflow.
- [ ] Multi-branch switch + audit log.
- [ ] Staff auth (JWT) for shift handover & attribution.

## File map
```
/app/frontend/src
├── App.js                      routes + StoreProvider
├── App.css                     minimal
├── index.css                   font imports + CSS vars + utility classes
├── components
│   ├── AppLayout.jsx           sidebar + topbar (clock, global search, notif)
│   ├── Sidebar.jsx             nav + coming-soon items
│   └── StatusPill.jsx          status badge
├── lib
│   ├── mockData.js             seed: doctors, patients, appointments, slots
│   └── store.js                React Context store + actions
└── pages
    ├── Dashboard.jsx
    ├── Register.jsx
    ├── Patients.jsx
    ├── Appointments.jsx
    ├── NewAppointment.jsx
    ├── CheckIn.jsx
    ├── Queue.jsx
    └── TokenDisplay.jsx
```

## Notable env / tooling fixes
- `craco.config.js`: translated webpack-dev-server v4 options (`onAfterSetupMiddleware`,
  `https`) to v5 equivalents because the resolved dev-server in this template is v5.x.

## Next tasks
1. Confirm with user that mock-only is fine for first cut.
2. If user approves, layer in MongoDB persistence + minimal staff auth (P0).
3. Build Billing-at-desk module (P1) — likely highest-impact business feature.
