#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is required." >&2
  exit 1
fi

mkdir -p backups
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="backups/backup_${TIMESTAMP}.sql.gz"

pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip > "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"
