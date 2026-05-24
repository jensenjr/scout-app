const express = require('express');
const fetch = require('node-fetch');
const db = require('../db');

const router = express.Router();

// POST /api/sms/send
router.post('/send', async (req, res) => {
  const { memberId, phone, message } = req.body;

  if (!memberId || !phone || !message) {
    return res.status(400).json({ error: 'memberId, phone och message krävs' });
  }

  // Duplicate check: no SMS to same member within 7 days
  const recent = db.prepare(`
    SELECT id FROM sms_log
    WHERE member_id = ? AND sent_at > datetime('now', '-7 days')
    ORDER BY sent_at DESC LIMIT 1
  `).get(memberId);

  if (recent) {
    return res.status(409).json({ error: 'Ett SMS skickades redan till denna förälder inom 7 dagar.' });
  }

  const elksUser = process.env.ELKS_API_USERNAME;
  const elksPass = process.env.ELKS_API_PASSWORD;
  const from = process.env.ELKS_FROM || 'Scouter';

  if (!elksUser || elksUser === 'placeholder') {
    return res.status(503).json({ error: '46elks är inte konfigurerat. Kontakta administratören.' });
  }

  try {
    const params = new URLSearchParams({ from, to: phone, message });
    const response = await fetch('https://api.46elks.com/a1/sms', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${elksUser}:${elksPass}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    const status = response.ok ? 'sent' : 'failed';

    db.prepare(`
      INSERT INTO sms_log (member_id, phone, message, status)
      VALUES (?, ?, ?, ?)
    `).run(memberId, phone, message, status);

    if (!response.ok) {
      return res.status(502).json({ error: 'SMS-sändning misslyckades', details: data });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
