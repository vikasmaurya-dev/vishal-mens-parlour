-- Reschedule/cancel via signed token in the confirmation email.
-- Requires the runtime secret `app.manage_link_secret` — the Edge Function
-- calls `set_manage_link_secret(...)` at the start of each request to inject it.

create or replace function set_manage_link_secret(p_secret text)
returns void
language plpgsql
security definer
as $$
begin
  perform set_config('app.manage_link_secret', p_secret, true);
end;
$$;

grant execute on function set_manage_link_secret(text) to service_role;

create or replace function sign_manage_token(p_booking_reference text)
returns text
language plpgsql
security definer
as $$
declare
  v_secret text := current_setting('app.manage_link_secret', true);
  v_appointment_id uuid;
begin
  if v_secret is null or length(v_secret) = 0 then
    raise exception 'MANAGE_LINK_SECRET_NOT_CONFIGURED';
  end if;
  select id into v_appointment_id from appointments where booking_reference = p_booking_reference;
  if v_appointment_id is null then
    raise exception 'BOOKING_NOT_FOUND';
  end if;
  return encode(hmac(p_booking_reference || '|' || v_appointment_id::text, v_secret, 'sha256'), 'hex');
end;
$$;

create or replace function verify_manage_token(p_booking_reference text, p_token text)
returns uuid
language plpgsql
security definer
as $$
declare
  v_expected text;
  v_appointment_id uuid;
  v_secret text := current_setting('app.manage_link_secret', true);
begin
  if v_secret is null or length(v_secret) = 0 then
    raise exception 'MANAGE_LINK_SECRET_NOT_CONFIGURED';
  end if;
  select id into v_appointment_id from appointments where booking_reference = p_booking_reference;
  if v_appointment_id is null then
    raise exception 'BOOKING_NOT_FOUND';
  end if;
  v_expected := encode(hmac(p_booking_reference || '|' || v_appointment_id::text, v_secret, 'sha256'), 'hex');
  if v_expected <> p_token then
    raise exception 'INVALID_TOKEN';
  end if;
  return v_appointment_id;
end;
$$;

create or replace function get_manage_booking(p_booking_reference text, p_token text)
returns table(
  booking_reference text,
  status appointment_status,
  start_at timestamptz,
  end_at timestamptz,
  service_id uuid,
  service_name text,
  duration_minutes int
)
language plpgsql
security definer
as $$
declare
  v_appointment_id uuid;
begin
  v_appointment_id := verify_manage_token(p_booking_reference, p_token);
  return query
    select a.booking_reference, a.status, a.start_at, a.end_at,
           s.id, s.name, s.duration_minutes
      from appointments a
      join services s on s.id = a.service_id
     where a.id = v_appointment_id;
end;
$$;

create or replace function cancel_booking_via_token(p_booking_reference text, p_token text)
returns void
language plpgsql
security definer
as $$
declare
  v_appointment_id uuid;
begin
  v_appointment_id := verify_manage_token(p_booking_reference, p_token);
  update appointments
     set status = 'CANCELLED',
         cancelled_at = now(),
         updated_at = now()
   where id = v_appointment_id
     and status in ('PENDING', 'CONFIRMED');
  if not found then
    raise exception 'ALREADY_FINALIZED';
  end if;
end;
$$;

create or replace function reschedule_booking_via_token(
  p_booking_reference text,
  p_token text,
  p_new_start_at timestamptz
)
returns table(booking_reference text, start_at timestamptz, end_at timestamptz)
language plpgsql
security definer
as $$
declare
  v_appointment_id uuid;
  v_service_id uuid;
  v_duration int;
  v_new_end timestamptz;
begin
  v_appointment_id := verify_manage_token(p_booking_reference, p_token);
  select a.service_id, s.duration_minutes
    into v_service_id, v_duration
    from appointments a
    join services s on s.id = a.service_id
   where a.id = v_appointment_id;
  v_new_end := p_new_start_at + make_interval(mins => v_duration);
  update appointments
     set start_at = p_new_start_at,
         end_at = v_new_end,
         status = 'PENDING',
         updated_at = now()
   where id = v_appointment_id
     and status in ('PENDING', 'CONFIRMED')
  returning appointments.booking_reference, appointments.start_at, appointments.end_at
    into booking_reference, start_at, end_at;
  if not found then
    raise exception 'ALREADY_FINALIZED';
  end if;
  return next;
exception
  when exclusion_violation then
    raise exception 'SLOT_UNAVAILABLE';
end;
$$;

-- Allow the anon key to call these RPCs (they self-authenticate via the token).
grant execute on function get_manage_booking(text, text) to anon, authenticated;
grant execute on function cancel_booking_via_token(text, text) to anon, authenticated;
grant execute on function reschedule_booking_via_token(text, text, timestamptz) to anon, authenticated;
