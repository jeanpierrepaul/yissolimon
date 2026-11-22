-- Avis des parents, anonyme : le parent répond via un lien propre à la garderie, sans compte et sans nom.
-- La table n'est lisible par personne directement : la garderie et sa personne ressource ne reçoivent que des totaux.

alter table public.garderies
  add column code_avis text not null unique default encode(extensions.gen_random_bytes(9), 'hex');

create table public.avis_parents (
  id uuid primary key default gen_random_uuid(),
  garderie_id uuid not null references public.garderies(id),
  date_avis date not null default current_date, -- la date seule, pas l'heure : moins de risque de reconnaître qui a répondu
  reponses smallint[] not null check (
    array_length(reponses, 1) = 5 and 0 <= all(reponses) and 2 >= all(reponses))
);
create index on public.avis_parents (garderie_id, date_avis);

alter table public.avis_parents enable row level security;
revoke all on public.avis_parents from anon, authenticated;

-- Nom de la garderie à partir du lien (affiché en haut du questionnaire).
create or replace function public.garderie_avis(p_code text)
returns text language sql stable security definer set search_path = public as $$
  select nom from garderies where code_avis = p_code
$$;

-- Dépôt d'un avis. Limité à 200 avis par garderie et par jour pour éviter le remplissage abusif.
create or replace function public.donner_avis(p_code text, p_reponses smallint[])
returns void language plpgsql volatile security definer set search_path = public as $$
declare g uuid;
begin
  select id into g from garderies where code_avis = p_code;
  if g is null then raise exception 'Lien invalide'; end if;
  if (select count(*) from avis_parents where garderie_id = g and date_avis = current_date) >= 200 then
    raise exception 'Trop d''avis aujourd''hui, réessayez demain';
  end if;
  insert into avis_parents (garderie_id, reponses) values (g, p_reponses);
end $$;

-- Résumé pour la garderie (responsable ou personne ressource qui la suit) : nombre d'avis et score par question.
-- Le code du lien n'est rendu qu'à la responsable.
create or replace function public.resume_avis(p_garderie uuid)
returns table (code text, total int, depuis date, scores int[])
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.peut_lire(p_garderie) then raise exception 'Accès refusé'; end if;
  return query
  select case when public.est_responsable_de(p_garderie) then gd.code_avis end,
         count(a.id)::int,
         min(a.date_avis),
         array(select round(avg(a2.reponses[i]) * 50)::int
               from generate_series(1, 5) i
               left join avis_parents a2 on a2.garderie_id = p_garderie
               group by i order by i)
  from garderies gd left join avis_parents a on a.garderie_id = gd.id
  where gd.id = p_garderie
  group by gd.code_avis;
end $$;

-- La responsable peut changer le lien (par exemple s'il a circulé trop largement).
create or replace function public.nouveau_lien_avis(p_garderie uuid)
returns text language plpgsql volatile security definer set search_path = public as $$
declare c text := encode(extensions.gen_random_bytes(9), 'hex');
begin
  if not public.est_responsable_de(p_garderie) then raise exception 'Accès refusé'; end if;
  update garderies set code_avis = c where id = p_garderie;
  return c;
end $$;

revoke execute on function public.garderie_avis(text), public.donner_avis(text, smallint[]),
  public.resume_avis(uuid), public.nouveau_lien_avis(uuid) from public;
grant execute on function public.garderie_avis(text), public.donner_avis(text, smallint[]) to anon, authenticated;
grant execute on function public.resume_avis(uuid), public.nouveau_lien_avis(uuid) to authenticated;
