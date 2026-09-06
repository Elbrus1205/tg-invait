# Backup and recovery

PostgreSQL/Supabase is the source of truth. Redis contains queues and locks and must not be treated as durable storage.

Create a compressed database backup from a secured operator machine:

```powershell
$env:DATABASE_URL = "<Supabase connection string>"
./scripts/backup.ps1 -OutputDirectory ./backups
```

Restore into a maintenance database with:

```bash
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" backups/invait-YYYYMMDD-HHMMSS.dump
```

Do not place connection strings or generated dumps in Git. Keep at least one encrypted off-host copy and periodically perform a restore drill.
