import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Utilizadores (professores, coordenadores, admins) ───────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  school: varchar("school", { length: 256 }), // escola onde leciona
  // Autenticação própria (email + password)
  passwordHash: varchar("passwordHash", { length: 256 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  verificationToken: varchar("verificationToken", { length: 128 }),
  verificationTokenExpiresAt: timestamp("verificationTokenExpiresAt"),
  resetToken: varchar("resetToken", { length: 128 }),
  resetTokenExpiresAt: timestamp("resetTokenExpiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Banco de Perguntas ───────────────────────────────────────────────────────
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  text: text("text").notNull(),
  type: mysqlEnum("type", ["multiple_choice", "scale", "open"]).notNull(),
  category: mysqlEnum("category", [
    "stereotypes",
    "control",
    "consent",
    "psychological_violence",
    "healthy_relationships",
    "jealousy",
    "peer_pressure",
    "social_media",
    "masculinities",
    "emotional_dependency",
  ]).notNull(),
  sensitivityLevel: mysqlEnum("sensitivityLevel", ["low", "medium", "high"])
    .default("low")
    .notNull(),
  options: text("options"), // JSON array of strings for multiple_choice/scale
  correctOption: int("correctOption"), // índice da opção correta (para modo Kahoot)
  discipline: varchar("discipline", { length: 128 }),
  yearGroup: varchar("yearGroup", { length: 32 }),
  literaryWork: varchar("literaryWork", { length: 256 }),
  educationLevel: mysqlEnum("educationLevel", ["3rd_cycle", "secondary", "all"]).default("all").notNull(),
  isValidated: boolean("isValidated").default(false).notNull(),
  isApproved: boolean("isApproved").default(false).notNull(),
  isSystemSuggestion: boolean("isSystemSuggestion").default(false).notNull(), // sugestão pré-definida do sistema
  submittedBy: int("submittedBy"), // userId do professor que submeteu
  createdBy: int("createdBy"), // userId
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  literaryWork: varchar("literaryWork", { length: 256 }),
  excerpt: text("excerpt"), // excerto literário de referência
  theme: varchar("theme", { length: 128 }), // tema central (controlo, ciúme, etc.)
  discipline: varchar("discipline", { length: 128 }),
  yearGroup: varchar("yearGroup", { length: 32 }),
  className: varchar("className", { length: 64 }),
  showResultsImmediately: boolean("showResultsImmediately").default(false).notNull(),
  hiddenResultsQuestionIds: text("hiddenResultsQuestionIds"), // JSON array de IDs de perguntas cujos resultados são ocultos à turma (null = todos visíveis)
  questionIds: text("questionIds").notNull(), // JSON array of question IDs
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

// ─── Sessões de Aula ──────────────────────────────────────────────────────────
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  quizId: int("quizId").notNull(),
  teacherId: int("teacherId").notNull(),
  school: varchar("school", { length: 256 }),
  className: varchar("className", { length: 64 }), // turma confirmada ao lançar
  sessionDate: timestamp("sessionDate"), // data confirmada ao lançar
  mode: mysqlEnum("mode", ["normal", "kahoot"]).default("normal").notNull(),
  status: mysqlEnum("status", ["waiting", "active", "voting_closed", "chat_open", "closed"])
    .default("waiting")
    .notNull(),
  chatEnabled: boolean("chatEnabled").default(false).notNull(),
  chatPaused: boolean("chatPaused").default(false).notNull(),
  chatPrompt: text("chatPrompt"), // pergunta de debate enviada pelo professor
  participantCount: int("participantCount").default(0).notNull(),
  // Campos para modo Kahoot
  activeQuestionIndex: int("activeQuestionIndex").default(-1).notNull(),
  questionStartedAt: timestamp("questionStartedAt"),
  questionDuration: int("questionDuration").default(20).notNull(), // segundos
  // Modo assíncrono (alunos respondem quando querem, sem professor a controlar)
  isAsync: boolean("isAsync").default(false).notNull(),
  asyncExpiresAt: timestamp("asyncExpiresAt"), // null = sem prazo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// ─── Respostas Anónimas ───────────────────────────────────────────────────────
export const sessionResponses = mysqlTable("session_responses", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  questionId: int("questionId").notNull(),
  // token temporário de sessão (não associado a nenhum utilizador real)
  anonToken: varchar("anonToken", { length: 64 }).notNull(),
  answer: text("answer").notNull(), // valor da resposta (opção, número ou texto)
  answeredAt: timestamp("answeredAt").defaultNow().notNull(), // para calcular velocidade no Kahoot
  isCorrect: boolean("isCorrect"), // null para perguntas sem resposta certa
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SessionResponse = typeof sessionResponses.$inferSelect;
export type InsertSessionResponse = typeof sessionResponses.$inferInsert;

// ─── Mensagens do Chat Anónimo ────────────────────────────────────────────────
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  anonToken: varchar("anonToken", { length: 64 }).notNull(),
  content: text("content").notNull(),
  isHidden: boolean("isHidden").default(false).notNull(),
  isSensitive: boolean("isSensitive").default(false).notNull(),
  isHighlighted: boolean("isHighlighted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
