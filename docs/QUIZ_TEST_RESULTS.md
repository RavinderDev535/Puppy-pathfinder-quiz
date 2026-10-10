# Quiz Test Results

Audit date: 2026-10-10. Client source files reviewed recursively; every Lovable-named file excluded. No Shopify/Klaviyo or production database actions were performed.

## Automated test runs

| Run | Result | Evidence |
|---|---|---|
| Focused date, path2, breed source tests | PASS: 98 tests across 3 files. | `capture-date-of-birth.test.ts` 7; `path2-lifecycle.test.ts` 87; `client-breed-mapping.test.ts` 4. |
| Fab source matrix | FAIL: first mismatch FAB-013. | Expected Stack Kit listed as unticked for Fab 3x3; source product map has no stack SKU for 3x3 (`stack: null`). No SKU invented. The whole matrix did not pass. |
| Full Vitest suite after changes | FAIL: 371 passed, 1 failed, 372 total across 16 files. | Sole failure is Fab matrix at FAB-013. Prior suite before new checks had 358 passing tests; this does not substitute for client cases. |
| Build | NOT RUN after latest source edits. | Run `npm run build` after audit changes. |
| ESLint | FAIL: 34 errors, 21 warnings. | `npm run lint`; broad existing `any`, empty block/interface, hook dependency, and config import findings. One new `prefer-const` finding in touched lifecycle file was corrected; lint rerun still fails on remaining findings. |

The sandbox denied esbuild process spawning (`spawn EPERM`); approved elevated Vitest and build runs executed. Production build passes with stale Browserslist and large-chunk warnings. No external integrations were invoked.

## Source workbooks and client cases

The client workbooks were read in full. Case rows are preserved in `src/test/fixtures/quiz-workbooks.json`; workbook fixture presence alone is not a PASS. The tested source-derived coverage is limited to the checks listed above.

| Quiz | Source case execution | Result |
|---|---|---|
| EZclassic Single Box | Breed mapping and selected date behaviors executed. Full positive/negative result, bundle, price, and purchase cases not run individually. | PARTIAL; remaining NOT VERIFIED. |
| Fab System Single Box | Breed map/fallback tests pass; matrix test reaches and fails at FAB-013. Remaining matrix rows and behavior/negative cases not confirmed. | FAIL / NOT VERIFIED. |
| Gift a Breeder | Product/size, persistence, availability, checkout, and negative cases not executed one by one. | NOT VERIFIED. |
| Upgrade My Setup | SKU, size/space/program/negative client cases not executed individually. | NOT VERIFIED; six SKUs and package signoff blocked. |
| Restock & Repair | Compatibility, unavailable product, persistence, live-price and checkout cases not run individually. | NOT VERIFIED. |

## Integration and evidence tests

| Requirement | Status | Reason |
|---|---|---|
| Shopify product/variant/inventory/live-price verification | BLOCKED | No safe staging credentials/catalog evidence. Current cart URL generation code is not external verification. |
| Klaviyo events/profile property delivery | BLOCKED | No Klaviyo staging delivery/export access. Browser/queue code is not delivery evidence. |
| Railway staging DB isolation | BLOCKED | Deployment target/DB identity unavailable. No DB accessed or changed. |
| E2E/mobile/tablet/desktop browser acceptance | NOT VERIFIED | No staging browser evidence captured. |
| EZclassic evidence pack (workbook, screenshots/PDF, Klaviyo export, cart URL list, negative recordings) | BLOCKED | Cannot fabricate artifacts; connected staging access unavailable. |
