# Five-quiz dashboard and Klaviyo handoff

Reviewed against the supplied Dashboard logic/test workbooks and prompt pack,
Klaviyo Data Transfer Spec and Master Architecture, and the five Quiz Files
handovers (4 October 2026). This implements the **quiz-side collection** for
EZclassic, Fab, Restock, Upgrade and Gift. The separate dashboard application
has not been supplied, connected or verified. The two original bundle/owner
flows still use their existing backend.

## Runtime and persistence

Use Node **22.13+** and run `npm run build` then `npm start`. These changes
require the Node API, including on deployments which previously served only
static frontend assets. Vite development and preview also mount this API.

`QUIZ_DB_PATH` defaults to `data/quiz.sqlite`. Mount its directory on a durable
volume, back it up, and use one writer process. An ephemeral deployment loses
the database when its disk is replaced. Multiple server instances need a shared
database/worker implementation before scaling. The database is never a public
static asset; it contains email addresses and answers.

Tables available to the future dashboard backend:

| Table | Contents |
| --- | --- |
| attempts | One run, lane (`surface`), traffic attribution, answers, completion, email capture, observed lead/customer flags |
| events | Event UUID, attempt/session IDs, event time, lane, JSON payload; accepted events survive service outages |
| steps | Answer, step name/number, elapsed milliseconds; linked to the corresponding event |
| recommendations | SKUs and variant IDs displayed, selected-cart URL/value; one snapshot per changed recommendation |
| orders | Schema reserved for the Shopify integration; this app does not populate orders |
| profile_jobs | Durable pending follow-up writes, attempts, retry time and last error |

SQLite stores booleans as 0/1 and unknown flags as NULL. JSON columns contain
serialized JSON. Monetary values use store currency units, not cents. Historical
events never collected by the old code cannot be recovered from this database.

For a consistent private handoff export, run on the server:

```sh
node --env-file-if-exists=.env scripts/export-quiz-dashboard.mjs > quiz-dashboard.json
```

This command reads an existing database. Import the five data tables into the
dashboard's private backend, or add an authenticated server-to-server reader
when its code is available. Never publish this export in `public/` or `dist/`.
No dashboard ingestion URL has been guessed or configured.

The supplied dashboard now has a protected reader for
`GET /api/quiz-lanes/dashboard-snapshot`. Set `QUIZ_DASHBOARD_TOKEN` on this
quiz server and the dashboard server, plus `QUIZ_SNAPSHOT_URL` on the dashboard.
The endpoint and command-line export include explicit source coverage; Shopify
orders and Klaviyo status history remain unavailable until ingested. See the
dashboard repository's `docs/live-dashboard.md` for runtime configuration.

## Join keys and completion

All five lanes send `attempt_id`, `session_id`, timestamp and lane on every
event and email submission. Each mounted quiz run gets a UUID, including a
fresh UUID on restart or return after leaving the lane. Reload starts a new
attempt. Tabs have separate IDs, even when browser storage was copied from an
opener. All generated cart permalinks carry `attributes[attempt_id]`.

`surface` values: `ezclassic`, `fab`, `restock`, `upgrade`, `gift`. Map these to
the dashboard's five corresponding tiles. Do not map these runs to `path1` or
`path2` (the older quiz contracts).

Current explicit completion rules for the new collection layer:

| Lane | Completed when |
| --- | --- |
| EZclassic, Fab | Results/recommendation shown |
| Upgrade | Recommendation or the reassurance/XL result shown |
| Restock, Gift | `Added to Cart` accepted before the Shopify redirect |

Completion is independent of email capture and successful Klaviyo delivery.
Preserve one completion rule per lane when connecting the dashboard. The supplied
dashboard documents require that rule but do not enumerate each lane's original
implementation; compare these rules to the dashboard code when it arrives.

`Quiz Step Completed` is stored as dashboard `step_complete` and delivered to
Klaviyo under its specified metric name. Identical event IDs are idempotent;
identical payloads for the same attempt/event within one second are deduplicated.
Different answers within that window are preserved. Restart and other lanes
cannot overwrite an earlier run's lead classification.

Recommendations record displayed optional products as well as preselected items;
cart value/URL describe the selected cart. Missing Shopify SKUs are omitted,
never replaced with an invented SKU; real variant IDs remain available for joins.
Gift selection events describe actual selected products and are stored locally.

## Klaviyo contract

Configure server-only variables from `.env.example`:

- `KLAVIYO_PRIVATE_API_KEY`
- `KLAVIYO_LIST_ID`: Quiz Leads
- `KLAVIYO_MASTER_LIST_ID`: Master Marketing
- `KLAVIYO_FACILITY_LIST_ID`: optional Facility Scale sales list
- `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_ADMIN_ACCESS_TOKEN`: optional customer
  lookup with `read_customers` access; unknown customer history stays NULL.

Source and consent-source mapping:

| Lane | Property value |
| --- | --- |
| EZclassic | `quiz_ezclassic_single_box` |
| Fab | `quiz_fab_single_box` |
| Restock | `quiz_restock` |
| Upgrade | `quiz_upgrade` |
| Gift | No Klaviyo profile, list membership or profile events |

Profiles include `quiz_version=v2_2026_10_04`, attempt ID, collected answers,
consent and lane fields. EZclassic panel height is `standard`/`tall`; Fab omits
it. Uncollected/empty dates and properties are omitted. Unlisted breeds retain
raw typed text separately. Restock dates are `YYYY-MM-DD` and SKU lists are
comma-separated. Owner lanes set `has_box=true`. Program quantity is sent only
on the program path. Born dates include the computed go-home date.

The API saves the attempt and pending submission first so a service outage
cannot discard the captured data. Before any external write it looks up the
normalized email in Klaviyo, optionally checks Shopify purchase history, and
checkpoints the result. It writes profile properties, then list requests, then
releases profile events including `Quiz Completed`. Retrying a partially completed
write reuses its original observation, so a new lead cannot turn into a returning
lead because the first write succeeded before a later step failed.

If the lookup fails, `is_new_lead` stays NULL and `needs_review=1`. Consent must
be recoverable before retrying the external write; retries never assume an
unreachable profile has consented. Without credentials at capture time, newness
remains unknown even after later setup. Profile/list failures remain queued with
exponential backoff (up to one hour); event failures remain pending for the next
30-second worker pass. Monitor `profile_jobs`, `profile_status`, `needs_review`
and events with `klaviyo_sent=0` for known profiles.

Original consent timestamps and suppressed/unsubscribed statuses are preserved.
Facility Scale membership does not change marketing subscription status. A 202
response means saved/queued, not an email delivered or a double-opt-in confirmed.

No unidentified visitor event is sent to Klaviyo before the email lookup: its
event API can create a profile and would corrupt new-lead measurement. Anonymous
abandonment stays in the dashboard database. Once a profile is saved, its pending
events can be delivered. Gift remains session scoped in the local database.

The older dashboard prompt mentions list-triggered flows; the supplied Klaviyo
Master Architecture explicitly replaces those with event-triggered flows. Both
lists are populated, with event delivery after properties/list requests. Configure
actual flows in Klaviyo using that architecture.

## Deployment handoff

The dashboard now reads this private endpoint and merges it with the original
two quiz lanes from the Railway/Neon API. Deploy the quiz app as a Node 22.13+
or newer service using `npm run build` and `npm start`. On Railway, bind a
persistent volume at `/data`, set `QUIZ_DB_PATH=/data/quiz.sqlite`, and set a
strong `QUIZ_DASHBOARD_TOKEN`. The server binds to `0.0.0.0` and Railway's
`PORT`. Use the service's HTTPS domain for dashboard `QUIZ_SNAPSHOT_URL` and,
when the quiz frontend is hosted separately, its `VITE_API_URL`.

Set the same `QUIZ_DASHBOARD_TOKEN` as a server-only variable on the dashboard.
Set `LEGACY_SNAPSHOT_URL` to
`https://testserverjs-production-4bd0.up.railway.app/api/internal/dashboard-snapshot`.
That endpoint uses the existing admin JWT; it does not need a second shared
secret. The dashboard's `VITE_API_BASE_URL` is already the existing Railway
origin.

The Railway export can provide captured path1/path2 attempts, funnel events,
and paid order IDs. Its existing database has no complete store-wide order
history or unsubscribe/bounce/complaint history, so store-share and net-new-lead
status figures remain unavailable. Klaviyo newness appears only where the
recorded profile/subscription fields establish it; other rows remain unknown.
The separate SQLite endpoint marks Shopify orders and Klaviyo status history
unavailable until those data sources are actually ingested.

The remaining live acceptance work is to deploy both code changes, configure
the service variables and persistent volume, confirm the launch timezone, then
compare dashboard totals against authorized Shopify and Klaviyo records. Do not
claim test-order or live-profile sign-off until those checks are performed.

API references checked: [Klaviyo profile import](https://developers.klaviyo.com/en/reference/create_or_update_profile),
[Klaviyo events](https://developers.klaviyo.com/en/reference/create_event),
[Shopify cart permalinks](https://shopify.dev/docs/apps/build/checkout/create-cart-permalinks).
