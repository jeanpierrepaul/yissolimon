-- Espace parents : à partir du lien de la garderie, les parents voient les services liés à l'enfance de leur commune.
-- Ce sont des services publics (santé, vaccination, état civil…) : aucune donnée personnelle n'est exposée.

create or replace function public.services_parents(p_code text)
returns table (nom text, type text, adresse text, telephone text, horaires text, description text)
language plpgsql stable security definer set search_path = public as $$
declare v_commune text;
begin
  select g.commune into v_commune from garderies g where g.code_avis = p_code;
  if v_commune is null then raise exception 'Lien invalide'; end if;
  return query
  select s.nom, s.type, s.adresse, s.telephone, s.horaires, s.description
  from services s where s.actif and lower(s.commune) = lower(v_commune)
  order by s.type, s.nom;
end $$;

revoke execute on function public.services_parents(text) from public;
grant execute on function public.services_parents(text) to anon, authenticated;
