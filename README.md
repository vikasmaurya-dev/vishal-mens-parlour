# Vishal Mens Parlour

Production website + guest booking + admin CMS for Vishal Mens Parlour.
Built with React 19, Vite, Tailwind 4, Supabase (Postgres, Auth, Storage, Edge Functions).

## What's inside

- **Public site**: Home, Services, Gallery, About, Contact — SEO-tagged, testimonials wired.
- **Guest booking**: 6-step flow with service → date → slot → details → email OTP → confirm. Real-time availability, honeypot spam protection, rate-limited OTP.
- **Manage booking**: Signed-token link in confirmation email → customer can reschedule or cancel without an account.
- **Admin CMS**: Login (with forgot password), dashboard KPIs, appointments with pagination + filters, calendar, customers, services, website content, drag-drop image uploader.
- **Postgres safety**: Exclusion constraint prevents overlapping active appointments even under concurrent writes.
- **Email**: Customer confirmation + owner notification via Resend.
- **Verification**: 4-digit OTP delivered via email (Resend). No SMS / DLT / MSG91 setup required — India-friendly and free within Resend's tier.
- **Analytics**: Google Analytics 4, opt-in via env var.
- **Error boundary**: Friendly fallback on unexpected errors.
- **Admin auth guard**: Blocks unauthenticated access to `/admin/*` before render.

## Prerequisites

- Node.js 20+
- npm
- A Supabase project (URL, publishable key, service role key)
- Optional: MSG91 account (for real OTP SMS in India), Resend account (for email)

## Install & run

```bash
npm install
npm run dev
```

The site runs on `http://localhost:5173`. Without Supabase env vars, it uses local seed data (perfect for demos).

## Build & test

```bash
npm run build
npm test
```

## Environment

Copy `.env.example` to `.env.local` and fill:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_PUBLIC_SITE_URL=https://your-domain.com
VITE_GA_MEASUREMENT_ID=            # optional, e.g. G-XXXXXXXX
```

**Never** commit `.env.local` or `.env`. Server-only secrets go into Supabase Edge Function environment (see below), never into `VITE_*` variables.

## Supabase setup — one-time

1. **Create a Supabase project**, note the URL, publishable key, and service role key.
2. **Link the CLI** (already configured):
   ```bash
   npx supabase link --project-ref cffcxcmsygmkxpfbzqsz
   ```
3. **Run migrations** (in order):
   ```bash
   npx supabase db push
   ```
   This applies:
   - `202609010001_initial_schema.sql` — full schema + RLS + `create_guest_booking` RPC.
   - `202609060001_storage_policies.sql` — public read on `site-media` bucket.
   - `202609070001_otp_rate_limits_and_hardening.sql` — OTP throttling.
   - `202609070002_manage_booking.sql` — signed-token reschedule/cancel.
4. **Seed** (optional catalog data):
   ```bash
   npx supabase db execute --file supabase/seed.sql
   ```
5. **Create storage buckets** in the Supabase dashboard: `site-media` (public read).
6. **Deploy edge functions**:
   ```bash
   npm run deploy:functions
   ```
   Deploys: `request-otp`, `verify-otp`, `create-booking`, `send-booking-emails`, plus optionally `manage-booking`.

## Edge Function secrets

Set these once in the Supabase dashboard → Project Settings → Edge Functions → Environment Variables:

| Key | Value | Notes |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | (from Supabase → API) | Server-only. |
| `OTP_PEPPER` | random 32+ char string | Rotates the OTP hash space. |
| `DEVELOPMENT_OTP_MODE` | `false` in production | If `true`, request-otp returns the code in the response for local testing. |
| `EMAIL_FROM` | `Vishal Mens Parlour <bookings@yourdomain.com>` | Must be a verified sender in Resend. Used for OTPs and confirmations. |
| `RESEND_API_KEY` | `re_...` | Get from resend.com/api-keys. Required for OTP delivery. |
| `OWNER_NOTIFICATION_EMAIL` | owner's email | Where booking alerts go. |
| `MANAGE_LINK_SECRET` | random 32+ char string | Used to sign reschedule/cancel tokens. |
| `PUBLIC_SITE_URL` | `https://your-domain.com` | Used to build the manage-booking link in email. |

Missing secrets fail closed — bookings still succeed, but SMS/emails silently skip. Check function logs during setup.

## First admin user

Do NOT ship a default admin password. Create the first user manually:

1. Supabase Dashboard → Authentication → Add user (email + password).
2. Table Editor → `admin_profiles` → Insert row: `id` = the new user's UUID, `full_name`, `role` = `OWNER`, `active` = `true`.
3. Log in at `/admin/login`.
4. From then on, additional admins can be added via SQL or the admin panel.

## Resend quick setup (email OTP + confirmations)

1. Sign up at **[resend.com](https://resend.com/signup)** — free tier includes 3000 emails/month.
2. **Verify your sending domain** — Resend dashboard → Domains → Add. Copy the DNS records into your domain registrar (Namecheap, GoDaddy, etc.). Takes 10-30 min to propagate.
   - For testing without a domain: use `onboarding@resend.dev` as `EMAIL_FROM` (Resend's shared testing sender).
3. **Create an API key** — Dashboard → API Keys → Create → copy.
4. Set these secrets in Supabase Edge Function environment:
   - `RESEND_API_KEY=re_...`
   - `EMAIL_FROM="Vishal Mens Parlour <bookings@yourdomain.com>"`
   - `OWNER_NOTIFICATION_EMAIL=owner@vishalmensparlour.com`
5. Deploy the request-email-otp function: `npx supabase functions deploy request-email-otp`.
6. Test the booking flow — a 4-digit code should arrive in the customer's inbox within seconds.

**Why email instead of SMS?** SMS in India requires DLT registration + a paid gateway (MSG91/Twilio/etc.) — 2-4 days of paperwork before you can send. Email OTP is free within Resend's tier, delivers instantly, and needs no government registration. Almost every customer already has an email address.

## Google Analytics 4 (optional)

Set `VITE_GA_MEASUREMENT_ID=G-XXXXXXXX` in `.env.local` and rebuild. Page views are auto-sent on route change; no other setup needed.

## Deploy

The Vite build outputs a static `dist/` folder. Host it anywhere: Netlify, Vercel, Cloudflare Pages, S3+CloudFront. Point your DNS at the host, set `VITE_PUBLIC_SITE_URL` in the build environment, and you're live.

Remember to also:

- Update `public/sitemap.xml` with the production domain.
- Verify no `VITE_SUPABASE_URL` or key leaks into logs (grep `dist/`).
- Deploy edge functions with `npm run deploy:functions` after every server-side code change.

## Production checklist

- [ ] Real Supabase project set up, migrations applied.
- [ ] Storage bucket `site-media` created, public read policy applied.
- [ ] All edge functions deployed and env secrets set.
- [ ] First admin user created; log in works.
- [ ] Booking flow end-to-end: OTP arrives, appointment appears in admin, confirmation email arrives.
- [ ] Manage-booking link in email works: shows details, allows reschedule + cancel.
- [ ] MSG91 rate limit not exceeded during test (3/hour per phone by design).
- [ ] Owner email receives booking alerts.
- [ ] `public/sitemap.xml` updated with production domain.
- [ ] `robots.txt` allows/disallows as intended.
- [ ] GA4 measurement id set if analytics needed.
- [ ] Hero PNG optimized (WebP recommended for LCP).
- [ ] Domain configured with HTTPS.
- [ ] Backup schedule set in Supabase.

## Handoff — for the salon owner

See `HANDOFF.md` for a plain-language guide on how to log in, add a service, change opening hours, block a holiday, and read today's bookings.
