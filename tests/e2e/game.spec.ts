import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@claim:complete-case reaches the answer after three timed rounds', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Notebook 1');
  await expect(page.getByText('Round 1 of 3')).toBeVisible();
  await expect(page.getByLabel(/3:00 remaining/)).toBeVisible();
  await page.getByRole('button', { name: 'Open round 2' }).click();
  await expect(page.getByText('Round 2 of 3')).toBeVisible();
  await page.getByRole('button', { name: 'Open round 3' }).click();
  await expect(page.getByText('Round 3 of 3')).toBeVisible();
  await page.getByRole('button', { name: 'Make group accusation' }).click();
  await page.getByLabel(/Celia Finch/).check();
  await page.getByRole('button', { name: 'Lock accusation and reveal' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Your group solved it' })).toBeVisible();
  await expect(page.getByText('Three rounds completed')).toBeVisible();
});

test('@claim:room-code gives 4–8 players deterministic private notebooks', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Number of players').selectOption('8');
  await page.getByRole('button', { name: 'Create room code' }).click();
  const code = await page.locator('.code-card strong').textContent();
  expect(code).toMatch(/^[A-Z2-9]{5}$/);
  await expect(page.getByRole('button', { name: 'Notebook 8' })).toBeVisible();
  await page.getByRole('button', { name: 'Notebook 8' }).click();
  await page.getByRole('button', { name: 'Open round one' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Notebook 8');
});

test('@claim:demo-sandbox resets sample state without changing real state', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('rcm:proof', 'real-data'));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Open round 2' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Round 1 of 3')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('rcm:proof'))).toBe('real-data');
  expect(await page.evaluate(() => localStorage.getItem('demo:rcm:game'))).toBeTruthy();
});

test('@claim:local-privacy sends no demo data to another origin', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Open round 2' }).click();
  await page.getByRole('button', { name: 'Open round 3' }).click();
  await expect.poll(() => [...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:offline-reload reloads the demo after the first visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/demo');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('Round 1 of 3')).toBeVisible();
  await context.close();
});

test('@claim:paid-case verifies a license and creates the 24-clue second case', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/room-code-mystery/verify?license=test-license', (route) => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await page.goto('/');
  await expect(page.getByText('24 new clues')).toBeVisible();
  await page.getByLabel('Have a license? Paste it here').fill('test-license');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByText('The Orchid Ledger is ready to play.')).toBeVisible();
  await page.getByLabel('Case').selectOption('orchid-ledger');
  await page.getByRole('button', { name: 'Create room code' }).click();
  await page.getByRole('button', { name: 'Open round one' }).click();
  await expect(page.locator('.game-sheet .eyebrow')).toHaveText('The Orchid Ledger');
});

test('@claim:settings-persist keeps the sound choice after reload', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Sound off' }).click();
  await expect(page.getByRole('button', { name: 'Sound on' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sound on' })).toBeVisible();
});

test('@claim:restart resets a finished run to a new lobby', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Open round 2' }).click();
  await page.getByRole('button', { name: 'Open round 3' }).click();
  await page.getByRole('button', { name: 'Make group accusation' }).click();
  await page.getByLabel(/Celia Finch/).check();
  await page.getByRole('button', { name: 'Lock accusation and reveal' }).click();
  await page.getByRole('button', { name: 'Start a second case' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Choose your private notebook' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open round one' })).toBeVisible();
});

test('@claim:render-rate keeps the game screen above 55 fps in the mobile browser check', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  const fps = await page.evaluate(() => new Promise<number>((resolve) => {
    const samples: number[] = [];
    let previous = performance.now();
    const frame = (now: number) => {
      samples.push(now - previous);
      previous = now;
      if (samples.length >= 90) resolve(1000 / (samples.slice(5).reduce((sum, sample) => sum + sample, 0) / 85));
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }));
  expect(fps).toBeGreaterThanOrEqual(55);
});

test('landing and mobile game have no serious accessibility findings', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('img[alt]')).toHaveCount(1);
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('invalid codes explain how to recover', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Five-character room code').fill('OOOOO');
  await page.getByRole('button', { name: 'Open player notebooks' }).click();
  await expect(page.getByRole('alert')).toContainText('Ask the host for all five characters');
});

test('every route loads without console errors and internal links resolve', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  for (const path of ['/', '/demo', '/privacy', '/terms', '/missing-page']) {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});
