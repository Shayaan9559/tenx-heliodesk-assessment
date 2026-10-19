"""Small idempotent migration for the rule-4 note length clarification."""
from sqlalchemy import inspect, text


def migrate_note_length(connection):
    if not inspect(connection).has_table('note'):
        return False
    if connection.dialect.name == 'postgresql':
        for constraint in inspect(connection).get_check_constraints('note'):
            rule = constraint['sqltext'].lower()
            # PostgreSQL normalizes BETWEEN into >= and <= in catalog output.
            if 'body' in rule and '500' in rule:
                name = connection.dialect.identifier_preparer.quote(constraint['name'])
                connection.execute(text(f'ALTER TABLE note DROP CONSTRAINT {name}'))
                connection.execute(text('ALTER TABLE note ADD CONSTRAINT note_body_minimum CHECK (length(trim(body)) >= 3)'))
                return True
        return False
    if connection.dialect.name == 'sqlite':
        definition = connection.execute(text("SELECT sql FROM sqlite_master WHERE type='table' AND name='note'")).scalar()
        old = 'length(trim(body)) BETWEEN 3 AND 500'
        if old not in definition:
            return False
        # Note is a leaf table: rebuild its constraint, retaining every row/id/date.
        replacement = definition.replace('CREATE TABLE note', 'CREATE TABLE note_rule4', 1).replace(old, 'length(trim(body)) >= 3')
        connection.execute(text(replacement))
        connection.execute(text('INSERT INTO note_rule4 SELECT * FROM note'))
        connection.execute(text('DROP TABLE note'))
        connection.execute(text('ALTER TABLE note_rule4 RENAME TO note'))
        connection.execute(text('CREATE INDEX ix_note_ticket_id ON note (ticket_id)'))
        return True
    raise RuntimeError('Unsupported database for note length migration')
