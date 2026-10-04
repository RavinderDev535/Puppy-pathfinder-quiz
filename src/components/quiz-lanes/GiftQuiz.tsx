import { useState } from 'react';
import { giftPad, mergeCart, products, Size, System } from '@/lib/quiz-lanes/engine';
import { track, useLaneEvents, useLiveProducts } from '@/lib/quiz-lanes/client';
import { Cart, useCart } from './Cart';
import { money, ProductRow, Shell } from './Shared';

export default function GiftQuiz(){
  const [cart,setCart]=useCart('gift');const [system,setSystem]=useState<System>('ezclassic');const [size,setSize]=useState<Size|''>('');const [done,setDone]=useState(false);
  const cards=products.filter(p=>p.handle==='gift-card');const pad=size?giftPad(system,size):undefined;
  const {live,loading,retry}=useLiveProducts([...cards.map(p=>p.key),'WhelpKit',...(pad?[pad]:[]),...cart.map(r=>r.key)]);
  useLaneEvents('gift',{item_count:cart.reduce((sum,r)=>sum+r.quantity,0)},done);
  const add=(key:string)=>{if(!live[key]?.available||live[key]?.price==null)return;setCart(old=>mergeCart(old,{key,quantity:1}));track('gift',key.startsWith('GiftCard')?'gift_card_added':'gift_physical_added',{sku:live[key].sku,variant_id:live[key].variantId,denomination:live[key].price!/100});};
  return <Shell lane="gift" wide><h1>A thoughtful gift, made easy.</h1><p className="lane-muted">Gift cards always fit. No quiz or email needed.</p><h2>Let them choose</h2><div className="lane-gift-cards">{cards.map(p=><button key={p.key} disabled={!live[p.key]?.available||live[p.key]?.price==null} onClick={()=>add(p.key)}><span>EZwhelp gift card</span><strong>{live[p.key]?.price!=null?money(live[p.key].price!):p.variant}</strong><small>{live[p.key]?.price==null?'Checking availability…':live[p.key].available?'Add gift card':'Out of stock'}</small></button>)}</div><h2>A gift for any breeder</h2><ProductRow offer={{key:'WhelpKit',quantity:1,selected:false,category:'kit'}} live={live.WhelpKit} onAdd={()=>add('WhelpKit')}/><h2>Know their box size? <small>Optional</small></h2><p className="lane-muted">Find a pad that fits their box.</p><div className="lane-chips">{(['ezclassic','fab'] as System[]).map(s=><button key={s} aria-pressed={s===system} onClick={()=>{setSystem(s);setSize('');}}>{s==='fab'?'Fab System':'EZclassic'}</button>)}</div><div className="lane-chips">{(system==='fab'?['3x3','4x4','4x6']:['28x28','38x38','48x48','48x76']).map(s=><button key={s} aria-pressed={s===size} onClick={()=>{setSize(s as Size);track('gift','gift_size_chip',{size:`${system}:${s}`});}}>{s}</button>)}</div>{pad&&<ProductRow offer={{key:pad,quantity:1,selected:false,category:'pad'}} live={live[pad]} onAdd={()=>add(pad)}/>}<button className="lane-link" disabled={loading} onClick={retry}>Refresh availability</button><Cart lane="gift" lines={cart} live={live} setLines={setCart} onCheckout={()=>setDone(true)}/></Shell>;
}
