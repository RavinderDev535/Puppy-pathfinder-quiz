# Shopify Integration Audit

Audit date: 2026-10-10. Source workbooks/reference catalog reviewed. No Shopify API call, live cart, or purchase was executed. Spreadsheet capture prices are not treated as current prices. No credentials or production account data were accessed.

| Requirement | Code review | Verification/status |
|---|---|---|
| Current live prices and availability | Backend Shopify product endpoint and cart resolution path fetch product data; recommendation catalog includes local identifiers/labels. | NOT VERIFIED: no safe staging API access. No captured spreadsheet price is reported as current. |
| Variant IDs, SKUs, sizes and compatibility | Existing local data contains SKU and variant descriptors for quiz catalogs; cart resolves before checkout. | PARTIAL: no independent live catalog comparison. Six Upgrade Size-Up Kit SKUs remain blank in client source and must be supplied/created by client. Fab 3x3 Stack Kit expectation has no mapped SKU. |
| Fab mandatory rail lines | `requiredBox()` appends matching rails as locked; Cart preserves lock state. | Local invariant exercised before the Fab client matrix stops at FAB-013. External cart contents NOT VERIFIED. |
| Gift catalog and inactive products | Gift catalog and size arrays are locally mapped. | NOT VERIFIED against current Shopify availability; no inactive-product lookup. |
| Restock and Upgrade resolution | Cart path re-resolves data before producing checkout path and blocks unresolved products. | NOT VERIFIED with actual Shopify API failures, stock state, or safe checkout. |
| Checkout URL and cart quantities | Cart implementation constructs Shopify cart URL from resolved variants and quantities. | NOT VERIFIED: no test URL generated or opened against staging. No claim that checkout works. |
| Production safety | No API credentials read, purchase, or deploy. | PASS for this audit's non-use; staging and production separation still BLOCKED because deployment DB/API targets are not confirmed. |

## Required external verification

Provide a staging store/API arrangement and confirm it is isolated from production. Then compare each quiz's required SKU/variant/size/availability against live catalog, resolve all inventory-sensitive cases, verify cart URLs with safe test products, and capture checkout outcomes. Do not substitute missing variants or manufacture prices. See `QUIZ_REMAINING_BLOCKERS.md`.
