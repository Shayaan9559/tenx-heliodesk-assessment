from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import event
from sqlalchemy.engine import Engine
import sqlite3

db = SQLAlchemy()
STATUSES = ('open', 'in_progress', 'waiting_on_customer', 'resolved')
PRIORITIES = ('low', 'medium', 'high', 'urgent')


def now():
    return datetime.now(timezone.utc)


def iso(value):
    return value.replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z')


@event.listens_for(Engine, 'connect')
def sqlite_foreign_keys(connection, _):
    if isinstance(connection, sqlite3.Connection):
        connection.execute('PRAGMA foreign_keys=ON')


class Ticket(db.Model):
    id = db.Column(db.String(32), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    requester_name = db.Column(db.String(100), nullable=False)
    requester_email = db.Column(db.String(254), nullable=False)
    status = db.Column(db.String(32), nullable=False)
    priority = db.Column(db.String(16), nullable=False)
    assignee = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=now)
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=now, index=True)
    notes = db.relationship('Note', back_populates='ticket', cascade='all, delete-orphan',
                            order_by='(Note.created_at, Note.id)')
    __table_args__ = (
        db.CheckConstraint("status IN ('open','in_progress','waiting_on_customer','resolved')"),
        db.CheckConstraint("priority IN ('low','medium','high','urgent')"),
    )

    def serialize(self, detail=False):
        value = {name: getattr(self, name) for name in (
            'id', 'title', 'requester_name', 'requester_email', 'status', 'priority', 'assignee')}
        value.update(created_at=iso(self.created_at), updated_at=iso(self.updated_at))
        if detail:
            value.update(description=self.description, notes=[n.serialize() for n in self.notes])
        return value


class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.String(32), db.ForeignKey('ticket.id', ondelete='CASCADE'), nullable=False, index=True)
    body = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(80), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=now)
    ticket = db.relationship('Ticket', back_populates='notes')
    __table_args__ = (
        db.CheckConstraint('length(trim(body)) >= 3', name='note_body_minimum'),
        db.CheckConstraint('length(trim(author)) BETWEEN 1 AND 80'),
    )

    def serialize(self):
        return dict(id=self.id, ticket_id=self.ticket_id, body=self.body,
                    author=self.author, created_at=iso(self.created_at))
