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
      '--window-size=1680,1100',
      '--force-device-scale-factor=2',
    ],
    defaultViewport: {
      width: 1680,
      height: 1100,
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

  console.log('[capture] Navigating to /workspace/cmn_location...');
  await page.goto(`${BASE_URL}/workspace/cmn_location`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));

  // Expand the first 2 rows with children in list view
  try {
    const expandButtons = await page.$$('button[title*="children"]');
    if (expandButtons.length > 0) {
      console.log(`[capture] Clicking accordion expansion on ${expandButtons.length} parent nodes...`);
      for (let i = 0; i < Math.min(2, expandButtons.length); i++) {
        await expandButtons[i].click();
        await page.evaluate(() => new Promise((r) => setTimeout(r, 400)));
      }
    }
  } catch (err) {
    console.warn('[capture] Accordion expand note:', err.message);
  }

  // Save 1: Editable List View
  const listImgPath = path.join(ASSETS_DIR, 'unified_locations_editable_list.png');
  await page.screenshot({ path: listImgPath });
  if (fs.existsSync(ARTIFACT_DIR)) {
    fs.copyFileSync(listImgPath, path.join(ARTIFACT_DIR, 'unified_locations_editable_list.png'));
  }
  console.log(`[capture] Saved Editable List View -> ${listImgPath}`);

  // Switch to View 2: Hierarchy Tree
  console.log('[capture] Switching to Hierarchy Tree tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const treeBtn = buttons.find(b => b.textContent && b.textContent.includes('Hierarchy Tree'));
    if (treeBtn) treeBtn.click();
  });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1000)));

  // Click Expand All in tree view
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const expandAllBtn = buttons.find(b => b.textContent && b.textContent.includes('Expand All'));
    if (expandAllBtn) expandAllBtn.click();
  });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));

  const treeImgPath = path.join(ASSETS_DIR, 'unified_locations_tree_builder.png');
  await page.screenshot({ path: treeImgPath });
  if (fs.existsSync(ARTIFACT_DIR)) {
    fs.copyFileSync(treeImgPath, path.join(ARTIFACT_DIR, 'unified_locations_tree_builder.png'));
  }
  console.log(`[capture] Saved Hierarchy Tree Builder -> ${treeImgPath}`);

  // Switch to View 3: Tree + Detail (Split Explorer)
  console.log('[capture] Switching to Tree + Detail tab...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const splitBtn = buttons.find(b => b.textContent && b.textContent.includes('Tree + Detail'));
    if (splitBtn) splitBtn.click();
  });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));

  const splitImgPath = path.join(ASSETS_DIR, 'unified_locations_split_explorer.png');
  await page.screenshot({ path: splitImgPath });
  if (fs.existsSync(ARTIFACT_DIR)) {
    fs.copyFileSync(splitImgPath, path.join(ARTIFACT_DIR, 'unified_locations_split_explorer.png'));
  }
  console.log(`[capture] Saved Tree + Detail -> ${splitImgPath}`);

  await browser.close();
  console.log('[capture] All location screenshots captured successfully!');
}

main().catch((err) => {
  console.error('[capture] Error:', err);
  process.exit(1);
});
