from flask import Blueprint, jsonify, request
from sqlalchemy import text
from .models import db
from . import service

api = Blueprint('api', __name__, url_prefix='/api')


@api.get('/health')
def health():
    db.session.execute(text('SELECT 1'))
    return jsonify(status='ok')


@api.get('/tickets')
def tickets():
    return jsonify(service.list_tickets(request.args))


@api.get('/tickets/<ticket_id>')
def detail(ticket_id):
    return jsonify(service.get_ticket(ticket_id).serialize(detail=True))


@api.patch('/tickets/<ticket_id>')
def patch(ticket_id):
    return jsonify(service.update_ticket(ticket_id, request.get_json(silent=True)))


@api.post('/tickets/<ticket_id>/notes')
def note(ticket_id):
    return jsonify(service.add_note(ticket_id, request.get_json(silent=True))), 201
