const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';
const ASSETS_DIR = path.resolve(__dirname, '../docs/assets');
const ARTIFACT_DIR = 'C:\\Users\\oleha\\.gemini\\antigravity\\brain\\463cb7c1-f5f2-436f-9995-ef33c9e84791';

async function main() {
  console.log('[verify] Launching Edge headless browser...');
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
  console.log('[verify] Authenticating as admin@servicemeow.io...');
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

  // 2. Navigate to /workspace/cmn_state/new
  console.log('[verify] Navigating to /workspace/cmn_state/new...');
  await page.goto(`${BASE_URL}/workspace/cmn_state/new`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));

  // Screenshot 1: New State Form
  const newFormImg = path.join(ASSETS_DIR, 'cmn_state_new_form.png');
  const artifactNewFormImg = path.join(ARTIFACT_DIR, 'cmn_state_new_form.png');
  await page.screenshot({ path: newFormImg });
  fs.copyFileSync(newFormImg, artifactNewFormImg);
  console.log(`[verify] Saved New State Form Screenshot -> ${newFormImg}`);

  // 3. Fill in the form fields
  console.log('[verify] Filling in State fields...');
  // State Name
  const nameInput = await page.$('input[placeholder*="California"]');
  if (nameInput) {
    await nameInput.type('Washington');
  } else {
    console.warn('[verify] Could not find name input by placeholder, searching by label');
    const inputs = await page.$$('input[type="text"]');
    if (inputs.length > 0) await inputs[0].type('Washington');
  }

  // State Code
  const codeInput = await page.$('input[placeholder*="US-CA"]');
  if (codeInput) {
    await codeInput.type('US-WA');
  }

  // Region dropdown
  const regionSelect = await page.$('select');
  if (regionSelect) {
    const options = await page.evaluate(sel => {
      return Array.from(sel.options).map(o => ({ value: o.value, text: o.text }));
    }, regionSelect);
    console.log('[verify] Available regions:', options);
    const americasOpt = options.find(o => o.text.includes('Americas') || o.text.includes('AMER'));
    if (americasOpt && americasOpt.value) {
      await regionSelect.select(americasOpt.value);
    } else if (options.length > 1) {
      await regionSelect.select(options[1].value);
    }
  }

  await page.evaluate(() => new Promise((r) => setTimeout(r, 500)));

  // Screenshot with filled fields
  const filledImg = path.join(ASSETS_DIR, 'cmn_state_filled_form.png');
  const artifactFilledImg = path.join(ARTIFACT_DIR, 'cmn_state_filled_form.png');
  await page.screenshot({ path: filledImg });
  fs.copyFileSync(filledImg, artifactFilledImg);
  console.log(`[verify] Saved Filled Form Screenshot -> ${filledImg}`);

  // 4. Click Create State / Province button
  console.log('[verify] Clicking Create State button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const createBtn = buttons.find(b => b.textContent && b.textContent.includes('Create'));
    if (createBtn) createBtn.click();
  });

  await page.evaluate(() => new Promise((r) => setTimeout(r, 2500)));

  // Screenshot 3: After creation / Detail view
  const detailImg = path.join(ASSETS_DIR, 'cmn_state_saved_detail.png');
  const artifactDetailImg = path.join(ARTIFACT_DIR, 'cmn_state_saved_detail.png');
  await page.screenshot({ path: detailImg });
  fs.copyFileSync(detailImg, artifactDetailImg);
  console.log(`[verify] Saved Detail View Screenshot -> ${detailImg}`);

  await browser.close();
  console.log('[verify] Complete!');
}

main().catch((err) => {
  console.error('[verify] Error:', err);
  process.exit(1);
});
