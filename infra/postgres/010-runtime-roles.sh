#!/bin/sh
# The official postgres entrypoint runs this once on a fresh development volume.
set -eu
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=1   --set cedar_password="$CEDAR_DB_PASSWORD"   --set veriq_password="$VERIQ_DB_PASSWORD"   --set simulator_password="$SIMULATOR_DB_PASSWORD" <<'SQL'
CREATE ROLE cedar_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'cedar_password';
CREATE ROLE veriq_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'veriq_password';
CREATE ROLE simulator_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'simulator_password';
SQL
