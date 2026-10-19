import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import App from "./App";
import { type Ticket } from "./api";

const ticket: Ticket = {
  id: "HD-1001",
  title: "Billing dashboard unavailable",
  description: "Customer cannot access billing.",
  requester_name: "Alex Morgan",
  requester_email: "alex@example.com",
  status: "open",
  priority: "high",
  assignee: null,
  created_at: "2026-10-18T09:00:00Z",
  updated_at: "2026-10-19T09:00:00Z",
  notes: [],
};
function list(data: Ticket[] = [ticket], total = 1, page = 1) {
  return {
    data,
    pagination: {
      page,
      pageSize: 5,
      totalItems: total,
      totalPages: Math.ceil(total / 5),
    },
  };
}
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi
    .fn()
    .mockImplementation((url: string) =>
      Promise.resolve(json(url.includes("/tickets?") ? list() : ticket)),
    );
  vi.stubGlobal("fetch", fetchMock);
});

it("AC-01 renders canonical tickets, match count and fields", async () => {
  render(<App />);
  expect(
    await screen.findByRole("button", { name: ticket.title }),
  ).toBeVisible();
  expect(screen.getByText("Showing 1–1 of 1 matching tickets")).toBeVisible();
  expect(screen.getByText("Unassigned")).toBeVisible();
});

it("AC-02/03 combines search/filter/sort, resets page and uses five per page", async () => {
  const user = userEvent.setup();
  fetchMock.mockImplementation((url: string) =>
    Promise.resolve(
      json(
        list(
          [ticket],
          12,
          new URL(url, "http://local").searchParams.get("page") === "2" ? 2 : 1,
        ),
      ),
    ),
  );
  render(<App />);
  await screen.findByText("Showing 1–5 of 12 matching tickets");
  await user.click(screen.getByRole("button", { name: "Next →" }));
  await screen.findByText("Showing 6–10 of 12 matching tickets");
  await user.type(
    screen.getByRole("searchbox", { name: "Search tickets" }),
    " ALEX ",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Filter by status" }),
    "open",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Filter by priority" }),
    "high",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Sort by" }),
    "priority",
  );
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Sort order" }),
    "asc",
  );
  await waitFor(() => {
    const params = new URL(fetchMock.mock.calls.at(-1)![0], "http://local")
      .searchParams;
    expect(Object.fromEntries(params)).toEqual({
      q: "ALEX",
      status: "open",
      priority: "high",
      sort: "priority",
      order: "asc",
      page: "1",
      page_size: "5",
    });
  });
});

it("AC-10 shows error and Retry recovers", async () => {
  const user = userEvent.setup();
  fetchMock.mockRejectedValueOnce(new TypeError("offline"));
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent("couldn’t load");
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(
    await screen.findByRole("button", { name: ticket.title }),
  ).toBeVisible();
});

it("FR-10 distinguishes loading, no results with reset, and empty database", async () => {
  let resolve!: (value: Response) => void;
  fetchMock.mockReturnValueOnce(
    new Promise<Response>((r) => {
      resolve = r;
    }),
  );
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByRole("status")).toHaveTextContent("Finding your tickets");
  resolve(json(list()));
  await screen.findByRole("button", { name: ticket.title });
  fetchMock.mockImplementation(() => Promise.resolve(json(list([], 0))));
  await user.type(screen.getByRole("searchbox"), "zzz");
  expect(await screen.findByText("No matching tickets")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Reset filters" }));
  expect(await screen.findByText("A clean slate")).toBeVisible();
});

it("AC-04/05 saves server response and preserves active query on close", async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("button", { name: ticket.title });
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Filter by priority" }),
    "high",
  );
  await user.click(await screen.findByRole("button", { name: ticket.title }));
  const dialog = screen.getByRole("dialog");
  await within(dialog).findByText(ticket.description);
  await user.selectOptions(
    within(dialog).getByRole("combobox", { name: "Status" }),
    "resolved",
  );
  fetchMock.mockImplementation((url: string, options?: RequestInit) =>
    Promise.resolve(
      json(
        options?.method === "PATCH"
          ? { ...ticket, status: "resolved" }
          : url.includes("?")
            ? list()
            : ticket,
      ),
    ),
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Save changes" }),
  );
  expect(
    await within(dialog).findByText("✓ Ticket changes saved."),
  ).toBeVisible();
  expect(within(dialog).getByRole("combobox", { name: "Status" })).toHaveValue(
    "resolved",
  );
  expect(
    fetchMock.mock.calls.some(
      ([, options]) =>
        options?.method === "PATCH" &&
        JSON.parse(options.body).status === "resolved",
    ),
  ).toBe(true);
  await user.click(
    within(dialog).getByRole("button", { name: "Close ticket details" }),
  );
  expect(
    screen.getByRole("combobox", { name: "Filter by priority" }),
  ).toHaveValue("high");
});

it("AC-06 server validation retains edit and connects field feedback", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole("button", { name: ticket.title }));
  const dialog = screen.getByRole("dialog");
  await within(dialog).findByText(ticket.description);
  await user.selectOptions(
    within(dialog).getByRole("combobox", { name: "Priority" }),
    "urgent",
  );
  fetchMock.mockResolvedValueOnce(
    json(
      {
        error: {
          message: "Request validation failed",
          fields: { priority: "Priority is invalid" },
        },
      },
      400,
    ),
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Save changes" }),
  );
  expect(await screen.findByText("Priority is invalid")).toBeVisible();
  const input = within(dialog).getByRole("combobox", { name: "Priority" });
  expect(input).toHaveValue("urgent");
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAccessibleDescription("Priority is invalid");
});

it("AC-07/08 validates note, posts once while saving, renders canonical history and retains unsaved draft", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole("button", { name: ticket.title }));
  const dialog = screen.getByRole("dialog");
  await within(dialog).findByText(ticket.description);
  await user.click(within(dialog).getByRole("button", { name: "Add note" }));
  expect(
    await within(dialog).findByText("Enter 3–500 characters after trimming."),
  ).toBeVisible();
  expect(within(dialog).getByRole("textbox", { name: "Note" })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await user.type(
    within(dialog).getByRole("textbox", { name: "Your name" }),
    "Shayaan",
  );
  await user.type(
    within(dialog).getByRole("textbox", { name: "Note" }),
    "Checked the logs.",
  );
  await user.selectOptions(
    within(dialog).getByRole("combobox", { name: "Status" }),
    "in_progress",
  );
  let resolve!: (value: Response) => void;
  fetchMock.mockImplementation((url: string, options?: RequestInit) =>
    options?.method === "POST"
      ? new Promise<Response>((r) => {
          resolve = r;
        })
      : Promise.resolve(json(list())),
  );
  await user.click(within(dialog).getByRole("button", { name: "Add note" }));
  expect(within(dialog).getByRole("textbox", { name: "Note" })).toBeDisabled();
  resolve(
    json(
      {
        ...ticket,
        notes: [
          {
            id: 1,
            ticket_id: ticket.id,
            body: "Checked the logs.",
            author: "Shayaan",
            created_at: "2026-10-19T10:00:00Z",
          },
        ],
      },
      201,
    ),
  );
  expect(await within(dialog).findByText("Checked the logs.")).toBeVisible();
  expect(within(dialog).getByRole("textbox", { name: "Note" })).toHaveValue("");
  expect(within(dialog).getByRole("combobox", { name: "Status" })).toHaveValue(
    "in_progress",
  );
  expect(
    fetchMock.mock.calls.filter(([, options]) => options?.method === "POST"),
  ).toHaveLength(1);
});

it("AC-09 missing details offers useful close recovery", async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("button", { name: ticket.title });
  fetchMock.mockResolvedValueOnce(
    json({ error: { message: "Ticket not found" } }, 404),
  );
  await user.click(screen.getByRole("button", { name: ticket.title }));
  expect(
    await within(screen.getByRole("dialog")).findByRole("alert"),
  ).toHaveTextContent("could not be found");
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("AC-11 older response cannot overwrite latest results even when transport ignores abort", async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("button", { name: ticket.title });
  const pending = new Map<string, (response: Response) => void>();
  fetchMock.mockImplementation(
    (url: string) =>
      new Promise<Response>((resolve) => {
        pending.set(
          new URL(url, "http://local").searchParams.get("q")!,
          resolve,
        );
      }),
  );
  await user.type(screen.getByRole("searchbox"), "ab");
  await waitFor(() => expect(pending.has("ab")).toBe(true));
  pending.get("ab")!(json(list([{ ...ticket, title: "Newest result" }])));
  expect(
    await screen.findByRole("button", { name: "Newest result" }),
  ).toBeVisible();
  pending.get("a")!(json(list([{ ...ticket, title: "Stale result" }])));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Stale result" }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("button", { name: "Newest result" })).toBeVisible();
});
