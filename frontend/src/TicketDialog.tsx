import { useEffect, useRef, useState } from "react";
import {
  api,
  ApiError,
  date,
  label,
  priorities,
  statuses,
  type Priority,
  type Status,
  type Ticket,
} from "./api";

type Props = { id: string; onClose: () => void; onSaved: () => void };
export default function TicketDialog({ id, onClose, onSaved }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState<Status>("open");
  const [priority, setPriority] = useState<Priority>("low");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const nextFocus = useRef<"ticket" | "note" | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (saving || !nextFocus.current) return;
    const fallback = nextFocus.current === "ticket"
      ? 'select[aria-label="Status"]'
      : 'textarea[aria-label="Note"]';
    const target = dialog.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"]',
    ) || dialog.current?.querySelector<HTMLElement>(fallback);
    nextFocus.current = null;
    target?.focus();
  }, [saving, fields]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      if (previous?.isConnected) previous.focus();
      else
        (
          (document.querySelector(
            `[data-ticket-id="${id}"]`,
          ) as HTMLElement | null) || document.getElementById("board-title")
        )?.focus();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setLoadError("");
    api
      .detail(id, controller.signal)
      .then((value) => {
        if (!active) return;
        setTicket(value);
        setStatus(value.status);
        setPriority(value.priority);
      })
      .catch((reason) => {
        if (!active || reason.name === "AbortError") return;
        setLoadError(
          reason instanceof ApiError && reason.status === 404
            ? "This ticket could not be found. Close this panel to return to your tickets."
            : "Could not load this ticket. Please try again.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [id, retry]);
  const changed =
    ticket && (status !== ticket.status || priority !== ticket.priority);
  async function save(kind: "ticket" | "note") {
    if (!ticket || savingRef.current) return;
    nextFocus.current = kind;
    setMessage("");
    setError("");
    setFields({});
    if (kind === "note") {
      const invalid: Record<string, string> = {};
      if (body.trim().length < 3 || body.trim().length > 500)
        invalid.body = "Enter 3–500 characters after trimming.";
      if (!author.trim() || author.trim().length > 80)
        invalid.author = "Enter your name (1–80 characters).";
      if (Object.keys(invalid).length) {
        setFields(invalid);
        setError("Please check the highlighted fields.");
        return;
      }
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const saved =
        kind === "ticket"
          ? await api.update(id, { status, priority })
          : await api.note(id, { body: body.trim(), author: author.trim() });
      setTicket(saved);
      // A note response must not discard an unsaved status/priority draft.
      if (kind === "ticket") {
        setStatus(saved.status);
        setPriority(saved.priority);
      } else {
        setBody("");
      }
      setMessage(
        kind === "ticket" ? "Ticket changes saved." : "Internal note added.",
      );
      onSaved();
    } catch (reason) {
      const failure = reason as ApiError;
      setFields(failure.fields || {});
      setError(
        failure.status === 404
          ? "This ticket is no longer available. Close the panel to return to your tickets."
          : failure.message ||
              "Could not save. Your input has been kept. Please try again.",
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="ticket-heading"
      onCancel={(event) => {
        event.preventDefault();
        if (!savingRef.current) onClose();
      }}
    >
      <div className="dialog-top">
        <span className="eyebrow">TICKET DETAILS</span>
        <button
          className="icon-button"
          aria-label="Close ticket details"
          disabled={saving}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <h2 id="ticket-heading">{id}</h2>
      {loading ? (
        <div className="panel-state" role="status">
          Loading ticket…
        </div>
      ) : loadError ? (
        <div className="panel-state" role="alert">
          <p>{loadError}</p>
          <button onClick={() => setRetry((v) => v + 1)}>Retry ticket</button>
          <button className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      ) : (
        ticket && (
          <>
            <h3 className="ticket-title">{ticket.title}</h3>
            <div className="requester">
              <span className="avatar">
                {ticket.requester_name
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <strong>{ticket.requester_name}</strong>
                <span>{ticket.requester_email}</span>
              </div>
            </div>
            <div className="description">
              <span className="eyebrow">CUSTOMER ISSUE</span>
              <p>{ticket.description}</p>
            </div>
            <dl className="ticket-meta">
              <div>
                <dt>Assigned to</dt>
                <dd>{ticket.assignee || "Unassigned"}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd title={ticket.created_at}>{date(ticket.created_at)}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd title={ticket.updated_at}>{date(ticket.updated_at)}</dd>
              </div>
            </dl>
            <form
              className="edit-form"
              onSubmit={(e) => {
                e.preventDefault();
                void save("ticket");
              }}
              aria-label="Update ticket"
            >
              <h3>Manage ticket</h3>
              <fieldset disabled={saving} className="edit-fields">
                <legend className="sr-only">Ticket status and priority</legend>
                <label>
                  Status
                  <select
                    aria-label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    aria-invalid={!!fields.status}
                    aria-describedby={
                      fields.status ? "status-error" : undefined
                    }
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {label(s)}
                      </option>
                    ))}
                  </select>
                  {fields.status && (
                    <span className="field-error" id="status-error">
                      {fields.status}
                    </span>
                  )}
                </label>
                <label>
                  Priority
                  <select
                    aria-label="Priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    aria-invalid={!!fields.priority}
                    aria-describedby={
                      fields.priority ? "priority-error" : undefined
                    }
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p}>
                        {label(p)}
                      </option>
                    ))}
                  </select>
                  {fields.priority && (
                    <span className="field-error" id="priority-error">
                      {fields.priority}
                    </span>
                  )}
                </label>
              </fieldset>
              <div className="form-actions">
                <button type="submit" disabled={saving || !changed}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={saving}
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </form>
            <section className="notes" aria-labelledby="notes-title">
              <div className="section-line">
                <h3 id="notes-title">Internal notes</h3>
                <span className="count-pill">{ticket.notes.length}</span>
              </div>
              <p className="muted small">
                A shared record for your support team.
              </p>
              {ticket.notes.length ? (
                <ol className="note-list">
                  {ticket.notes.map((note) => (
                    <li key={note.id}>
                      <div className="note-heading">
                        <strong>{note.author}</strong>
                        <time
                          dateTime={note.created_at}
                          title={note.created_at}
                        >
                          {date(note.created_at)}
                        </time>
                      </div>
                      <p>{note.body}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="empty-notes">
                  No notes yet. Add context for the next person.
                </p>
              )}
              <form
                aria-label="Add internal note"
                onSubmit={(e) => {
                  e.preventDefault();
                  void save("note");
                }}
                noValidate
              >
                <fieldset disabled={saving}>
                  <legend className="sr-only">New internal note</legend>
                  <label>
                    Your name
                    <input
                      aria-label="Your name"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      autoComplete="name"
                      placeholder="e.g. Shayaan Shahid"
                      aria-invalid={!!fields.author}
                      aria-describedby={
                        fields.author ? "author-error" : undefined
                      }
                    />
                    {fields.author && (
                      <span id="author-error" className="field-error">
                        {fields.author}
                      </span>
                    )}
                  </label>
                  <label>
                    Note
                    <textarea
                      aria-label="Note"
                      rows={3}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="What should your team know?"
                      aria-invalid={!!fields.body}
                      aria-describedby={`note-hint${fields.body ? " body-error" : ""}`}
                    />
                    <span id="note-hint" className="input-hint">
                      3–500 characters · {body.trim().length}/500
                    </span>
                    {fields.body && (
                      <span id="body-error" className="field-error">
                        {fields.body}
                      </span>
                    )}
                  </label>
                </fieldset>
                <button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Add note"}
                </button>
              </form>
            </section>
          </>
        )
      )}
      <div className="feedback" aria-live="polite" role="status">
        {message && <p className="success">✓ {message}</p>}
        {saving && <span>Saving your changes…</span>}
      </div>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </dialog>
  );
}
