import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Answers, breeds, cartUrl, dateProperties, giftPad, mergeCart, Owner, product, products, requiredBox, resolveBreed, resolveFab, restockShelf, singleShelf, sizeUpgrade, validSizes } from '@/lib/quiz-lanes/engine';
import { normalizeFabRails } from '@/components/quiz-lanes/Cart';
import SingleBoxQuiz from '@/components/quiz-lanes/SingleBoxQuiz';
import RestockQuiz from '@/components/quiz-lanes/RestockQuiz';
import GiftQuiz from '@/components/quiz-lanes/GiftQuiz';
import UpgradeQuiz from '@/components/quiz-lanes/UpgradeQuiz';

vi.mock('@/components/PuppyScene',()=>({default:()=> <video data-testid="shared-video"/>}));
vi.mock('@/lib/quiz-lanes/client',()=>({track:vi.fn(),useLaneEvents:vi.fn(),useRecommendation:vi.fn(),useShownEvent:vi.fn(),submitProfile:vi.fn().mockResolvedValue(undefined),useLiveProducts:(keys:string[])=>({live:Object.fromEntries(keys.flatMap(key=>{const p=product(key);return p?[[key,{...p,price:10000,available:true}]]:[];})),loading:false,retry:vi.fn()})}));
afterEach(()=>{cleanup();localStorage.clear();});
const owner:Owner={system:'fab',size:'4x4',height:'standard',windowed:false};
const answers:Answers={breed:'Labrador Retriever',weight:'',experience:'first',stage:'preparing',jumps:false,windowed:false,date:'2026-10-04',litter:'4_6',email:'test@example.com'};
describe('five quiz rules',()=>{
  it('resolves all 177 supplied breeds to supported products',()=>{expect(breeds).toHaveLength(177);for(const b of breeds){expect(resolveBreed(b.name,'')).toEqual(b.sizes);expect(resolveFab(b.name,'').size).toBeTruthy();for(const size of b.sizes)expect(product(requiredBox({system:'ezclassic',size,height:size==='48x76'?'tall':'standard',windowed:false})[0].key)).toBeTruthy();}});
  it.each(['born_0_3','week_1_2','week_3_plus'] as const)('rejects future birth dates for %s',stage=>{expect(()=>dateProperties(stage,'2026-10-05','2026-10-04')).toThrow(/future/);expect(dateProperties(stage,'2026-10-04','2026-10-04').go_home_date).toBe('2026-11-29');});
  it('validates calendar dates and keeps past due dates',()=>{expect(()=>dateProperties('preparing','2026-02-30')).toThrow();expect(dateProperties('preparing','2026-10-01','2026-10-04').date_in_past).toBe(true);});
  it('checks every owner footprint and both restock tabs without fabricated SKUs',()=>{for(const system of ['fab','ezclassic'] as const)for(const height of ['standard','tall'] as const)for(const size of validSizes(system,height))for(const tab of ['refills','parts'] as const){const rows=restockShelf({system,height,size,windowed:false,rooms:true},tab);expect(rows.length).toBeGreaterThan(0);expect(new Set(rows.map(r=>r.key)).size).toBe(rows.length);for(const row of rows)expect(product(row.key),row.key).toBeTruthy();}});
  it('maps all seven gift pads to verified variants',()=>{for(const system of ['fab','ezclassic'] as const)for(const size of (system==='fab'?['3x3','4x4','4x6']:['28x28','38x38','48x48','48x76']) as Owner['size'][]){expect(product(giftPad(system,size)!)).toBeTruthy();}});
  it('keeps mandatory rails and does not mutate the previous cart',()=>{const [box,rail]=requiredBox(owner);const previous=[{key:box.key,quantity:2},{key:rail.key,quantity:1}];expect(normalizeFabRails(previous).find(r=>r.key===rail.key)?.quantity).toBe(2);expect(previous[1].quantity).toBe(1);});
  it('blocks unavailable and incomplete carts',()=>{const rows=requiredBox(owner);const live=Object.fromEntries(rows.map(r=>[r.key,{...product(r.key)!,available:true,price:10000}]));expect(cartUrl(rows,live,'fab')).toContain('utm_campaign=fab_single_box');expect(cartUrl(rows.slice(0,1),live,'fab')).toBeNull();live[rows[1].key].available=false;expect(cartUrl(rows,live,'fab')).toBeNull();expect(cartUrl(rows,{},'fab')).toBeNull();});
  it('merges the same gift without duplicate cart rows',()=>{const p=products.find(p=>p.handle==='gift-card')!;expect(mergeCart([{key:p.key,quantity:1}],{key:p.key,quantity:2})).toEqual([{key:p.key,quantity:3,owner:undefined}]);});
  it('applies experience defaults and jumper override',()=>{expect(singleShelf(owner,{...answers,experience:'6_plus'}).some(r=>r.selected)).toBe(false);expect(singleShelf(owner,{...answers,stage:'born_0_3',experience:'6_plus',jumps:true}).find(r=>r.category==='cover')?.selected).toBe(true);});
  it('resolves tall kits even when Shopify has no SKU',()=>{const result=sizeUpgrade({system:'ezclassic',size:'38x38',height:'tall',windowed:true},'not_listed','40_90');expect(result.kind).toBe('kit');if(result.kind==='kit')expect(product(result.key!)?.variantId).toMatch(/^\d+$/);});
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
