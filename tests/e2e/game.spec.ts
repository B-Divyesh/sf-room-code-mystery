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

test('@claim:room-code synchronizes different private notebooks through a complete room', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();
  await host.goto('http://127.0.0.1:4173/setup');
  await host.getByLabel('Number of players').selectOption('8');
  await host.getByRole('button', { name: 'Create room code' }).click();
  const code = await host.locator('.code-card strong').textContent();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{5}$/);
  await expect(host.getByText('Room connected')).toBeVisible();
  await guest.goto('http://127.0.0.1:4173/setup');
  await guest.getByLabel('Five-character room code').fill(code!);
  await guest.getByRole('button', { name: 'Join synchronized room' }).click();
  await expect(guest.locator('.code-card strong')).toHaveText(code!);
  await guest.getByRole('button', { name: 'Notebook 8' }).click();
  await host.getByRole('button', { name: 'Notebook 1' }).click();
  await host.getByRole('button', { name: 'Start round one' }).click();
  await expect(guest.getByText('Round 1 of 3')).toBeVisible();
  const hostClue = await host.locator('.clue-main').textContent();
  const guestClue = await guest.locator('.clue-main').textContent();
  expect(guestClue).not.toBe(hostClue);
  await host.getByRole('button', { name: 'Open round 2' }).click();
  await expect.poll(() => guest.evaluate(() => JSON.parse(localStorage.getItem('rcm:game') || '{}').round)).toBe(2);
  await expect(guest.getByText('Round 2 of 3')).toBeVisible();
  await host.getByRole('button', { name: 'Open round 3' }).click();
  await expect(guest.getByText('Round 3 of 3')).toBeVisible();
  await host.getByRole('button', { name: 'Make group accusation' }).click();
  await expect(guest.getByRole('heading', { name: 'The host is choosing the accusation' })).toBeVisible();
  await host.getByLabel(/Celia Finch/).check();
  await host.getByRole('button', { name: 'Lock accusation and reveal' }).click();
  await expect(guest.getByText('Shared reveal')).toBeVisible();
  await expect(guest.getByText('Celia Finch took the item')).toBeVisible();
  await hostContext.close();
  await guestContext.close();
});

test('@claim:demo-sandbox resets sample state without changing real state', async ({ page }) => {
  await page.goto('/setup');
  await page.getByRole('button', { name: 'Create room code' }).click();
  await expect(page).toHaveURL(/\/play$/);
  const realState = await page.evaluate(() => localStorage.getItem('rcm:game'));
  expect(realState).toBeTruthy();
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Open round 2' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByText('Round 1 of 3')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('rcm:game'))).toBe(realState);
  expect(await page.evaluate(() => localStorage.getItem('demo:rcm:game'))).toBeTruthy();
  await page.getByRole('button', { name: 'Start for real' }).click();
  expect(await page.evaluate(() => localStorage.getItem('rcm:game'))).toBe(realState);
  expect(await page.evaluate(() => localStorage.getItem('demo:rcm:game'))).toBeNull();
  await page.goto('/?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('Round 1 of 3')).toBeVisible();
});

test('@claim:local-privacy keeps all demo game values local with static GET requests only', async ({ page }) => {
  const requests: { origin: string; method: string; body: string | null }[] = [];
  page.on('request', (request) => requests.push({ origin: new URL(request.url()).origin, method: request.method(), body: request.postData() }));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Open round 2' }).click();
  await page.getByRole('button', { name: 'Open round 3' }).click();
  await page.getByRole('button', { name: 'Make group accusation' }).click();
  await page.getByLabel(/Celia Finch/).check();
  await page.getByRole('button', { name: 'Lock accusation and reveal' }).click();
  await expect(page.getByText('Correct accusation')).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('demo:rcm:game') ?? '{}'));
  expect(stored).toMatchObject({ code: 'C7K2M', seat: 1, round: 3, secondsLeft: 180, accusation: 'celia' });
  expect(requests.every((request) => request.origin === 'http://127.0.0.1:4173' && request.method === 'GET' && request.body === null)).toBe(true);
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
  expect(cacheKeys).toContain('room-code-mystery-v4');
  expect(cacheKeys).not.toContain('room-code-mystery-v3');
  await context.close();
});

test('@claim:additional-case truthfully disables paid cases and keeps both authored cases free', async ({ page }) => {
  await page.goto('/setup');
  await expect(page.getByRole('heading', { name: 'Two handcrafted cases are free to play' })).toBeVisible();
  await expect(page.getByText('Paid cases are unavailable until product checkout exists.')).toBeVisible();
  await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
  await page.getByLabel('Case', { exact: true }).selectOption('orchid-ledger');
  await page.getByRole('button', { name: 'Create room code' }).click();
  await page.getByRole('button', { name: 'Start round one' }).click();
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
  await page.getByRole('button', { name: 'Turn sound on' }).click();
  await expect(page.getByRole('button', { name: 'Turn sound off' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Turn sound off' })).toBeVisible();
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
  await expect(page.getByRole('button', { name: 'Start round one' })).toBeVisible();
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

test('@claim:cold-root-game shows and plays an active sample round before room setup', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Solve a mystery with your friends' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toHaveAttribute('href', '/demo');
  await expect(page.getByText('Round 1 of 3')).toBeVisible();
  await expect(page.getByLabel(/3:00 remaining/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open round 2' })).toBeVisible();
  await expect(page.getByText('Price: two free cases')).toBeVisible();
  await expect(page.getByText('Privacy: private clues stay local')).toBeVisible();
  await expect(page.getByText('Offline: demo reloads after one visit')).toBeVisible();
  await expect(page.locator('.room-desk')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open round 2' }).click();
  await expect(page.getByText('Round 2 of 3')).toBeVisible();
});

test('@claim:link-crawl follows every site link and reaches the live factory home', async ({ page, request }) => {
  const checked = new Set<string>();
  for (const path of ['/', '/demo', '/setup', '/play', '/privacy', '/terms']) {
    await page.goto(path);
    const links = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href));
    for (const href of links) {
      if (href.startsWith('mailto:') || href.includes('#')) continue;
      if (checked.has(href)) continue;
      checked.add(href);
      const response = await request.get(href);
      expect(response.status(), href).toBeLessThan(400);
    }
  }
  expect(checked).toContain('https://hello-factory.sociobot.in/');
});

test('@claim:route-metadata gives each route its own metadata, focus, and legal links', async ({ page }) => {
  const routes = [
    ['/', 'Room Code Mystery — Play a three-round mystery'],
    ['/demo', 'Demo — Room Code Mystery'],
    ['/setup', 'Start a room — Room Code Mystery'],
    ['/play', 'Your room — Room Code Mystery'],
    ['/privacy', 'Privacy — Room Code Mystery'],
    ['/terms', 'Terms — Room Code Mystery'],
  ];
  for (const [path, title] of routes) {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://room-code-mystery.sociobot.in${path}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
    await expect(page.locator('footer a[href="/privacy"]')).toHaveCount(1);
    await expect(page.locator('footer a[href="/terms"]')).toHaveCount(1);
  }
  await page.goto('/setup');
  await page.getByRole('link', { name: 'Privacy', exact: true }).first().click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/\/setup$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});

test('@claim:reduced-motion removes the paper movement', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo');
  const motion = await page.locator('.game-sheet').evaluate((element) => {
    const style = getComputedStyle(element);
    return { duration: style.animationDuration, iterations: style.animationIterationCount };
  });
  expect(Number.parseFloat(motion.duration)).toBeLessThanOrEqual(0.01);
  expect(Number(motion.iterations)).toBeLessThanOrEqual(1);
});

test('@claim:no-account-media requires no account, capture, or automated judgment', async ({ page }) => {
  const mediaCalls: string[] = [];
  await page.exposeFunction('recordMediaCall', (kind: string) => mediaCalls.push(kind));
  await page.addInitScript(() => {
    const media = navigator.mediaDevices;
    if (media?.getUserMedia) {
      media.getUserMedia = async () => {
        await (window as typeof window & { recordMediaCall: (kind: string) => Promise<void> }).recordMediaCall('getUserMedia');
        throw new Error('blocked in test');
      };
    }
  });
  const requests: { url: string; body: string | null }[] = [];
  page.on('request', (request) => requests.push({ url: request.url(), body: request.postData() }));
  await page.goto('/setup');
  await expect(page.locator('input[type="email"], input[type="password"], [href*="login"], [href*="signup"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create room code' }).click();
  await page.getByRole('button', { name: 'Start round one' }).click();
  await page.getByRole('button', { name: 'Open round 2' }).click();
  await page.getByRole('button', { name: 'Open round 3' }).click();
  await page.getByRole('button', { name: 'Make group accusation' }).click();
  await page.getByLabel(/Celia Finch/).check();
  await page.getByRole('button', { name: 'Lock accusation and reveal' }).click();
  expect(mediaCalls).toEqual([]);
  expect(requests.some(({ url }) => /openai|login|signup|analytics/i.test(url))).toBe(false);
  expect(requests.some(({ body }) => /celia|accusation/i.test(body || ''))).toBe(false);
});

test('@claim:room-expiry assigns each synchronized room a six-hour expiry', async ({ page }) => {
  await page.goto('/setup');
  const expiry = await page.evaluate(async () => {
    const response = await fetch('http://127.0.0.1:8787/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: 'glasshouse-lantern', players: 4 }),
    });
    return response.json();
  });
  expect(expiry.room.code).toMatch(/^[A-HJ-NP-Z2-9]{5}$/);
  expect(expiry.room.expiresAt - expiry.room.updatedAt).toBe(6 * 60 * 60 * 1000);
});

test('landing and mobile game have no serious accessibility findings', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);

  await page.goto('/setup');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('img[alt]')).toHaveCount(1);
  results = await new AxeBuilder({ page }).analyze();
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
  await page.goto('/setup');
  await page.getByLabel('Five-character room code').fill('OOOOO');
  await page.getByRole('button', { name: 'Join synchronized room' }).click();
  await expect(page.getByRole('alert')).toContainText('Ask the host for all five characters');
});

test('@claim:not-found-status every route loads and unknown routes return a complete 404 page', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  for (const path of ['/', '/demo', '/setup', '/play', '/privacy', '/terms']) {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
  }
  expect(errors).toEqual([]);
  const missingResponse = await page.goto('/missing-page');
  expect(missingResponse?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://room-code-mystery.sociobot.in/404.html');
  expect(errors.filter((message) => !message.includes('the server responded with a status of 404'))).toEqual([]);
});
