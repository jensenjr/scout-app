const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(process.env.DATABASE_PATH || './data/scout.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let _raw = null;
let _inTransaction = false;

function _save() {
  if (_inTransaction) return;
  const data = _raw.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function _prepareParams(args) {
  if (!args || args.length === 0) return undefined;
  if (args.length === 1 && args[0] !== null && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    // Named params — add @ prefix for sql.js
    const out = {};
    for (const [k, v] of Object.entries(args[0])) {
      const key = (k.startsWith('@') || k.startsWith(':') || k.startsWith('$')) ? k : `@${k}`;
      out[key] = v;
    }
    return out;
  }
  return args; // positional array
}

class StmtWrapper {
  constructor(sql) { this._sql = sql; }

  all(...args) {
    const params = _prepareParams(args);
    const stmt = _raw.prepare(this._sql);
    if (params !== undefined) stmt.bind(params);
    const results = [];
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  }

  get(...args) {
    const params = _prepareParams(args);
    const stmt = _raw.prepare(this._sql);
    if (params !== undefined) stmt.bind(params);
    let result = null;
    if (stmt.step()) result = stmt.getAsObject();
    stmt.free();
    return result;
  }

  run(...args) {
    const params = _prepareParams(args);
    const stmt = _raw.prepare(this._sql);
    try {
      if (params !== undefined) stmt.bind(params);
      stmt.step();
    } finally {
      stmt.free();
    }
    const rowIdResult = _raw.exec('SELECT last_insert_rowid()');
    const lastInsertRowid = rowIdResult[0]?.values[0]?.[0] ?? 0;
    _save();
    return { lastInsertRowid };
  }
}

const db = {
  prepare(sql) { return new StmtWrapper(sql); },

  exec(sql) {
    _raw.exec(sql);
    _save();
  },

  transaction(fn) {
    _raw.run('BEGIN');
    _inTransaction = true;
    try {
      const result = fn();
      _raw.run('COMMIT');
      _inTransaction = false;
      _save();
      return result;
    } catch (e) {
      _raw.run('ROLLBACK');
      _inTransaction = false;
      throw e;
    }
  },

  async initDb() {
    const SQL = await initSqlJs();
    const buffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null;
    _raw = buffer ? new SQL.Database(buffer) : new SQL.Database();

    _raw.run('PRAGMA foreign_keys = ON');

    _raw.exec(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        group_name TEXT NOT NULL,
        scalpnet_url TEXT,
        parent_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(first_name, last_name, group_name)
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        meeting_date DATE NOT NULL,
        present BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (member_id) REFERENCES members(id),
        UNIQUE(member_id, meeting_date)
      );

      CREATE TABLE IF NOT EXISTS sms_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        phone TEXT NOT NULL,
        message TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT,
        FOREIGN KEY (member_id) REFERENCES members(id)
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_name TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    _save();
  },
};

module.exports = db;
