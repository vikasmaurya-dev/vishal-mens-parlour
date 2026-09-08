-- Vishal Mens Parlour catalog seed.
-- Safe to run after 202609010001_initial_schema.sql and seed.sql.

insert into service_categories (id, name, slug, description, image_path, display_order)
values
  ('10000000-0000-0000-0000-000000000001', 'Haircuts', 'haircuts', 'Precision cuts tailored to your face shape and lifestyle.', 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80', 1),
  ('10000000-0000-0000-0000-000000000002', 'Beard & Shave', 'beard-shave', 'Traditional shaves, sculpting, and beard care rituals.', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80', 2),
  ('10000000-0000-0000-0000-000000000003', 'Hair Colour', 'hair-colour', 'Subtle coverage, highlights, and confident colour refreshes.', 'https://images.unsplash.com/photo-1622296089863-eb7fc530daa8?auto=format&fit=crop&w=1200&q=80', 3),
  ('10000000-0000-0000-0000-000000000004', 'Facial & Skin Care', 'facial-skin-care', 'Rejuvenating skin care designed for men.', 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1200&q=80', 4),
  ('10000000-0000-0000-0000-000000000005', 'Hair Treatment', 'hair-treatment', 'Targeted care for scalp health, texture, and shine.', 'https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=1200&q=80', 5),
  ('10000000-0000-0000-0000-000000000006', 'Grooming Packages', 'grooming-packages', 'Complete services for weddings, events, and monthly upkeep.', 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80', 6)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  image_path = excluded.image_path,
  display_order = excluded.display_order,
  active = true,
  updated_at = now();

insert into services (id, name, slug, category_id, short_description, description, price, discount_price, pricing_type, duration_minutes, image_path, featured, bookable, active, display_order)
values
  ('20000000-0000-0000-0000-000000000001', 'Classic Haircut', 'classic-haircut', '10000000-0000-0000-0000-000000000001', 'Traditional scissor or clipper cut, tailored to your style.', 'Consultation, wash, cut, and clean finish for everyday grooming.', 300, null, 'FIXED', 30, 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80', true, true, true, 1),
  ('20000000-0000-0000-0000-000000000002', 'Premium Haircut', 'premium-haircut', '10000000-0000-0000-0000-000000000001', 'Detailed cut with shampoo, blow dry, and premium styling.', 'A full grooming cut with consultation and finishing product.', 500, null, 'FIXED', 45, 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80', true, true, true, 2),
  ('20000000-0000-0000-0000-000000000003', 'Fade / Style Cut', 'fade-style-cut', '10000000-0000-0000-0000-000000000001', 'Precision fading techniques for a sharp modern finish.', 'Skin fade, taper, or custom style shaped with detail.', 400, null, 'FIXED', 45, 'https://images.unsplash.com/photo-1622296089863-eb7fc530daa8?auto=format&fit=crop&w=1200&q=80', false, true, true, 3),
  ('20000000-0000-0000-0000-000000000004', 'Hot Towel Shave', 'hot-towel-shave', '10000000-0000-0000-0000-000000000002', 'Traditional straight razor shave with hot towel and balm.', 'Pre-shave oil, warm towel, straight razor shave, and soothing finish.', 350, null, 'FIXED', 30, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80', true, true, true, 4),
  ('20000000-0000-0000-0000-000000000005', 'Beard Sculpting', 'beard-sculpting', '10000000-0000-0000-0000-000000000002', 'Expert shaping and trimming to complement your face.', 'Line-up, trim, conditioning, and beard oil finish.', 250, null, 'FIXED', 25, 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=1200&q=80', false, true, true, 5),
  ('20000000-0000-0000-0000-000000000006', 'Detox Facial', 'detox-facial', '10000000-0000-0000-0000-000000000004', 'Deep cleansing facial to remove impurities and hydrate skin.', 'Cleanse, exfoliation, mask, serum, and massage.', 600, null, 'FIXED', 45, 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1200&q=80', true, true, true, 6),
  ('20000000-0000-0000-0000-000000000007', 'Global Hair Colour', 'global-hair-colour', '10000000-0000-0000-0000-000000000003', 'Premium colour application for a complete style refresh.', 'Consultation, colour application, rinse, and styling.', 900, null, 'STARTING_FROM', 90, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80', false, true, true, 7),
  ('20000000-0000-0000-0000-000000000008', 'The Complete Grooming Experience', 'complete-grooming-experience', '10000000-0000-0000-0000-000000000006', 'Haircut, beard trim, styling, detox facial, and head massage.', 'The signature package for weddings, interviews, and special days.', 1200, 899, 'FIXED', 120, 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80', true, true, true, 8)
on conflict (id) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  price = excluded.price,
  discount_price = excluded.discount_price,
  pricing_type = excluded.pricing_type,
  duration_minutes = excluded.duration_minutes,
  image_path = excluded.image_path,
  featured = excluded.featured,
  bookable = excluded.bookable,
  active = true,
  display_order = excluded.display_order,
  updated_at = now();

insert into offers (id, title, description, original_price, offer_price, featured, active, cta_label, display_order)
values
  ('30000000-0000-0000-0000-000000000001', 'The Complete Grooming Experience', 'Haircut, beard trim, styling, detox facial, and relaxing head massage.', 1200, 899, true, true, 'Claim Offer', 1),
  ('30000000-0000-0000-0000-000000000002', 'Father & Son Combo', 'Two premium haircuts for a sharp family visit.', 700, 600, false, true, 'Book Package', 2)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  original_price = excluded.original_price,
  offer_price = excluded.offer_price,
  featured = excluded.featured,
  active = true,
  cta_label = excluded.cta_label,
  display_order = excluded.display_order;

insert into staff (id, name, title, active, display_order)
values
  ('40000000-0000-0000-0000-000000000001', 'Vishal', 'Master Barber', true, 1),
  ('40000000-0000-0000-0000-000000000002', 'Alex', 'Barber', true, 2),
  ('40000000-0000-0000-0000-000000000003', 'Sam', 'Stylist', true, 3)
on conflict (id) do update set
  name = excluded.name,
  title = excluded.title,
  active = true,
  display_order = excluded.display_order;

