import data from './reference-data.json';
import { identity } from './identity';

export type Lane = 'ezclassic' | 'fab' | 'gift' | 'restock' | 'upgrade';
export type System = 'ezclassic' | 'fab';
export type Stage = 'preparing' | 'due_7' | 'born_0_3' | 'week_1_2' | 'week_3_plus';
export type Size = '28x28' | '38x38' | '48x48' | '48x76' | '3x3' | '4x4' | '4x6' | '7x6';
export type Litter = '1_3' | '4_6' | '7_9' | '10_plus';
export interface Owner { system: System; size: Size; height: 'standard' | 'tall'; windowed: boolean; rooms?: boolean }
export interface Answers { breed: string; breed_free_text?: string; weight: string; experience: string; stage: Stage; jumps: boolean; windowed: boolean; date: string; litter: Litter; email: string }
export interface Product { key: string; sku: string | null; variantId: string; handle: string; title: string; variant: string; image: string }
export interface Offer { key: string; quantity: number; selected: boolean; category: string; locked?: boolean; note?: string }
export interface LiveProduct extends Product { price: number | null; available: boolean; error?: string }
export interface CartLine { key: string; quantity: number; owner?: string }
interface Seed { sku?: string | null; variant?: string; title?: string; family?: string; badge?: string; gates?: {height?: string; footprint?: string[]; fab_panel?: string; system?: string} }
interface Footprint {
  pads: Record<string, Seed>; liner?: Seed; combo_liner?: Seed; spare_rail_kit?: Seed;
  rooms_standard?: {solid:Seed;windowed:Seed}; rooms_tall?: {solid:Seed;windowed:Seed};
  mess_hall_standard?: Seed; mess_hall_tall?: Seed; facilities_room?: {standard:Seed;tall:Seed};
  rail_2_0_required?: Seed; mesh_cover?: Seed; stack?: {kit:Seed}; panel_liners?: Record<string,Seed>;
  rooms?: {room:Seed;grommet_pad:Seed;bungees:Seed}[];
}
export const products: Product[] = data.products;
export const breeds = data.breeds.map(b => ({name:b.name,sizes:b.sizes as Size[]})).sort((a,b)=>a.name.localeCompare(b.name));
export const sizeOrder: Size[] = ['28x28','38x38','48x48','48x76'];
export const fabSizes: Size[] = ['3x3','4x4','4x6','7x6'];
export const stageLabels: Record<Stage,string> = {preparing:'Preparing',due_7:'Due in 7 days',born_0_3:'Born 0 to 3 days',week_1_2:'1 to 2 weeks',week_3_plus:'3 weeks or more'};
export const litterLabels: Record<Litter,string> = {'1_3':'1 to 3','4_6':'4 to 6','7_9':'7 to 9','10_plus':'10 or more'};
export const experienceLabels: Record<string,string> = {first:'First','1_2':'1 to 2','3_5':'3 to 5','6_plus':'6 or more'};
export const weightLabels: Record<string,string> = {under_16:'Under 16 lbs','16_40':'16 to 40 lbs','40_90':'40 to 90 lbs','90_plus':'90 lbs and over'};
export const titles: Record<Lane,string> = {fab:'Fab System Single Box',ezclassic:'EZclassic Single Box',gift:'Gift a breeder',restock:'Restock & repair',upgrade:'Upgrade my setup'};
export const campaigns: Record<Lane,string> = {fab:'fab_single_box',ezclassic:'ezclassic_single_box',gift:'gift_a_breeder',restock:'restock_repair',upgrade:'upgrade_setup'};
export function product(key: string) { return products.find(p=>p.key===key); }
export function footprint(owner: Pick<Owner,'system'|'size'>): Footprint {
  const map = owner.system === 'fab' ? data.compatibility.fab_footprint_map : data.compatibility.ezc_footprint_map;
  return (map as unknown as Record<string,Footprint>)[owner.size];
}
export function validSizes(system: System,height: string): Size[] { return system==='fab' ? fabSizes : height==='tall' ? sizeOrder.slice(1) : sizeOrder.slice(0,3); }
export function ownerLabel(o: Owner) {return `${o.system==='fab'?'Fab':'EZclassic'} ${o.size}${o.system==='ezclassic'?` · ${o.height==='tall'?'28':'18'} inch · ${o.windowed?'Windowed':'Solid'}`:''}`;}
export function resolveBreed(breed: string, weight: string): Size[] {
  if(breed==='not_listed') { const size=({under_16:'28x28','16_40':'38x38','40_90':'48x48','90_plus':'48x76'} as Record<string,Size>)[weight];return size?[size]:[]; }
  return breeds.find(b=>b.name.toLowerCase()===breed.toLowerCase())?.sizes || [];
}
export function resolveFab(breed: string,weight: string) {
  const ez = resolveBreed(breed,weight)[0];
  const size = ({'28x28':'3x3','38x38':'3x3','48x48':'4x4','48x76':'4x6'} as Partial<Record<Size,Size>>)[ez];
  return {size,noSmallEquivalent:ez==='28x28',seconds:size==='3x3'||size==='4x6'};
}
export function defaultLitter(breed: string,weight: string): Litter {
  if(['Great Dane','Mastiff','Neopolitan Mastiff','Neapolitan Mastiff'].includes(breed))return '10_plus';
  const size=resolveBreed(breed,weight)[0];return size==='28x28'?'1_3':size==='38x38'?'4_6':'7_9';
}
export const localToday = () => { const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const bornStage = (stage:Stage) => !['preparing','due_7'].includes(stage);
export function dateProperties(stage:Stage,date:string,today=localToday()) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('Choose a valid date.');
  if(bornStage(stage)&&date>today)throw Error('Date of birth cannot be in the future.');
  if(!bornStage(stage))return {due_date:date,dob:null,go_home_date:null,date_in_past:date<today};
  const go=new Date(`${date}T12:00:00Z`);go.setUTCDate(go.getUTCDate()+56);
  return {due_date:null,dob:date,go_home_date:go.toISOString().slice(0,10),date_in_past:false};
}
export function boxKey(owner:Owner): string {
  const list=data.boxes[owner.system].variants;
  const box=list.find(v=>v.footprint===owner.size && (owner.system==='fab'||('height' in v&&v.height===owner.height&&v.windowed===owner.windowed)));
  return box?.sku || `unresolved:box:${ownerLabel(owner)}`;
}
export function requiredBox(owner:Owner,quantity=1): Offer[] {
  const rows:Offer[]=[{key:boxKey(owner),quantity,selected:true,locked:true,category:'box'}];
  if(owner.system==='fab')rows.push({key:footprint(owner)?.rail_2_0_required?.sku || `unresolved:rails:${owner.size}`,quantity,selected:true,locked:true,category:'rails'});
  return rows;
}
const padQuantities:Record<Stage,number[]>={preparing:[1,1,2,2],due_7:[1,2,2,3],born_0_3:[2,2,3,4],week_1_2:[1,2,2,3],week_3_plus:[2,2,3,4]};
export function singleShelf(owner:Owner,a:Answers): Offer[] {
  const f=footprint(owner);if(!f)return [];
  const fab=owner.system==='fab';
  const room=fab?f.rooms?.find(r=>r.room.sku===`fab${owner.size}add`)?.room || f.rooms?.[0]?.room:(owner.height==='tall'?f.rooms_tall:f.rooms_standard)?.[owner.windowed?'windowed':'solid'];
  const pad=(key:string)=>f.pads[key]?.sku;
  const match:Record<string,string|undefined>={
    heat:fab?'hlcFBtall':'hlcCV3848',gray:pad('gray_paw'),quick:pad('quick_dry'),slip:pad('bw_slip_resistant'),
    traction:owner.size==='28x28'?pad('bw_slip_resistant'):owner.size==='38x38'?'TP3838':'TP4848',
    kit:'WhelpKit',seat:'cornerseat',liner:f.liner?.sku||undefined,combo:f.combo_liner?.sku||undefined,
    camera:'WiFi_Camera',door:owner.height==='tall'?'EZC-TALL-AcrylicDoor':'EZC_AcrylicDoor',room:room?.sku||undefined,
    mess:(owner.height==='tall'?f.mess_hall_tall:f.mess_hall_standard)?.sku||undefined,feeding:'EZC_FEED_2PACK',
    rod:'wfCornerRod760',cover:f.mesh_cover?.sku||undefined,stack:f.stack?.kit.sku||undefined,grommet:f.rooms?.find(r=>r.room.sku===room?.sku)?.grommet_pad.sku||undefined,
  };
  // The feed SKU is resolved from the verified product record, not constructed.
  match.feeding=products.find(p=>p.handle==='ezwhelp-puppy-feeding-station-modular-2-pack')?.key;
  const template:Record<Stage,string[]> = fab ? {
    preparing:['*heat','*gray','kit','seat'],due_7:['*heat','*gray','kit','seat'],born_0_3:['*heat','*gray','rod','cover'],
    week_1_2:['*gray','room','cover','stack'],week_3_plus:['*room','*gray','grommet','stack'],
  } : {preparing:['*heat','*slip','kit','liner','seat'],due_7:['*heat','*quick','kit','combo','seat'],born_0_3:['*heat','*quick','*slip','camera','door'],week_1_2:['*traction','*quick','room','camera'],week_3_plus:['*room','*quick','mess','feeding','traction']};
  const rows:Offer[]=template[a.stage].flatMap(entry=>{
    const kind=entry.replace('*','');const key=match[kind];if(!key)return [];
    // Fab's client matrix omits the heat combo entirely for experienced breeders
    // (3-5 and 6+ litters); keep it off the shelf rather than offering it unticked.
    if(fab&&kind==='heat'&&['3_5','6_plus'].includes(a.experience))return [];
    // The 6+ cases specify no pad line beyond the locked box and rails.
    if(fab&&['gray','quick','slip','traction'].includes(kind)&&a.experience==='6_plus')return [];
    const isPad=['gray','quick','slip','traction'].includes(kind);
    let selected=entry.startsWith('*');
    if(a.experience==='3_5')selected=isPad;
    if(a.experience==='6_plus')selected=false;
    if(fab&&a.jumps&&kind==='cover')selected=true;
    const quantity=isPad?padQuantities[a.stage][Object.keys(litterLabels).indexOf(a.litter)]*(kind==='quick'&&owner.size==='48x76'?2:1):1;
    return [{key,quantity,selected,category:isPad?'pad':kind}];
  });
  if(a.experience==='6_plus')rows.sort((a,b)=>Number(b.category==='room')-Number(a.category==='room'));
  return rows;
}
export function restockShelf(owner:Owner,tab:'refills'|'parts'):Offer[] {
  const f=footprint(owner);if(!f)return [];
  const raw=(tab==='parts'?data.restock.parts_tab:data.restock.consumables_tab)[owner.system] as Seed[];
  const rows:Offer[]=[];
  const add=(seed:Seed|undefined,category:string)=>{if(seed?.sku)rows.push({key:seed.sku,quantity:1,selected:false,category,note:seed.badge});};
  for(const seed of raw){
    const gates=seed.gates;
    if(gates?.height&&gates.height!==owner.height)continue;
    if(gates?.footprint&&!gates.footprint.includes(owner.size))continue;
    if(gates?.system&&!['universal',owner.system].includes(gates.system))continue;
    if(gates?.fab_panel&&gates.fab_panel!=='any'&&gates.fab_panel!==(owner.size==='3x3'?'3ft':owner.size==='7x6'?'none':'4ft'))continue;
    if(seed.sku==='4FRleg'&&owner.size==='3x3')continue;
    if(seed.family){
      if(seed.family==='matched_pads_all')Object.values(f.pads).forEach(s=>add(s,'pad'));
      if(seed.family==='matched_pads')add(f.pads.gray_paw,'pad');
      if(seed.family==='liner')add(f.liner,'liner');
      if(seed.family==='combo_liner')add(f.combo_liner,'liner');
      if(seed.family==='rail_kit')add(f.spare_rail_kit,'rails');
      if(seed.family==='mesh_cover')add(f.mesh_cover,'cover');
      if(seed.family==='panel_liners')Object.values(f.panel_liners||{}).forEach(s=>add(s,'liner'));
      if(seed.family==='grommet_and_bungees'&&owner.rooms)f.rooms?.forEach(r=>{add(r.grommet_pad,'pad');add(r.bungees,'parts');});
    }else add(seed,tab);
  }
  return [...new Map(rows.map(row=>[row.key,row])).values()];
}
export function giftPad(system:System,size:Size):string|undefined {const f=footprint({system,size});return f?.pads[system==='fab'?'gray_paw':'quick_dry']?.sku || undefined;}
export function sizeUpgrade(owner:Owner,breed:string,weight:string) {
  const ez=resolveBreed(breed,weight)[0];if(!ez)return {kind:'invalid' as const};
  const target=owner.system==='fab'?resolveFab(breed,weight).size!:ez;
  if(ez==='48x76')return {kind:'xl' as const,target};
  const order=owner.system==='fab'?fabSizes:sizeOrder;
  if(order.indexOf(owner.size)>=order.indexOf(target))return {kind:'reassurance' as const,target};
  const matrix=data.kits as Record<string,{kits:Seed[]}>;
  const candidates=matrix[`${owner.size}|${owner.height}|${owner.windowed?'win':'solid'}`]?.kits||[];
  const label=target==='48x76'?'48x76':target.split('x')[0];
  const seed=candidates.find(k=>k.variant?.endsWith(`to ${label} Box`));
  const kit=seed && products.find(p=>(seed.sku?p.sku===seed.sku:p.variant===seed.variant&&p.handle==='tall-ezclassic-size-up-kit'));
  return {kind:kit?'kit' as const:'box' as const,target,key:kit?.key};
}
export function spaceShelf(owner:Owner,litter:Litter):Offer[]{
  const f=footprint(owner);const rows:Offer[]=[];
  const add=(s:Seed|undefined,category:string,selected=false,quantity=1)=>{if(s?.sku)rows.push({key:s.sku,category,selected,quantity});};
  if(owner.system==='fab'){
    f.rooms?.forEach((r,i)=>{add(r.room,'room',i===0,litter==='10_plus'&&i===0?2:1);add(r.grommet_pad,'pad');add(r.bungees,'parts');});
    Object.values(f.panel_liners||{}).forEach(s=>add(s,'liner'));
  } else {
    add((owner.height==='tall'?f.rooms_tall:f.rooms_standard)?.[owner.windowed?'windowed':'solid'],'room',litter!=='10_plus');
    add(f.combo_liner,'liner');add(owner.height==='tall'?f.mess_hall_tall:f.mess_hall_standard,'mess',litter==='7_9');
    const facilities=products.find(p=>p.handle==='ezclassic-facilities-add-on-room'&&p.variant.toLowerCase().includes(owner.height==='tall'?'tall':'standard'));
    if(facilities)rows.push({key:facilities.key,category:'facilities',selected:litter==='10_plus',quantity:1,note:'A dedicated potty & care room, not a second whelping area.'});
  }
  return [...new Map(rows.map(row=>[row.key,row])).values()].sort((a,b)=>Number(b.selected)-Number(a.selected));
}
export function mergeCart(cart:CartLine[],line:CartLine):CartLine[]{
  if(!product(line.key)||!Number.isSafeInteger(line.quantity)||line.quantity<1)return cart;
  const old=cart.find(x=>x.key===line.key);
  return old?cart.map(x=>x.key===line.key?{...x,quantity:x.quantity+line.quantity,owner:x.owner===line.owner?x.owner:[x.owner,line.owner].filter(Boolean).join('; ')}:x):[...cart,line];
}
export function validateCart(cart:CartLine[],live:Record<string,LiveProduct>):string[] {
  const errors:string[]=[];
  for(const row of cart){const p=live[row.key];if(!p||!/^\d+$/.test(p.variantId)||p.price===null||p.price<=0||p.error)errors.push(`${product(row.key)?.title||row.key}: price or availability could not be confirmed.`);else if(!p.available)errors.push(`${p.title} ${p.variant}: out of stock.`);if(!Number.isSafeInteger(row.quantity)||row.quantity<1)errors.push('Choose a valid quantity.');
    const fab=data.boxes.fab.variants.find(b=>b.sku===row.key);
    if(fab){const rail=footprint({system:'fab',size:fab.footprint as Size}).rail_2_0_required?.sku;const q=cart.filter(r=>r.key===rail).reduce((sum,r)=>sum+r.quantity,0);if(q<row.quantity)errors.push(`Matching ${fab.footprint} Fab rails are required.`);}
  }
  return [...new Set(errors)];
}
export function cartUrl(cart:CartLine[],live:Record<string,LiveProduct>,lane:Lane,content='recommended'):string|null {
  if(!cart.length||validateCart(cart,live).length)return null;
  const ids=new Map<string,number>();cart.forEach(r=>ids.set(live[r.key].variantId,(ids.get(live[r.key].variantId)||0)+r.quantity));
  return `https://www.ezwhelp.com/cart/${[...ids].map(([id,q])=>`${id}:${q}`).join(',')}?${new URLSearchParams({'attributes[attempt_id]':identity(lane).attempt_id,utm_source:'quiz',utm_medium:['gift','restock','upgrade'].includes(lane)?lane:'recommendation',utm_campaign:campaigns[lane],utm_content:content})}`;
}

const bundleContents:Record<string,Record<string,number>>={
  starter:{box:1,pad:2,liner:1,heat:1},essential:{box:1,pad:2,liner:1,heat:1,kit:1,seat:1},
  play_yard:{box:1,pad:2,liner:1,room:2},pro:{box:1,pad:3,liner:1,heat:1,kit:1,seat:1,room:1,combo:1,feeding:1},
  condo:{box:1,pad:2,liner:1,heat:1,room:1,mess:1},elite:{box:1,pad:4,liner:1,heat:1,kit:1,seat:1,room:1,combo:1,feeding:2,door:1,camera:1},
};
export function bundleCandidates(owner:Owner){
  if(owner.system==='fab')return [];
  return Object.entries(data.bundles).flatMap(([name,bundle])=>bundle.variants.flatMap(v=>{
    const dimensions=v.size.match(/\d+/g)||[];const windowed='panel_option' in v&&v.panel_option?.toLowerCase().includes('window');
    if(`${dimensions[0]}x${dimensions[1]}`!==owner.size||v.size.toLowerCase().includes('tall')!==(owner.height==='tall')||!!windowed!==owner.windowed)return [];
    return [{name,key:v.sku,contents:bundleContents[name]}];
  }));
}
export function bestBundle(owner:Owner,offers:Offer[],live:Record<string,LiveProduct>){
  const selected=offers.filter(r=>r.selected);if(!selected.some(r=>!r.locked)||selected.some(r=>!live[r.key]?.available||!live[r.key]?.price))return null;
  const total=selected.reduce((sum,r)=>sum+live[r.key].price!*r.quantity,0);
  const needs:Record<string,number>={};
  for(const r of selected){const unit=r.category==='pad'&&/2.?pack/i.test(product(r.key)?.variant||'')?2:1;needs[r.category]=(needs[r.category]||0)+r.quantity*unit;}
  const matches=bundleCandidates(owner).flatMap(b=>{const p=live[b.key];if(!p?.available||!p.price||!b.contents||Object.entries(needs).some(([k,q])=>(b.contents[k]||0)<q)||p.price-total>total*.15)return [];return [{...b,price:p.price,difference:p.price-total,extras:Object.entries(b.contents).filter(([k,q])=>q>(needs[k]||0)).map(([k])=>k)}];});
  return matches.sort((a,b)=>a.difference-b.difference)[0]||null;
}
