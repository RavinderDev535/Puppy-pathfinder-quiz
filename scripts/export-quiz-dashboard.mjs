import { DatabaseSync } from 'node:sqlite';
import { dashboardSnapshot } from '../server/dashboard-snapshot.mjs';

// Run on the server. Output contains customer information: import it only into
// the private dashboard backend, never a public static asset.
const database = new DatabaseSync(process.env.QUIZ_DB_PATH || 'data/quiz.sqlite', { readOnly: true });
try {
  const snapshot = dashboardSnapshot({db:database});
  const delivery = database.prepare('SELECT attempt_id,tries,next_try,last_error FROM profile_jobs').all();
  process.stdout.write(JSON.stringify({ ...snapshot, pending_profiles:delivery },null,2)+'\n');
} finally { database.close(); }
