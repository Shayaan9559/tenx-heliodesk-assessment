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
| AC-10 | Pass (automated) | frontend rejected fetch -> alert -> Retry -> restored result; real browser outage showed the error and Retry button; recovery could not be completed because Chrome began blocking the local origin with ERR_BLOCKED_BY_CLIENT after backend restart (automated Retry test passes) |
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
