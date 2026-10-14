const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';
const ASSETS_DIR = path.resolve(__dirname, '../docs/assets');

async function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Ensure admin user has deterministic password for screenshot capture
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `file:${path.resolve(__dirname, '../prisma/dev.db')}`;
  }
  const prisma = new PrismaClient();
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.user.updateMany({
    where: { role: 'admin' },
    data: { passwordHash: adminHash }
  });
  await prisma.$disconnect();

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
    // 1. Fulfiller Workspace (Real Incident & Tabs)
    await capture('/workspace/incident', 'workspace-showcase.png', { waitMs: 2500 });

    // 2. Studio IDE Workbench (Real Studio with Studio Explorer & Modules)
    await capture('/studio', 'studio-showcase.png', { waitMs: 2500 });

    // 3. Self-Service Portal (Real Employee Portal)
    await capture('/portal', 'portal-showcase.png', { waitMs: 2500 });

    // 4. Workplace Hub: Reservations (Real Room & Desk Booking with Floorplan)
    await capture('/portal/reservations', 'workplace-showcase.png', { waitMs: 2500 });
    fs.copyFileSync(
      path.join(ASSETS_DIR, 'workplace-showcase.png'),
      path.join(ASSETS_DIR, 'connected-workplace-showcase.png')
    );

    // 5. Workplace Spatial Hierarchy (Real 6-Tier Spatial Tree)
    await capture('/portal/spaces', 'spaces-showcase.png', { waitMs: 2500 });

    // 6. Agile Project Management Kanban Board
    await capture('/workspace/agile', 'agile-board-showcase.png', { waitMs: 2500 });

    // 7. Universal Excel-Style Table Data Editor
    await capture('/studio?tab=table_editor', 'table-editor-showcase.png', { waitMs: 2500 });

    // 8. Agent Operations Center Showcase
    await capture('/workspace', 'agent-operations-center.png', { waitMs: 2500 });

    // 9. Employee Data Explorer (Direct Table Directory & CSV Extract)
    await capture('/portal/data-explorer', 'data-explorer-showcase.png', { waitMs: 2500 });

    // Copy to brain artifacts directory for visual inspection
    const BRAIN_DIR = 'C:\\Users\\oleha\\.gemini\\antigravity\\brain\\1be697e7-5d02-48d0-ba40-4d6a140f7a0a';
    if (fs.existsSync(BRAIN_DIR)) {
      ['portal-showcase.png', 'workplace-showcase.png', 'data-explorer-showcase.png', 'table-editor-showcase.png'].forEach(file => {
        try {
          fs.copyFileSync(path.join(ASSETS_DIR, file), path.join(BRAIN_DIR, file));
        } catch {}
      });
    }

    console.log('[capture] ALL REAL SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('[capture] Error:', err);
  process.exit(1);
});
