create extension if not exists btree_gist;
create extension if not exists pgcrypto;

create type admin_role as enum ('OWNER', 'ADMIN', 'STAFF');
create type appointment_status as enum ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
create type pricing_type as enum ('FIXED', 'STARTING_FROM', 'CONSULTATION');

create table admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role admin_role not null default 'STAFF',
  full_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table business_settings (
  id uuid primary key default gen_random_uuid(),
  salon_name text not null,
  tagline text,
  phone text not null,
  whatsapp text not null,
  email text,
  address text not null,
  area text,
  landmark text,
  city text not null,
  state text not null,
  pin_code text,
  google_maps_url text,
  latitude numeric,
  longitude numeric,
  timezone text not null default 'Asia/Kolkata',
  currency text not null default 'INR',
  booking_enabled boolean not null default true,
  otp_required boolean not null default true,
  advance_booking_days int not null default 21,
  minimum_notice_minutes int not null default 60,
  slot_interval_minutes int not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6),
  is_open boolean not null default true,
  opens_at time not null,
  closes_at time not null,
  unique (weekday)
);

create table holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  full_day boolean not null default true,
  opens_at time,
  closes_at time,
  reason text,
  created_at timestamptz not null default now()
);

create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  phone text,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id uuid not null references service_categories(id),
  short_description text,
  description text,
  price int,
  discount_price int,
  pricing_type pricing_type not null default 'FIXED',
  duration_minutes int not null check (duration_minutes between 5 and 360),
  image_path text,
  featured boolean not null default false,
  bookable boolean not null default true,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  first_visit date,
  last_visit date,
  appointment_count int not null default 0,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique,
  customer_id uuid not null references customers(id),
  service_id uuid not null references services(id),
  staff_id uuid references staff(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  status appointment_status not null default 'PENDING',
  service_price_snapshot int not null,
  customer_notes text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  completed_at timestamptz,
  check (end_at > start_at)
);

alter table appointments add constraint no_active_appointment_overlap
exclude using gist (
  coalesce(staff_id, '00000000-0000-0000-0000-000000000000'::uuid) with =,
  tstzrange(start_at, end_at, '[)') with &&
) where (status in ('PENDING', 'CONFIRMED'));

create table blocked_times (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table gallery_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  display_order int not null default 0
);

create table media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  alt_text text,
  mime_type text,
  byte_size int,
  width int,
  height int,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table gallery_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references gallery_categories(id),
  media_id uuid references media(id),
  caption text,
  featured boolean not null default false,
  visible boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table before_after_items (
  id uuid primary key default gen_random_uuid(),
  before_media_id uuid references media(id),
  after_media_id uuid references media(id),
  category_id uuid references gallery_categories(id),
  caption text,
  active boolean not null default true,
  display_order int not null default 0
);

create table offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_path text,
  original_price int,
  offer_price int,
  starts_on date,
  ends_on date,
  featured boolean not null default false,
  active boolean not null default true,
  cta_label text,
  display_order int not null default 0
);

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  review text not null,
  image_path text,
  featured boolean not null default false,
  active boolean not null default true
);

create table page_content (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  content jsonb not null default '{}',
  active boolean not null default true,
  unique (page_key, section_key)
);

create table faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  active boolean not null default true,
  display_order int not null default 0
);

create table notification_settings (
  id uuid primary key default gen_random_uuid(),
  channel text not null,
  provider text not null,
  enabled boolean not null default false,
  config jsonb not null default '{}'
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id),
  channel text not null,
  recipient text not null,
  status text not null default 'QUEUED',
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id),
  remind_at timestamptz not null,
  channel text not null,
  status text not null default 'SCHEDULED',
  created_at timestamptz not null default now()
);

create table otp_verifications (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempt_count int not null default 0,
  resend_count int not null default 0,
  verified_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  url text not null,
  active boolean not null default true,
  display_order int not null default 0
);

create table seo_settings (
  id uuid primary key default gen_random_uuid(),
  route_path text not null unique,
  title text not null,
  description text not null,
  canonical_path text,
  og_image_path text,
  robots text default 'index,follow'
);

create or replace function is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from admin_profiles
    where id = auth.uid() and active = true and role in ('OWNER', 'ADMIN', 'STAFF')
  );
$$;

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
begin
  select * into v_service from services where id = p_service_id and active = true and bookable = true;
  if not found then
    raise exception 'SERVICE_NOT_BOOKABLE';
  end if;

  select id into v_customer_id from customers where phone = p_phone for update;
  if v_customer_id is null then
    insert into customers(name, phone, email, first_visit, last_visit, appointment_count)
    values (p_customer_name, p_phone, nullif(p_email, ''), p_start_at::date, p_start_at::date, 0)
    returning id into v_customer_id;
  else
    update customers
    set name = p_customer_name,
        email = coalesce(nullif(p_email, ''), email),
        last_visit = p_start_at::date,
        updated_at = now()
    where id = v_customer_id;
  end if;

  update otp_verifications
  set used_at = now()
  where id = p_otp_id
    and phone = p_phone
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

alter table admin_profiles enable row level security;
alter table business_settings enable row level security;
alter table business_hours enable row level security;
alter table holidays enable row level security;
alter table staff enable row level security;
alter table service_categories enable row level security;
alter table services enable row level security;
alter table customers enable row level security;
alter table appointments enable row level security;
alter table blocked_times enable row level security;
alter table gallery_categories enable row level security;
alter table media enable row level security;
alter table gallery_items enable row level security;
alter table before_after_items enable row level security;
alter table offers enable row level security;
alter table testimonials enable row level security;
alter table page_content enable row level security;
alter table faqs enable row level security;
alter table notification_settings enable row level security;
alter table notifications enable row level security;
alter table reminders enable row level security;
alter table otp_verifications enable row level security;
alter table social_links enable row level security;
alter table seo_settings enable row level security;

create policy "public read active categories" on service_categories for select using (active = true);
create policy "public read active services" on services for select using (active = true);
create policy "public read visible gallery" on gallery_items for select using (visible = true);
create policy "public read active offers" on offers for select using (active = true);
create policy "public read active testimonials" on testimonials for select using (active = true);
create policy "public read page content" on page_content for select using (active = true);
create policy "public read faqs" on faqs for select using (active = true);
create policy "public read business settings" on business_settings for select using (true);
create policy "public read business hours" on business_hours for select using (true);
create policy "public read social links" on social_links for select using (active = true);
create policy "public read seo settings" on seo_settings for select using (true);

create policy "admins manage admin profiles" on admin_profiles for all using (is_admin()) with check (is_admin());
create policy "admins manage business settings" on business_settings for all using (is_admin()) with check (is_admin());
create policy "admins manage business hours" on business_hours for all using (is_admin()) with check (is_admin());
create policy "admins manage holidays" on holidays for all using (is_admin()) with check (is_admin());
create policy "admins manage staff" on staff for all using (is_admin()) with check (is_admin());
create policy "admins manage categories" on service_categories for all using (is_admin()) with check (is_admin());
create policy "admins manage services" on services for all using (is_admin()) with check (is_admin());
create policy "admins manage customers" on customers for all using (is_admin()) with check (is_admin());
create policy "admins manage appointments" on appointments for all using (is_admin()) with check (is_admin());
create policy "admins manage blocked times" on blocked_times for all using (is_admin()) with check (is_admin());
create policy "admins manage gallery categories" on gallery_categories for all using (is_admin()) with check (is_admin());
create policy "admins manage media" on media for all using (is_admin()) with check (is_admin());
create policy "admins manage gallery" on gallery_items for all using (is_admin()) with check (is_admin());
create policy "admins manage before after" on before_after_items for all using (is_admin()) with check (is_admin());
create policy "admins manage offers" on offers for all using (is_admin()) with check (is_admin());
create policy "admins manage testimonials" on testimonials for all using (is_admin()) with check (is_admin());
create policy "admins manage content" on page_content for all using (is_admin()) with check (is_admin());
create policy "admins manage faqs" on faqs for all using (is_admin()) with check (is_admin());
create policy "admins manage notification settings" on notification_settings for all using (is_admin()) with check (is_admin());
create policy "admins manage notifications" on notifications for all using (is_admin()) with check (is_admin());
create policy "admins manage reminders" on reminders for all using (is_admin()) with check (is_admin());
create policy "admins manage social links" on social_links for all using (is_admin()) with check (is_admin());
create policy "admins manage seo" on seo_settings for all using (is_admin()) with check (is_admin());
