# Invait Telegram Panel — frontend

This package contains the Stage 1 Next.js shell for the web panel. It deliberately
does not connect to Telegram or a backend yet; those integrations are introduced
in later stages from the project prompt.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

The source tree follows the agreed application boundaries:

```text
src/
  app/          # Next.js App Router routes and global styles
  components/   # reusable visual components
  features/     # feature-level view data and composition
  hooks/        # reusable client hooks
  stores/       # client state contracts (no backend coupling yet)
  services/     # typed integration seams
  types/        # shared frontend/domain types
  lib/          # domain-safe helpers
  utils/        # small presentation utilities
```
