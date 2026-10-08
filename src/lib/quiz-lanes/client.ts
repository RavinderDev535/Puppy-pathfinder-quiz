const LANE_API = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/quiz/lanes`;
import { useEffect, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import { CartLine, cartUrl, Lane, LiveProduct, product } from './engine';
import { identity, quizVersion, resetLaneAttempt, sources } from './identity';

export interface StoreProduct {handle:string;variants:{id:string;price:number;available:boolean;title:string;sku:string|null}[]}
export async function loadProduct(handle:string):Promise<StoreProduct> {
  const r=await fetch(`${LANE_API}/products/${encodeURIComponent(handle)}`,{signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('Unable to confirm price and availability.');return r.json();
}
export function useLiveProducts(keys:string[]) {
  const handles=[...new Set(keys.map(key=>product(key)?.handle).filter((v):v is string=>!!v))].sort();
  const queries=useQueries({queries:handles.map(handle=>({queryKey:['lane-product',handle],queryFn:()=>loadProduct(handle),staleTime:30000,retry:1}))});
  const live:Record<string,LiveProduct>={};
  for(const key of keys){const seed=product(key);if(!seed)continue;const query=queries[handles.indexOf(seed.handle)];const v=query.data?.variants.find(v=>v.id===seed.variantId);
    live[key]={...seed,price:v&&Number.isFinite(v.price)&&v.price>0?v.price:null,available:v?.available===true,error:query.isError||query.isSuccess&&!v?'Unable to confirm this product.':undefined};
  }
  return {live,loading:queries.some(q=>q.isLoading),retry:()=>queries.forEach(q=>void q.refetch())};
}
const stepTimes = new Map<string,number>();
export function track(lane:Lane,event:string,properties:Record<string,unknown>={},_email?:string,run=identity(lane)){
  // A failed delivery is not reported as success. No personal data is logged or persisted locally.
  if(event==='Quiz Step Completed') {
    properties={...properties,ms_spent:properties.ms_spent??Math.max(0,Date.now()-(stepTimes.get(run.attempt_id)||Date.parse(run.started_at)))};
    stepTimes.set(run.attempt_id,Date.now());
  }
  const payload={lane,event,properties:{...properties,source:sources[lane],quiz_version:quizVersion,attempt_id:run.attempt_id},...run,context:run,ts:new Date().toISOString(),id:crypto.randomUUID()};
  return fetch(`${LANE_API}/events`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).then(r=>{if(!r.ok)throw Error('Tracking unavailable');return true;}).catch(()=>{window.dispatchEvent(new CustomEvent('quiz-tracking-unavailable'));return false;});
}
export async function submitProfile(lane:Lane,email:string,properties:Record<string,unknown>){
  if(lane==='gift')throw Error('Gift shopping does not collect an email.');
  const run=identity(lane);
  const r=await fetch(`${LANE_API}/profile`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lane,email:email.trim().toLowerCase(),properties,...run,context:run,ts:new Date().toISOString()}),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('We could not save your email for follow-up. You can still use your results and checkout.');
  return r.json();
}
export function recommendation(lane:Lane,lines:CartLine[],live:Record<string,LiveProduct>,properties:Record<string,unknown>={},cartLines=lines) {
  return { ...properties,recommended_skus:lines.map(r=>product(r.key)?.sku).filter(Boolean),
    recommended_variant_ids:lines.map(r=>product(r.key)?.variantId).filter(Boolean),
    quantities:lines.map(r=>r.quantity),cart_url:cartUrl(cartLines,live,lane),
    cart_value:cartLines.every(r=>live[r.key]?.price!=null)?cartLines.reduce((n,r)=>n+live[r.key].price!*r.quantity,0)/100:null };
}
export function useRecommendation(lane:Lane,ready:boolean,lines:CartLine[],live:Record<string,LiveProduct>,properties:Record<string,unknown>={},cartLines=lines) {
  const snapshot=JSON.stringify(recommendation(lane,lines,live,properties,cartLines));
  const last=useRef('');
  useEffect(()=>{if(ready&&last.current!==snapshot){last.current=snapshot;void track(lane,'recommendation_shown',JSON.parse(snapshot));}},[lane,ready,snapshot]);
}
export function useShownEvent(lane:Lane,event:string,shown:boolean,properties:Record<string,unknown>={}) {
  const snapshot=JSON.stringify(properties),last=useRef('');
  useEffect(()=>{if(!shown){last.current='';return;}if(last.current===snapshot)return;last.current=snapshot;void track(lane,event,JSON.parse(snapshot));},[lane,event,shown,snapshot]);
}
export function useLaneEvents(lane:Lane,state:Record<string,unknown>,finished:boolean){
  const latest=useRef({state,finished});latest.current={state,finished};
  const generation=useRef(0);
  const run=identity(lane);
  useEffect(()=>{
    const current=++generation.current;
    let exited=false;
    void track(lane,'door_select',{lane});
    void track(lane,lane==='gift'?'Gift Started':lane==='restock'?'Restock Started':'Quiz Started');
    const abandoned=()=>{if(exited||latest.current.finished)return;exited=true;void track(lane,lane==='gift'?'Gift Abandoned':lane==='restock'?'Restock Abandoned':'Quiz Abandoned',{...latest.current.state,last_step_name:latest.current.state.last_step,last_step_number:latest.current.state.step_number},undefined,run);};
    window.addEventListener('pagehide',abandoned);return()=>{
      window.removeEventListener('pagehide',abandoned);
      // Defer cleanup so React StrictMode's effect replay does not create an exit.
      queueMicrotask(()=>{if(generation.current===current){abandoned();if(identity(lane).attempt_id===run.attempt_id)resetLaneAttempt(lane);}});
    };
  },[lane,run.attempt_id]);
}
