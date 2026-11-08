// Captures the README showcase screenshots from a running ServiceMeow instance.
//
//   npm run dev                  # in another terminal, against a seeded database
//   npm run capture:screenshots
//
// Every README image is captured from its own page/view — no file is a copy of another.
// Env:
//   CAPTURE_BASE_URL            default http://localhost:3000
//   PUPPETEER_EXECUTABLE_PATH   Chrome/Edge binary (auto-detected otherwise)
//   SEED_ADMIN_PASSWORD         admin password; if unset, uses the dev-only persona login
//                               (requires ALLOW_DEV_PERSONA_LOGIN=true on the server)
//   CAPTURE_ONLY                comma-separated file names to capture a subset

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

function resolveBrowserPath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidatePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/microsoft-edge',
  ];
  return candidatePaths.find((p) => fs.existsSync(p)) || null;
}

const BROWSER_PATH = resolveBrowserPath();
const BASE_URL = (process.env.CAPTURE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const ASSETS_DIR = path.resolve(__dirname, '../docs/assets');
const ONLY = (process.env.CAPTURE_ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  const body = password
    ? { email: 'admin@servicemeow.io', password }
    : { personaId: 'admin' };
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.token) {
    throw new Error(
      `Login failed (${res.status}): ${data.error || 'no token'}. ` +
        'Set SEED_ADMIN_PASSWORD, or run the dev server with ALLOW_DEV_PERSONA_LOGIN=true.'
    );
  }
  return data.token;
}

/** Click the first button/link whose visible text contains `text`. */
async function clickText(page, text) {
  const clicked = await page.evaluate((t) => {
    const el = Array.from(document.querySelectorAll('button, a')).find(
      (b) => b.textContent && b.textContent.replace(/\s+/g, ' ').includes(t)
    );
    if (el) el.click();
    return !!el;
  }, text);
  if (!clicked) console.warn(`[capture]   (no element with text "${text}")`);
  await sleep(1200);
}

/** Scroll the first element matching `selector` into the middle of the viewport. */
async function scrollTo(page, selector) {
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (el) el.scrollIntoView({ block: 'center' });
  }, selector);
  await sleep(800);
}

/** First record id of a table, via the authenticated Table API. */
async function firstRecordId(page, table) {
  return page.evaluate(async (t) => {
    const res = await fetch(`/api/now/table/${t}?sysparm_limit=1`);
    const json = await res.json();
    const rec = (json.result || [])[0];
    return rec ? rec.sys_id || rec.id : null;
  }, table);
}

// One entry per README image. `url` may be a function of the page (for record ids).
const SHOTS = [
  { file: 'hero-banner.png', url: '/workspace/spaces', waitMs: 3500 },
  { file: 'workspace-showcase.png', url: '/workspace/incident' },
  { file: 'studio-showcase.png', url: '/studio' },
  { file: 'portal-showcase.png', url: '/portal' },
  { file: 'spaces-showcase.png', url: '/portal/spaces', action: (p) => clickText(p, 'Level 18') },
  { file: 'workplace-showcase.png', url: '/portal/reservations', action: (p) => clickText(p, '01 / Room List') },
  { file: 'calendar-view-showcase.png', url: '/portal/reservations', action: (p) => clickText(p, '02 / Calendar') },
  { file: 'cad-drawing-showcase.png', url: '/portal/reservations', action: (p) => clickText(p, '03 / Floor Plan') },
  {
    file: 'spatial-hierarchy-cad-showcase.png',
    url: '/workspace/spaces',
    waitMs: 3500,
    action: (p) => scrollTo(p, 'img[alt="CAD Blueprint"]'),
  },
  { file: 'unified_locations_editable_list.png', url: '/workspace/cmn_location' },
  { file: 'unified_locations_tree_builder.png', url: '/workspace/cmn_location', action: (p) => clickText(p, 'Hierarchy Tree') },
  { file: 'unified_locations_split_explorer.png', url: '/workspace/cmn_location', action: (p) => clickText(p, 'Tree + Detail') },
  { file: 'cmn_state_new_form.png', url: '/workspace/cmn_state/new' },
  {
    file: 'cmn_state_saved_detail.png',
    url: async (p) => `/workspace/cmn_state/${await firstRecordId(p, 'cmn_state')}`,
  },
  { file: 'agile-board-showcase.png', url: '/workspace/agile' },
  { file: 'problem-management-showcase.png', url: '/workspace/problem/new' },
  { file: 'cmdb-ci-showcase.png', url: '/workspace/cmdb_ci/new' },
  { file: 'knowledge-showcase.png', url: '/portal/knowledge' },
  { file: 'table-editor-showcase.png', url: '/studio?tab=table_editor' },
  { file: 'data-explorer-showcase.png', url: '/portal/data-explorer' },
  { file: 'dashboard-showcase.png', url: '/workspace/dashboard' },
  { file: 'task-board-showcase.png', url: '/workspace/task-board' },
  { file: 'reports-showcase.png', url: '/workspace/reports' },
  { file: 'live-chat-showcase.png', url: '/workspace/chat' },
];

async function main() {
  if (!BROWSER_PATH) {
    console.error('No suitable browser (Edge/Chrome/Chromium) found. Set PUPPETEER_EXECUTABLE_PATH.');
    process.exit(1);
  }
  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  console.log(`[capture] Logging in to ${BASE_URL}...`);
  const token = await login();

  console.log(`[capture] Launching headless browser from: ${BROWSER_PATH}`);
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1680, height: 1050, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();
  await page.setCookie({
    name: 'servicemeow_session',
    value: token,
    url: BASE_URL,
    httpOnly: true,
  });
  // Screenshots always use the default light theme
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.removeItem('servicemeow_color_theme');
    } catch {}
  });

  let failures = 0;
  try {
    for (const shot of SHOTS) {
      if (ONLY.length && !ONLY.includes(shot.file)) continue;
      try {
        const url = typeof shot.url === 'function' ? await shot.url(page) : shot.url;
        await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle2', timeout: 45000 });
        await sleep(shot.waitMs || 2500);
        if (shot.action) await shot.action(page);

        const dest = path.join(ASSETS_DIR, shot.file);
        await page.screenshot({ path: dest, fullPage: false });
        console.log(`[capture] ${shot.file}  <-  ${url}  (${Math.round(fs.statSync(dest).size / 1024)} KB)`);
      } catch (err) {
        failures++;
        console.error(`[capture] FAILED ${shot.file}: ${err.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  if (failures) {
    console.error(`[capture] ${failures} screenshot(s) failed.`);
    process.exit(1);
  }
  console.log('[capture] Done.');
}

main().catch((err) => {
  console.error('[capture] Error:', err);
  process.exit(1);
});
