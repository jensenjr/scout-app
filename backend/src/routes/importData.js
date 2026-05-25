const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { scrapeAttendanceCsv } = require('../scraper');
const { parseAndImportExcel } = require('../excelParser');
const { parseAndImport } = require('../csvParser');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../../tmp/uploads') });

// POST /api/import/trigger — Playwright scraper (hämtar från ScoutNet automatiskt)
router.post('/trigger', async (req, res) => {
  try {
    const csvPath = await scrapeAttendanceCsv();
    const content = fs.readFileSync(csvPath, 'utf-8');
    const result = parseAndImport(content);
    fs.unlinkSync(csvPath);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/import/excel — Ladda upp Excel-fil från ScoutNet (.xlsx)
router.post('/excel', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Ingen fil bifogad' });
  try {
    const result = await parseAndImportExcel(req.file.path);
    fs.unlinkSync(req.file.path); // GDPR rensning
    res.json({ success: true, ...result });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(400).json({ error: err.message });
  }
});

/* NYTT: Hantera manuell uppladdning av den CSV-medlemslista du har */
// POST /api/import/csv — Ladda upp en vanlig ScoutNet CSV-export direkt
router.post('/csv', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Ingen fil bifogad' });
  try {
    const content = fs.readFileSync(req.file.path, 'utf-8');
    const result = parseAndImport(content);
    fs.unlinkSync(req.file.path); // GDPR rensning
    res.json({ success: true, ...result });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
