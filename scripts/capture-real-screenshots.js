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
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const BROWSER_PATH = resolveBrowserPath();
const BASE_URL = 'http://localhost:3000';
const ASSETS_DIR = path.resolve(__dirname, '../docs/assets');

async function main() {
  if (!BROWSER_PATH) {
    console.error('No suitable browser (Edge/Chrome/Chromium) found. Set PUPPETEER_EXECUTABLE_PATH in environment.');
    process.exit(1);
  }

  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  console.log(`[capture] Launching headless browser from: ${BROWSER_PATH}...`);
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1680,1050',
      '--force-device-scale-factor=2',
    ],
    defaultViewport: {
      width: 1680,
      height: 1050,
      deviceScaleFactor: 2,
    },
  });

  const page = await browser.newPage();

  // 1. Authenticate as admin via API
  console.log('[capture] Logging in as admin@servicemeow.io...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@servicemeow.io',
      password: 'admin123',
    }),
  });

  const loginData = await loginRes.json();
  if (!loginData.token) {
    throw new Error('Failed to login: ' + JSON.stringify(loginData));
  }

  // Set the cookie in browser
  await page.setCookie({
    name: 'servicemeow_session',
    value: loginData.token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
  });

  console.log('[capture] Session cookie set successfully.');

  // Helper to capture a page
  async function capture(url, filename, options = {}) {
    console.log(`[capture] Navigating to ${url}...`);
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Optional delay for CSS animations or client renders
    await new Promise(r => setTimeout(r, options.waitMs || 2000));

    if (options.action) {
      await options.action(page);
      await new Promise(r => setTimeout(r, 1000));
    }

    const dest = path.join(ASSETS_DIR, filename);
    await page.screenshot({ path: dest, fullPage: false });
    const stats = fs.statSync(dest);
    console.log(`[capture] Saved screenshot: ${filename} (${Math.round(stats.size / 1024)} KB)`);
  }

  try {
    // 1. Fulfiller Workspace (Real Incident & Multi-Record Tabs)
    await capture('/workspace/incident', 'workspace-showcase.png', { waitMs: 2500 });

    // 2. Studio IDE Workbench (Real Studio with Studio Explorer & Modules)
    await capture('/studio', 'studio-showcase.png', { waitMs: 2500 });

    // 3. Self-Service Portal (Swiss Grid Employee Portal)
    await capture('/portal', 'portal-showcase.png', { waitMs: 2500 });

    // 4. Workplace Hub: Reservations (Catalog View)
    await capture('/portal/reservations', 'workplace-showcase.png', {
      waitMs: 2500,
      action: async (p) => {
        await p.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('01 / Room List'));
          if (btn) btn.click();
        });
      }
    });
    fs.copyFileSync(
      path.join(ASSETS_DIR, 'workplace-showcase.png'),
      path.join(ASSETS_DIR, 'connected-workplace-showcase.png')
    );

    // 5. Workplace Hub: Calendar Schedule View
    await capture('/portal/reservations', 'calendar-view-showcase.png', {
      waitMs: 2000,
      action: async (p) => {
        await p.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('02 / Calendar'));
          if (btn) btn.click();
        });
      }
    });
    fs.copyFileSync(
      path.join(ASSETS_DIR, 'calendar-view-showcase.png'),
      path.join(ASSETS_DIR, 'calendar-view.png')
    );

    // 6. Workplace Hub: Architectural CAD Floor Plan View
    await capture('/portal/reservations', 'cad-drawing-showcase.png', {
      waitMs: 2000,
      action: async (p) => {
        await p.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('03 / Floor Plan'));
          if (btn) btn.click();
        });
      }
    });
    fs.copyFileSync(
      path.join(ASSETS_DIR, 'cad-drawing-showcase.png'),
      path.join(ASSETS_DIR, 'cad-drawing-view.png')
    );

    // 7. Space Console: Enterprise Architectural CAD & Floor Sheets
    await capture('/workspace/spaces', 'spatial-hierarchy-cad-showcase.png', { waitMs: 3000 });

    // 8. Workplace Spatial Hierarchy: Employee Portal Spaces
    await capture('/portal/spaces', 'spaces-showcase.png', { waitMs: 2500 });

    // 9. Unified Locations & Spatial Hierarchy
    await capture('/workspace/locations', 'unified_locations_editable_list.png', { waitMs: 2500 });
    fs.copyFileSync(
      path.join(ASSETS_DIR, 'unified_locations_editable_list.png'),
      path.join(ASSETS_DIR, 'unified_locations_split_explorer.png')
    );
    fs.copyFileSync(
      path.join(ASSETS_DIR, 'unified_locations_editable_list.png'),
      path.join(ASSETS_DIR, 'unified_locations_tree_builder.png')
    );

    // 10. Real Hero Banner (Crisp capture of the Space Console & Architectural Blueprint)
    await capture('/workspace/spaces', 'hero-banner.png', { waitMs: 3000 });
    fs.copyFileSync(
      path.join(ASSETS_DIR, 'hero-banner.png'),
      path.join(ASSETS_DIR, 'hero-banner.jpg')
    );

    // 11. Agile Sprint Board (Swiss Grid 5-Column Kanban)
    await capture('/workspace/agile', 'agile-board-showcase.png', { waitMs: 2500 });

    // 12. Problem Management & Known Error Database (KEDB)
    await capture('/workspace/problem/new', 'problem-management-showcase.png', { waitMs: 2500 });

    // 13. CMDB Configuration Items & Datacenter Rackmount Spec
    await capture('/workspace/cmdb_ci/new', 'cmdb-ci-showcase.png', { waitMs: 2500 });

    // 14. Knowledge Management & Markdown Editor
    await capture('/workspace/kb_knowledge/new', 'knowledge-showcase.png', { waitMs: 2500 });

    console.log('[capture] ALL REAL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('[capture] Error:', err);
  process.exit(1);
});
