#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required." >&2
  exit 1
fi

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <backup-file.sql|backup-file.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

case "$BACKUP_FILE" in
  *.gz)
    gzip -dc "$BACKUP_FILE" | psql "$DATABASE_URL"
    ;;
  *)
    psql "$DATABASE_URL" < "$BACKUP_FILE"
    ;;
esac

echo "Restore completed from: $BACKUP_FILE"
