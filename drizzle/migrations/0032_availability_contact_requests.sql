CREATE TABLE public.availability_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  owner_id uuid,
  requester_id uuid NOT NULL,
  requester_phone text NOT NULL,
  message text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.availability_contact_requests TO service_role;
ALTER TABLE public.availability_contact_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX availability_contact_requests_requester_idx ON public.availability_contact_requests (requester_id, created_at DESC);