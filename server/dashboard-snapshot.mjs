// Authenticated server-to-server handoff. Do not put these records in public/.
export function dashboardSnapshot(store) {
  const db=store.db;
  db.exec('BEGIN');
  try {
    const attempts=db.prepare('SELECT * FROM attempts').all().map(({observation_json, ...attempt})=>attempt);
    const snapshot={schema_version:1,exported_at:new Date().toISOString(),attempts,
      events:db.prepare('SELECT id,attempt_id,session_id,ts,event_name,surface,payload_json FROM events').all(),
      recommendations:db.prepare('SELECT * FROM recommendations').all(),
      steps:db.prepare('SELECT * FROM steps').all(),orders:db.prepare('SELECT * FROM orders').all(),
      coverage:{surfaces:['ezclassic','fab','restock','upgrade','gift'],orders:false,store_totals:false,
        lead_status:false,checkout:false,currency:'USD'}};
    db.exec('COMMIT');return snapshot;
  }catch(error){db.exec('ROLLBACK');throw error;}
}
