# Vishal Mens Parlour

Production-ready React/Vite/Supabase starter for the Vishal Mens Parlour public website, guest booking flow, and admin CMS.

## What is included

- Public website routes: Home, Services, Gallery, About, Contact.
- Guest booking flow: service, date, server-style availability, customer details, 4-digit OTP step, confirmation.
- Admin CMS shell: login, dashboard, appointments, calendar, customers, services, website content/settings.
- Supabase migration with CMS tables, admin profiles, customers, appointments, OTP verifications, notifications, reminders, SEO, RLS, and overlap-safe appointment constraints.
- Supabase Edge Function entry points for OTP request and atomic booking creation.
- Tests for phone normalization, duration-based availability, overlap detection, blocked slots, and conflict handling.

## Prerequisites

- Node.js 20 or newer.
- npm.
- A Supabase project for production data, Auth, Storage, and Edge Functions.

## Install

```bash
npm install
```

## Environment

Copy `.env.example` to `.env.local` and fill the frontend-safe values:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PUBLIC_SITE_URL=
```

Keep these server-only values in Supabase Edge Function secrets, not in client bundles:

```bash
SUPABASE_SERVICE_ROLE_KEY=
OTP_PEPPER=
SMS_PROVIDER=
SMS_PROVIDER_URL=
SMS_PROVIDER_API_KEY=
EMAIL_PROVIDER=resend
RESEND_API_KEY=
OWNER_NOTIFICATION_EMAIL=
```

`DEVELOPMENT_OTP_MODE=true` is only for local development. Never enable it in production.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/migrations/202609010001_initial_schema.sql`.
3. Run `supabase/seed.sql` for local/example content.
4. Create public storage buckets for site media, such as `public-media`, `hero`, `services`, `gallery`, `offers`, and `staff`.
5. Add storage policies so anonymous users can read public media and only authorized admins can upload or delete.
6. Deploy `supabase/functions/request-otp`.
7. Deploy `supabase/functions/create-booking`.
8. Set Edge Function secrets for service role, OTP pepper, SMS provider, and email provider.

## First Admin

Do not ship a default admin password. Create the first admin user in Supabase Auth, then insert a row into `admin_profiles` with role `OWNER` for that user id. After that, manage additional admins from the CMS.

## Development

```bash
npm run dev
```

The app uses local seed data when Supabase environment variables are absent. Once Supabase is configured, frontend CMS reads can be routed through the typed service layer in `src/services/cms.ts`.

## Build

```bash
npm run build
```

## Tests

```bash
npm test
```

The first test suite covers critical booking logic. Add database integration tests around `create_guest_booking` once Supabase CLI is connected.

## Security Notes

- Customers book as guests; no customer Supabase Auth account is created.
- Admin routes should be paired with Supabase Auth and RLS checks before production launch.
- Appointment overlap protection is enforced in PostgreSQL with an exclusion constraint for active statuses.
- OTP hashes are stored with a server-side pepper and expiry.
- Do not expose SMS, email, or service role credentials to the Vite frontend.
- Public RLS policies are read-only for public content.

## Production Checklist

- Confirm services, offers, gallery, business details, opening hours, and SEO are editable from admin workflows.
- Verify invalid, expired, and reused OTPs are rejected.
- Verify booked slots disappear and final booking creation rejects race-condition conflicts.
- Verify holidays and blocked times affect availability.
- Verify owner notification emails are delivered.
- Verify mobile public pages and mobile admin screens.
- Verify no secrets are present in built assets.
- Update `public/sitemap.xml` with the production domain.
