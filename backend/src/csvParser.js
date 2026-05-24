const db = require('./db');

/**
 * Parse CSV content and upsert members + attendance records.
 * Expected columns: Förnamn, Efternamn, Grupp, Datum, Närvarande
 */
function parseAndImport(csvContent) {
  const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV är tomt eller saknar data');

  const header = lines[0].split(',').map(h => h.trim().replace(/^﻿/, ''));
  const idxFirst = findCol(header, ['Förnamn', 'fornamn', 'first_name', 'Firstname']);
  const idxLast = findCol(header, ['Efternamn', 'efternamn', 'last_name', 'Lastname']);
  const idxGroup = findCol(header, ['Grupp', 'grupp', 'group', 'Group']);
  const idxDate = findCol(header, ['Datum', 'datum', 'date', 'Date']);
  const idxPresent = findCol(header, ['Närvarande', 'narvarande', 'present', 'Present', 'Närvaro']);

  if (idxFirst === -1 || idxLast === -1 || idxGroup === -1 || idxDate === -1) {
    throw new Error(`CSV saknar obligatoriska kolumner. Hittade: ${header.join(', ')}`);
  }

  let imported = 0;
  let skipped = 0;

  db.transaction(() => {
    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i]);
      const firstName = cols[idxFirst]?.trim();
      const lastName = cols[idxLast]?.trim();
      const group = cols[idxGroup]?.trim();
      const date = cols[idxDate]?.trim();

      if (!firstName || !lastName || !date) { skipped++; continue; }

      const groupName = group || 'Okänd';

      db.prepare(`
        INSERT OR IGNORE INTO members (first_name, last_name, group_name)
        VALUES (@first_name, @last_name, @group_name)
      `).run({ first_name: firstName, last_name: lastName, group_name: groupName });

      const member = db.prepare(
        'SELECT id FROM members WHERE first_name = ? AND last_name = ? AND group_name = ?'
      ).get(firstName, lastName, groupName);

      if (!member) { skipped++; continue; }

      const presentRaw = idxPresent !== -1 ? cols[idxPresent]?.trim() : '1';
      const present = parsePresent(presentRaw);

      db.prepare(`
        INSERT INTO attendance (member_id, meeting_date, present)
        VALUES (@member_id, @meeting_date, @present)
        ON CONFLICT(member_id, meeting_date) DO UPDATE SET present = excluded.present
      `).run({ member_id: member.id, meeting_date: date, present });

      imported++;
    }
  });

  return { imported, skipped };
}

function findCol(header, candidates) {
  for (const c of candidates) {
    const idx = header.findIndex(h => h.toLowerCase() === c.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

function parsePresent(val) {
  if (!val) return 0;
  const v = val.toLowerCase();
  return (v === '1' || v === 'ja' || v === 'yes' || v === 'true' || v === 'x') ? 1 : 0;
}

function splitCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

module.exports = { parseAndImport };
