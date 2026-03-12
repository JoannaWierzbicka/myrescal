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

if ! command -v gzip >/dev/null 2>&1; then
  echo "gzip is required." >&2
  exit 1
fi

FORCE_RESTORE="${FORCE_RESTORE:-0}"
if [[ "${1:-}" == "--yes" ]]; then
  FORCE_RESTORE=1
  shift
fi

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 [--yes] <backup-file.sql|backup-file.sql.gz>" >&2
  exit 1
fi

BACKUP_FILE="$1"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

if [[ -f "$CHECKSUM_FILE" ]]; then
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum --check "$CHECKSUM_FILE"
  elif command -v shasum >/dev/null 2>&1; then
    shasum -a 256 --check "$CHECKSUM_FILE"
  else
    echo "Warning: checksum file present, but no SHA-256 tool found (sha256sum/shasum)." >&2
  fi
fi

if [[ "$FORCE_RESTORE" != "1" ]]; then
  echo "WARNING: restore can overwrite existing data."
  echo "Target database: $DATABASE_URL"
  read -r -p "Type RESTORE to continue: " CONFIRM
  if [[ "$CONFIRM" != "RESTORE" ]]; then
    echo "Restore canceled."
    exit 1
  fi
fi

PSQL_RESTORE_FLAGS=(--single-transaction --set ON_ERROR_STOP=1)

case "$BACKUP_FILE" in
  *.gz)
    gzip -dc "$BACKUP_FILE" | psql "${PSQL_RESTORE_FLAGS[@]}" "$DATABASE_URL"
    ;;
  *)
    psql "${PSQL_RESTORE_FLAGS[@]}" "$DATABASE_URL" < "$BACKUP_FILE"
    ;;
esac

echo "Restore completed from: $BACKUP_FILE"
