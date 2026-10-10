# Remaining Blockers and Client Decisions

| Blocker | Exact details / impact | Required resolution |
|---|---|---|
| Fab 3x3 Stack Kit SKU | FAB-013 expects Stack Kit on unselected list; `reference-data.json` gives Fab 3x3 `stack: null`. Source product sheet does not identify a verified variant. | Client confirms available 3x3 stack kit product/SKU or corrects expected test case. Do not substitute 4x4. |
| Fab 7x6 conflict | Breed map/fallback and quiz flow support 3x3/4x4/4x6; test FAB-069 mentions a breed mapping to sold-out 7x6 Whopper. | Client confirms exact breed/mapping, whether test case is intentional, and sold-out recommendation behavior. |
| Upgrade missing SKUs | Six TALL Size-Up Kit SKU cells are blank: 38→48 solid, 38→48 windowed, 38→48x76 solid, 38→48x76 windowed, 48→48x76 solid, 48→48x76 windowed. | Provide/create verified Shopify variants/SKUs. Until then affected configurations must be blocked. |
| Upgrade expansion kit contents | Source says Second Whelping Area package contents pending client signoff. | Approve product list and quantities. Current interface signals pending confirmation. |
| Gift anonymous Klaviyo | Source requires events attached to session while forbidding email/profile; current backend excludes Gift from event flush. | Approve anonymous event endpoint/identity model or confirm tracking is not expected. Do not introduce profile capture. |
| Staging Shopify and Klaviyo | No test credentials or isolated accounts available. | Provide staging store, test products, Klaviyo test account, and safe test checkout setup. |
| Railway/database isolation | Runtime DB target and staging isolation cannot be proven from local source. | Owner confirms staging project/database identity; no DB operation until verified. |
| Client test matrix completion | Fab matrix fails at FAB-013; other quiz sheets have not been individually replayed through all logic. | Resolve product conflicts then execute full source case suites and record each case. |
| Evidence pack | Required screenshot/PDF, Klaviyo export, Shopify URL list and negative recordings need connected safe staging. | Provide staging browser/service access and exact evidence naming review. |
| Separate Funnel Fix | Checkout Started has no local callsite; pre-email abandonment delivery unverified. | Confirm separate scope and validate all requested funnel events/profile links in staging. |
| Separate Bundle options brief | Existing two-card UI found, but exact pairs and accepted tracking/checkout behavior not externally exercised. | Confirm accepted bundle mappings and verify staged behavior. |
