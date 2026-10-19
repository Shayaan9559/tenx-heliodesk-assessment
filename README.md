# HelioDesk

A support ticket workspace built for the Tenx full-stack assessment using Flask, React/TypeScript and SQLite locally, with Supabase Postgres for durable hosted data. Search/filter/sort/pagination run in Flask; ticket edits and append-only notes are transactional and persist locally after refresh.

## Review entry points
- [Specification](docs/spec.md), [API contract](docs/api.md), [architecture plan](docs/plan.md), [tasks](docs/tasks.md), [verification](docs/verification.md).
- [Engineering explanations and interview walkthrough](docs/engineering-notes.md).
- [Deployment and limitations](docs/deployment.md).
- Source: `backend/app`, `frontend/src`; tests: `backend/tests`, `frontend/src/App.test.tsx`.

## Prerequisites
Python 3.11+ (Vercel uses 3.12), Node 20.19+ or Node 22.12+, npm, Git. Commands below run from repository root unless stated. macOS/Linux shell; on Windows use `.venv\Scripts\python`/`flask` instead of `.venv/bin/...`.

## Clean setup and run (one server)
```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.lock.txt
npm ci --prefix frontend
npm run build --prefix frontend
cd backend
../.venv/bin/flask --app app seed
../.venv/bin/flask --app app run --host 127.0.0.1 --port 5000
```
Open http://127.0.0.1:5000. The development server is for local use. If macOS AirPlay occupies port 5000, choose 5001 and adjust the Vite proxy if using two-server development.

`seed` creates schema and 12 varied synthetic tickets if the database is empty; it never replaces existing tickets. Default SQLite file: `backend/instance/heliodesk.db`. `init-db` creates only schema. To deliberately discard demo edits and rebuild seed data:
```sh
cd backend
../.venv/bin/flask --app app reset-db --yes
```

## Two-server development
Keep Flask running on port 5000. In another terminal, from root:
```sh
npm run dev --prefix frontend
```
Open the Vite URL (default http://127.0.0.1:5173). `/api` is proxied to Flask; no broad CORS permission is needed. React always reads and writes through HTTP.

## Verify
```sh
cd backend
../.venv/bin/pytest -q
cd ..
npm test --prefix frontend
npm run build --prefix frontend
```
Backend tests use fresh temporary SQLite files, never the development database. Frontend tests mock HTTP responses and test visible behavior; native modal focus and mobile layout were checked in Chrome separately. See verification for executed checks and limitations.

## Configuration
`.env.example` lists optional variables; shell exports are supported (the app does not automatically load .env files).
- `DATABASE_URL`: default `sqlite:///heliodesk.db` relative to Flask instance path. Use `sqlite:////absolute/path/db.sqlite` for a durable hosted volume.
- Hosted `DATABASE_URL` accepts postgresql:// or postgresql+psycopg:// using the Supabase transaction pooler; SSL and disabled prepared statements are configured for psycopg. Never put this value in a VITE_* variable.
- `FLASK_INSTANCE_PATH`: optional absolute writable Flask instance folder.
- `VITE_API_BASE_URL`: optional frontend build-time API origin; default same origin. Separate-origin hosting would also need a deliberately scoped server CORS configuration; the delivered same-origin setup does not need it.
- `PORT`: hosting server bind port; used by hosting command, not by app configuration.
Never commit real secrets, the database, virtual environments or built assets.

## Architecture and decisions
The Flask factory supports isolated test configurations; SQLAlchemy models define relational persistence; service functions own query rules and writes; routes translate HTTP. React uses a small typed API layer and local component state. Aborted requests plus a generation guard prevent stale search results. Native dialog provides focus containment; field errors, semantic controls and live regions support keyboard/assistive use. Custom CSS handles table-to-card layout at small widths. UTC is serialized; browser local time is displayed with exact UTC timestamps in title attributes.

Trade-off: a simple monolith and pessimistic saves prioritize correctness and explainability over extra infrastructure or optimistic rollback. No authentication is included because the brief explicitly excludes it. All seeded identities are synthetic.

## Deployment status
- Live app: https://tenx-heliodesk-assessment.vercel.app
- API health: https://tenx-heliodesk-assessment.vercel.app/api/health
- Public repository: https://github.com/Shayaan9559/tenx-heliodesk-assessment

Verified without account credentials: root HTML, API health, combined queries, sorting, persisted edits/notes, validation and missing-ticket responses. Vercel hosts React and Flask; a dedicated Supabase Postgres database provides durable hosted storage. SQLite remains the reproducible local/test default. See docs/deployment.md and docs/verification.md.

## AI Usage
OpenAI Codex was used to interpret the brief, draft the specification/API/plan, generate implementation/tests/CSS, debug failures, and execute local verification/browser checks. The candidate must review and understand the submission; AI-generated code is not evidence by itself.

Corrected output: the initial generated form nested validation text inside labels, which changed accessible input names once an error appeared. Failing frontend tests exposed it; stable accessible labels corrected it, and the tests then passed. Initial development-tool versions were also rejected after audit findings and upgraded to audited versions. The note-save behavior deliberately preserves unsaved status/priority drafts and is covered by a behavior test.

Verification: isolated pytest HTTP/database tests, React Testing Library user-event tests at the HTTP boundary, strict TypeScript production build, real Chrome integration/persistence/320px/modal checks, and a clean setup check. Results and honest gaps are recorded in docs/verification.md. Do not claim independent manual authorship or unperformed checks.
