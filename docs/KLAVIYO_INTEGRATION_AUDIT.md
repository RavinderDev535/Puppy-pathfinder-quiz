# Klaviyo Integration Audit

Audit date: 2026-10-10. Compared code paths with the supplied non-Lovable tracking workbook and functional briefs. No test events or profile updates were sent. A queued event or browser log is not proof of delivery.

| Requirement | Existing code | Audit result |
|---|---|---|
| EZclassic event/property schema | `src/lib/quiz-tracking.ts`, `src/lib/quiz-lanes/client.ts`, server queue/profile route. | PARTIAL: code exists, exact receipt/payload/profile was not externally checked. See workbook-derived event list in implementation source; actual delivery NOT VERIFIED. |
| Cart URL profile persistence | Profile queue supports recommended cart URL properties for profile-bound lanes. | NOT VERIFIED: no connected staging profile. |
| Abandonment and checkout events (separate `EZwhelp_Quiz_Fix_Plan.docx`) | Local legacy tracking defines start/step/abandon/completed/cart/checkout helpers. `trackCheckout()` has no local callsite; queued pre-email events are not confirmed flushable. | PARTIAL/NOT VERIFIED. Do not treat as implemented end-to-end. |
| Gift anonymous/session events, no profile | Server flush deliberately excludes `surface='gift'`. | BLOCKED conflict: client sheet asks for session-attached events but no-profile rule excludes profile-bound delivery. Need client-approved anonymous event transport. Do not add email capture/profile creation. |
| Upgrade email/events and `sizeup_blocked` | Event/client queue exists. | NOT VERIFIED: no exact live payload/delivery. Case-by-case test not yet run. |
| Restock intent/equipment/cart/email/reminder | Queue paths present; reminder consent now starts unchecked. | NOT VERIFIED externally. |
| Due date/DOB/go-home properties | Local date logic now writes stage-appropriate ISO property and DOB+56 date. | PASS in local tests only; profile persistence and downstream content-flow behavior NOT VERIFIED. |
| Bundle card clicks | Legacy tracking payload contains bundle name and card position. | PARTIAL: exact approved pairs/responsive clicks and delivered event not verified. |

## Evidence required before calling Klaviyo verified

Use an isolated Klaviyo staging account/profile, compare each event name and every required property with source tracking sheets, verify consent and event timing, confirm `recommended_cart_url` profile persistence, and export delivered events/profile state. No production profiles were touched in this audit.
