import type { Lane } from './engine';

export const quizVersion = 'v2_2026_10_04';
export const sources: Record<Lane, string> = {
  ezclassic: 'quiz_ezclassic_single_box', fab: 'quiz_fab_single_box',
  restock: 'quiz_restock', upgrade: 'quiz_upgrade', gift: 'quiz_gift',
};
const attempts = new Map<Lane, ReturnType<typeof newAttempt>>();
const sessionId = crypto.randomUUID();
// Front-door navigation may replace the landing query string before a quiz mounts.
const landingQuery = new URLSearchParams(window.location.search);
function newAttempt() {
  const query = new URLSearchParams(window.location.search);
  const attribution=(key:string)=>query.get(key)||landingQuery.get(key)||'';
  const referrer = document.referrer;
  const medium = attribution('utm_medium');
  const source = attribution('utm_source');
  const channel = /email/i.test(medium) ? 'Email' : /cpc|ppc|paidsearch/i.test(medium) ? 'Paid search'
    : /social|facebook|instagram|tiktok/i.test(`${medium} ${source} ${referrer}`) ? 'Social'
    : /organic/i.test(medium) || /google\.|bing\.|duckduckgo\./i.test(referrer) ? 'Organic'
    : referrer ? 'Referral' : 'Direct';
  return { attempt_id: crypto.randomUUID(), session_id: sessionId, started_at: new Date().toISOString(),
    utm_source: source, utm_medium: medium, utm_campaign: attribution('utm_campaign'),
    referrer, channel, device: window.innerWidth < 768 ? 'mobile' : 'desktop' };
}
export function identity(lane: Lane) {
  if (!attempts.has(lane)) attempts.set(lane, newAttempt());
  return attempts.get(lane)!;
}
export function resetLaneAttempt(lane: Lane) { attempts.delete(lane); }
