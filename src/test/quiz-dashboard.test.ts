// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHmac, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createQuizStore } from '../../server/quiz-store.mjs';
import { createQuizApi } from '../../server/quiz-api.mjs';
import { normalizeProfile, saveProfile } from '../../server/quiz-profile.mjs';

const cleanup: (()=>void)[]=[];
afterEach(()=>{cleanup.splice(0).reverse().forEach(fn=>fn());});
function input(lane='fab') { return {lane,attempt_id:randomUUID(),session_id:randomUUID(),id:randomUUID(),ts:new Date().toISOString(),event:'Quiz Started',email:' BREEDER@Example.com ',properties:{email_consent:true,consent_timestamp:'2026-10-04T00:00:00Z'},context:{utm_source:'newsletter',utm_medium:'email',channel:'Email'}}; }
function setup(env:Record<string,string>={},request=vi.fn(async()=>({data:{id:'profile'}}))) {
  const store=createQuizStore(':memory:');
  const api=createQuizApi(env,{store,klaviyo:request});cleanup.push(()=>api.close());
  async function post(route:string,data:unknown) {
    const req=Readable.from([JSON.stringify(data)]) as Readable & {url:string;method:string;headers:Record<string,string>};
    req.url=`/api/quiz/lanes/${route}`;req.method='POST';req.headers={host:'localhost',origin:'http://localhost'};
    let status=0,result:Record<string,unknown>={};
    const res={writeHead:(code:number)=>{status=code;},end:(text:string)=>{result=JSON.parse(text);}};
    await api(req,res);return {status,result};
  }
  return {store,api,post,request};
}
describe('dashboard persistence and integration boundaries',()=>{
  it('protects the dashboard snapshot and exports all five lanes without consent lookup internals',async()=>{
    const {store,api,post}=setup({QUIZ_DASHBOARD_TOKEN:'private-test-token'});
    for(const lane of ['ezclassic','fab','restock','upgrade','gift']) {
      const e=input(lane);await post('events',e);store.update(e.attempt_id,{observation_json:JSON.stringify({private:'consent lookup'})});
    }
    async function snapshot(token?:string){
      let status=0,data:Record<string,unknown>={};
      await api({method:'GET',url:'/api/quiz/lanes/dashboard-snapshot',headers:{authorization:token}},
        {writeHead:(code:number)=>{status=code;},end:(value:string)=>{data=JSON.parse(value);}});
      return {status,data};
    }
    expect((await snapshot()).status).toBe(401);
    expect((await snapshot('Bearer wrong')).status).toBe(401);
    const result=await snapshot('Bearer private-test-token');expect(result.status).toBe(200);
    expect(result.data.attempts).toHaveLength(5);
    expect(JSON.stringify(result.data)).not.toContain('observation_json');
    expect(result.data.coverage).toMatchObject({orders:false,checkout:false,store_totals:false,lead_status:false});
  });
  it('keeps snapshot access disabled until its server-only credential is configured',async()=>{
    const {api}=setup();let status=0;
    await api({method:'GET',url:'/api/quiz/lanes/dashboard-snapshot',headers:{}},{writeHead:(code:number)=>{status=code;},end:()=>{}});
    expect(status).toBe(503);
  });
  it.each(['ezclassic','fab','restock','upgrade','gift'])('persists %s without Klaviyo credentials',async lane=>{
    const {store,post}=setup();const event=input(lane);
    expect((await post('events',event)).status).toBe(202);
    const attempt=store.attempt(event.attempt_id);
    expect(attempt).toMatchObject({surface:lane,channel:'Email',utm_source:'newsletter',email:null,is_new_lead:null});
    expect(store.db.prepare('SELECT * FROM events').all()).toHaveLength(1);
  });
  it('keeps records across database reopen, deduplicates identical clicks, and retains distinct answers',()=>{
    const dir=mkdtempSync(path.join(tmpdir(),'quiz-db-'));cleanup.push(()=>rmSync(dir,{recursive:true}));
    const file=path.join(dir,'quiz.sqlite');const first=createQuizStore(file),e={...input(),event:'Quiz Step Completed',properties:{step_name:'breed',step_number:1,answer:'Poodle',ms_spent:123}};
    first.record(e);first.record({...e,id:randomUUID()});first.record({...e,id:randomUUID(),properties:{...e.properties,answer:'Labrador Retriever'}});first.close();
    const second=createQuizStore(file);cleanup.push(()=>second.close());
    expect(second.db.prepare('SELECT * FROM events').all()).toHaveLength(2);
    expect(second.db.prepare('SELECT * FROM steps').all()).toHaveLength(2);
    expect(second.attempt(e.attempt_id).breed).toBe('Labrador Retriever');
  });
  it('stores recommendations and uses the documented per-lane completion rules',async()=>{
    const {store,post}=setup();
    for(const lane of ['fab','ezclassic','restock','upgrade','gift']) {
      const e=input(lane);
      await post('events',{...e,event:'recommendation_shown',properties:{recommended_skus:['SKU'],recommended_variant_ids:['123'],cart_value:12,cart_url:'https://www.ezwhelp.com/cart/123:1'}});
      expect(store.attempt(e.attempt_id).completed).toBe(['fab','ezclassic','upgrade'].includes(lane)?1:0);
      await post('events',{...e,id:randomUUID(),event:'Added to Cart'});
      expect(store.attempt(e.attempt_id).completed).toBe(1);
    }
    expect(store.db.prepare('SELECT * FROM recommendations').all()).toHaveLength(5);
  });
  it('rejects missing identity and fabricated Shopify checkout events',async()=>{
    const {post}=setup();
    expect((await post('events',{...input(),attempt_id:undefined})).status).toBe(400);
    expect((await post('events',{...input(),event:'Checkout Started'})).status).toBe(400);
  });
  it('records Shopify orders using cart attempt_id first, then email, while retaining unmatched store sales',async()=>{
    const {store,api,post}=setup({SHOPIFY_WEBHOOK_SECRET:'webhook-secret'});
    const attempt=input();await post('events',attempt);store.update(attempt.attempt_id,{email:'breeder@example.com'});
    async function webhook(order:Record<string,unknown>){
      const raw=JSON.stringify(order),signature=createHmac('sha256','webhook-secret').update(raw).digest('base64');
      const req=Readable.from([raw]) as Readable & {url:string;method:string;headers:Record<string,string>};
      req.url='/api/quiz/lanes/shopify/orders';req.method='POST';req.headers={'x-shopify-hmac-sha256':signature};
      let status=0;await api(req,{writeHead:(code:number)=>{status=code;},end:()=>{}});return status;
    }
    expect(await webhook({id:1,created_at:'2026-05-25T07:00:00Z',email:'other@example.com',total_price:'42.50',note_attributes:[{name:'attempt_id',value:attempt.attempt_id}],line_items:[]})).toBe(200);
    expect(await webhook({id:2,created_at:'2026-05-25T07:00:00Z',email:'nobody@example.com',total_price:'10.00',line_items:[]})).toBe(200);
    expect(store.db.prepare('SELECT attempt_id FROM orders WHERE shopify_order_id=?').get('1').attempt_id).toBe(attempt.attempt_id);
    expect(store.db.prepare('SELECT attempt_id FROM orders WHERE shopify_order_id=?').get('2').attempt_id).toBeNull();
  });
  it('Gift never creates a Klaviyo profile, even via events',async()=>{
    const {post,api,request}=setup({KLAVIYO_PRIVATE_API_KEY:'mock',KLAVIYO_LIST_ID:'quiz',KLAVIYO_MASTER_LIST_ID:'master'});
    const e=input('gift');await post('events',{...e,event:'Added to Cart'});
    expect((await post('profile',e)).status).toBe(400);await api.flush();expect(request).not.toHaveBeenCalled();
  });
  it('saves submitted email and queues follow-up when service configuration is absent',async()=>{
    const {store,post}=setup();const e=input('restock');
    expect((await post('profile',e)).status).toBe(202);
    expect(store.attempt(e.attempt_id)).toMatchObject({email:'breeder@example.com',email_captured:1,is_new_lead:null,profile_status:'pending'});
    expect(store.db.prepare('SELECT * FROM profile_jobs').all()).toHaveLength(1);
  });
  it('preserves the first lead observation through retries and sends completion only after profile/list writes',async()=>{
    let fail=true;
    const request=vi.fn(async(path:string)=>{if(path.startsWith('profiles?'))return {data:[]};if(path==='profile-import'&&fail)throw Error('temporary');return {data:{id:'p'}};});
    const {store,post,api}=setup({KLAVIYO_PRIVATE_API_KEY:'mock',KLAVIYO_LIST_ID:'quiz',KLAVIYO_MASTER_LIST_ID:'master'},request);
    const e=input();await post('profile',e);await api.flush();
    expect(store.attempt(e.attempt_id).is_new_lead).toBe(1);
    expect(request.mock.calls.some(c=>c[0]==='profile-subscription-bulk-create-jobs')).toBe(false);
    fail=false;store.db.prepare('UPDATE profile_jobs SET next_try=0').run();await api.flush();
    expect(request.mock.calls.filter(c=>c[0].startsWith('profiles?'))).toHaveLength(1);
    const calls=request.mock.calls.map(c=>c[0]);
    expect(calls.indexOf('events')).toBeGreaterThan(calls.indexOf('profile-subscription-bulk-create-jobs'));
    expect(store.attempt(e.attempt_id).is_new_lead).toBe(1);
    expect(store.db.prepare("SELECT * FROM events WHERE event_name='Quiz Completed'").all()).toHaveLength(1);
  });
  it('a failed lookup persists NULL and review flag, retaining a recoverable profile job',async()=>{
    const request=vi.fn(async()=>{throw Error('offline');});
    const {store,post,api}=setup({KLAVIYO_PRIVATE_API_KEY:'mock',KLAVIYO_LIST_ID:'quiz',KLAVIYO_MASTER_LIST_ID:'master'},request);
    const e=input();await post('profile',e);await api.flush();
    expect(store.attempt(e.attempt_id)).toMatchObject({email_captured:1,is_new_lead:null,needs_review:1});
    expect(store.db.prepare('SELECT * FROM profile_jobs').all()).toHaveLength(1);
  });
});
describe('Klaviyo workbook contract',()=>{
  it('normalizes emails, omits absent dates, enforces source enums and cart attribution',()=>{
    const e=input('ezclassic');const normalized=normalizeProfile({...e,properties:{...e.properties,box_system:'ezclassic',panel_height:'standard',windowed:false,dob:null,due_date:'2026-11-22',breed:'not_listed',breed_free_text:'bernedoodle f1b',recommended_cart_url:'https://www.ezwhelp.com/cart/123:1'}});
    expect(normalized.email).toBe('breeder@example.com');
    expect(normalized.properties).toMatchObject({source:'quiz_ezclassic_single_box',consent_source:'quiz_ezclassic_single_box',panel_height:'standard',windowed:false,breed_unresolved:true,breed_free_text:'bernedoodle f1b'});
    expect(normalized.properties).not.toHaveProperty('dob');expect(normalized.properties).not.toHaveProperty('breed');
    expect(new URL(normalized.properties.recommended_cart_url).searchParams.get('attributes[attempt_id]')).toBe(e.attempt_id);
  });
  it('rejects wrong enums and invalid dates before writes',()=>{
    const e=input();expect(()=>normalizeProfile({...e,properties:{...e.properties,panel_height:21.4}})).toThrow();
    expect(()=>normalizeProfile({...e,properties:{...e.properties,dob:'2026-02-30'}})).toThrow();
    expect(()=>normalizeProfile({...e,properties:{...e.properties,dob:'2099-01-01'}})).toThrow();
  });
  it('observes Shopify independently before the profile write',async()=>{
    const sequence:string[]=[];const request=vi.fn(async(path:string)=>{sequence.push(path.split('?')[0]);return path.startsWith('profiles?')?{data:[]}:{data:{id:'p'}};});
    const result=await saveProfile(normalizeProfile(input()),request,'quiz',{lookupCustomer:async()=>{sequence.push('shopify');return true;},listIds:['master']});
    expect(sequence.slice(0,3)).toEqual(['profiles','shopify','profile-import']);
    expect(result.properties).toMatchObject({is_new_lead:true,was_existing_customer:true});
  });
});
