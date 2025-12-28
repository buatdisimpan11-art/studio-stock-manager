-- Make studio_id NOT NULL again (products belong to specific studio)
-- First, delete any products with null studio_id (if any)
DELETE FROM public.products WHERE studio_id IS NULL;

-- Then make the column NOT NULL
ALTER TABLE public.products ALTER COLUMN studio_id SET NOT NULL;