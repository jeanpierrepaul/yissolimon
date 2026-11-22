-- Les responsables de garderie proposent un service de leur quartier ; la coordination vérifie avant publication.
create table public.services_proposes (
  id uuid primary key default gen_random_uuid(),
  garderie_id uuid not null references public.garderies(id),
  nom text not null check (char_length(nom) between 2 and 120),
  type text not null check (type in ('sante','nutrition','social','protection','etat_civil','education')),
  adresse text check (char_length(adresse) <= 200),
  telephone text check (char_length(telephone) <= 40),
  horaires text check (char_length(horaires) <= 120),
  description text check (char_length(description) <= 400),
  remarque text check (char_length(remarque) <= 400),
  statut text not null default 'a_verifier' check (statut in ('a_verifier', 'publie', 'refuse')),
  propose_par uuid default auth.uid() references auth.users(id) on delete set null,
  traite_par uuid references auth.users(id) on delete set null,
  service_id uuid references public.services(id),
  created_at timestamptz not null default now(),
  traite_le timestamptz
);
create index on public.services_proposes (statut, created_at);

alter table public.services_proposes enable row level security;

-- La responsable voit les propositions de sa garderie ; coordination et accompagnement voient tout.
create policy sp_lecture on public.services_proposes for select to authenticated
  using (public.peut_lire(garderie_id) or public.mon_role() in ('coordination', 'accompagnateur'));
-- Seule une responsable propose, pour sa propre garderie, toujours « à vérifier ».
create policy sp_ajout on public.services_proposes for insert to authenticated
  with check (public.est_responsable_de(garderie_id) and statut = 'a_verifier' and propose_par = auth.uid()
              and traite_par is null and service_id is null);

grant select, insert on public.services_proposes to authenticated;
revoke all on public.services_proposes from anon;

-- Décision de la coordination : publier (le service entre dans l'annuaire de la commune) ou refuser.
create or replace function public.traiter_service_propose(p_id uuid, p_publier boolean)
returns void language plpgsql volatile security definer set search_path = public as $$
declare p services_proposes; v_service uuid;
begin
  if public.mon_role() is distinct from 'coordination' then raise exception 'Accès réservé à la coordination'; end if;
  select * into p from services_proposes where id = p_id and statut = 'a_verifier' for update;
  if not found then raise exception 'Proposition introuvable ou déjà traitée'; end if;
  if p_publier then
    insert into services (commune, nom, type, adresse, telephone, horaires, description)
    select g.commune, p.nom, p.type, p.adresse, p.telephone, p.horaires, p.description from garderies g where g.id = p.garderie_id
    returning id into v_service;
  end if;
  update services_proposes set statut = case when p_publier then 'publie' else 'refuse' end,
    traite_par = auth.uid(), traite_le = now(), service_id = v_service where id = p_id;
end $$;
revoke execute on function public.traiter_service_propose(uuid, boolean) from public, anon;
grant execute on function public.traiter_service_propose(uuid, boolean) to authenticated;
