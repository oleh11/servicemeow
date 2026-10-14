const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';
const ARTIFACT_DIR = 'C:\\Users\\oleha\\.gemini\\antigravity\\brain\\463cb7c1-f5f2-436f-9995-ef33c9e84791';

async function main() {
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

  console.log('[capture] Authenticated session cookie set.');

  // 2. Capture Workplace Hub with 12H standard time
  console.log('[capture] Loading /portal/reservations in 12H format...');
  await page.goto(`${BASE_URL}/portal/reservations`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem('servicemeow_time_format', '12h');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const p12h = path.join(ARTIFACT_DIR, 'workplace_hub_12h_standard.png');
  await page.screenshot({ path: p12h, fullPage: false });
  console.log(`[capture] Saved 12H screenshot to ${p12h}`);

  // 3. Switch to 24H Military Time and capture
  console.log('[capture] Switching to 24H Military Time format...');
  await page.evaluate(() => {
    localStorage.setItem('servicemeow_time_format', '24h');
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const p24h = path.join(ARTIFACT_DIR, 'workplace_hub_24h_military.png');
  await page.screenshot({ path: p24h, fullPage: false });
  console.log(`[capture] Saved 24H Military screenshot to ${p24h}`);

  // 4. Capture Calendar Matrix in 24H Military Time
  console.log('[capture] Loading Calendar Matrix view in 24H Military Time...');
  await page.goto(`${BASE_URL}/portal/reservations?view=calendar`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  const pCal = path.join(ARTIFACT_DIR, 'workplace_hub_calendar_24h.png');
  await page.screenshot({ path: pCal, fullPage: false });
  console.log(`[capture] Saved Calendar matrix screenshot to ${pCal}`);

  // 5. Open Booking Modal and capture in-modal format toggle
  console.log('[capture] Opening Booking Modal to show in-modal military time switch...');
  await page.goto(`${BASE_URL}/portal/reservations?view=catalog`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  
  // Click first available reserve button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Reserve This Space')) {
      await btn.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));

  const pModal = path.join(ARTIFACT_DIR, 'workplace_hub_booking_modal_military.png');
  await page.screenshot({ path: pModal, fullPage: false });
  console.log(`[capture] Saved Booking Modal screenshot to ${pModal}`);

  await browser.close();
  console.log('[capture] All screenshots captured successfully.');
}

main().catch(err => {
  console.error('[capture] Error:', err);
  process.exit(1);
});
