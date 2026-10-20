import { useEffect, useRef, useState } from "react";
import {
  api,
  date,
  initialQuery,
  label,
  priorities,
  statuses,
  type ListResult,
  type Query,
} from "./api";
import TicketDialog from "./TicketDialog";
import Icon from "./Icon";

export default function App() {
  const [query, setQuery] = useState<Query>(initialQuery);
  const [result, setResult] = useState<ListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const generation = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    const current = ++generation.current;
    setLoading(true);
    setError("");
    api
      .list(query, controller.signal)
      .then((value) => {
        if (current !== generation.current || controller.signal.aborted) return;
        if (query.page > Math.max(1, value.pagination.totalPages)) {
          setQuery((previous) => ({
            ...previous,
            page: Math.max(1, value.pagination.totalPages),
          }));
          return;
        }
        setResult(value);
      })
      .catch((reason) => {
        if (
          current !== generation.current ||
          controller.signal.aborted ||
          reason.name === "AbortError"
        )
          return;
        setError(reason.message || "Could not load tickets. Please try again.");
      })
      .finally(() => {
        if (current === generation.current && !controller.signal.aborted)
          setLoading(false);
      });
    return () => {
      controller.abort();
    };
  }, [query, revision]);
  function change(key: keyof Query, value: string) {
    setQuery((previous) => ({ ...previous, [key]: value, page: 1 }));
  }
  const filtered = !!(query.q.trim() || query.status || query.priority);
  const total = result?.pagination.totalItems || 0;
  return (
    <div className={`workspace${selected ? " has-selection" : ""}`}>
      <aside className="sidebar">
        <a className="brand" href="#main" aria-label="HelioDesk home">HelioDesk</a>
        <a className="nav-item active" href="#main"><Icon name="inbox" /> Tickets</a>
        <div className="sidebar-bottom"><span className="avatar">HD</span><span className="online-dot" /><span className="sr-only">Support workspace</span></div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="topbar-label">Support workspace</span>
          <div className="topbar-actions">
            <button
              className="refresh-button"
              onClick={() => setRevision((v) => v + 1)}
              disabled={loading}
              aria-label="Refresh tickets"
            >
              <Icon name="refresh" />
              <span>Refresh</span>
            </button>
            <div className="team-badge">
              <span className="avatar small-avatar">HD</span>
              <span>Support team</span>
            </div>
          </div>
        </header>
        <main id="main">
          <section className="page-heading">
            <h1>Ticket workspace</h1>
            <p>{loading ? "Syncing your tickets…" : error ? "Tickets unavailable" : `${total} ${filtered ? "matching tickets" : "tickets across all channels"}`}</p>
          </section>
          <section className="ticket-board" aria-labelledby="board-title">
            <h2 id="board-title" className="sr-only" tabIndex={-1}>All tickets</h2>
            <form
              className="filters"
              onSubmit={(e) => e.preventDefault()}
              aria-label="Ticket query controls"
            >
              <label className="search-label">
                <span className="sr-only">Search tickets</span>
                <span className="search-symbol">
                  <Icon name="search" />
                </span>
                <input
                  type="search"
                  placeholder="Search ID, title or requester…"
                  value={query.q}
                  onChange={(e) => change("q", e.target.value)}
                />
              </label>
              <label>
                <span className="sr-only">Filter by status</span>
                <select
                  value={query.status}
                  onChange={(e) => change("status", e.target.value)}
                >
                  <option value="">Status: Any</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Filter by priority</span>
                <select
                  value={query.priority}
                  onChange={(e) => change("priority", e.target.value)}
                >
                  <option value="">Priority: Any</option>
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {label(p)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="reset-button"
                onClick={() => setQuery({ ...initialQuery })}
              >
                Reset
              </button>
              <div className="sort-controls">
                <label>
                  Sort by
                  <select
                    value={query.sort}
                    onChange={(e) => change("sort", e.target.value)}
                  >
                    <option value="updated_at">Last updated</option>
                    <option value="priority">Priority</option>
                    <option value="title">Title</option>
                  </select>
                </label>
                <label>
                  <span className="sr-only">Sort order</span>
                  <select
                    value={query.order}
                    onChange={(e) => change("order", e.target.value)}
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </label>
              </div>
            </form>
            <div className="results" aria-busy={loading}>
              {loading ? (
                <div className="state-panel" role="status">
                  <div className="loader" />
                  <h3>Finding your tickets</h3>
                  <p>Getting the latest from your workspace…</p>
                </div>
              ) : error ? (
                <div className="state-panel" role="alert">
                  <span className="state-icon">!</span>
                  <h3>We couldn’t load your tickets</h3>
                  <p>{error}</p>
                  <button onClick={() => setRevision((v) => v + 1)}>
                    Retry
                  </button>
                </div>
              ) : !result?.data.length ? (
                <div className="state-panel">
                  <span className="state-icon">⌕</span>
                  <h3>{filtered ? "No matching tickets" : "A clean slate"}</h3>
                  <p>
                    {filtered
                      ? "Try another search or clear your filters."
                      : "There are no tickets in this workspace yet."}
                  </p>
                  {filtered && (
                    <button onClick={() => setQuery({ ...initialQuery })}>
                      Reset filters
                    </button>
                  )}
                </div>
              ) : (
                <table>
                  <caption className="sr-only">
                    Support tickets matching current query
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">Title</th>
                      <th scope="col">Requester</th>
                      <th scope="col">Status</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Assignee</th>
                      <th scope="col">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className={selected === ticket.id ? "selected-row" : ""}
                        onClick={(event) => {
                          event.currentTarget.querySelector<HTMLButtonElement>(".ticket-link")?.focus({ preventScroll: true });
                          setSelected(ticket.id);
                        }}
                      >
                        <td className="id-cell"><span className="ticket-id">{ticket.id}</span></td>
                        <td className="ticket-cell">
                          <button
                            className="ticket-link"
                            data-ticket-id={ticket.id}
                          >
                            {ticket.title}
                          </button>
                          <time className="ticket-updated-inline" dateTime={ticket.updated_at} title={ticket.updated_at}>Updated {date(ticket.updated_at)}</time>
                        </td>
                        <td data-label="Requester"><span className="requester-line">
                            {ticket.requester_name}

                            <span>{ticket.requester_email}</span>
                          </span>
                        </td>
                        <td data-label="Status">
                          <span className={`status-badge ${ticket.status}`}>
                            <span className="status-dot" />
                            {label(ticket.status)}
                          </span>
                        </td>
                        <td data-label="Priority">
                          <span className={`priority ${ticket.priority}`}>
                            <span aria-hidden="true">
                              {ticket.priority === "urgent"
                                ? "⚑"
                                : ticket.priority === "high"
                                  ? "▴"
                                  : ticket.priority === "medium"
                                    ? "═"
                                    : "▾"}
                            </span>
                            {label(ticket.priority)}
                          </span>
                        </td>
                        <td data-label="Assignee">
                          <span
                            className={
                              ticket.assignee ? "assignee" : "unassigned"
                            }
                          >
                            {ticket.assignee ? <span className="avatar assignee-avatar" title={ticket.assignee}>{ticket.assignee.split(" ").map(w => w[0]).slice(0, 2).join("")}<span className="sr-only">{ticket.assignee}</span></span> : "Unassigned"}
                            {ticket.assignee && <span className="mobile-assignee-name" aria-hidden="true">{ticket.assignee}</span>}
                          </span>
                        </td>
                        <td data-label="Updated">
                          <time
                            dateTime={ticket.updated_at}
                            title={ticket.updated_at}
                          >
                            {date(ticket.updated_at)}
                          </time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <footer className="board-footer">
              <span aria-live="polite">
                {loading
                  ? "Loading…"
                  : error
                    ? "Tickets unavailable"
                    : total
                      ? `Showing ${(query.page - 1) * 5 + 1}–${Math.min(query.page * 5, total)} of ${total} matching tickets`
                      : "0 matching tickets"}
              </span>
              <nav className="pagination" aria-label="Ticket pages">
                <button
                  className="secondary"
                  disabled={loading || !!error || query.page <= 1}
                  onClick={() => setQuery((p) => ({ ...p, page: p.page - 1 }))}
                >
                  ← Previous
                </button>
                <span>
                  Page {query.page} of{" "}
                  {Math.max(1, result?.pagination.totalPages || 0)}
                </span>
                <button
                  className="secondary"
                  disabled={
                    loading ||
                    !!error ||
                    !result ||
                    query.page >= result.pagination.totalPages
                  }
                  onClick={() => setQuery((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Next →
                </button>
              </nav>
            </footer>
          </section>
        </main>
      </div>
      {selected && (
        <TicketDialog
          key={selected}
          id={selected}
          onClose={() => setSelected(null)}
          onSaved={() => setRevision((v) => v + 1)}
        />
      )}
    </div>
  );
}
