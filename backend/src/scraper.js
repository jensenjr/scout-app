const { chromium } = require('playwright');
const path = require('path');
const os = require('os');

async function scrapeAttendanceCsv() {
  const baseUrl = process.env.SCALPNET_BASE_URL;
  const username = process.env.SCALPNET_USERNAME;
  const password = process.env.SCALPNET_PASSWORD;

  if (!baseUrl || baseUrl === 'placeholder') {
    throw new Error('SCALPNET_BASE_URL är inte konfigurerad. Använd manuell CSV-uppladdning.');
  }

  const downloadDir = path.join(os.tmpdir(), 'scout-downloads');
  const fs = require('fs');
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[name="username"], input[type="email"], #username', username);
    await page.fill('input[name="password"], input[type="password"], #password', password);
    await page.click('button[type="submit"], input[type="submit"], .login-btn');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('a[href*="export"], a[href*="csv"], button[data-export], .export-csv'),
    ]);

    const filePath = path.join(downloadDir, download.suggestedFilename() || 'attendance.csv');
    await download.saveAs(filePath);
    return filePath;
  } catch (err) {
    throw new Error(`Skrapningen misslyckades: ${err.message}. Prova manuell CSV-uppladdning.`);
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeAttendanceCsv };
