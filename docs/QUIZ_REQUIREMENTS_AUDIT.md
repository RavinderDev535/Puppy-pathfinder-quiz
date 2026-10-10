# EZWhelp Five-Quiz Requirements Audit

Audit date: 2026-10-10. Sources reviewed recursively from the supplied `Quiz Files` folder. Every non-Lovable XLSX worksheet was extracted, including rows, formulas/cached values, and visible notes; non-Lovable DOCX paragraphs/tables and README were reviewed. Files with `Lovable` in their names were excluded entirely and are not requirement sources.

Status meanings: PASS = behaviour exercised against source expectation; FAIL = executed mismatch; PARTIAL = some evidence, not complete; NOT IMPLEMENTED = confirmed absent; BLOCKED = external access or client decision required; NOT VERIFIED = not safely executed or not evidenced.

## Shared architecture and requirements

| Requirement / source | Existing implementation | Audit result, change, verification |
|---|---|---|
| Project architecture (repository inspection) | React 18, Vite, TypeScript; Node backend in `server/`; React quiz lanes under `src/components/quiz-lanes/`; shared recommendation functions in `src/lib/quiz-lanes/engine.ts`; Shopify and Klaviyo adapters/routes in `server/` and `src/lib/`; tests Vitest. | PARTIAL: static architecture identified. Active deployment, Railway staging DB isolation, and live service targets were not inspected. No production database used. |
| Shopify catalog, current prices, inventory, variants (source product workbooks/catalogs; live-data requirement) | Lane data has mapped SKUs/variant descriptors; cart server re-resolves live product data before checkout. | NOT VERIFIED: no staging credentials/catalog evidence. No prices or IDs are claimed independently verified. Unknown Upgrade SKUs remain unresolved. |
| Tracking schemas and profile writes (EZclassic `5_Tracking_Spec.xlsx`; other quiz logic/test sheets; DOCX briefs) | `src/lib/quiz-tracking.ts`, lane client, `server/quiz-api.mjs`, `server/quiz-profile.mjs`. | PARTIAL/BLOCKED: code paths exist, but actual Klaviyo receipt and staging profile state were not inspected. Local queue delivery does not prove external delivery. |
| Shared form dates (Capture_Date_Of_Birth.docx) | `src/lib/quiz-config.ts`, `src/lib/lifecycle-engine.ts`, `src/components/EZWhelpQuiz.tsx`, lane engine. | PASS for tested local date properties: due stages produce ISO `due_date`; born stages produce ISO `dob` and DOB+56 `go_home_date`; invalid/future DOB rejected. Legacy path2 now offers Due in 7 days and submits only one date field. External profile delivery NOT VERIFIED. |
| Safe testing (user safety requirements) | SQLite default/config and tests present. | PASS: no DB contents read, no mutation, no live purchase/profile action, no deploy. BLOCKED: Railway staging isolation cannot be proven from local source. |

## Quiz 1 — EZclassic Single Box

| Source / section | Expected functionality | Existing implementation and issue | Change / evidence / status |
|---|---|---|---|
| `README.txt`; `0_Testing_Brief.docx`; `1_Logic_and_Schema.xlsx` question, condition, stage, summary sheets | Breed then conditional weight fallback; experience, stage; panel preference; stage-specific due/DOB; litter/email; answer summary and navigation. | `SingleBoxQuiz.tsx`, `engine.ts`, config and legacy lifecycle implement these paths. | PARTIAL: source-derived mapping and date tests pass; every question path and UI validation not individually run against the full case book. |
| `2_Breed_Mapping.xlsx` main map/additional breeds/fallback | All 177 mappings and 26 flagged additions, primary/alternative sizes and fallback. | `reference-data.json` now compared to source. | PASS: 177 source mappings, all 26 additions, fallback rows tested with zero discrepancies (`client-breed-mapping.test.ts`). |
| `3_Product_Data.xlsx`; `EZwhelp_Master_Catalog.xlsx`; `EZwhelp_Bundles_Master.xlsx` | Exact stage templates, experience defaults, pad quantities/substitutions, compatibility, bundle eligibility. | `engine.ts`, reference data and result/cards. | PARTIAL: source reviewed; this turn did not exhaustively execute every EZclassic result/test row. Current live inventory/prices and Shopify IDs NOT VERIFIED. |
| `Bundle_Quiz_Show_Both_Options.docx` separate change request | Show approved recommended/alternative bundle pair, order and tracking. | Legacy path1 already has paired bundle cards and click event properties. | PARTIAL: code evidence exists; exact pair walkthrough, responsive behaviour, checkout and actual event delivery NOT VERIFIED. Kept separate. |
| `4_Test_Cases.xlsx`, `0_Testing_Brief.docx` | Execute all client cases; produce named workbook, screenshots/PDF, Klaviyo export, cart URL list and negative recordings. | Test fixture exists; no connected staging/browser evidence environment. | NOT VERIFIED/BLOCKED: evidence artifacts not fabricated; full client workbook not executed. |

## Quiz 2 — Fab System Single Box

| Source / section | Expected functionality | Existing implementation and issue | Change / evidence / status |
|---|---|---|---|
| `1_Logic_and_Products.xlsx` flow, breed, fallback, seconds, template, experience, product sheets | Question path; 177 breed map; only 3x3/4x4/4x6; rails locked; seconds disclosure for 3x3 and 4x6 only; no bundles; stage and experience-specific accessories; jump-based stack card. | `SingleBoxQuiz.tsx`, `engine.ts`, reference data. `singleShelf` incorrectly exposed heat and pads as unticked for experienced categories. | FIXED: removed Fab heat offer for 3–5 and 6+; removed pads for 6+ per matrix. Factory-seconds notice clarified with powder-coat damage, unaffected frame/mesh/liner/function, and as-is/nonreturnable/nonrefundable terms. Regression matrix currently FAILS at FAB-013 because expected Stack Kit has no resolvable stack SKU for 3x3 (`stack:null` in product map); no ID invented. |
| `2_Test_Cases.xlsx` result matrix + behaviour/negative cases | 80 result-matrix rows include checked/unchecked lines and stock/seconds/third card expectations; negative cases exercise errors. | Source-derived `fab-client-matrix.test.ts` runs the 80-row result matrix. | FAIL: one observed unresolved mismatch at FAB-013 (stack kit unavailable in mapped 3x3 footprint). Remaining matrix rows stop at first mismatch and are NOT VERIFIED. Do not mark 80 passed. |
| `03 Breed to Fab size` and fallback | Every breed to Fab recommendation; weight fallback; Whopper availability handling. | Source-derived exhaustive comparisons. UI does not currently select 7x6 through listed mappings. | PASS: 177 listed Fab breed mappings match; fallback tests pass. BLOCKED conflict: case matrix includes 7x6 while breed map/fallback and UI offer 3x3/4x4/4x6 only; FAB-069 says a breed maps to 7x6. Client clarification required. |
| Cart / safety | Every Fab cart includes locked matching rails; no EZclassic bundles; valid live checkout and stock state. | `requiredBox()` returns box plus locked rails; source review shows no Fab bundle flow. | PARTIAL: locked rail invariant exercised in matrix before mismatch; live Shopify availability/checkout NOT VERIFIED. |
| Fab Klaviyo and complete tests | Required events/profile fields and delivered events; all test cases. | Lane tracking/backend queue. | BLOCKED/NOT VERIFIED: no connected Klaviyo or Shopify staging evidence. |

## Quiz 3 — Gift a Breeder

| Source / section | Expected functionality | Existing implementation and issue | Change / evidence / status |
|---|---|---|---|
| `1_Logic_and_Schema.xlsx` catalog/size/event rules; `2_Test_Cases.xlsx` | Gift-only catalog and required variants; no quiz questions, email gate or profile; quantity/cart persistence, duplicate merge, availability and checkout. | `GiftQuiz.tsx`, `Cart.tsx`, lane engine/catalog. Existing state supports add/remove/quantity, merges and local persistence. | PARTIAL: source reviewed; individual product/size cases, refresh/navigation, and Shopify checkout not executed against a live safe catalog. UI design retained. |
| Gift tracking/event requirement vs no-profile statement in source workbook | Anonymous/session events only; no customer profiling. | `server/quiz-api.mjs` intentionally excludes `surface='gift'` from profile-bound flush. | BLOCKED conflict: workbook requires session-attached events but current delivery queue excludes Gift. Need approved anonymous Klaviyo delivery method; do not add email/profile capture. |
| Gift test cases | All supplied Gift cases. | Existing fixture and tests do not fully demonstrate each source case. | NOT VERIFIED; live availability and variant IDs BLOCKED by Shopify access. |

## Quiz 4 — Upgrade My Setup

| Source / section | Expected functionality | Existing implementation and issue | Change / evidence / status |
|---|---|---|---|
| `1_Logic_and_Schema.xlsx` product/SKU table, sizing, litter/space paths, support, events; `2_Test_Cases.xlsx` | Six TALL size-up SKU variants; no Tall 28x28; breed-first sizing with weight fallback; exact litter/room choices; same or different size expansion; compatibility and email/tracking. | `UpgradeQuiz.tsx`, `engine.ts`, reference data. | PARTIAL: invalid Tall 28x28 removed; selecting a different size now excludes owned size and blocks add until a target is chosen; package contents marked unconfirmed; whale support link now includes owned config/quantity. |
| Six TALL Size-Up Kit SKU rows | Resolve exact SKUs; do not invent. | Six source rows have no SKU values. | BLOCKED: TALL38→48 solid/windowed; TALL38→48x76 solid/windowed; TALL48→48x76 solid/windowed require client/Shopify admin SKU assignment. No fabricated SKU. |
| Second whelping area contents | Show only approved package contents. | Workbook explicitly pending client signoff. | BLOCKED: UI now states contents are awaiting confirmation. |
| Upgrade client tests / `sizeup_blocked` | Exact recommendation, payload/event and case behaviour. | Local test fixture exists. | NOT VERIFIED: not all source case rows run individually; actual event delivery unavailable. |

## Quiz 5 — Restock & Repair

| Source / section | Expected functionality | Existing implementation and issue | Change / evidence / status |
|---|---|---|---|
| `1_Logic_and_Schema.xlsx` intent/equipment/compatibility/stock/email rules; `2_Test_Cases.xlsx` | Exact intent wording/branches; supported equipment; compatible parts and consumables; live prices/availability; cart persistence across equipment switch; email after cart action; optional reminders opt-in. | `RestockQuiz.tsx`, `engine.ts`, `Cart.tsx`, server Shopify path. Tall 28x28 invalid option excluded; cart persists. Reminder was preselected. | FIXED: reminder defaults off. PARTIAL: static compatibility/source review; live stock/prices, exact variants, checkout not verified. |
| All Restock client tests | Positive/negative logic, unavailable and network failure paths. | Test fixture and repository coverage. | NOT VERIFIED as a complete client case run; no live service calls. |

## Separate change requests

| Source | Expected functionality | Status / evidence |
|---|---|---|
| `Capture_Date_Of_Birth.docx` | Applies only to listed existing EZwhelp box, EZclassic Single Box, Fab Single Box, and Build My Perfect Bundle email collection; single stage-appropriate date; ISO; DOB+56 profile field; old DOB skip-weaning/next-cycle message. | Local date branch/date validation/go-home calculation updated and tested. Other flow applicability retained. Klaviyo profile/flow effects remain NOT VERIFIED. |
| `Bundle_Quiz_Show_Both_Options.docx` (duplicate also under EZclassic Other Briefs) | Both approved bundle cards, recommended first, correct pair, click properties, existing checkout. | Existing legacy UI/track props found. Exact source pair mapping and external tracking/checkout NOT VERIFIED. Separate from five quizzes. |
| `EZwhelp_Quiz_Fix_Plan.docx` | Started/step/abandoned/completed/cart/checkout; profile URLs; no $0 result; valid email links. | Static audit found legacy `trackCheckout()` with no local callsite; abandonment before profile capture is not flushed by queue path. Separate scope; functionality not confirmed end-to-end. |

## Coverage limits

Source workbook case IDs are preserved in `src/test/fixtures/quiz-workbooks.json`; test coverage is not inferred from fixture presence. This audit adds executed checks for source breed maps, date rules, and Fab matrix. Repository tests do not establish Shopify/Klaviyo delivery, responsive screenshots, cart checkout acceptance, or Railway staging isolation. All non-Lovable files reviewed are listed in `docs/QUIZ_TEST_RESULTS.md` and blockers are tracked in `docs/QUIZ_REMAINING_BLOCKERS.md`.
