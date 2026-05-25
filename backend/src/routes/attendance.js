// GET existing attendance for a group on a specific date
router.get('/api/attendance', (req, res) => {
  const { group, date } = req.query;
  try {
    const db = require('../db'); // Adjust based on your db connection export path
    const stmt = db.prepare(`
      SELECT attendance.member_id, attendance.present 
      FROM attendance
      JOIN members ON attendance.member_id = members.id
      WHERE members.group_name = ? AND attendance.meeting_date = ?
    `);
    const records = stmt.all(group, date);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST to save or overwrite attendance for a date session
router.post('/api/attendance/save', (req, res) => {
  const { group_name, date, records } = req.body; // records format: { "memberId": true/false }
  const db = require('../db');

  try {
    // Run everything safely in a transaction
    const deleteExisting = db.prepare(`
      DELETE FROM attendance 
      WHERE meeting_date = ? AND member_id IN (
        SELECT id FROM members WHERE group_name = ?
      )
    `);
    
    const insertAttendance = db.prepare(`
      INSERT INTO attendance (member_id, meeting_date, present) 
      VALUES (?, ?, ?)
    `);

    const saveTransaction = db.transaction(() => {
      deleteExisting.run(date, group_name);
      
      for (const [memberId, isPresent] of Object.entries(records)) {
        insertAttendance.run(Number(memberId), date, isPresent ? 1 : 0);
      }
    });

    saveTransaction();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
