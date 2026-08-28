-- Carrera Bíblica — esquema de datos por usuario en Supabase
--
-- Cómo aplicarlo:
--   1) Entra a tu proyecto en https://supabase.com/dashboard
--   2) Ve a "SQL Editor" → "New query"
--   3) Pega TODO este archivo y ejecútalo (Run)
--
-- Diseño: una sola fila por usuario, con sus categorías/preguntas/poderes
-- guardados como JSON (misma forma que ya usa el juego: {cats, banco, poderes}).
-- Es intencionalmente simple: no hay nada que un usuario pueda consultar o
-- modificar de otro usuario, porque cada política de RLS exige
-- auth.uid() = user_id.

create table if not exists public.user_game_data (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  -- límite defensivo: evita que una cuenta guarde un JSON descontrolado (~2 MB)
  constraint user_game_data_size check (pg_column_size(data) < 2000000)
);

-- Row Level Security: SIN esto, cualquiera con la anon key podría leer o
-- escribir cualquier fila. Con esto, ni siquiera hace falta confiar en el
-- código del cliente: la base de datos rechaza cualquier fila que no sea la
-- del propio usuario autenticado.
alter table public.user_game_data enable row level security;

create policy "select_own_data" on public.user_game_data
  for select
  using (auth.uid() = user_id);

create policy "insert_own_data" on public.user_game_data
  for insert
  with check (auth.uid() = user_id);

create policy "update_own_data" on public.user_game_data
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete_own_data" on public.user_game_data
  for delete
  using (auth.uid() = user_id);

-- Refuerzo explícito a nivel de permisos de tabla (además de RLS):
-- los visitantes anónimos (no logueados) nunca deben tocar esta tabla.
revoke all on public.user_game_data from anon;
grant select, insert, update, delete on public.user_game_data to authenticated;

-- Mantiene updated_at al día en cada escritura.
-- security invoker + search_path fijo: evita los problemas de seguridad típicos
-- de las funciones "security definer" con search_path mutable en Postgres/Supabase.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_game_data_updated_at on public.user_game_data;
create trigger trg_user_game_data_updated_at
  before update on public.user_game_data
  for each row execute function public.set_updated_at();
