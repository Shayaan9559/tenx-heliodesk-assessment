"""Real local app with a disposable SQLite database, exclusively for browser E2E."""
import os
from pathlib import Path
from tempfile import TemporaryDirectory
from app import create_app
from app.models import db
from app.seed import seed_data

if __name__ == '__main__':
    # Explicit config overrides any production DATABASE_URL inherited by the shell.
    with TemporaryDirectory(prefix='heliodesk-e2e-') as directory:
        application = create_app({
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///' + str(Path(directory) / 'e2e.sqlite'),
            'SQLALCHEMY_ENGINE_OPTIONS': {},
            'FRONTEND_DIST': str(Path(__file__).resolve().parents[1] / 'frontend' / 'dist'),
        })
        with application.app_context():
            db.create_all()
            seed_data()
        application.run(host='127.0.0.1', port=int(os.getenv('E2E_PORT', '5063')), use_reloader=False)
