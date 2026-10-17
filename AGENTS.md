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

- Admin (/admin) authorizes every server call by comparing the password to the ADMIN_PASSWORD secret server-side; why: no user accounts exist for admins.
- Public review reads use REVIEW_COLS; why: email_hash is private.

- Company lists load 24 with DB filters; review stats use triggers. Why: 20k rows froze the site.
- Chain stores are separate company rows linked by parent_brand; each row is one branch with its own address, and createCompany returns the existing branch when brand+city+address match. Why: avoid duplicate branches.
- Paid job offers use dynamic app_settings pricing, Stripe checkout, paid_until, and admin-controlled publication/expiry. Why: admin controls commercial rules without code changes.
- Offer contacts reveal email/phone to signed-in users only; candidates contact posters directly. Why: protect contact details.
- Free offers require sign-in and expire after offer_days; all reviews require sign-in, remain publicly anonymous, and are auto-verified. Why: guests only browse while accounts unlock participation.
- Google reviews show max 2 only with zero employee reviews, cached 10 min. Why: fill empty pages without mixing review types.
- Email uses StaffAdvisors <info@staffadvisors.it>; contact, company-reply and listing-published confirmation alerts send after saving and never block submissions. Why: data survives temporary delivery failures.
- Company replies auto-publish only when sender and official-site domains match; others stay pending. Why: verification without admin work.
- Availability ads may carry one optional PDF CV in the private "cv" storage bucket (owner-folder upload); it is never shown in page and downloads only via a short-lived signed link from a signed-in server function. Why: share CVs without exposing them publicly.
- Root is the brand landing; the searchable platform lives at /app. Why: introduce the service before the directory.
- HomeLink uses public home for every account; HomeNavigationProvider gates the inline BusinessReturnButton by business membership or signup intent. Why: companies browse normally and return through a dedicated top-menu action.
- Seasonal decorations are date-driven and render only on the root landing; why: keep /app and the classic off-season experience unchanged.
- The worker-availability board lives at /bacheca-disponibilita and /bacheca-lavoro only redirects there; why: the old address was already published and may be bookmarked or shared.
- Availability listings are searched server-side and never expose phone/email to any browser; signed-in users send a contact request (no daily cap) that emails both parties and is logged for admin; why: contacts travel only between the two people involved.
- All visible brand marks and install/share icons derive from the official square logo; why: keep the website, installed app, splash screen, search, and sharing identity consistent.
- Availability contact-request log is auto-deleted after 60 days (on new request and admin load); why: keep personal data (IP) only as long as needed for abuse checks.
- The disponibilita_dates trigger owns created_at/expires_at/is_active, so clients never write those columns; renewal goes through the renew_availability RPC (owner-checked) and an explicit future expires_at is honored for renewals. Why: expiry rules stay enforced in one place.
- The per-user cap on active availability listings (currently 5) is enforced by the check_disponibilita_limit trigger; the old unique index on user_id is gone. Why: one owner can have several ads and the cap lives in one place.
- Sign-ups are reported to Google Analytics as the GA4 `sign_up` event (once per account, in src/lib/analytics.ts); why: Google Ads imports it as the "Registrazione" conversion to optimize the campaign.
- Business membership lives in company_accounts; token RPCs save partial/final responses once per device; only owners/admin read results. save_survey_progress and owner-checked end_company_survey lock the survey row. Why: closure blocks new writes and retains partial answers privately.
- Survey summaries default to localSurveySummary (computed on the data, no cost); the AI one is used only when app_settings.survey_ai_enabled is on and the call works. Previews reuse the authenticated report call and stay in page state. Why: a synthesis always reaches the owner without credits.
- Business accounts link one company page via company_accounts.company_id; official replies from /area-aziende publish instantly only when the account email matches the company's website domain, otherwise they become pending reply_requests. Why: nobody can speak for a company they don't own.

- Both account areas share DeleteAccountSection and authenticated deleteMyAccount; detach reviews, remove owned surveys/membership, preserve company pages/replies. Why: retain public contributions without orphaning private data.
- The survey download ZIP includes a self-contained risultati.html results page with charts; keep it in sync with CSV, riepilogo and sintesi.txt when exports change. Why: phone-friendly results, chosen by the owner.
