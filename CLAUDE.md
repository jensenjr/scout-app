# CLAUDE.md — Utvecklingsriktlinjer för Scout-appen

## 🛠️ Centrala kommandon
* **Backend start:** `cd backend && npm run dev` (Körs på port 5000 eller via miljövariabel)
* **Frontend start:** `cd frontend && npm run dev` (Körs via Vite)
* **Frontend produktionstest:** `cd frontend && npm run build`

## 🗄️ Databasstruktur (SQLite)
Applikationen använder följande viktiga tabeller och relationer:
* `members`: Innehåller `id`, `scoutnet_member_id`, `first_name`, `last_name`, `group_name`, `scout_phone`, `parent_name_1`, `parent_phone`, `parent_name_2`, `parent_phone_2`.
* `attendance`: Innehåller `member_id`, `meeting_date`, `present` (0 eller 1). Unik nyckel på `(member_id, meeting_date)`.
* `hidden_groups`: Innehåller `group_name` (PRIMARY KEY) för de avdelningar som valts att döljas i inställningarna.

## 🔌 Viktiga API-slutpunkter
* `GET /api/members/groups` — Hämtar unika, aktiva avdelningar (exkluderar de i `hidden_groups`).
* `GET /api/members/age-configs` — Hämtar alla unika avdelningar i systemet och deras synlighetsstatus.
* `POST /api/members/age-configs` — Lägger till/tar bort en avdelning från `hidden_groups`.
* `GET /api/members/import-status` — Returnerar `MAX(created_at)` från medlemmar för att visa senaste importtid.
* `GET /api/members/attendance-date?group=X&date=Y` — Hämtar närvarostatus.
* `POST /api/members/attendance-date` — Sparar närvarostatus (körs i en säker DB-transaktion).
* `POST /api/import/csv` — Tar emot kårens råa ScoutNet-CSV och parsar medlemsnr, scouternas egna mobiler samt anhöriga.

## 🎨 Kodstil & Riktlinjer
* **Svenska i UI:** Allt gränssnittstext och felmeddelanden riktade mot slutanvändaren ska skrivas på svenska.
* **Säkerhet:** SQL-frågor ska alltid köras via parameters (`?` eller `@param`) i `db.prepare()` för att undvika injektioner.
* **Transaktioner:** Vid radering och massinskrivning (som vid närvarosparande och filimport), använd alltid `db.transaction(() => { ... })`.

## 🔮 Kommande Arkitektur (Milstolpe: Google Drive & Kalender)
1. **Google Drive API:** Kommer att kräva tjänstekonto (Service Account) eller OAuth2-autentisering för att läsa filer från kårens Drive-mapp.
2. **Kalenderlogik:** En ny tabell `meetings` planeras för att lagra framtida mötesdatum inlästa från terminsprogrammen.
3. **Cron-jobb / Bakgrundssynk:** Backend ska utökas med en schemalagd körning som med jämna mellanrum kontrollerar om medlemslistan på Google Drive har uppdaterats och i så fall automatiskt kör `parseAndImport`.
