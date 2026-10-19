# Deployment

## Requested target: Vercel frontend + Flask backend
Single Git repository, one Vercel project. `index.py` exports the Flask WSGI application. Root requirements declare Python runtime packages. Build installs locked frontend dependencies, compiles React, and copies assets to `public` for Vercel's CDN; Flask can also serve `frontend/dist`. Vercel handles HTTPS and routing to the Flask function.

`VERCEL` runtime selects `/tmp/heliodesk.db` and writable instance directory; import creates and seeds the schema. On local execution, default database remains durable under backend/instance. No fake frontend-only persistence is introduced.

**Important limitation:** Vercel does not supply a persistent local disk for this SQLite file. Demo changes can be lost on cold starts/redeploys and different function instances may have different data. Persistence after refresh is best-effort in the hosted demo, not guaranteed. This is disclosed in the app and README. The brief explicitly allows documenting hosting storage limitations while providing a fully reproducible local setup; live primary workflow must still be demonstrated.

Potential future resolution: run the unchanged Flask/SQLite service on one host with a persistent volume, or agree a remote persistent database with the reviewer. Do not silently substitute the required local SQLite assessment model.

## Steps
1. Push complete repository and meaningful history to GitHub; confirm public reviewer access.
2. Import repo in the user's Vercel account, repository root as project root, Flask framework, Python 3.12; retain configured build command.
3. Deploy, check build logs and /api/health. Inspect React dashboard.
4. Exercise search + filters, details, PATCH, note creation and refresh. Record public URL and storage caveat.
5. Verify URL anonymously; deployment protection must not block reviewers.

## Optional persistent host
`render.yaml` is a prepared **paid-plan** alternative with a 1GB mounted disk, single Gunicorn worker and four threads. It has NOT been provisioned and no charge is authorized. Build installs Python lock and frontend lock; startup seeds only an empty DB. DATABASE_URL points to `/var/data/heliodesk.db`.

References checked 19 October 2026:
- https://vercel.com/docs/frameworks/backend/flask
- https://vercel.com/kb/guide/ship-a-flask-app-on-vercel
- https://render.com/docs/disks
- https://flask.palletsprojects.com/en/stable/deploying/gunicorn/
