insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = true;

create policy "public read site media"
on storage.objects for select
using (bucket_id = 'site-media');

create policy "admins upload site media"
on storage.objects for insert
with check (bucket_id = 'site-media' and is_admin());

create policy "admins update site media"
on storage.objects for update
using (bucket_id = 'site-media' and is_admin())
with check (bucket_id = 'site-media' and is_admin());

create policy "admins delete site media"
on storage.objects for delete
using (bucket_id = 'site-media' and is_admin());
