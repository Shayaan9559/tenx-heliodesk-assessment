# Verification evidence

## Current release audit — 20 October 2026

Application source: **9364940**.

Environment: macOS arm64, Python 3.11, Node 26.8.1, Chrome; automated browser test uses Playwright Chromium. **17 backend + 12 frontend + 1 E2E = 30 passing tests.** Strict TypeScript/Vite production build passes. Commands are in [README](../README.md). Results below distinguish local testing from hosted checks.

### Reproducible setup and automated verification
A fresh export of committed source was installed in a separate directory with a new virtual environment, pinned Python dependencies and `npm ci`. README setup created a clean SQLite database with 12 tickets. Running seed again preserved the records; explicit reset rebuilt the deterministic seed. Root HTML and API returned 200. Dependency audit reported zero known npm vulnerabilities at the time of checking.

After the final responsive corrections, all three suites and the production build were rerun. Backend tests use isolated SQLite databases; frontend behavior tests exercise the HTTP boundary with controlled responses. The real-browser E2E uses built React, actual Flask HTTP requests and a newly seeded temporary SQLite file, with no application mocks or hosted credentials.

| Command from repository root | Result |
|---|---|
| `cd backend && ../.venv/bin/pytest -q` | 17 passed |
| `npm test --prefix frontend` | 12 passed |
| `npm run test:e2e --prefix frontend` | Build passed; 1 Chromium test passed |

Backend coverage includes combined queries, priority/title order, pagination, missing tickets, invalid payloads, literal search/query safety, successful persistence, exact note boundaries, failed-write rollback, foreign keys, deterministic seed/reset, cache behavior and preservation of notes during migration. Frontend coverage includes query/page reset, loading/empty/no-results/error/Retry, canonical saves, field feedback, duplicate prevention, draft preservation, missing details, stale responses, row activation and focus restoration.

## Acceptance criteria
| ID | Local result | Evidence |
|---|---|---|
| AC-01 | Pass | backend test default five/metadata/order; frontend canonical rendering; Chrome dashboard |
| AC-02 | Pass | combined trimmed mixed-case search/filter backend test + frontend query test; real Chrome ' ALEX '/open/high yielded two tickets on seed |
| AC-03 | Pass | backend priority/title/order/page tests; frontend page reset/query encoding; UI pagination |
| AC-04 | Pass | detail GET notes order and no mutation test; frontend preserves priority filter on close; Chrome drawer |
| AC-05 | Pass | backend write + new-session inspection + refresh; frontend canonical saved response; Chrome saved in_progress then refresh retained it |
| AC-06 | Pass | backend invalid/unknown/wrong-type payloads leave detail unchanged; frontend server field error/retained input test |
| AC-07 | Pass | backend note exactly one new row + refresh; frontend duplicate-disabled POST; Chrome note persisted after refresh |
| AC-08 | Pass | direct HTTP whitespace/overlong/missing-author checks at backend boundary; React note validation |
| AC-09 | Pass | GET/PATCH/POST 404 tests; React missing-detail Close recovery |
| AC-10 | Pass | Automated rejected-fetch/Retry test; completed real Chrome HTTP 503 -> error -> restore API -> keyboard Enter on Retry -> five tickets and total 12 without navigation/reload. See manual Retry recovery below. |
| AC-11 | Pass | deferred fetch test resolves newest first and older later while transport ignores abort; old data cannot overwrite |
| AC-12 | Pass | Live Chrome 320px keyboard search/status/priority filters, open/edit/save, note entry, blank-note validation recovery, Escape and useful return focus. documentWidth=320; drawer clientWidth=scrollWidth=319. Core contrast spot checks pass; full screen-reader audit outside recorded coverage. |

## Manual browser and accessibility evidence

Chrome desktop and 320px checks exercised real Flask data, combined trimmed search/status/priority controls, native keyboard selection, opening details, editing, saving, note entry, validation correction and Escape. No frontend dataset or localStorage source of truth is used. Saved changes/notes remained after refresh. Validation preserved input and moved focus to the affected field. Successful edit/note saves focused Status/Note respectively. Closing returned focus to the ticket trigger; if a refreshed query removed that trigger, the queue heading was the fallback.

At 320px, document scrollWidth equalled innerWidth (320); dialog scrollWidth equalled clientWidth (319). Mobile cards have distinct borders, spacing and tinted headers. At desktop widths details are modeless so the queue remains interactive; below 1200px a native modal contains focus. The final regression also checks that last-updated time remains visible in the 900px compact table, 1440px split view and 320px cards, without page-level horizontal overflow.

Current navy/cobalt text/status/button contrast spot checks exceed 4.5:1: [measurements](evidence/contrast.md). Status and priority have text labels as well as color. [Desktop](evidence/final-live-desktop.png), [mobile](evidence/final-live-mobile.png), [field validation](evidence/final-mobile-validation.png).

### Manual Retry recovery
An isolated local verification wrapper returned a documented-shape HTTP 503 for GET /api/tickets while a temporary outage flag existed. Chrome showed the request-error state. After removing the flag, keyboard Enter on Retry loaded five rows and total 12 without navigation/reload. This verified HTTP failure recovery, rather than physically disconnecting the network. The temporary hook was outside the repository, never deployed and removed afterward. [Error](evidence/retry-error.png), [recovered](evidence/retry-recovered.png). AC-10 Pass, manual and automated.

## API contract and hosted verification

All five endpoints are exercised by the Flask test client, including 200/201, 400 field envelopes, 404, 405 and unexpected 500 rollback/error safety. Malformed JSON returns 400; the documented 16KiB operational request limit returns JSON 413. [API contract and executable curl examples](api.md).

Anonymous live checks verified health, five-row list/metadata, trimmed combined query, priority ordering, out-of-range page, invalid pagination, missing ticket and invalid edit/note responses. Invalid requests left the complete ticket and notes unchanged. Hosted PATCH persisted through an independent GET and original status/priority were restored. Earlier browser note checks persisted through refresh and redeployment; no note was appended during the final hosted audit. [Hosted results](evidence/final-live-results.json).

The repository, application, API and walkthrough PDF were accessible without login. HTML is no-store without conditional validators; content-hashed assets can cache immutably. API responses are no-store. The tracked-source scan found no real secrets, dependency directories, database files or generated app builds; `.env.example` is placeholder-only. Evidence media/PDF are intentional deliverables. [Audit record](evidence/final-audit.json).

## BONUS-01 — one automated E2E test

The test opens HD-1001, saves in_progress/urgent, appends a note, reloads/reopens and asserts persisted values/history. An independent GET verifies exactly one added note. Its final responsive assertions also check timestamp visibility and overflow. [Source](../frontend/e2e/ticket-persistence.spec.ts), [recorded persistence run](evidence/e2e-persistence.webm), [recorded result](evidence/e2e-result.json), [screenshot](evidence/e2e-persisted-ticket.png). Evidence recordings and the PDF are dated snapshots; fresh runs produce ignored HTML reports, trace ZIP, video and screenshots under frontend/playwright-report and frontend/test-results.

Only the E2E bonus option is claimed. Trade-off: a browser download and slower startup for repeatable cross-stack persistence evidence. It is one critical-path Chromium test, not complete cross-browser or hosted-Postgres coverage. Bonus scoring remains the hiring team's decision.

## Known limitations and scope

- SQLite is the default local/assessment database. Vercel lacks durable SQLite storage, so hosted writes use server-only Supabase Postgres through the same Flask service. This deployment choice and reproducible SQLite setup are explicit in [deployment.md](deployment.md).
- Chrome-focused manual checks and one Chromium E2E; Safari/Firefox, full screen-reader, load and security audits were not performed. No claim of formal accessibility certification.
- Authentication and ticket creation are excluded by scope. Data is synthetic and the public demo is editable; provider cold starts may occur.
- Demo history includes labelled verification notes, including one short note saved before the literal rule-4 correction. Existing append-only history was preserved; the current API rejects that input. No known current validation bypass is claimed.
- SQLite lower() supplies ASCII case-insensitivity; international Unicode case folding is not implemented.
- The six-page PDF records the 19 October walkthrough. This document records the newer final audit and corrections. Personalized effort and correspondence stay in the submission email.
