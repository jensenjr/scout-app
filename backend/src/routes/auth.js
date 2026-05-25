const express = require('express');
const crypto = require('crypto');

const router = express.Router();

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function getExpectedToken() {
  const pw = process.env.LEADER_PASSWORD || '';
  return hashPassword('scout-app:' + pw);
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  const expected = process.env.LEADER_PASSWORD;

  if (!expected || expected === 'placeholder') {
    return res.status(503).json({ error: 'LEADER_PASSWORD är inte konfigurerat i .env' });
  }

  if (!password || password !== expected) {
    return res.status(401).json({ error: 'Fel lösenord' });
  }

  const token = getExpectedToken();
  res.cookie('scout_auth', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 90, // 90 dagar
    path: '/',
  });

  res.json({ success: true });
});

// GET /api/auth/check
router.get('/check', (req, res) => {
  const token = req.cookies?.scout_auth;
  const expected = process.env.LEADER_PASSWORD;

  if (!expected || expected === 'placeholder') {
    // No password configured — allow access (dev mode)
    return res.json({ authenticated: true, dev: true });
  }

  if (token && token === getExpectedToken()) {
    return res.json({ authenticated: true });
  }

  res.status(401).json({ authenticated: false });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('scout_auth', { path: '/' });
  res.json({ success: true });
});

module.exports = router;
module.exports.authMiddleware = function (req, res, next) {
  // Skip auth for auth routes themselves
  if (req.path.startsWith('/api/auth')) return next();

  const expected = process.env.LEADER_PASSWORD;
  // If no password configured, allow all (dev mode)
  if (!expected || expected === 'placeholder') return next();

  const token = req.cookies?.scout_auth;
  const { getExpectedToken: _get } = module.exports;

  function getToken() {
    const pw = process.env.LEADER_PASSWORD || '';
    return require('crypto').createHash('sha256').update('scout-app:' + pw).digest('hex');
  }

  if (token && token === getToken()) return next();
  res.status(401).json({ error: 'Ej inloggad' });
};
