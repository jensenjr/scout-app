const ExcelJS = require('exceljs');
const db = require('./db');

/**
 * Parse a ScoutNet member list Excel (.xlsx) and upsert members.
 * Extracts: Förnamn, Efternamn, Avdelning, Mobiltelefon (member),
 *           Anhörig 1 namn, Anhörig 1 mobiltelefon,
 *           Anhörig 2 namn, Anhörig 2 mobiltelefon.
 *
 * Deliberately IGNORES: Personnummer, Kön, Födelsedatum, Adress, e-post — GDPR.
 * All data is stored only in the local SQLite database and never forwarded.
 */
async function parseAndImportExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  // Use first sheet
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('Excel-filen har inga kalkylblad');

  // Read header row
  const headerRow = sheet.getRow(1);
  const headers = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
    headers[colNum - 1] = (cell.value || '').toString().trim();
  });

  function findCol(candidates) {
    for (const c of candidates) {
      const idx = headers.findIndex(h => h.toLowerCase() === c.toLowerCase());
      if (idx !== -1) return idx + 1; // ExcelJS is 1-based
    }
    return -1;
  }

  const colMedlemsnr = findCol(['Medlemsnr.', 'Medlemsnr', 'Medlems nr']);
  const colFornamn = findCol(['Förnamn', 'fornamn']);
  const colEfternamn = findCol(['Efternamn', 'efternamn']);
  const colAvdelning = findCol(['Avdelning', 'Grupp', 'Sektion']);
  // We intentionally do NOT use: Personnummer, Kön, Födelsedatum, Adress, e-post

  const colAnhorig1Namn = findCol(['Anhörig 1 namn']);
  const colAnhorig1Mobil = findCol(['Anhörig 1 mobiltelefon']);
  const colAnhorig2Namn = findCol(['Anhörig 2 namn']);
  const colAnhorig2Mobil = findCol(['Anhörig 2 mobiltelefon']);

  if (colFornamn === -1) {
    throw new Error(`Kunde inte hitta kolumnen "Förnamn" i Excel-filen. Hittade: ${headers.filter(Boolean).join(', ')}`);
  }
  if (colAvdelning === -1) {
    throw new Error(`Kunde inte hitta kolumnen "Avdelning" i Excel-filen.`);
  }

  let imported = 0;
  let skipped = 0;

  db.transaction(() => {
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      function cellVal(colIdx) {
        if (colIdx === -1) return null;
        const cell = row.getCell(colIdx);
        if (cell.value === null || cell.value === undefined) return null;
        // Phone numbers may come as numbers — convert to string
        const raw = cell.value.toString().trim();
        return raw || null;
      }

      const firstName = cellVal(colFornamn);
      const lastName = cellVal(colEfternamn);
      const groupName = cellVal(colAvdelning);

      if (!firstName || !groupName) { skipped++; return; }

      const scoutnetMemberId = colMedlemsnr !== -1 ? (parseInt(cellVal(colMedlemsnr)) || null) : null;

      // Format phone: ensure +46 prefix, remove spaces/dashes
      function formatPhone(raw) {
        if (!raw) return null;
        let p = raw.replace(/[\s\-]/g, '');
        // Numeric-only from Excel (e.g. 46701234567) → add +
        if (/^\d{10,}$/.test(p)) p = '+' + p;
        // 07x → +467x
        if (p.startsWith('07')) p = '+46' + p.slice(1);
        // 46... without + → +46...
        if (/^46\d{9}$/.test(p)) p = '+' + p;
        return p;
      }

      const parentName1 = cellVal(colAnhorig1Namn);
      const parentPhone1 = formatPhone(cellVal(colAnhorig1Mobil));
      const parentName2 = cellVal(colAnhorig2Namn);
      const parentPhone2 = formatPhone(cellVal(colAnhorig2Mobil));

      // Upsert by scoutnet_member_id if available, otherwise by name+group
      if (scoutnetMemberId) {
        const existing = db.prepare('SELECT id FROM members WHERE scoutnet_member_id = ?').get(scoutnetMemberId);
        if (existing) {
          db.prepare(`
            UPDATE members SET
              first_name = @first_name,
              last_name = @last_name,
              group_name = @group_name,
              parent_name_1 = @parent_name_1,
              parent_phone = @parent_phone,
              parent_name_2 = @parent_name_2,
              parent_phone_2 = @parent_phone_2
            WHERE scoutnet_member_id = @scoutnet_member_id
          `).run({
            first_name: firstName,
            last_name: lastName || '',
            group_name: groupName,
            parent_name_1: parentName1,
            parent_phone: parentPhone1,
            parent_name_2: parentName2,
            parent_phone_2: parentPhone2,
            scoutnet_member_id: scoutnetMemberId,
          });
          imported++;
          return;
        }
      }

      // Try by name + group
      db.prepare(`
        INSERT INTO members
          (scoutnet_member_id, first_name, last_name, group_name, parent_name_1, parent_phone, parent_name_2, parent_phone_2)
        VALUES
          (@scoutnet_member_id, @first_name, @last_name, @group_name, @parent_name_1, @parent_phone, @parent_name_2, @parent_phone_2)
        ON CONFLICT(first_name, last_name, group_name) DO UPDATE SET
          scoutnet_member_id = excluded.scoutnet_member_id,
          parent_name_1 = excluded.parent_name_1,
          parent_phone = excluded.parent_phone,
          parent_name_2 = excluded.parent_name_2,
          parent_phone_2 = excluded.parent_phone_2
      `).run({
        scoutnet_member_id: scoutnetMemberId,
        first_name: firstName,
        last_name: lastName || '',
        group_name: groupName,
        parent_name_1: parentName1,
        parent_phone: parentPhone1,
        parent_name_2: parentName2,
        parent_phone_2: parentPhone2,
      });

      imported++;
    });
  });

  return { imported, skipped };
}

module.exports = { parseAndImportExcel };
