-- Additive demo-only cashback catalog aligned with the demo statement merchants
-- (public/extras_ING_demo_2026.csv). Every row is explicitly simulated:
-- offer_status = 'demo', source_url = '' and the DEMO marker in conditions, so
-- offer-integrity.ts fail-closes them to the "demo" status and they never read
-- as verified personal savings. Values are illustrative, not real bank offers.
-- The 0000/0001 migrations are left untouched; this only inserts new demo rows.

INSERT INTO public.bank_offers (
  id, bank, product, title, summary, is_credit, rate_percent, merchant_pattern,
  merchant_rate_percent, categories, monthly_cap_ron, annual_cap_ron, annual_fee_ron,
  valid_from, valid_until, effort_minutes, steps, conditions, source_url, verified_on,
  offer_status, verification_evidence
) VALUES
-- Supermarket / mâncare -------------------------------------------------------
('demo-ing-supermarket','ING Bank','Card de debit','5% cashback la supermarket (Mega Image, Kaufland, Carrefour)','Primești 5% înapoi la cumpărăturile din supermarketurile partenere plătite cu cardul ING.',false,0,'mega image|kaufland|carrefour|auchan',5,ARRAY['mancare'],60,NULL,0,'2026-01-01','2026-12-31',5,ARRAY['Activează programul în aplicația ING.','Plătește la supermarketurile partenere cu cardul.'],'Ofertă demo inventată.','',NULL,'demo','{}'::jsonb),
('demo-lidl-plus','Banca Transilvania','Card de debit','4% cashback la Lidl','Cashback simulat pentru cumpărăturile de la Lidl plătite cu cardul BT.',false,0,'lidl',4,ARRAY['mancare'],40,NULL,0,'2026-01-01','2026-12-31',5,ARRAY['Leagă cardul BT de aplicația de loialitate.','Plătește la Lidl cu el.'],'Ofertă demo inventată.','',NULL,'demo','{}'::jsonb),
('demo-bcr-food-delivery','BCR','Card de debit','6% la livrări de mâncare (Glovo, Tazz, Bolt Food)','Cashback simulat la comenzile de mâncare plătite cu cardul de debit BCR.',false,0,'glovo|tazz|bolt',6,ARRAY['mancare','transport'],30,NULL,0,'2026-01-01','2026-12-31',5,ARRAY['Adaugă cardul BCR în aplicațiile de livrare.','Plătește comenzile cu el.'],'Ofertă demo inventată.','',NULL,'demo','{}'::jsonb),

-- Shopping online / retail ----------------------------------------------------
('demo-ing-emag-plus','ING Bank','Card de debit','4% înapoi la eMAG','Cashback simulat la comenzile de pe eMAG plătite cu cardul ING.',false,0,'emag',4,ARRAY['shopping'],50,NULL,0,'2026-01-01','2026-12-31',5,ARRAY['Adaugă cardul ING în contul eMAG.','Plătește comenzile cu el.'],'Ofertă demo inventată.','',NULL,'demo','{}'::jsonb),
('demo-raiffeisen-amazon','Raiffeisen Bank','Card de debit','5% la Amazon.de','Cashback simulat la cumpărăturile de pe Amazon.de plătite cu cardul Raiffeisen.',false,0,'amazon',5,ARRAY['shopping'],40,NULL,0,'2026-01-01','2026-12-31',5,ARRAY['Activează programul Raiffeisen.','Plătește pe Amazon.de cu cardul.'],'Ofertă demo inventată.','',NULL,'demo','{}'::jsonb),
('demo-bt-fashion','Banca Transilvania','Card Star','7% la fashion (H&M, Zara, Decathlon)','Puncte Star simulate la magazinele de fashion partenere.',false,0,'h&m|zara|decathlon',7,ARRAY['shopping'],50,NULL,0,'2026-01-01','2026-12-31',5,ARRAY['Mută plata la magazinele de fashion pe cardul BT.'],'Ofertă demo inventată.','',NULL,'demo','{}'::jsonb),

-- Abonamente & tech -----------------------------------------------------------
('demo-bt-subscriptions','Banca Transilvania','Card Star','10% la abonamente digitale (Netflix, Spotify, Adobe, OpenAI)','Cashback simulat generos la abonamentele digitale plătite cu cardul BT.',false,0,'netflix|spotify|adobe|openai',10,ARRAY['abonamente_tech'],40,NULL,0,'2026-01-01','2026-12-31',5,ARRAY['Mută plata abonamentelor pe cardul BT.'],'Ofertă demo inventată.','',NULL,'demo','{}'::jsonb),

-- Transport / combustibil -----------------------------------------------------
('demo-bcr-fuel','BCR','Card de debit','5% la carburant (OMV, Petrom)','Cashback simulat la alimentările plătite cu cardul de debit BCR.',false,0,'omv|petrom',5,ARRAY['transport'],40,NULL,0,'2026-01-01','2026-12-31',5,ARRAY['Activează cashback-ul la carburant în aplicația George.','Plătește alimentările cu cardul.'],'Ofertă demo inventată.','',NULL,'demo','{}'::jsonb),
('demo-ing-rides','ING Bank','Card de debit','8% la Bolt','Cashback simulat la cursele Bolt plătite cu cardul ING.',false,0,'bolt',8,ARRAY['transport'],20,NULL,0,'2026-01-01','2026-12-31',5,ARRAY['Adaugă cardul ING în aplicația Bolt.','Plătește cursele cu el.'],'Ofertă demo inventată.','',NULL,'demo','{}'::jsonb),

-- Utilități -------------------------------------------------------------------
('demo-bt-utilities','Banca Transilvania','Card de debit','3% la facturi de utilități (Enel, Digi)','Cashback simulat la plata facturilor recurente cu cardul BT.',false,0,'enel|digi',3,ARRAY['chirie_utilitati'],30,NULL,0,'2026-01-01','2026-12-31',5,ARRAY['Setează facturile pe debit direct de pe cardul BT.'],'Ofertă demo inventată.','',NULL,'demo','{}'::jsonb),

-- Cashback general ------------------------------------------------------------
('demo-raiffeisen-everything','Raiffeisen Bank','Card de debit','2% cashback la tot','Cashback simulat general la toate plățile cu cardul de debit Raiffeisen.',false,2,NULL,NULL,ARRAY['mancare','shopping','abonamente_tech','transport','chirie_utilitati'],NULL,1200,0,'2026-01-01','2026-12-31',10,ARRAY['Activează programul Smart în aplicația Raiffeisen.','Plătește orice cu cardul.'],'Ofertă demo inventată.','',NULL,'demo','{}'::jsonb);
