import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BundleResults from '@/components/BundleResults';
import catalog from '@/lib/live-bundle-catalog.json';
import { trackBundleEvent } from '@/lib/quiz-tracking';
import type { NewCustomerData } from '@/lib/types';
vi.mock('@tanstack/react-query',()=>({useQueries:({queries})=>queries.map(q=>({data:catalog[q.queryKey[1]],isLoading:false,refetch:vi.fn()}))}));
vi.mock('@/components/BundleSlideshow',()=>({default:()=>null}));
vi.mock('@/lib/quiz-tracking',()=>({trackBundleEvent:vi.fn()}));
let observe:(entries:unknown[])=>void;
class Observer {constructor(callback:(entries:unknown[])=>void){observe=callback;}observe(){}disconnect(){}}
vi.stubGlobal('IntersectionObserver',Observer);
afterEach(()=>{cleanup();vi.clearAllMocks();});
const base:NewCustomerData={timeline:'preparing',dueDate:null,breed:'',experience:'first',litterSize:'average',containment:'calm',zones:1,branchAnswer:false,damSize:'16_40',panelHeight:'18',hasWindow:'no'};
function mount(overrides:Partial<NewCustomerData>={}){return render(<BundleResults data={{...base,...overrides}} email="breeder@example.com" descriptions={{}} includes={{}} onRestart={()=>{}}/>);}
describe('bundle results interaction',()=>{
  it('switches cards in place, clears add-ons every time, and updates checkout and total together',()=>{
    mount();fireEvent.click(screen.getByRole('button',{name:/Starter Bundle/}));
    fireEvent.click(screen.getByRole('checkbox',{name:/Whelping Kit/}));
    expect(screen.getByRole('link',{name:'Get bundle'}).getAttribute('href')).toContain('19585620803:1');
    fireEvent.click(screen.getByRole('button',{name:/Essential Bundle/}));
    expect(screen.queryByRole('checkbox',{name:/Whelping Kit/})).toBeNull();
    expect(screen.getAllByRole('checkbox').every(el=>!(el as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByRole('link',{name:'Get bundle'})).toHaveAttribute('href','https://www.ezwhelp.com/cart/44599534682354:1');
    fireEvent.click(screen.getByRole('button',{name:/Starter Bundle/}));
    expect(screen.getByRole('checkbox',{name:/Whelping Kit/})).not.toBeChecked();
    expect(trackBundleEvent).toHaveBeenCalledTimes(3);
  });
  it('shows the bottom bar only below the cards and switches without scrolling',()=>{
    const scroll=vi.spyOn(window,'scrollTo').mockImplementation(()=>{});mount();
    expect(screen.queryByRole('group',{name:'Choose bundle'})).toBeNull();
    act(()=>observe([{isIntersecting:false,boundingClientRect:{bottom:-10}}]));
    fireEvent.click(screen.getByRole('button',{name:'Essential'}));
    expect(screen.getAllByRole('link',{name:'Get bundle'}).every(el=>el.getAttribute('href')==='https://www.ezwhelp.com/cart/44599534682354:1')).toBe(true);
    expect(trackBundleEvent).toHaveBeenCalledWith('Bundle Card Clicked',{bundle_name:'Essential',card_position:'alternative'},'breeder@example.com');
    expect(scroll).not.toHaveBeenCalled();
    act(()=>observe([{isIntersecting:true,boundingClientRect:{bottom:200}}]));
    expect(screen.queryByRole('group',{name:'Choose bundle'})).toBeNull();scroll.mockRestore();
  });
  it.each([1,2,3] as const)('limits the condo strip for zone %s and moves it after selection',zones=>{
    mount({zones});const link=screen.queryByRole('link',{name:/Shop the Two Room Condo/});
    if(zones===1){expect(link).toBeNull();return;}
    expect(link).not.toBeNull();expect(screen.queryByRole('heading',{name:'Complete Your Setup'})).toBeNull();
    fireEvent.click(screen.getAllByRole('button')[0]);
    const addons=screen.getByRole('heading',{name:'Complete Your Setup'});
    expect(addons.compareDocumentPosition(screen.getByRole('link',{name:/Shop the Two Room Condo/}))&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('shows the XL condo and sends its matched variant in the event',()=>{
    mount({damSize:'over_90'});const link=screen.getByRole('link',{name:/Shop the Two Room Condo/});
    link.addEventListener('click',e=>e.preventDefault());fireEvent.click(link);
    expect(trackBundleEvent).toHaveBeenCalledWith('Two Room Condo Link Clicked',{two_room_condo_variant_id:'55237174002036'},'breeder@example.com');
  });
  it('fires Added to Cart with matching IDs, quantities, and total before navigation',()=>{
    mount();const link=screen.getByRole('link',{name:'Get bundle'});link.addEventListener('click',e=>e.preventDefault());fireEvent.click(link);
    expect(trackBundleEvent).toHaveBeenCalledWith('Added to Cart',{bundle_name:'Starter',card_position:'recommended',variant_ids:['44599571841266'],quantities:[1],cart_value:catalog['bundles-ezclassic-starter-set'].variants.find(v=>v.id==='44599571841266')!.price/100},'breeder@example.com');
  });
});
