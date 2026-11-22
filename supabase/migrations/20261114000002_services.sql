-- Annuaire des services de la commune + orientations des familles (sans identité de l'enfant).

create table public.services (
  id uuid primary key default gen_random_uuid(),
  commune text not null,
  nom text not null,
  type text not null check (type in ('sante','nutrition','social','protection','etat_civil','education')),
  adresse text,
  telephone text,
  horaires text,
  description text,
  actif boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.orientations (
  id uuid primary key,
  garderie_id uuid not null references public.garderies(id),
  service_id uuid not null references public.services(id),
  besoin text not null check (besoin in ('sante','vaccination','nutrition','developpement','protection','etat_civil','social','autre')),
  date_orient date not null default current_date,
  statut text not null default 'orientee' check (statut in ('orientee','confirmee')),
  supprime boolean not null default false,
  auteur_id uuid references public.profils(id),
  updated_at timestamptz not null,
  serveur_at timestamptz not null default now()
);
create index on public.orientations (garderie_id, serveur_at);
create trigger t_orient before insert or update on public.orientations for each row execute function public.horodater();

alter table public.services enable row level security;
alter table public.orientations enable row level security;

-- L'annuaire est lisible par tous les comptes ; seules la coordination et les personnes ressources le tiennent à jour.
create policy services_lecture on public.services for select to authenticated using (true);
create policy services_ajout on public.services for insert to authenticated
  with check (public.mon_role() in ('coordination','accompagnateur'));
create policy services_modif on public.services for update to authenticated
  using (public.mon_role() in ('coordination','accompagnateur'))
  with check (public.mon_role() in ('coordination','accompagnateur'));

create policy orient_lecture on public.orientations for select to authenticated using (public.peut_lire(garderie_id));
create policy orient_ajout on public.orientations for insert to authenticated with check (public.est_responsable_de(garderie_id));
create policy orient_modif on public.orientations for update to authenticated
  using (public.est_responsable_de(garderie_id)) with check (public.est_responsable_de(garderie_id));

revoke delete on public.services, public.orientations from authenticated, anon;
revoke all on public.services, public.orientations from anon;

-- Coordination : nombre d'orientations par type de service (aucune donnée individuelle).
create or replace function public.stats_orientations()
returns table (type text, total int, confirmees int)
language plpgsql stable security definer set search_path = public as $$
begin
  if public.mon_role() is distinct from 'coordination' then
    raise exception 'Accès réservé à la coordination';
  end if;
  return query
  select s.type, count(o.id)::int, count(o.id) filter (where o.statut = 'confirmee')::int
  from services s left join orientations o on o.service_id = s.id and not o.supprime
  group by s.type order by 2 desc;
end $$;
revoke execute on function public.stats_orientations() from anon, public;
grant execute on function public.stats_orientations() to authenticated;
