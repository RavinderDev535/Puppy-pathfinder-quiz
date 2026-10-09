import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { createHash, timingSafeEqual } from 'node:crypto';
import { dashboardSnapshot } from './dashboard-snapshot.mjs';
import { createQuizStore } from './quiz-store.mjs';
import { normalizeProfile, saveProfile } from './quiz-profile.mjs';
export { saveProfile } from './quiz-profile.mjs';
const require=createRequire(import.meta.url);
const {products}=require('../src/lib/quiz-lanes/reference-data.json');
const handles=new Set(products.map(p=>p.handle));
const cache=new Map();
const lanes=new Set(['fab','ezclassic','restock','upgrade','gift']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>32768)throw Error('Request too large');}return JSON.parse(text);}
async function shopify(handle){
  const old=cache.get(handle);if(old&&old.until>Date.now())return old.value;
  const response=await fetch(`https://www.ezwhelp.com/products/${handle}.js`,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Product could not be loaded');
  const p=await response.json();
  const value={handle:p.handle,variants:p.variants.map(v=>({id:String(v.id),price:v.price,available:v.available===true,title:v.title,sku:v.sku}))};
  cache.set(handle,{value,until:Date.now()+30000});return value;
}
export function createQuizApi(env=process.env, dependencies={}){
  let database;
  const store=()=>database ||= dependencies.store || createQuizStore(env.QUIZ_DB_PATH || 'data/quiz.sqlite');
  const klaviyo=dependencies.klaviyo || (async(path,method='GET',payload)=>{
    const r=await fetch(`https://a.klaviyo.com/api/${path}`,{method,headers:{Authorization:`Klaviyo-API-Key ${env.KLAVIYO_PRIVATE_API_KEY}`,revision:'2026-07-15','Content-Type':'application/vnd.api+json',accept:'application/vnd.api+json'},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw Error(`Email service returned ${r.status}`);
    return r.status===204||r.status===202?{}:r.json();
  });
  const lookupCustomer=dependencies.lookupCustomer || (async(email)=>{
    if(!env.SHOPIFY_ADMIN_ACCESS_TOKEN||!env.SHOPIFY_STORE_DOMAIN)throw Error('Customer lookup not configured');
    if(!/^[a-z0-9-]+\.myshopify\.com$/.test(env.SHOPIFY_STORE_DOMAIN))throw Error('Invalid Shopify store domain');
    const r=await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2026-07/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':env.SHOPIFY_ADMIN_ACCESS_TOKEN},body:JSON.stringify({query:'query($query:String!){customers(first:10,query:$query){nodes{email numberOfOrders}}}',variables:{query:`email:${JSON.stringify(email)}`}}),signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw Error('Customer lookup failed');const data=await r.json();
    if(data.errors||!data.data?.customers)throw Error('Customer lookup failed');
    return data.data.customers.nodes.some(c=>c.email?.toLowerCase()===email&&Number(c.numberOfOrders)>0);
  });
  let running;
  async function flush(){
    if(running)return running;
    if(!env.KLAVIYO_PRIVATE_API_KEY)return;
    running=(async()=>{
      const s=store();
      // Serialize profile jobs so two attempts with the same email cannot both observe newness.
      if(env.KLAVIYO_LIST_ID && env.KLAVIYO_MASTER_LIST_ID) for(const job of s.db.prepare('SELECT * FROM profile_jobs WHERE next_try<=? ORDER BY rowid LIMIT 10').all(Date.now())){
        const input=JSON.parse(job.payload_json), a=s.attempt(input.attempt_id);
        // An earlier failed job for this email must finish before a later run
        // can classify the same person as new a second time.
        if(s.db.prepare(`SELECT 1 FROM profile_jobs WHERE rowid < (SELECT rowid FROM profile_jobs WHERE attempt_id=?)
          AND json_extract(payload_json,'$.email')=?`).get(a.id,input.email))continue;
        try {
          const result=await saveProfile(input,klaviyo,env.KLAVIYO_LIST_ID,{
            observation:a.observation_json?JSON.parse(a.observation_json):undefined,lookupCustomer,
            listIds:[env.KLAVIYO_MASTER_LIST_ID],facilityListId:env.KLAVIYO_FACILITY_LIST_ID,
            onObservation:o=>s.update(a.id,{observation_json:JSON.stringify(o),is_new_lead:o.is_new_lead,
              was_existing_customer:o.was_existing_customer,lead_checked_at:o.checked_at,needs_review:o.lookup_failed}),
          });
          const current=s.db.prepare('SELECT payload_json FROM profile_jobs WHERE attempt_id=?').get(a.id);
          if(current?.payload_json!==job.payload_json)continue;
          s.update(a.id,{profile_status:'saved',properties_json:JSON.stringify(result.properties)});
          // Completion events are delivered only after profile properties and list requests.
          if(!s.db.prepare("SELECT 1 FROM events WHERE attempt_id=? AND event_name='Quiz Completed'").get(a.id)) s.record({...input,id:randomUUID(),event:'Quiz Completed',properties:result.properties});
          s.db.prepare('DELETE FROM profile_jobs WHERE attempt_id=?').run(a.id);
        } catch(error) {
          s.update(a.id,{profile_status:'pending',needs_review:true});
          s.db.prepare('UPDATE profile_jobs SET tries=tries+1,next_try=?,last_error=? WHERE attempt_id=?')
            .run(Date.now()+Math.min(3600000,1000*2**Math.min(job.tries+1,12)),error.message,a.id);
        }
      }
      // Gift and unidentified visitors stay in our database: Klaviyo events create profiles.
      const events=s.db.prepare(`SELECT e.*,a.email FROM events e JOIN attempts a ON a.id=e.attempt_id
        WHERE e.klaviyo_sent=0 AND a.profile_status='saved' AND e.surface!='gift' ORDER BY e.ts,e.rowid LIMIT 100`).all();
      for(const event of events){
        try {
          await klaviyo('events','POST',{data:{type:'event',attributes:{unique_id:event.id,time:event.ts,
            properties:{...JSON.parse(event.payload_json),attempt_id:event.attempt_id,session_id:event.session_id,surface:event.surface},
            metric:{data:{type:'metric',attributes:{name:event.event_name==='step_complete'?'Quiz Step Completed':event.event_name}}},
            profile:{data:{type:'profile',attributes:{email:event.email}}}}}});
          s.db.prepare('UPDATE events SET klaviyo_sent=1 WHERE id=?').run(event.id);
        } catch { break; } // Retain pending rows for the next retry, preserving order.
      }
    })().finally(()=>{running=undefined;});
    return running;
  }
  const timer=setInterval(()=>{void flush().catch(e=>console.error('[quiz-sync]',e.message));},30000);timer.unref();
  const handler=async function quizApi(req,res){
    const url=new URL(req.url,'http://localhost');
    // Keep the old route working for already-deployed clients, while the
    // frontend and documentation use the canonical /api/quiz/lanes route.
    const apiPath=url.pathname.replace(/^\/api\/quiz-lanes\//,'/api/quiz/lanes/');
    if(!apiPath.startsWith('/api/quiz/lanes/'))return false;
    try{
      // The Vite development server runs on a different port from this API.
      // Additional production origins must be explicitly configured.
      const origin=req.headers.origin;
      const allowedOrigins=new Set((env.QUIZ_CORS_ORIGINS||'http://localhost:5173,http://127.0.0.1:5173').split(',').map(value=>value.trim()).filter(Boolean));
      if(origin&&new URL(origin).host!==req.headers.host&&!allowedOrigins.has(origin)){json(res,403,{error:'Origin not allowed'});return true;}
      if(origin)res.setHeader?.('Access-Control-Allow-Origin',origin);
      res.setHeader?.('Vary','Origin');
      if(req.method==='OPTIONS'){
        res.setHeader?.('Access-Control-Allow-Methods','GET, POST, OPTIONS');
        res.setHeader?.('Access-Control-Allow-Headers','Content-Type, Authorization');
        res.writeHead(204);res.end();return true;
      }
      if(apiPath==='/api/quiz/lanes/dashboard-snapshot'){
        if(req.method!=='GET'){json(res,405,{error:'Method not allowed'});return true;}
        if(!env.QUIZ_DASHBOARD_TOKEN){json(res,503,{error:'Dashboard connection is not configured'});return true;}
        const supplied=req.headers.authorization||'';
        const hash=value=>createHash('sha256').update(value).digest();
        if(!timingSafeEqual(hash(supplied),hash(`Bearer ${env.QUIZ_DASHBOARD_TOKEN}`))){json(res,401,{error:'Unauthorized'});return true;}
        json(res,200,dashboardSnapshot(store()));return true;
      }
      if(apiPath==='/api/quiz/lanes/status'&&req.method==='GET') {json(res,200,{email:!!(env.KLAVIYO_PRIVATE_API_KEY&&env.KLAVIYO_LIST_ID&&env.KLAVIYO_MASTER_LIST_ID),analytics:true});return true;}
      if(apiPath.startsWith('/api/quiz/lanes/products/')&&req.method==='GET'){
        const handle=apiPath.split('/').pop();if(!handles.has(handle)){json(res,404,{error:'Unknown product'});return true;}
        json(res,200,await shopify(handle));return true;
      }
      if(!['/api/quiz/lanes/profile','/api/quiz/lanes/events'].includes(apiPath)){json(res,404,{error:'Unknown endpoint'});return true;}
      if(req.method!=='POST'){json(res,405,{error:'Method not allowed'});return true;}
      let input;
      try {
        input=await body(req);
        if(!lanes.has(input.lane)||!uuid.test(input.attempt_id||'')||!uuid.test(input.session_id||''))throw Error('Invalid quiz identity');
        if(input.ts&&!Number.isFinite(Date.parse(input.ts)))throw Error('Invalid timestamp');
        if(input.context?.started_at&&!Number.isFinite(Date.parse(input.context.started_at)))throw Error('Invalid start time');
        if(url.pathname.endsWith('/profile'))input=normalizeProfile(input);
        else if(!uuid.test(input.id||'')||typeof input.event!=='string'||input.event.length>80||!input.event)throw Error('Invalid event');
        if(input.event==='Checkout Started'||input.event==='Placed Order')throw Error('Store events must come from Shopify');
      } catch(error){json(res,400,{error:error.message});return true;}
      if(url.pathname.endsWith('/profile')){
        const s=store();s.queueProfile(input);
        s.record({...input,id:input.attempt_id,event:'email_capture',properties:{email_consent:true}});
        // The completion event uses its own ID (email capture already uses the attempt UUID).
        if(!env.KLAVIYO_PRIVATE_API_KEY||!env.KLAVIYO_LIST_ID||!env.KLAVIYO_MASTER_LIST_ID){
          if(!s.attempt(input.attempt_id).observation_json)s.update(input.attempt_id,{is_new_lead:null,needs_review:true,
            observation_json:JSON.stringify({is_new_lead:null,lookup_failed:true,checked_at:new Date().toISOString()})});
          json(res,202,{saved:true,follow_up:'pending'});return true;
        }
        void flush().catch(e=>console.error('[quiz-sync]',e.message));
        json(res,202,{saved:true,follow_up:'pending'});return true;
      }
      // Never accept email identity through the analytics endpoint before lead lookup.
      if(input.lane==='gift') { delete input.email; for(const k of ['email','email_consent','consent_timestamp'])delete input.properties?.[k]; }
      store().record(input);
      void flush().catch(e=>console.error('[quiz-sync]',e.message));
      json(res,202,{accepted:true});return true;
    }catch(error){console.error('[quiz-api]',error.message);json(res,502,{error:'The service is temporarily unavailable. Please try again.'});}
    return true;
  };
  handler.flush=flush;
  handler.close=()=>{clearInterval(timer);database?.close();};
  return handler;
}
