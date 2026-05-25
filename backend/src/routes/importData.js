const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { scrapeAttendanceCsv } = require('../scraper');
const { parseAndImportExcel } = require('../excelParser');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../../tmp/uploads') });

// POST /api/import/trigger — Playwright scraper (hämtar från ScoutNet automatiskt)
router.post('/trigger', async (req, res) => {
  try {
    const csvPath = await scrapeAttendanceCsv();
    const content = fs.readFileSync(csvPath, 'utf-8');
    // scraper returns CSV — use legacy parser if needed
    const { parseAndImport } = require('../csvParser');
    const result = parseAndImport(content);
    fs.unlinkSync(csvPath);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/import/excel — Ladda upp Excel-fil från ScoutNet (Kår Medlemslista)
router.post('/excel', upload.single('excel'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Ingen fil bifogad' });
  try {
    const result = await parseAndImportExcel(req.file.path);
    fs.unlinkSync(req.file.path); // radera omedelbart efter import — GDPR
    res.json({ success: true, ...result });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
