import './styles.css';
import { caseById, cases } from './cases';
import { clueIndex, createState, formatTime, makeRoomCode, nextRound, parseRoomCode, ROUND_SECONDS } from './core';
import type { Clue, GameState } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
if (!app) throw new Error('App root is missing.');

const PRODUCT = 'room-code-mystery';
const LICENSE_KEY = `sb_license:${PRODUCT}`;
const VERDICT_KEY = `sb_license_verdict:${PRODUCT}`;
const REAL_STATE_KEY = 'rcm:game';
const DEMO_STATE_KEY = 'demo:rcm:game';
const SETTINGS_KEY = 'rcm:settings';
const DEMO_CODE = 'C7K2M';
const checkoutUrl = `https://api.sociobot.in/api/v1/products/${PRODUCT}/checkout`;

let demoMode = location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
let game = readState();
let formError = '';
let licenseNotice = '';
let online = navigator.onLine;
let timerFrame = 0;
let lastFrame = performance.now();
let timerAccumulator = 0;

type Settings = { sound: boolean };
const settings: Settings = readJson(SETTINGS_KEY, { sound: false });

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readState(): GameState | null {
  if (demoMode) {
    return readJson<GameState | null>(DEMO_STATE_KEY, {
      ...createState(DEMO_CODE, cases[0].id, 6, 'host', 1),
      round: 1,
      phase: 'clue',
      secondsLeft: ROUND_SECONDS,
      paused: false,
    });
  }
  return readJson<GameState | null>(REAL_STATE_KEY, null);
}

function saveState(): void {
  if (!game) return;
  localStorage.setItem(demoMode ? DEMO_STATE_KEY : REAL_STATE_KEY, JSON.stringify(game));
}

function hasPaidLicense(): boolean {
  const verdict = readJson<{ valid: boolean; checkedAt: number } | null>(VERDICT_KEY, null);
  return Boolean(localStorage.getItem(LICENSE_KEY) && verdict?.valid);
}

async function processLicense(): Promise<void> {
  const url = new URL(location.href);
  const incoming = url.searchParams.get('license');
  if (incoming) {
    localStorage.setItem(LICENSE_KEY, incoming.trim());
    url.searchParams.delete('license');
    history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
  const token = localStorage.getItem(LICENSE_KEY);
  if (!token || demoMode) return;
  const cached = readJson<{ valid: boolean; checkedAt: number } | null>(VERDICT_KEY, null);
  if (cached && Date.now() - cached.checkedAt < 86_400_000) return;
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/${PRODUCT}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('License check failed.');
    const result = (await response.json()) as { valid: boolean };
    localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: result.valid, checkedAt: Date.now() }));
    licenseNotice = result.valid ? 'The Orchid Ledger is ready to play.' : 'This license is no longer active. Buy a new license to create this case.';
    render();
  } catch {
    licenseNotice = 'The license could not be checked. The free case is still available.';
    render();
  }
}

function navigate(path: string): void {
  if (location.pathname !== path) history.pushState({}, '', path);
  render(true);
}

function routeName(): 'home' | 'play' | 'demo' | 'privacy' | 'terms' | 'not-found' {
  if (demoMode) return 'demo';
  if (location.pathname === '/') return 'home';
  if (location.pathname === '/play') return 'play';
  if (location.pathname === '/privacy') return 'privacy';
  if (location.pathname === '/terms') return 'terms';
  return 'not-found';
}

function shell(content: string): string {
  const route = routeName();
  return `
    ${demoMode ? `<aside class="demo-banner" aria-label="Demo mode"><span><strong>Demo</strong> — sample data, nothing is saved</span><span class="demo-actions"><button type="button" data-action="reset-demo">Reset demo</button><button type="button" data-action="start-real">Start for real</button></span></aside>` : ''}
    <header class="site-header">
      <a class="wordmark" href="/" data-link><span class="wordmark-mark" aria-hidden="true">✦</span> Room Code Mystery</a>
      <nav aria-label="Main navigation">
        <a href="/demo" data-link>Demo</a>
        <a href="/#how">How it works</a>
        <a href="/privacy" data-link ${route === 'privacy' ? 'aria-current="page"' : ''}>Privacy</a>
      </nav>
    </header>
    ${!online ? `<div class="offline-notice" role="status">You are offline. Open rooms and saved progress still work on this device.</div>` : ''}
    ${content}
    <footer>
      <div><strong>Room Code Mystery</strong><p>Three evidence rounds for 4–8 friends.</p></div>
      <div class="footer-links"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a><a href="https://www.sociobot.in" rel="noreferrer">Built by Param Factory</a></div>
      <p class="build-note">v1.0 · Original generated field-guide art</p>
    </footer>
    <div class="route-announcer sr-only" aria-live="polite"></div>`;
}

function landing(): string {
  const saved = readJson<GameState | null>(REAL_STATE_KEY, null);
  return shell(`
    <main id="main">
      <section class="hero">
        <picture class="hero-art">
          <source media="(max-width: 850px)" srcset="/art/herbarium-desk-900.webp" />
          <img src="/art/herbarium-desk.webp" width="1536" height="1024" alt="A botanical field notebook sets the scene for a greenhouse mystery." fetchpriority="high" decoding="async" />
        </picture>
        <div class="hero-copy paper-panel">
          <p class="eyebrow">A browser game for 4–8 players</p>
          <h1 tabindex="-1">Solve a mystery with your friends</h1>
          <p class="lede">For 4–8 friends on a video call who want one warm, 20-minute case.</p>
          <div class="demo-cta">
            <a class="button primary" href="/demo" data-link>Try it with sample data</a>
            <span>Opens round one with six sample players.</span>
          </div>
          <ul class="plain-facts" aria-label="Game facts">
            <li><strong>Starter case:</strong> free</li>
            <li><strong>Players:</strong> 4–8</li>
            <li><strong>Storage:</strong> this device only</li>
          </ul>
        </div>
        <div class="room-desk" aria-labelledby="room-heading">
          <div class="desk-intro"><p class="specimen-number">FIELD DESK · 01</p><h2 id="room-heading">Start your room</h2><p>One friend creates the code. Everyone else joins with it.</p></div>
          ${saved ? `<div class="resume-strip"><span>Room ${saved.code} is saved on this device.</span><a class="button secondary" href="/play" data-link>Resume room</a></div>` : ''}
          <div class="room-actions">
            <form id="create-room" class="room-form">
              <h3>Create a room</h3>
              <label for="case-choice">Case</label>
              <select id="case-choice" name="case">
                <option value="glasshouse-lantern">The Glasshouse Lantern — free</option>
                <option value="orchid-ledger" ${hasPaidLicense() ? '' : 'disabled'}>The Orchid Ledger — ${hasPaidLicense() ? 'purchased' : '$6 license required'}</option>
              </select>
              <label for="player-count">Number of players</label>
              <select id="player-count" name="players">
                ${[4, 5, 6, 7, 8].map((count) => `<option value="${count}" ${count === 6 ? 'selected' : ''}>${count} players</option>`).join('')}
              </select>
              <button class="button primary" type="submit">Create room code</button>
            </form>
            <div class="pressed-divider" aria-hidden="true"><span>or</span></div>
            <form id="join-room" class="room-form">
              <h3>Join a room</h3>
              <label for="room-code">Five-character room code</label>
              <input id="room-code" name="code" minlength="5" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" required />
              <button class="button secondary" type="submit">Open player notebooks</button>
            </form>
          </div>
          <p class="form-error" role="alert">${formError}</p>
        </div>
      </section>

      <section class="how" id="how" aria-labelledby="how-heading">
        <p class="eyebrow">One call · three rounds · one accusation</p>
        <h2 id="how-heading">How the game works</h2>
        <ol class="steps">
          <li><span>1</span><div><h3>Share the room code</h3><p>Each friend opens a numbered notebook on their own phone.</p></div></li>
          <li><span>2</span><div><h3>Read different clues</h3><p>Compare one private clue per player across three timed rounds.</p></div></li>
          <li><span>3</span><div><h3>Choose one suspect</h3><p>The host records the group’s accusation and opens the answer.</p></div></li>
        </ol>
      </section>

      <section class="boundaries" aria-labelledby="privacy-heading">
        <div><p class="eyebrow">Private by design</p><h2 id="privacy-heading">Your room stays with your group</h2></div>
        <ul>
          <li>No account or public matchmaking.</li>
          <li>No voice, video, or accusations are uploaded.</li>
          <li>No computer decides whether your reasoning is good.</li>
        </ul>
      </section>

      <section class="paid" aria-labelledby="paid-heading">
        <div><p class="eyebrow">Additional case</p><h2 id="paid-heading">Add The Orchid Ledger</h2><p>Get a second handcrafted case with 24 new clues and a new solution.</p></div>
        <div class="price-block"><strong>$6</strong><span>one-time purchase</span><a class="button primary" href="${checkoutUrl}">Buy the second case</a></div>
        <form id="restore-license" class="restore-form">
          <label for="license-token">Have a license? Paste it here</label>
          <div><input id="license-token" name="license" type="text" autocomplete="off" required /><button class="button secondary" type="submit">Verify license</button></div>
          <p class="license-notice" role="status">${licenseNotice}</p>
        </form>
        <p class="legal-line">Sociobot is the merchant of record. Purchase terms and refunds are explained in the <a href="/terms" data-link>terms</a>.</p>
      </section>
    </main>`);
}

function specimen(clue: Clue): string {
  const labels: Record<Clue['specimen'], string> = {
    leaf: 'fern leaflet', key: 'brass key', paper: 'torn paper', cup: 'tea cup', soil: 'soil track', clock: 'clock face', shoe: 'shoe print', glass: 'glass pane',
  };
  return `<svg class="specimen specimen-${clue.specimen}" viewBox="0 0 240 180" role="img" aria-label="Clue drawing: ${labels[clue.specimen]}">
    <rect class="specimen-paper" x="8" y="8" width="224" height="164" rx="2" />
    <path class="specimen-line specimen-a" d="M48 133 C82 99 121 75 189 48" />
    <path class="specimen-line specimen-b" d="M74 112 C82 82 76 64 62 45 M101 91 C117 62 120 44 114 30 M132 73 C150 59 168 57 189 59" />
    <circle class="specimen-mark" cx="181" cy="135" r="20" />
    <path class="specimen-glyph" d="M171 135 h20 M181 125 v20" />
  </svg>`;
}

function gameView(): string {
  if (!game) return shell(`<main id="main" class="simple-page"><h1 tabindex="-1">No room is open</h1><p>Create or join a room to see your notebook.</p><a class="button primary" href="/" data-link>Start a room</a></main>`);
  const mystery = caseById(game.caseId);
  const seatOptions = Array.from({ length: game.players }, (_, index) => index + 1)
    .map((seat) => `<button type="button" class="seat ${seat === game?.seat ? 'selected' : ''}" data-seat="${seat}" aria-pressed="${seat === game?.seat}">Notebook ${seat}</button>`).join('');
  let stage = '';

  if (game.phase === 'lobby') {
    stage = `<section class="lobby-sheet paper-panel">
      <p class="specimen-number">ROOM ${game.code}</p>
      <h1 tabindex="-1">Choose your private notebook</h1>
      <p>${mystery.premise}</p>
      <div class="code-card"><span>Room code</span><strong>${game.code}</strong><button type="button" class="text-button" data-action="copy-code">Copy room link</button></div>
      <h2>Pick one notebook each</h2>
      <div class="seat-grid">${seatOptions}</div>
      <p class="help-text">Say your number aloud so no one opens the same notebook.</p>
      <button type="button" class="button primary" data-action="next-round">Open round one</button>
    </section>`;
  } else if (game.phase === 'clue') {
    const round = game.round || 1;
    const clue = mystery.clues[round - 1][clueIndex(game.code, game.seat, round, mystery.clues[round - 1].length)];
    stage = `<section class="game-sheet">
      <div class="round-bar"><div><span>Room ${game.code}</span><strong>Round ${round} of 3</strong></div><div class="timer ${game.secondsLeft === 0 ? 'timer-ended' : ''}" aria-label="${formatTime(game.secondsLeft)} remaining"><span>${game.paused ? 'Paused' : game.secondsLeft === 0 ? 'Time is up' : 'Discuss'}</span><strong>${formatTime(game.secondsLeft)}</strong></div></div>
      <div class="case-heading"><div><p class="eyebrow">${mystery.name}</p><h1 tabindex="-1">Notebook ${game.seat}: ${clue.title}</h1></div><button class="sound-toggle" type="button" data-action="sound" aria-pressed="${settings.sound}">${settings.sound ? 'Sound on' : 'Sound off'}</button></div>
      <div class="clue-layout">
        ${specimen(clue)}
        <div class="clue-copy"><p class="clue-main">${clue.text}</p><p>${clue.detail}</p><div class="read-note"><strong>Read both lines aloud.</strong><span>Then compare what each notebook shows.</span></div></div>
      </div>
      <div class="game-controls">
        <button class="button secondary" type="button" data-action="pause">${game.paused ? 'Resume timer' : 'Pause timer'}</button>
        <button class="button primary" type="button" data-action="next-round">${round < 3 ? `Open round ${round + 1}` : game.role === 'host' ? 'Make group accusation' : 'Open group reveal'}</button>
      </div>
    </section>`;
  } else if (game.phase === 'accuse') {
    stage = `<section class="accusation-sheet paper-panel">
      <p class="specimen-number">FINAL ENTRY · ROOM ${game.code}</p>
      <h1 tabindex="-1">Record one group accusation</h1>
      <p>Choose after every player has shared all three clues.</p>
      <form id="accusation-form">
        <fieldset><legend>Who took ${mystery.missing.toLowerCase()}?</legend>
          <div class="suspect-list">${mystery.suspects.map((suspect) => `<label><input type="radio" name="suspect" value="${suspect.id}" required /><span><strong>${suspect.name}</strong><small>${suspect.role} · ${suspect.note}</small></span></label>`).join('')}</div>
        </fieldset>
        <button class="button primary" type="submit">Lock accusation and reveal</button>
      </form>
    </section>`;
  } else {
    const accused = mystery.suspects.find((suspect) => suspect.id === game?.accusation);
    const correct = game.accusation ? game.accusation === mystery.answer : null;
    stage = `<section class="reveal-sheet paper-panel">
      <p class="specimen-number">CASE REVEAL · ${mystery.name}</p>
      <h1 tabindex="-1">${correct === true ? 'Your group solved it' : correct === false ? 'The evidence points elsewhere' : 'Open the group reveal'}</h1>
      ${accused ? `<p class="verdict">You accused <strong>${accused.name}</strong>.</p>` : '<p class="verdict">The host can read this answer to the group.</p>'}
      <h2>${mystery.suspects.find((suspect) => suspect.id === mystery.answer)?.name} took the item</h2>
      <p>${mystery.reveal}</p>
      <div class="case-summary"><span>Three rounds completed</span><span>${game.players} player notebooks</span><span>${correct === null ? 'Shared reveal' : correct ? 'Correct accusation' : 'Case learned'}</span></div>
      <p>${mystery.replayNote}</p>
      <div class="reveal-actions"><button type="button" class="button primary" data-action="play-again">Start a second case</button><button type="button" class="button secondary" data-action="new-room">Return home</button></div>
    </section>`;
  }

  return shell(`<main id="main" class="game-main">
    <div class="game-backdrop" aria-hidden="true"></div>
    ${stage}
    <aside class="case-tab"><span>${mystery.name}</span><button type="button" data-action="leave-room">Leave room</button></aside>
  </main>`);
}

function privacyPage(): string {
  return shell(`<main id="main" class="simple-page paper-panel"><p class="eyebrow">Privacy</p><h1 tabindex="-1">Your room data stays on your device</h1><p>Room Code Mystery does not require an account. It does not send room codes, notebook choices, timers, or accusations to us.</p><h2>Data stored by your browser</h2><p>Your current room and sound setting use local storage. Demo data uses a separate <code>demo:</code> namespace. Resetting the demo removes that sample state.</p><h2>License checks</h2><p>If you paste or receive a paid license, your browser sends that token to the Sociobot billing API for verification. The result is cached for one day.</p><h2>What we do not collect</h2><p>The game has no advertising, third-party analytics, public rooms, voice recording, or video recording.</p><p>Questions can be sent to <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p></main>`);
}

function termsPage(): string {
  return shell(`<main id="main" class="simple-page paper-panel"><p class="eyebrow">Terms</p><h1 tabindex="-1">Play fairly and share the clues</h1><p>Room Code Mystery is a browser game for personal group play. You may share a room code with people in your own gathering.</p><h2>Free and paid cases</h2><p>The starter case is free. The Orchid Ledger costs $6 as a one-time purchase for the host. The license lets that host create rooms for the additional case.</p><h2>Purchases and refunds</h2><p>Sociobot and its payment partner are the merchant of record. A refunded or revoked purchase stops verifying. Contact <a href="mailto:support@sociobot.in">support@sociobot.in</a> for purchase help.</p><h2>Fair use</h2><p>Do not republish the case text, sell room access, or use the service to harm others. The game is provided as available without a promise of uninterrupted access.</p><p>These terms were last updated on September 2, 2026.</p></main>`);
}

function notFoundPage(): string {
  return shell(`<main id="main" class="simple-page missing-page"><p class="specimen-number">SPECIMEN NOT FOUND</p><h1 tabindex="-1">This page is not in the notebook</h1><p>The address may be old or incomplete.</p><a class="button primary" href="/" data-link>Return to the game</a></main>`);
}

function render(focusHeading = false): void {
  const route = routeName();
  const titles = {
    home: 'Room Code Mystery — Play a 20-minute mystery',
    play: 'Your room — Room Code Mystery',
    demo: 'Demo — Room Code Mystery',
    privacy: 'Privacy — Room Code Mystery',
    terms: 'Terms — Room Code Mystery',
    'not-found': 'Page not found — Room Code Mystery',
  };
  document.title = titles[route];
  app.innerHTML = route === 'home' ? landing() : route === 'privacy' ? privacyPage() : route === 'terms' ? termsPage() : route === 'not-found' ? notFoundPage() : gameView();
  bindEvents();
  if (focusHeading) {
    requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1');
      heading?.focus();
      document.querySelector<HTMLElement>('.route-announcer')!.textContent = heading?.textContent ?? '';
      scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }
}

function bindEvents(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[data-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (link.origin !== location.origin || event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      const target = new URL(link.href);
      demoMode = target.pathname === '/demo';
      if (demoMode) game = readState();
      navigate(target.pathname);
    });
  });

  document.querySelector<HTMLFormElement>('#create-room')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const caseId = String(data.get('case'));
    const players = Number(data.get('players'));
    const mystery = caseById(caseId);
    if (mystery.paid && !hasPaidLicense()) {
      formError = 'This case needs a verified license. Buy it or paste your license below.';
      render();
      return;
    }
    const code = makeRoomCode(players, mystery.paid);
    game = createState(code, caseId, players, 'host');
    saveState();
    navigate('/play');
  });

  document.querySelector<HTMLFormElement>('#join-room')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const parsed = parseRoomCode(String(new FormData(event.currentTarget as HTMLFormElement).get('code') ?? ''));
    if (!parsed) {
      formError = 'That code is not valid. Ask the host for all five characters and try again.';
      render();
      return;
    }
    game = createState(parsed.code, parsed.caseId, parsed.players, 'player');
    saveState();
    navigate('/play');
  });

  document.querySelector<HTMLFormElement>('#restore-license')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const token = String(new FormData(event.currentTarget as HTMLFormElement).get('license') ?? '').trim();
    if (!token) return;
    localStorage.setItem(LICENSE_KEY, token);
    localStorage.removeItem(VERDICT_KEY);
    licenseNotice = 'Checking this license…';
    render();
    void processLicense();
  });

  document.querySelector<HTMLFormElement>('#accusation-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!game) return;
    const suspect = String(new FormData(event.currentTarget as HTMLFormElement).get('suspect') ?? '');
    if (!suspect) return;
    game = { ...game, accusation: suspect, phase: 'reveal' };
    saveState();
    playChime();
    render(true);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-seat]').forEach((button) => button.addEventListener('click', () => {
    if (!game) return;
    game = { ...game, seat: Number(button.dataset.seat) };
    saveState();
    render();
  }));

  document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => button.addEventListener('click', () => {
    const action = button.dataset.action;
    if (action === 'reset-demo') {
      localStorage.removeItem(DEMO_STATE_KEY);
      game = null;
      game = readState();
      saveState();
      render(true);
    } else if (action === 'start-real') {
      localStorage.removeItem(DEMO_STATE_KEY);
      demoMode = false;
      game = readJson<GameState | null>(REAL_STATE_KEY, null);
      navigate('/');
    } else if (action === 'copy-code' && game) {
      const roomLink = `${location.origin}/?room=${game.code}`;
      void navigator.clipboard.writeText(roomLink).then(() => {
        button.textContent = 'Room link copied';
      }).catch(() => {
        button.textContent = `Share ${game?.code}`;
      });
    } else if (action === 'next-round' && game) {
      game = nextRound(game);
      saveState();
      playChime();
      render(true);
    } else if (action === 'pause' && game) {
      game = { ...game, paused: !game.paused };
      saveState();
      render();
    } else if (action === 'sound') {
      settings.sound = !settings.sound;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      if (settings.sound) playChime();
      render();
    } else if (action === 'play-again' && game) {
      const nextCase = game.caseId === cases[0].id && hasPaidLicense() ? cases[1] : cases[0];
      game = createState(makeRoomCode(game.players, nextCase.paid), nextCase.id, game.players, 'host');
      saveState();
      render(true);
    } else if ((action === 'new-room' || action === 'leave-room') && game) {
      game = null;
      localStorage.removeItem(demoMode ? DEMO_STATE_KEY : REAL_STATE_KEY);
      if (demoMode) {
        game = readState();
        render(true);
      } else navigate('/');
    }
  }));
}

function playChime(): void {
  if (!settings.sound) return;
  try {
    const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 523;
    gain.gain.setValueAtTime(0.035, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.18);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
  } catch {
    // Sound is optional; the visible state change remains available.
  }
}

function timerLoop(now: number): void {
  const elapsed = Math.min(now - lastFrame, 250);
  lastFrame = now;
  if (!document.hidden && game?.phase === 'clue' && !game.paused && game.secondsLeft > 0) {
    timerAccumulator += elapsed;
    if (timerAccumulator >= 1000) {
      const ticks = Math.floor(timerAccumulator / 1000);
      timerAccumulator -= ticks * 1000;
      game = { ...game, secondsLeft: Math.max(0, game.secondsLeft - ticks) };
      if (game.secondsLeft === 0) game.paused = true;
      saveState();
      render();
    }
  }
  timerFrame = requestAnimationFrame(timerLoop);
}

addEventListener('popstate', () => {
  demoMode = location.pathname === '/demo';
  game = readState();
  render(true);
});
addEventListener('online', () => { online = true; render(); });
addEventListener('offline', () => { online = false; render(); });
document.addEventListener('visibilitychange', () => { lastFrame = performance.now(); });

const sharedCode = new URLSearchParams(location.search).get('room');
if (!demoMode && sharedCode && !game) {
  const parsed = parseRoomCode(sharedCode);
  if (parsed) {
    game = createState(parsed.code, parsed.caseId, parsed.players, 'player');
    saveState();
    history.replaceState({}, '', '/play');
  }
}

render();
void processLicense();
timerFrame = requestAnimationFrame(timerLoop);
void timerFrame;

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
}
