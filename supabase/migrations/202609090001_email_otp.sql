-- Email-based OTP verification (India-friendly: no SMS/DLT required).
-- Adds an email column to otp_verifications and swaps create_guest_booking
-- to bind the OTP to the customer's email instead of phone.

alter table otp_verifications
  add column if not exists email text;

create index if not exists otp_verifications_email_created_idx
  on otp_verifications (email, created_at desc);

alter table otp_rate_limits
  add column if not exists email text;

create index if not exists otp_rate_limits_email_time_idx
  on otp_rate_limits (email, created_at desc);

-- Replace create_guest_booking: OTP is now bound to email, not phone.
-- Phone is still stored on the customer record and appointment for owner contact.
create or replace function create_guest_booking(
  p_otp_id uuid,
  p_customer_name text,
  p_phone text,
  p_email text,
  p_service_id uuid,
  p_staff_id uuid,
  p_start_at timestamptz,
  p_notes text
)
returns table(appointment_id uuid, booking_reference text, start_at timestamptz, end_at timestamptz)
language plpgsql
security definer
as $$
declare
  v_service services%rowtype;
  v_customer_id uuid;
  v_end_at timestamptz;
  v_reference text;
  v_normalized_email text := lower(nullif(trim(p_email), ''));
begin
  if v_normalized_email is null then
    raise exception 'EMAIL_REQUIRED';
  end if;

  select * into v_service from services where id = p_service_id and active = true and bookable = true;
  if not found then
    raise exception 'SERVICE_NOT_BOOKABLE';
  end if;

  select id into v_customer_id from customers where phone = p_phone for update;
  if v_customer_id is null then
    insert into customers(name, phone, email, first_visit, last_visit, appointment_count)
    values (p_customer_name, p_phone, v_normalized_email, p_start_at::date, p_start_at::date, 0)
    returning id into v_customer_id;
  else
    update customers
    set name = p_customer_name,
        email = coalesce(v_normalized_email, email),
        last_visit = p_start_at::date,
        updated_at = now()
    where id = v_customer_id;
  end if;

  -- OTP consumption is now bound to email (case-insensitive), not phone.
  update otp_verifications
  set used_at = now()
  where id = p_otp_id
    and lower(email) = v_normalized_email
    and verified_at is not null
    and used_at is null
    and expires_at > now();
  if not found then
    raise exception 'OTP_NOT_VERIFIED';
  end if;

  v_end_at := p_start_at + make_interval(mins => v_service.duration_minutes);
  v_reference := 'VMP-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8));

  insert into appointments(
    booking_reference, customer_id, service_id, staff_id, start_at, end_at, status,
    service_price_snapshot, customer_notes
  )
  values (
    v_reference, v_customer_id, p_service_id, p_staff_id, p_start_at, v_end_at, 'PENDING',
    coalesce(v_service.discount_price, v_service.price, 0), p_notes
  )
  returning id, appointments.booking_reference, appointments.start_at, appointments.end_at
  into appointment_id, booking_reference, start_at, end_at;

  update customers
  set appointment_count = appointment_count + 1
  where id = v_customer_id;

  return next;
exception
  when exclusion_violation then
    raise exception 'SLOT_UNAVAILABLE';
end;
$$;
