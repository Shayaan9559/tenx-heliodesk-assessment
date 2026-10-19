# Verification evidence

Date: 19 October 2026. Local macOS, Python 3.11, Node 20.19.0, Chrome. Hosted results tracked separately and must not be inferred from local tests.

## Executed automated checks
- `cd backend && ../.venv/bin/pytest -q`: **14 passed** after Postgres support was added; isolated temporary SQLite database per test.
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
| AC-10 | Pass (automated) | frontend rejected fetch -> alert -> Retry -> restored result; real browser outage showed the error and Retry button; recovery could not be completed because Chrome began blocking the local origin with ERR_BLOCKED_BY_CLIENT after backend restart (automated Retry test passes) |
| AC-11 | Pass | deferred fetch test resolves newest first and older later while transport ignores abort; old data cannot overwrite |
| AC-12 | Partial | real Chrome 320px document width=320; dialog scrollWidth=clientWidth=319. Focus enters dialog, remains inside on backward traversal; Escape returns to ticket trigger. Keyboard note submission/validation exercised. Final design search typing, Enter-to-open/save and mobile edit rechecked; real outage recovery blocked by Chrome local-origin restriction; no screen-reader audit |

## Browser observations
- Initial UI loaded real Flask data; no frontend imported dataset or localStorage.
- Combined query found HD-1001 and HD-1009 before test edits.
- Updating HD-1001 to in_progress/high, then adding a note and reloading, preserved both. Subsequent mobile checks saved priority urgent and another note.
- At 320px, dashboard cards and drawer had no page-level horizontal overflow. Temporary viewport restored afterward.
- Validation without author retained note text and showed an author field error; filling author then keyboard-submit saved it.
- Core text/status/button contrast spot checks all exceed 4.5:1; see docs/evidence/contrast.md. Screenshots in docs/evidence show desktop, mobile and drawer. These will be refreshed after final visual checks.

## API contract checks
Real Flask test client exercises all five endpoints, success statuses 200/201, 400 envelope, 404 and 405, literal search, sort/pagination, seed/reset and unexpected 500 rollback. `docs/api.md` includes executable curl examples. Native JSON malformed input is deliberately 400. Request size above 16KiB returns handled JSON 413 (operational limit).

## Known gaps / release gate
Hosted Supabase database project/secret configuration and Vercel live workflow are pending. Public GitHub source has been pushed. Hosted Postgres behavior, anonymous deployment access and durable write verification must pass before final submission. No Safari/Firefox or full screen-reader certification performed. No production load/security audit claimed. Total candidate time must be supplied honestly by candidate; no invented duration.
