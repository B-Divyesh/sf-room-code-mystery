import './styles.css';
import { caseById, cases } from './cases';
import { clueIndex, createState, formatTime, makeRoomCode, nextRound, ROUND_SECONDS } from './core';
import { connectRemoteRoom, createRemoteRoom, joinRemoteRoom, updateRemoteRoom } from './realtime';
import type { SharedRoom } from './realtime';
import type { Clue, GameState } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
if (!app) throw new Error('App root is missing.');

const REAL_STATE_KEY = 'rcm:game';
const DEMO_STATE_KEY = 'demo:rcm:game';
const SETTINGS_KEY = 'rcm:settings';
const DEMO_CODE = 'C7K2M';

// The cold root is the one-click sample game. Private room setup intentionally
// lives at /setup so a first capture shows a playable round rather than a menu.
let demoMode = location.pathname === '/' || location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
let game = readState();
let formError = '';
let online = navigator.onLine;
let timerFrame = 0;
let lastFrame = performance.now();
let timerAccumulator = 0;
let roomSocket: WebSocket | null = null;
let roomConnected = false;
let roomBusy = false;
let reconnectTimer = 0;
let roomPollTimer = 0;
let syncPending = false;
let syncRequested = false;

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

function gameFromShared(room: SharedRoom, current: GameState | null, role: 'host' | 'player', hostToken?: string): GameState {
  const elapsed = room.paused ? 0 : Math.floor((Date.now() - room.updatedAt) / 1000);
  return {
    code: room.code,
    caseId: room.caseId,
    players: room.players,
    role,
    hostToken: hostToken ?? current?.hostToken,
    seat: current?.seat && current.seat <= room.players ? current.seat : 1,
    round: room.round,
    phase: room.phase,
    secondsLeft: Math.max(0, room.secondsLeft - elapsed),
    paused: room.paused,
    accusation: current?.accusation,
  };
}

function sharedFromGame(state: GameState): SharedRoom {
  return { ...state, updatedAt: Date.now(), expiresAt: Date.now() + 21_600_000 };
}

function disconnectRoom(): void {
  clearTimeout(reconnectTimer);
  clearInterval(roomPollTimer);
  roomPollTimer = 0;
  roomSocket?.close();
  roomSocket = null;
  roomConnected = false;
}

function connectRoom(): void {
  if (demoMode || !game || roomSocket?.readyState === WebSocket.OPEN || roomSocket?.readyState === WebSocket.CONNECTING) return;
  roomSocket = connectRemoteRoom(game.code, (room) => {
    if (!game || game.code !== room.code || game.role === 'host') return;
    const previousPhase = game.phase;
    const previousRound = game.round;
    game = gameFromShared(room, game, 'player');
    saveState();
    if (previousPhase !== game.phase || previousRound !== game.round || document.querySelector('.waiting-sheet')) render(true);
    else updateTimerDom();
  }, (connected) => {
    roomConnected = connected;
    document.querySelector<HTMLElement>('.sync-status')?.setAttribute('data-connected', String(connected));
    const status = document.querySelector<HTMLElement>('.sync-status span');
    if (status) status.textContent = connected ? 'Room connected' : 'Reconnecting';
    if (!connected && !demoMode && game && navigator.onLine) {
      clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(() => { roomSocket = null; connectRoom(); }, 1_500);
    }
  });
  if (game.role === 'player' && !roomPollTimer) {
    roomPollTimer = window.setInterval(() => {
      if (!game || demoMode || document.hidden) return;
      void joinRemoteRoom(game.code).then((result) => {
        if (!game || game.role !== 'player' || game.code !== result.room.code) return;
        const previousPhase = game.phase;
        const previousRound = game.round;
        game = gameFromShared(result.room, game, 'player');
        saveState();
        if (previousPhase !== game.phase || previousRound !== game.round) render(true);
        else updateTimerDom();
      }).catch(() => updateSyncStatus('Reconnecting'));
    }, 1_000);
  }
}

async function syncHost(): Promise<void> {
  if (demoMode || !game || game.role !== 'host' || !game.hostToken) return;
  if (syncPending) {
    syncRequested = true;
    return;
  }
  syncPending = true;
  try {
    await updateRemoteRoom(sharedFromGame(game), game.hostToken);
  } catch {
    roomConnected = false;
    updateSyncStatus('Room changes are waiting for a connection.');
  } finally {
    syncPending = false;
    if (syncRequested) {
      syncRequested = false;
      void syncHost();
    }
  }
}

function updateSyncStatus(message?: string): void {
  const status = document.querySelector<HTMLElement>('.sync-status');
  if (!status) return;
  status.dataset.connected = String(roomConnected);
  const label = status.querySelector('span');
  if (label) label.textContent = message ?? (roomConnected ? 'Room connected' : 'Reconnecting');
}

function navigate(path: string): void {
  if (location.pathname !== path) history.pushState({}, '', path);
  render(true);
}

function routeName(): 'home' | 'setup' | 'play' | 'demo' | 'privacy' | 'terms' | 'not-found' {
  if (location.pathname === '/') return 'home';
  if (location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1') return 'demo';
  if (location.pathname === '/setup') return 'setup';
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
        <a href="/setup" data-link>Start a room</a>
        <a href="/privacy" data-link ${route === 'privacy' ? 'aria-current="page"' : ''}>Privacy</a>
      </nav>
    </header>
    ${!online ? `<div class="offline-notice" role="status">You are offline. Open rooms and saved progress still work on this device.</div>` : ''}
    ${content}
    <footer>
      <div><strong>Room Code Mystery</strong><p>Three evidence rounds for 4–8 friends.</p></div>
      <div class="footer-links"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a><a href="https://hello-factory.sociobot.in/" rel="noreferrer">Built by Param Factory ↗</a></div>
      <p class="build-note">v1.1 · Original generated field-guide art</p>
    </footer>
    <div class="route-announcer sr-only" aria-live="polite"></div>`;
}

function setupPage(): string {
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
          <p class="lede">For 4–8 friends on a video call who want three rounds of shared clues.</p>
          <div class="demo-cta">
            <a class="button primary" href="/demo" data-link>Try it with sample data</a>
            <span>Opens round one with six sample players.</span>
          </div>
          <ul class="plain-facts" aria-label="Game facts">
            <li><strong>Price:</strong> two cases are free</li>
            <li><strong>Privacy:</strong> private clues stay on your device</li>
            <li><strong>Offline:</strong> the demo reloads after one visit</li>
          </ul>
        </div>
        <div class="room-desk" aria-labelledby="room-heading">
          <div class="desk-intro"><p class="specimen-number">FIELD DESK · 01</p><h2 id="room-heading">Start your room</h2><p>One friend hosts. Everyone else joins the synchronized room.</p></div>
          ${saved ? `<div class="resume-strip"><span>Room ${saved.code} is saved on this device.</span><a class="button secondary" href="/play" data-link>Resume room</a></div>` : ''}
          <div class="room-actions">
            <form id="create-room" class="room-form">
              <h3>Create a room</h3>
              <label for="case-choice">Case</label>
              <select id="case-choice" name="case">
                <option value="glasshouse-lantern">The Glasshouse Lantern — free</option>
                <option value="orchid-ledger">The Orchid Ledger — free</option>
              </select>
              <label for="player-count">Number of players</label>
              <select id="player-count" name="players">
                ${[4, 5, 6, 7, 8].map((count) => `<option value="${count}" ${count === 6 ? 'selected' : ''}>${count} players</option>`).join('')}
              </select>
              <button class="button primary" type="submit" ${roomBusy ? 'disabled' : ''}>${roomBusy ? 'Creating room…' : 'Create room code'}</button>
            </form>
            <div class="pressed-divider" aria-hidden="true"><span>or</span></div>
            <form id="join-room" class="room-form">
              <h3>Join a room</h3>
              <label for="room-code">Five-character room code</label>
              <input id="room-code" name="code" minlength="5" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" required />
              <button class="button secondary" type="submit" ${roomBusy ? 'disabled' : ''}>${roomBusy ? 'Joining room…' : 'Join synchronized room'}</button>
            </form>
          </div>
          <p class="form-error" role="alert" aria-live="assertive">${formError}</p>
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
          <li>Room timing expires six hours after the last host action.</li>
          <li>Private clues and accusations never leave your device.</li>
        </ul>
      </section>

      <section class="paid" aria-labelledby="paid-heading">
        <div><p class="eyebrow">Case availability</p><h2 id="paid-heading">Two handcrafted cases are free to play</h2><p>Choose The Glasshouse Lantern or The Orchid Ledger. Paid cases are unavailable until product checkout exists.</p></div>
        <div class="price-block availability"><strong>Free</strong><span>Both cases are ready now.</span></div>
        <p class="legal-line">No payment is taken on this site. See the <a href="/terms" data-link>terms</a> for game use.</p>
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

function gameView(rootSample = false): string {
  if (!game) return shell(`<main id="main" class="simple-page"><h1 tabindex="-1">No room is open</h1><p>Create or join a room to see your notebook.</p><a class="button primary" href="/setup" data-link>Start a room</a></main>`);
  const mystery = caseById(game.caseId);
  const headingTag = rootSample ? 'h2' : 'h1';
  const seatOptions = Array.from({ length: game.players }, (_, index) => index + 1)
    .map((seat) => `<button type="button" class="seat ${seat === game?.seat ? 'selected' : ''}" data-seat="${seat}" aria-pressed="${seat === game?.seat}">Notebook ${seat}</button>`).join('');
  let stage = '';

  if (game.phase === 'lobby') {
    stage = `<section class="lobby-sheet paper-panel">
      <p class="specimen-number">ROOM ${game.code}</p>
      <${headingTag} tabindex="-1">Choose your private notebook</${headingTag}>
      <p>${mystery.premise}</p>
      <div class="code-card"><span>Room code</span><strong>${game.code}</strong><button type="button" class="text-button" data-action="copy-code">Copy room link</button></div>
      ${!demoMode ? `<p class="sync-status" data-connected="${roomConnected}" role="status"><i aria-hidden="true"></i><span>${roomConnected ? 'Room connected' : 'Connecting room'}</span></p>` : ''}
      <h2>Pick one notebook each</h2>
      <div class="seat-grid">${seatOptions}</div>
      <p class="help-text">Say your number aloud so no one opens the same notebook.</p>
      ${game.role === 'host' || demoMode ? '<button type="button" class="button primary" data-action="next-round">Start round one</button>' : '<p class="host-wait">Choose a notebook. The first clue opens when the host starts.</p>'}
    </section>`;
  } else if (game.phase === 'clue') {
    const round = game.round || 1;
    const clue = mystery.clues[round - 1][clueIndex(game.code, game.seat, round, mystery.clues[round - 1].length)];
    stage = `<section class="game-sheet">
      <div class="round-bar"><div><span>Room ${game.code}</span><strong>Round ${round} of 3</strong></div><div class="timer ${game.secondsLeft === 0 ? 'timer-ended' : ''}" aria-label="${formatTime(game.secondsLeft)} remaining"><span>${game.paused ? 'Paused' : game.secondsLeft === 0 ? 'Time is up' : 'Discuss'}</span><strong>${formatTime(game.secondsLeft)}</strong></div></div>
      <div class="case-heading"><div><p class="eyebrow">${mystery.name}</p><${headingTag} tabindex="-1">Notebook ${game.seat}: ${clue.title}</${headingTag}></div><button class="sound-toggle" type="button" data-action="sound" aria-pressed="${settings.sound}">${settings.sound ? 'Turn sound off' : 'Turn sound on'}</button></div>
      <div class="clue-layout">
        ${specimen(clue)}
        <div class="clue-copy"><p class="clue-main">${clue.text}</p><p>${clue.detail}</p><div class="read-note"><strong>Read both lines aloud.</strong><span>Then compare what each notebook shows.</span></div></div>
      </div>
      <div class="game-controls">
        ${game.role === 'host' || demoMode ? `<button class="button secondary" type="button" data-action="pause">${game.paused ? 'Resume timer' : 'Pause timer'}</button><button class="button primary" type="button" data-action="next-round">${round < 3 ? `Open round ${round + 1}` : 'Make group accusation'}</button>` : '<p class="host-wait">The host controls the timer and opens the next round.</p>'}
      </div>
    </section>`;
  } else if (game.phase === 'accuse') {
    stage = game.role === 'host' || demoMode ? `<section class="accusation-sheet paper-panel">
      <p class="specimen-number">FINAL ENTRY · ROOM ${game.code}</p>
      <${headingTag} tabindex="-1">Record one group accusation</${headingTag}>
      <p>Choose after every player has shared all three clues.</p>
      <form id="accusation-form">
        <fieldset><legend>Who took ${mystery.missing.toLowerCase()}?</legend>
          <div class="suspect-list">${mystery.suspects.map((suspect) => `<label><input type="radio" name="suspect" value="${suspect.id}" required /><span><strong>${suspect.name}</strong><small>${suspect.role} · ${suspect.note}</small></span></label>`).join('')}</div>
        </fieldset>
        <button class="button primary" type="submit">Lock accusation and reveal</button>
      </form>
    </section>` : `<section class="waiting-sheet paper-panel"><p class="specimen-number">FINAL ENTRY · ROOM ${game.code}</p><${headingTag} tabindex="-1">The host is choosing the accusation</${headingTag}><p>Keep this page open. The answer will appear here for everyone.</p><p class="sync-status" data-connected="${roomConnected}" role="status"><i aria-hidden="true"></i><span>${roomConnected ? 'Room connected' : 'Reconnecting'}</span></p></section>`;
  } else {
    const accused = mystery.suspects.find((suspect) => suspect.id === game?.accusation);
    const correct = game.accusation ? game.accusation === mystery.answer : null;
    stage = `<section class="reveal-sheet paper-panel">
      <p class="specimen-number">CASE REVEAL · ${mystery.name}</p>
      <${headingTag} tabindex="-1">${correct === true ? 'Your group solved it' : correct === false ? 'The evidence points elsewhere' : 'Open the group reveal'}</${headingTag}>
      ${accused ? `<p class="verdict">You accused <strong>${accused.name}</strong>.</p>` : '<p class="verdict">The host can read this answer to the group.</p>'}
      <h2>${mystery.suspects.find((suspect) => suspect.id === mystery.answer)?.name} took the item</h2>
      <p>${mystery.reveal}</p>
      <div class="case-summary"><span>Three rounds completed</span><span>${game.players} player notebooks</span><span>${correct === null ? 'Shared reveal' : correct ? 'Correct accusation' : 'Case learned'}</span></div>
      <p>${mystery.replayNote}</p>
      <div class="reveal-actions"><button type="button" class="button primary" data-action="play-again">Start a second case</button><button type="button" class="button secondary" data-action="new-room">Return home</button></div>
    </section>`;
  }

  const introduction = rootSample ? `<section class="root-intro paper-panel">
      <div><p class="eyebrow">A browser game for 4–8 players</p><h1 tabindex="-1">Solve a mystery with your friends</h1><p>Compare private clues on a call and make one group accusation.</p></div>
      <div class="root-actions"><a class="button primary" href="/demo" data-link>Try it with sample data</a><span>Round one opens with one click.</span><a class="text-button" href="/setup" data-link>Start a synchronized room</a></div>
      <ul class="root-facts" aria-label="Game facts"><li><strong>Price:</strong> two free cases</li><li><strong>Privacy:</strong> private clues stay local</li><li><strong>Offline:</strong> demo reloads after one visit</li></ul>
    </section>` : '';
  const homeSections = rootSample ? `<section class="root-how" aria-labelledby="root-how-title"><h2 id="root-how-title">How the game works</h2><ol><li><strong>Share the room code.</strong> Each friend chooses a private notebook.</li><li><strong>Compare three clues.</strong> The host opens each round for everyone.</li><li><strong>Make one accusation.</strong> The answer appears on every joined screen.</li></ol></section><section class="root-limits" aria-labelledby="root-limits-title"><h2 id="root-limits-title">What the game stores</h2><p>The demo stays on your device. Real rooms send only the case, timer, and round to our room server.</p><p>Private clues and accusations stay in your browser. Server room state expires after six hours.</p></section><section class="root-cases" aria-labelledby="root-cases-title"><h2 id="root-cases-title">Two cases are free</h2><p>The Glasshouse Lantern and The Orchid Ledger need no checkout or license.</p><a class="button secondary" href="/setup" data-link>Start a synchronized room</a></section>` : '';
  return shell(`<main id="main" class="game-main ${rootSample ? 'root-game' : ''}">
    <div class="game-backdrop" aria-hidden="true"></div>
    ${introduction}
    ${stage}
    <aside class="case-tab"><span>${mystery.name}</span><button type="button" data-action="leave-room">Leave room</button></aside>
    ${homeSections}
  </main>`);
}

function privacyPage(): string {
  return shell(`<main id="main" class="simple-page paper-panel"><p class="eyebrow">Privacy</p><h1 tabindex="-1">See what a room stores</h1><p>Room Code Mystery does not require an account. Real rooms send their code, case, player count, round, and timer to our product server.</p><h2>Data stored by your browser</h2><p>Your notebook number, private clues, accusation, and sound setting stay in browser storage. Demo data uses a separate <code>demo:</code> namespace and never contacts the room server.</p><h2>Short-lived room data</h2><p>Shared room state uses product-owned SQLite storage. It expires six hours after the last host action. Accusations are never sent or stored there.</p><h2>What we do not collect</h2><p>The game has no accounts, advertising, analytics, public matchmaking, voice recording, video recording, or automated judging.</p><p>Questions can be sent to <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p></main>`);
}

function termsPage(): string {
  return shell(`<main id="main" class="simple-page paper-panel"><p class="eyebrow">Terms</p><h1 tabindex="-1">Play fairly and share the clues</h1><p>Room Code Mystery is a browser game for personal group play. You may share a room code with people in your gathering.</p><h2>Free cases</h2><p>The Glasshouse Lantern and The Orchid Ledger are free. Paid cases and checkout are unavailable.</p><h2>Room lifetime</h2><p>A synchronized room can end after six hours without host activity. Keep your call open while you play.</p><h2>Fair use</h2><p>Do not republish the case text, sell room access, or use the service to harm others.</p><p>These terms were last updated on September 2, 2026.</p></main>`);
}

function notFoundPage(): string {
  return shell(`<main id="main" class="simple-page missing-page"><h1 tabindex="-1">Page not found</h1><p>The address may be old or incomplete.</p><a class="button primary" href="/" data-link>Return to the game</a></main>`);
}

function render(focusHeading = false): void {
  const route = routeName();
  const titles = {
    home: 'Room Code Mystery — Play a three-round mystery',
    setup: 'Start a room — Room Code Mystery',
    play: 'Your room — Room Code Mystery',
    demo: 'Demo — Room Code Mystery',
    privacy: 'Privacy — Room Code Mystery',
    terms: 'Terms — Room Code Mystery',
    'not-found': 'Page not found — Room Code Mystery',
  };
  document.title = titles[route];
  const descriptions = {
    home: 'Play a three-round browser mystery with 4–8 friends using synchronized room codes and private clues.',
    setup: 'Create or join a synchronized Room Code Mystery game for 4–8 friends.',
    play: 'Open your private notebook and follow the host through three evidence rounds.',
    demo: 'Try Room Code Mystery with isolated sample data. Nothing in the demo is saved to a real room.',
    privacy: 'See what Room Code Mystery stores in your browser and its short-lived room server.',
    terms: 'Read the terms for playing and sharing Room Code Mystery.',
    'not-found': 'The requested Room Code Mystery page was not found.',
  };
  const canonicalPath = route === 'not-found' ? '/404.html' : location.pathname;
  const canonical = `https://room-code-mystery.sociobot.in${canonicalPath}`;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', descriptions[route]);
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonical);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', titles[route]);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', descriptions[route]);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', canonical);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', titles[route]);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', descriptions[route]);
  app.innerHTML = route === 'setup' ? setupPage() : route === 'privacy' ? privacyPage() : route === 'terms' ? termsPage() : route === 'not-found' ? notFoundPage() : gameView(route === 'home');
  bindEvents();
  if (!demoMode && game) connectRoom();
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
      const wasDemo = demoMode;
      demoMode = target.pathname === '/' || target.pathname === '/demo';
      if (wasDemo && !demoMode) localStorage.removeItem(DEMO_STATE_KEY);
      if (demoMode) game = readState();
      navigate(target.pathname);
    });
  });

  document.querySelector<HTMLFormElement>('#create-room')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const caseId = String(data.get('case'));
    const players = Number(data.get('players'));
    roomBusy = true;
    formError = '';
    render();
    try {
      const result = await createRemoteRoom(caseId, players);
      game = gameFromShared(result.room, null, 'host', result.hostToken);
      saveState();
      disconnectRoom();
      navigate('/play');
    } catch {
      roomBusy = false;
      formError = 'The room could not be created. Check your connection and try again.';
      render();
    }
  });

  document.querySelector<HTMLFormElement>('#join-room')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget as HTMLFormElement).get('code') ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^[A-HJ-NP-Z2-9]{5}$/.test(code)) {
      formError = 'That code is not valid. Ask the host for all five characters and try again.';
      render();
      return;
    }
    roomBusy = true;
    formError = '';
    render();
    try {
      const result = await joinRemoteRoom(code);
      game = gameFromShared(result.room, null, 'player');
      saveState();
      disconnectRoom();
      navigate('/play');
    } catch (error) {
      roomBusy = false;
      formError = error instanceof Error ? error.message : 'That room could not be opened. Ask the host to check the code.';
      render();
    }
  });

  document.querySelector<HTMLFormElement>('#accusation-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!game) return;
    const suspect = String(new FormData(event.currentTarget as HTMLFormElement).get('suspect') ?? '');
    if (!suspect) return;
    game = { ...game, accusation: suspect, phase: 'reveal' };
    saveState();
    void syncHost();
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
      navigate('/setup');
    } else if (action === 'copy-code' && game) {
      const roomLink = `${location.origin}/play?room=${game.code}`;
      void navigator.clipboard.writeText(roomLink).then(() => {
        button.textContent = 'Room link copied';
      }).catch(() => {
        button.textContent = `Share ${game?.code}`;
      });
    } else if (action === 'next-round' && game) {
      game = nextRound(game);
      saveState();
      void syncHost();
      playChime();
      render(true);
    } else if (action === 'pause' && game) {
      game = { ...game, paused: !game.paused };
      saveState();
      void syncHost();
      updateTimerDom();
    } else if (action === 'sound') {
      settings.sound = !settings.sound;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      if (settings.sound) playChime();
      render();
    } else if (action === 'play-again' && game) {
      const nextCase = game.caseId === cases[0].id ? cases[1] : cases[0];
      if (demoMode) {
        game = createState(makeRoomCode(game.players, nextCase.paid), nextCase.id, game.players, 'host');
        saveState();
        render(true);
      } else {
        roomBusy = true;
        void createRemoteRoom(nextCase.id, game.players).then((result) => {
          game = gameFromShared(result.room, null, 'host', result.hostToken);
          saveState();
          disconnectRoom();
          render(true);
          connectRoom();
        }).catch(() => updateSyncStatus('A new room could not be created.'));
      }
    } else if ((action === 'new-room' || action === 'leave-room') && game) {
      disconnectRoom();
      game = null;
      localStorage.removeItem(demoMode ? DEMO_STATE_KEY : REAL_STATE_KEY);
      if (demoMode) {
        game = readState();
        render(true);
      } else navigate('/setup');
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

function updateTimerDom(): void {
  if (!game || game.phase !== 'clue') return;
  const timer = document.querySelector<HTMLElement>('.timer');
  const status = timer?.querySelector<HTMLElement>('span');
  const value = timer?.querySelector<HTMLElement>('strong');
  const pause = document.querySelector<HTMLButtonElement>('[data-action="pause"]');
  if (!timer || !status || !value || !pause) return;
  const formatted = formatTime(game.secondsLeft);
  timer.classList.toggle('timer-ended', game.secondsLeft === 0);
  timer.setAttribute('aria-label', `${formatted} remaining`);
  status.textContent = game.paused ? 'Paused' : game.secondsLeft === 0 ? 'Time is up' : 'Discuss';
  value.textContent = formatted;
  pause.textContent = game.paused ? 'Resume timer' : 'Pause timer';
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
      if (game.role === 'host' && !demoMode) void syncHost();
      updateTimerDom();
    }
  }
  timerFrame = requestAnimationFrame(timerLoop);
}

addEventListener('popstate', () => {
  const wasDemo = demoMode;
  demoMode = location.pathname === '/' || location.pathname === '/demo';
  if (wasDemo && !demoMode) localStorage.removeItem(DEMO_STATE_KEY);
  if (demoMode) disconnectRoom();
  game = readState();
  render(true);
});
addEventListener('online', () => { online = true; render(); });
addEventListener('offline', () => { online = false; render(); });
document.addEventListener('visibilitychange', () => { lastFrame = performance.now(); });

render();
timerFrame = requestAnimationFrame(timerLoop);
void timerFrame;

const sharedCode = new URLSearchParams(location.search).get('room');
if (!demoMode && sharedCode) {
  void joinRemoteRoom(sharedCode).then((result) => {
    game = gameFromShared(result.room, null, 'player');
    saveState();
    history.replaceState({}, '', '/play');
    disconnectRoom();
    render(true);
    connectRoom();
  }).catch(() => {
    formError = 'That room has ended or the shared link is wrong.';
    history.replaceState({}, '', '/setup');
    render(true);
  });
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => void navigator.serviceWorker.register('/sw.js'));
}
