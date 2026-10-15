import { useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, RotateCcw, Search, LockKeyhole } from 'lucide-react';
import PuppyScene from '@/components/PuppyScene';
import ezwhelpLogo from '@/assets/ezwhelp-logo.png';
import { breeds, Lane, LiveProduct, Offer, Owner, ownerLabel, product, Size, titles, validSizes } from '@/lib/quiz-lanes/engine';

export const money=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
export const consentCopy="By entering your email you are opting in to receive emails from EZwhelp. You can unsubscribe at any time.";
export function Shell({lane,children,back,restart,progress,wide=false}:{lane:Lane;children:ReactNode;back?:()=>void;restart?:()=>void;progress?:number;wide?:boolean}){
  const progressPercent=progress===undefined?undefined:Math.round(Math.max(0,Math.min(1,progress))*100);
  return <section className={`reference-quiz-card lane-shell ${wide?'lane-wide':''}`}><div className="reference-quiz-panel lane-panel"><p className="lane-eyebrow">{titles[lane]}</p><div className="storybook-question-content lane-content">{children}</div><div className="quiz-navigation lane-navigation">{progress!==undefined&&<div className="lane-progress" role="progressbar" aria-label="Quiz progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent!} style={{backgroundSize:`${progressPercent}% 100%`}}/>}<nav className="reference-quiz-nav">{back?<button className="reference-back" onClick={back}><ArrowLeft size={16}/>Back</button>:<Link className="reference-back" to="/">All quizzes</Link>}<div className="reference-nav-right"><Link className="reference-home" to="/">⌂ Home</Link>{restart&&<button className="reference-restart" onClick={restart}>Restart</button>}</div></nav></div><div className="quiz-brand flex justify-center mt-1 md:mt-7 pb-0 md:pb-4"><a href="https://www.ezwhelp.com/" target="_blank" rel="noopener noreferrer"><img src={ezwhelpLogo} alt="EZWhelp" className="h-7 md:h-9 object-contain opacity-35"/></a></div></div><aside className="reference-scene-slot lane-scene"><PuppyScene/></aside></section>;
}
export function Choices({options,value,onChange}:{options:Record<string,string>;value?:string;onChange:(key:string)=>void}) {return <div className="lane-choices">{Object.entries(options).map(([key,label])=><button className={`duo-option ${key===value?'duo-option-selected':''}`} key={key} type="button" aria-pressed={key===value} onClick={()=>onChange(key)}><div className="font-display">{label}</div><Check size={18} aria-hidden="true" className={key===value?'':'invisible'}/></button>)}</div>;}
export function BreedPicker({value,onSelect}:{value:string;onSelect:(value:string,freeText?:string)=>void}){
  const id=useId();
  const results=useRef<HTMLDivElement>(null);
  const [query,setQuery]=useState(value==='not_listed'?'':value);
  const [open,setOpen]=useState(false);
  const search=query.trim().toLowerCase();
  const matches=search?breeds.filter(b=>b.name.toLowerCase().includes(search)):[];
  const showResults=open&&!!search;
  return <div className="lane-breed-picker" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}} onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);e.currentTarget.querySelector('input')?.focus();}}}>
    <label htmlFor={id}>Search her breed</label>
    <div className="lane-search">
      <Search size={18} aria-hidden="true"/>
      <input id={id} autoComplete="off" type="search" placeholder="Start typing the breed" value={query}
        aria-controls={showResults?`${id}-results`:undefined}
        onChange={e=>{setQuery(e.target.value);setOpen(true);}}
        onKeyDown={e=>{if(e.key==='ArrowDown'&&search){e.preventDefault();setOpen(true);requestAnimationFrame(()=>results.current?.querySelector('button')?.focus());}}}/>
    </div>
    {showResults&&<div ref={results} id={`${id}-results`} className="lane-breeds" role="region" aria-label="Breed suggestions">
      {matches.map(b=><button type="button" key={b.name} onClick={()=>{setQuery(b.name);setOpen(false);onSelect(b.name);}}>{b.name}<ArrowLeft size={16} aria-hidden="true"/></button>)}
      {!matches.length&&<p role="status">No matching breed. Choose the weight option below.</p>}
    </div>}
    <button className="lane-fallback" type="button" onClick={()=>{setOpen(false);onSelect('not_listed',query);}}><strong>My breed is not listed</strong><small>Pick her weight range instead</small></button>
  </div>;
}
export function OwnerPicker({initial,onSelect}:{initial?:Owner;onSelect:(owner:Owner)=>void}){
  const [kind,setKind]=useState(initial?initial.system==='fab'?'fab':initial.height:'');
  const [size,setSize]=useState<Size|''>(initial?.size||'');
  const [windowed,setWindowed]=useState(initial?.windowed||false);
  const system=kind==='fab'?'fab':'ezclassic';const height=kind==='tall'?'tall':'standard';
  return <><h1>Which box is yours?</h1><Choices options={{standard:'EZclassic · Standard 18 inches',tall:'EZclassic · TALL 28 inches',fab:'Fab System'}} value={kind} onChange={v=>{setKind(v);setSize('');}}/>{kind&&<><h2>Box size</h2><div className="lane-chips">{validSizes(system,height).map(s=><button key={s} aria-pressed={s===size} onClick={()=>setSize(s)}>{s}{s==='7x6'?' Whopper':''}</button>)}</div>{system==='ezclassic'&&<label className="lane-check"><input type="checkbox" checked={windowed} onChange={e=>setWindowed(e.target.checked)}/>Windowed panels</label>}<button className="lane-primary" disabled={!size} onClick={()=>size&&onSelect({system,size,height,windowed:system==='ezclassic'&&windowed})}>Continue</button></>}<p className="lane-muted"><a href="mailto:customer_service@ezwhelp.com">Not sure which box? Send us a photo.</a></p></>;
}
export function ProductRow({offer,live,selected,onToggle,onQuantity,onAdd,context}:{offer:Offer;live?:LiveProduct;selected?:boolean;onToggle?:()=>void;onQuantity?:(q:number)=>void;onAdd?:()=>void;context?:string}){
  const p=live||product(offer.key);const ready=!!live&&/^\d+$/.test(live.variantId)&&live.price!==null&&live.price>0&&live.available&&!live.error;
  const stockLabel=live?.error?'Could not verify availability':live?.price==null?'Checking availability':!live.available?'Out of stock':live.inventoryQuantity!==null&&live.inventoryQuantity!==undefined&&live.inventoryQuantity<=5?`Low stock · ${live.inventoryQuantity} left`:'Available';
  return <article className={`lane-product ${offer.locked?'lane-locked':''}`} data-product-key={offer.key}>
    {p?.image&&<img src={p.image} alt="" loading="lazy"/>}<div className="lane-product-description"><h3>{p?.title||'Product unavailable'}</h3>{p?.variant&&<p>{p.variant}</p>}{context&&<small>{context}</small>}{offer.note&&<p>{offer.note}</p>}<div className="lane-product-meta"><strong>{live?.price!=null?money(live.price):'Price unavailable'}</strong><span className={`lane-stock-badge ${live?.available?'in-stock':live&&!live.error&&live.price!==null?'out-of-stock':'checking'} ${live?.available&&live.inventoryQuantity!==null&&live.inventoryQuantity!==undefined&&live.inventoryQuantity<=5?'low-stock':''}`} aria-label={stockLabel}>{stockLabel}</span></div>
    {offer.locked&&<p className="lane-lock"><LockKeyhole size={14}/>Required {offer.category==='rails'?'· sold separately':''}</p>}
    </div><div className="lane-product-actions">{onToggle&&!offer.locked&&<label className="lane-check"><input type="checkbox" checked={!!selected} disabled={!ready&&!selected} onChange={onToggle}/>Include</label>}{onQuantity&&<label className="lane-quantity">Quantity<input aria-label={`Quantity for ${p?.title||offer.key}`} type="number" min={1} max={99} value={offer.quantity} onChange={e=>{const q=Number(e.target.value);if(Number.isInteger(q)&&q>0&&q<=99)onQuantity(q);}}/></label>}{onAdd&&<button className="lane-primary" disabled={!ready} onClick={onAdd}>Add</button>}</div>
  </article>;
}
export function OwnerSummary({owner,change}:{owner:Owner;change:()=>void}){return <div className="lane-owner"><span>Shopping for your {ownerLabel(owner)}</span><button onClick={change}>Change box</button></div>;}
