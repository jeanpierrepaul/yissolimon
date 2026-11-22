-- Synergie Garderies : schéma, sécurité par rôle (RLS) et synchronisation différée.
-- Rôles : responsable (sa garderie), accompagnateur (garderies suivies), coordination (statistiques agrégées seulement).

create table public.garderies (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  commune text not null,
  quartier text,
  nb_enfants int,
  created_at timestamptz not null default now()
);

create table public.profils (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null,
  role text not null check (role in ('responsable','accompagnateur','coordination')),
  garderie_id uuid references public.garderies(id),
  created_at timestamptz not null default now()
);

create table public.suivis (
  accompagnateur_id uuid references public.profils(id) on delete cascade,
  garderie_id uuid references public.garderies(id) on delete cascade,
  primary key (accompagnateur_id, garderie_id)
);

-- Les identifiants sont créés sur le téléphone (hors ligne), d'où l'absence de valeur par défaut.
create table public.evaluations (
  id uuid primary key,
  garderie_id uuid not null references public.garderies(id),
  cycle int not null default 1,
  date_eval date not null default current_date,
  statut text not null default 'brouillon' check (statut in ('brouillon','terminee')),
  reponses jsonb not null default '{}'::jsonb,
  participants text,
  supprime boolean not null default false,
  auteur_id uuid references public.profils(id),
  updated_at timestamptz not null,
  serveur_at timestamptz not null default now()
);

create table public.actions (
  id uuid primary key,
  garderie_id uuid not null references public.garderies(id),
  evaluation_id uuid references public.evaluations(id),
  dimension text not null,
  constat text,
  titre text not null,
  description text,
  responsable text,
  echeance date,
  ressource_ids text[] not null default '{}',
  statut text not null default 'a_faire' check (statut in ('a_faire','en_cours','terminee')),
  preuve text,
  difficulte text,
  besoin_appui boolean not null default false,
  supprime boolean not null default false,
  auteur_id uuid references public.profils(id),
  updated_at timestamptz not null,
  serveur_at timestamptz not null default now()
);

create table public.notes_suivi (
  id uuid primary key,
  garderie_id uuid not null references public.garderies(id),
  auteur_id uuid references public.profils(id),
  auteur_nom text,
  texte text not null check (length(texte) <= 2000),
  supprime boolean not null default false,
  updated_at timestamptz not null,
  serveur_at timestamptz not null default now()
);

create index on public.evaluations (garderie_id, serveur_at);
create index on public.actions (garderie_id, serveur_at);
create index on public.notes_suivi (garderie_id, serveur_at);

-- Horodatage serveur (curseur de synchronisation) + « la dernière modification gagne ».
create or replace function public.horodater() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return old; -- une version plus ancienne arrive en retard : on garde la plus récente
  end if;
  new.serveur_at := clock_timestamp();
  if tg_op = 'UPDATE' then
    new.garderie_id := old.garderie_id; -- une ligne ne change jamais de garderie
  end if;
  return new;
end $$;

create trigger t_eval before insert or update on public.evaluations for each row execute function public.horodater();
create trigger t_act before insert or update on public.actions for each row execute function public.horodater();
create trigger t_note before insert or update on public.notes_suivi for each row execute function public.horodater();

-- Fonctions d'aide pour les règles d'accès (security definer pour éviter la récursion RLS).
create or replace function public.mon_role() returns text language sql stable security definer set search_path = public as $$
  select role from profils where id = auth.uid()
$$;

create or replace function public.peut_lire(g uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profils p where p.id = auth.uid() and p.role = 'responsable' and p.garderie_id = g)
      or exists (select 1 from suivis s where s.accompagnateur_id = auth.uid() and s.garderie_id = g)
$$;

create or replace function public.est_responsable_de(g uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profils p where p.id = auth.uid() and p.role = 'responsable' and p.garderie_id = g)
$$;

alter table public.garderies enable row level security;
alter table public.profils enable row level security;
alter table public.suivis enable row level security;
alter table public.evaluations enable row level security;
alter table public.actions enable row level security;
alter table public.notes_suivi enable row level security;

create policy garderies_lecture on public.garderies for select to authenticated
  using (public.peut_lire(id) or public.mon_role() = 'coordination');

create policy profils_soi on public.profils for select to authenticated using (id = auth.uid());

create policy suivis_soi on public.suivis for select to authenticated using (accompagnateur_id = auth.uid());

-- Évaluations et actions : la responsable écrit, l'accompagnatrice lit.
create policy eval_lecture on public.evaluations for select to authenticated using (public.peut_lire(garderie_id));
create policy eval_ajout on public.evaluations for insert to authenticated with check (public.est_responsable_de(garderie_id));
create policy eval_modif on public.evaluations for update to authenticated
  using (public.est_responsable_de(garderie_id)) with check (public.est_responsable_de(garderie_id));

create policy act_lecture on public.actions for select to authenticated using (public.peut_lire(garderie_id));
create policy act_ajout on public.actions for insert to authenticated with check (public.est_responsable_de(garderie_id));
create policy act_modif on public.actions for update to authenticated
  using (public.est_responsable_de(garderie_id)) with check (public.est_responsable_de(garderie_id));

-- Notes de suivi : la responsable et l'accompagnatrice de la garderie écrivent, chacune ses propres notes.
create policy note_lecture on public.notes_suivi for select to authenticated using (public.peut_lire(garderie_id));
create policy note_ajout on public.notes_suivi for insert to authenticated
  with check (public.peut_lire(garderie_id) and auteur_id = auth.uid());
create policy note_modif on public.notes_suivi for update to authenticated
  using (auteur_id = auth.uid()) with check (auteur_id = auth.uid());

-- Aucune suppression physique : on marque « supprime » (nécessaire pour synchroniser les suppressions).
revoke delete on public.evaluations, public.actions, public.notes_suivi from authenticated, anon;
revoke all on all tables in schema public from anon;

-- Tableau de bord de la coordination : uniquement des chiffres agrégés, pas les réponses ni les notes.
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
  from garderies g order by g.nom;
end $$;

revoke execute on function public.stats_coordination() from anon, public;
grant execute on function public.stats_coordination() to authenticated;
