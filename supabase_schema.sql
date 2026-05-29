create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.vocab_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean not null default false,
  share_slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.vocab_sets(id) on delete cascade,
  term text not null,
  definition text not null,
  phonetic text,
  example_sentence text,
  audio_url text,
  position integer not null default 0
);

create table public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  mastery_level integer not null default 0 check (mastery_level in (0, 1, 2)),
  correct_streak integer not null default 0,
  last_reviewed_at timestamptz,
  unique (user_id, card_id)
);

create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  set_id uuid not null references public.vocab_sets(id) on delete cascade,
  mode text not null check (mode in ('learn', 'test', 'match')),
  score integer not null default 0,
  total integer not null default 0,
  duration_seconds integer not null default 0,
  completed_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.vocab_sets enable row level security;
alter table public.cards enable row level security;
alter table public.progress enable row level security;
alter table public.quiz_sessions enable row level security;

create policy "users can read own profile"
on public.users for select
using (auth.uid() = id);

create policy "users can update own profile"
on public.users for update
using (auth.uid() = id);

create policy "set owner full read"
on public.vocab_sets for select
using (owner_id = auth.uid() or is_public = true);

create policy "set owner insert"
on public.vocab_sets for insert
with check (owner_id = auth.uid());

create policy "set owner update"
on public.vocab_sets for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "set owner delete"
on public.vocab_sets for delete
using (owner_id = auth.uid());

create policy "cards readable if set accessible"
on public.cards for select
using (
  exists (
    select 1
    from public.vocab_sets
    where vocab_sets.id = cards.set_id
      and (vocab_sets.owner_id = auth.uid() or vocab_sets.is_public = true)
  )
);

create policy "cards writable by set owner"
on public.cards for all
using (
  exists (
    select 1
    from public.vocab_sets
    where vocab_sets.id = cards.set_id
      and vocab_sets.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.vocab_sets
    where vocab_sets.id = cards.set_id
      and vocab_sets.owner_id = auth.uid()
  )
);

create policy "progress owner access"
on public.progress for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "quiz sessions owner access"
on public.quiz_sessions for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
