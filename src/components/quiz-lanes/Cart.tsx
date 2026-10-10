import { useEffect, useState } from 'react';
import { CartLine, cartUrl, Lane, LiveProduct, product, requiredBox, products, Size, validateCart } from '@/lib/quiz-lanes/engine';
import { loadProduct, submitProfile, track } from '@/lib/quiz-lanes/client';
import { consentCopy, money } from './Shared';

export function useCart(lane:Lane){
  const [cart,setCart]=useState<CartLine[]>(()=>{try{const saved=JSON.parse(localStorage.getItem(`ezw-cart-${lane}`)||'[]');return Array.isArray(saved)?saved.filter(r=>typeof r?.key==='string'&&!!product(r.key)&&Number.isInteger(r.quantity)&&r.quantity>0&&r.quantity<=99):[];}catch{return [];}});
  useEffect(()=>{try{localStorage.setItem(`ezw-cart-${lane}`,JSON.stringify(cart));}catch{/* Shopping still works without storage. */}},[cart,lane]);
  return [cart,setCart] as const;
}
export function normalizeFabRails(cart:CartLine[]):CartLine[]{
  const result=cart.map(row=>({...row}));
  for(const size of ['3x3','4x4','4x6','7x6'] as Size[]){
    const [box,rail]=requiredBox({system:'fab',size,height:'standard',windowed:false});
    const count=cart.filter(r=>r.key===box.key).reduce((sum,r)=>sum+r.quantity,0);
    const existing=result.find(r=>r.key===rail.key);
    if(count&&(!existing||existing.quantity<count)){if(existing)existing.quantity=count;else result.push({key:rail.key,quantity:count,owner:`Fab ${size}`});}
  }return result;
}
export function Cart({lane,lines,live,setLines,email,properties={},content='recommended',onCheckout}:{lane:Lane;lines:CartLine[];live:Record<string,LiveProduct>;setLines?:(rows:CartLine[])=>void;email?:string;properties?:Record<string,unknown>;content?:string;onCheckout?:()=>void}){
  const [open,setOpen]=useState(false);const [emailStep,setEmailStep]=useState(false);const [address,setAddress]=useState(email||'');
  const [reminder,setReminder]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [profileFailed,setProfileFailed]=useState(false);
  const errors=validateCart(lines,live);const total=lines.reduce((sum,r)=>sum+(live[r.key]?.price||0)*r.quantity,0);
  const known=lines.every(r=>live[r.key]?.price!=null);const url=cartUrl(lines,live,lane,content);
  const quantity=lines.reduce((sum,r)=>sum+r.quantity,0);
  const lockedRail=(key:string)=>lines.some(r=>{const p=product(r.key);if(!p||p.handle!=='fab-system-whelping-box'&&p.handle!=='fab-system-whopper-box-7x6')return false;return ['3x3','4x4','4x6','7x6'].some(s=>r.key===`fab${s}`&&key===`FS_Rail${s}`);});
  const checkout=async(skipProfile=false)=>{
    setError('');if(!lines.length||!url)return;
    track(lane,'add_to_cart_click',{item_count:quantity});
    if((lane==='restock'||lane==='upgrade')&&!emailStep){setEmailStep(true);track(lane,'email_capture_click');return;}
    if(emailStep&&!/^\S+@\S+\.\S+$/.test(address.trim())){setError('Enter a valid email address.');return;}
    setBusy(true);
    try{
      // Re-resolve every selected item; never redirect with a partial or stale cart.
      const handles=[...new Set(lines.map(r=>product(r.key)!.handle))];
      const loaded=await Promise.all(handles.map(loadProduct));const fresh:Record<string,LiveProduct>={};
      for(const row of lines){const p=product(row.key)!;const v=loaded.find(x=>x.handle===p.handle)?.variants.find(v=>v.id===p.variantId);fresh[row.key]={...p,price:v?.price??null,available:v?.available===true};}
      const problems=validateCart(lines,fresh);if(problems.length)throw Error(problems.join(' '));
      const target=cartUrl(lines,fresh,lane,content);if(!target)throw Error('Please review your selections.');
      if((emailStep||email)&&!skipProfile){try{await submitProfile(lane,email||address,{...properties,recommended_cart_url:target,email_consent:true,consent_timestamp:new Date().toISOString(),consent_source:lane,...(lane==='restock'?{reminder_optin:reminder,last_restock_date:new Date().toISOString().slice(0,10),last_restock_skus:lines.map(r=>product(r.key)?.sku).filter(Boolean).join(',')}:{})});track(lane,lane==='restock'?'Restock Email Captured':lane==='upgrade'?'Upgrade Email Captured':'email_my_build',{email_consent:true,reminder_optin:reminder},address);}catch{setProfileFailed(true);throw Error('We could not save your email for follow-up. Retry, or continue to checkout without email follow-up.');}}
      const recorded=await track(lane,'Added to Cart',{variant_ids:lines.map(r=>fresh[r.key].variantId),quantities:lines.map(r=>r.quantity),cart_value:lines.reduce((s,r)=>s+fresh[r.key].price!*r.quantity,0)/100},email||address);
      if(!recorded)throw Error('We could not save your cart. Please retry checkout.');
      onCheckout?.();window.location.assign(target);
    }catch(e){setError(e instanceof Error?e.message:'Checkout is unavailable. Please retry.');}finally{setBusy(false);}
  };
  return <>
    {setLines&&open&&<section className="lane-cart-items" aria-label="Your cart"><h2>Your cart</h2>{lines.map(row=>{const p=product(row.key)!;return <div className="lane-cart-line" key={row.key}><div><strong>{p.title}</strong><p>{p.variant}</p><small>{row.owner}</small></div><label>Quantity<input type="number" aria-label={`Cart quantity for ${p.title}`} value={row.quantity} min={1} max={99} disabled={lockedRail(row.key)} onChange={e=>{const q=Number(e.target.value);if(q>0&&q<=99&&Number.isInteger(q))setLines(normalizeFabRails(lines.map(r=>r.key===row.key?{...r,quantity:q}:r)));}}/></label>{lockedRail(row.key)?<small>Required rails</small>:<button onClick={()=>setLines(lines.filter(r=>r.key!==row.key))}>Remove</button>}</div>;})}</section>}
    {emailStep&&lines.length>0&&<section className="lane-email"><h2>Where should we send your order?</h2><label htmlFor="checkout-email">Your email</label><input id="checkout-email" type="email" autoComplete="email" value={address} onChange={e=>setAddress(e.target.value)}/>{lane==='restock'&&<label className="lane-check"><input type="checkbox" checked={reminder} onChange={e=>setReminder(e.target.checked)}/>Remind me when I'm due for more pads</label>}<p>{consentCopy}</p></section>}
    {error&&<div className="lane-notice" role="alert">{error}{profileFailed&&<button disabled={busy} onClick={()=>void checkout(true)}>Continue without email follow-up</button>}</div>}
    {lines.length>0&&errors.length>0&&<div className="lane-notice" role="status">{errors.map(message=><p key={message}>{message}</p>)}<p><a href="mailto:customer_service@ezwhelp.com">Contact customer service for help with this setup.</a></p></div>}
    <footer className="lane-cart"><div><strong>{quantity?`${quantity} item${quantity===1?'':'s'}`:'Your cart is empty'}</strong><span>{quantity?(known?money(total):'Confirming prices…'):'Choose something to get started'}</span></div>{setLines&&<button onClick={()=>{setOpen(!open);if(!open)track(lane,'cart_open',{item_count:quantity});}} disabled={!lines.length}>{open?'Hide cart':'Review cart'}</button>}<button className="lane-primary" disabled={!url||busy} onClick={()=>void checkout()}>{busy?'Checking…':'Go to checkout'}</button></footer>
  </>;
}
