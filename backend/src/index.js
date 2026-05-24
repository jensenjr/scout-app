require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');

async function start() {
  await db.initDb();

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
  app.listen(PORT, () => console.log(`Scout API running on port ${PORT}`));
}

start().catch(err => { console.error('Startup failed:', err); process.exit(1); });
