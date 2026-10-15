import { act, cleanup, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identity, resetLaneAttempt } from '@/lib/quiz-lanes/identity';
import { cartUrl, product, requiredBox } from '@/lib/quiz-lanes/engine';
import { recommendation, submitProfile, track, useLaneEvents } from '@/lib/quiz-lanes/client';

// jsdom 20 lacks the browser timeout helper; requests are mocked in this suite.
beforeEach(()=>vi.stubGlobal('AbortSignal',{timeout:()=>new AbortController().signal}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();for(const lane of ['fab','ezclassic','restock','upgrade','gift'] as const)resetLaneAttempt(lane);});
describe('quiz browser tracking contract',()=>{
  it('shares the attempt across cart, profile, and events while separating lanes and restarts',async()=>{
    const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({saved:true})});vi.stubGlobal('fetch',fetch);
    const rows=requiredBox({system:'fab',size:'4x4',height:'standard',windowed:false});
    const live=Object.fromEntries(rows.map(r=>[r.key,{...product(r.key)!,price:10000,available:true}]));
    const url=new URL(cartUrl(rows,live,'fab')!);const first=identity('fab').attempt_id;
    await track('fab','Added to Cart');await submitProfile('fab',' TEST@example.com ',{email_consent:true});
    expect(JSON.parse(fetch.mock.calls[0][1].body).properties.system).toBe('fab');
    expect(url.searchParams.get('attributes[attempt_id]')).toBe(first);
    for(const [,options] of fetch.mock.calls)expect(JSON.parse(options.body).attempt_id).toBe(first);
    expect(JSON.parse(fetch.mock.calls[1][1].body).email).toBe('test@example.com');
    expect(identity('gift').attempt_id).not.toBe(first);resetLaneAttempt('fab');expect(identity('fab').attempt_id).not.toBe(first);
  });
  it('retains displayed optional variant IDs while valuing only the selected cart',()=>{
    const required=requiredBox({system:'ezclassic',size:'38x38',height:'standard',windowed:false});
    const optional={key:'WhelpKit',quantity:1};const rows=[...required,optional];
    const live=Object.fromEntries(rows.map(r=>[r.key,{...product(r.key)!,price:10000,available:true}]));
    const snapshot=recommendation('ezclassic',rows,live,{},required);
    expect(snapshot.recommended_variant_ids).toContain(product('WhelpKit')!.variantId);
    expect(snapshot.cart_value).toBe(100);
    expect(new URL(snapshot.cart_url!).pathname).not.toContain(product('WhelpKit')!.variantId);
  });
  it('does not put email into event identity or create Gift profile requests',async()=>{
    const fetch=vi.fn().mockResolvedValue({ok:true});vi.stubGlobal('fetch',fetch);
    await track('gift','Added to Cart',{},'buyer@example.com');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).not.toHaveProperty('email');
    await expect(submitProfile('gift','buyer@example.com',{})).rejects.toThrow();expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('records a real SPA abandonment without recording StrictMode effect replay as abandonment',async()=>{
    const fetch=vi.fn().mockResolvedValue({ok:true});vi.stubGlobal('fetch',fetch);
    function Probe(){useLaneEvents('fab',{last_step:'breed',step_number:1},false);return null;}
    const {unmount}=render(<StrictMode><Probe/></StrictMode>);
    await act(async()=>{await Promise.resolve();});
    expect(fetch.mock.calls.map(c=>JSON.parse(c[1].body).event)).not.toContain('Quiz Abandoned');
    const run=identity('fab').attempt_id;unmount();await act(async()=>{await Promise.resolve();});
    const abandoned=fetch.mock.calls.map(c=>JSON.parse(c[1].body)).filter(p=>p.event==='Quiz Abandoned');
    expect(abandoned).toHaveLength(1);expect(abandoned[0].attempt_id).toBe(run);
    expect(identity('fab').attempt_id).not.toBe(run);
  });
});
