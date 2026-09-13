CREATE POLICY "own portfolio files read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own portfolio files insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own portfolio files update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "own portfolio files delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);