# Verification evidence

Date: 19 October 2026. Local macOS, Python 3.11, Node 20.19.0, Chrome. Hosted results tracked separately and must not be inferred from local tests.

## Executed automated checks
- `cd backend && ../.venv/bin/pytest -q`: **15 passed** after Postgres support was added; isolated temporary SQLite database per test.
- `npm test --prefix frontend`: **9 passed** after design refinement (Vitest 4.1.12, React Testing Library).
- `npm run build --prefix frontend`: strict TypeScript and Vite production build passed.
- `npm audit` from frontend: **0 known vulnerabilities** after upgrading development tooling; runtime and full audit checked. This is a point-in-time dependency check, not a security guarantee.
- Clean fresh database + built asset smoke check: factory, create schema/seed, root HTML 200, 12 tickets, PATCH 200, GET saved priority passed. Full clean committed-source checkout also completed: fresh venv/pinned pip install, npm ci, 14 backend tests, 9 frontend tests, production build, seed then idempotent seed all passed.

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

## Browser observations
- Initial UI loaded real Flask data; no frontend imported dataset or localStorage.
- Combined query found HD-1001 and HD-1009 before test edits.
- Updating HD-1001 to in_progress/high, then adding a note and reloading, preserved both. Subsequent mobile checks saved priority urgent and another note.
- At 320px, dashboard cards and drawer had no page-level horizontal overflow. Temporary viewport restored afterward.
- Validation without author retained note text and showed an author field error; filling author then keyboard-submit saved it.
- Core text/status/button contrast spot checks all exceed 4.5:1; see docs/evidence/contrast.md. Screenshots in docs/evidence show desktop, mobile and drawer. These will be refreshed after final visual checks.

## API contract checks
Real Flask test client exercises all five endpoints, success statuses 200/201, 400 envelope, 404 and 405, literal search, sort/pagination, seed/reset and unexpected 500 rollback. `docs/api.md` includes executable curl examples. Native JSON malformed input is deliberately 400. Request size above 16KiB returns handled JSON 413 (operational limit).

## Hosted verification — 19 October 2026
- Vercel deployment succeeded at https://tenx-heliodesk-assessment.vercel.app with Flask runtime and built React assets.
- Anonymous HTTP checks passed: health 200, default five results and accurate metadata, trimmed mixed-case combined query, priority ordering, successful PATCH followed by independent GET, invalid PATCH 400 with unchanged record, POST note 201 followed by independent GET, blank-note rejection without mutation, 404 and invalid pagination 400.
- Smoke check used HD-1001, appended one clearly labeled verification note and restored its original status/priority. Every request crossed the public Vercel URL into Flask and Supabase; this was not an in-process mock.
- Chrome independently loaded all 12 tickets and combined ' ALEX '/open/high produced HD-1001 and HD-1009. Chrome saved HD-1002 priority=high and appended a note, then a full browser reload/detail fetch retained both. Native keyboard selection of waiting_on_customer and Save succeeded at 320px. A lost-focus issue after save was found and corrected, with frontend focus assertions passing; post-deployment checks confirmed focus returns to Status after edit and Note after note save; validation focuses the invalid Note field.
- Public GitHub API confirmed the repository is public; no reviewer login is needed for source. Public API verification also required no Vercel account/session, confirming primary reviewer access.

## Remaining scope limits
No Safari/Firefox or full screen-reader certification performed. No production load/security audit claimed. Authentication is intentionally absent per brief and records are synthetic. Free provider cold starts remain possible. Total candidate time must be supplied honestly by the candidate; no invented duration.

## Release regressions corrected
- Native keyboard focus after disabling Save: focus returns to first invalid field or relevant status/note control; frontend focus assertions pass.
- Normalized static-file mtimes on Vercel could revalidate obsolete index.html. HTML now ignores conditional validators and is no-store; a new backend regression test passed. Final backend total: 15; frontend total: 9. Both corrections are covered by behavioral assertions rather than implementation-only checks.

## Final browser release checks
- Latest code loaded successfully after the cache correction; anonymous root response is 200, Cache-Control: no-store, with no HTML ETag or Last-Modified validator.
- Supabase browser note and ticket state remained present after two code redeploys, proving storage is not tied to the serverless filesystem.
- At 320px, native keyboard Space/type-letter/Return selected status and priority controls. Search ' ALEX ', open and high yielded two correct rows; UI query values confirmed open/high/updated_at/desc.
- Keyboard ticket Save succeeded. Updated focus remained inside the drawer on Status. Tab traversal reached note author/body/Add note; keyboard submission saved history and focused Note.
- Empty note validation focused Note; keyboard correction and resubmission succeeded. Escape closed the drawer and focused the dashboard heading when its original trigger was temporarily absent during list refresh.
- Final mobile document scrollWidth=innerWidth=320; dialog scrollWidth=clientWidth=319. Viewport override was restored.
- Evidence: live-dashboard.jpg, live-desktop-dialog.jpg, live-mobile-dashboard.jpg and live-mobile-dialog.jpg.


## Selected navy and cobalt redesign (19 October 2026)
The candidate selected the Precision Pro visual concept. Custom CSS now uses a midnight navy rail, cobalt actions/selection, white surfaces, compact typography and separate ID/title/requester columns. Assignee initials retain full names in accessible text and tooltips. At 1200px and above, details use a modeless native dialog beside the queue so the list stays interactive. Below 1200px the same component uses showModal for native focus containment; breakpoint changes reopen the appropriate presentation. Escape/close restore the original trigger, and existing save/error focus behavior is retained. Mobile renders ticket cards with no horizontal overflow at 320px. Search, combined filters, both sort controls, pagination, validation and server persistence are retained.

Verification: 15 backend tests and 10 frontend behavior tests, including the new modeless inspector/Escape/focus regression, plus strict TypeScript/Vite production build. Chrome checked the real local 320px queue/details and desktop split view.

## Rule 4 literal whitespace counting revision
17 backend and 12 frontend tests pass (29 total); strict TypeScript/Vite build passes. New regression cases reject two visible characters separated by whitespace, reject 501 non-whitespace characters, accept 3 and 500 with interior spaces/newlines/Unicode whitespace, retain note formatting and failed-write state, and preserve existing SQLite note data through an idempotent constraint migration. React counter and validation exclude whitespace with the same Unicode set as Python. Existing local databases use migrate-notes; hosted Postgres migrates under the initialization lock.

## Completed manual Retry recovery — 19 October 2026
Chrome on macOS, desktop viewport 1470px. An isolated local Flask verification wrapper at 127.0.0.1:5057 served the current built React assets and normal SQLite-backed service. A temporary before_request hook returned a documented-shape HTTP 503 for GET /api/tickets while a local outage flag existed. This hook was outside the repository and never deployed.

1. Opened the app with the API outage active. Chrome displayed “We couldn’t load your tickets”, the temporary outage message, and a working Retry button.
2. Removed the outage flag while keeping the same browser page and server running. No page reload or navigation was used.
3. Activated Retry with Enter. React displayed its loading state and made a fresh HTTP request.
4. The normal API response restored five ticket rows and “Showing 1–5 of 12 matching tickets”.
5. Saved before/after screenshots: [error](evidence/retry-error.png) and [recovered](evidence/retry-recovered.png). Stopped the temporary server afterward.

Result: **AC-10 Pass, manual and automated**. This completes the earlier interrupted browser check. The controlled failure reproduces an HTTP server error, rather than physically disconnecting the network. No application changes were required.

## BONUS-01: recorded automated end-to-end persistence test
**Pass — 19 October 2026.** `npm run test:e2e --prefix frontend`: **1 passed (3.9s)**, zero retries. Playwright 1.64.1, Chromium headless shell 156.0.8078.4, macOS arm64, Node 26.8.1, Python 3.11. Existing suite: 17 backend + 12 frontend tests passed; production TypeScript/Vite build passed. Total: **30 automated tests** across the three suites.

The built React app contacted real Flask over HTTP with an isolated freshly seeded SQLite database. The browser opened HD-1001, saved in_progress/urgent, appended a note, reloaded and reopened the ticket, and asserted the saved status, priority and note. An independent GET confirmed exactly one matching note. No HTTP mocks, hosted credentials or development data were used.

Evidence: [recording](evidence/e2e-persistence.webm), [saved ticket screenshot](evidence/e2e-persisted-ticket.png), [machine-readable result](evidence/e2e-result.json). Each fresh run also generates an ignored HTML report, trace ZIP, screenshot and video in frontend/playwright-report and frontend/test-results. Commands and setup are in README.

Only the automated E2E option is claimed for optional bonus. Trade-off: extra browser installation and slower startup in exchange for repeatable cross-stack persistence evidence. This is one critical-path desktop Chromium test, not full cross-browser or hosted-Postgres coverage. The first invocation preceded completion of the browser download and could not launch; after installation, the recorded run passed without retries. Bonus points remain the hiring team's decision.
