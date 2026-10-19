"""Ticket use cases. Routes handle HTTP; this module owns validation and persistence."""
import math
import re
from datetime import timedelta
from sqlalchemy import case, func, or_, select
from .models import db, Ticket, Note, STATUSES, PRIORITIES, now


class ValidationError(Exception):
    def __init__(self, fields):
        self.fields = fields


class NotFound(Exception):
    pass


def get_ticket(ticket_id):
    ticket = db.session.get(Ticket, ticket_id)
    if ticket is None:
        raise NotFound()
    return ticket


def list_tickets(args):
    allowed = {'q', 'status', 'priority', 'sort', 'order', 'page', 'page_size'}
    errors = {key: 'Unknown query parameter' for key in args if key not in allowed}
    for key in args:
        if len(args.getlist(key)) != 1:
            errors[key] = 'Supply this parameter only once'
    for key, choices in [('status', STATUSES), ('priority', PRIORITIES),
                         ('sort', ('updated_at', 'priority', 'title')), ('order', ('asc', 'desc'))]:
        if key in args and args[key] not in choices:
            errors[key] = 'Choose ' + ', '.join(choices)
    numbers = {}
    for key, default, maximum in [('page', 1, 2147483647), ('page_size', 5, 20)]:
        raw = args.get(key, str(default))
        if not re.fullmatch(r'[0-9]{1,10}', raw) or not 1 <= int(raw) <= maximum:
            errors[key] = f'Must be an integer from 1 to {maximum}'
        else:
            numbers[key] = int(raw)
    if errors:
        raise ValidationError(errors)
    query = select(Ticket)
    q = args.get('q', '').strip().lower()
    if q:
        # contains(autoescape=True) treats % and _ as literals, not LIKE syntax.
        query = query.where(or_(*(func.lower(getattr(Ticket, field)).contains(q, autoescape=True)
                                 for field in ('id', 'title', 'requester_name', 'requester_email'))))
    for field in ('status', 'priority'):
        if field in args:
            query = query.where(getattr(Ticket, field) == args[field])
    total = db.session.scalar(select(func.count()).select_from(query.subquery()))
    sort = args.get('sort', 'updated_at')
    expression = (case({p: i for i, p in enumerate(PRIORITIES)}, value=Ticket.priority)
                  if sort == 'priority' else func.lower(Ticket.title) if sort == 'title' else Ticket.updated_at)
    expression = expression.asc() if args.get('order', 'desc') == 'asc' else expression.desc()
    page, size = numbers['page'], numbers['page_size']
    tickets = db.session.scalars(query.order_by(expression, Ticket.id.asc()).offset((page - 1) * size).limit(size))
    return dict(data=[ticket.serialize() for ticket in tickets], pagination=dict(
        page=page, pageSize=size, totalItems=total, totalPages=math.ceil(total / size)))


def object_payload(payload, allowed):
    if not isinstance(payload, dict):
        raise ValidationError({'json': 'Send a JSON object'})
    errors = {key: 'Unknown field' for key in payload if key not in allowed}
    return errors


def advance_timestamp(ticket):
    previous = ticket.updated_at
    # SQLite returns naive UTC values. Ensure successive saved changes are distinguishable.
    from datetime import timezone
    previous = previous.replace(tzinfo=timezone.utc)
    ticket.updated_at = max(now(), previous + timedelta(microseconds=1))


def update_ticket(ticket_id, payload):
    ticket = get_ticket(ticket_id)
    errors = object_payload(payload, {'status', 'priority'})
    if not payload:
        errors['body'] = 'Supply status and/or priority'
    for field, choices in [('status', STATUSES), ('priority', PRIORITIES)]:
        if field in payload and (not isinstance(payload[field], str) or payload[field] not in choices):
            errors[field] = 'Choose ' + ', '.join(choices)
    if errors:
        raise ValidationError(errors)
    for field, value in payload.items():
        setattr(ticket, field, value)
    advance_timestamp(ticket)
    db.session.commit()
    return ticket.serialize(detail=True)


def add_note(ticket_id, payload):
    ticket = get_ticket(ticket_id)
    errors = object_payload(payload, {'body', 'author'})
    values = {}
    for field, minimum, maximum in [('body', 3, 500), ('author', 1, 80)]:
        value = payload.get(field)
        if not isinstance(value, str) or not minimum <= len(value.strip()) <= maximum:
            errors[field] = f'Must contain {minimum}-{maximum} characters after trimming'
        else:
            values[field] = value.strip()
    if errors:
        raise ValidationError(errors)
    ticket.notes.append(Note(**values))
    advance_timestamp(ticket)
    db.session.commit()
    return ticket.serialize(detail=True)
