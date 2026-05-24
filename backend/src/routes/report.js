const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const db = require('../db');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../../tmp/uploads') });

// POST /api/report/generate
// Upload enriched CSV, merge with attendance, return Excel
router.post('/generate', upload.single('csv'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Ingen fil bifogad' });

  try {
    const content = fs.readFileSync(req.file.path, 'utf-8');
    fs.unlinkSync(req.file.path);

    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const header = lines[0].split(',').map(h => h.trim());

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Närvaro');

    // Build header: enrich CSV columns + attendance columns
    const meetingDates = db.prepare(`
      SELECT DISTINCT meeting_date FROM attendance ORDER BY meeting_date
    `).all().map(r => r.meeting_date);

    sheet.addRow([...header, ...meetingDates, 'Antal närvaro', 'Procent']);
    sheet.getRow(1).font = { bold: true };

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      // Try to match member by name (cols 0 and 1 assumed to be first/last name)
      const firstName = cols[0];
      const lastName = cols[1];

      const member = db.prepare(`
        SELECT m.id FROM members m
        WHERE LOWER(m.first_name) = LOWER(?) AND LOWER(m.last_name) = LOWER(?)
        LIMIT 1
      `).get(firstName, lastName);

      const attendanceValues = [];
      let attended = 0;

      for (const date of meetingDates) {
        if (member) {
          const rec = db.prepare(`
            SELECT present FROM attendance WHERE member_id = ? AND meeting_date = ?
          `).get(member.id, date);
          const val = rec ? (rec.present ? 1 : 0) : '';
          attendanceValues.push(val);
          if (val === 1) attended++;
        } else {
          attendanceValues.push('');
        }
      }

      const pct = meetingDates.length > 0
        ? Math.round((attended / meetingDates.length) * 100) + '%'
        : '-';

      sheet.addRow([...cols, ...attendanceValues, attended, pct]);
    }

    sheet.columns.forEach(col => { col.width = 15; });

    res.setHeader('Content-Disposition', 'attachment; filename="narvaro-rapport.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
