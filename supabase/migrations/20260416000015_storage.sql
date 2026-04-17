-- ============================================================================
-- Storage Buckets & Policies
-- ============================================================================
--
-- Supabase Storage buckets for images and documents. Each bucket has
-- policies mirroring the RLS patterns on the corresponding tables.
--


-- -------------------------------------------------------
-- Create buckets
-- -------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
	('listing-images', 'listing-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
	('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
	('test-reports', 'test-reports', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
	('warranty-docs', 'warranty-docs', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
	('catalog-images', 'catalog-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
	('temp-uploads', 'temp-uploads', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);


-- -------------------------------------------------------
-- listing-images (public read, owner write to own folder)
-- -------------------------------------------------------

CREATE POLICY listing_images_select ON storage.objects
	FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY listing_images_insert ON storage.objects
	FOR INSERT WITH CHECK (
		bucket_id = 'listing-images'
		AND (storage.foldername(name))[1] = auth.uid()::text
	);

CREATE POLICY listing_images_delete ON storage.objects
	FOR DELETE USING (
		bucket_id = 'listing-images'
		AND (storage.foldername(name))[1] = auth.uid()::text
	);


-- -------------------------------------------------------
-- avatars (public read, owner write)
-- -------------------------------------------------------

CREATE POLICY avatars_select ON storage.objects
	FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY avatars_insert ON storage.objects
	FOR INSERT WITH CHECK (
		bucket_id = 'avatars'
		AND (storage.foldername(name))[1] = auth.uid()::text
	);

CREATE POLICY avatars_update ON storage.objects
	FOR UPDATE USING (
		bucket_id = 'avatars'
		AND (storage.foldername(name))[1] = auth.uid()::text
	);

CREATE POLICY avatars_delete ON storage.objects
	FOR DELETE USING (
		bucket_id = 'avatars'
		AND (storage.foldername(name))[1] = auth.uid()::text
	);


-- -------------------------------------------------------
-- test-reports (tester + admin + order participants)
-- -------------------------------------------------------

CREATE POLICY test_reports_storage_select ON storage.objects
	FOR SELECT USING (
		bucket_id = 'test-reports'
		AND (
			is_admin()
			OR is_tester()
			OR EXISTS (
				SELECT 1 FROM orders
				WHERE orders.id = (storage.foldername(name))[1]::uuid
				AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid())
			)
		)
	);

CREATE POLICY test_reports_storage_insert ON storage.objects
	FOR INSERT WITH CHECK (
		bucket_id = 'test-reports'
		AND (is_tester() OR is_admin())
	);


-- -------------------------------------------------------
-- warranty-docs (claimant + admin)
-- -------------------------------------------------------

CREATE POLICY warranty_docs_select ON storage.objects
	FOR SELECT USING (
		bucket_id = 'warranty-docs'
		AND (
			is_admin()
			OR EXISTS (
				SELECT 1 FROM warranty_claims
				WHERE warranty_claims.id = (storage.foldername(name))[1]::uuid
				AND warranty_claims.claimant_id = auth.uid()
			)
		)
	);

CREATE POLICY warranty_docs_insert ON storage.objects
	FOR INSERT WITH CHECK (
		bucket_id = 'warranty-docs'
		AND auth.uid() IS NOT NULL
	);


-- -------------------------------------------------------
-- catalog-images (public read, admin write)
-- -------------------------------------------------------

CREATE POLICY catalog_images_select ON storage.objects
	FOR SELECT USING (bucket_id = 'catalog-images');

CREATE POLICY catalog_images_insert ON storage.objects
	FOR INSERT WITH CHECK (
		bucket_id = 'catalog-images'
		AND is_admin()
	);

CREATE POLICY catalog_images_update ON storage.objects
	FOR UPDATE USING (
		bucket_id = 'catalog-images'
		AND is_admin()
	);


-- -------------------------------------------------------
-- temp-uploads (owner only, auto-cleanup)
-- -------------------------------------------------------

CREATE POLICY temp_uploads_select ON storage.objects
	FOR SELECT USING (
		bucket_id = 'temp-uploads'
		AND (storage.foldername(name))[1] = auth.uid()::text
	);

CREATE POLICY temp_uploads_insert ON storage.objects
	FOR INSERT WITH CHECK (
		bucket_id = 'temp-uploads'
		AND (storage.foldername(name))[1] = auth.uid()::text
	);

CREATE POLICY temp_uploads_delete ON storage.objects
	FOR DELETE USING (
		bucket_id = 'temp-uploads'
		AND (storage.foldername(name))[1] = auth.uid()::text
	);
