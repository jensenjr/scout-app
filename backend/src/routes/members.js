const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/members?group=rovare
router.get('/', (req, res) => {
  const group = req.query.group;
  const query = group
    ? `SELECT m.*,
         COUNT(a.id) AS total_meetings,
         SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) AS attended,
         MAX(CASE WHEN a.present = 1 THEN a.meeting_date END) AS last_seen
       FROM members m
       LEFT JOIN attendance a ON a.member_id = m.id
       WHERE LOWER(m.group_name) = LOWER(?)
       GROUP BY m.id
       ORDER BY m.last_name, m.first_name`
    : `SELECT m.*,
         COUNT(a.id) AS total_meetings,
         SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) AS attended,
         MAX(CASE WHEN a.present = 1 THEN a.meeting_date END) AS last_seen
       FROM members m
       LEFT JOIN attendance a ON a.member_id = m.id
       GROUP BY m.id
       ORDER BY m.last_name, m.first_name`;

  const rows = group ? db.prepare(query).all(group) : db.prepare(query).all();
  res.json(rows);
});

// GET /api/members/flagged?group=rovare
// Members who have missed 2 or more consecutive meetings
router.get('/flagged', (req, res) => {
  const group = req.query.group;

  const meetingDates = group
    ? db.prepare(`SELECT DISTINCT meeting_date FROM attendance a
                  JOIN members m ON m.id = a.member_id
                  WHERE LOWER(m.group_name) = LOWER(?)
                  ORDER BY meeting_date DESC LIMIT 10`).all(group).map(r => r.meeting_date)
    : db.prepare(`SELECT DISTINCT meeting_date FROM attendance
                  ORDER BY meeting_date DESC LIMIT 10`).all().map(r => r.meeting_date);

  if (meetingDates.length < 2) return res.json([]);

  const members = group
    ? db.prepare(`SELECT * FROM members WHERE LOWER(group_name) = LOWER(?)`).all(group)
    : db.prepare(`SELECT * FROM members`).all();

  const flagged = [];

  for (const member of members) {
    const records = db.prepare(`
      SELECT meeting_date, present FROM attendance
      WHERE member_id = ? ORDER BY meeting_date DESC
    `).all(member.id);

    const recordMap = Object.fromEntries(records.map(r => [r.meeting_date, r.present]));

    let consecutiveMissed = 0;
    for (const date of meetingDates) {
      const present = recordMap[date];
      if (present === 0 || present === undefined) {
        consecutiveMissed++;
      } else {
        break;
      }
    }

    if (consecutiveMissed >= 2) {
      flagged.push({ ...member, consecutive_missed: consecutiveMissed });
    }
  }

  res.json(flagged);
});

// PUT /api/members/:id
router.put('/:id', (req, res) => {
  const { parent_phone } = req.body;
  const { id } = req.params;
  db.prepare(`UPDATE members SET parent_phone = ? WHERE id = ?`).run(parent_phone, id);
  res.json({ success: true });
});

module.exports = router;
