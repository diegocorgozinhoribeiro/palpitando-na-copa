import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Jogos (104 partidas da Copa 2026)
// status: agendado -> fechado -> finalizado
// ---------------------------------------------------------------------------
export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  ordem: integer("ordem").notNull().unique(), // ordem em que os jogos aparecem no sistema (chave natural unica -> evita duplicar no seed)
  fase: text("fase"), // ex.: "Fase de grupos", "16 avos de final", "Final"
  teamA: text("team_a").notNull(),
  teamB: text("team_b").notNull(),
  flagA: text("flag_a"), // codigo ISO / emoji da bandeira
  flagB: text("flag_b"),
  grupo: text("grupo"),
  estadio: text("estadio"),
  cidade: text("cidade"),
  kickoffAt: timestamp("kickoff_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("agendado"),
  definido: boolean("definido").notNull().default(true), // false = mata-mata sem times definidos (fica oculto para o usuario)
  scoreA: integer("score_a"),
  scoreB: integer("score_b"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Pool de perguntas (20 perguntas-base)
// tipo: 'vencedor' | 'mais_menos' | 'sim_nao' | 'escolha' | 'placar'
// opcoes: array de strings com as alternativas possiveis
// ---------------------------------------------------------------------------
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigo: text("codigo").notNull().unique(), // identificador estavel ex: 'q_over_25'
  texto: text("texto").notNull(),
  tipo: text("tipo").notNull(),
  dificuldade: text("dificuldade").notNull(), // 'facil' | 'media' | 'dificil'
  pontos: integer("pontos").notNull().default(10),
  opcoes: jsonb("opcoes").$type<string[]>().notNull().default([]),
  ativa: boolean("ativa").notNull().default(true),
});

// ---------------------------------------------------------------------------
// Perguntas sorteadas por jogo (5 por partida, iguais para todos)
// respostaCorreta e preenchida pelo admin apos o jogo
// ---------------------------------------------------------------------------
export const matchQuestions = pgTable(
  "match_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "restrict" }),
    ordem: integer("ordem").notNull(),
    respostaCorreta: text("resposta_correta"),
  },
  (t) => ({
    uniqMatchQuestion: unique().on(t.matchId, t.questionId),
  }),
);

// ---------------------------------------------------------------------------
// Palpites dos usuarios
// ---------------------------------------------------------------------------
export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchQuestionId: uuid("match_question_id")
      .notNull()
      .references(() => matchQuestions.id, { onDelete: "cascade" }),
    resposta: text("resposta").notNull(),
    acertou: boolean("acertou"),
    pontos: integer("pontos").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqUserMatchQuestion: unique().on(t.userId, t.matchQuestionId),
  }),
);

// ---------------------------------------------------------------------------
// Ligas
// ---------------------------------------------------------------------------
export const leagues = pgTable("leagues", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  codigo: text("codigo").notNull().unique(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const leagueMembers = pgTable(
  "league_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leagueId: uuid("league_id")
      .notNull()
      .references(() => leagues.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqLeagueUser: unique().on(t.leagueId, t.userId),
  }),
);

export type User = typeof users.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type MatchQuestion = typeof matchQuestions.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type League = typeof leagues.$inferSelect;
export type LeagueMember = typeof leagueMembers.$inferSelect;
