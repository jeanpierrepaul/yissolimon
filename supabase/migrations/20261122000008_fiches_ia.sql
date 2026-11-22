-- Fiches proposées par l'assistant (IA) : brouillons relus et validés par une personne avant d'être visibles par les garderies.
create table public.fiches_ia (
  id uuid primary key default gen_random_uuid(),
  dimension text not null,
  titre text not null check (char_length(titre) <= 120),
  resume text not null check (char_length(resume) <= 300),
  pourquoi text not null check (char_length(pourquoi) <= 800),
  etapes jsonb not null default '[]'::jsonb,
  eviter jsonb not null default '[]'::jsonb,
  signe text not null default '' check (char_length(signe) <= 300),
  minutes int not null default 3 check (minutes between 1 and 15),
  statut text not null default 'a_valider' check (statut in ('a_valider', 'validee', 'refusee')),
  auteur_id uuid default auth.uid() references auth.users(id) on delete set null,
  valide_par uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fiches_ia enable row level security;

-- Tout le monde connecté lit les fiches validées ; accompagnement et coordination voient aussi les brouillons.
create policy fiches_ia_lecture on public.fiches_ia for select to authenticated
  using (statut = 'validee' or public.mon_role() in ('accompagnateur', 'coordination'));
-- Seuls l'accompagnement et la coordination proposent une fiche, toujours en brouillon.
create policy fiches_ia_ajout on public.fiches_ia for insert to authenticated
  with check (public.mon_role() in ('accompagnateur', 'coordination') and statut = 'a_valider' and auteur_id = auth.uid());
-- Ils valident ou refusent (relecture humaine obligatoire).
create policy fiches_ia_validation on public.fiches_ia for update to authenticated
  using (public.mon_role() in ('accompagnateur', 'coordination'))
  with check (public.mon_role() in ('accompagnateur', 'coordination'));

grant select, insert, update on public.fiches_ia to authenticated;
revoke all on public.fiches_ia from anon;
