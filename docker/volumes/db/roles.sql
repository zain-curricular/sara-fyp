-- Set the Supabase service roles' passwords to POSTGRES_PASSWORD so each service
-- (auth, storage, realtime, PostgREST) can authenticate over the network.
--
-- Plain top-level statements: psql only interpolates `:'pgpass'` at the top level
-- (NOT inside a DO $$ block), and db init runs with ON_ERROR_STOP — so every role
-- listed must exist in the pinned image. supabase_functions_admin is deliberately
-- omitted because this image does not ship it (referencing it aborts the file and
-- leaves later roles, e.g. storage, with no password).
\set pgpass `echo "$POSTGRES_PASSWORD"`

alter user authenticator with password :'pgpass';
alter user pgbouncer with password :'pgpass';
alter user supabase_auth_admin with password :'pgpass';
alter user supabase_storage_admin with password :'pgpass';
alter user supabase_admin with password :'pgpass';
