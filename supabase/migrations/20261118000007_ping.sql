-- Petite fonction appelée chaque jour par le script de maintien en activité.
-- Elle fait une vraie lecture en base (sans rien renvoyer de sensible) pour que Supabase compte le projet comme actif.
create or replace function public.ping()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('ok', true, 'heure', now(), 'garderies', (select count(*) from garderies where valide))
$$;
revoke execute on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
