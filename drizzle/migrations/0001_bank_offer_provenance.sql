ALTER TABLE public.bank_offers ADD COLUMN offer_status text NOT NULL DEFAULT 'unverified';
ALTER TABLE public.bank_offers ADD COLUMN verification_evidence jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.bank_offers ADD CONSTRAINT bank_offers_status_values CHECK (offer_status IN ('demo', 'unverified', 'verified'));
UPDATE public.bank_offers SET offer_status = 'demo', source_url = '' WHERE id LIKE 'demo-%' OR conditions ILIKE '%demo%' OR conditions ILIKE '%inventat%';
COMMENT ON COLUMN public.bank_offers.offer_status IS 'Default unverified; demo is fictional. Verified also requires complete official evidence supporting the exact terms.';
COMMENT ON COLUMN public.bank_offers.verification_evidence IS 'Official source URL and excerpts supporting product, rates, conditions, limits, fees and validity. No evidence is inferred from a homepage or verification date.';
COMMENT ON COLUMN public.bank_offers.verified_on IS 'Legacy date: never evidence by itself; display only when explicit status and complete official evidence pass validation.';