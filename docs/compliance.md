# Final brief compliance map

Baseline: Technical Assessment, candidate brief v2.0. Audited 20 October 2026. This maps the brief to reviewable source and evidence; it does not predict a hiring score.

| Brief requirement | Status | Implementation and evidence |
|---|---|---|
| Flask/Python 3.11+, React 18+, custom styling | Pass | [Python manifest](../backend/requirements.txt), [frontend manifest](../frontend/package.json), [CSS](../frontend/src/styles.css) |
| SQLite local assessment, relational tickets/notes | Pass | [models](../backend/app/models.py), foreign-key/seed tests, clean setup in [verification](verification.md) |
| Specify → contract → plan → tasks → implementation → verification | Pass | [spec](spec.md), [API](api.md), [plan](plan.md), [tasks](tasks.md), [commit history](https://github.com/Shayaan9559/tenx-heliodesk-assessment/commits/main/), AC evidence below |
| HTTP data flow and separation | Pass | [client](../frontend/src/api.ts), [routes](../backend/app/routes.py), [service](../backend/app/service.py); no browser database client |
| All five required REST endpoints and JSON error envelope | Pass | API-02–06 in [contract](api.md); [backend tests](../backend/tests/test_api.py) |
| Search/filter/sort/count/page before pagination | Pass | FR-01–03, API-03, AC-01–03; service query + combined-query tests |
| Priority urgent > high > medium > low | Pass | FR-03, AC-03; numeric database sort + tests |
| Reopen resolved tickets | Pass | FR-05, AC-05; unrestricted valid status transitions, persistence test |
| Timestamp only persists on successful write | Pass | FR-05–07, AC-04–07; transactional writes, failed-write rollback/non-mutation tests |
| Append-only notes; 3–500 non-whitespace chars; author required ≤80 | Pass | FR-07/08, API-06, AC-07/08; backend boundary tests, matching frontend counter; historical-data caveat in verification |
| Trimmed case-insensitive search; blank means no search | Pass with documented scope | FR-02, AC-02; SQLite ASCII lower() semantics, literal substring; Unicode case-fold limitation explicit |
| Query changes reset page; truthful out-of-range metadata | Pass | FR-03, AC-03; backend and frontend behavior tests |
| Oldest-first notes, newest-updated default tickets | Pass | FR-01/04, AC-01/04; service ordering and tests |
| 12+ varied deterministic seed, idempotent init and explicit reset | Pass | [seed](../backend/app/seed.py), README commands, isolated reset/foreign-key tests |
| All dashboard fields, full details, Save/Cancel/Add Note | Pass | [App](../frontend/src/App.tsx), [TicketDialog](../frontend/src/TicketDialog.tsx); updated time retained in compact layouts |
| Loading, empty, no-results, error/Retry, saving, success, validation, 404 | Pass | FR-09/10, AC-06/08–10; component tests and manual Retry recovery |
| Saved server response authoritative; stale response protection | Pass | FR-05/07/11, AC-05/07/11; canonical response, abort + generation guard tests |
| 320px, keyboard, focus/Escape/return, announcements, contrast | Pass for recorded workflows | FR-12/NFR-02, AC-12; Chrome manual steps, contrast measurements, responsive regression; broader audit limits explicit |
| Backend validation, parameterized queries, safe errors, UTC dates | Pass | NFR-01/API-01, service + models + routes; invalid payload, query safety and rollback tests |
| Configurable API/database, narrow origin, no secrets | Pass | [README](../README.md), [.env.example](../.env.example); same-origin/proxy avoids allow-all CORS |
| Working public deployment and persisted primary workflow | Pass with documented deployment choice | [live app](https://tenx-heliodesk-assessment.vercel.app), [health](https://tenx-heliodesk-assessment.vercel.app/api/health); hosted Postgres replaces ephemeral SQLite, local SQLite fully reproducible |
| ≥5 backend and ≥5 frontend tests, isolated database | Pass | 17 backend, 13 frontend; one additional real-browser E2E; [verification](verification.md) |
| AC-01–12 status, clean setup, browser/width/keyboard, API checks, limits | Pass | [verification](verification.md) contains each criterion and supporting evidence |
| README, five SDD docs, sources/tests/manifests/seed/config, meaningful commits | Pass | [final submission index](submission.md), repository history and linked files |
| No secrets/dependencies/database/build outputs committed | Pass in tracked-source audit | Hygiene audit; intentional walkthrough/evidence media retained |
| At most one optional bonus, explain trade-off | Pass | BONUS-01 E2E only; [test](../frontend/e2e/ticket-persistence.spec.ts), recording and explanation in verification |
| Submission URLs, actual effort, trade-off and reviewer access | Prepared | [technical index](submission.md); complete private submission email includes candidate effort; sending remains candidate action |

Hosted Postgres is an explicit deployment adaptation under the brief's persistent-SQLite hosting limitation guidance, not a claim that hosted storage is SQLite. No additional bonus options or unperformed browser/security audits are claimed.
