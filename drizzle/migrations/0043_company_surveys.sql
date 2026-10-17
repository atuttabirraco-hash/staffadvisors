CREATE TABLE public.company_accounts (
  user_id uuid PRIMARY KEY,
  company_name text NOT NULL CHECK (char_length(company_name) BETWEEN 2 AND 120),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.company_accounts TO authenticated;
GRANT ALL ON public.company_accounts TO service_role;
ALTER TABLE public.company_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own company account read" ON public.company_accounts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own company account insert" ON public.company_accounts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own company account update" ON public.company_accounts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 150),
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surveys TO authenticated;
GRANT ALL ON public.surveys TO service_role;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner surveys all" ON public.surveys FOR ALL TO authenticated
  USING (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.company_accounts c WHERE c.user_id = auth.uid()))
  WITH CHECK (owner_id = auth.uid() AND EXISTS (SELECT 1 FROM public.company_accounts c WHERE c.user_id = auth.uid()));

CREATE TABLE public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  text text NOT NULL CHECK (char_length(text) BETWEEN 2 AND 300),
  options text[] NOT NULL CHECK (array_length(options, 1) BETWEEN 2 AND 8)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_questions TO authenticated;
GRANT ALL ON public.survey_questions TO service_role;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner questions all" ON public.survey_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_id AND s.owner_id = auth.uid()));

CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  device_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (survey_id, device_hash)
);
GRANT SELECT, DELETE ON public.survey_responses TO authenticated;
GRANT ALL ON public.survey_responses TO service_role;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner responses read" ON public.survey_responses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_id AND s.owner_id = auth.uid()));
CREATE POLICY "Owner responses delete" ON public.survey_responses FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_id AND s.owner_id = auth.uid()));

CREATE TABLE public.survey_answers (
  response_id uuid NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  option_index integer NOT NULL,
  PRIMARY KEY (response_id, question_id)
);
GRANT SELECT ON public.survey_answers TO authenticated;
GRANT ALL ON public.survey_answers TO service_role;
ALTER TABLE public.survey_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner answers read" ON public.survey_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.survey_questions q JOIN public.surveys s ON s.id = q.survey_id WHERE q.id = question_id AND s.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.get_public_survey(p_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'title', s.title,
    'company', c.company_name,
    'questions', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', q.id, 'text', q.text, 'options', q.options) ORDER BY q.position, q.id) FROM public.survey_questions q WHERE q.survey_id = s.id), '[]'::jsonb))
  FROM public.surveys s JOIN public.company_accounts c ON c.user_id = s.owner_id
  WHERE s.token = p_token AND s.is_active
$$;
GRANT EXECUTE ON FUNCTION public.get_public_survey(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_survey(p_token text, p_device text, p_answers jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid; rid uuid; a jsonb; qopts text[];
BEGIN
  IF p_device IS NULL OR char_length(p_device) < 8 OR char_length(p_device) > 100 THEN RETURN 'invalid'; END IF;
  SELECT id INTO sid FROM public.surveys WHERE token = p_token AND is_active;
  IF sid IS NULL THEN RETURN 'not_found'; END IF;
  IF EXISTS (SELECT 1 FROM public.survey_responses WHERE survey_id = sid AND device_hash = md5(p_device)) THEN RETURN 'already'; END IF;
  INSERT INTO public.survey_responses (survey_id, device_hash) VALUES (sid, md5(p_device)) RETURNING id INTO rid;
  FOR a IN SELECT * FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) LOOP
    SELECT options INTO qopts FROM public.survey_questions WHERE id = (a->>'q')::uuid AND survey_id = sid;
    IF qopts IS NOT NULL AND (a->>'o')::int >= 0 AND (a->>'o')::int < array_length(qopts, 1) THEN
      INSERT INTO public.survey_answers (response_id, question_id, option_index) VALUES (rid, (a->>'q')::uuid, (a->>'o')::int) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  RETURN 'ok';
END $$;
GRANT EXECUTE ON FUNCTION public.submit_survey(text, text, jsonb) TO anon, authenticated;