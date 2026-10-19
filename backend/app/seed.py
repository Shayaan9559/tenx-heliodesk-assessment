from datetime import datetime, timedelta, timezone
import click
from sqlalchemy import select, func
from .models import db, Ticket, Note, STATUSES, PRIORITIES

SEEDS = [
    ('Unable to access billing dashboard', 'Alex Morgan', 'alex.morgan@example.com', 'high', 'open', 'Maya Chen'),
    ('Export includes duplicate rows', 'Sam Patel', 'sam.patel@example.com', 'urgent', 'in_progress', 'Omar Ali'),
    ('Invite email never arrived', 'Alex Morgan-Smith', 'alex.smith@example.com', 'medium', 'waiting_on_customer', None),
    ('Workspace timezone needs updating', 'Jordan Lee', 'jordan.lee@example.com', 'low', 'resolved', 'Maya Chen'),
    ('Checkout returns a timeout', 'Taylor Reed', 'taylor.reed@example.com', 'urgent', 'open', None),
    ('Report totals differ from export', 'Robin Jones', 'robin.jones@example.com', 'high', 'in_progress', 'Omar Ali'),
    ('How to archive an old project', 'Casey Park', 'casey.park@example.com', 'low', 'waiting_on_customer', 'Maya Chen'),
    ('Profile image appears blurry', 'Jamie Rivera', 'jamie.rivera@example.com', 'medium', 'resolved', None),
    ('Search misses archived records', 'Alex Chen', 'alex.chen@example.com', 'high', 'open', 'Omar Ali'),
    ('Notification preferences reset', 'Drew Wilson', 'drew.wilson@example.com', 'medium', 'in_progress', None),
    ('Invoice shows 100% discount', 'Avery Kim', 'avery.kim@example.com', 'low', 'waiting_on_customer', 'Maya Chen'),
    ('API token stopped working', 'Morgan Blake', 'morgan.blake@example.com', 'urgent', 'resolved', 'Omar Ali'),
]


def seed_data(commit=True):
    if db.session.scalar(select(func.count()).select_from(Ticket)):
        return False
    base = datetime(2026, 10, 19, 9, 0, tzinfo=timezone.utc)
    for i, (title, name, email, priority, status, assignee) in enumerate(SEEDS):
        updated = base - timedelta(hours=i * 7)
        ticket = Ticket(id=f'HD-{1001+i}', title=title,
                        description=f'{name} reported: {title.lower()}. The issue affects their daily workspace tasks. Please investigate and share the next steps with the customer.',
                        requester_name=name, requester_email=email, status=status, priority=priority,
                        assignee=assignee, created_at=updated - timedelta(days=i + 1), updated_at=updated)
        if i == 0:
            ticket.notes = [Note(body='Customer confirmed the issue in two browsers.', author='Maya Chen', created_at=updated - timedelta(hours=2)),
                            Note(body='Billing service logs requested for investigation.', author='Omar Ali', created_at=updated - timedelta(hours=1))]
        db.session.add(ticket)
    if commit:
        db.session.commit()
    return True


def register_commands(app):
    @app.cli.command('init-db')
    def init_db():
        """Create schema without changing existing data."""
        db.create_all()
        click.echo('Database schema ready.')

    @app.cli.command('seed')
    def seed():
        """Create schema and insert deterministic demo data if empty."""
        db.create_all()
        click.echo('Created 12 demo tickets.' if seed_data() else 'Database has tickets; left unchanged.')

    @app.cli.command('reset-db')
    @click.option('--yes', is_flag=True, help='Confirm destruction of local demo data.')
    def reset_db(yes):
        """Destructively rebuild the configured demo database."""
        if not yes:
            raise click.ClickException('Pass --yes to confirm deleting all configured database data.')
        db.drop_all()
        db.create_all()
        seed_data()
        click.echo('Database reset to 12 demo tickets.')
