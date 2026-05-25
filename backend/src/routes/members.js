const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/import-status', (req, res) => {
  try {
    const row = db.prepare(`SELECT MAX(created_at) as last_import FROM members`).get();
    res.json({ last_import: row?.last_import || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hämtar alla unika avdelningar från databasen och markerar om de är synliga eller dolda
router.get('/age-configs', (req, res) => {
  try {
    const allGroups = db.prepare(`SELECT DISTINCT group_name FROM members WHERE group_name IS NOT NULL AND group_name != '' ORDER BY group_name`).all();
    const hiddenRows = db.prepare(`SELECT group_name FROM hidden_groups`).all().map(h => h.group_name.toLowerCase());

    const configs = allGroups.map(g => ({
      group_name: g.group_name,
      is_active: hiddenRows.includes(g.group_name.toLowerCase()) ? 0 : 1
    }));

    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sparar om en specifik avdelning ska gömmas eller visas
router.post('/age-configs', (req, res) => {
  const { group_name, is_active } = req.body;
  try {
    if (is_active === 0) {
      db.prepare(`INSERT OR IGNORE INTO hidden_groups (group_name) VALUES (?)`).run(group_name);
    } else {
      db.prepare(`DELETE FROM hidden_groups WHERE LOWER(group_name) = LOWER(?)`).run(group_name);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Returnerar endast de unika avdelningar som INTE är dolda av användaren
router.get('/groups', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT DISTINCT group_name FROM members 
      WHERE group_name IS NOT NULL AND group_name != ''
      AND LOWER(group_name) NOT IN (SELECT LOWER(group_name) FROM hidden_groups)
      ORDER BY group_name
    `).all();
    
    res.json(rows.map(r => r.group_name));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
