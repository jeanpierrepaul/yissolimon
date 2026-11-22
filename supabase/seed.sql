-- Données de démonstration (fictives). Mot de passe de tous les comptes : Demo2026!

create or replace function pg_temp.rep(s text) returns jsonb language plpgsql as $$
declare
  dims text[] := array['securite','hygiene','eveil','inclusion','protection','familles','services','nutrition','bienetre'];
  r jsonb := '{}'; c text; i int := 0;
begin
  foreach c in array regexp_split_to_array(s, '') loop
    if c = ' ' then continue; end if;
    r := r || jsonb_build_object(dims[i / 4 + 1] || '.' || (i % 4 + 1), case when c = 'x' then null else c::int end);
    i := i + 1;
  end loop;
  return r;
end $$;

create or replace function pg_temp.utilisateur(uid uuid, mail text) returns void language sql as $$
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', mail,
    extensions.crypt('Demo2026!', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', mail, 'email_verified', true),
    'email', now(), now(), now());
$$;

insert into public.garderies (id, nom, commune, quartier, nb_enfants, valide) values
  ('11111111-0000-0000-0000-000000000001', 'Garderie Les Colibris', 'Commune pilote (fictive)', 'Quartier Est', 34, true),
  ('11111111-0000-0000-0000-000000000002', 'Garderie Mawuli', 'Commune pilote (fictive)', 'Marché central', 22, true),
  ('11111111-0000-0000-0000-000000000003', 'Garderie Akpé', 'Commune pilote (fictive)', 'Quartier Nord', 18, true);

select pg_temp.utilisateur('22222222-0000-0000-0000-000000000001', 'colibris@synergie.demo');
select pg_temp.utilisateur('22222222-0000-0000-0000-000000000002', 'mawuli@synergie.demo');
select pg_temp.utilisateur('22222222-0000-0000-0000-000000000003', 'akpe@synergie.demo');
select pg_temp.utilisateur('22222222-0000-0000-0000-000000000010', 'accompagnatrice@synergie.demo');
select pg_temp.utilisateur('22222222-0000-0000-0000-000000000020', 'coordination@synergie.demo');

insert into public.profils (id, nom, role, garderie_id) values
  ('22222222-0000-0000-0000-000000000001', 'Afi (responsable, Les Colibris)', 'responsable', '11111111-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000002', 'Ama (responsable, Mawuli)', 'responsable', '11111111-0000-0000-0000-000000000002'),
  ('22222222-0000-0000-0000-000000000003', 'Essi (responsable, Akpé)', 'responsable', '11111111-0000-0000-0000-000000000003'),
  ('22222222-0000-0000-0000-000000000010', 'Mme Abla (personne ressource)', 'accompagnateur', null),
  ('22222222-0000-0000-0000-000000000020', 'Coordination communale', 'coordination', null);

insert into public.suivis values
  ('22222222-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000002'),
  ('22222222-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000003');

-- Les Colibris : deux cycles, progrès visibles.
insert into public.evaluations (id, garderie_id, cycle, date_eval, statut, reponses, participants, auteur_id, updated_at) values
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 1, '2026-09-15', 'terminee',
   pg_temp.rep('1021 1101 0102 2x11 1121 0101 1x00 1001 1x01'), 'Afi, Kossi, Yawa', '22222222-0000-0000-0000-000000000001', '2026-09-15'),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 2, '2026-11-10', 'terminee',
   pg_temp.rep('2122 2121 2112 2112 2122 2112 2111 2112 2111'), 'Afi, Kossi, Yawa', '22222222-0000-0000-0000-000000000001', '2026-11-10');

-- Mawuli : premier cycle en cours.
insert into public.evaluations (id, garderie_id, cycle, date_eval, statut, reponses, participants, auteur_id, updated_at) values
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 1, '2026-10-20', 'terminee',
   pg_temp.rep('1110 0110 1001 1x01 2101 1001 0x00 0101 1x00'), 'Ama, Délali', '22222222-0000-0000-0000-000000000002', '2026-10-20');

insert into public.actions (id, garderie_id, evaluation_id, dimension, constat, titre, description, responsable, echeance, ressource_ids, statut, preuve, difficulte, besoin_appui, auteur_id, updated_at) values
  ('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'eveil',
   'Les activités d''éveil sont peu planifiées.', 'Préparer un programme d''activités de la semaine', 'Une activité par jour, affichée à l''entrée.', 'Yawa', '2026-10-05', '{eveil-programme}', 'terminee', 'Programme affiché depuis le 1er octobre.', null, false, '22222222-0000-0000-0000-000000000001', '2026-10-02'),
  ('44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'hygiene',
   'Les consignes de rangement et d''hygiène ne sont pas formalisées.', 'Mettre en place une routine de nettoyage visuelle', 'Affiche avec dessins, cochée chaque jour.', 'Kossi', '2026-10-15', '{hygiene-routine}', 'terminee', 'Routine affichée et cochée.', null, false, '22222222-0000-0000-0000-000000000001', '2026-10-14'),
  ('44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'familles',
   'Les familles reçoivent peu d''informations sur les activités.', 'Mettre en place un bref échange avec les parents', 'Un mot à la sortie chaque vendredi.', 'Afi', '2026-11-30', '{familles-echanges}', 'en_cours', null, 'Certains parents envoient un grand frère chercher l''enfant.', false, '22222222-0000-0000-0000-000000000001', '2026-11-08'),
  ('44444444-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003', 'services',
   'Pas de contact avec le centre de santé.', 'Noter les coordonnées du centre de santé', 'Relever adresse, téléphone et horaires.', 'Ama', '2026-11-15', '{services-orienter}', 'en_cours', null, 'Nous ne savons pas quel centre est compétent pour le quartier.', true, '22222222-0000-0000-0000-000000000002', '2026-11-05'),
  ('44444444-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003', 'hygiene',
   'Pas de lavage des mains avant les repas.', 'Installer un coin lavage des mains', 'Seau à robinet et savon, lavage avant chaque repas.', 'Délali', '2026-11-20', '{hygiene-mains}', 'a_faire', null, null, true, '22222222-0000-0000-0000-000000000002', '2026-10-21');

insert into public.notes_suivi (id, garderie_id, auteur_id, auteur_nom, texte, updated_at) values
  ('55555555-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000010', 'Mme Abla (personne ressource)',
   'Visite du 12/10 : programme d''activités bien suivi, les enfants participent. Prochaine étape : associer les parents.', '2026-10-12'),
  ('55555555-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'Ama (responsable, Mawuli)',
   'Nous avons besoin d''un seau à robinet pour le lavage des mains.', '2026-11-05');

-- Annuaire des services (fictif, à remplacer par les vrais contacts de la commune pilote).
insert into public.services (id, commune, nom, type, adresse, telephone, horaires, description) values
  ('66666666-0000-0000-0000-000000000001', 'Commune pilote (fictive)', 'Centre de santé du quartier Est', 'sante', 'Rue du marché, quartier Est', '+228 90 00 00 01', 'Lun-sam 7h-18h', 'Consultations des enfants, suivi de la croissance.'),
  ('66666666-0000-0000-0000-000000000002', 'Commune pilote (fictive)', 'Poste de vaccination (USP Nord)', 'sante', 'Quartier Nord', '+228 90 00 00 02', 'Mar et jeu 8h-13h', 'Vaccination de routine des enfants de 0 à 5 ans.'),
  ('66666666-0000-0000-0000-000000000003', 'Commune pilote (fictive)', 'Unité de récupération nutritionnelle', 'nutrition', 'Centre de santé du quartier Est', '+228 90 00 00 03', 'Lun-ven 8h-15h', 'Dépistage et prise en charge de la malnutrition.'),
  ('66666666-0000-0000-0000-000000000004', 'Commune pilote (fictive)', 'Centre social communal', 'social', 'Mairie, aile B', '+228 90 00 00 04', 'Lun-ven 8h-17h', 'Accompagnement des familles vulnérables, aides sociales.'),
  ('66666666-0000-0000-0000-000000000005', 'Commune pilote (fictive)', 'Service de protection de l''enfance', 'protection', 'Direction préfectorale', '+228 90 00 00 05', 'Lun-ven 8h-17h', 'Signalement et prise en charge des enfants en danger.'),
  ('66666666-0000-0000-0000-000000000006', 'Commune pilote (fictive)', 'Ligne d''écoute enfance (fictive)', 'protection', '—', '+228 90 00 00 06', '24h/24', 'Numéro d''écoute et d''orientation (numéro fictif pour la démonstration).'),
  ('66666666-0000-0000-0000-000000000007', 'Commune pilote (fictive)', 'Bureau d''état civil', 'etat_civil', 'Mairie, rez-de-chaussée', '+228 90 00 00 07', 'Lun-ven 8h-12h', 'Déclaration et enregistrement des naissances.'),
  ('66666666-0000-0000-0000-000000000008', 'Commune pilote (fictive)', 'Inspection de l''enseignement préscolaire', 'education', 'Quartier administratif', '+228 90 00 00 08', 'Lun-ven 8h-17h', 'Conseil pédagogique, formations des éducatrices.');

insert into public.orientations (id, garderie_id, service_id, besoin, date_orient, statut, auteur_id, updated_at) values
  ('77777777-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000002', 'vaccination', '2026-10-08', 'confirmee', '22222222-0000-0000-0000-000000000001', '2026-10-20'),
  ('77777777-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000007', 'etat_civil', '2026-10-22', 'orientee', '22222222-0000-0000-0000-000000000001', '2026-10-22'),
  ('77777777-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', '66666666-0000-0000-0000-000000000003', 'nutrition', '2026-11-03', 'orientee', '22222222-0000-0000-0000-000000000002', '2026-11-03');

-- Avis des parents de démonstration (anonymes) pour Les Colibris.
insert into public.avis_parents (garderie_id, date_avis, reponses) values
  ('11111111-0000-0000-0000-000000000001', '2026-11-03', '{2,2,1,2,2}'),
  ('11111111-0000-0000-0000-000000000001', '2026-11-04', '{2,1,0,1,2}'),
  ('11111111-0000-0000-0000-000000000001', '2026-11-04', '{2,2,1,2,1}'),
  ('11111111-0000-0000-0000-000000000001', '2026-11-06', '{1,2,0,2,2}'),
  ('11111111-0000-0000-0000-000000000001', '2026-11-10', '{2,2,1,1,2}');

-- Lien parents connu pour la démonstration (Les Colibris) : /avis/colibris-parents-demo
update public.garderies set code_avis = 'colibris-parents-demo' where id = '11111111-0000-0000-0000-000000000001';
