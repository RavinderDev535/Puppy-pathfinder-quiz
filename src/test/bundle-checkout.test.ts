import { describe, expect, it } from 'vitest';
import { buildBundleCart } from '@/lib/bundle-cart';
import { getBundleUrl, twoRoomCondoLink } from '@/lib/live-bundle-config';
import catalog from '@/lib/live-bundle-catalog.json';
import { computeFullResult } from '@/lib/structural-engine';
import type { NewCustomerData } from '@/lib/types';
export const base:NewCustomerData={timeline:'preparing',dueDate:null,breed:'',experience:'first',litterSize:'average',containment:'calm',zones:1,branchAnswer:false,damSize:'16_40',panelHeight:'18',hasWindow:'no'};
describe('production bundle checkout',()=>{
  it('resolves every recommended and alternative bundle and addon to a verified live variant',()=>{
    for(const zones of [1,2,3] as const)for(const branchAnswer of [false,true])for(const damSize of ['under_16','16_40','40_90','over_90'] as const)for(const panelHeight of ['18','28'] as const)for(const hasWindow of ['yes','no'] as const){
      const r=computeFullResult({...base,zones,branchAnswer,damSize,panelHeight,hasWindow});
      const urls=[getBundleUrl(r.bundle,r.boxSize,r.panelHeight,damSize==='over_90',hasWindow),...r.addOns.map(a=>a.url!)];
      expect(buildBundleCart(urls.map(url=>({url,quantity:1})),catalog),JSON.stringify({zones,branchAnswer,damSize,panelHeight,hasWindow})).not.toBeNull();
    }
  });
  it('blocks missing IDs, foreign stores, unverified IDs, and invalid quantities without dropping items',()=>{
    const good=getBundleUrl('Starter','38','18');
    for(const url of ['https://www.ezwhelp.com/products/whelping-kit',good.replace('www.ezwhelp.com','test.myshopify.com'),good.replace(/\d+$/,'123')])expect(buildBundleCart([{url:good,quantity:1},{url,quantity:1}],catalog)).toBeNull();
    expect(buildBundleCart([{url:good,quantity:0}],catalog)).toBeNull();
    expect(getBundleUrl('Starter','99','18')).toBe('#');
  });
  it('merges quantities and computes the total in cents',()=>{
    const url=getBundleUrl('Starter','38','18');const cart=buildBundleCart([{url,quantity:1},{url,quantity:2}],catalog)!;
    expect(cart.url).toBe('https://www.ezwhelp.com/cart/44599571841266:3');expect(cart.quantities).toEqual([3]);expect(cart.total).toBe(catalog['bundles-ezclassic-starter-set'].variants.find(v=>v.id==='44599571841266')!.price*3);
  });
  it.each([['28','18',false,'55237173838196'],['38','18',false,'55237173870964'],['48','18',false,'55237173903732'],['38','28',false,'55237173936500'],['48','28',false,'55237173969268'],['48','28',true,'55237174002036']] as const)('preselects Two Room Condo %s/%s XL=%s',(size,height,xl,id)=>{
    const link=twoRoomCondoLink(size,height,xl);expect(link.id).toBe(id);expect(new URL(link.url).searchParams.get('variant')).toBe(id);expect(new URL(link.url).searchParams.get('utm_content')).toBe('two_room_condo_strip');
  });
  it('omits only the variant query parameter when no condo matches',()=>{const link=twoRoomCondoLink('99','18');expect(link.id).toBeNull();expect(new URL(link.url).searchParams.has('variant')).toBe(false);expect(new URL(link.url).searchParams.get('utm_source')).toBe('quiz');});
});
