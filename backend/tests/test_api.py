"""Behavior at HTTP/database boundary; requirement links in names and comments."""
from unittest.mock import patch
from sqlalchemy import select, func, text
from app.models import db, Ticket, Note


def test_ac01_health_default_list_and_metadata(client):
    assert client.get('/api/health').json == {'status': 'ok'}
    response = client.get('/api/tickets')
    assert response.status_code == 200
    assert response.json['pagination'] == dict(page=1, pageSize=5, totalItems=12, totalPages=3)
    assert [t['id'] for t in response.json['data']] == [f'HD-{i}' for i in range(1001,1006)]
    assert 'description' not in response.json['data'][0]


def test_ac02_combined_trimmed_case_insensitive_search(client):
    data = client.get('/api/tickets?q=%20aLeX%20&status=open&priority=high').json
    assert [t['id'] for t in data['data']] == ['HD-1001', 'HD-1009']
    assert data['pagination']['totalItems'] == 2
    assert client.get('/api/tickets?q=%20%20').json['pagination']['totalItems'] == 12


def test_ac03_priority_title_sort_and_pages(client):
    data = client.get('/api/tickets?sort=priority&order=desc&page_size=20').json['data']
    assert [t['priority'] for t in data] == ['urgent']*3 + ['high']*3 + ['medium']*3 + ['low']*3
    data = client.get('/api/tickets?sort=title&order=asc&page_size=20').json['data']
    assert [t['title'] for t in data] == sorted([t['title'] for t in data], key=str.lower)
    assert len(client.get('/api/tickets?page=3').json['data']) == 2
    assert client.get('/api/tickets?page=99').json['data'] == []


def test_ac04_details_and_notes_order_do_not_mutate(client):
    before = client.get('/api/tickets/HD-1001').json
    assert len(before['notes']) == 2
    assert before['notes'][0]['created_at'] < before['notes'][1]['created_at']
    assert client.get('/api/tickets/HD-1001').json == before


def test_ac05_patch_persists_across_new_request(client, app):
    before = client.get('/api/tickets/HD-1001').json
    response = client.patch('/api/tickets/HD-1001', json={'status':'resolved','priority':'urgent'})
    assert response.status_code == 200
    assert response.json['updated_at'] > before['updated_at']
    with app.app_context():
        ticket = db.session.get(Ticket, 'HD-1001')
        assert (ticket.status, ticket.priority) == ('resolved', 'urgent')
    assert client.get('/api/tickets/HD-1001').json == response.json
    assert client.patch('/api/tickets/HD-1001', json={'status':'in_progress'}).json['status'] == 'in_progress'


def test_ac06_invalid_patch_atomic_and_error_shape(client):
    before = client.get('/api/tickets/HD-1001').json
    for payload in ({}, {'status':'resolved','priority':'critical'}, {'status':None}, [], {'title':'no'}, {'priority': 3}):
        response = client.patch('/api/tickets/HD-1001', json=payload)
        assert response.status_code == 400
        assert response.json['error']['code'] == 'VALIDATION_ERROR'
        assert response.json['error']['fields']
        assert client.get('/api/tickets/HD-1001').json == before


def test_ac07_note_one_row_parent_timestamp_and_persistence(client, app):
    before = client.get('/api/tickets/HD-1001').json
    response = client.post('/api/tickets/HD-1001/notes', json={'body':'  Checked the logs.  ', 'author':'  Shayaan  '})
    assert response.status_code == 201
    assert response.json['notes'][-1]['body'] == 'Checked the logs.'
    assert response.json['notes'][-1]['author'] == 'Shayaan'
    assert response.json['updated_at'] > before['updated_at']
    with app.app_context():
        assert db.session.scalar(select(func.count()).select_from(Note)) == 3
    assert client.get('/api/tickets/HD-1001').json == response.json


def test_ac08_note_validation_bypass_does_not_write(client):
    before = client.get('/api/tickets/HD-1001').json
    for body, author in [('   ','Agent'), ('ab','Agent'), ('a'*501,'Agent'), ('valid',''), ('valid','a'*81), (None,'Agent')]:
        response = client.post('/api/tickets/HD-1001/notes', json={'body':body,'author':author})
        assert response.status_code == 400
        assert client.get('/api/tickets/HD-1001').json == before
    assert client.post('/api/tickets/HD-1001/notes', json={'body':'a'*500,'author':'a'*80}).status_code == 201


def test_ac09_missing_ticket_on_all_operations(client):
    for method, path in [('get','/api/tickets/missing'), ('patch','/api/tickets/missing'), ('post','/api/tickets/missing/notes')]:
        response = getattr(client,method)(path, json={})
        assert response.status_code == 404
        assert response.json['error']['code'] == 'NOT_FOUND'


def test_invalid_query_and_json(client):
    for query in ['page=0','page=-1','page=1.5','page_size=21','sort=no','order=up','status=no','priority=no','page=1&page=2','extra=yes','page='+('9'*100)]:
        assert client.get('/api/tickets?'+query).status_code == 400
    assert client.patch('/api/tickets/HD-1001', data='{bad', content_type='application/json').status_code == 400
    assert client.patch('/api/tickets/HD-1001', data='hello').status_code == 400
    assert client.delete('/api/tickets/HD-1001').status_code == 405
    assert client.get('/api/unknown').status_code == 404


def test_literal_search_and_sql_injection_safety(client):
    assert [t['id'] for t in client.get('/api/tickets?q=%25').json['data']] == ['HD-1011']
    assert client.get('/api/tickets?q=%27%20OR%201%3D1--').json['data'] == []
    assert client.get('/api/tickets').json['pagination']['totalItems'] == 12


def test_failed_write_rolls_back_without_exposing_exception(client):
    before = client.get('/api/tickets/HD-1001').json
    with patch('app.service.db.session.commit', side_effect=RuntimeError('private db details')):
        response = client.post('/api/tickets/HD-1001/notes', json={'body':'Valid note','author':'Agent'})
    assert response.status_code == 500
    assert 'private' not in response.get_data(as_text=True)
    assert client.get('/api/tickets/HD-1001').json == before


def test_fr13_seed_idempotent_and_reset_explicit(app):
    runner = app.test_cli_runner()
    assert 'unchanged' in runner.invoke(args=['seed']).output
    assert runner.invoke(args=['reset-db']).exit_code != 0
    assert runner.invoke(args=['reset-db','--yes']).exit_code == 0
    with app.app_context():
        assert db.session.scalar(select(func.count()).select_from(Ticket)) == 12
        assert db.session.execute(text('PRAGMA foreign_keys')).scalar() == 1


def test_empty_database_metadata(client, app):
    with app.app_context():
        db.session.query(Note).delete()
        db.session.query(Ticket).delete()
        db.session.commit()
    assert client.get('/api/tickets').json == dict(data=[], pagination=dict(page=1,pageSize=5,totalItems=0,totalPages=0))


def test_nfr03_new_release_html_never_revalidates_to_obsolete_asset(tmp_path):
    from app import create_app
    import os
    build = tmp_path / 'dist'
    build.mkdir()
    html = build / 'index.html'
    html.write_text('<script src="/assets/old.js"></script>')
    app = create_app({'TESTING': True, 'FRONTEND_DIST': str(build),
                      'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
    client = app.test_client()
    first = client.get('/')
    assert first.status_code == 200
    assert first.headers['Cache-Control'] == 'no-store'
    assert 'ETag' not in first.headers and 'Last-Modified' not in first.headers
    # Reproduce normalized mtimes + identical content length on a new release.
    html.write_text('<script src="/assets/new.js"></script>')
    os.utime(html, (1540000000, 1540000000))
    updated = client.get('/', headers={'If-Modified-Since': 'Wed, 01 Jan 2099 00:00:00 GMT',
                                      'If-None-Match': 'old-build-tag'})
    assert updated.status_code == 200
    assert b'/assets/new.js' in updated.data
    assert client.get('/api/health').headers['Cache-Control'] == 'no-store'
