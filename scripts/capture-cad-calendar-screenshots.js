const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';
const ASSETS_DIR = path.resolve(__dirname, '../docs/assets');
const ARTIFACT_DIR = 'C:\\Users\\oleha\\.gemini\\antigravity\\brain\\463cb7c1-f5f2-436f-9995-ef33c9e84791';

async function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  console.log('[capture] Launching Edge headless browser...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
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
  console.log('[capture] Authenticating as admin@servicemeow.io...');
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

  console.log('[capture] Authenticated session cookie established.');

  // Ensure default time format or standard
  await page.goto(`${BASE_URL}/portal/reservations`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem('servicemeow_time_format', '12h');
  });

  // -------------------------------------------------------------
  // 1. CAPTURE CALENDAR VIEW
  // -------------------------------------------------------------
  console.log('[capture] Navigating to Calendar View (/portal/reservations?view=calendar)...');
  await page.goto(`${BASE_URL}/portal/reservations?view=calendar`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  const calFileAssets = path.join(ASSETS_DIR, 'calendar-view-showcase.png');
  const calFileArtifact = path.join(ARTIFACT_DIR, 'calendar_view_showcase.png');
  await page.screenshot({ path: calFileAssets, fullPage: false });
  fs.copyFileSync(calFileAssets, calFileArtifact);
  console.log(`[capture] Saved Calendar View to ${calFileAssets} (${Math.round(fs.statSync(calFileAssets).size / 1024)} KB)`);

  // Also create alias calendar-view.png
  fs.copyFileSync(calFileAssets, path.join(ASSETS_DIR, 'calendar-view.png'));

  // -------------------------------------------------------------
  // 2. CAPTURE CAD / DRAWING FLOORPLAN VIEW
  // -------------------------------------------------------------
  console.log('[capture] Navigating to CAD / Drawing Floorplan View (/portal/reservations?view=floorplan)...');
  await page.goto(`${BASE_URL}/portal/reservations?view=floorplan`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  // Scroll slightly if needed or keep default viewport
  const cadFileAssets = path.join(ASSETS_DIR, 'cad-drawing-showcase.png');
  const cadFileArtifact = path.join(ARTIFACT_DIR, 'cad_drawing_showcase.png');
  await page.screenshot({ path: cadFileAssets, fullPage: false });
  fs.copyFileSync(cadFileAssets, cadFileArtifact);
  console.log(`[capture] Saved CAD / Drawing View to ${cadFileAssets} (${Math.round(fs.statSync(cadFileAssets).size / 1024)} KB)`);

  // Also create alias cad-drawing-view.png
  fs.copyFileSync(cadFileAssets, path.join(ASSETS_DIR, 'cad-drawing-view.png'));

  // -------------------------------------------------------------
  // 3. CAPTURE FULFILLER WORKSPACE SPACES CAD / SPATIAL EXPLORER
  // -------------------------------------------------------------
  console.log('[capture] Navigating to Fulfiller Workspace Spaces (/workspace/spaces)...');
  await page.goto(`${BASE_URL}/workspace/spaces`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  const spacesFileAssets = path.join(ASSETS_DIR, 'spatial-hierarchy-cad-showcase.png');
  await page.screenshot({ path: spacesFileAssets, fullPage: false });
  console.log(`[capture] Saved Spatial CAD Explorer to ${spacesFileAssets}`);

  await browser.close();
  console.log('[capture] All captures completed successfully.');
}

main().catch((err) => {
  console.error('[capture] Error:', err);
  process.exit(1);
});
