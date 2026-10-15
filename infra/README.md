# Local database infrastructure

Task 002 supplies compose.yaml, .env.example and postgres/ role/grant scripts. See ../apps/backend/README.md for the complete sequence: configure ignored environment files, start PostgreSQL, apply Alembic, grant runtime access, run readiness/tests. The official image is pinned by digest; no banking data is seeded.

Only 127.0.0.1 is published. The PostgreSQL administrator/migrator and three runtime roles are distinct. First-volume bootstrap creates runtime roles; the explicit post-migration grant script grants own-schema USAGE and version-table SELECT only. Future business migrations require explicit per-table privileges. Do not infer full security isolation from schema/package separation or the migration superuser.

Compose execution was unavailable here (no Docker; Podman runtime path read-only). A real isolated PostgreSQL 16.2 test process was used instead, then stopped. No database service was deployed or left running. Do not delete existing volumes or reinitialize an existing database without explicit authorization.
