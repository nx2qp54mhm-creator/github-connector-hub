-- Set josephahuber@gmail.com as admin
UPDATE public.profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'josephahuber@gmail.com'
);
