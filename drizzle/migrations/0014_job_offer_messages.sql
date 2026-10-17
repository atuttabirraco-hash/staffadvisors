CREATE TABLE public.job_offer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.job_offers(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.job_offer_messages TO anon, authenticated;
GRANT ALL ON public.job_offer_messages TO service_role;
ALTER TABLE public.job_offer_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can contact an offer poster"
  ON public.job_offer_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (char_length(sender_name) BETWEEN 2 AND 100 AND char_length(message) BETWEEN 10 AND 2000);