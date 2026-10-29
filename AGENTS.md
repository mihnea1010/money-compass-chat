<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The home route renders the savings-offer experience; legacy chat URLs redirect home without reading or transmitting stored threads, preserving old bookmarks after the product pivot.
- Verified optimization rules and official-source catalog live in browser-safe library modules; components consume deterministic calculations so estimates, expiry and user-confirmed savings stay separate.
- Bank offers live in the public read-only `bank_offers` table; estimates are computed in browser-safe modules and an AI server function only reorders them from aggregated monthly category totals, so statements, settings and confirmations stay browser-local.
- Bank-offer provenance is fail-closed in `offer-integrity.ts`: explicit status plus field-matched official evidence is required for real estimates/actions; demo estimates run only in labelled illustrative scenarios, and wallet presets never drive real cashback recommendations. Historical applied migrations remain unchanged; additive provenance migrations correct existing rows.
- Subscriptions and open-source swaps are shown only on the Abonamente page (route /extra, labelled "Abonamente" in Romanian), with swaps above the complete subscription list, keeping savings offers and the visitor landing focused.
- The vault's no-statement state is tinted with the semantic `--await` token set and the `await-panel` utility defined per theme in `src/styles.css`, never with `--warning` or a literal yellow — `--warning` stays reserved for spending alerts, and the panel gradient must mix `in oklch` because interpolating `in oklab` cancels the yellow's chroma into grey.
- The /acasa visitor landing checks the browser-local profile after hydration and redirects existing profiles to /; it never treats local profile presence as authenticated access to private server data.
- Illustrative savings scenarios are isolated from personal Seif data and explicitly labeled; missing eligibility or costs produces no monetary card estimate, avoiding unsupported promises.
- Selected-text explanations are mounted once in the root shell and stream through `/api/explain`; only the selected text is sent, without profile, statement context or persistent storage, to minimize disclosure.

- Phone app ships via Capacitor (capacitor.config.ts loads the hosted web app); store detection runs in browser-safe lib/store-presence.ts with OpenStreetMap lookup, and user cards stay browser-local.
- Card savings popovers render through a body-level portal placed from the card's viewport rect (flipping below when near the top), never as in-flow carousel content — the carousel viewport clips in-flow overlays, and reserving space for them pushed the card row down, which the user rejected.
- Auth is subscribed once by the root AuthProvider, validates users and discards stale profile reads; profile UI derives signed-out/name-only/complete states from that shared context.
- Account deletion targets only the validated caller in an authenticated server function; privileged clients load only inside the handler.
- CardDetailDialog mounts per selected card and keeps demo unlock input ephemeral; fictitious test details never originate from stored real card data.
- AddCardDialog collects only the 6-digit BIN and the last 4 digits (no CVV field, no PAN, so no Luhn check is possible), validated with React Hook Form and a shared Zod/card-validator schema; only last four digits, network and wallet metadata are persisted, never full numbers, CVV, holder or expiry, to avoid storing payment credentials.
- The wallet's single source of truth is the zustand store `src/store/useStore.ts` (persisted to localStorage key `bestsaves.userCards.v1`); legacy `bestsaves.myCards.v3` is migrated once via `bootstrapCards()` called from `useEffect`, never at module scope, so SSR renders stay consistent.
