# Quiz Fixes Completed

Changes made after reading the supplied non-Lovable source files. Client-source test details and external verification limits are in `QUIZ_TEST_RESULTS.md`.

| File | Root cause / change | Verification |
|---|---|---|
| `src/components/quiz-lanes/SingleBoxQuiz.tsx` | Fab seconds notice lacked exact powder-coat damage and unaffected components detail. Updated visible disclosure and as-is/nonreturnable/nonrefundable terms for applicable seconds. | Code review; browser acceptance not available. |
| `src/lib/quiz-lanes/engine.ts` | Fab experience shelf contradicted matrix for 3–5/6+ categories. Heat omitted for 3–5 and 6+; pads omitted for 6+; mandatory rails still locked. | Source matrix test added; currently FAIL at FAB-013 because 3x3 Stack Kit has no verified SKU. Do not claim matrix passed. |
| `src/components/quiz-lanes/Cart.tsx` | Optional reorder reminder was preselected. Default now false so consent is an explicit action. | Code review; Restock client E2E not available. |
| `src/lib/quiz-config.ts`, `src/lib/types.ts`, `src/lib/lifecycle-engine.ts`, `src/components/EZWhelpQuiz.tsx` | Legacy path2 omitted `Due in 7 days` and go-home profile value. Added stage option, mutually exclusive date branch, ISO validation, `go_home_date = dob + 56 UTC days`, and path2 properties. | Date/path2 unit tests pass (94 combined in focused run). Klaviyo property delivery not verified. |
| `src/components/quiz-lanes/UpgradeQuiz.tsx` | Different-size path could select currently owned size and add before target selection; contents were unconfirmed; whale support route omitted setup context. Now blocks/filters these selections, displays contents pending signoff, and includes owned setup/quantity in mailto body. | Code review only; full Upgrade client cases not run. |
| `src/test/fixtures/client-breed-mappings.json`, `src/test/client-breed-mapping.test.ts` | Added auditable source-derived breed mappings and tests, not invented mappings. | Pass: all 177 EZclassic and Fab mappings, 26 additional EZclassic entries, fallback rows. |
| `src/test/capture-date-of-birth.test.ts`, `src/test/path2-lifecycle.test.ts` | Added date and due_7 regression checks. | Pass in focused test run. |
| `src/test/fab-client-matrix.test.ts` | Added source-backed matrix test to catch selected/unticked Fab mismatch. | Executed; fails at FAB-013 due unresolved Stack Kit SKU for Fab 3x3. This is retained as a visible failing test. |

No product/SKU/variant value was invented. No external services, production data, or deployments were modified. Existing `.env*` changes were present in the working tree; this audit did not inspect their values or edit them.
