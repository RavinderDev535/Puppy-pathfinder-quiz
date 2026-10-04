import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {products}=require('../src/lib/quiz-lanes/reference-data.json');
const handles=new Set(products.map(p=>p.handle));
const cache=new Map();
const lanes=new Set(['fab','ezclassic','restock','upgrade','gift']);
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
export async function saveProfile(input,request,listId){
  const query=new URLSearchParams({filter:`equals(email,${JSON.stringify(input.email)})`,'additional-fields[profile]':'subscriptions'});
  const existing=(await request(`profiles?${query}`)).data?.[0];
  const marketing=existing?.attributes?.subscriptions?.email?.marketing;
  const previous=existing?.attributes?.properties||{};
  const properties={...input.properties,consent_timestamp:previous.consent_timestamp||input.properties.consent_timestamp};
  // Suppressed or unsubscribed people keep their status. Never re-subscribe on a quiz repeat.
  const suppressed=marketing?.consent==='UNSUBSCRIBED'||(marketing?.suppression?.length||0)>0||(marketing?.list_suppressions?.length||0)>0;
  const saved=await request('profile-import','POST',{data:{type:'profile',attributes:{email:input.email,properties}}});
  if(!suppressed&&marketing?.consent!=='SUBSCRIBED')await request('profile-subscription-bulk-create-jobs','POST',{data:{type:'profile-subscription-bulk-create-job',attributes:{custom_source:input.lane,historical_import:false,profiles:{data:[{type:'profile',attributes:{email:input.email,subscriptions:{email:{marketing:{consent:'SUBSCRIBED'}}}}}]}},relationships:{list:{data:{type:'list',id:listId}}}}});
  else if(!suppressed)await request(`lists/${encodeURIComponent(listId)}/relationships/profiles`,'POST',{data:[{type:'profile',id:saved.data.id}]});
  return {saved:true,subscribed:!suppressed};
}
export function createQuizApi(env=process.env){
  async function klaviyo(path,method='GET',payload){
    const r=await fetch(`https://a.klaviyo.com/api/${path}`,{method,headers:{Authorization:`Klaviyo-API-Key ${env.KLAVIYO_PRIVATE_API_KEY}`,revision:'2025-10-15','Content-Type':'application/vnd.api+json',accept:'application/vnd.api+json'},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw Error(`Email service returned ${r.status}`);
    return r.status===204||r.status===202?{}:r.json();
  }
  return async function quizApi(req,res){
    const url=new URL(req.url,'http://localhost');
    if(!url.pathname.startsWith('/api/quiz-lanes/'))return false;
    try{
      if(url.pathname==='/api/quiz-lanes/status'&&req.method==='GET') {json(res,200,{email:!!(env.KLAVIYO_PRIVATE_API_KEY&&env.KLAVIYO_LIST_ID),analytics:!!env.KLAVIYO_PRIVATE_API_KEY});return true;}
      if(url.pathname.startsWith('/api/quiz-lanes/products/')&&req.method==='GET'){
        const handle=url.pathname.split('/').pop();if(!handles.has(handle)){json(res,404,{error:'Unknown product'});return true;}
        json(res,200,await shopify(handle));return true;
      }
      if(req.method!=='POST'){json(res,405,{error:'Method not allowed'});return true;}
      const origin=req.headers.origin;
      if(origin&&new URL(origin).host!==req.headers.host){json(res,403,{error:'Origin not allowed'});return true;}
      const input=await body(req);
      if(!lanes.has(input.lane)){json(res,400,{error:'Unknown quiz'});return true;}
      if(!env.KLAVIYO_PRIVATE_API_KEY){json(res,503,{error:'Email follow-up is currently unavailable.'});return true;}
      if(url.pathname==='/api/quiz-lanes/profile'){
        if(input.lane==='gift'||!env.KLAVIYO_LIST_ID||!/^\S+@\S+\.\S+$/.test(input.email||'')||input.email.length>254||input.properties?.email_consent!==true){json(res,400,{error:'Email and consent are required.'});return true;}
        json(res,200,await saveProfile(input,klaviyo,env.KLAVIYO_LIST_ID));return true;
      }
      if(url.pathname==='/api/quiz-lanes/events'){
        if(typeof input.event!=='string'||input.event.length>80||!/^[-a-zA-Z0-9_]{8,80}$/.test(input.session||'')){json(res,400,{error:'Invalid event'});return true;}
        // An external session ID supports anonymous gift events without an email/profile capture form.
        await klaviyo('events','POST',{data:{type:'event',attributes:{unique_id:input.id,properties:{...input.properties,quiz_name:input.lane,source:'quiz',system:input.lane==='fab'?'fab':input.properties?.system},metric:{data:{type:'metric',attributes:{name:input.event}}},profile:{data:{type:'profile',attributes:input.email&&input.lane!=='gift'?{email:input.email}:{external_id:`quiz-${input.session}`}}}}}});
        json(res,202,{accepted:true});return true;
      }
      json(res,404,{error:'Unknown endpoint'});
    }catch(error){console.error('[quiz-api]',error.message);json(res,502,{error:'The service is temporarily unavailable. Please try again.'});}
    return true;
  };
}
