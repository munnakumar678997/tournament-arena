import { createInsertSchema } from "drizzle-zod";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const tournamentsTable = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  game: text("game").notNull(),
  mode: text("mode").notNull(),
  status: text("status").notNull().default("open"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  prizePool: integer("prize_pool").notNull().default(0),
  entryFee: integer("entry_fee").notNull().default(0),
  slots: integer("slots").notNull(),
  filledSlots: integer("filled_slots").notNull().default(0),
  map: text("map").notNull(),
  organizer: text("organizer").notNull(),
  roomId: text("room_id"),
  roomPassword: text("room_password"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const registrationsTable = pgTable("registrations", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournamentsTable.id),
  tournamentTitle: text("tournament_title").notNull(),
  playerTag: text("player_tag").notNull(),
  playerName: text("player_name").notNull(),
  teamName: text("team_name"),
  joinedAt: timestamp("joined_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  slotNumber: integer("slot_number").notNull(),
  status: text("status").notNull().default("confirmed"),
});

export const leaderboardTable = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  rank: integer("rank").notNull(),
  playerTag: text("player_tag").notNull(),
  playerName: text("player_name").notNull(),
  game: text("game").notNull(),
  matches: integer("matches").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  kills: integer("kills").notNull().default(0),
  points: integer("points").notNull().default(0),
  trend: text("trend").notNull().default("same"),
});

export const insertTournamentSchema = createInsertSchema(tournamentsTable).omit({
  id: true,
  createdAt: true,
});
export const insertRegistrationSchema = createInsertSchema(
  registrationsTable,
).omit({ id: true, joinedAt: true });
export const insertLeaderboardSchema = createInsertSchema(leaderboardTable).omit({
  id: true,
});

export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournamentsTable.$inferSelect;
export type Registration = typeof registrationsTable.$inferSelect;
export type LeaderboardEntry = typeof leaderboardTable.$inferSelect;