const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { scrapeAttendanceCsv } = require('../scraper');
const { parseAndImport } = require('../csvParser');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../../tmp/uploads') });

// POST /api/import/trigger — Playwright scraper
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

// POST /api/import/upload — Manual CSV upload
router.post('/upload', upload.single('csv'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Ingen fil bifogad' });
  try {
    const content = fs.readFileSync(req.file.path, 'utf-8');
    const result = parseAndImport(content);
    fs.unlinkSync(req.file.path);
    res.json({ success: true, ...result });
  } catch (err) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
