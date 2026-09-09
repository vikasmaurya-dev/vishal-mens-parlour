-- OTP hardening: rate-limit tracking + convenience indexes.

create index if not exists otp_verifications_phone_created_idx
  on otp_verifications (phone, created_at desc);

create table if not exists otp_rate_limits (
  id bigserial primary key,
  phone text,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists otp_rate_limits_phone_time_idx
  on otp_rate_limits (phone, created_at desc);
create index if not exists otp_rate_limits_ip_time_idx
  on otp_rate_limits (ip, created_at desc);

alter table otp_rate_limits enable row level security;
-- Only the service role (used by Edge Functions) can read/write. No public policies = deny all.

-- Best-effort periodic cleanup: keep last 24 hours only.
create or replace function purge_stale_otp_rate_limits()
returns void
language sql
as $$
  delete from otp_rate_limits where created_at < now() - interval '24 hours';
$$;

-- Documentation-only note: create_guest_booking already enforces
--   otp_verifications.phone = p_phone AND verified_at is not null AND used_at is null.
-- Exclusion violation on appointments rolls back the OTP consumption via subtransaction.
