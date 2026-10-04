import { useEffect, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Lane, LiveProduct, product } from './engine';

export interface StoreProduct {handle:string;variants:{id:string;price:number;available:boolean;title:string;sku:string|null}[]}
export async function loadProduct(handle:string):Promise<StoreProduct> {
  const r=await fetch(`/api/quiz-lanes/products/${encodeURIComponent(handle)}`,{signal:AbortSignal.timeout(20000)});
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
function session(){try{let id=sessionStorage.getItem('ezw-lanes-session');if(!id){id=crypto.randomUUID();sessionStorage.setItem('ezw-lanes-session',id);}return id;}catch{return 'anonymous-session';}}
export function track(lane:Lane,event:string,properties:Record<string,unknown>={},email?:string){
  // A failed delivery is not reported as success. No personal data is logged or persisted locally.
  const payload={lane,event,properties,session:session(),id:crypto.randomUUID(),...(email&&lane!=='gift'?{email}:{})};
  void fetch('/api/quiz-lanes/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).then(r=>{if(!r.ok)window.dispatchEvent(new CustomEvent('quiz-tracking-unavailable'));}).catch(()=>window.dispatchEvent(new CustomEvent('quiz-tracking-unavailable')));
}
export async function submitProfile(lane:Lane,email:string,properties:Record<string,unknown>){
  if(lane==='gift')throw Error('Gift shopping does not collect an email.');
  const r=await fetch('/api/quiz-lanes/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lane,email,properties}),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('We could not save your email for follow-up. You can still use your results and checkout.');
}
export function useLaneEvents(lane:Lane,state:Record<string,unknown>,finished:boolean){
  const latest=useRef({state,finished});latest.current={state,finished};
  useEffect(()=>{
    track(lane,lane==='gift'?'Gift Started':lane==='restock'?'Restock Started':lane==='upgrade'?'Upgrade Started':'Quiz Started',{quiz_version:'2',system:lane});
    const abandoned=()=>{if(!latest.current.finished)track(lane,lane==='gift'?'Gift Abandoned':lane==='restock'?'Restock Abandoned':lane==='upgrade'?'Upgrade Abandoned':'Quiz Abandoned',latest.current.state);};
    window.addEventListener('pagehide',abandoned);return()=>{window.removeEventListener('pagehide',abandoned);abandoned();};
  },[lane]);
}
