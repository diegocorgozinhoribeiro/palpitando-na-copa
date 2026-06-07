-- Esquema SQL equivalente ao schema Drizzle (src/db/schema.ts).
-- Use apenas se preferir criar as tabelas manualmente no SQL Editor do Neon
-- em vez de rodar `npm run db:push`.

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  ordem integer not null unique,
  fase text,
  team_a text not null,
  team_b text not null,
  flag_a text,
  flag_b text,
  grupo text,
  estadio text,
  cidade text,
  kickoff_at timestamptz not null,
  status text not null default 'agendado',
  definido boolean not null default true,
  score_a integer,
  score_b integer,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  texto text not null,
  tipo text not null,
  dificuldade text not null,
  pontos integer not null default 10,
  opcoes jsonb not null default '[]'::jsonb,
  ativa boolean not null default true
);

create table if not exists match_questions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  question_id uuid not null references questions(id) on delete restrict,
  ordem integer not null,
  resposta_correta text,
  unique (match_id, question_id)
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  match_question_id uuid not null references match_questions(id) on delete cascade,
  resposta text not null,
  acertou boolean,
  pontos integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, match_question_id)
);

create table if not exists leagues (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo text not null unique,
  owner_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create index if not exists idx_predictions_user on predictions(user_id);
create index if not exists idx_match_questions_match on match_questions(match_id);
create index if not exists idx_league_members_league on league_members(league_id);
create index if not exists idx_league_members_user on league_members(user_id);
