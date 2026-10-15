import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Answers, breeds, bundleCandidates, cartUrl, dateProperties, giftPad, giftSizes, mergeCart, Owner, product, products, requiredBox, resolveBreed, resolveFab, restockShelf, singleShelf, sizeUpgrade, validSizes } from '@/lib/quiz-lanes/engine';
import { normalizeFabRails } from '@/components/quiz-lanes/Cart';
import SingleBoxQuiz from '@/components/quiz-lanes/SingleBoxQuiz';
import RestockQuiz from '@/components/quiz-lanes/RestockQuiz';
import GiftQuiz from '@/components/quiz-lanes/GiftQuiz';
import UpgradeQuiz from '@/components/quiz-lanes/UpgradeQuiz';
import { track } from '@/lib/quiz-lanes/client';

vi.mock('@/components/PuppyScene',()=>({default:()=> <video data-testid="shared-video"/>}));
vi.mock('@/lib/quiz-lanes/client',()=>({track:vi.fn(),useLaneEvents:vi.fn(),useRecommendation:vi.fn(),useShownEvent:vi.fn(),submitProfile:vi.fn().mockResolvedValue(undefined),useLiveProducts:(keys:string[])=>({live:Object.fromEntries(keys.flatMap(key=>{const p=product(key);return p?[[key,{...p,price:10000,available:true}]]:[];})),loading:false,retry:vi.fn()})}));
afterEach(()=>{cleanup();localStorage.clear();});
const owner:Owner={system:'fab',size:'4x4',height:'standard',windowed:false};
const answers:Answers={breed:'Labrador Retriever',weight:'',experience:'first',stage:'preparing',jumps:false,windowed:false,date:'2026-10-04',litter:'4_6',email:'test@example.com'};
describe('five quiz rules',()=>{
  it('resolves all 177 supplied breeds to supported products',()=>{expect(breeds).toHaveLength(177);for(const b of breeds){expect(resolveBreed(b.name,'')).toEqual(b.sizes);expect(resolveFab(b.name,'').size).toBeTruthy();for(const size of b.sizes)expect(product(requiredBox({system:'ezclassic',size,height:size==='48x76'?'tall':'standard',windowed:false})[0].key)).toBeTruthy();}});
  it.each(['born_0_3','week_1_2','week_3_plus'] as const)('rejects future birth dates for %s',stage=>{expect(()=>dateProperties(stage,'2026-10-05','2026-10-04')).toThrow(/future/);expect(dateProperties(stage,'2026-10-04','2026-10-04').go_home_date).toBe('2026-11-29');});
  it('validates calendar dates and keeps past due dates',()=>{expect(()=>dateProperties('preparing','2026-02-30')).toThrow();expect(dateProperties('preparing','2026-10-01','2026-10-04').date_in_past).toBe(true);});
  it('preserves every restock configuration and maps each resolved row to a Shopify variant',()=>{expect(validSizes('ezclassic','tall')).toEqual(['38x38','48x48','48x76']);for(const system of ['fab','ezclassic'] as const)for(const height of ['standard','tall'] as const)for(const size of validSizes(system,height))for(const tab of ['refills','parts'] as const){const rows=restockShelf({system,height,size,windowed:false,rooms:true},tab);expect(rows.length).toBeGreaterThan(0);expect(new Set(rows.map(r=>r.key)).size).toBe(rows.length);for(const row of rows){const item=product(row.key);expect(item,row.key).toBeTruthy();expect(item!.variantId,`variant for ${row.key}`).toMatch(/^\d+$/);}}});
  it('maps all seven gift pads and nine gift cards to verified Shopify variants',()=>{
    expect(giftSizes.ezclassic).toEqual(['28x28','38x38','48x48','48x76']);
    expect(giftSizes.fab).toEqual(['3x3','4x4','4x6']);
    for(const system of ['fab','ezclassic'] as const)for(const size of giftSizes[system])expect(product(giftPad(system,size)!)?.variantId).toMatch(/^\d+$/);
    const cards=products.filter(p=>p.handle==='gift-card');expect(cards).toHaveLength(9);for(const card of cards)expect(card.variantId).toMatch(/^\d+$/);
    expect(product(giftPad('ezclassic','48x76')!)?.variant).toMatch(/Single Pack/i);
  });
  it('builds the gift Shopify cart permalink with gift attribution',()=>{
    const card=product('GiftCard50')!;const live={[card.key]:{...card,price:5000,available:true}};
    const url=new URL(cartUrl([{key:card.key,quantity:1}],live,'gift')!);
    expect(url.pathname).toBe(`/cart/${card.variantId}:1`);
    expect(url.searchParams.get('utm_source')).toBe('quiz');expect(url.searchParams.get('utm_medium')).toBe('gift');expect(url.searchParams.get('utm_campaign')).toBe('gift_a_breeder');
  });
  it('keeps mandatory rails and does not mutate the previous cart',()=>{const [box,rail]=requiredBox(owner);const previous=[{key:box.key,quantity:2},{key:rail.key,quantity:1}];expect(normalizeFabRails(previous).find(r=>r.key===rail.key)?.quantity).toBe(2);expect(previous[1].quantity).toBe(1);});
  it('blocks unavailable and incomplete carts',()=>{const rows=requiredBox(owner);const live=Object.fromEntries(rows.map(r=>[r.key,{...product(r.key)!,available:true,price:10000}]));expect(cartUrl(rows,live,'fab')).toContain('utm_campaign=fab_single_box');expect(cartUrl(rows.slice(0,1),live,'fab')).toBeNull();live[rows[1].key].available=false;expect(cartUrl(rows,live,'fab')).toBeNull();expect(cartUrl(rows,{},'fab')).toBeNull();});
  it('merges the same gift without duplicate cart rows',()=>{const p=products.find(p=>p.handle==='gift-card')!;expect(mergeCart([{key:p.key,quantity:1}],{key:p.key,quantity:2})).toEqual([{key:p.key,quantity:3,owner:undefined}]);});
  it('keeps Fab add-ons available but unticked for experienced breeders and locks the rails',()=>{
    const fabOwner:Owner={system:'fab',size:'4x4',height:'standard',windowed:false};
    const experienced=singleShelf(fabOwner,{...answers,experience:'6_plus'});
    expect(experienced.map(r=>r.category)).toEqual(expect.arrayContaining(['heat','pad','kit','seat']));
    expect(experienced.some(r=>r.selected)).toBe(false);
    expect(singleShelf(fabOwner,{...answers,experience:'3_5'}).find(r=>r.category==='heat')?.selected).toBe(false);
    expect(singleShelf(fabOwner,{...answers,experience:'3_5'}).find(r=>r.category==='pad')?.selected).toBe(true);
    expect(singleShelf(fabOwner,{...answers,stage:'week_3_plus',experience:'6_plus'})[0].category).toBe('room');
    expect(singleShelf(fabOwner,{...answers,stage:'born_0_3',jumps:true}).find(r=>r.category==='cover')?.selected).toBe(true);
    const [box,rails]=requiredBox(fabOwner);
    expect(box.locked&&box.selected&&rails.locked&&rails.selected).toBe(true);
    expect(bundleCandidates(fabOwner)).toEqual([]);
  });
  it('keeps the EZclassic 1–2 litter Whelping Kit unticked and excludes every Condo bundle',()=>{
    const ez:Owner={system:'ezclassic',size:'38x38',height:'standard',windowed:false};
    expect(singleShelf(ez,{...answers,experience:'1_2'}).find(r=>r.category==='kit')?.selected).toBe(false);
    expect(bundleCandidates(ez).every(candidate=>!candidate.name.toLowerCase().includes('condo'))).toBe(true);
  });
  it('keeps all six tall Size-Up variants addable by their verified Shopify variant IDs',()=>{
    const tall=products.filter(p=>p.handle==='tall-ezclassic-size-up-kit');expect(tall).toHaveLength(6);
    for(const item of tall){expect(item.sku).toBeNull();expect(item.variantId).toMatch(/^\d+$/);const line=mergeCart([],{key:item.key,quantity:1});expect(line).toHaveLength(1);const live={[item.key]:{...item,price:31999,available:true}};expect(cartUrl(line,live,'upgrade','sizeup')).toContain(`/cart/${item.variantId}:1?`);}
    for(const size of ['38x38','48x48'] as const)for(const windowed of [false,true]){const result=sizeUpgrade({system:'ezclassic',size,height:'tall',windowed},'Golden Retriever','');expect(result.kind).not.toBe('blocked');}
  });
});
describe('shared quiz layout and navigation',()=>{
  it.each(['fab','ezclassic','restock','upgrade','gift'])('%s uses the reference shell and video',lane=>{
    const component=lane==='fab'||lane==='ezclassic'?<SingleBoxQuiz system={lane}/>:lane==='gift'?<GiftQuiz/>:lane==='restock'?<RestockQuiz/>:<UpgradeQuiz/>;
    const {container}=render(<MemoryRouter>{component}</MemoryRouter>);
    expect(container.querySelector('.reference-quiz-card .reference-quiz-panel')).toBeTruthy();
    expect(container.querySelector('.reference-scene-slot video')).toBeTruthy();
    expect(container.querySelector('.fab-quiz-card')).toBeNull();
    if(lane==='gift')expect(container.querySelector('input[type=email]')).toBeNull();
  });
  it('lets a guest add a size-matched Fab pad and opens checkout without collecting email',()=>{
    const {container}=render(<MemoryRouter><GiftQuiz/></MemoryRouter>);
    fireEvent.click(screen.getByRole('button',{name:'Fab System'}));
    fireEvent.click(screen.getByRole('button',{name:'3x3'}));
    const addPad=container.querySelector(`[data-product-key="${giftPad('fab','3x3')}"] button`)!;
    fireEvent.click(addPad);
    fireEvent.click(addPad);
    const saved=JSON.parse(localStorage.getItem('ezw-cart-gift')||'[]');
    expect(saved).toEqual([{key:giftPad('fab','3x3'),quantity:2}]);
    expect(screen.getByRole('button',{name:'Go to checkout'})).toBeEnabled();
    expect(screen.queryByRole('textbox',{name:/email/i})).not.toBeInTheDocument();
  });
  it('opens the selected Restock intent tab and keeps both tabs available',()=>{
    render(<MemoryRouter><RestockQuiz/></MemoryRouter>);
    fireEvent.click(screen.getByRole('button',{name:'Something broke or is missing'}));
    expect(screen.getByRole('heading',{name:'Which box is yours?'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:/EZclassic.*Standard/}));
    fireEvent.click(screen.getByRole('button',{name:'38x38'}));
    fireEvent.click(screen.getByRole('button',{name:'Continue'}));
    expect(screen.getByRole('tab',{name:'Parts'})).toHaveAttribute('aria-selected','true');
    expect(screen.getByRole('tab',{name:'Refills'})).toHaveAttribute('aria-selected','false');
    expect(screen.queryByRole('textbox',{name:/email/i})).not.toBeInTheDocument();
    expect(track).toHaveBeenCalledWith('restock','Intent Selected',{intent:'parts'});
  });
  it('sells a TALL Size-Up Kit with its Shopify variant ID when its SKU is blank',()=>{
    render(<MemoryRouter><UpgradeQuiz/></MemoryRouter>);
    fireEvent.click(screen.getByRole('button',{name:/EZclassic.*TALL/}));
    fireEvent.click(screen.getByRole('button',{name:'38x38'}));
    fireEvent.click(screen.getByRole('button',{name:'Continue'}));
    fireEvent.click(screen.getByRole('button',{name:'A bigger mama is coming'}));
    fireEvent.change(screen.getByRole('searchbox',{name:'Search her breed'}),{target:{value:'Golden Retriever'}});
    fireEvent.click(screen.getByRole('button',{name:'Golden Retriever'}));
    const tallKit=products.find(p=>p.handle==='tall-ezclassic-size-up-kit'&&p.variant==='TALL 38 Box to 48 Box')!;
    expect(screen.getByRole('heading',{name:"You don't need a new box, grow this one."})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Add selected items'})).toBeEnabled();
    fireEvent.click(screen.getByRole('button',{name:'Add selected items'}));
    expect(JSON.parse(localStorage.getItem('ezw-cart-upgrade')||'[]')).toContainEqual({key:tallKit.key,quantity:1,owner:expect.any(String)});
    expect(track).toHaveBeenCalledWith('upgrade','new_dam_breed',expect.objectContaining({breed:'Golden Retriever',resolved_footprint:'48x48',resolved_height:'tall'}));
  });
  it.each(['fab','ezclassic'] as const)('%s progresses and goes back with answers preserved',system=>{
    render(<MemoryRouter><SingleBoxQuiz system={system}/></MemoryRouter>);
    expect(screen.queryByRole('region',{name:'Breed suggestions'})).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox',{name:'Search her breed'}),{target:{value:'labrador'}});
    fireEvent.click(screen.getByRole('button',{name:'Labrador Retriever'}));
    expect(screen.getByRole('heading',{name:'Litters raised'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'First'}));
    expect(screen.getByRole('heading',{name:'Where you are'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Back'}));
    expect(screen.getByRole('button',{name:'First'})).toHaveAttribute('aria-pressed','true');
    fireEvent.click(screen.getByRole('button',{name:'Restart'}));
    expect(screen.getByRole('heading',{name:'Her breed'})).toBeInTheDocument();
  });
});
