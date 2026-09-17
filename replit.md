# Tournament Arena

Mobile-first esports tournament platform for Free Fire and BGMI players to discover matches, join slots, view room details, and track rankings.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/tournament-arena` — React/Vite player and organizer experience
- `artifacts/api-server/src/routes/tournaments.ts` — tournament, registration, dashboard, and leaderboard API
- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `lib/db/src/schema/tournaments.ts` — Drizzle schema for tournaments, registrations, and leaderboard entries

## Architecture decisions

- The frontend uses generated API hooks from the OpenAPI contract rather than handwritten fetch calls.
- Tournament discovery is public; joining a match captures a player tag/name and persists a registration in PostgreSQL.
- Seed data is created lazily on first read so the initial player experience is populated without a separate seed command.

## Product

- Players can browse BGMI and Free Fire tournaments, filter by game/status, and view match details.
- Players can join open tournaments, review their registrations, and access room credentials for live matches.
- Players can view leaderboard standings and dashboard summaries.
- Organizers can create tournaments and update status, room ID, room password, and filled slots.

## User preferences

- User requested a Free Fire and BGMI tournament app where users can participate and play tournaments.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
