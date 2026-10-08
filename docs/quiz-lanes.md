# Version 2 quiz lanes

All five routes use the existing `?path=new` reference shell, question-card styles,
answer buttons, responsive column widths and `PuppyScene` video component:

- `/quiz?quiz=ezclassic`
- `/quiz?quiz=fab`
- `/quiz?quiz=restock`
- `/quiz?quiz=upgrade`
- `/quiz?quiz=gift` (guest shopping, no required questions or email capture)

The original flows retain their routing, with the requested paired bundle cards and Add-Ons birth-date question.

## Data and runtime

`src/lib/quiz-lanes/reference-data.json` contains the 177-breed mapping from the
supplied Quiz Files workbooks, compatibility rules from the supplied handovers and
public reference application, and variant identities from the public EZwhelp
catalogue. It contains no cached product prices or availability. The import script
takes three JSON inputs: extracted workbooks, the Shopify public products response,
and the reference compatibility configuration. Test-workbook rows are retained in
`src/test/fixtures/quiz-workbooks.json`; retaining them is not a claim that every
workbook acceptance case has been manually signed off.

All seven quizzes call the existing Railway backend through VITE_API_URL.
Product prices, submissions, and events use /api/quiz/lanes/* for the five added quizzes.
Run npm run dev locally, or deploy the Vite build as with the original frontend.
The optional npm start command serves static files only.

Configure email credentials on the Railway backend, not in this frontend.
Gift remains anonymous. See [dashboard/Klaviyo handoff](dashboard-klaviyo-handoff.md).

## Verification

`npm test` covers existing flows plus shared layout/navigation, all breed mappings,
restock product resolution, gift pads, date validation, tall size-up kits, cart
merging and required Fab rails. Desktop (1200px) and mobile (390px) browser checks
confirmed the five lanes share the reference column widths, show the video, and
have no horizontal overflow. Gift/results screens retain their necessary product
content inside that shared shell; they are not copies of a question screen.
