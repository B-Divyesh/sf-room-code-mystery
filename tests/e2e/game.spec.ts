import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@claim:complete-case reaches the answer after three timed rounds', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Notebook 1');
  await expect(page.getByText('Round 1 of 3')).toBeVisible();
  await expect(page.getByLabel(/3:00 remaining/)).toBeVisible();
  await page.getByRole('button', { name: 'Open round 2' }).click();
  await expect(page.getByText('Round 2 of 3')).toBeVisible();
  await expect(page.getByLabel(/3:00 remaining/)).toBeVisible();
  await page.getByRole('button', { name: 'Open round 3' }).click();
  await expect(page.getByText('Round 3 of 3')).toBeVisible();
  await expect(page.getByLabel(/3:00 remaining/)).toBeVisible();
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

test('@claim:local-privacy keeps the complete demo flow on this origin', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', (request) => origins.add(new URL(request.url()).origin));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Open round 2' }).click();
  await page.getByRole('button', { name: 'Open round 3' }).click();
  await page.getByRole('button', { name: 'Make group accusation' }).click();
  await page.getByLabel(/Celia Finch/).check();
  await page.getByRole('button', { name: 'Lock accusation and reveal' }).click();
  await expect(page.getByText('Correct accusation')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('demo:rcm:game') ?? '{}').accusation)).toBe('celia');
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

test('service worker update activates the current cache and removes the old cache', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/demo');
  const cacheKeys = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return caches.keys();
  });
  expect(cacheKeys).toContain('room-code-mystery-v2');
  expect(cacheKeys).not.toContain('room-code-mystery-v1');
  await context.close();
});

test('@claim:paid-case states checkout is unavailable and restores an existing license', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/room-code-mystery/verify?license=test-license', (route) => route.fulfill({ json: { valid: true, reason: 'ok', expires_at: null } }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'The Orchid Ledger is not for sale' })).toBeVisible();
  await expect(page.getByText('New checkout is unavailable.')).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
  await page.getByLabel('Already have an Orchid Ledger license? Paste it here').fill('test-license');
  await page.getByRole('button', { name: 'Verify existing license' }).click();
  await expect(page.getByText('The Orchid Ledger is ready to play.')).toBeVisible();
  await page.getByLabel('Case').selectOption('orchid-ledger');
  await page.getByRole('button', { name: 'Create room code' }).click();
  await page.getByRole('button', { name: 'Open round one' }).click();
  await expect(page.locator('.game-sheet .eyebrow')).toHaveText('The Orchid Ledger');
});

test('@claim:timer-focus timer updates preserve keyboard focus and Space pauses the round', async ({ page }) => {
  await page.goto('/demo');
  const pause = page.getByRole('button', { name: 'Pause timer' });
  await pause.focus();
  await expect(pause).toBeFocused();
  await expect(page.locator('.timer strong')).toHaveText('2:59', { timeout: 2_000 });
  await expect(pause).toBeFocused();
  await page.keyboard.press('Space');
  const pausedAt = await page.locator('.timer strong').textContent();
  await expect(page.getByRole('button', { name: 'Resume timer' })).toBeFocused();
  await page.waitForTimeout(1_100);
  await expect(page.locator('.timer strong')).toHaveText(pausedAt ?? '');
});

test('@claim:focus-contrast paper focus ring has at least 3:1 contrast against both paper surfaces', async ({ page }) => {
  const luminance = ([red, green, blue]: number[]) => {
    const channels = [red, green, blue].map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
  };
  const contrast = (first: number[], second: number[]) => {
    const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  await page.goto('/demo');
  const pause = page.getByRole('button', { name: 'Pause timer' });
  await pause.focus();
  const ring = await pause.evaluate((element) => getComputedStyle(element).outlineColor.match(/\d+/g)?.map(Number) ?? []);
  expect(contrast(ring, [243, 237, 218])).toBeGreaterThanOrEqual(3);
  expect(contrast(ring, [255, 250, 240])).toBeGreaterThanOrEqual(3);
});

test('@claim:mobile-actions 390px game keeps actions at least 44px and the next action above the fold', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  const dimensions = await page.locator('a, button, input:not([type="radio"]), select').evaluateAll((elements) => elements
    .filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    })
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return { label: element.textContent?.trim() || element.getAttribute('aria-label') || element.tagName, width: rect.width, height: rect.height };
    }));
  expect(dimensions.filter(({ width, height }) => width < 44 || height < 44)).toEqual([]);
  const next = await page.getByRole('button', { name: 'Open round 2' }).boundingBox();
  expect(next).not.toBeNull();
  expect(next!.y + next!.height).toBeLessThanOrEqual(844);
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

  for (const path of ['/privacy', '/terms', '/missing-page']) {
    await page.goto(path);
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? '')), path).toEqual([]);
  }
});

test('invalid codes explain how to recover', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Five-character room code').fill('OOOOO');
  await page.getByRole('button', { name: 'Open player notebooks' }).click();
  await expect(page.getByRole('alert')).toContainText('Ask the host for all five characters');
});

test('@claim:not-found-status every route loads and unknown routes return 404', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  for (const path of ['/', '/demo', '/privacy', '/terms']) {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
  }
  expect(errors).toEqual([]);
  const missingResponse = await page.goto('/missing-page');
  expect(missingResponse?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'This page is not in the notebook' })).toBeVisible();
  expect(errors.filter((message) => !message.includes('the server responded with a status of 404'))).toEqual([]);
});
