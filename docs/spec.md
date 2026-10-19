# HelioDesk specification

Baseline: Tenx candidate brief v2.0. Scope: one support-agent interface, no authentication. Author: Shayaan Shahid with Codex assistance. This is the candidate specification, not a copy of the brief.

## Actors and stories
A support agent needs to find an issue, understand its history, update its lifecycle/urgency, and record an internal note. A reviewer needs reproducible setup and traceable evidence. No customer-facing account is implemented.

## Functional requirements
- FR-01 / AC-01: load five newest-updated ticket summaries and accurate count/page metadata from SQLite through HTTP.
- FR-02 / AC-02: trim and case-fold search across ID/title/requester name/email; intersect search with one optional status and priority filter.
- FR-03 / AC-03: sort by updated_at, numeric priority rank, or case-insensitive title, in either direction, before pagination. Default updated_at desc; stable ID ascending tie-breaker.
- FR-04 / AC-04: fetch canonical details including oldest-first notes. Opening/closing preserves list query and page.
- FR-05 / AC-05: PATCH status and/or priority atomically, return canonical details, advance updated_at only after commit; persist across refresh.
- FR-06 / AC-06: reject empty, invalid, unknown-field or wrong-type PATCH with 400 and field errors; leave stored record unchanged.
- FR-07 / AC-07: append one note per successful POST, with author; update parent timestamp; persist history chronologically.
- FR-08 / AC-08: trim note/author; reject body outside 3-500 characters, whitespace-only body, or author outside 1-80 characters. Backend is authoritative.
- FR-09 / AC-09: return JSON 404 for missing ticket; details offer Close to return to dashboard.
- FR-10 / AC-10: distinguish loading, empty database, no results, list failure with Retry, saving, success, field validation, and detail failure.
- FR-11 / AC-11: cancel stale list requests and guard results with request generation; latest query alone controls displayed data.
- FR-12 / AC-12: support keyboard-only workflows and 320px width with visible focus, semantic labels, modal focus trapping/Escape/return, field descriptions, live feedback, and text status labels.
- FR-13: deterministic idempotent seed inserts 12 tickets only into an empty database; explicit reset deletes and recreates assessment data.
- API-01: health, list, detail, PATCH and note endpoints follow docs/api.md, consistent ISO-8601 UTC timestamps and error envelope.

## Domain and rules
Ticket: unique string ID; title, description, requester name/email; enum status and priority; nullable assignee; created_at and updated_at. Note: integer ID, ticket foreign key, trimmed body/author, created_at. Status values open/in_progress/waiting_on_customer/resolved. Priority ascending low/medium/high/urgent. All status transitions are allowed, including resolved to open/in_progress. Notes are append-only. Client cannot set timestamps or edit title/requester/assignee.

## Nonfunctional requirements
- NFR-01: Flask/Python 3.11+, React 18+, SQLite; parameterized ORM queries, database foreign keys, rollback on failure; no direct client seed/localStorage data source.
- NFR-02: custom CSS tokens, semantic responsive table/cards, WCAG AA contrast target, reduced-motion support.
- NFR-03: reproducible local setup, dependency manifests, meaningful commits, no secrets/build artifacts committed.
- NFR-04: at least five backend and five frontend behavioral tests; isolated test database; AC evidence in docs/verification.md.
- NFR-05: working deployment required; describe SQLite storage persistence constraints and prove primary workflow on host.

## Explicit interpretations
1. Notes use the common trimmed-string length convention (3-500 characters after trimming); interior spaces count. Brief wording “non-whitespace characters” is ambiguous: this interpretation matches its whitespace-only/length rejection examples. Record this as an assumption for reviewers.
2. No-op PATCH with valid fields but unchanged values is accepted and treated as a successful write, advancing updated_at. Empty object is rejected.
3. Out-of-range page returns [] and truthful metadata; an empty database has totalPages=0. Invalid page/page_size is 400; API defaults page_size=5.
4. Unknown query keys and unknown body keys are rejected to catch client mistakes. Missing/invalid JSON returns 400.
5. Search uses SQLite lower() semantics (ASCII case-insensitivity); international Unicode case folding is a documented limitation.
6. Cancel or Escape discards unsaved changes; note author is entered explicitly because authentication is excluded.
7. Same-origin production serves React from Flask; Vite proxies /api in development. No CORS widening required.
8. On a mutation, reload the current list and retain query/page; if the changed ticket leaves a filter, it disappears. If page becomes invalid, move to the last valid page.
9. Repeated query parameters are rejected; no multi-select semantics. Note author/body must be strings; null and arrays are invalid.

## Out of scope
Ticket creation/deletion, login/roles, email, uploads, WebSockets, microservices, queues, production infrastructure and simultaneous-edit conflict resolution. SQLite supports a single-instance assessment deployment; production scaling is not claimed.

## Acceptance criteria
AC-01 through AC-12 have the exact behaviors above and must receive Pass/Partial/Fail/Not Tested in verification.md. An app is complete only after local behavior, evidence, clean setup and live primary workflow have been checked. Optional bonus: one browser end-to-end test if required scope is stable.

## Change log
- Initial specification created before implementation. Any justified changes are recorded here with reason and affected IDs.
- Hosted database update (user-approved): Vercel frontend + Flask function use dedicated Supabase Postgres for durable data; SQLite remains mandatory default local/test engine. SQLAlchemy keeps service/model behavior shared. NFR-05 now requires persistent hosted writes rather than the earlier ephemeral demo fallback. No Supabase browser client or public Data API is used; all reads/writes still pass through Flask.
- Accessibility refinement during live Chrome verification: after a save completes, focus moves to the first invalid field or the relevant status/note control; prevents lost keyboard position after disabling the submit button. FR-12/AC-12; added focus assertions to existing frontend behavior tests.
