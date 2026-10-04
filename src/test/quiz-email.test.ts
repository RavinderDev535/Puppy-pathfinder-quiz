import { describe, expect, it, vi } from 'vitest';
import { saveProfile } from '../../server/quiz-api.mjs';

const input={lane:'fab',email:'test@example.com',properties:{email_consent:true,consent_timestamp:'2026-10-04T00:00:00Z'}};
describe('quiz email sequencing (mock service only)',()=>{
  it('writes properties before requesting subscription',async()=>{
    const request=vi.fn(async(path:string)=>path.startsWith('profiles?')?{data:[]}:{data:{id:'profile-test'}});
    await saveProfile(input,request,'list-test');
    expect(request.mock.calls.map(c=>c[0].split('?')[0])).toEqual(['profiles','profile-import','profile-subscription-bulk-create-jobs']);
  });
  it.each([{consent:'UNSUBSCRIBED'},{suppression:[{}]},{list_suppressions:[{}]}])('does not resubscribe suppressed profiles (%j)',async marketing=>{
    const request=vi.fn(async(path:string)=>path.startsWith('profiles?')?{data:[{attributes:{subscriptions:{email:{marketing}},properties:{consent_timestamp:'original'}}}]}:{data:{id:'profile-test'}});
    const result=await saveProfile(input,request,'list-test');
    expect(result.subscribed).toBe(false);
    expect(request.mock.calls.map(c=>c[0].split('?')[0])).toEqual(['profiles','profile-import']);
    expect((request.mock.calls[1] as unknown as [string,string,{data:{attributes:{properties:{consent_timestamp:string}}}}])[2].data.attributes.properties.consent_timestamp).toBe('original');
  });
});
