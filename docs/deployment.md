# Deployment

## Architecture
- GitHub: https://github.com/Shayaan9559/tenx-heliodesk-assessment (public source and meaningful history).
- Vercel: a single Flask project at repository root; React build copied to public/ for CDN, index.py exports WSGI app.
- Supabase: a dedicated Postgres database accessed only by Flask, using its transaction pooler; public Data API disabled.
- Local development/tests: SQLite under backend/instance by default. No external account is needed to run or verify locally.

The earlier ephemeral SQLite Vercel fallback was rejected after the user authorized Supabase. Hosted requests must never silently fall back to a local temporary file: missing hosted DATABASE_URL makes startup fail clearly.

## Configuration
Set server-only DATABASE_URL on Vercel to the dedicated Supabase transaction-pooler connection string (port 6543). The app accepts postgres://, postgresql:// or postgresql+psycopg://. Use URL encoding for special characters in passwords. Never put credentials in VITE_* variables, source, screenshots or Git. Frontend uses same-origin /api and requires no database key.

Psycopg uses SSL, 10-second connect timeout, and prepare_threshold=None for transaction pooling. SQLAlchemy NullPool avoids holding extra per-instance pools. Vercel uses Python 3.12 (.python-version); local Python 3.11+ supported. Build installs frontend lock, runs TypeScript/Vite, copies output to public. No need to deploy two disconnected projects or widen CORS.

## Initialization
At a Vercel cold start, a transaction-scoped Postgres advisory lock serializes create_all + empty-database seed. A nonempty database is unchanged. This is intentionally small-assessment bootstrapping; production schema evolution should use versioned migrations. All subsequent reads/writes use the same service layer as SQLite. Transactions protect note + parent timestamp changes.

## Release checks
1. Verify repository is public and history/docs/source/tests are accessible.
2. Import repository root as a **single Flask** project in the existing Vercel Hobby workspace; avoid inferred multiple-service mode.
3. Set DATABASE_URL before first deploy. No paid plan authorized.
4. Inspect build/runtime logs and /api/health.
5. Exercise combined query, edit and note flows; refresh and issue subsequent requests to prove hosted Postgres persistence.
6. Verify app URL without account credentials; do not leave reviewer access blocked by deployment protection.

## Known scope/operational limits
No authentication per brief; use synthetic assessment data only. Public demo writes are intentional. Free services can pause or cold-start. A narrowly scoped, idempotent rule-4 constraint migration runs under the initialization lock; a general versioned migration framework, concurrent-edit detection and idempotency key protocol are not claimed. Supabase and SQLite differ in case-insensitive Unicode behavior; ASCII seeded search is covered. Hosted Postgres must be integration-tested before claiming hosted success.

`render.yaml` remains an optional **unprovisioned paid** SQLite persistent-volume alternative; no charges were authorized. It is not the selected deployment.

## Official references checked 19 October 2026
- https://vercel.com/docs/frameworks/backend/flask
- https://vercel.com/kb/guide/ship-a-flask-app-on-vercel
- https://supabase.com/docs/guides/troubleshooting/using-sqlalchemy-with-supabase-FUqebT
- https://supabase.com/docs/guides/database/connecting-to-postgres
- https://flask.palletsprojects.com/en/stable/deploying/gunicorn/

## Published release
Live app: https://tenx-heliodesk-assessment.vercel.app
API: https://tenx-heliodesk-assessment.vercel.app/api/health
Public source and history: https://github.com/Shayaan9559/tenx-heliodesk-assessment

Vercel deployment succeeded on 19 October 2026. DATABASE_URL is stored as a sensitive server-only environment variable for Production and Preview. No database credential is present in source or frontend assets. Anonymous HTTP verification passed all primary API checks, including persisted writes and no mutation on invalid input. The hosted database is the dedicated Supabase project tenx-heliodesk.
