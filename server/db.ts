import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  chatMessages,
  InsertChatMessage,
  InsertQuestion,
  InsertQuiz,
  InsertSession,
  InsertSessionResponse,
  InsertUser,
  questions,
  quizzes,
  sessionResponses,
  sessions,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Utilizadores ─────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TF = (typeof textFields)[number];
  const assign = (f: TF) => {
    const v = user[f];
    if (v === undefined) return;
    const n = v ?? null;
    values[f] = n;
    updateSet[f] = n;
  };
  textFields.forEach(assign);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return r[0];
}

// ─── Banco de Perguntas ───────────────────────────────────────────────────────
export async function getQuestions(filters?: {
  category?: string;
  sensitivityLevel?: string;
  discipline?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.category) conditions.push(eq(questions.category, filters.category as any));
  if (filters?.sensitivityLevel)
    conditions.push(eq(questions.sensitivityLevel, filters.sensitivityLevel as any));
  if (filters?.discipline) conditions.push(eq(questions.discipline, filters.discipline));
  const rows =
    conditions.length > 0
      ? await db.select().from(questions).where(and(...conditions)).orderBy(desc(questions.createdAt))
      : await db.select().from(questions).orderBy(desc(questions.createdAt));
  return rows;
}

export async function createQuestion(data: InsertQuestion) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(questions).values(data);
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export async function getQuizzesByTeacher(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizzes).where(eq(quizzes.createdBy, teacherId)).orderBy(desc(quizzes.createdAt));
}

export async function getQuizById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
  return r[0];
}

export async function createQuiz(data: InsertQuiz) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const r = await db.insert(quizzes).values(data);
  return (r as any)[0]?.insertId as number;
}

export async function updateQuiz(id: number, data: Partial<InsertQuiz>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(quizzes).set(data).where(eq(quizzes.id, id));
}

export async function deleteQuiz(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(quizzes).where(eq(quizzes.id, id));
}

// ─── Sessões ──────────────────────────────────────────────────────────────────
export async function createSession(data: InsertSession) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(sessions).values(data);
}

export async function getSessionByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(sessions).where(eq(sessions.code, code)).limit(1);
  return r[0];
}

export async function getSessionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  return r[0];
}

export async function getSessionsByTeacher(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sessions).where(eq(sessions.teacherId, teacherId)).orderBy(desc(sessions.createdAt));
}

export async function updateSession(id: number, data: Partial<InsertSession>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(sessions).set(data).where(eq(sessions.id, id));
}

export async function incrementParticipant(sessionId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(sessions)
    .set({ participantCount: sql`${sessions.participantCount} + 1` })
    .where(eq(sessions.id, sessionId));
}

// ─── Respostas Anónimas ───────────────────────────────────────────────────────
export async function saveResponse(data: InsertSessionResponse) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(sessionResponses).values(data);
}

export async function hasResponded(sessionId: number, questionId: number, anonToken: string) {
  const db = await getDb();
  if (!db) return false;
  const r = await db
    .select()
    .from(sessionResponses)
    .where(
      and(
        eq(sessionResponses.sessionId, sessionId),
        eq(sessionResponses.questionId, questionId),
        eq(sessionResponses.anonToken, anonToken)
      )
    )
    .limit(1);
  return r.length > 0;
}

export async function getResponseStats(sessionId: number, questionId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(sessionResponses)
    .where(and(eq(sessionResponses.sessionId, sessionId), eq(sessionResponses.questionId, questionId)));

  // Agregar contagens por resposta
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.answer] = (counts[row.answer] ?? 0) + 1;
  }
  const total = rows.length;
  return Object.entries(counts).map(([answer, count]) => ({
    answer,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

export async function getAllResponsesForSession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sessionResponses).where(eq(sessionResponses.sessionId, sessionId));
}

// ─── Chat Anónimo ─────────────────────────────────────────────────────────────
export async function saveChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const r = await db.insert(chatMessages).values(data);
  return (r as any)[0]?.insertId as number;
}

export async function getChatMessages(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatMessages)
    .where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.isHidden, false)))
    .orderBy(chatMessages.createdAt);
}

export async function getAllChatMessages(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt);
}

export async function getChatMessageById(messageId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId)).limit(1);
  return rows[0] ?? undefined;
}

export async function moderateMessage(
  messageId: number,
  action: "hide" | "highlight" | "flag_sensitive"
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const set =
    action === "hide"
      ? { isHidden: true }
      : action === "highlight"
        ? { isHighlighted: true }
        : { isSensitive: true };
  await db.update(chatMessages).set(set).where(eq(chatMessages.id, messageId));
}

// ─── Relatório / Coordenação ──────────────────────────────────────────────────
export async function getCoordinationStats(filters?: {
  school?: string;
  discipline?: string;
  yearGroup?: string;
}) {
  const db = await getDb();
  if (!db) return { totalSessions: 0, totalParticipants: 0, byDiscipline: [], bySchool: [] };

  const conditions = [];
  if (filters?.school) conditions.push(eq(sessions.school, filters.school));
  if (filters?.discipline) {
    // join com quizzes para filtrar por disciplina
  }

  const allSessions =
    conditions.length > 0
      ? await db.select().from(sessions).where(and(...conditions))
      : await db.select().from(sessions);

  const totalSessions = allSessions.length;
  const totalParticipants = allSessions.reduce((s, r) => s + r.participantCount, 0);

  // Agrupar por escola
  const schoolMap: Record<string, { sessions: number; participants: number }> = {};
  for (const s of allSessions) {
    const key = s.school ?? "Não especificada";
    if (!schoolMap[key]) schoolMap[key] = { sessions: 0, participants: 0 };
    schoolMap[key].sessions++;
    schoolMap[key].participants += s.participantCount;
  }
  const bySchool = Object.entries(schoolMap).map(([school, v]) => ({ school, ...v }));

  return { totalSessions, totalParticipants, bySchool, byDiscipline: [] };
}
