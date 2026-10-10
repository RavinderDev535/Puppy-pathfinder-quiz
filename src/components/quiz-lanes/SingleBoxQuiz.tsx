import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Answers, bestBundle, bornStage, boxKey, bundleCandidates, cartUrl, dateProperties, defaultLitter, experienceLabels, footprint, Lane, litterLabels, localToday, Offer, Owner, ownerLabel, product, requiredBox, resolveBreed, resolveFab, singleShelf, Size, stageLabels, weightLabels } from '@/lib/quiz-lanes/engine';
import { submitProfile, track, useLaneEvents, useLiveProducts, useRecommendation, useShownEvent } from '@/lib/quiz-lanes/client';
import { Cart } from './Cart';
import { BreedPicker, Choices, consentCopy, money, ProductRow, Shell } from './Shared';

import { resetLaneAttempt } from '@/lib/quiz-lanes/identity';

type SystemLane='fab'|'ezclassic';
const empty:Answers={breed:'',weight:'',experience:'',stage:'preparing',jumps:false,windowed:false,date:'',litter:'4_6',email:''};
export default function SingleBoxQuiz({system}:{system:SystemLane}){
  const [a,setA]=useState<Answers>(empty);const [step,setStep]=useState('breed');const [history,setHistory]=useState<string[]>([]);const [error,setError]=useState('');const [completedAt,setCompletedAt]=useState('');
  const fields=['breed',...(a.breed==='not_listed'?['weight']:[]),'experience','stage',system==='fab'?'jumps':'windowed','date','litter','email'];
  useLaneEvents(system,{last_step:step,step_number:history.length+1,system},step==='results');
  const stepStarted=useRef(Date.now());
  const advance=(value:unknown,freeText?:string)=>{
    setError('');let next={...a,[step]:value} as Answers;
    if(step==='breed'){next={...next,breed_free_text:freeText,weight:'',litter:defaultLitter(String(value),'')};}
    if(step==='weight')next.litter=defaultLitter('not_listed',String(value));
    if(step==='stage'&&value!==a.stage)next.date='';
    if(step==='date'){try{dateProperties(a.stage,String(value));}catch(e){setError((e as Error).message);return;}}
    if(step==='email'&&!/^\S+@\S+\.\S+$/.test(String(value))){setError('Enter a valid email address.');return;}
    setA(next);track(system,'Quiz Step Completed',{step_name:step,step_number:history.length+1,answer:step==='email'?'provided':value,...(step==='breed'&&freeText?{breed_free_text:freeText}:{}),ms_spent:Date.now()-stepStarted.current,system});stepStarted.current=Date.now();if(step==='litter')track(system,'litter_size_selected',{band:value});
    const order=['breed',...(next.breed==='not_listed'?['weight']:[]),'experience','stage',system==='fab'?'jumps':'windowed','date','litter','email','results'];
    setHistory([...history,step]);setStep(order[order.indexOf(step)+1]);if(step==='email')setCompletedAt(new Date().toISOString());
  };
  const back=()=>{setStep(history[history.length-1]);setHistory(history.slice(0,-1));setError('');};
  const restart=()=>{resetLaneAttempt(system);setA({...empty});setStep('breed');setHistory([]);setError('');setCompletedAt('');};
  if(step==='results')return <SingleResults key={JSON.stringify(a)} system={system} a={a} completedAt={completedAt} back={back} restart={restart}/>;
  const heading:Record<string,string>={breed:'Her breed',weight:'Her weight',experience:'Litters raised',stage:'Where you are',jumps:'Does she jump?',windowed:'Windowed panels?',date:bornStage(a.stage)?'Date of birth':'Due date',litter:'Litter size',email:'Your email'};
  return <Shell lane={system} back={history.length?back:undefined} restart={restart} progress={(fields.indexOf(step)+1)/fields.length}><h2 id="single-question">{heading[step]}</h2><p className="lane-muted">{step==='breed'?'We size everything around her.':'Choose the option that fits best.'}</p>
    {step==='breed'&&<BreedPicker key={a.breed} value={a.breed} onSelect={advance}/>}
    {step==='weight'&&<Choices options={weightLabels} value={a.weight} onChange={advance}/>}
    {step==='experience'&&<Choices options={experienceLabels} value={a.experience} onChange={advance}/>}
    {step==='stage'&&<Choices options={stageLabels} value={a.stage} onChange={advance}/>}
    {(step==='jumps'||step==='windowed')&&<><Choices options={{yes:'Yes',no:'No'}} value={a[step]?'yes':'no'} onChange={v=>advance(v==='yes')}/><p className="lane-muted">{step==='jumps'?'Fab walls are 21.4 inches. A compatible Stack Kit raises them if she tries to get out.':'Windowed panels let you see in without getting up.'}</p></>}
    {step==='date'&&<form onSubmit={e=>{e.preventDefault();advance(a.date);}}><input aria-labelledby="single-question" type="date" required max={bornStage(a.stage)?localToday():undefined} value={a.date} onChange={e=>setA({...a,date:e.target.value})}/><button className="lane-primary" type="submit">Next</button></form>}
    {step==='litter'&&<><Choices options={litterLabels} value={a.litter} onChange={advance}/><p className="lane-muted">{a.breed==='not_listed'?'Suggested for her weight':`Most ${a.breed} litters are`} {litterLabels[defaultLitter(a.breed,a.weight)]} puppies. You can change this.</p><button className="lane-primary" onClick={()=>advance(a.litter)}>Next</button></>}
    {step==='email'&&<form onSubmit={e=>{e.preventDefault();advance(a.email.trim());}}><input aria-labelledby="single-question" type="email" autoComplete="email" required placeholder="you@example.com" value={a.email} onChange={e=>setA({...a,email:e.target.value})}/><p className="lane-muted">{consentCopy}</p><button className="lane-primary" type="submit">See my setup</button></form>}
    {error&&<p role="alert" className="lane-notice">{error}</p>}
  </Shell>;
}

function SingleResults({system,a,completedAt,back,restart}:{system:SystemLane;a:Answers;completedAt:string;back:()=>void;restart:()=>void}){
  const fab=resolveFab(a.breed,a.weight);const choices=resolveBreed(a.breed,a.weight);
  const [size,setSize]=useState<Size>(system==='fab'?fab.size!:choices[0]);const [windowed,setWindowed]=useState(a.windowed);const [changes,setChanges]=useState<Record<string,{selected?:boolean;quantity?:number}>>({});const [bundle,setBundle]=useState<string|null>(null);const [acknowledged,setAcknowledged]=useState(false);const [profileError,setProfileError]=useState('');
  const owner:Owner={system,size,height:size==='48x76'?'tall':'standard',windowed};
  const locked=requiredBox(owner);const shelf=singleShelf(owner,a).map(row=>({...row,...changes[row.key]}));
  const stack=system==='fab'&&a.jumps?footprint(owner)?.stack?.kit:undefined;
  const stackOffer:Offer|undefined=stack?.sku?{key:stack.sku,category:'stack',quantity:changes[stack.sku]?.quantity||1,selected:changes[stack.sku]?.selected||false}:undefined;
  const offers=[...locked,...shelf,...(stackOffer&&!shelf.some(r=>r.key===stackOffer.key)?[stackOffer]:[])];
  const alternatives=system==='ezclassic'?[boxKey({...owner,windowed:!windowed})]:[];
  const candidates=bundleCandidates(owner);
  const keys=[...offers.map(r=>r.key),...alternatives,...candidates.map(c=>c.key),...(bundle?[bundle]:[])];
  const {live,loading,retry}=useLiveProducts(keys);const suggestion=bestBundle(owner,offers,live);
  const lines=bundle?[{key:bundle,quantity:1}]:offers.filter(r=>r.selected).map(({key,quantity})=>({key,quantity}));
  const url=cartUrl(lines,live,system,bundle?'bundle':windowed===a.windowed?'recommended':'alternative');
  const dates=dateProperties(a.stage,a.date);
  const properties={...dates,box_system:system,box_size:size,...(system==='ezclassic'?{panel_height:owner.height,windowed}:{has_addon_rooms:false}),breed:a.breed,breed_unresolved:a.breed==='not_listed',breed_free_text:a.breed_free_text,size_band:a.weight,is_xl:size==='48x76',experience:a.experience,stage:a.stage,litter_size_band:a.litter,jumps:a.jumps,source:system,email_consent:true,consent_timestamp:completedAt,consent_source:system,recommended_cart_url:url};
  const profileSent=useRef(false);
  const send=()=>{setProfileError('');void submitProfile(system,a.email,properties).catch(e=>setProfileError(e.message));};
  useRecommendation(system,!loading,[...offers,...alternatives.map(key=>({key,quantity:1})),...(bundle?[{key:bundle,quantity:1}]:[])],live,properties,lines);
  useShownEvent(system,'bundle_match_shown',!!suggestion&&!bundle,{bundle_name:suggestion?.name});
  useEffect(()=>{if(loading||profileSent.current||!url)return;profileSent.current=true;send();},[loading,url]);
  const setOffer=(row:Offer,update:{selected?:boolean;quantity?:number})=>{track(system,'toggle_change',{sku:product(row.key)?.sku,variant_id:product(row.key)?.variantId,...update});setBundle(null);setChanges(old=>({...old,[row.key]:{...old[row.key],...update}}));};
  const seconds=system==='fab'&&(size==='3x3'||size==='4x6');
  return <Shell lane={system} wide back={back} restart={restart}><h1>Your {system==='fab'?'Fab':'EZclassic'} setup</h1><p className="lane-summary">{a.breed==='not_listed'?weightLabels[a.weight]:a.breed} · {experienceLabels[a.experience]} litters · {stageLabels[a.stage]} · {system==='fab'?(a.jumps?'May jump':'Does not jump'):(a.windowed?'Windowed panels':'Solid panels')} · {bornStage(a.stage)?'Born':'Due'} {a.date} · {litterLabels[a.litter]} puppies</p>{dates.go_home_date&&<p>Go-home date: {dates.go_home_date}</p>}
    {system==='ezclassic'&&choices.length>1&&<section><h2>Choose her size</h2><div className="lane-chips">{choices.map(s=><button key={s} aria-pressed={s===size} onClick={()=>{setSize(s);setChanges({});setBundle(null);}}>{s}{s===choices[0]?' · Best fit':''}</button>)}</div><p className="lane-muted">Best fit for most {a.breed}. Pick the larger size for a bigger mama or litter.{choices.includes('48x76')?' The TALL 48x76 has 28-inch panels.':''}</p></section>}
    {system==='fab'&&<><p>Free standard shipping within the contiguous US</p><p>Designed for indoor use only</p>{seconds&&<div className="lane-notice"><p>This is a factory second. The 3-foot panels included with this size have minor damage to the powder-coat finish; the steel frame, mesh, liner, and function are unaffected. This item is sold as is and is non-returnable and non-refundable.</p><label className="lane-check"><input type="checkbox" checked={acknowledged} onChange={e=>setAcknowledged(e.target.checked)}/>I understand this is a non-returnable discounted second.</label></div>}{fab.noSmallEquivalent&&<p>The 3x3 is the smallest Fab box we make. For a closer fit, consider the <Link to="/quiz?quiz=ezclassic">EZclassic 28x28</Link>.</p>}</>}
    <div className={system==='ezclassic'?'lane-box-options':''}>{system==='ezclassic'?[a.windowed,!a.windowed].map((panels,i)=>{const key=boxKey({...owner,windowed:panels});return <section className="lane-box-card" key={key}><p>{i===0?'Recommended':'Alternative'}</p><ProductRow offer={{key,quantity:1,selected:panels===windowed,category:'box'}} live={live[key]}/><button className="lane-primary" aria-pressed={panels===windowed} disabled={!live[key]?.available} onClick={()=>{setWindowed(panels);setChanges({});setBundle(null);track(system,'Card Clicked',{selected_card:i===0?'recommended':'alternative'});}}>{panels===windowed?'Selected':`Choose ${panels?'windowed':'solid'}`}</button></section>;}):<ProductRow offer={locked[0]} live={live[locked[0].key]}/>}</div>
    {system==='fab'&&<><ProductRow offer={locked[1]} live={live[locked[1].key]}/><p className="lane-muted">Fab rails are sold separately and are required. They create the protective gap around the mother and puppies. Box and rails cannot be removed from this setup.</p></>}
    <h2>Suggested add-ons</h2>{shelf.map(row=><ProductRow key={row.key} offer={row} live={live[row.key]} selected={row.selected} onToggle={()=>setOffer(row,{selected:!row.selected})} onQuantity={quantity=>setOffer(row,{quantity})}/>)}
    {system==='fab'&&a.jumps&&<section className="lane-suggestion"><h2>She may get out</h2><p>Fab walls are 21.4 inches. A compatible Stack Kit adds a second tier.</p>{stackOffer?<ProductRow offer={stackOffer} live={live[stackOffer.key]} selected={changes[stackOffer.key]?.selected||false} onToggle={()=>setOffer(stackOffer,{selected:!changes[stackOffer.key]?.selected})}/>:<p>No Stack Kit is available for {size}. <a href="mailto:customer_service@ezwhelp.com">Contact us about containment options.</a></p>}</section>}
    {system==='ezclassic'&&suggestion&&!bundle&&<section className="lane-suggestion"><h2>{suggestion.difference<0?'Better value':'More included'}</h2><p>The {suggestion.name.replace('_',' ')} includes everything selected for {money(suggestion.price)}. {suggestion.difference<0?`Save ${money(-suggestion.difference)}.`:`${money(suggestion.difference)} more, with extras: ${suggestion.extras.join(', ')}.`}</p><button className="lane-primary" onClick={()=>{setBundle(suggestion.key);track(system,'Card Clicked',{selected_card:'bundle',bundle_name:suggestion.name});track(system,'bundle_match_accepted',{bundle_name:suggestion.name});}}>Choose this bundle</button></section>}
    {bundle&&<div className="lane-notice">Selected bundle: {product(bundle)?.title}. <button onClick={()=>setBundle(null)}>Return to individual items</button></div>}
    {profileError&&<p className="lane-notice" role="status">{profileError} <button onClick={send}>Retry saving email</button></p>}
    <button className="lane-link" disabled={loading} onClick={retry}>Refresh availability</button>
    {seconds&&!acknowledged?<p className="lane-notice">Please acknowledge the discounted-second notice above before checkout.</p>:<Cart lane={system} lines={lines} live={live} email={a.email} properties={properties} content={bundle?'bundle':windowed===a.windowed?'recommended':'alternative'}/>}
  </Shell>;
}
