const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/announcements?group=rovare
router.get('/', (req, res) => {
  const { group } = req.query;
  const rows = group
    ? db.prepare(`SELECT * FROM announcements WHERE LOWER(group_name) = LOWER(?) ORDER BY created_at DESC`).all(group)
    : db.prepare(`SELECT * FROM announcements ORDER BY created_at DESC`).all();
  res.json(rows);
});

// POST /api/announcements
router.post('/', (req, res) => {
  const { group_name, title, body } = req.body;
  if (!group_name || !title || !body) {
    return res.status(400).json({ error: 'group_name, title och body krävs' });
  }
  const result = db.prepare(`
    INSERT INTO announcements (group_name, title, body) VALUES (?, ?, ?)
  `).run(group_name, title, body);
  res.json({ success: true, id: result.lastInsertRowid });
});

module.exports = router;
