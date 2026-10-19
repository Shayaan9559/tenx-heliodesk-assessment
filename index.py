"""Vercel entrypoint: Flask API and durable hosted Postgres; SQLite locally."""
import os
if os.getenv('VERCEL'):
    os.environ.setdefault('FLASK_INSTANCE_PATH', '/tmp/heliodesk-instance')
from backend.app import create_app
from backend.app.models import db
from backend.app.seed import seed_data
from sqlalchemy import text

app = create_app()
if os.getenv('VERCEL'):
    if not os.getenv('DATABASE_URL', '').startswith(('postgres://', 'postgresql://', 'postgresql+psycopg://')):
        raise RuntimeError('Set DATABASE_URL to the dedicated hosted Postgres database before deployment.')
    with app.app_context():
        # Serialize schema/seed initialization across serverless cold starts.
        with db.session.begin():
            db.session.execute(text('SELECT pg_advisory_xact_lock(10421042)'))
            db.metadata.create_all(bind=db.session.connection())
            seed_data(commit=False)
