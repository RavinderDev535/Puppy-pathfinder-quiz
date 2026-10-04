import { DatabaseSync } from 'node:sqlite';

// Run on the server. Output contains customer information: import it only into
// the private dashboard backend, never a public static asset.
const database = new DatabaseSync(process.env.QUIZ_DB_PATH || 'data/quiz.sqlite', { readOnly: true });
try {
  database.exec('BEGIN');
  const tables = Object.fromEntries(['attempts','events','recommendations','steps','orders'].map(table =>
    [table, database.prepare(`SELECT * FROM ${table}`).all()]));
  const delivery = database.prepare('SELECT attempt_id,tries,next_try,last_error FROM profile_jobs').all();
  database.exec('COMMIT');
  process.stdout.write(JSON.stringify({ schema_version:1, exported_at:new Date().toISOString(), ...tables, pending_profiles:delivery },null,2)+'\n');
} finally { database.close(); }
