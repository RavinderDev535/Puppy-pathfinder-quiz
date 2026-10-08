# Version 2 quiz integration

The dashboard uses the original `main` pages, navigation, date selector, auth,
hooks, and `/api/admin/v2/*` API. The snapshot service has been removed.

The additions are five quiz summaries on Pulse and five choices in the existing
Quiz Submissions filter. The existing table, order details, abandoned sessions,
and CSV export handle all seven quizzes. New quiz answers appear in the existing
submission detail drawer. Gift does not enter lead classification.

## Deployment

Deploy the `version2` backend from `Downloads/test.server.js` first. It creates
`quiz_lane_submissions` in the existing Postgres database and adds the required
event/order/date columns at startup. It reuses `quiz_sessions`, `funnel_events`,
`orders`, admin authentication, and the Shopify webhook.

Then build/deploy the quiz with `VITE_API_URL` pointing to that backend, and this
dashboard with its existing `VITE_API_BASE_URL` configuration. The backend CORS
allow-list must include the frontend origins, as with the original quizzes.

The backend uses its existing `KLAVIYO_API_KEY` and `KLAVIYO_LIST_ID`. Configure
`KLAVIYO_MASTER_LIST_ID` and, if used, `KLAVIYO_FACILITY_LIST_ID` there too.
Profile writes and events retry from Postgres; Gift never writes a profile.

Previous SQLite files are not deleted or imported automatically. If version2
already collected real records in SQLite, retain that database for a separate
import before retiring its host. The old frontend export script is retained for
that purpose, but the running frontend no longer writes to SQLite.

## Checks

TypeScript checks passed in both frontends. Backend regression tests passed with
`SHOPIFY_DOMAIN=www.ezwhelp.com`, matching the repository's product URLs.
Isolated Postgres checks covered all seven submission filters, search, event
deduplication, anonymous Gift attribution, unknown lead status, Pulse totals,
and existing analytics endpoints. No production database migration, real order,
Klaviyo delivery, or deployment was performed.

The original path-specific reports retain their original scope. Klaviyo flow
creation and the email asking for a litter's birth date require configuration in
Klaviyo; these repository changes do not create or publish those flows.
