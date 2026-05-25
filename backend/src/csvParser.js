const db = require('./db');

function cleanPhone(num) {
  if (!num) return null;
  let s = num.toString().replace(/[\s\-]/g, '');
  if (s.startsWith('0')) {
    s = '+46' + s.substring(1);
  }
  if (!s.startsWith('+')) {
    s = '+' + s;
  }
  return s;
}

function parseAndImport(csvContent) {
  const lines = csvContent.split(/\r?\n/);
  if (lines.length < 2) return { count: 0 };

  // Analysera headers för att hitta rätt index
  const headers = lines[0].split(',');
  const idx = {
    id: headers.indexOf('Medlemsnr.'),
    firstName: headers.indexOf('Förnamn'),
    lastName: headers.indexOf('Efternamn'),
    group: headers.indexOf('Avdelning'),
    scoutPhone: headers.indexOf('Mobiltelefon'), // Scoutens egna mobil
    p1Name: headers.indexOf('Anhörig 1 namn'),
    p1Phone: headers.indexOf('Anhörig 1 mobiltelefon'),
    p2Name: headers.indexOf('Anhörig 2 namn'),
    p2Phone: headers.indexOf('Anhörig 2 mobiltelefon'),
  };

  let count = 0;

  db.transaction(() => {
    // Förbered SQL-frågan med de utökade mobilfälten
    const stmt = db.prepare(`
      INSERT INTO members (
        scoutnet_member_id, first_name, last_name, group_name, 
        scout_phone, parent_name_1, parent_phone, parent_name_2, parent_phone_2
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(first_name, last_name, group_name) DO UPDATE SET
        scoutnet_member_id = excluded.scoutnet_member_id,
        scout_phone = excluded.scout_phone,
        parent_name_1 = excluded.parent_name_1,
        parent_phone = excluded.parent_phone,
        parent_name_2 = excluded.parent_name_2,
        parent_phone_2 = excluded.parent_phone_2
    `);

    // Gå igenom alla rader (skippa headern)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cells = line.split(',');
      const fName = cells[idx.firstName]?.trim();
      const group = cells[idx.group]?.trim();

      if (!fName || !group) continue;

      const scoutnetId = Number(cells[idx.id]) || null;
      const lName = cells[idx.lastName]?.trim() || '';
      
      const scoutPhone = cleanPhone(cells[idx.scoutPhone]);
      const p1Name = cells[idx.p1Name]?.trim() || null;
      const p1Phone = cleanPhone(cells[idx.p1Phone]);
      const p2Name = cells[idx.p2Name]?.trim() || null;
      const p2Phone = cleanPhone(cells[idx.p2Phone]);

      stmt.run(
        scoutnetId,
        fName,
        lName,
        group,
        scoutPhone,
        p1Name,
        p1Phone,
        p2Name,
        p2Phone
      );
      count++;
    }
  });

  return { count };
}

module.exports = { parseAndImport };
