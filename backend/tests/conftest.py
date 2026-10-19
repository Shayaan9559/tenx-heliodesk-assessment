import pytest
from app import create_app
from app.models import db
from app.seed import seed_data


@pytest.fixture()
def app(tmp_path):
    application = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': f'sqlite:///{tmp_path / "test.db"}'})
    with application.app_context():
        db.create_all()
        seed_data()
    yield application
    with application.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()
