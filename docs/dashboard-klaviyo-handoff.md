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

## Remaining external work

These items cannot be verified from this quiz repository:

1. Connect the separate dashboard backend to these records and its older two
   lanes; remove demo generators on every page and reconcile its 19 metrics.
2. Set dashboard launch time to **25 May 2026 at 7am**, using the store's intended
   timezone (not specified in these documents).
3. Implement authenticated Shopify checkout/order ingestion and store totals.
   The quiz records a cart click, never fabricates `Checkout Started` or a purchase.
   Attribute orders by attempt ID first, email second; exclude unmatched orders.
4. Read Klaviyo unsubscribe/bounce/complaint status for net-new-lead and lead-quality
   metrics. `is_new_lead` alone is not net new leads.
5. Configure Klaviyo lists, flows and credentials on the deployment. Verify each
   non-Gift profile in Klaviyo and open an actual follow-up email to test its URL.
6. Place an authorized Shopify test order to confirm the cart attribute reaches
   the order. No live subscription, message, deployment or order was performed here.

The supplied acceptance workbooks request live exports, screenshots, recordings
and metric reconciliation. Local automated checks do not constitute that live
sign-off. Setup for these five lanes must deploy before new records can appear.

API references checked: [Klaviyo profile import](https://developers.klaviyo.com/en/reference/create_or_update_profile),
[Klaviyo events](https://developers.klaviyo.com/en/reference/create_event),
[Shopify cart permalinks](https://shopify.dev/docs/apps/build/checkout/create-cart-permalinks).
