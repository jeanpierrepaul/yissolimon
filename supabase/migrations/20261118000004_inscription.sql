-- Inscription libre des garderies, avec validation par la coordination.
-- La garderie travaille tout de suite, mais n'entre dans les statistiques communales qu'une fois validée.

alter table public.garderies add column valide boolean not null default true;
alter table public.garderies alter column valide set default false;
alter table public.garderies add column valide_le timestamptz;

-- À la création d'un compte avec la mention « inscription = garderie », on crée la garderie et le profil responsable.
-- Les données viennent de l'utilisateur : elles sont vérifiées ici, côté serveur.
create or replace function public.inscription_garderie()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_nom text := btrim(m->>'garderie');
  v_commune text := btrim(m->>'commune');
  v_quartier text := nullif(btrim(m->>'quartier'), '');
  v_resp text := btrim(m->>'responsable');
  v_nb int;
  g uuid;
begin
  if m->>'inscription' is distinct from 'garderie' then return new; end if;
  if v_nom is null or length(v_nom) not between 2 and 120 then raise exception 'Nom de garderie invalide'; end if;
  if v_commune is null or length(v_commune) not between 2 and 80 then raise exception 'Commune invalide'; end if;
  if v_quartier is not null and length(v_quartier) > 80 then raise exception 'Quartier invalide'; end if;
  if v_resp is null or length(v_resp) not between 1 and 80 then raise exception 'Nom de la responsable invalide'; end if;
  begin
    v_nb := nullif(m->>'nb_enfants', '')::int;
  exception when others then raise exception 'Nombre d''enfants invalide';
  end;
  if v_nb is not null and v_nb not between 0 and 500 then raise exception 'Nombre d''enfants invalide'; end if;

  insert into garderies (nom, commune, quartier, nb_enfants, valide) values (v_nom, v_commune, v_quartier, v_nb, false)
  returning id into g;
  insert into profils (id, nom, role, garderie_id) values (new.id, v_resp, 'responsable', g);
  return new;
end $$;

create trigger t_inscription_garderie after insert on auth.users
  for each row execute function public.inscription_garderie();

-- Coordination : liste des garderies en attente et validation.
create or replace function public.garderies_en_attente()
returns table (id uuid, nom text, commune text, quartier text, nb_enfants int, inscrite_le timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.mon_role() is distinct from 'coordination' then raise exception 'Accès réservé à la coordination'; end if;
  return query select g.id, g.nom, g.commune, g.quartier, g.nb_enfants, g.created_at from garderies g where not g.valide order by g.created_at;
end $$;

create or replace function public.valider_garderie(p_garderie uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if public.mon_role() is distinct from 'coordination' then raise exception 'Accès réservé à la coordination'; end if;
  update garderies set valide = true, valide_le = now() where id = p_garderie;
end $$;

-- Statistiques : seulement les garderies validées.
create or replace function public.stats_coordination()
returns table (
  garderie_id uuid, nom text, commune text,
  nb_evaluations int, derniere_eval date, score_global numeric, scores jsonb,
  actions_total int, actions_terminees int, actions_en_cours int, besoins_appui int
) language plpgsql stable security definer set search_path = public as $$
begin
  if public.mon_role() is distinct from 'coordination' then
    raise exception 'Accès réservé à la coordination';
  end if;
  return query
  with derniere as (
    select distinct on (e.garderie_id) e.garderie_id, e.date_eval, e.reponses
    from evaluations e where e.statut = 'terminee' and not e.supprime
    order by e.garderie_id, e.date_eval desc, e.updated_at desc
  ), rep as (
    select d.garderie_id, split_part(k.key, '.', 1) as dim, (k.value)::text::numeric as v
    from derniere d, jsonb_each(d.reponses) k
    where jsonb_typeof(k.value) = 'number'
  ), parDim as (
    select r.garderie_id, r.dim, round(avg(r.v) / 2 * 100) as pct from rep r group by r.garderie_id, r.dim
  )
  select g.id, g.nom, g.commune,
    (select count(*)::int from evaluations e where e.garderie_id = g.id and e.statut = 'terminee' and not e.supprime),
    (select d.date_eval from derniere d where d.garderie_id = g.id),
    (select round(avg(p.pct)) from parDim p where p.garderie_id = g.id),
    coalesce((select jsonb_object_agg(p.dim, p.pct) from parDim p where p.garderie_id = g.id), '{}'::jsonb),
    (select count(*)::int from actions a where a.garderie_id = g.id and not a.supprime),
    (select count(*)::int from actions a where a.garderie_id = g.id and not a.supprime and a.statut = 'terminee'),
    (select count(*)::int from actions a where a.garderie_id = g.id and not a.supprime and a.statut = 'en_cours'),
    (select count(*)::int from actions a where a.garderie_id = g.id and not a.supprime and a.besoin_appui and a.statut <> 'terminee')
  from garderies g where g.valide order by g.nom;
end $$;

create or replace function public.stats_orientations()
returns table (type text, total int, confirmees int)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.mon_role() is distinct from 'coordination' then
    raise exception 'Accès réservé à la coordination';
  end if;
  return query
  select s.type, count(o.id)::int, count(o.id) filter (where o.statut = 'confirmee')::int
  from services s
  left join (orientations o join garderies g on g.id = o.garderie_id and g.valide) on o.service_id = s.id and not o.supprime
  group by s.type order by 2 desc;
end $$;

revoke execute on function public.inscription_garderie() from public, anon, authenticated;
revoke execute on function public.garderies_en_attente(), public.valider_garderie(uuid) from public, anon;
grant execute on function public.garderies_en_attente(), public.valider_garderie(uuid) to authenticated;
