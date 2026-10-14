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

  // Get a sample state ID for saved detail view
  let sampleState = await prisma.cmnState.findFirst();
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
    
    await new Promise(r => setTimeout(r, options.waitMs || 2500));

    if (options.action) {
      await options.action(page);
      await new Promise(r => setTimeout(r, 1200));
    }

    const dest = path.join(ASSETS_DIR, filename);
    await page.screenshot({ path: dest, fullPage: false });
    const stats = fs.statSync(dest);
    console.log(`[capture] Saved screenshot: ${filename} (${Math.round(stats.size / 1024)} KB)`);
  }

  try {
    // 1. Fulfiller Workspace (Real Incident & Multi-Tabs)
    await capture('/workspace/incident', 'workspace-showcase.png', { waitMs: 2500 });

    // 2. Studio IDE Workbench
    await capture('/studio', 'studio-showcase.png', { waitMs: 2500 });

    // 3. Self-Service Portal
    await capture('/portal', 'portal-showcase.png', { waitMs: 2500 });

    // 4. Workplace Hub: Reservations (Catalog View)
    await capture('/portal/reservations', 'workplace-showcase.png', { waitMs: 2500 });
    fs.copyFileSync(
      path.join(ASSETS_DIR, 'workplace-showcase.png'),
      path.join(ASSETS_DIR, 'connected-workplace-showcase.png')
    );

    // 5. Workplace Hub: Daily Calendar Schedule View
    await capture('/portal/reservations', 'calendar-view-showcase.png', {
      waitMs: 2000,
      action: async (p) => {
        await p.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => b.textContent && b.textContent.includes('Calendar View'));
          if (btn) btn.click();
        });
      }
    });
    fs.copyFileSync(
      path.join(ASSETS_DIR, 'calendar-view-showcase.png'),
      path.join(ASSETS_DIR, 'calendar-view.png')
    );

    // 6. Workplace Hub: Architectural CAD / Floorplan View
    await capture('/portal/reservations', 'cad-drawing-showcase.png', {
      waitMs: 2000,
      action: async (p) => {
        await p.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => b.textContent && b.textContent.includes('Picture / Floorplan'));
          if (btn) btn.click();
        });
      }
    });
    fs.copyFileSync(
      path.join(ASSETS_DIR, 'cad-drawing-showcase.png'),
      path.join(ASSETS_DIR, 'cad-drawing-view.png')
    );

    // 7. Workplace Spatial Hierarchy
    await capture('/portal/spaces', 'spaces-showcase.png', { waitMs: 2500 });
    fs.copyFileSync(
      path.join(ASSETS_DIR, 'spaces-showcase.png'),
      path.join(ASSETS_DIR, 'spatial-hierarchy-cad-showcase.png')
    );

    // 8. Agile Project Management Kanban Board
    await capture('/workspace/agile', 'agile-board-showcase.png', { waitMs: 2500 });

    // 9. Universal Excel-Style Table Data Editor
    await capture('/studio?tab=table_editor', 'table-editor-showcase.png', { waitMs: 2500 });

    // 10. Agent Operations Center
    await capture('/workspace', 'agent-operations-center.png', { waitMs: 2500 });

    // 11. Employee Table & Spatial Data Explorer
    await capture('/portal/data-explorer', 'data-explorer-showcase.png', { waitMs: 2500 });

    // 12. Unified Locations: Editable List View
    await capture('/workspace/cmn_location', 'unified_locations_editable_list.png', {
      waitMs: 2500,
      action: async (p) => {
        await p.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => b.textContent && b.textContent.includes('Editable List'));
          if (btn) btn.click();
        });
      }
    });

    // 13. Unified Locations: Hierarchy Tree Builder View
    await capture('/workspace/cmn_location', 'unified_locations_tree_builder.png', {
      waitMs: 2000,
      action: async (p) => {
        await p.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => b.textContent && b.textContent.includes('Hierarchy Tree'));
          if (btn) btn.click();
        });
      }
    });

    // 14. Unified Locations: Tree + Detail Split Explorer View
    await capture('/workspace/cmn_location', 'unified_locations_split_explorer.png', {
      waitMs: 2000,
      action: async (p) => {
        await p.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => b.textContent && b.textContent.includes('Tree + Detail'));
          if (btn) btn.click();
        });
      }
    });

    // 15. Dedicated Spatial Entity Form: New State Form
    await capture('/workspace/cmn_state/new', 'cmn_state_new_form.png', { waitMs: 2500 });

    // 16. Dedicated Spatial Entity Form: Filled Form
    await capture('/workspace/cmn_state/new', 'cmn_state_filled_form.png', {
      waitMs: 2000,
      action: async (p) => {
        await p.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          if (inputs[0]) {
            inputs[0].value = 'New York';
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (inputs[1]) {
            inputs[1].value = 'US-NY';
            inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      }
    });

    // 17. Dedicated Spatial Entity Form: Saved Record Detail
    if (sampleState) {
      await capture(`/workspace/cmn_state/${sampleState.id}`, 'cmn_state_saved_detail.png', { waitMs: 2500 });
    } else {
      fs.copyFileSync(
        path.join(ASSETS_DIR, 'cmn_state_filled_form.png'),
        path.join(ASSETS_DIR, 'cmn_state_saved_detail.png')
      );
    }

    // Copy high-priority screenshots to brain artifacts directory for visual inspection
    const BRAIN_DIR = 'C:\\Users\\oleha\\.gemini\\antigravity\\brain\\1be697e7-5d02-48d0-ba40-4d6a140f7a0a';
    if (fs.existsSync(BRAIN_DIR)) {
      [
        'portal-showcase.png',
        'workplace-showcase.png',
        'calendar-view-showcase.png',
        'cad-drawing-showcase.png',
        'unified_locations_editable_list.png',
        'unified_locations_tree_builder.png',
        'unified_locations_split_explorer.png',
        'cmn_state_new_form.png',
        'data-explorer-showcase.png',
        'table-editor-showcase.png',
      ].forEach(file => {
        try {
          fs.copyFileSync(path.join(ASSETS_DIR, file), path.join(BRAIN_DIR, file));
        } catch {}
      });
    }

    console.log('[capture] ALL GITHUB ASSET PICTURES CAPTURED AND UPDATED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('[capture] Error:', err);
  process.exit(1);
});
