# Bundle quiz changes

The existing question flow and bundle recommendation engine are unchanged. The results component uses that engine for both cards, resets optional add-ons on every bundle switch, and builds a production Shopify cart permalink from the selected items.

## Deployment

Deploy the frontend and the updated Node API together. `VITE_API_URL` must point to the API deployment containing these changes. The API now permits the verified bundle product handles at `/api/quiz/lanes/products/:handle` and queues results events at `/api/quiz/lanes/bundle-events`.

Set the server-only `KLAVIYO_PRIVATE_API_KEY` with event-write access. Events are persisted and retried by the existing worker, attached to the quiz's submitted email. This does not change subscription consent or lists. Never put the private key in a `VITE_*` setting.

## Verification

- Production product JSON was retrieved for 22 products on 2026-11-02; configured bundle and add-on IDs matched. `scripts/verify-live-bundles.mjs` refreshes the verification catalog. Runtime prices come from the live API, not this snapshot.
- The missing 28 × 28 Two Room Condo ID was confirmed as `55237173838196`.
- A live bundle-plus-add-on cart permalink returned HTTP 302 to Shopify checkout. No order was placed.
- Tests cover the bundle/size/wall/window matrix, selection resets, cart quantities and totals, missing variants, sticky visibility and switching, Condo eligibility and variants, date validation, and server event delivery.
- Real-profile Klaviyo verification still requires account access and a designated real profile. The current environment has no configured private key. Automated delivery tests use a mock and do not substitute for this check.
- No external Klaviyo-hosted email templates were available in this workspace; the two requested text lines were removed from their source occurrence, and no other occurrences remain in application/server source.

## Live acceptance check

On the deployed app, complete the quiz with the designated profile email. Select each card, then scroll below the cards and switch in the bottom bar. Verify the optional selections reset, total changes, and scroll does not jump. Select an add-on and use Get bundle; check the checkout items and quantities. Click the Condo strip on an eligible result. In the real Klaviyo profile activity, confirm Bundle Card Clicked, Added to Cart, and Two Room Condo Link Clicked with the requested properties, including `two_room_condo_variant_id`.
