import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { boxKey, defaultLitter, footprint, litterLabels, Litter, mergeCart, Offer, Owner, ownerLabel, product, requiredBox, Size, sizeUpgrade, spaceShelf, validSizes, weightLabels } from '@/lib/quiz-lanes/engine';
import { track, useLaneEvents, useLiveProducts, useRecommendation, useShownEvent } from '@/lib/quiz-lanes/client';
import { Cart, normalizeFabRails, useCart } from './Cart';
import { BreedPicker, Choices, money, OwnerPicker, OwnerSummary, ProductRow, Shell } from './Shared';

export default function UpgradeQuiz(){
  const [breedFreeText,setBreedFreeText]=useState('');
  const [owner,setOwner]=useState<Owner|null>(null);const [path,setPath]=useState('');const [step,setStep]=useState('owner');const [breed,setBreed]=useState('');const [weight,setWeight]=useState('');const [litter,setLitter]=useState<Litter>('4_6');const [areas,setAreas]=useState(2);const [different,setDifferent]=useState(false);const [nextSize,setNextSize]=useState<Size|null>(null);const [cart,setCart]=useCart('upgrade');const [changes,setChanges]=useState<Record<string,{selected?:boolean;quantity?:number}>>({});const [error,setError]=useState('');const [done,setDone]=useState(false);
  const target=owner&&path==='size'?sizeUpgrade(owner,breed,weight):null;
  const newOwner=owner?{...owner,size:nextSize||owner.size}:null;
  const kitInCart=cart.some(r=>/size-up-kit/.test(product(r.key)?.handle||''));
  const rows=useMemo(()=>{
    if(!owner||step!=='results')return [];
    let result:Offer[]=[];
    if(path==='size'&&target?.kind==='kit')result=[{key:target.key!,quantity:1,selected:true,category:'sizeup'}];
    if(path==='size'&&target?.kind==='box')result=requiredBox({...owner,size:target.target!});
    if(path==='space')result=spaceShelf(owner,litter);
    if(path==='program'){
      result=requiredBox(newOwner!,Math.max(1,areas-1));const stack=footprint(newOwner!)?.stack?.kit;
      if(owner.system==='fab'&&stack?.sku)result.push({key:stack.sku,quantity:1,selected:false,category:'stack',note:'Optional height extension only.'});
    }
    return result.filter(r=>!kitInCart||!['pad','liner'].includes(r.category)).map(r=>({...r,...changes[r.key]}));
  },[owner,step,path,breed,weight,litter,areas,nextSize,changes,kitInCart]);
  const compareKey=owner&&target?.kind==='kit'?boxKey({...owner,size:target.target!}):null;
  const {live,loading,retry}=useLiveProducts([...rows.map(r=>r.key),...cart.map(r=>r.key),...(compareKey?[compareKey]:[])]);
  useLaneEvents('upgrade',{last_step:step,upgrade_path:path,item_count:cart.length},done);
  useRecommendation('upgrade',step==='results'&&!loading,rows,live,{upgrade_path:path,breed,breed_free_text:breedFreeText},cart);
  useShownEvent('upgrade','reassurance_shown',step==='results'&&target?.kind==='reassurance',{owned_footprint:owner?.size,target_footprint:target?.target});
  useShownEvent('upgrade','sizeup_shown',step==='results'&&target?.kind==='kit',{target_footprint:target?.target});
  useShownEvent('upgrade','size_up_shown',step==='results'&&target?.kind==='box',{target_footprint:target?.target});
  useShownEvent('upgrade','sizeup_blocked',step==='results'&&target?.kind==='xl',{owned_footprint:owner?.size});
  useShownEvent('upgrade','whale_escape_shown',step==='results'&&path==='program'&&areas>=3,{program_qty:areas});
  const chooseOwner=(o:Owner)=>{setOwner(o);setChanges({});setNextSize(null);setStep('path');track('upgrade','picker_select',{...o,footprint:o.size});track('upgrade','Quiz Step Completed',{step_name:'owner',step_number:1,answer:o});};
  const choosePath=(value:string)=>{setPath(value);setChanges({});setError('');setStep(value==='size'?'breed':value==='space'?'litter':'areas');track('upgrade','upgrade_path',{path:value});track('upgrade','Quiz Step Completed',{step_name:'path',step_number:2,answer:value});};
  const chooseBreed=(value:string,freeText='')=>{setBreedFreeText(freeText);setBreed(value);track('upgrade','Quiz Step Completed',{step_name:'breed',step_number:3,answer:value,breed_free_text:freeText});setWeight('');setChanges({});setStep(value==='not_listed'?'weight':'results');if(value!=='not_listed')track('upgrade','new_dam_breed',{breed:value});};
  const back=()=>{setError('');setStep(step==='path'?'owner':step==='weight'?'breed':step==='results'?path==='size'?'breed':path==='space'?'litter':'areas':'path');};
  if(step==='owner'||!owner)return <Shell lane="upgrade"><OwnerPicker initial={owner||undefined} onSelect={chooseOwner}/></Shell>;
  if(step!=='results')return <Shell lane="upgrade" back={back} progress={step==='path'?.3:.65}>
    {step==='path'&&<><h2>What's growing?</h2><Choices options={{size:'A bigger mama is coming',space:'Bigger litters, we need room',program:'More litters at once'}} value={path} onChange={choosePath}/></>}
    {step==='breed'&&<><h2>Her breed</h2><BreedPicker value={breed} onSelect={chooseBreed}/></>}
    {step==='weight'&&<><h2>Her weight</h2><Choices options={weightLabels} value={weight} onChange={v=>{setWeight(v);track('upgrade','Quiz Step Completed',{step_name:'weight',step_number:4,answer:v});setStep('results');track('upgrade','new_dam_band',{band:v});}}/></>}
    {step==='litter'&&<><h2>How many puppies?</h2><Choices options={litterLabels} value={litter} onChange={v=>{setLitter(v as Litter);track('upgrade','Quiz Step Completed',{step_name:'litter',step_number:3,answer:v});setChanges({});setStep('results');track('upgrade','litter_size_selected',{band:v});}}/></>}
    {step==='areas'&&<><h2>How many areas?</h2><Choices options={{'2':'Two whelping areas','3':'Three whelping areas','4':'Four whelping areas'}} value={String(areas)} onChange={v=>{setAreas(Number(v));track('upgrade','Quiz Step Completed',{step_name:'areas',step_number:3,answer:Number(v)});setStep('results');setChanges({});}}/></>}
  </Shell>;
  if(target?.kind==='reassurance')return <Shell lane="upgrade" back={back}><h2>Her box already fits</h2><p>Your {ownerLabel(owner)} already covers the recommended {target.target} size for {breed==='not_listed'?'her weight':breed}.</p><Link className="lane-primary" to="/quiz?quiz=restock" >Restock your setup</Link></Shell>;
  if(target?.kind==='xl')return <Shell lane="upgrade" back={back}><h2>Plan her XL setup</h2><p>She needs an XL setup. Explore the 48x76 EZclassic with 28-inch panels, or ask us to plan the space with you.</p>{[false,true].map(windowed=>{const p=product(boxKey({system:'ezclassic',size:'48x76',height:'tall',windowed}));return p&&<a key={p.key} className="lane-fallback" href={`https://www.ezwhelp.com/products/${p.handle}?variant=${p.variantId}&entry=upgrade`}>{windowed?'Windowed':'Solid'} XL 48x76 box</a>;})}<a className="lane-primary" onClick={()=>track('upgrade','xl_support_routed')} href="mailto:customer_service@ezwhelp.com?subject=XL%20setup%20planning">Plan with our team</a></Shell>;
  const selected=rows.filter(r=>r.selected);const cannotAdd=selected.length===0||(path==='program'&&different&&!nextSize)||selected.some(r=>!live[r.key]?.available||!live[r.key]?.price);
  const add=()=>{
    if(cannotAdd)return;let next=cart;
    if(selected.some(r=>r.category==='sizeup'))next=next.filter(r=>!/pad|liner/i.test(product(r.key)?.title||''));
    for(const r of selected)next=mergeCart(next,{key:r.key,quantity:r.quantity,owner:ownerLabel(owner)});
    setCart(normalizeFabRails(next));track('upgrade',path==='program'?'another_box_added':'add_to_cart_click',{same_size:!different,sku:selected.map(r=>product(r.key)?.sku).filter(Boolean),variant_id:selected.map(r=>live[r.key].variantId),qty:selected.map(r=>r.quantity)});setError('Added to your cart.');
  };
  const missing=rows.filter(r=>!product(r.key));
  return <Shell lane="upgrade" wide back={back}><h1>{path==='size'&&target?.kind==='kit'?"You don't need a new box, grow this one.":path==='space'?'Room for growing puppies':'Grow your program'}</h1><OwnerSummary owner={owner} change={()=>setStep('owner')}/>
    {path==='size'&&owner.system==='fab'&&<p>Fab boxes don't convert, here's the next size up. Matching rails are included as a required purchase.</p>}
    {compareKey&&target?.key&&live[compareKey]?.price!=null&&live[target.key]?.price!=null&&<p className="lane-savings">Size-Up Kit: {money(live[target.key].price!)} · New box: {money(live[compareKey].price!)}.{live[compareKey].price!>live[target.key].price!?` Save ${money(live[compareKey].price!-live[target.key].price!)}.`:''} Includes the correctly sized pad and liner.</p>}
    {path==='space'&&<p>{litterLabels[litter]} puppies · {owner.system==='fab'&&owner.size==='3x3'?'Only 3x3 rooms fit this box; daisy-chaining other sizes is not supported.':'Choose the space and care areas that suit your litter.'}</p>}
    {path==='program'&&<><div className="lane-chips"><button aria-pressed={!different} onClick={()=>{setDifferent(false);setNextSize(null);setChanges({});}}>Another one like yours</button><button aria-pressed={different} onClick={()=>{setDifferent(true);setNextSize(null);}}>A different size</button></div>{different&&<><div className="lane-chips">{validSizes(owner.system,owner.height).filter(s=>s!==owner.size).map(s=><button key={s} aria-pressed={s===nextSize} onClick={()=>{setNextSize(s);setChanges({});}}>{s}</button>)}</div>{!nextSize&&<p className="lane-notice">Choose a different size to continue.</p>}</>}{areas===2&&<p className="lane-notice">The Second Whelping Area package is unavailable until its contents are confirmed. You can still add another box below.</p>}{areas>=3&&<aside className="lane-suggestion"><h2>Let's plan your space</h2><p>For {areas}+ whelping areas, our team can help with layout and care routines. You can also continue building below.</p><a href={`mailto:customer_service@ezwhelp.com?subject=Multi-area%20planning&body=${encodeURIComponent(`Owned box: ${ownerLabel(owner)}\nRequested areas: ${areas}+`)}`}>Ask for a planning session</a></aside>}{owner.system==='fab'&&['3x3','7x6'].includes(newOwner!.size)&&<p>No Stack Kit is available for this size. {newOwner!.size==='3x3'?'3x3 rooms only; no cross-size daisy chain.':'Contact us for Whopper expansion planning.'}</p>}</>}
    {missing.length>0&&<p className="lane-notice">Some parts of this setup could not be resolved: {missing.map(r=>r.key).join(', ')}. Contact customer service.</p>}
    {rows.map(row=><ProductRow key={row.key} offer={row} live={live[row.key]} selected={row.selected} onToggle={row.locked?undefined:()=>setChanges({...changes,[row.key]:{...changes[row.key],selected:!row.selected}})} onQuantity={row.locked?undefined:quantity=>setChanges({...changes,[row.key]:{...changes[row.key],quantity}})}/>)}
    <button className="lane-primary" disabled={cannotAdd} onClick={add}>Add selected items</button>{error&&<p role="status">{error}</p>}<button className="lane-link" disabled={loading} onClick={retry}>Refresh availability</button>
    <Cart lane="upgrade" lines={cart} live={live} setLines={setCart} content={path==='size'?(target?.kind==='kit'?'sizeup':'newbox'):path} properties={{box_system:owner.system,box_size:owner.size,has_box:true,...(owner.system==='ezclassic'?{panel_height:owner.height,windowed:owner.windowed}:{has_addon_rooms:!!owner.rooms}),upgrade_path:path,...(path==='size'?{breed,breed_unresolved:breed==='not_listed',breed_free_text:breedFreeText,size_band:weight}:{}),target_box_size:target?.target||nextSize||owner.size,...(path==='space'?{litter_size_band:litter}:{}),...(path==='program'?{program_qty:areas}:{})}} onCheckout={()=>setDone(true)}/>
  </Shell>;
}
