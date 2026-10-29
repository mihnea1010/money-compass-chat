# Offer integrity audit

## Findings
- `drizzle/migrations/0000_seed_demo_bank_offers.sql` inserted four explicitly invented offers but also bank homepages and a fixed `verified_on`. None supplies evidence for its product, percentages, caps, costs or validity. The applied historical file is retained unchanged, not re-run or rewritten.
- `0001_bank_offer_provenance.sql` adds explicit status/evidence, marks those existing rows `demo`, and clears their misleading source links. The legacy verification date is not displayed or considered evidence. Existing offers default to `unverified`.
- Wallet presets (BT, BCR, ING, Raiffeisen), including persisted copies, contain unsupported percentages. They remain available as visibly simulated benefits. User-entered benefits are unverified; neither drives genuine best-card recommendations.
- The home experience, card popovers/details, notification simulation and decorative cashback label now disclose simulated data. No simulated bank offer contributes to personal savings or offers a real activation/realized-savings action.
- Card-loop UI and Copilot context no longer assert unsupported bank thresholds, fees, rewards, lounge entitlements or consultation dates. Reminders based on the user's own credit balance/due date remain available. The unsupported BCR threshold alert is disabled.
- AI ordering receives only evidence-backed offers. AI output cannot upgrade an offer's status; unverified/demo explanations do not come from AI.

## Verification contract
`src/lib/offer-integrity.ts` defaults to unverified. A specific official page is necessary but never sufficient. Verified records require explicit editorial status, a valid non-future verification date, complete current terms and evidence for every relevant field (including explicit null limits). Each evidence entry has an official specific URL, supporting excerpt and the exact reviewed value. Changes to reviewed values invalidate the status.

Evidence must be reviewed by a human/source audit before setting `verified`; the application does not pretend that a stored excerpt or a live URL automatically proves truth. No current bank offer has evidence or has been promoted to verified during this audit. Unknown bank domains fail closed until their official domain is reviewed. Expired, future, incomplete or unsupported bank offers remain inspectable but have no monetary estimate or activation action.

Demo amounts are calculated only in the explicitly labelled illustrative scenario, never from an uploaded personal statement. Monetary fiscal calculations remain orientation based on user-declared values, not a verified bank offer.

## Scope preserved
Existing page structure, styling, carousel, card management, statement upload and seven-second demo notification/highlight flow are unchanged. No new screen, provider or dependencies were introduced.