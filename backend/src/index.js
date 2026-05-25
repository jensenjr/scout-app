require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');

function getExpectedToken() {
  const pw = process.env.LEADER_PASSWORD || '';
  return crypto.createHash('sha256').update('scout-app:' + pw).digest('hex');
}

function authMiddleware(req, res, next) {
  const expected = process.env.LEADER_PASSWORD;
  // Dev mode: no password set → allow all
  if (!expected || expected === 'placeholder') return next();

  const token = req.cookies?.scout_auth;
  if (token && token === getExpectedToken()) return next();

  res.status(401).json({ error: 'Ej inloggad' });
}

async function start() {
  await db.initDb();

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Auth routes — no middleware
  app.use('/api/auth', require('./routes/auth'));

  // All other API routes require auth
  app.use('/api', authMiddleware);
  app.use('/api/members', require('./routes/members'));
  app.use('/api/sms', require('./routes/sms'));
  app.use('/api/announcements', require('./routes/announcements'));
  app.use('/api/import', require('./routes/importData'));
  app.use('/api/report', require('./routes/report'));

  const publicDir = path.join(__dirname, '../public');
  const fs = require('fs');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get('*', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  }

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Scout API på port ${PORT}`));
}

start().catch(err => { console.error('Startup misslyckades:', err); process.exit(1); });
