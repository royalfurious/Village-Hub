const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../db');

async function run() {
  try {
    const sqlPath = path.join(__dirname, '..', 'database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split statements on semicolon followed by optional whitespace/newline.
    const statements = sql
      .split(/;\s*(?:\r?\n|$)/)
      .map(s => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      console.log('Running:', stmt.split('\n')[0].slice(0, 120));
      await db.pool.query(stmt);
    }

    console.log('Database import completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err.message || err);
    process.exit(1);
  }
}

run();
