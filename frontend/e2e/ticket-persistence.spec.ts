import { test, expect } from '@playwright/test';

test('AC-04/05/07: real browser saves ticket and note, then reloads persisted data', async ({ page, request }) => {
  const note = 'E2E verification: ticket and note persist after browser refresh.';
  await page.goto('/');
  await expect(page.getByText('Showing 1–5 of 12 matching tickets', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Unable to access billing dashboard', exact: true }).click();
  let panel = page.getByRole('dialog');
  await expect(panel.getByRole('combobox', { name: 'Status', exact: true })).toHaveValue('open');
  await panel.getByRole('combobox', { name: 'Status', exact: true }).selectOption('in_progress');
  await panel.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('urgent');
  await panel.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(panel.getByText('✓ Ticket changes saved.', { exact: true })).toBeVisible();
  await panel.getByRole('textbox', { name: 'Your name', exact: true }).fill('E2E test');
  await panel.getByRole('textbox', { name: 'Note', exact: true }).fill(note);
  await panel.getByRole('button', { name: 'Add note', exact: true }).click();
  await expect(panel.getByText('✓ Internal note added.', { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Unable to access billing dashboard', exact: true }).click();
  panel = page.getByRole('dialog');
  await expect(panel.getByRole('combobox', { name: 'Status', exact: true })).toHaveValue('in_progress');
  await expect(panel.getByRole('combobox', { name: 'Priority', exact: true })).toHaveValue('urgent');
  await expect(panel.getByText(note, { exact: true })).toBeVisible();
  // Independent HTTP read confirms canonical backend data and exactly one new note.
  const response = await request.get('/api/tickets/HD-1001');
  expect(response.status()).toBe(200);
  const saved = await response.json();
  expect(saved.status).toBe('in_progress');
  expect(saved.priority).toBe('urgent');
  expect(saved.notes.filter((entry: { body: string }) => entry.body === note)).toHaveLength(1);
  await panel.getByRole('textbox', { name: 'Note', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('persisted-ticket.png'), fullPage: true });
});
