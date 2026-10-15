import { describe, expect, it, vi } from 'vitest';
import { saveProfile } from '../../server/quiz-api.mjs';
import { normalizeProfile } from '../../server/quiz-profile.mjs';

const input={lane:'fab',email:'test@example.com',properties:{email_consent:true,consent_timestamp:'2026-10-04T00:00:00Z'}};
describe('quiz email sequencing (mock service only)',()=>{
  it('accepts the Upgrade new-dam and target-size profile fields',()=>{
    const profile=normalizeProfile({lane:'upgrade',email:'grower@example.com',attempt_id:'123e4567-e89b-42d3-a456-426614174000',session_id:'123e4567-e89b-42d3-a456-426614174001',properties:{email_consent:true,upgrade_path:'size',new_dam_breed:'Golden Retriever',target_box_size:'48x48'}});
    expect(profile.properties.new_dam_breed).toBe('Golden Retriever');expect(profile.properties.target_box_size).toBe('48x48');
  });
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
