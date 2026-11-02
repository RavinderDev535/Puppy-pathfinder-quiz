import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import BundleSlideshow from './BundleSlideshow';
import { computeFullResult } from '@/lib/structural-engine';
import { NewCustomerData } from '@/lib/types';
import { getBundleUrl, twoRoomCondoLink } from '@/lib/live-bundle-config';
import { loadProduct } from '@/lib/quiz-lanes/client';
import { trackBundleEvent } from '@/lib/quiz-tracking';
import { buildBundleCart, liveVariant } from '@/lib/bundle-cart';

type Props = {data:NewCustomerData;email:string;descriptions:Record<string,string>;includes:Record<string,string[]>;onRestart:()=>void;supportMessage?:string};
const money=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
export default function BundleResults({data,email,descriptions,includes,onRestart,supportMessage}:Props) {
  const pair=useMemo(()=>[computeFullResult(data),computeFullResult({...data,branchAnswer:!data.branchAnswer})],[data]);
  const [selected,setSelected]=useState(0);
  const [chosen,setChosen]=useState(false);
  const [checked,setChecked]=useState<string[]>([]);
  const [sticky,setSticky]=useState(false);
  const cards=useRef<HTMLDivElement>(null);
  const bar=useRef<HTMLDivElement>(null);
  const [barHeight,setBarHeight]=useState(180);
  const xl=data.damSize==='over_90';
  const urls=pair.map(r=>getBundleUrl(r.bundle,r.boxSize,r.panelHeight,xl,data.hasWindow));
  const handles=[...new Set([...urls,...pair.flatMap(r=>r.addOns.map(a=>a.url || ''))].map(url=>liveVariant(url)?.handle).filter((h):h is string=>!!h))].sort();
  const queries=useQueries({queries:handles.map(handle=>({queryKey:['lane-product',handle],queryFn:()=>loadProduct(handle),staleTime:30000,retry:1}))});
  const products=Object.fromEntries(handles.map((handle,i)=>[handle,queries[i].data]));
  const result=pair[selected];
  const lines=[{url:urls[selected],quantity:1},...result.addOns.filter(a=>checked.includes(a.url)).map(a=>({url:a.url,quantity:1}))];
  const cart=buildBundleCart(lines,products);
  const loading=queries.some(q=>q.isLoading);
  const condo=twoRoomCondoLink(pair[0].boxSize, data.panelHeight || pair[0].panelHeight,xl);
  const showCondo=xl || data.zones===2 || data.zones===3;
  useEffect(()=>{
    if(!cards.current || !('IntersectionObserver' in window))return;
    const observer=new IntersectionObserver(([entry])=>setSticky(!entry.isIntersecting && entry.boundingClientRect.bottom<=0));
    observer.observe(cards.current);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    if(!bar.current || !('ResizeObserver' in window))return;
    const observer=new ResizeObserver(([entry])=>setBarHeight(entry.target.getBoundingClientRect().height));
    observer.observe(bar.current);return()=>observer.disconnect();
  },[sticky]);
  function select(index:number) {
    if(chosen && selected===index)return;
    setSelected(index);setChosen(true);setChecked([]);
    trackBundleEvent('Bundle Card Clicked',{bundle_name:pair[index].bundle,card_position:index===0?'recommended':'alternative'},email);
  }
  const checkout=()=>{if(cart)trackBundleEvent('Added to Cart',{bundle_name:result.bundle,card_position:selected===0?'recommended':'alternative',variant_ids:cart.variantIds,quantities:cart.quantities,cart_value:cart.total/100},email);};
  const checkoutControl=()=>cart?<a href={cart.url} onClick={checkout} className="min-h-12 rounded-xl bg-primary text-primary-foreground font-bold px-5 flex items-center justify-center">Get bundle</a>:<p role="alert" className="text-sm">{loading?'Checking live prices…':'We could not confirm a selected item’s variant or price. Please try again.'}{!loading&&<button className="min-h-12 underline ml-2" onClick={()=>queries.forEach(q=>void q.refetch())}>Retry</button>}</p>;
  const strip=<aside className="border rounded-xl p-4 my-6 text-sm"><h3 className="font-bold">Two litters at the same time?</h3><p className="my-2">The Two Room Condo gives you two full whelping areas in one setup.</p><a className="inline-flex min-h-12 items-center border rounded-lg px-3 text-sm" href={condo.url} onClick={()=>trackBundleEvent('Two Room Condo Link Clicked',{two_room_condo_variant_id:condo.id},email)}>Shop the Two Room Condo →</a></aside>;
  return <section className="w-full max-w-3xl mx-auto px-4 pt-8" style={{paddingBottom:barHeight+32}}>
    <div ref={cards} className="grid md:grid-cols-2 gap-4">
      {pair.map((card,index)=><article key={card.bundle} onClick={()=>select(index)} className={`duo-card overflow-hidden text-left cursor-pointer ${chosen&&selected===index?'ring-2 ring-primary':''}`}>
        <BundleSlideshow bundle={card.bundle} boxSize={card.boxSize} panelHeight={card.panelHeight} alt={`${card.bundle} Bundle`}/>
        <div className="p-5"><div className="h-6 font-bold text-primary">{index===0?'Recommended':''}</div><h2 className="font-display font-black text-2xl">{card.bundle} Bundle</h2><p className="text-sm my-2">{xl?'48 × 76 × 28':`${card.boxSize} × ${card.boxSize} × ${card.panelHeight}`} inches</p><p className="text-sm">{descriptions[card.bundle]}</p><h3 className="font-bold mt-4">What's included</h3><ul className="text-sm space-y-1 mt-2">{includes[card.bundle]?.map(item=><li key={item}>✓ {item}</li>)}</ul><button type="button" aria-label={`Choose ${card.bundle} Bundle`} aria-pressed={chosen&&selected===index} className="font-bold mt-4 min-h-12 w-full border rounded-lg">{chosen&&selected===index?'Selected':'Choose this bundle'}</button></div>
      </article>)}
    </div>
    {data.containment==='active'&&result.panelHeight==='28'&&<p className="rounded-xl bg-blue-50 p-4 my-4 text-sm">Taller panels recommended for improved puppy safety and containment.</p>}
    {supportMessage&&<aside className="duo-card p-5 my-4"><h3 className="font-bold">Personalized Setup Support</h3><p>{supportMessage}</p></aside>}
    {!chosen&&showCondo&&strip}
    <div className="my-5 flex flex-wrap items-center justify-between gap-3"><p aria-live="polite" className="font-bold min-h-12 flex items-center">Total: {cart?money(cart.total):'—'}</p>{checkoutControl()}</div>
    {chosen&&<><h3 className="text-xl font-bold mt-6">Complete Your Setup</h3><p className="text-sm mb-4">Optional add-ons for your {result.bundle} Bundle</p>
    <div className="space-y-3">{result.addOns.map(addon=>{const v=liveVariant(addon.url);const product=v&&products[v.handle]?.variants.find(item=>item.id===v.id);return <label key={addon.url} className="duo-card p-4 flex items-center gap-4 min-h-12 cursor-pointer"><input type="checkbox" className="w-6 h-6" checked={checked.includes(addon.url)} onChange={e=>{setChosen(true);setChecked(prev=>e.target.checked?[...prev,addon.url]:prev.filter(url=>url!==addon.url));}}/><img src={addon.imageUrl} alt="" className="w-14 h-14 object-cover rounded-lg"/><span className="flex-1"><span className="block font-bold">{addon.name}</span><span className="text-sm">{addon.description}</span></span><span>{product?money(product.price):'Price unavailable'}</span></label>;})}</div>
    </>}
    {chosen&&showCondo&&strip}
    <button type="button" onClick={onRestart} className="min-h-12 my-6 underline">Start over</button>
    {sticky&&<div ref={bar} className="fixed bottom-0 inset-x-0 z-50 border-t bg-background shadow-lg" style={{paddingBottom:'env(safe-area-inset-bottom)'}}><div className="max-w-3xl mx-auto p-3 flex flex-wrap items-center gap-3"><div role="group" aria-label="Choose bundle" className="flex flex-1 gap-2">{pair.map((card,index)=><button key={card.bundle} type="button" aria-pressed={selected===index} onClick={()=>select(index)} className={`min-h-12 flex-1 px-3 rounded-lg border text-sm ${selected===index?'bg-primary text-primary-foreground':''}`}>{card.bundle}{index===0&&<span className="block text-xs">Recommended</span>}</button>)}</div><p aria-live="polite" className="min-h-12 flex items-center font-bold">{cart?money(cart.total):'—'}</p>{checkoutControl()}</div></div>}
  </section>;
}
