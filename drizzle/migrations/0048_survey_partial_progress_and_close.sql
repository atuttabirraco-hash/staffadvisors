ALTER TABLE public.survey_responses ADD COLUMN is_complete boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.save_survey_progress(p_token text, p_device text, p_answers jsonb, p_name text DEFAULT NULL, p_birth text DEFAULT NULL, p_complete boolean DEFAULT false)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid; smode text; rid uuid; done boolean; a jsonb; qid uuid; idx integer; qopts text[]; qkind text; txt text; bdate date;
BEGIN
  IF p_device IS NULL OR char_length(p_device) NOT BETWEEN 8 AND 100 OR jsonb_typeof(p_answers) <> 'array' OR jsonb_array_length(p_answers) > 100 THEN RETURN 'invalid'; END IF;
  SELECT id, mode INTO sid, smode FROM public.surveys WHERE token=p_token AND is_active AND status='active' FOR UPDATE;
  IF sid IS NULL THEN RETURN 'not_found'; END IF;
  IF smode='individual' THEN
    IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 3 AND 120 THEN RETURN 'invalid'; END IF;
    BEGIN bdate := p_birth::date; EXCEPTION WHEN OTHERS THEN RETURN 'invalid'; END;
    IF bdate IS NULL OR bdate < '1900-01-01' OR bdate > CURRENT_DATE THEN RETURN 'invalid'; END IF;
  END IF;
  IF p_complete AND EXISTS (
    SELECT 1 FROM public.survey_questions q WHERE q.survey_id=sid AND q.kind<>'open'
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_answers) v WHERE v->>'q'=q.id::text AND v->>'o' ~ '^[0-7]$' AND (v->>'o')::int < cardinality(q.options))
  ) THEN RETURN 'invalid'; END IF;
  FOR a IN SELECT * FROM jsonb_array_elements(p_answers) LOOP
    BEGIN qid := (a->>'q')::uuid; EXCEPTION WHEN OTHERS THEN RETURN 'invalid'; END;
    SELECT options,kind INTO qopts,qkind FROM public.survey_questions WHERE id=qid AND survey_id=sid;
    IF qkind IS NULL THEN RETURN 'invalid'; END IF;
    IF qkind<>'open' AND (a->>'o' IS NULL OR a->>'o' !~ '^[0-7]$' OR (a->>'o')::int >= cardinality(qopts)) THEN RETURN 'invalid'; END IF;
  END LOOP;
  SELECT id,is_complete INTO rid,done FROM public.survey_responses WHERE survey_id=sid AND device_hash=md5(p_device);
  IF done THEN RETURN 'already'; END IF;
  IF rid IS NULL THEN
    IF jsonb_array_length(p_answers)=0 AND NOT p_complete THEN RETURN 'ok'; END IF;
    INSERT INTO public.survey_responses(survey_id,device_hash,respondent_name,respondent_birth,is_complete)
    VALUES(sid,md5(p_device),CASE WHEN smode='individual' THEN btrim(p_name) END,CASE WHEN smode='individual' THEN bdate END,p_complete) RETURNING id INTO rid;
  ELSE
    UPDATE public.survey_responses SET is_complete=p_complete,respondent_name=CASE WHEN smode='individual' THEN btrim(p_name) END,respondent_birth=CASE WHEN smode='individual' THEN bdate END WHERE id=rid;
  END IF;
  FOR a IN SELECT * FROM jsonb_array_elements(p_answers) LOOP
    qid := (a->>'q')::uuid;
    SELECT kind INTO qkind FROM public.survey_questions WHERE id=qid AND survey_id=sid;
    IF qkind='open' THEN
      txt := left(btrim(COALESCE(a->>'t','')),2000);
      IF txt='' THEN DELETE FROM public.survey_answers WHERE response_id=rid AND question_id=qid;
      ELSE INSERT INTO public.survey_answers(response_id,question_id,option_index,text_answer) VALUES(rid,qid,0,txt)
      ON CONFLICT(response_id,question_id) DO UPDATE SET text_answer=excluded.text_answer,option_index=0; END IF;
    ELSE
      idx := (a->>'o')::int;
      INSERT INTO public.survey_answers(response_id,question_id,option_index,text_answer) VALUES(rid,qid,idx,NULL)
      ON CONFLICT(response_id,question_id) DO UPDATE SET option_index=excluded.option_index,text_answer=NULL;
    END IF;
  END LOOP;
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.save_survey_progress(text,text,jsonb,text,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_survey_progress(text,text,jsonb,text,text,boolean) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.submit_survey(p_token text,p_device text,p_answers jsonb,p_name text DEFAULT NULL,p_birth text DEFAULT NULL)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 SELECT public.save_survey_progress(p_token,p_device,p_answers,p_name,p_birth,true)
$$;
CREATE OR REPLACE FUNCTION public.submit_survey(p_token text,p_device text,p_answers jsonb)
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 SELECT public.save_survey_progress(p_token,p_device,p_answers,NULL,NULL,true)
$$;

CREATE OR REPLACE FUNCTION public.end_company_survey(p_survey_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.surveys SET status='ended',is_active=false,ended_at=COALESCE(ended_at,now())
  WHERE id=p_survey_id AND owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.company_accounts WHERE user_id=auth.uid());
  RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.end_company_survey(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.end_company_survey(uuid) TO authenticated,service_role;