"""Vercel WSGI entrypoint. Demo-only SQLite lives on ephemeral /tmp storage."""
import os
if os.getenv('VERCEL'):
    os.environ.setdefault('FLASK_INSTANCE_PATH', '/tmp/heliodesk-instance')
    os.environ.setdefault('DATABASE_URL', 'sqlite:////tmp/heliodesk.db')
from backend.app import create_app
from backend.app.models import db
from backend.app.seed import seed_data

app = create_app()
if os.getenv('VERCEL'):
    with app.app_context():
        db.create_all()
        seed_data()
