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
- Subscriptions and open-source swaps are shown only on Reduce costs, with swaps above the complete subscription list, keeping savings offers and the visitor landing focused.
- The /acasa visitor landing checks the browser-local profile after hydration and redirects existing profiles to /; it never treats local profile presence as authenticated access to private server data.
- Illustrative savings scenarios are isolated from personal Seif data and explicitly labeled; missing eligibility or costs produces no monetary card estimate, avoiding unsupported promises.
- Selected-text explanations are mounted once in the root shell and stream through `/api/explain`; only the selected text is sent, without profile, statement context or persistent storage, to minimize disclosure.
