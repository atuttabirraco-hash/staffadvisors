ALTER TABLE public.surveys
  ADD COLUMN mode text NOT NULL DEFAULT 'anonymous',
  ADD COLUMN status text NOT NULL DEFAULT 'draft',
  ADD COLUMN started_at timestamptz,
  ADD COLUMN ended_at timestamptz;

ALTER TABLE public.surveys ADD CONSTRAINT surveys_mode_check CHECK (mode IN ('anonymous','individual'));
ALTER TABLE public.surveys ADD CONSTRAINT surveys_status_check CHECK (status IN ('draft','active','paused','ended'));

-- Existing surveys keep working: active ones become 'active' with start date = creation date, others 'paused'.
UPDATE public.surveys SET status = CASE WHEN is_active THEN 'active' ELSE 'paused' END, started_at = created_at;

ALTER TABLE public.survey_responses
  ADD COLUMN respondent_name text,
  ADD COLUMN respondent_birth date;

CREATE OR REPLACE FUNCTION public.get_public_survey(p_token text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'title', s.title,
    'company', c.company_name,
    'mode', s.mode,
    'started_at', s.started_at,
    'questions', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', q.id, 'text', q.text, 'options', q.options, 'kind', q.kind) ORDER BY q.position, q.id) FROM public.survey_questions q WHERE q.survey_id = s.id), '[]'::jsonb))
  FROM public.surveys s JOIN public.company_accounts c ON c.user_id = s.owner_id
  WHERE s.token = p_token AND s.is_active AND s.status = 'active'
$function$;

CREATE OR REPLACE FUNCTION public.submit_survey(p_token text, p_device text, p_answers jsonb, p_name text DEFAULT NULL, p_birth text DEFAULT NULL)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE sid uuid; rid uuid; a jsonb; qopts text[]; qkind text; txt text; smode text; bdate date;
BEGIN
  IF p_device IS NULL OR char_length(p_device) < 8 OR char_length(p_device) > 100 THEN RETURN 'invalid'; END IF;
  SELECT id, mode INTO sid, smode FROM public.surveys WHERE token = p_token AND is_active AND status = 'active';
  IF sid IS NULL THEN RETURN 'not_found'; END IF;
  IF smode = 'individual' THEN
    IF p_name IS NULL OR char_length(btrim(p_name)) < 3 OR char_length(p_name) > 120 THEN RETURN 'invalid'; END IF;
    BEGIN bdate := p_birth::date; EXCEPTION WHEN OTHERS THEN RETURN 'invalid'; END;
    IF bdate IS NULL OR bdate < '1900-01-01' OR bdate > CURRENT_DATE THEN RETURN 'invalid'; END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM public.survey_responses WHERE survey_id = sid AND device_hash = md5(p_device)) THEN RETURN 'already'; END IF;
  INSERT INTO public.survey_responses (survey_id, device_hash, respondent_name, respondent_birth)
    VALUES (sid, md5(p_device), CASE WHEN smode = 'individual' THEN left(btrim(p_name), 120) ELSE NULL END, CASE WHEN smode = 'individual' THEN bdate ELSE NULL END)
    RETURNING id INTO rid;
  FOR a IN SELECT * FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) LOOP
    qopts := NULL; qkind := NULL;
    SELECT options, kind INTO qopts, qkind FROM public.survey_questions WHERE id = (a->>'q')::uuid AND survey_id = sid;
    IF qkind = 'open' THEN
      txt := left(btrim(COALESCE(a->>'t', '')), 2000);
      IF char_length(txt) > 0 THEN
        INSERT INTO public.survey_answers (response_id, question_id, option_index, text_answer) VALUES (rid, (a->>'q')::uuid, 0, txt) ON CONFLICT DO NOTHING;
      END IF;
    ELSIF qopts IS NOT NULL AND (a->>'o') IS NOT NULL AND (a->>'o')::int >= 0 AND (a->>'o')::int < array_length(qopts, 1) THEN
      INSERT INTO public.survey_answers (response_id, question_id, option_index) VALUES (rid, (a->>'q')::uuid, (a->>'o')::int) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  RETURN 'ok';
END $function$;