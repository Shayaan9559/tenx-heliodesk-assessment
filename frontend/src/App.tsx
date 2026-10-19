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
    <div className="workspace">
      <aside className="sidebar">
        <a className="brand" href="#main" aria-label="HelioDesk home">
          <span className="brand-mark">
            h<span>·</span>
          </span>
          <span>
            helio<span className="brand-light">desk</span>
          </span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <a className="nav-item active" href="#main">
          <Icon name="inbox" /> All tickets <span className="nav-dot" />
        </a>
        <div className="sidebar-feature" aria-hidden="true">
          <div className="orbit-art">
            <span />
            <span />
            <span />
            <Icon name="spark" />
          </div>
          <strong>
            Less noise.
            <br />
            More resolution.
          </strong>
          <p>A clear space for the work that matters.</p>
        </div>
        <div className="sidebar-bottom">
          <span className="connection-dot" /> Team workspace
          <span className="sidebar-footnote">
            A little clarity. Better support.
          </span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>All tickets</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="refresh-button"
              onClick={() => setRevision((v) => v + 1)}
              disabled={loading}
              aria-label="Refresh tickets"
            >
              <Icon name="refresh" />
            </button>
            <div className="team-badge">
              <span className="avatar small-avatar">HD</span>
              <span>Support team</span>
            </div>
          </div>
        </header>
        <main id="main">
          <section className="page-heading">
            <div>
              <div className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</div>
              <h1>
                Good support starts
                <br />
                with a clear next step<span className="accent">.</span>
              </h1>
              <p>Find the context. Move things forward. Make someone’s day.</p>
            </div>
            <div className="queue-summary">
              <div className="queue-summary-top">
                <span className="queue-icon">
                  <Icon name="inbox" />
                </span>
                <span className="live-badge">
                  <span className="connection-dot" />
                  {error
                    ? "Connection issue"
                    : loading
                      ? "Syncing"
                      : "Up to date"}
                </span>
              </div>
              <div className="queue-number">
                {loading ? "—" : total.toString().padStart(2, "0")}
                <Icon name="arrow" />
              </div>
              <span className="queue-caption">
                {filtered
                  ? "tickets in your current view"
                  : "conversations in the workspace"}
              </span>
            </div>
          </section>
          <section className="ticket-board" aria-labelledby="board-title">
            <div className="board-heading">
              <div className="section-line">
                <h2 id="board-title" tabIndex={-1}>
                  All tickets
                </h2>
                <span className="count-pill" aria-label="Ticket match count">
                  {loading ? "…" : total}
                </span>
              </div>
              <span className="board-caption">
                <span className="connection-dot" /> Your team’s shared inbox
              </span>
            </div>
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
                  <option value="">All statuses</option>
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
                  <option value="">All priorities</option>
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
                    <option value="desc">Descending ↓</option>
                    <option value="asc">Ascending ↑</option>
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
                      <th scope="col">Ticket / requester</th>
                      <th scope="col">Status</th>
                      <th scope="col">Priority</th>
                      <th scope="col">Assignee</th>
                      <th scope="col">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((ticket) => (
                      <tr key={ticket.id}>
                        <td className="ticket-cell">
                          <span className="ticket-id">{ticket.id}</span>
                          <button
                            className="ticket-link"
                            data-ticket-id={ticket.id}
                            onClick={() => setSelected(ticket.id)}
                          >
                            {ticket.title}
                          </button>
                          <span className="requester-line">
                            {ticket.requester_name}
                            <span aria-hidden="true"> · </span>
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
                            {ticket.assignee || "Unassigned"}
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
          <footer className="page-footer">
            <span>
              <span className="brand-dot">h·</span> Thoughtful support starts
              here.
            </span>
            <span>HelioDesk · Support workspace</span>
          </footer>
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
