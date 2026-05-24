# Scout Dashboard — Claude Code Build Instructions

## Project Overview

A simple web app for scout leaders to track attendance, flag members who are missing meetings, send SMS alerts to parents, and post announcements to groups. Built for a small Swedish scout group in Mellerud.

---

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js with Express
- **Database**: SQLite via `better-sqlite3`
- **SMS**: 46elks API (Swedish SMS provider, HTTP Basic Auth)
- **Scraper**: Playwright (headless browser to log in to ScalpNet and download CSV)
- **Hosting**: Coolify (self-hosted, Docker)

---

## Core Principles

- **GDPR-conscious**: Only store first name, last name, group, attendance records, and a deep-link URL back to ScalpNet. No personal numbers, no birth dates, no gender data stored in this app.
- **No authentication required**: The app is internal, leaders just visit the URL. Group filtering is done by URL parameter (e.g. `/group/rovare`).
- **Simple UI**: Clean, mobile-friendly. Leaders are not tech people.

---

## Environment Variables

Create a `.env` file in the `/backend` directory. Never commit this file (it is already in `.gitignore`).

```env
# ScalpNet credentials
SCALPNET_USERNAME=placeholder
SCALPNET_PASSWORD=placeholder
SCALPNET_BASE_URL=placeholder

# 46elks SMS API
ELKS_API_USERNAME=placeholder
ELKS_API_PASSWORD=placeholder
ELKS_FROM=Scouter

# App config
PORT=3001
DATABASE_PATH=./data/scout.db
```

---

## Database Schema (SQLite)

```sql
-- Members table: minimal data only
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  group_name TEXT NOT NULL,
  scalpnet_url TEXT,
  parent_phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  meeting_date DATE NOT NULL,
  present BOOLEAN NOT NULL DEFAULT 0,
  FOREIGN KEY (member_id) REFERENCES members(id)
);

-- SMS log (to avoid double-sending)
CREATE TABLE IF NOT EXISTS sms_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT,
  FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Backend API Routes

### Data Import
- `POST /api/import/trigger` — Triggers Playwright to log in to ScalpNet, download the latest attendance CSV, parse it, and upsert into SQLite. Returns a summary of records imported.
- `POST /api/import/upload` — Alternative: leader manually uploads a CSV file. Same parsing logic.

### Members
- `GET /api/members?group=rovare` — Returns all members for a group with their attendance summary
- `GET /api/members/flagged?group=rovare` — Returns members who have missed 2 or more consecutive meetings
- `PUT /api/members/:id` — Update parent phone number

### SMS
- `POST /api/sms/send` — Send SMS via 46elks to a parent
  - Body: `{ memberId, phone, message }`
  - Checks sms_log to prevent duplicate sends within 7 days for same member
  - Uses 46elks HTTP Basic Auth with `ELKS_API_USERNAME` and `ELKS_API_PASSWORD`
  - 46elks endpoint: `POST https://api.46elks.com/a1/sms`
  - Body params: `from`, `to`, `message`

### Announcements
- `GET /api/announcements?group=rovare` — Get all announcements for a group
- `POST /api/announcements` — Create a new announcement
  - Body: `{ group_name, title, body }`

### Municipal Report
- `POST /api/report/generate` — Upload enriched CSV (with personal numbers, gender, etc.) from ScalpNet, merge with stored attendance data, and output a filled Excel file using `exceljs`. Return as file download.

---

## Frontend Pages

### `/` — Group selector
Simple landing page with buttons for each scout group (e.g. Bäver, Spejare, Äventyrare, Rovare). Clicking a group navigates to `/group/:groupName`.

### `/group/:groupName` — Dashboard
- **Flagged members panel**: Red cards for anyone who missed 2+ meetings. Each card shows name, number of meetings missed, and a "Skicka SMS" button.
- **Full attendance list**: Table showing all members, their attendance count, and last seen date.
- **Announcements section**: List of recent announcements for this group.
- **Post announcement button**: Opens a modal to post a new announcement (title + body).

### `/admin` — Admin panel
- **"Hämta data" button**: Triggers `POST /api/import/trigger` to fetch latest data from ScalpNet.
- **Upload CSV button**: Manual fallback.
- **Generate report button**: Uploads enriched CSV and downloads the municipal Excel report.

---

## SMS Template (Swedish)

When the "Skicka SMS" button is clicked, the message should be pre-filled and editable before sending:

```
Hej! Vi har märkt att [Förnamn] inte har varit med på de senaste mötena. Vi saknar er och undrar om allt är okej. Hör gärna av er till oss om ni har frågor eller om [Förnamn] vill sluta. Hälsningar, Scouterna i Mellerud
```

---

## Playwright Scraper

The scraper module lives at `backend/src/scraper.js`. It should:

1. Launch a headless Chromium browser
2. Navigate to ScalpNet login page (use `SCALPNET_BASE_URL`)
3. Fill in username and password from env variables
4. Navigate to the attendance export page
5. Download the CSV file to a temp directory
6. Return the file path

If the scraper fails (wrong URL, changed UI, etc.), it should return a clear error message so the leader knows to use manual CSV upload instead.

---

## CSV Parsing Logic

The ScalpNet CSV export format is assumed to have these columns (adjust if different):
`Förnamn, Efternamn, Grupp, Datum, Närvarande`

Parsing should:
- Skip rows with missing name or date
- Upsert members by full name + group (no duplicate members)
- Insert attendance records per date per member
- NOT store personal numbers, gender, or birth dates

---

## Docker Setup

Create a `Dockerfile` in the project root for Coolify deployment:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install && npm run build

COPY backend ./backend
COPY frontend/dist ./backend/public

WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "src/index.js"]
```

The Express server should serve the built React frontend from `backend/public` as static files.

---

## Build Order for Alpha

1. Set up project structure: `backend/` with Express + SQLite, `frontend/` with React + Vite + Tailwind
2. Create database schema and migration script
3. Build all API routes with placeholder responses
4. Build frontend pages with hardcoded mock data first
5. Wire frontend to backend API
6. Implement CSV parser and upsert logic
7. Implement Playwright scraper (mark as optional/fallback)
8. Implement 46elks SMS sending
9. Implement municipal report Excel export
10. Dockerfile + docker-compose.yml for Coolify

---

## Notes

- The app does not need user authentication for alpha. All leaders share the same URL.
- Parent phone numbers are stored in SQLite and can be imported from CSV or entered manually on the member card.
- Keep the UI in Swedish throughout.
- The municipal report Excel template format is not yet defined — build a generic export for now and it can be adjusted later.
