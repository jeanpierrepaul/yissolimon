-- Nouveau type d'adresse : « loisirs » (parcs, aires de jeux, bibliothèque, centre culturel…),
-- pour que les parents trouvent aussi des lieux où emmener les enfants jouer, découvrir et s'épanouir.
do $$
declare c record;
begin
  for c in select conrelid::regclass as t, conname from pg_constraint
           where contype = 'c' and conrelid in ('public.services'::regclass, 'public.services_proposes'::regclass)
             and pg_get_constraintdef(oid) like '%etat_civil%'
  loop
    execute format('alter table %s drop constraint %I', c.t, c.conname);
  end loop;
end $$;

alter table public.services add constraint services_type_check
  check (type in ('sante','nutrition','social','protection','etat_civil','education','loisirs'));
alter table public.services_proposes add constraint services_proposes_type_check
  check (type in ('sante','nutrition','social','protection','etat_civil','education','loisirs'));

-- Lieux de démonstration (fictifs) pour la commune pilote.
insert into public.services (id, commune, nom, type, adresse, telephone, horaires, description) values
  ('66666666-0000-0000-0000-000000000011', 'Commune pilote (fictive)', 'Jardin public du quartier Est', 'loisirs', 'Derrière la mairie, quartier Est', null, 'Tous les jours 7h-19h', 'Aire de jeux ombragée (toboggans, balançoires), pelouse pour courir et pique-niquer en famille. Gratuit.'),
  ('66666666-0000-0000-0000-000000000012', 'Commune pilote (fictive)', 'Bibliothèque municipale : coin des petits', 'loisirs', 'Centre-ville', '+228 90 00 00 11', 'Mer et sam 9h-12h', 'Livres d’images et heure du conte le samedi à 10h pour les 2 à 6 ans. Entrée libre.'),
  ('66666666-0000-0000-0000-000000000013', 'Commune pilote (fictive)', 'Centre culturel : éveil musical et danse', 'loisirs', 'Quartier administratif', '+228 90 00 00 12', 'Sam 15h-17h', 'Atelier percussions, chants et danses traditionnelles pour les enfants accompagnés d’un parent.'),
  ('66666666-0000-0000-0000-000000000014', 'Commune pilote (fictive)', 'Terrain de jeux de l’école Nord', 'loisirs', 'Quartier Nord', null, 'Mer après-midi et week-end', 'Espace ouvert aux familles en dehors des heures de classe : ballons, jeux de cour, course.'),
  ('66666666-0000-0000-0000-000000000015', 'Commune pilote (fictive)', 'Fête des enfants du quartier', 'loisirs', 'Place du marché', null, 'Un dimanche par mois', 'Jeux collectifs, contes, maquillage et goûter partagé, organisés par le comité de quartier.')
on conflict (id) do nothing;
