# Production deployment

The repository includes `Dockerfile.backend`, `Dockerfile.worker`, `Dockerfile.frontend`, `docker-compose.production.yml`, and `Caddyfile`.

## First upload

On the VDS, install Docker Engine and the Compose plugin, then copy the repository to `/opt/invait-tg` (Git is preferred; an archive upload also works). Copy `.env.production.example` to `.env.production` and fill it on the server. Never commit or send this file.

```bash
sudo mkdir -p /opt/invait-tg
sudo chown "$USER":"$USER" /opt/invait-tg
cd /opt/invait-tg
git clone <your-repository-url> .
cp .env.production.example .env.production
chmod 600 .env.production
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

The DNS A record for `efootball-nexon.ru` must point to `72.56.100.153`. Caddy obtains and renews HTTPS certificates automatically when ports 80 and 443 are reachable.

## Updates

```bash
cd /opt/invait-tg
git pull --ff-only
docker compose -f docker-compose.production.yml up -d --build
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs --tail=100 backend worker
```

If Git is not available, upload a new archive, replace only tracked source files (keep `.env.production`), and run the same `docker compose ... up -d --build` command.

## Database migrations

Apply Supabase SQL migrations in SQL Editor before starting a release that changes `prisma/schema.prisma`. Current Docker files do not run migrations automatically.
