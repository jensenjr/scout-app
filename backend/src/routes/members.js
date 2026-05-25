const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/members/age-configs — Get visible group filter metrics
router.get('/age-configs', (req, res) => {
  try {
    const rows = db.prepare(`SELECT group_name, is_active FROM age_group_configs ORDER BY group_name`).all();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/members/age-configs — Alter structural visibility states
router.post('/age-configs', (req, res) => {
  const { group_name, is_active } = req.body;
  try {
    db.prepare(`
      INSERT INTO age_group_configs (group_name, is_active)
      VALUES (?, ?)
      ON CONFLICT(group_name) DO UPDATE SET is_active = excluded.is_active
    `).run(group_name, is_active);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/members/groups — Reads distinct groups filtered by active rules configuration
router.get('/groups', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT DISTINCT group_name FROM members 
      WHERE group_name NOT IN (
        SELECT group_name FROM age_group_configs WHERE is_active = 0
      )
      ORDER BY group_name
    `).all();
    res.json(rows.map(r => r.group_name));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/members/attendance-date — Attendance list for a specific date
router.get('/attendance-date', (req, res) => {
  const { group, date } = req.query;
  if (!group || !date) return res.status(400).json({ error: 'Saknar grupp eller datum' });

  try {
    const rows = db.prepare(`
      SELECT a.member_id, a.present 
      FROM attendance a
      JOIN members m ON a.member_id = m.id
      WHERE LOWER(m.group_name) = LOWER(?) AND a.meeting_date = ?
    `).all(group, date);

    const sheet = {};
    rows.forEach(r => {
      sheet[r.member_id] = r.present === 1;
    });
    res.json(sheet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/members/attendance-date — Save attendance list
router.post('/attendance-date', (req, res) => {
  const { group_name, date, attendance } = req.body;
  if (!group_name || !date || !attendance) {
    return res.status(400).json({ error: 'Saknar obligatorisk data' });
  }

  try {
    db.transaction(() => {
      db.prepare(`
        DELETE FROM attendance 
        WHERE meeting_date = ? AND member_id IN (
          SELECT id FROM members WHERE LOWER(group_name) = LOWER(?)
        )
      `).run(date, group_name);

      const insertStmt = db.prepare(`
        INSERT INTO attendance (member_id, meeting_date, present)
        VALUES (?, ?, ?)
      `);

      for (const [memberId, isPresent] of Object.entries(attendance)) {
        insertStmt.run(Number(memberId), date, isPresent ? 1 : 0);
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/members — List members in a group
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
       ORDER BY m.first_name`
    : `SELECT m.*,
         COUNT(a.id) AS total_meetings,
         SUM(CASE WHEN a.present = 1 THEN 1 ELSE 0 END) AS attended,
         MAX(CASE WHEN a.present = 1 THEN a.meeting_date END) AS last_seen
       FROM members m
       LEFT JOIN attendance a ON a.member_id = m.id
       GROUP BY m.id
       ORDER BY m.first_name`;

  const rows = group ? db.prepare(query).all(group) : db.prepare(query).all();
  res.json(rows);
});

// GET /api/members/flagged — List flagged absent members
router.get('/flagged', (req, res) => {
  const group = req.query.group;

  const meetingDates = group
    ? db.prepare(
        `SELECT DISTINCT meeting_date FROM attendance a
         JOIN members m ON m.id = a.member_id
         WHERE LOWER(m.group_name) = LOWER(?)
         ORDER BY meeting_date DESC LIMIT 10`
      ).all(group).map(r => r.meeting_date)
    : db.prepare(
        `SELECT DISTINCT meeting_date FROM attendance ORDER BY meeting_date DESC LIMIT 10`
      ).all().map(r => r.meeting_date);

  if (meetingDates.length < 2) return res.json([]);

  const members = group
    ? db.prepare(`SELECT * FROM members WHERE LOWER(group_name) = LOWER(?)`).all(group)
    : db.prepare(`SELECT * FROM members`).all();

  const flagged = [];

  for (const member of members) {
    const records = db.prepare(
      `SELECT meeting_date, present FROM attendance WHERE member_id = ? ORDER BY meeting_date DESC`
    ).all(member.id);

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

// PUT /api/members/:id — Update tracking metadata info
router.put('/:id', (req, res) => {
  const { parent_phone, parent_name_1, parent_phone_2, parent_name_2 } = req.body;
  const { id } = req.params;
  db.prepare(`
    UPDATE members SET
      parent_phone  = COALESCE(@parent_phone,  parent_phone),
      parent_name_1 = COALESCE(@parent_name_1, parent_name_1),
      parent_phone_2 = COALESCE(@parent_phone_2, parent_phone_2),
      parent_name_2 = COALESCE(@parent_name_2, parent_name_2)
    WHERE id = @id
  `).run({ parent_phone, parent_name_1, parent_phone_2, parent_name_2, id });
  res.json({ success: true });
});

module.exports = router;
