import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, leaderboardTable, registrationsTable, tournamentsTable } from "@workspace/db";
import {
  CreateTournamentBody,
  CreateTournamentResponse,
  GetDashboardSummaryResponse,
  GetTournamentParams,
  GetTournamentResponse,
  JoinTournamentBody,
  JoinTournamentParams,
  JoinTournamentResponse,
  ListLeaderboardQueryParams,
  ListLeaderboardResponse,
  ListRegistrationsQueryParams,
  ListRegistrationsResponse,
  ListTournamentsQueryParams,
  ListTournamentsResponse,
  UpdateTournamentBody,
  UpdateTournamentParams,
  UpdateTournamentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
let seedPromise: Promise<void> | undefined;

async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const existing = await db.select({ id: tournamentsTable.id }).from(tournamentsTable).limit(1);
      if (existing.length > 0) return;

      const now = Date.now();
      await db
        .insert(tournamentsTable)
        .values([
          {
            title: "Night Ops: Erangel Clash",
            game: "bgmi",
            mode: "squad",
            status: "open",
            startsAt: new Date(now + 1000 * 60 * 60 * 6),
            prizePool: 25000,
            entryFee: 49,
            slots: 25,
            filledSlots: 18,
            map: "Erangel",
            organizer: "Arena League",
            description: "A fast-paced squad battle for teams ready to own the night.",
          },
          {
            title: "Booyah Rush Series #12",
            game: "free-fire",
            mode: "solo",
            status: "open",
            startsAt: new Date(now + 1000 * 60 * 60 * 25),
            prizePool: 10000,
            entryFee: 29,
            slots: 48,
            filledSlots: 32,
            map: "Bermuda",
            organizer: "Booyah Hub",
            description: "Solo players only. Secure your drop spot and chase the top prize.",
          },
          {
            title: "Campus Rivals Weekend",
            game: "bgmi",
            mode: "duo",
            status: "live",
            startsAt: new Date(now - 1000 * 60 * 25),
            prizePool: 15000,
            entryFee: 0,
            slots: 50,
            filledSlots: 50,
            map: "Miramar",
            organizer: "Campus Esports",
            roomId: "ARENA-7421",
            roomPassword: "JOINNOW",
            description: "A live community lobby for the sharpest campus duos.",
          },
        ])
        .returning({ id: tournamentsTable.id });

      const existingLeaderboard = await db
        .select({ id: leaderboardTable.id })
        .from(leaderboardTable)
        .limit(1);
      if (existingLeaderboard.length === 0) {
        await db.insert(leaderboardTable).values([
          { rank: 1, playerTag: "VTXxRohan", playerName: "Rohan V.", game: "bgmi", matches: 42, wins: 11, kills: 186, points: 920, trend: "up" },
          { rank: 2, playerTag: "MaviQueen", playerName: "Mavi Q.", game: "free-fire", matches: 38, wins: 9, kills: 214, points: 884, trend: "up" },
          { rank: 3, playerTag: "NXTArjun", playerName: "Arjun S.", game: "bgmi", matches: 39, wins: 8, kills: 162, points: 830, trend: "same" },
          { rank: 4, playerTag: "S8ULxNisha", playerName: "Nisha K.", game: "free-fire", matches: 31, wins: 7, kills: 175, points: 796, trend: "down" },
          { rank: 5, playerTag: "ClutchKaran", playerName: "Karan J.", game: "bgmi", matches: 35, wins: 6, kills: 149, points: 742, trend: "up" },
        ]);
      }
      return;
    })();
  }
  await seedPromise;
}

router.get("/tournaments", async (req, res): Promise<void> => {
  await ensureSeeded();
  const parsed = ListTournamentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { game, status } = parsed.data;
  const conditions = [];
  if (game !== "all") conditions.push(eq(tournamentsTable.game, game));
  if (status !== "all") conditions.push(eq(tournamentsTable.status, status));

  const tournaments = await db
    .select()
    .from(tournamentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(tournamentsTable.startsAt));
  res.json(ListTournamentsResponse.parse(tournaments));
});

router.post("/tournaments", async (req, res): Promise<void> => {
  const parsed = CreateTournamentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [tournament] = await db
    .insert(tournamentsTable)
    .values({ ...parsed.data, status: "open", filledSlots: 0 })
    .returning();
  res.status(201).json(CreateTournamentResponse.parse(tournament));
});

router.get("/tournaments/:id", async (req, res): Promise<void> => {
  await ensureSeeded();
  const params = GetTournamentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, params.data.id));
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  res.json(GetTournamentResponse.parse(tournament));
});

router.patch("/tournaments/:id", async (req, res): Promise<void> => {
  const params = UpdateTournamentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateTournamentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [tournament] = await db
    .update(tournamentsTable)
    .set(body.data)
    .where(eq(tournamentsTable.id, params.data.id))
    .returning();
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  res.json(UpdateTournamentResponse.parse(tournament));
});

router.post("/tournaments/:id/join", async (req, res): Promise<void> => {
  await ensureSeeded();
  const params = JoinTournamentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = JoinTournamentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [tournament] = await db
    .select()
    .from(tournamentsTable)
    .where(eq(tournamentsTable.id, params.data.id));
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  if (tournament.status !== "open" || tournament.filledSlots >= tournament.slots) {
    res.status(400).json({ error: "This tournament is no longer accepting players" });
    return;
  }

  const [existingRegistration] = await db
    .select({ id: registrationsTable.id })
    .from(registrationsTable)
    .where(
      and(
        eq(registrationsTable.tournamentId, tournament.id),
        eq(registrationsTable.playerTag, body.data.playerTag),
        eq(registrationsTable.status, "confirmed"),
      ),
    );
  if (existingRegistration) {
    res.status(400).json({ error: "Player is already registered for this tournament" });
    return;
  }

  const [registration] = await db
    .insert(registrationsTable)
    .values({
      tournamentId: tournament.id,
      tournamentTitle: tournament.title,
      playerTag: body.data.playerTag,
      playerName: body.data.playerName,
      teamName: body.data.teamName ?? null,
      slotNumber: tournament.filledSlots + 1,
      status: "confirmed",
    })
    .returning();
  await db
    .update(tournamentsTable)
    .set({ filledSlots: tournament.filledSlots + 1 })
    .where(eq(tournamentsTable.id, tournament.id));
  res.status(201).json(JoinTournamentResponse.parse(registration));
});

router.get("/registrations", async (req, res): Promise<void> => {
  const parsed = ListRegistrationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const registrations = await db
    .select()
    .from(registrationsTable)
    .where(eq(registrationsTable.playerTag, parsed.data.playerTag))
    .orderBy(desc(registrationsTable.joinedAt));
  res.json(ListRegistrationsResponse.parse(registrations));
});

router.get("/leaderboard", async (req, res): Promise<void> => {
  await ensureSeeded();
  const parsed = ListLeaderboardQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const entries = await db
    .select()
    .from(leaderboardTable)
    .where(parsed.data.game === "all" ? undefined : eq(leaderboardTable.game, parsed.data.game))
    .orderBy(asc(leaderboardTable.rank));
  res.json(ListLeaderboardResponse.parse(entries));
});

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  await ensureSeeded();
  const parsed = ListRegistrationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const registrations = await db
    .select()
    .from(registrationsTable)
    .where(eq(registrationsTable.playerTag, parsed.data.playerTag))
    .orderBy(desc(registrationsTable.joinedAt));
  const allTournaments = await db.select().from(tournamentsTable);
  const nextRegistration = registrations
    .map((registration) => allTournaments.find((tournament) => tournament.id === registration.tournamentId))
    .find((tournament) => tournament && tournament.startsAt.getTime() > Date.now());
  const [player] = await db
    .select()
    .from(leaderboardTable)
    .where(eq(leaderboardTable.playerTag, parsed.data.playerTag));
  const matches = player?.matches ?? registrations.length;
  const wins = player?.wins ?? 0;

  res.json(
    GetDashboardSummaryResponse.parse({
      playerTag: parsed.data.playerTag,
      tournamentsJoined: registrations.length,
      liveMatches: registrations.filter((registration) => {
        const tournament = allTournaments.find((item) => item.id === registration.tournamentId);
        return tournament?.status === "live";
      }).length,
      totalPoints: player?.points ?? 0,
      winRate: matches > 0 ? Number(((wins / matches) * 100).toFixed(1)) : 0,
      nextMatch: nextRegistration ?? null,
    }),
  );
});

export default router;