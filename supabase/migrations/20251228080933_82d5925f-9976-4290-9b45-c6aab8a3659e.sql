-- 1. Make studio_id nullable
ALTER TABLE public.products ALTER COLUMN studio_id DROP NOT NULL;

-- 2. Rename 'link' to 'affiliate_link'
ALTER TABLE public.products RENAME COLUMN link TO affiliate_link;

-- 3. Add 'original_url' column with unique constraint
ALTER TABLE public.products ADD COLUMN original_url TEXT UNIQUE;