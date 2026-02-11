-- Quick Purchases table for anonymous (no-auth) plan purchases
CREATE TABLE IF NOT EXISTS public.quick_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  location_id uuid NOT NULL REFERENCES public.locations(id),
  credential_id uuid REFERENCES public.credential_pools(id),
  amount numeric(10,2) NOT NULL,
  paystack_reference text UNIQUE,
  mikrotik_username text,
  mikrotik_password text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_purchases ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads (needed for the frontend to poll purchase status by reference)
CREATE POLICY "Allow public read of quick_purchases"
  ON public.quick_purchases FOR SELECT
  USING (true);

-- Allow service role inserts/updates (edge function uses service role key)
-- No INSERT/UPDATE policy needed for anon since the edge function uses the service_role key

-- Index for faster lookups by reference
CREATE INDEX IF NOT EXISTS idx_quick_purchases_reference ON public.quick_purchases(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_quick_purchases_email ON public.quick_purchases(email);
