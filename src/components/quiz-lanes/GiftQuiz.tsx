import { useEffect, useRef, useState } from 'react';
import { giftPad, giftSizes, mergeCart, product, products, Size, System } from '@/lib/quiz-lanes/engine';
import { track, useLaneEvents, useLiveProducts } from '@/lib/quiz-lanes/client';
import { Cart, useCart } from './Cart';
import { money, ProductRow, Shell } from './Shared';
export default function GiftQuiz(){
  const [cart,setCart]=useCart('gift');const [system,setSystem]=useState<System>('ezclassic');const [size,setSize]=useState<Size|''>('');const [done,setDone]=useState(false);
  const cards=products.filter(p=>p.handle==='gift-card');const pad=size?giftPad(system,size):undefined;
  const {live,loading,retry}=useLiveProducts([...cards.map(p=>p.key),'WhelpKit',...(pad?[pad]:[]),...cart.map(r=>r.key)]);
  const itemCount=cart.reduce((sum,r)=>sum+r.quantity,0);
  const cartValue=cart.every(r=>live[r.key]?.price!=null)?cart.reduce((sum,r)=>sum+live[r.key].price!*r.quantity,0)/100:null;
  useLaneEvents('gift',{item_count:itemCount,cart_value:cartValue},done);
  const loggedFailures=useRef(new Set<string>());
  useEffect(()=>{if(loading)return;for(const row of cart){const resolved=live[row.key];if((!resolved||resolved.error||resolved.price==null||!/^\d+$/.test(resolved.variantId))&&!loggedFailures.current.has(row.key)){loggedFailures.current.add(row.key);track('gift','gift_variant_unresolved',{item:product(row.key)?.title||row.key,sku:product(row.key)?.sku});}}},[cart,live,loading]);
  const add=(key:string)=>{
    const item=product(key);const resolved=live[key];
    if(!item?.sku){console.warn('[gift-quiz] Add blocked: missing SKU',key);track('gift','gift_add_blocked',{item:key,reason:'missing_sku'});return;}
    if(!resolved?.available||resolved.price==null||resolved.price<=0||!/^\d+$/.test(resolved.variantId)){
      console.warn('[gift-quiz] Add blocked: variant unavailable or unresolved',key);track('gift','gift_add_blocked',{item:item.title,sku:item.sku,reason:'variant_unresolved'});return;
    }
    setCart(old=>mergeCart(old,{key,quantity:1}));
    track('gift',key.startsWith('GiftCard')?'gift_card_added':'gift_physical_added',{sku:resolved.sku,variant_id:resolved.variantId,...(key.startsWith('GiftCard')?{denomination:resolved.price/100}:{})});
  };
  const sizes=giftSizes[system];const padProduct=pad?product(pad):undefined;
  return <Shell lane="gift" wide><h1>A thoughtful gift, made easy.</h1><p className="lane-muted">Gift cards always fit. No quiz or email needed.</p><h2>Let them choose</h2><div className="lane-gift-cards">{cards.map(card=>{const item=live[card.key];const ready=!!card.sku&&!!item?.available&&item.price!==null&&/^\d+$/.test(item.variantId);return <button key={card.key} disabled={!ready} onClick={()=>add(card.key)}><span>EZwhelp gift card</span><strong>{item?.price!=null?money(item.price):item?.error?'Price unavailable':'Checking price…'}</strong><small>{item?.error?'Unavailable':!item?.available&&item?.price!==null?'Out of stock':ready?'Add gift card':'Checking availability…'}</small></button>;})}</div><h2>A gift for any breeder</h2><ProductRow offer={{key:'WhelpKit',quantity:1,selected:false,category:'kit'}} live={live.WhelpKit} onAdd={()=>add('WhelpKit')}/><h2>Know their box size? <small>Optional</small></h2><p className="lane-muted">Choose their box type and size to find a matching pad. No size is needed for a gift card or Whelping Kit.</p><div className="lane-chips">{(['ezclassic','fab'] as System[]).map(s=><button key={s} aria-pressed={s===system} onClick={()=>{setSystem(s);setSize('');}}>{s==='fab'?'Fab System':'EZclassic'}</button>)}</div><div className="lane-chips">{sizes.map(s=><button key={s} aria-pressed={s===size} onClick={()=>{setSize(s);track('gift','gift_size_chip',{size:`${system}:${s}`});}}>{s}</button>)}</div>{size&&padProduct&&<ProductRow offer={{key:pad!,quantity:1,selected:false,category:'pad'}} live={live[pad!]} onAdd={()=>add(pad!)}/>}{size&&!padProduct&&<p className="lane-notice" role="status">We could not find a matching pad for {system==='fab'?'Fab System':'EZclassic'} {size}. Choose another size or select a gift card.</p>}<button className="lane-link" disabled={loading} onClick={retry}>Refresh availability</button><Cart lane="gift" lines={cart} live={live} setLines={setCart} onCheckout={()=>setDone(true)}/></Shell>;
}
