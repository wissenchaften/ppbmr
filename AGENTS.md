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

# Project rules

- Article publishing is enforced in the database (trigger forces non-admin writes to `pending`); admins choose `public` or `members` visibility — keeps moderation tamper-proof.
- Workshop ownership is assigned by admins via the `assign_workshop_owner` RPC; the first registered user becomes admin — no client-side role checks are trusted.
- Maps use keyless Google Maps embed/direction URLs (src/lib/maps.ts) — no API key needed.
