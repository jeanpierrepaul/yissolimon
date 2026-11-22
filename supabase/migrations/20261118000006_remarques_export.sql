-- 1. Remarque libre des parents (facultative), jointe à l'avis anonyme.
-- 2. Export anonymisé pour la coordination : calculé ici, côté serveur, pour qu'aucune donnée identifiante ne sorte.

alter table public.avis_parents add column remarque text check (remarque is null or length(remarque) <= 500);

drop function public.donner_avis(text, smallint[]);
create or replace function public.donner_avis(p_code text, p_reponses smallint[], p_remarque text default null)
returns void language plpgsql volatile security definer set search_path = public as $$
declare g uuid; r text := nullif(btrim(p_remarque), '');
begin
  select id into g from garderies where code_avis = p_code;
  if g is null then raise exception 'Lien invalide'; end if;
  if r is not null and length(r) > 500 then raise exception 'Remarque trop longue (500 caractères au plus)'; end if;
  if (select count(*) from avis_parents where garderie_id = g and date_avis = current_date) >= 200 then
    raise exception 'Trop d''avis aujourd''hui, réessayez demain';
  end if;
  insert into avis_parents (garderie_id, reponses, remarque) values (g, p_reponses, r);
end $$;
revoke execute on function public.donner_avis(text, smallint[], text) from public;
grant execute on function public.donner_avis(text, smallint[], text) to anon, authenticated;

-- Remarques lues par la garderie (responsable ou personne ressource qui la suit). Le mois seulement, pas le jour.
create or replace function public.remarques_avis(p_garderie uuid)
returns table (mois text, remarque text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.peut_lire(p_garderie) then raise exception 'Accès refusé'; end if;
  return query select to_char(a.date_avis, 'YYYY-MM'), a.remarque from avis_parents a
    where a.garderie_id = p_garderie and a.remarque is not null order by a.date_avis desc, a.id limit 200;
end $$;
revoke execute on function public.remarques_avis(uuid) from public, anon;
grant execute on function public.remarques_avis(uuid) to authenticated;

-- Export anonymisé (coordination seulement).
-- Règles : garderies remplacées par un code (G01, G02…), pas de nom ni de quartier, taille en tranche,
-- dates au mois, aucun texte libre (prénoms, remarques, notes, titres modifiables), aucun compte,
-- avis des parents seulement en moyenne et masqués sous 3 avis.
create or replace function public.export_anonyme()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare res jsonb;
begin
  if public.mon_role() is distinct from 'coordination' then raise exception 'Accès réservé à la coordination'; end if;
  with g as (
    select id, commune, nb_enfants,
      'G' || lpad(row_number() over (order by created_at, id)::text, 2, '0') as code
    from garderies where valide
  )
  select jsonb_build_object(
    'garderies', coalesce((select jsonb_agg(jsonb_build_object(
        'garderie', g.code, 'commune', g.commune,
        'taille', case when g.nb_enfants is null then 'non renseignée' when g.nb_enfants < 20 then 'moins de 20 enfants'
                       when g.nb_enfants < 40 then '20 à 39 enfants' else '40 enfants et plus' end,
        'cycles_termines', (select count(*) from evaluations e where e.garderie_id = g.id and e.statut = 'terminee' and not e.supprime)
      ) order by g.code) from g), '[]'),
    'evaluations', coalesce((select jsonb_agg(jsonb_build_object(
        'garderie', g.code, 'cycle', e.cycle, 'mois', to_char(e.date_eval, 'YYYY-MM'), 'reponses', e.reponses
      ) order by g.code, e.cycle) from evaluations e join g on g.id = e.garderie_id where e.statut = 'terminee' and not e.supprime), '[]'),
    'actions', coalesce((select jsonb_agg(jsonb_build_object(
        'garderie', g.code, 'theme', a.dimension, 'statut', a.statut, 'besoin_appui', a.besoin_appui,
        'echeance_mois', to_char(a.echeance, 'YYYY-MM')
      ) order by g.code, a.dimension) from actions a join g on g.id = a.garderie_id where not a.supprime), '[]'),
    'orientations', coalesce((select jsonb_agg(jsonb_build_object(
        'garderie', g.code, 'besoin', o.besoin, 'type_service', s.type, 'mois', to_char(o.date_orient, 'YYYY-MM'), 'statut', o.statut
      ) order by g.code, o.date_orient) from orientations o join g on g.id = o.garderie_id join services s on s.id = o.service_id where not o.supprime), '[]'),
    'avis_parents', coalesce((select jsonb_agg(x order by x->>'garderie') from (
        select jsonb_build_object(
          'garderie', g.code, 'nombre_avis', count(a.id),
          'scores', case when count(a.id) < 3 then null else
            (select jsonb_agg(round(t.v) order by t.i) from (select i, avg(a2.reponses[i]) * 50 as v from generate_series(1, 5) i
               join avis_parents a2 on a2.garderie_id = g.id group by i) t) end
        ) as x
        from g left join avis_parents a on a.garderie_id = g.id group by g.id, g.code) y), '[]'),
    'genere_le', to_char(now(), 'YYYY-MM-DD')
  ) into res;
  return res;
end $$;
revoke execute on function public.export_anonyme() from public, anon;
grant execute on function public.export_anonyme() to authenticated;
