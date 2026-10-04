import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

// Server-owned data, never served by the static file handler. Mount this directory
// on persistent storage in production; use one writer process per database.
export function createQuizStore(filename = 'data/quiz.sqlite') {
  if (filename !== ':memory:') mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL, ts TEXT NOT NULL, day TEXT NOT NULL,
      surface TEXT NOT NULL, stored INTEGER NOT NULL DEFAULT 1,
      channel TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, referrer TEXT, device TEXT,
      breed TEXT, breed_free_text TEXT, breed_unresolved INTEGER, experience TEXT, dam_size TEXT,
      size_band TEXT, stage TEXT, due_date TEXT, dob TEXT, go_home_date TEXT, litter_size_band TEXT,
      zones INTEGER, branch_answer TEXT, containment TEXT, has_window INTEGER, panel_height TEXT,
      box_config TEXT, drop_step TEXT, reached_results INTEGER DEFAULT 0, completed INTEGER DEFAULT 0,
      email_captured INTEGER DEFAULT 0, email TEXT, is_new_lead INTEGER, was_existing_customer INTEGER,
      lead_checked_at TEXT, needs_review INTEGER DEFAULT 0, duration_ms INTEGER,
      properties_json TEXT NOT NULL DEFAULT '{}', observation_json TEXT, profile_status TEXT);
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES attempts(id), session_id TEXT NOT NULL,
      ts TEXT NOT NULL, event_name TEXT NOT NULL, surface TEXT NOT NULL, payload_json TEXT NOT NULL,
      klaviyo_sent INTEGER DEFAULT 0);
    CREATE INDEX IF NOT EXISTS events_attempt ON events(attempt_id, event_name, ts);
    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY REFERENCES events(id), attempt_id TEXT NOT NULL REFERENCES attempts(id),
      ts TEXT NOT NULL, surface TEXT NOT NULL, recommended_skus_json TEXT, recommended_variant_ids_json TEXT,
      cart_url TEXT, cart_value REAL);
    CREATE TABLE IF NOT EXISTS steps (
      id TEXT PRIMARY KEY REFERENCES events(id), attempt_id TEXT NOT NULL REFERENCES attempts(id),
      step_number INTEGER, step_name TEXT, answer TEXT, ms_spent INTEGER, completed INTEGER);
    CREATE TABLE IF NOT EXISTS orders (
      shopify_order_id TEXT PRIMARY KEY, attempt_id TEXT REFERENCES attempts(id), email TEXT,
      ts TEXT NOT NULL, order_value REAL, line_items_json TEXT);
    CREATE TABLE IF NOT EXISTS profile_jobs (
      attempt_id TEXT PRIMARY KEY REFERENCES attempts(id), payload_json TEXT NOT NULL,
      tries INTEGER DEFAULT 0, next_try INTEGER DEFAULT 0, last_error TEXT);
  `);
  function attempt(id) { return db.prepare('SELECT * FROM attempts WHERE id=?').get(id); }
  function update(id, values) {
    const columns = new Set(db.prepare('PRAGMA table_info(attempts)').all().map(c => c.name));
    const entries = Object.entries(values).filter(([k,v]) => columns.has(k) && v !== undefined);
    if (entries.length) db.prepare(`UPDATE attempts SET ${entries.map(([k]) => `${k}=?`).join(',')} WHERE id=?`)
      .run(...entries.map(([,v]) => typeof v === 'boolean' ? Number(v) : v), id);
  }
  function ensure(input) {
    const c = input.context || {};
    const ts = c.started_at || input.ts || new Date().toISOString();
    db.prepare(`INSERT OR IGNORE INTO attempts(id,session_id,ts,day,surface,channel,utm_source,utm_medium,utm_campaign,referrer,device)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(input.attempt_id,input.session_id,ts,ts.slice(0,10),input.lane,
      c.channel||'Direct',c.utm_source||null,c.utm_medium||null,c.utm_campaign||null,c.referrer||null,c.device||null);
    const row = attempt(input.attempt_id);
    if (row.surface !== input.lane || row.session_id !== input.session_id) throw Error('Attempt identity mismatch');
    return row;
  }
  function record(input) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const a = ensure(input), p = input.properties || {}, ts = input.ts || new Date().toISOString();
      const name = input.event === 'Quiz Step Completed' ? 'step_complete' : input.event;
      // Include payload equality so two different answers within the window survive.
      const payload = JSON.stringify(p);
      const duplicate = db.prepare(`SELECT id FROM events WHERE id=? OR
        (attempt_id=? AND event_name=? AND payload_json=? AND abs(julianday(ts)-julianday(?))*86400000 < 1000)`).get(input.id,input.attempt_id,name,payload,ts);
      if (duplicate) { db.exec('COMMIT'); return false; }
      db.prepare('INSERT INTO events(id,attempt_id,session_id,ts,event_name,surface,payload_json) VALUES(?,?,?,?,?,?,?)')
        .run(input.id,input.attempt_id,input.session_id,ts,name,input.lane,payload);
      const patch = { duration_ms: Math.max(a.duration_ms||0, Date.parse(ts)-Date.parse(a.ts)) };
      for(const key of ['breed','breed_free_text','breed_unresolved','experience','size_band','stage','due_date','dob','go_home_date','litter_size_band','panel_height']) {
        if(p[key]!==undefined && p[key]!==null && p[key]!=='')patch[key]=p[key];
      }
      if (name === 'step_complete') {
        db.prepare('INSERT INTO steps VALUES(?,?,?,?,?,?,1)').run(input.id,input.attempt_id,p.step_number||null,p.step_name||null,JSON.stringify(p.answer??null),p.ms_spent??null);
        patch.drop_step = p.step_name;
        const answerFields={breed:'breed',weight:'size_band',experience:'experience',stage:'stage',litter:'litter_size_band',windowed:'has_window'};
        if(answerFields[p.step_name])patch[answerFields[p.step_name]]=p.answer;
        if(p.step_name==='breed')patch.breed_unresolved=p.answer==='not_listed';
      }
      if (name === 'recommendation_shown') {
        db.prepare('INSERT INTO recommendations VALUES(?,?,?,?,?,?,?,?)').run(input.id,input.attempt_id,ts,input.lane,
          JSON.stringify(p.recommended_skus||[]),JSON.stringify(p.recommended_variant_ids||[]),p.cart_url||null,p.cart_value??null);
        patch.reached_results = 1;
        if (['fab','ezclassic','upgrade'].includes(input.lane)) patch.completed = 1;
      }
      if (name === 'Added to Cart' && ['restock','gift'].includes(input.lane)) patch.completed = 1;
      if (/Abandoned$/.test(name)) patch.drop_step = p.last_step_name || p.last_step || a.drop_step;
      update(input.attempt_id,patch);
      db.exec('COMMIT'); return true;
    } catch (e) { db.exec('ROLLBACK'); throw e; }
  }
  function queueProfile(input) {
    const a = ensure(input);
    if (a.email && a.email !== input.email) throw Error('Restart the quiz before changing a submitted email');
    const p = input.properties;
    update(a.id,{...p,is_new_lead:a.is_new_lead,was_existing_customer:a.was_existing_customer,email:input.email,email_captured:1,has_window:p.windowed,
      box_config:p.box_size,properties_json:JSON.stringify(p),profile_status:'pending'});
    db.prepare(`INSERT INTO profile_jobs(attempt_id,payload_json) VALUES(?,?)
      ON CONFLICT(attempt_id) DO UPDATE SET payload_json=excluded.payload_json,next_try=0`).run(a.id,JSON.stringify(input));
  }
  return { db, attempt, update, ensure, record, queueProfile, close: () => db.close() };
}
