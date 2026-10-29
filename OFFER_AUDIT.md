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

## Changed files
- Database: `drizzle/migrations/0001_bank_offer_provenance.sql`; generated `src/integrations/supabase/types.ts` and migration metadata.
- Offer logic: `src/lib/offer-integrity.ts`, `src/lib/savings-offers.ts`, `src/hooks/use-savings.ts`.
- Offer presentation: `src/components/SavingsExperience.tsx`, `src/components/SavingsGraphic.tsx`, `src/routes/index.tsx`.
- Wallet and notifications: `src/lib/my-cards.ts`, `src/lib/card-input.ts`, `src/lib/simulate-store.ts`, `src/hooks/use-store-presence.ts`, `src/components/MyCards.tsx`, `src/components/CardDetailDialog.tsx`.
- Legacy rewards and AI context: `src/lib/card-loops.ts`, `src/lib/optimizations.ts`, `src/components/CardLoopVisualizer.tsx`, `src/lib/ai/chat.server.ts`, `src/lib/ai/explain.server.ts`.
- Tests: `src/test/offer-integrity.test.ts`, `src/test/savings-offers.test.ts`, `src/test/my-cards.test.ts`, `src/test/card-loops.test.ts`.
- Documentation: `AGENTS.md`, `roadmap.md`, `OFFER_AUDIT.md`.

## Validation
All 109 tests passed. Browser checks covered demo offer list/detail, a statement-present personal total of zero from demo bank offers, wallet popover/detail labels, and seven-second simulated notification opening the highlighted BT card. No browser runtime errors were observed. The explanation endpoint returned HTTP 200 and described the selected cashback as a demonstration rather than a verified offer. Latest automatic compilation succeeded.