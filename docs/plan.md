# Implementation plan

## Architecture
One repo, Flask app factory + SQLAlchemy relational models + focused ticket service + thin API routes. React TypeScript client uses a typed HTTP module, dashboard state, and a focused details dialog. SQLite file configured by DATABASE_URL. Development uses Vite proxy; production Flask serves compiled assets with gunicorn. Single origin avoids unnecessary CORS complexity.

## Schema and flow
Ticket PK string; status/priority CHECK constraints, required fields, UTC timestamps. Note PK integer, FK ticket ON DELETE CASCADE, body/author and timestamp. Foreign keys enabled for each SQLite connection. Query layer builds parameterized conditions, sorts with numeric priority CASE and stable ID, counts before LIMIT/OFFSET. A write validates before changes then commits once; unexpected failure rolls back. Canonical detail returned only after commit.

React query controls -> state reset page 1 -> abortable HTTP GET -> results/metadata. Request generation additionally blocks stale results. Open ticket -> GET detail -> controlled drafts. PATCH/POST -> saving state -> canonical response replaces draft/history -> refresh active list. Validation retains draft. Dialog has native focus containment and custom return handling, aria labels/descriptions, live success/errors.

## Boundaries
backend/app/{__init__,models,service,routes,seed}.py. frontend/src/{api,App,TicketDialog,styles}. UI components contain presentation and interaction; HTTP parsing/error conversion is centralized. No global state library needed for this small app.

## CSS strategy
Hand-written tokens for spacing/color/radius, clear focus outlines, table desktop/card mobile layout, 320px wrapping, text labels alongside colored status dots. No UI framework. Native dialog reduces custom focus machinery. Dates localized for display with exact UTC in title.

## Risks and decisions
- Race conditions: abort + generation check; tests use deferred responses ignoring abort to verify guard.
- Duplicate saves: disable controls while saving; client guard. No distributed idempotency protocol claimed.
- SQLite ephemeral disks: one app instance with mounted persistent storage, or explicit demo limitation if unavailable.
- No authentication deliberately: deploy only synthetic data; anyone with link can edit demo.
- Timebox: prioritize required vertical slice, tests and evidence. No extra features except a single browser end-to-end check when feasible.
- Deployment tools/account access not yet established; never claim hosted verification before actually doing it.

## Verification
pytest temporary isolated SQLite file. React Testing Library + Vitest user-visible behavior at API boundary. Build includes strict tsc. Manual Chrome keyboard, 320px, persistence and error recovery; record exact checks and gaps. Clean setup in fresh directory/database. Requirement mapping and explanations in verification.md and engineering-notes.md. Commit docs before implementation, backend before frontend, and evidence after execution.
