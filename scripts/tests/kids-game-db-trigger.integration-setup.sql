CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;

CREATE TABLE public.kids_game_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_id text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  collectibles integer,
  distance integer NOT NULL DEFAULT 0,
  difficulty text,
  completed boolean,
  created_at timestamptz,
  client_submission_id text NOT NULL,
  xp_awarded smallint NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  played_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
