# HelioDesk API contract

All paths relative to origin; JSON request/response. Dates UTC ISO 8601 with Z suffix. No auth by brief. IDs URL-encoded. Requests with unexpected fields, repeated query keys or wrong types are 400. API-01 underpins FR-01–FR-11.

## Schemas
TicketSummary = {id:string,title:string,requester_name:string,requester_email:string,status:Status,priority:Priority,assignee:string|null,created_at:string,updated_at:string}.
Ticket = TicketSummary plus {description:string,notes:Note[]}.
Note = {id:integer,ticket_id:string,body:string,author:string,created_at:string}.
Status = open | in_progress | waiting_on_customer | resolved.
Priority = low | medium | high | urgent.

## Endpoints
| ID | Method/path | Input | Success |
|---|---|---|---|
| API-02 | GET /api/health | none | 200 {"status":"ok"}; executes database probe |
| API-03 | GET /api/tickets | query below | 200 {"data":[TicketSummary],"pagination":{"page":1,"pageSize":5,"totalItems":12,"totalPages":3}} |
| API-04 | GET /api/tickets/:id | existing ID | 200 Ticket; notes oldest-first, ID tie-breaker |
| API-05 | PATCH /api/tickets/:id | {"status":"in_progress","priority":"high"}; either/both fields | 200 saved Ticket |
| API-06 | POST /api/tickets/:id/notes | {"body":"Investigating the logs.","author":"Shayaan"} | 201 saved Ticket including new Note |

List params: q optional trimmed string, across ID/title/requester_name/requester_email, literal substring (%, _ treated literally); status/priority optional exact enums; sort=updated_at|priority|title default updated_at; order=asc|desc default desc; page positive integer default 1; page_size integer 1-20 default 5. Search/filter/sort before pagination. Priorities sort low < medium < high < urgent. ID ascending tie-breaker. Out-of-range page empty with accurate metadata; empty totalPages=0. Blank q means no search; blank enum is invalid (omit instead).

PATCH rejects missing/non-object JSON, {}, unknown fields, null/wrong-type/unknown enums. All transitions allowed. Valid no-op writes update timestamp. POST trims body and author, checks body 3-500 and author 1-80 characters, rejects unknown or missing fields. Failed validation changes neither ticket nor note table. Notes append only; successful append updates parent timestamp transactionally.

## Errors
All errors: {"error":{"code":"VALIDATION_ERROR","message":"Request validation failed","fields":{"priority":"Choose low, medium, high, or urgent"}}}.
- 400 VALIDATION_ERROR: query/body validation; fields key per input, json for malformed input.
- 404 NOT_FOUND: {"error":{"code":"NOT_FOUND","message":"Ticket not found","fields":{}}}.
- 405 METHOD_NOT_ALLOWED: incorrect HTTP method; JSON envelope.
- 500 INTERNAL_ERROR: generic message, no stack trace; server logs retain diagnostic context.
Non-JSON request body is 400 by this contract (including unsupported content type). Missing ticket checked before payload validation. Unhandled database failure rolls back.

## Examples
```sh
curl -fsS http://127.0.0.1:5000/api/health
curl -fsS 'http://127.0.0.1:5000/api/tickets?q=%20ALEX%20&status=open&priority=high&sort=priority&order=desc&page=1&page_size=5'
curl -fsS http://127.0.0.1:5000/api/tickets/HD-1001
curl -fsS -X PATCH http://127.0.0.1:5000/api/tickets/HD-1001 -H 'Content-Type: application/json' -d '{"status":"in_progress"}'
curl -fsS -X POST http://127.0.0.1:5000/api/tickets/HD-1001/notes -H 'Content-Type: application/json' -d '{"body":"Logs reviewed; investigating.","author":"Shayaan"}'
curl -i -X PATCH http://127.0.0.1:5000/api/tickets/HD-1001 -H 'Content-Type: application/json' -d '{"priority":"critical"}'
```
