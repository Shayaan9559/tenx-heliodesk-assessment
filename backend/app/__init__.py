import os
from pathlib import Path
from flask import Flask, jsonify, send_from_directory
from werkzeug.exceptions import HTTPException, NotFound as HTTPNotFound
from .models import db
from .service import ValidationError, NotFound


def create_app(config=None):
    frontend = Path(__file__).resolve().parents[2] / 'frontend' / 'dist'
    app = Flask(__name__, static_folder=None, instance_relative_config=True,
                instance_path=os.getenv('FLASK_INSTANCE_PATH'))
    app.config.update(SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL', 'sqlite:///heliodesk.db'),
                      SQLALCHEMY_TRACK_MODIFICATIONS=False, MAX_CONTENT_LENGTH=16 * 1024)
    if config:
        app.config.update(config)
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    db.init_app(app)
    from .routes import api
    from .seed import register_commands
    app.register_blueprint(api)
    register_commands(app)

    def error(code, message, status, fields=None):
        return jsonify(error=dict(code=code, message=message, fields=fields or {})), status

    @app.errorhandler(ValidationError)
    def validation(exc):
        db.session.rollback()
        return error('VALIDATION_ERROR', 'Request validation failed', 400, exc.fields)

    @app.errorhandler(NotFound)
    def missing(_):
        return error('NOT_FOUND', 'Ticket not found', 404)

    @app.errorhandler(HTTPException)
    def http_error(exc):
        return error(exc.name.upper().replace(' ', '_'), exc.description, exc.code)

    @app.errorhandler(Exception)
    def unexpected(exc):
        db.session.rollback()
        app.logger.exception('Unexpected error while handling request')
        return error('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500)

    @app.get('/')
    @app.get('/<path:path>')
    def frontend_files(path='index.html'):
        if path == 'api' or path.startswith('api/'):
            raise HTTPNotFound()
        if not frontend.exists():
            return error('FRONTEND_NOT_BUILT', 'Build frontend first, or use the Vite development server.', 404)
        # send_from_directory safely rejects directory traversal.
        return send_from_directory(frontend, path)

    return app
