export const sources = { ezclassic:'quiz_ezclassic_single_box',fab:'quiz_fab_single_box',restock:'quiz_restock',upgrade:'quiz_upgrade' };
const fields = new Set(`recommended_cart_url due_date dob go_home_date breed breed_unresolved breed_free_text box_system box_size panel_height windowed has_addon_rooms has_box dam_size is_xl litter_size_band experience stage restock_intent last_restock_date last_restock_skus reminder_optin upgrade_path target_box_size program_qty email_consent consent_timestamp jumps size_band`.split(' '));
const enums = { box_system:['ezclassic','fab'],box_size:['28x28','38x38','48x48','48x76','3x3','4x4','4x6','7x6'],panel_height:['standard','tall'],experience:['first','1_2','3_5','6_plus'],stage:['preparing','due_7','born_0_3','week_1_2','week_3_plus'],litter_size_band:['1_3','4_6','7_9','10_plus'],restock_intent:['refills','parts'],upgrade_path:['size','space','program'] };
export function normalizeProfile(input) {
  if (!sources[input.lane]) throw Error('This lane does not collect profiles');
  const email = String(input.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length>254 || input.properties?.email_consent !== true) throw Error('Email and consent are required');
  const properties = Object.fromEntries(Object.entries(input.properties).filter(([k,v]) => fields.has(k) && v!==null && v!==undefined && v!==''));
  for (const [key,value] of Object.entries(properties)) {
    if(key==='last_restock_skus'&&Array.isArray(value))continue;
    if(!['string','number','boolean'].includes(typeof value))throw Error(`Invalid ${key}`);
  }
  for(const key of ['breed_unresolved','windowed','has_addon_rooms','has_box','is_xl','reminder_optin','email_consent','jumps']) {
    if(properties[key]!==undefined&&typeof properties[key]!=='boolean')throw Error(`Invalid ${key}`);
  }
  if(properties.program_qty!==undefined&&(!Number.isInteger(properties.program_qty)||properties.program_qty<1))throw Error('Invalid program quantity');
  for (const [key,values] of Object.entries(enums)) if (properties[key]!==undefined && !values.includes(properties[key])) throw Error(`Invalid ${key}`);
  for (const key of ['due_date','dob','go_home_date','last_restock_date']) {
    const date = properties[key];
    if (date!==undefined && (typeof date!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date)) throw Error(`Invalid ${key}`);
  }
  if (properties.dob && properties.dob > new Date().toISOString().slice(0,10)) throw Error('Date of birth cannot be in the future');
  if (properties.consent_timestamp && (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(properties.consent_timestamp)||!Number.isFinite(Date.parse(properties.consent_timestamp)))) throw Error('Invalid consent timestamp');
  if (properties.box_system==='fab') { delete properties.panel_height; delete properties.windowed; }
  if (properties.breed==='not_listed') { delete properties.breed; properties.breed_unresolved=true; }
  if (properties.last_restock_skus && Array.isArray(properties.last_restock_skus)) properties.last_restock_skus=properties.last_restock_skus.filter(Boolean).join(',');
  if (properties.recommended_cart_url) {
    const url = new URL(properties.recommended_cart_url);
    if(url.origin!=='https://www.ezwhelp.com'||!/^\/cart\/\d+:\d+/.test(url.pathname)) throw Error('Invalid recommended cart');
    url.searchParams.set('attributes[attempt_id]',input.attempt_id);
    properties.recommended_cart_url=url.toString();
  }
  return {...input,email,properties:{...properties,source:sources[input.lane],consent_source:sources[input.lane],
    quiz_version:'v2_2026_10_04',attempt_id:input.attempt_id}};
}

export async function saveProfile(input, request, listId, options={}) {
  const email = input.email.trim().toLowerCase();
  const query = new URLSearchParams({filter:`equals(email,${JSON.stringify(email)})`,'additional-fields[profile]':'subscriptions'});
  // An observation is checkpointed before any write and reused after retries.
  let observation = options.observation;
  if (!observation) {
    observation = { is_new_lead:null, checked_at:new Date().toISOString(), lookup_failed:false };
    try { observation.existing=(await request(`profiles?${query}`)).data?.[0]; observation.is_new_lead=!observation.existing; }
    catch { observation.lookup_failed=true; }
    if (options.lookupCustomer) {
      try { observation.was_existing_customer=await options.lookupCustomer(email); } catch { /* unknown remains absent */ }
    }
    await options.onObservation?.(observation);
  }
  // After an unknown lookup, safely recover consent before writing; newness stays NULL.
  let existing = observation.existing;
  if(observation.lookup_failed) existing=(await request(`profiles?${query}`)).data?.[0];
  const marketing=existing?.attributes?.subscriptions?.email?.marketing;
  const previous=existing?.attributes?.properties||{};
  const properties={...input.properties,is_new_lead:observation.is_new_lead,
    ...(observation.was_existing_customer!==undefined?{was_existing_customer:observation.was_existing_customer}:{}),
    consent_timestamp:previous.consent_timestamp||input.properties.consent_timestamp};
  const suppressed=marketing?.consent==='UNSUBSCRIBED'||(marketing?.suppression?.length||0)>0||(marketing?.list_suppressions?.length||0)>0;
  const saved=await request('profile-import','POST',{data:{type:'profile',attributes:{email,properties}}});
  const lists=[...new Set([listId,...(options.listIds||[])].filter(Boolean))];
  for(const id of lists) {
    if(!suppressed&&marketing?.consent!=='SUBSCRIBED') await request('profile-subscription-bulk-create-jobs','POST',{data:{type:'profile-subscription-bulk-create-job',attributes:{custom_source:properties.consent_source,historical_import:false,profiles:{data:[{type:'profile',attributes:{email,subscriptions:{email:{marketing:{consent:'SUBSCRIBED'}}}}}]}},relationships:{list:{data:{type:'list',id}}}}});
    else if(!suppressed) await request(`lists/${encodeURIComponent(id)}/relationships/profiles`,'POST',{data:[{type:'profile',id:saved.data.id}]});
  }
  if(options.facilityListId && properties.program_qty>=3) await request(`lists/${encodeURIComponent(options.facilityListId)}/relationships/profiles`,'POST',{data:[{type:'profile',id:saved.data.id}]});
  return {saved:true,subscribed:!suppressed,properties,observation};
}
