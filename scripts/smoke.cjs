/* Real-browser smoke test: load every route, capture console errors,
   verify key content renders, exercise the demo state machine. */
const { chromium } = require('playwright-core');

const BASE = 'http://localhost:5173';

const CHECKS = [
  { path: '/',                                 expect: /RoadDrive AI|road-driveability/i },
  { path: '/app',                              expect: /Alex|Driveability/i },
  { path: '/app/map',                          expect: /Live Map/i },
  { path: '/app/drive',                        expect: /Start Drive|LIVE DRIVE/i },
  { path: '/app/routes',                       expect: /Fastest|Recommended/i },
  { path: '/app/reports',                      expect: /Report Hazard/i },
  { path: '/app/history',                      expect: /Today|History/i },
  { path: '/app/vehicle',                      expect: /Honda City|Vehicle/i },
  { path: '/app/profile',                      expect: /Alex|Profile/i },
  { path: '/app/hazard/PH-1024',               expect: /PH-1024|Pothole/i },
  { path: '/admin',                            expect: /Road Intelligence|Dashboard/i },
  { path: '/admin/map',                        expect: /Live 3D Map/i },
  { path: '/admin/hazards',                    expect: /Hazard Management/i },
  { path: '/admin/hazards/detail',             expect: /PH-1024/i },
  { path: '/admin/verification',               expect: /Verification/i },
  { path: '/admin/repairs',                    expect: /Repairs/i },
  { path: '/admin/analytics',                  expect: /Analytics/i },
  { path: '/admin/users',                      expect: /Contributing Fleet/i },
  { path: '/admin/settings',                   expect: /Settings/i },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/data/home/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux-arm64/chrome-headless-shell',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  let failures = 0;
  const errorsByRoute = {};

  for (const check of CHECKS) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 220)); });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 220)));
    try {
      await page.goto(BASE + check.path, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(400);
      const body = await page.textContent('body');
      const ok = check.expect.test(body || '');
      const errRelevant = errors.filter((e) => !/favicon|net::ERR|Failed to load resource.*(tile\.openstreetmap|cesium)/i.test(e));
      if (!ok || errRelevant.length) {
        failures++;
        errorsByRoute[check.path] = { matched: ok, errors: errRelevant.slice(0, 3) };
        console.log(`FAIL ${check.path}  matched=${ok}`);
        errRelevant.slice(0, 3).forEach((e) => console.log('   ERR:', e));
      } else {
        console.log(`PASS ${check.path}`);
      }
    } catch (e) {
      failures++;
      errorsByRoute[check.path] = { matched: false, errors: [String(e).slice(0, 200)] };
      console.log(`FAIL ${check.path}  exception: ${String(e).slice(0, 160)}`);
    }
    await ctx.close();
  }

  // ── functional flow: SIH demo steps on the real app ──
  console.log('\n--- FUNCTIONAL: drive simulation + confirm + route ---');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  try {
    // Step 1: home shows driveability
    await page.goto(BASE + '/app', { waitUntil: 'networkidle' });
    const home = await page.textContent('body');
    console.log('Home driveability 82 shown:', /82/.test(home || ''), '| Start Drive CTA:', /Start Drive/.test(home || ''));

    // Step 2: start drive, run the machine to 'confirmed'
    await page.goto(BASE + '/app/drive', { waitUntil: 'networkidle' });
    await page.click('button:has-text("Start Drive")');
    await page.waitForTimeout(2600 * 6 + 1500); // let all 7 phases run
    const drive = await page.textContent('body');
    console.log('Detection reached CONFIRMED:', /Confirmation added|confirmed/i.test(drive || ''),
                '| alert visible:', /120 m ahead|High risk hazard/i.test(drive || ''),
                '| pipeline count updated:', /(7|8) detections|independent/i.test(drive || ''));
    // End drive
    const endBtn = page.locator('button:has-text("End Drive")');
    if (await endBtn.count()) await endBtn.click();

    // Step: routes page shows both options with driveability
    await page.goto(BASE + '/app/routes', { waitUntil: 'networkidle' });
    const routes = await page.textContent('body');
    console.log('Routes: fastest 18 min:', /18 min/.test(routes || ''),
                '| recommended 21 min:', /21 min/.test(routes || ''),
                '| explains why:', /Recommended because/i.test(routes || ''));

    // Admin: verification → simulate → fly-to
    await page.goto(BASE + '/admin/verification', { waitUntil: 'networkidle' });
    const verif = await page.textContent('body');
    console.log('Verification queue renders:', /Hazard verification/i.test(verif || ''));
  } catch (e) {
    failures++;
    console.log('FUNCTIONAL FAIL:', String(e).slice(0, 300));
  }
  console.log('Page errors during functional test:', errs.length ? errs.slice(0,3) : 'none');
  await ctx.close();

  await browser.close();
  console.log(failures === 0 ? '\n✅ ALL ROUTES PASS, NO CONSOLE ERRORS' : `\n❌ ${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
})();
