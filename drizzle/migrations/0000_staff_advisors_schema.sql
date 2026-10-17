CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  legal_name text,
  vat text,
  city text,
  region text,
  country text NOT NULL DEFAULT 'Italy',
  sector text,
  lat double precision,
  lng double precision,
  source text NOT NULL DEFAULT 'manual',
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO anon, authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies are public" ON public.companies FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role text,
  sector text,
  contract_type text,
  period_from date,
  period_to date,
  score_salary int NOT NULL CHECK (score_salary BETWEEN 1 AND 5),
  score_shifts int NOT NULL CHECK (score_shifts BETWEEN 1 AND 5),
  score_management int NOT NULL CHECK (score_management BETWEEN 1 AND 5),
  score_growth int NOT NULL CHECK (score_growth BETWEEN 1 AND 5),
  score_safety int NOT NULL CHECK (score_safety BETWEEN 1 AND 5),
  score_environment int NOT NULL CHECK (score_environment BETWEEN 1 AND 5),
  pro text,
  cons text,
  advice text,
  is_anonymous boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  lang text NOT NULL DEFAULT 'it',
  helpful_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending_moderation',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reviews_company_idx ON public.reviews(company_id);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved reviews are public" ON public.reviews FOR SELECT TO anon, authenticated USING (status = 'approved');

CREATE TABLE public.company_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reply_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_replies TO anon, authenticated;
GRANT ALL ON public.company_replies TO service_role;
ALTER TABLE public.company_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Replies are public" ON public.company_replies FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own row" ON public.users FOR SELECT TO authenticated USING (id = auth.uid());

-- Seed companies
INSERT INTO public.companies (id, name, legal_name, vat, city, region, sector, lat, lng) VALUES
('11111111-0000-0000-0000-000000000001','Trattoria Da Nino','Da Nino S.r.l.','IT01234567890','Roma','Lazio','Restaurants',41.9028,12.4964),
('11111111-0000-0000-0000-000000000002','Hotel Bellavista','Bellavista Hospitality S.p.A.','IT02345678901','Rimini','Emilia-Romagna','Hotels',44.0678,12.5695),
('11111111-0000-0000-0000-000000000003','LogiFast','LogiFast Logistics S.r.l.','IT03456789012','Piacenza','Emilia-Romagna','Logistics & Warehouses',45.0526,9.6930),
('11111111-0000-0000-0000-000000000004','SuperMercato Italia','SMI Retail S.p.A.','IT04567890123','Milano','Lombardia','Retail & Supermarkets',45.4642,9.1900),
('11111111-0000-0000-0000-000000000005','Edilizia Rossi','Rossi Costruzioni S.r.l.','IT05678901234','Napoli','Campania','Construction',40.8518,14.2681),
('11111111-0000-0000-0000-000000000006','MetalTech','MetalTech Industrie S.p.A.','IT06789012345','Brescia','Lombardia','Factories & Manufacturing',45.5416,10.2118),
('11111111-0000-0000-0000-000000000007','CallCenter Plus','CC Plus Services S.r.l.','IT07890123456','Palermo','Sicilia','Offices & Call Centers',38.1157,13.3615),
('11111111-0000-0000-0000-000000000008','Clinica San Marco','San Marco Sanita S.r.l.','IT08901234567','Venezia','Veneto','Healthcare',45.4408,12.3155),
('11111111-0000-0000-0000-000000000009','TrasportiVeloci','TV Trasporti S.r.l.','IT09012345678','Torino','Piemonte','Transportation',45.0703,7.6869),
('11111111-0000-0000-0000-000000000010','PulitoSubito','PulitoSubito Servizi S.r.l.','IT00123456789','Bologna','Emilia-Romagna','Cleaning',44.4949,11.3426),
('11111111-0000-0000-0000-000000000011','Pizzeria Vesuvio','Vesuvio Food S.a.s.','IT01122334455','Firenze','Toscana','Restaurants',43.7696,11.2558),
('11111111-0000-0000-0000-000000000012','Grand Hotel Riviera','Riviera Hotels S.r.l.','IT02233445566','Genova','Liguria','Hotels',44.4056,8.9463),
('11111111-0000-0000-0000-000000000013','Magazzini Nord','MN Logistica S.p.A.','IT03344556677','Verona','Veneto','Logistics & Warehouses',45.4384,10.9916),
('11111111-0000-0000-0000-000000000014','Fabbrica Sud','Fabbrica Sud Manifatture S.r.l.','IT04455667788','Bari','Puglia','Factories & Manufacturing',41.1171,16.8719),
('11111111-0000-0000-0000-000000000015','Ospedale Privato Aurora','Aurora Healthcare S.p.A.','IT05566778899','Cagliari','Sardegna','Healthcare',39.2238,9.1217);

INSERT INTO public.reviews (company_id, role, sector, contract_type, period_from, period_to, score_salary, score_shifts, score_management, score_growth, score_safety, score_environment, pro, cons, advice, is_verified, lang, helpful_count, status, created_at) VALUES
('11111111-0000-0000-0000-000000000001','Cameriere','Restaurants','Seasonal','2025-05-01','2025-09-30',3,2,4,2,4,5,'Ambiente familiare, mance buone, colleghi fantastici.','Turni lunghi nel weekend, pochi giorni di riposo in estate.','Pianificare meglio i turni estivi e assumere personale extra.',true,'it',12,'approved',now()-interval '2 days'),
('11111111-0000-0000-0000-000000000001','Cuoco','Restaurants','Permanent','2023-01-01',NULL,4,3,4,3,4,4,'Stipendio puntuale, cucina ben attrezzata.','Poca formazione formale.','Investire in corsi per il personale.',false,'it',5,'approved',now()-interval '10 days'),
('11111111-0000-0000-0000-000000000002','Receptionist','Hotels','Fixed-term','2024-06-01','2024-10-31',3,3,3,3,5,4,'Struttura bellissima, ottima sicurezza.','Straordinari non sempre pagati.','Riconoscere gli straordinari in busta paga.',true,'it',8,'approved',now()-interval '5 days'),
('11111111-0000-0000-0000-000000000002','Housekeeping','Hotels','Seasonal','2025-04-01','2025-09-15',2,2,3,2,4,3,'Colleghi solidali.','Ritmi molto intensi, carichi pesanti.','Ridurre il numero di camere per persona.',false,'it',3,'approved',now()-interval '1 day'),
('11111111-0000-0000-0000-000000000003','Magazziniere','Logistics & Warehouses','Fixed-term','2024-01-01','2024-12-31',3,2,2,2,3,2,'Contratto regolare.','Turni notturni improvvisi, poca comunicazione dai capi.','Comunicare i turni con almeno una settimana di anticipo.',true,'it',21,'approved',now()-interval '3 days'),
('11111111-0000-0000-0000-000000000003','Picker','Logistics & Warehouses','Permanent','2022-03-01',NULL,3,3,2,2,3,3,'Buoni pasto e mensa.','Obiettivi di produttivita irrealistici.','Rivedere gli obiettivi con i lavoratori.',false,'it',9,'approved',now()-interval '7 days'),
('11111111-0000-0000-0000-000000000004','Cassiera','Retail & Supermarkets','Permanent','2021-09-01',NULL,3,4,3,3,4,4,'Orari flessibili, buona organizzazione.','Stipendio nella media, pochi aumenti.','Introdurre premi di produttivita.',true,'it',6,'approved',now()-interval '4 days'),
('11111111-0000-0000-0000-000000000004','Addetto reparto','Retail & Supermarkets','Fixed-term','2025-01-01','2025-06-30',3,3,4,3,4,4,'Manager disponibili, formazione iniziale seria.','Poche possibilita di passaggio a tempo indeterminato.','Stabilizzare chi lavora bene.',false,'it',2,'approved',now()-interval '12 hours'),
('11111111-0000-0000-0000-000000000005','Muratore','Construction','Fixed-term','2024-03-01','2024-11-30',2,2,2,1,2,2,'Paga puntuale.','Sicurezza in cantiere trascurata, DPI non sempre forniti.','Fornire sempre i dispositivi di protezione.',true,'it',30,'approved',now()-interval '6 days'),
('11111111-0000-0000-0000-000000000005','Operaio edile','Construction','Seasonal','2025-04-01','2025-09-30',2,1,2,1,2,2,'Nessuno in particolare.','Turni infiniti, nessuna crescita.','Rispettare le ore contrattuali.',false,'it',14,'approved',now()-interval '2 days'),
('11111111-0000-0000-0000-000000000006','Operaio','Factories & Manufacturing','Permanent','2020-01-01',NULL,4,4,4,4,5,4,'Sicurezza al top, stipendio sopra la media, crescita reale.','Poca flessibilita sugli orari.','Introdurre banca ore.',true,'it',18,'approved',now()-interval '1 day'),
('11111111-0000-0000-0000-000000000006','Tecnico manutentore','Factories & Manufacturing','Permanent','2019-06-01',NULL,4,4,5,4,5,5,'Management competente, formazione continua.','Sede poco servita dai mezzi.','Navetta aziendale.',false,'it',7,'approved',now()-interval '9 days'),
('11111111-0000-0000-0000-000000000007','Operatore call center','Offices & Call Centers','Fixed-term','2024-09-01','2025-02-28',2,3,2,2,4,3,'Ufficio pulito e sicuro.','Pressione costante sugli obiettivi, paga bassa.','Alzare la base fissa e ridurre la pressione.',true,'it',11,'approved',now()-interval '8 days'),
('11111111-0000-0000-0000-000000000007','Team leader','Offices & Call Centers','Permanent','2022-01-01',NULL,3,3,3,3,4,3,'Possibilita di smart working parziale.','Turnover altissimo.','Investire nella retention.',false,'it',4,'approved',now()-interval '3 days'),
('11111111-0000-0000-0000-000000000008','Infermiere','Healthcare','Permanent','2021-01-01',NULL,3,3,4,4,5,4,'Ambiente professionale, protocolli sicurezza rigorosi.','Turni notturni frequenti.','Rotazione piu equa dei notturni.',true,'it',15,'approved',now()-interval '2 days'),
('11111111-0000-0000-0000-000000000008','OSS','Healthcare','Fixed-term','2025-02-01',NULL,3,3,4,3,5,4,'Colleghi di supporto, formazione seria.','Carico di lavoro elevato.','Assumere piu personale.',false,'it',6,'approved',now()-interval '5 days'),
('11111111-0000-0000-0000-000000000009','Autista','Transportation','Permanent','2020-05-01',NULL,3,2,3,2,3,3,'Mezzi in buono stato.','Orari molto lunghi, poco preavviso.','Pianificare i giri con anticipo.',true,'it',9,'approved',now()-interval '4 days'),
('11111111-0000-0000-0000-000000000010','Addetta pulizie','Cleaning','Fixed-term','2024-10-01','2025-03-31',2,3,3,1,3,3,'Orari compatibili con la famiglia.','Paga bassa, nessuna crescita.','Adeguare la paga al contratto nazionale.',true,'it',10,'approved',now()-interval '6 days'),
('11111111-0000-0000-0000-000000000011','Pizzaiolo','Restaurants','Permanent','2022-06-01',NULL,4,3,4,4,4,5,'Ottimo clima, titolare presente e corretto.','Estate molto intensa.','Assumere un secondo pizzaiolo in alta stagione.',true,'it',13,'approved',now()-interval '1 day'),
('11111111-0000-0000-0000-000000000011','Cameriera','Restaurants','Seasonal','2025-06-01','2025-09-15',4,4,4,3,4,5,'Mance ottime, rispetto dei riposi.','Contratto solo stagionale.','Offrire continuita ai migliori.',false,'it',5,'approved',now()-interval '20 hours'),
('11111111-0000-0000-0000-000000000012','Concierge','Hotels','Permanent','2019-03-01',NULL,4,4,5,4,5,5,'Formazione eccellente, crescita interna concreta.','Standard molto alti richiesti.','Continuare cosi.',true,'it',22,'approved',now()-interval '3 days'),
('11111111-0000-0000-0000-000000000012','Chef de rang','Hotels','Fixed-term','2024-04-01','2024-10-31',4,4,4,4,5,4,'Team professionale.','Alloggio staff da migliorare.','Rinnovare gli alloggi.',false,'it',8,'approved',now()-interval '11 days'),
('11111111-0000-0000-0000-000000000013','Carrellista','Logistics & Warehouses','Permanent','2021-11-01',NULL,3,3,3,3,4,3,'Attrezzature moderne, sicurezza curata.','Straordinari frequenti.','Assumere piu personale nei picchi.',true,'it',7,'approved',now()-interval '2 days'),
('11111111-0000-0000-0000-000000000014','Operaia','Factories & Manufacturing','Fixed-term','2024-02-01','2025-01-31',2,2,2,2,2,2,'Vicino a casa.','Ambiente rumoroso, management assente, nessuna prospettiva.','Ascoltare i lavoratori e migliorare la sicurezza.',true,'it',19,'approved',now()-interval '4 days'),
('11111111-0000-0000-0000-000000000015','Medico','Healthcare','Permanent','2018-01-01',NULL,4,3,4,4,5,4,'Struttura moderna, colleghi preparati.','Burocrazia pesante.','Digitalizzare i processi.',true,'it',6,'approved',now()-interval '7 days'),
('11111111-0000-0000-0000-000000000015','Infermiera','Healthcare','Permanent','2022-09-01',NULL,3,3,4,3,5,4,'Sicurezza e protocolli chiari.','Turni pesanti.','Piu personale nei reparti critici.',false,'it',4,'approved',now()-interval '1 day');

INSERT INTO public.company_replies (review_id, company_id, reply_text)
SELECT r.id, r.company_id, 'Grazie per il feedback. Abbiamo introdotto una pianificazione dei turni con due settimane di anticipo e stiamo assumendo personale extra per la stagione estiva.'
FROM public.reviews r WHERE r.company_id = '11111111-0000-0000-0000-000000000001' AND r.role = 'Cameriere' LIMIT 1;

INSERT INTO public.company_replies (review_id, company_id, reply_text)
SELECT r.id, r.company_id, 'Ringraziamo per la segnalazione. Dal 2025 tutti i DPI sono forniti gratuitamente e abbiamo nominato un responsabile sicurezza per ogni cantiere.'
FROM public.reviews r WHERE r.company_id = '11111111-0000-0000-0000-000000000005' AND r.role = 'Muratore' LIMIT 1;