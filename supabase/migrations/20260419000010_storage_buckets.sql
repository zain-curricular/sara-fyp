-- ============================================================================
-- Storage Buckets & Policies
-- ============================================================================
-- Note: Supabase storage policies use a different API. This migration sets up
-- the buckets via the storage schema. Run after supabase start.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',           'avatars',           true,  5242880,   ARRAY['image/jpeg','image/png','image/webp']),
  ('listing-images',   'listing-images',    true,  10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('store-assets',     'store-assets',      true,  10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('chat-attachments', 'chat-attachments',  false, 10485760,  ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('dispute-evidence', 'dispute-evidence',  false, 10485760,  ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('verification-docs','verification-docs', false, 10485760,  ARRAY['image/jpeg','image/png','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Storage RLS policies (using storage.objects)
-- ---------------------------------------------------------------------------

-- avatars: public read, owner write
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- listing-images: public read, authenticated write (seller)
CREATE POLICY "listing_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY "listing_images_auth_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "listing_images_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- store-assets: public read, owner write
CREATE POLICY "store_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-assets');

CREATE POLICY "store_assets_auth_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'store-assets'
    AND auth.role() = 'authenticated'
  );

-- chat-attachments: authenticated participants only
CREATE POLICY "chat_attachments_auth" ON storage.objects
  FOR ALL USING (
    bucket_id = 'chat-attachments'
    AND auth.role() = 'authenticated'
  );

-- dispute-evidence: order parties + admin
CREATE POLICY "dispute_evidence_auth" ON storage.objects
  FOR ALL USING (
    bucket_id = 'dispute-evidence'
    AND auth.role() = 'authenticated'
  );

-- verification-docs: private, requester + mechanic + admin
CREATE POLICY "verification_docs_auth" ON storage.objects
  FOR ALL USING (
    bucket_id = 'verification-docs'
    AND auth.role() = 'authenticated'
  );
