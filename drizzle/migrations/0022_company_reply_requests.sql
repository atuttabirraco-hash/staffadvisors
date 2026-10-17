CREATE TABLE public.reply_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_role text,
  sender_email text NOT NULL,
  sender_phone text,
  reply_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.reply_requests TO anon, authenticated;
GRANT ALL ON public.reply_requests TO service_role;
ALTER TABLE public.reply_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request a company reply" ON public.reply_requests FOR INSERT TO anon, authenticated
WITH CHECK (status = 'pending' AND char_length(sender_name) BETWEEN 2 AND 100 AND char_length(reply_text) BETWEEN 10 AND 2000);