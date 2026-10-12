// Development-only browser verification. Not included in the public artifact.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(process.argv[2]);
const evidence = path.resolve(process.argv[3]);
await mkdir(evidence, { recursive: true });
const server = createServer(async (req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname.startsWith('/erp-cloud-landing/')) pathname = pathname.slice('/erp-cloud-landing'.length);
  let file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
  let status = 200;
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    await stat(file);
  } catch { file = path.join(root, '404.html'); status = 404; }
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
  res.writeHead(status, { 'Content-Type': types[path.extname(file)] || 'text/plain' });
  res.end(await readFile(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
const report = { staticOnly: true, scenarios: [], requestCount: 0, externalRequests: [], pageErrors: [], failedAssets: [], cspViolations: [] };
try {
  for (const prefix of ['/', '/erp-cloud-landing/']) {
    for (const viewport of [{ width: 1440, height: 1050 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      await context.addInitScript(() => {
        window.__testCspViolations = [];
        document.addEventListener('securitypolicyviolation', event => window.__testCspViolations.push(event.effectiveDirective));
      });
      const page = await context.newPage();
      page.on('pageerror', error => report.pageErrors.push(error.message));
      page.on('request', request => {
        report.requestCount += 1;
        if (!request.url().startsWith(origin + '/')) report.externalRequests.push(request.url());
      });
      page.on('response', response => {
        if (response.status() >= 400 && response.request().resourceType() !== 'document') report.failedAssets.push(response.url());
      });
      await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
      await page.goto(origin + prefix);
      assert.equal(await page.title(), 'metabrain — Cloud ERP untuk Bisnis');
      assert.equal(await page.locator('form').getAttribute('data-state'), 'inactive');
      assert.equal(await page.locator('form :is(input,select,textarea,button):not(:disabled)').count(), 0);
      // A synthetic submit event must neither navigate nor issue a request.
      const submitted = await page.locator('form').evaluate(form => !form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })));
      assert.equal(submitted, true);
      assert.equal(await page.locator('nav[aria-label="Navigasi utama"]').isVisible(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').count(), 1);
      for (const fragment of ['mengapa', 'industri', 'demo', 'batas']) {
        await page.locator(`nav a[href="#${fragment}"]`).click();
        assert.equal(new URL(page.url()).hash, '#' + fragment);
      }
      await page.goto(origin + prefix);
      const size = viewport.width > 1000 ? 'desktop' : 'mobile';
      const topology = prefix === '/' ? 'root' : 'project';
      if (topology === 'root') await page.screenshot({ path: path.join(evidence, `landing-${size}.png`), fullPage: true });
      await page.locator('.hero a[href="demo/cafe/"]').click();
      assert.equal(new URL(page.url()).pathname, prefix + 'demo/cafe/');
      assert.equal(await page.locator('.demo-disclosure').isVisible(), true);
      // Keyboard-only activation of a business action.
      await page.locator('#order-items .order-item').first().waitFor({ state: 'visible' });
      await page.locator('#confirm-order').focus();
      await page.keyboard.press('Enter');
      await page.locator('[data-panel="2"]').waitFor({ state: 'visible' });
      assert.equal(await page.locator('[data-panel="2"]').isVisible(), true);
      await page.locator('#reset-demo').click();
      for (const scenario of ['direct-payment', 'early-shift', 'paid-open', 'reset-replay', 'journey']) {
        await page.goto(origin + prefix + 'demo/cafe/?review=' + scenario);
        assert.equal(await page.locator('html').getAttribute('data-browser-qa'), 'pass', scenario);
        report.scenarios.push(`${topology}/${size}/${scenario}`);
        if (scenario === 'paid-open') {
          assert.equal(await page.locator('#context-status').innerText(), 'OPEN · PAID');
          assert.equal(await page.locator('#receipt').isVisible(), false);
        }
      }
      await page.goto(origin + prefix + 'demo/cafe/?review=owner');
      assert.equal(await page.locator('#context-status').innerText(), 'CLOSED');
      assert.equal(await page.locator('#receipt').getAttribute('hidden'), null);
      const heights = await page.locator('#sales-chart .bar').evaluateAll(bars => bars.map(bar => bar.getBoundingClientRect().height));
      assert.ok(Math.max(...heights) > 100, 'trend chart must have meaningful bar height');
      assert.ok(new Set(heights.map(Math.round)).size > 1, 'trend bar heights must vary with fixture values');
      const widths = await page.locator('#top-items .item-track span').evaluateAll(bars => bars.map(bar => bar.style.width));
      assert.ok(new Set(widths).size > 1, 'top-item bar widths must vary');
      report.cspViolations.push(...await page.evaluate(() => window.__testCspViolations));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.equal(await context.cookies().then(x => x.length), 0);
      assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length]), [0, 0]);
      if (topology === 'root') await page.screenshot({ path: path.join(evidence, `cafe-${size}.png`), fullPage: true });
      await page.locator('.brand').click();
      assert.equal(new URL(page.url()).pathname, prefix + 'index.html');
      await page.locator('footer a[href="privacy.html"]').click();
      assert.match(await page.title(), /metabrain/);
      await page.locator('header .brand').click();
      await page.goto(origin + prefix + 'missing/nested/page');
      assert.equal(await page.locator('#home-link').getAttribute('href'), prefix + 'index.html');
      assert.equal(await page.locator('link[rel="stylesheet"]').getAttribute('href'), prefix + 'styles.css');
      await page.locator('#home-link').click();
      assert.equal(new URL(page.url()).pathname, prefix + 'index.html');
      await context.close();
    }
  }
  assert.deepEqual(report.externalRequests, []);
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.failedAssets, []);
  assert.deepEqual(report.cspViolations, []);
  report.result = 'PASS';
  await writeFile(path.join(evidence, 'browser-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
