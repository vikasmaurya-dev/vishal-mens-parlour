insert into business_settings (
  salon_name, tagline, phone, whatsapp, email, address, landmark, city, state, pin_code, google_maps_url
) values (
  'Vishal Mens Parlour',
  'Premium men''s grooming in Gorakhpur',
  '+91 9456 7890',
  '+91 9456 7890',
  'hello@vishalmensparlour.in',
  'Golghar Market',
  'Near City Mall',
  'Gorakhpur',
  'Uttar Pradesh',
  '273001',
  'https://maps.google.com/?q=Golghar%20Gorakhpur'
);

insert into business_hours (weekday, is_open, opens_at, closes_at)
values
  (0, false, '00:00', '00:00'),
  (1, true, '09:00', '21:00'),
  (2, true, '09:00', '21:00'),
  (3, true, '09:00', '21:00'),
  (4, true, '09:00', '21:00'),
  (5, true, '09:00', '21:00'),
  (6, true, '09:00', '21:00');
