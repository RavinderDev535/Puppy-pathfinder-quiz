# Missing, Incorrect, and Unverified Requirements

Reviewed against supplied non-Lovable client files on 2026-10-10. Lovable prompt files are excluded.

| Quiz / work item | Finding | Status / action |
|---|---|---|
| Fab | FAB-013 expected unselected Stack Kit for 3x3; source product map has `stack: null`. | BLOCKED: exact variant/SKU required; do not invent. Matrix currently fails at this row. |
| Fab | Test case FAB-069 references 7x6 recommendation; source breed map/fallback and UI only establish 3x3, 4x4, 4x6. | BLOCKED conflict; client to resolve 7x6 mapping and whether sold-out Whopper can be recommended by quiz. |
| Fab | 80-row matrix after FAB-013 has not been fully verified; negative and behaviour cases not fully executed. | NOT VERIFIED. |
| Gift | Workbook specifies session-attached events/no profile; server excludes Gift surface from Klaviyo queue flush. | BLOCKED: needs approved anonymous event delivery, no email/profile gate. |
| Upgrade | Six TALL Size-Up Kit SKUs blank in client data: 38→48 solid/windowed; 38→48x76 solid/windowed; 48→48x76 solid/windowed. | BLOCKED: client/Shopify admin must supply or create verified SKUs. |
| Upgrade | Second whelping area package contents pending signoff. | BLOCKED; UI reports the uncertainty without guessing. |
| Upgrade | `sizeup_blocked` and remaining test matrix not exercised case-by-case. | NOT VERIFIED; external event delivery unavailable. |
| Restock | Live Shopify availability, inventory, price, variant resolution and checkout not checked. | BLOCKED by staging credentials/catalog arrangement. |
| EZclassic | Every client result, bundle eligibility negative case and product quantity case not run individually. | NOT VERIFIED; source-based breed/date checks passed. |
| All quizzes | Actual Klaviyo event receipt/profile fields/cart URL storage not inspected in Klaviyo. | NOT VERIFIED/BLOCKED; code/console evidence is insufficient. |
| All quizzes | Railway staging database isolation and deployed environment target unknown. | BLOCKED; no runtime config/secrets read and no database touched. |
| Separate Funnel Fix | `Checkout Started` local event has no callsite; queued pre-email abandonment events not confirmed delivered. | PARTIAL/NOT VERIFIED; keep separate. |
| Separate Bundle brief | Existing two-card UI/event props found, exact accepted pairs and external click event not verified. | PARTIAL/NOT VERIFIED; keep separate. |
| Evidence pack | No staging browser, Shopify/Klaviyo export, or safe test purchase environment. | BLOCKED; screenshots/PDF/exports/recordings not fabricated. |
