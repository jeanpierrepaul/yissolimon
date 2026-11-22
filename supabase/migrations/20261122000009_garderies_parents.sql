-- Espace parents : à la première visite, le parent choisit la garderie de son enfant dans la liste.
-- Seules les garderies validées par la coordination sont proposées, avec leur nom et leur quartier (aucune autre donnée).
create or replace function public.garderies_parents()
returns table (nom text, quartier text, commune text, code text)
language sql stable security definer set search_path = public as $$
  select nom, quartier, commune, code_avis from garderies where valide order by commune, nom
$$;

revoke execute on function public.garderies_parents() from public;
grant execute on function public.garderies_parents() to anon, authenticated;
