# Engineering walkthrough and discussion guide

Read this with the source open. These explanations describe this implementation and its trade-offs; they are not a script for claiming work you did not personally understand. Run the app, change a rule, run its tests, and explain the result in your own words.

## 1. What did you build?
A first usable support ticket platform for the fictional HelioDesk team. Agents can find tickets using intersecting search/status/priority controls, sort and paginate them, inspect full detail, change lifecycle or urgency, and add internal notes. Flask owns validation and SQLite persistence; React owns presentation, drafts and asynchronous feedback. No login or ticket creation is added because that is outside the agreed scope.

## 2. What is Spec-Driven Development here?
The brief is a baseline. `spec.md` translates it into FR/NFR/AC identifiers and records ambiguous decisions. `api.md` defines exact inputs/outputs before integration. `plan.md` explains boundaries and risks; `tasks.md` maps implementation steps to requirements. `verification.md` maps each acceptance criterion to actual evidence. For example: FR-05 -> API-05 -> service.update_ticket -> PATCH route -> React save -> AC-05 backend/frontend checks. The first Git commit contains those planning documents, before implementation commits.

Why: a working screen alone does not prove the right behavior. A contract and evidence make disagreements visible and review possible. If behavior changes, update the spec and its change log rather than quietly departing from it.

## 3. Walk through one list request
1. React stores query controls and page in App state. Changing any query control sets page to 1.
2. api.list builds URLSearchParams and sends GET /api/tickets with page_size=5. It trims q; Flask repeats authoritative trimming/validation.
3. The service validates every enum and pagination number. Unknown/repeated keys are rejected rather than silently ignored.
4. SQLAlchemy builds parameterized WHERE conditions: substring OR across four searchable columns, then AND with active filters.
5. Count is computed for that complete predicate before pagination. Sorting uses a CASE priority rank (not alphabetical ordering) or normalized title/timestamp, with ID as deterministic tie-breaker.
6. OFFSET/LIMIT selects the page. API returns summaries and pagination metadata; React renders the canonical result and count.

Why backend-side? Filtering just the five currently displayed rows misses matches on other pages and gives incorrect counts. Sending all records to the browser does not scale and violates the brief.

## 4. How do you prevent stale searches?
Each effect aborts its predecessor and assigns a monotonically increasing request generation. Only the active generation may update list data, errors or loading state; cleanup also marks the request aborted. Abort saves unnecessary work, while the guard protects against transports that still resolve an older request. AC-11 test deliberately resolves the newer response before the old one and checks that old results do not appear. There is no debounce; correctness comes first, and a short debounce could reduce requests later.

## 5. Explain the database
Ticket has a human-readable string primary key and required issue/requester/state/timestamp fields. Assignee can be null. Note is a separate related entity with an integer primary key and non-null ticket foreign key. The FK and check constraints add database enforcement beyond service validation. SQLite foreign keys are explicitly enabled per connection. Note order is created_at then ID, so equal timestamps still give stable history.

Why separate Note rows? History is one-to-many, append-only, queryable and relationally linked. Storing concatenated note strings inside a ticket would make validation, ordering and atomic writes harder.

SQLite is appropriate for a small local assessment, not a claim of unlimited concurrent write capacity. Indexing updated_at helps the default list ordering; larger datasets would motivate query plans/search indexes and additional indexes.

## 6. Walk through a save
React controls a draft. It disables duplicate submissions and uses a synchronous ref guard while a save is pending. Flask checks that the ticket exists, validates the whole payload, and rejects unknown fields. Only status and priority are editable. After valid input, the service changes the model, advances updated_at and commits once. It then serializes the stored representation. React renders that response, shows success, and refreshes the active list.

Pessimistic saves are a deliberate trade-off: the interface waits for confirmation rather than pretending success and implementing rollback. If a ticket no longer matches a filter it disappears from that list. A now-invalid page moves to the last valid page. Opening, cancelling and invalid writes leave timestamps unchanged. A valid unchanged PATCH counts as a write by the documented interpretation.

## 7. Why transactions and rollback?
Adding a note and advancing its parent timestamp form one unit. Both must succeed or neither should persist. There is one commit; validation runs first. An unexpected write failure rolls the session back and logs diagnostic context server-side, while the API returns a generic JSON 500. The failure-injection backend test proves that a failed note write leaves detail/history unchanged and does not expose private exception text.

Do not equate a caught exception with durability. The database commit is the persistence boundary. Refresh/new request proves saved state is read back; local tests inspect a separate session as well.

## 8. Explain validation and HTTP status codes
200 reads and ticket updates; 201 appended note; 400 malformed/invalid input; 404 missing ticket; 405 unsupported method; 500 unexpected failure. All handled errors use error.code/message/fields. Field keys match React controls. Body must be an object, enums must be known strings, notes trimmed to 3-500 characters, author 1-80. Client checks help feedback, but direct HTTP requests can bypass them, so backend enforcement is essential.

Missing ticket is checked before payload validation. q is a literal substring: '%' and '_' do not become wildcard operators. ORM parameter binding prevents raw input from becoming SQL. This is not authentication; public demo users can edit synthetic records by design.

## 9. Why this React structure?
App owns query/list/loading/error/selection state. TicketDialog owns fetched detail, local drafts, note fields, saving and validation. api.ts owns request encoding, response errors and types. This keeps HTTP details out of presentation and avoids a global state library for two bounded workflows. TypeScript catches shape/enum misuse at development time but is not runtime input validation.

Note and ticket forms are independent. Adding a note refreshes canonical history but preserves an unsaved ticket draft. Closing discards drafts. API failure retains input, with field descriptions and a useful error; the user can correct it and retry. Duplicate prevention is client-side for this assessment, not a globally idempotent distributed API. A network failure after commit could leave an uncertain note outcome; production could add idempotency keys.

## 10. Accessibility and CSS
Semantic table headings on desktop become labeled cards at mobile widths. Custom CSS tokens keep colors/spacing consistent; text labels ensure status is not color-only. Controls have stable accessible names and visible focus outlines. Native dialog handles modal focus containment; opening focuses its close control, Escape closes when not saving, and cleanup returns focus to the trigger or dashboard heading if the list changed. Input errors are linked with aria-describedby; status/error live regions announce asynchronous outcomes. Reduced-motion preference disables animation.

320px verification checks both document and dialog scroll width, not just a screenshot. Real Chrome keyboard testing complements jsdom because jsdom does not implement native dialog behavior. Full screen-reader certification is not claimed; manual screen-reader coverage is a known gap.

## 11. Tests: what do they prove and what don't they prove?
Backend pytest creates a temporary database per test, seeds deterministic records, then exercises real Flask HTTP handlers and SQLAlchemy writes. Covers default order/count, combined queries, pagination, literal search, writes, validation, 404, rollback and CLI seed/reset. Frontend Testing Library mocks fetch at the HTTP boundary and drives user controls: combinations/page reset, loading/empty/error recovery, canonical edit, field validation, note saving and stale responses.

Mocks prove UI behavior under controlled responses, not network/deployment correctness. Browser integration proves actual frontend-to-backend flows locally. Production build proves TypeScript/build validity. A separate clean setup check guards against hidden reliance on the developer's existing database. Hosted verification must be recorded separately; a successful local build alone is not a deployed app.

## 12. Deployment explanation
The user chose Vercel for both React and Flask and authorized Supabase for durable hosted storage. SQLite remains the default local/test database to comply with the assessment. SQLAlchemy models and services are shared; hosted DATABASE_URL selects Postgres via psycopg, a transaction pooler, SSL, no automatic prepared statements and NullPool. This avoids relying on Vercel's ephemeral disk. All browser requests still go through Flask; Supabase Data API is disabled and database credentials stay in server-only Vercel environment.

The application initializes schema/seed inside a transaction with an advisory lock so simultaneous serverless starts cannot seed duplicates. The seed command does not replace nonempty data. This is adequate for a small assessment deployment; production would use reviewed migrations rather than create_all at startup. Record hosted integration evidence separately from SQLite tests: passing tests against one SQL dialect is not proof of the other.

## 13. Trade-off and next improvements
Submission trade-off: use a small monolith, server-confirmed saves and custom CSS instead of extra infrastructure/optimistic UI, to prioritize traceable correctness within the timebox. Known production work: durable hosted database, authentication/authorization, migrations, concurrent-edit conflict handling, idempotent note requests, broader browser/screen-reader checks and operational monitoring. These are intentionally distinguished from requirements left untested.

## 14. Demonstration (5-8 minutes)
1. Start with README, spec IDs, contract, commits and verification table.
2. Show five tickets, total and next page. Search ' ALEX ', status open, priority high; show combined result and page reset.
3. Open details, point to preserved controls, notes and explicit author.
4. Change status/priority, save and refresh to prove local persistence.
5. Add a note; show chronology; send an invalid request using docs/api.md examples and show unchanged data.
6. Show 320px/keyboard Escape and return focus.
7. Run tests; explain one backend failure and one stale-response test.
8. Explain local SQLite versus hosted Supabase, deployment checks and your trade-off without overstating completeness.

## Before speaking to the reviewer
Be able to locate and explain the query builder, commit/rollback boundary, API client, effect cleanup, note validation and modal lifecycle. Try predicting what happens for page=0, priority=critical, q='%', a blank note, an old search finishing last, a resolved ticket reopened and a failed database commit. Then run the corresponding tests. Disclose AI assistance as README describes, and use the actual total time spent rather than inventing it.

## Browser-discovered focus correction
A real Chrome mobile walkthrough revealed that disabling the currently focused Save button could move keyboard focus out of the page. The dialog now records which form was submitted and, after saving finishes, focuses the first invalid field or the status/note control. This preserves keyboard continuity after success and error. Frontend behavior tests assert focus after a ticket save and after a note save; this was discovered in a real browser because jsdom does not reproduce all native focus behavior automatically.

## Deployment-discovered HTML cache correction
Vercel's build bundle normalized static-file timestamps. Two index.html builds could therefore have the same timestamp, size and path-based ETag while referencing different hashed JavaScript files. A browser conditional reload could receive 304 for obsolete HTML and then fail to find the old asset. The Flask HTML response now bypasses conditional handling, sends Cache-Control: no-store, and omits ETag/Last-Modified; hashed assets can be cached immutably, and API responses are also no-store. A regression test simulates unchanged HTML length and normalized mtime, then sends stale conditional headers and requires the new asset reference with HTTP 200.


## Selected navy and cobalt redesign (19 October 2026)
The candidate selected the Precision Pro visual concept. Custom CSS now uses a midnight navy rail, cobalt actions/selection, white surfaces, compact typography and separate ID/title/requester columns. Assignee initials retain full names in accessible text and tooltips. At 1200px and above, details use a modeless native dialog beside the queue so the list stays interactive. Below 1200px the same component uses showModal for native focus containment; breakpoint changes reopen the appropriate presentation. Escape/close restore the original trigger, and existing save/error focus behavior is retained. Mobile renders ticket cards with no horizontal overflow at 320px. Search, combined filters, both sort controls, pagination, validation and server persistence are retained.

Verification: 15 backend tests and 10 frontend behavior tests, including the new modeless inspector/Escape/focus regression, plus strict TypeScript/Vite production build. Chrome checked the real local 320px queue/details and desktop split view.
