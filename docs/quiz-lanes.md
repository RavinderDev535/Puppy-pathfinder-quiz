# Version 2 quiz lanes

All five routes use the existing `?path=new` reference shell, question-card styles,
answer buttons, responsive column widths and `PuppyScene` video component:

- `/quiz?quiz=ezclassic`
- `/quiz?quiz=fab`
- `/quiz?quiz=restock`
- `/quiz?quiz=upgrade`
- `/quiz?quiz=gift` (guest shopping, no required questions or email capture)

The original new/existing bundle flows remain separate and unchanged.

## Data and runtime

`src/lib/quiz-lanes/reference-data.json` contains the 177-breed mapping from the
supplied Quiz Files workbooks, compatibility rules from the supplied handovers and
public reference application, and variant identities from the public EZwhelp
catalogue. It contains no cached product prices or availability. The import script
takes three JSON inputs: extracted workbooks, the Shopify public products response,
and the reference compatibility configuration. Test-workbook rows are retained in
`src/test/fixtures/quiz-workbooks.json`; retaining them is not a claim that every
workbook acceptance case has been manually signed off.

Run `npm run dev` for local development. Production requires `npm run build` and
`npm start` (Node 22+), or an equivalent backend serving `/api/quiz-lanes/*`.
A static-only deployment will not provide the product/email API. Product prices
and availability are resolved server-side from the public Shopify product endpoint,
cached briefly, and checked again at checkout. Unresolved or unavailable required
items disable checkout. No test orders were placed.

## Email and tracking setup

Set `KLAVIYO_PRIVATE_API_KEY` and `KLAVIYO_LIST_ID` on the server only; see
`.env.example`. Never prefix these secrets with `VITE_`. Without credentials,
results remain usable, but email follow-up and analytics are unavailable and the
UI must not claim an email was sent. Profile properties are written before list
subscription; previous consent timestamps and suppressed statuses are retained.
Gift does not collect email or call the profile-capture endpoint.

Checkout links do not prove a customer reached Shopify checkout. Actual
`Checkout Started` and purchase events need Shopify-side tracking. No live email
subscription, campaign delivery, or purchase integration has been verified.

## Verification

`npm test` covers existing flows plus shared layout/navigation, all breed mappings,
restock product resolution, gift pads, date validation, tall size-up kits, cart
merging and required Fab rails. Desktop (1200px) and mobile (390px) browser checks
confirmed the five lanes share the reference column widths, show the video, and
have no horizontal overflow. Gift/results screens retain their necessary product
content inside that shared shell; they are not copies of a question screen.
