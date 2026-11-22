-- Espace parents : chaque garderie VALIDÉE a son propre lien. Tout ce qui arrive par ce lien (avis, remarques)
-- est rattaché à cette garderie. Plus de liste publique des garderies.
drop function if exists public.garderies_parents();

-- À la validation, la coordination active la garderie et un lien parents tout neuf est généré.
create or replace function public.valider_garderie(p_garderie uuid)
returns void language plpgsql volatile security definer set search_path = public as $$
begin
  if public.mon_role() is distinct from 'coordination' then raise exception 'Accès réservé à la coordination'; end if;
  update garderies set valide = true, valide_le = now(), code_avis = encode(extensions.gen_random_bytes(9), 'hex')
  where id = p_garderie and not valide;
end $$;

-- Le lien ne fonctionne que pour une garderie validée.
create or replace function public.garderie_avis(p_code text)
returns text language sql stable security definer set search_path = public as $$
  select nom from garderies where code_avis = p_code and valide
$$;

create or replace function public.donner_avis(p_code text, p_reponses smallint[], p_remarque text default null)
returns void language plpgsql volatile security definer set search_path = public as $$
declare g uuid; r text := nullif(btrim(p_remarque), '');
begin
  select id into g from garderies where code_avis = p_code and valide;
  if g is null then raise exception 'Lien invalide'; end if;
  if r is not null and length(r) > 500 then raise exception 'Remarque trop longue (500 caractères au plus)'; end if;
  if (select count(*) from avis_parents where garderie_id = g and date_avis = current_date) >= 200 then
    raise exception 'Trop d''avis aujourd''hui, réessayez demain';
  end if;
  insert into avis_parents (garderie_id, reponses, remarque) values (g, p_reponses, r);
end $$;

create or replace function public.services_parents(p_code text)
returns table (nom text, type text, adresse text, telephone text, horaires text, description text)
language plpgsql stable security definer set search_path = public as $$
declare v_commune text;
begin
  select g.commune into v_commune from garderies g where g.code_avis = p_code and g.valide;
  if v_commune is null then raise exception 'Lien invalide'; end if;
  return query
  select s.nom, s.type, s.adresse, s.telephone, s.horaires, s.description
  from services s where s.actif and lower(s.commune) = lower(v_commune)
  order by s.type, s.nom;
end $$;

-- La responsable ne reçoit son lien qu'une fois la garderie validée.
create or replace function public.resume_avis(p_garderie uuid)
returns table (code text, total int, depuis date, scores int[])
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.peut_lire(p_garderie) then raise exception 'Accès refusé'; end if;
  return query
  select case when public.est_responsable_de(p_garderie) and gd.valide then gd.code_avis end,
         count(a.id)::int,
         min(a.date_avis),
         array(select round(avg(a2.reponses[i]) * 50)::int
               from generate_series(1, 5) i
               left join avis_parents a2 on a2.garderie_id = p_garderie
               group by i order by i)
  from garderies gd left join avis_parents a on a.garderie_id = gd.id
  where gd.id = p_garderie
  group by gd.code_avis, gd.valide;
end $$;
