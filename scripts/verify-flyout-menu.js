const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('[verify-menu] Launching Edge headless browser...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1680,1050',
    ],
  });

  const page = await browser.newPage();

  // 1. Authenticate as admin
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@servicemeow.io', password: 'admin123' }),
  });
  const { token } = await loginRes.json();
  await page.setCookie({
    name: 'servicemeow_session',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
  });

  // 2. Open workspace with compact_rail layout mode
  await page.goto(`${BASE_URL}/workspace`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('servicemeow_layout_mode', 'compact_rail');
  });
  await page.reload({ waitUntil: 'networkidle2' });

  // 3. Find Workplace Hub rail item
  console.log('[verify-menu] Finding Workplace Hub rail icon...');
  const railItem = await page.$('[data-sidebar-rail-item="Workplace Hub"]');
  if (!railItem) {
    throw new Error('Could not find Workplace Hub rail item!');
  }

  // 4. Hover over the rail item
  console.log('[verify-menu] Hovering over Workplace Hub rail item...');
  await railItem.hover();
  await new Promise(r => setTimeout(r, 200));

  // Check if flyout is rendered
  let flyout = await page.$('[data-sidebar-flyout="Workplace Hub"]');
  if (!flyout) {
    throw new Error('Flyout did not appear on hover!');
  }
  console.log('[verify-menu] Flyout appeared successfully.');

  // 5. Move mouse diagonally towards "Spatial Explorer" item
  console.log('[verify-menu] Moving cursor towards "Spatial Explorer" in flyout...');
  const spatialLink = await page.waitForSelector('a[href="/workspace/spaces"]', { timeout: 2000 });
  await spatialLink.hover();
  await new Promise(r => setTimeout(r, 400));

  // Verify flyout is STILL visible after 400ms (longer than the 350ms close timeout)
  flyout = await page.$('[data-sidebar-flyout="Workplace Hub"]');
  if (!flyout) {
    throw new Error('Flyout closed prematurely while moving over it!');
  }
  console.log('[verify-menu] Flyout remained open stably over items.');

  // 6. Click "Spatial Explorer"
  console.log('[verify-menu] Clicking "Spatial Explorer"...');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    spatialLink.click(),
  ]);

  console.log('[verify-menu] Navigated to:', page.url());
  if (!page.url().includes('/workspace/spaces')) {
    throw new Error(`Expected URL to include /workspace/spaces, got ${page.url()}`);
  }

  // 7. Test Click-to-Pin
  console.log('[verify-menu] Testing Click-to-Pin functionality...');
  await page.goto(`${BASE_URL}/workspace`, { waitUntil: 'networkidle2' });
  const railBtn = await page.$('[data-sidebar-rail-item="Workplace Hub"] button');
  await railBtn.click();
  await new Promise(r => setTimeout(r, 200));

  // Move mouse away to the right side of the screen
  await page.mouse.move(800, 500);
  await new Promise(r => setTimeout(r, 500));

  // Verify flyout is STILL visible because it was pinned open by click!
  const pinnedFlyout = await page.$('[data-sidebar-flyout="Workplace Hub"]');
  if (!pinnedFlyout) {
    throw new Error('Pinned flyout disappeared after mouse moved away!');
  }
  console.log('[verify-menu] Pinned flyout stayed open successfully after mouse moved away!');

  await page.screenshot({
    path: 'C:\\Users\\oleha\\.gemini\\antigravity\\brain\\463cb7c1-f5f2-436f-9995-ef33c9e84791\\flyout_fixed_menu.png',
  });
  console.log('[verify-menu] Screenshot captured to flyout_fixed_menu.png');

  await browser.close();
  console.log('[verify-menu] All flyout interaction tests PASSED flawlessly!');
}

main().catch(err => {
  console.error('[verify-menu] Error:', err);
  process.exit(1);
});
