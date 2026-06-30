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
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

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

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return r[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return r[0];
}

// ─── Autenticação Própria ─────────────────────────────────────────────────────
export async function registerUser(data: { name: string; email: string; password: string; school?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const existing = await getUserByEmail(data.email);
  if (existing) throw new Error("EMAIL_TAKEN");

  const passwordHash = await bcrypt.hash(data.password, 12);
  const verificationToken = nanoid(48);
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  const openId = `local_${nanoid(24)}`; // openId sintético para compatibilidade

  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    loginMethod: "email",
    passwordHash,
    emailVerified: true,
    verificationToken,
    verificationTokenExpiresAt,
    lastSignedIn: new Date(),
    school: data.school ?? null,
  });

  const created = await getUserByEmail(data.email);
  return { user: created!, verificationToken };
}

export async function updateUserProfile(userId: number, data: { name: string; school: string | null }) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ name: data.name, school: data.school }).where(eq(users.id, userId));
}

export async function loginUser(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) throw new Error("INVALID_CREDENTIALS");
  // Email verification disabled until domain is configured
  // if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  const db = await getDb();
  if (db) await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

  return user;
}

export async function verifyEmail(token: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const r = await db.select().from(users).where(eq(users.verificationToken, token)).limit(1);
  const user = r[0];
  if (!user) throw new Error("INVALID_TOKEN");
  if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < new Date())
    throw new Error("TOKEN_EXPIRED");

  await db.update(users)
    .set({ emailVerified: true, verificationToken: null, verificationTokenExpiresAt: null })
    .where(eq(users.id, user.id));

  return user;
}

export async function createPasswordResetToken(email: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const user = await getUserByEmail(email);
  if (!user) return null; // silencioso por segurança

  // Código de 4 dígitos (1000-9999)
  const resetToken = String(Math.floor(1000 + Math.random() * 9000));
  const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await db.update(users)
    .set({ resetToken, resetTokenExpiresAt })
    .where(eq(users.id, user.id));

  return { user, resetToken };
}

export async function resetPassword(token: string, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const r = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
  const user = r[0];
  if (!user) throw new Error("INVALID_TOKEN");
  if (user.resetTokenExpiresAt && user.resetTokenExpiresAt < new Date())
    throw new Error("TOKEN_EXPIRED");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(users)
    .set({ passwordHash, resetToken: null, resetTokenExpiresAt: null })
    .where(eq(users.id, user.id));

  return user;
}

export async function resetPasswordWithCode(email: string, code: string, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const user = await getUserByEmail(email);
  if (!user) throw new Error("INVALID_CODE");
  if (user.resetToken !== code) throw new Error("INVALID_CODE");
  if (user.resetTokenExpiresAt && user.resetTokenExpiresAt < new Date())
    throw new Error("CODE_EXPIRED");

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(users)
    .set({ passwordHash, resetToken: null, resetTokenExpiresAt: null })
    .where(eq(users.id, user.id));

  return user;
}

// ─── Banco de Perguntas ───────────────────────────────────────────────────────
export async function getQuestions(filters?: {
  category?: string;
  sensitivityLevel?: string;
  discipline?: string;
  educationLevel?: string;
  approvedOnly?: boolean;
  systemOnly?: boolean;     // apenas sugestões do sistema
  teacherOnly?: boolean;    // apenas perguntas criadas por um professor
  createdBy?: number;       // filtrar por professor específico
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.approvedOnly !== false) {
    conditions.push(eq(questions.isValidated, true));
  }
  if (filters?.systemOnly) {
    conditions.push(eq(questions.isSystemSuggestion, true));
  }
  if (filters?.teacherOnly) {
    conditions.push(eq(questions.isSystemSuggestion, false));
  }
  if (filters?.createdBy !== undefined) {
    conditions.push(eq(questions.createdBy, filters.createdBy));
  }
  if (filters?.category) conditions.push(eq(questions.category, filters.category as any));
  if (filters?.sensitivityLevel)
    conditions.push(eq(questions.sensitivityLevel, filters.sensitivityLevel as any));
  if (filters?.discipline) conditions.push(eq(questions.discipline, filters.discipline));
  if (filters?.educationLevel && filters.educationLevel !== "all")
    conditions.push(eq(questions.educationLevel, filters.educationLevel as any));
  const rows =
    conditions.length > 0
      ? await db.select().from(questions).where(and(...conditions)).orderBy(desc(questions.createdAt))
      : await db.select().from(questions).orderBy(desc(questions.createdAt));
  return rows;
}

export async function getPendingQuestions() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(questions)
    .where(and(eq(questions.isValidated, false), eq(questions.isApproved, false)))
    .orderBy(desc(questions.createdAt));
}

export async function approveQuestion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(questions).set({ isValidated: true, isApproved: true }).where(eq(questions.id, id));
}

export async function rejectQuestion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(questions).where(eq(questions.id, id));
}

export async function updateQuestion(id: number, data: Partial<InsertQuestion>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(questions).set(data).where(eq(questions.id, id));
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

export async function getSessionsByQuiz(quizId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sessions).where(eq(sessions.quizId, quizId)).orderBy(desc(sessions.createdAt));
}

export async function getSessionsByTeacher(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: sessions.id,
      code: sessions.code,
      status: sessions.status,
      mode: sessions.mode,
      quizId: sessions.quizId,
      teacherId: sessions.teacherId,
      participantCount: sessions.participantCount,
      school: sessions.school,
      className: sessions.className,
      sessionDate: sessions.sessionDate,
      createdAt: sessions.createdAt,
      quizTitle: quizzes.title,
    })
    .from(sessions)
    .leftJoin(quizzes, eq(sessions.quizId, quizzes.id))
    .where(eq(sessions.teacherId, teacherId))
    .orderBy(desc(sessions.createdAt));
  return rows;
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
  if (!db) return {
    totalSessions: 0,
    totalParticipants: 0,
    totalTeachers: 0,
    avgResponseRate: 0,
    bySchool: [],
    byDiscipline: [],
    byTheme: [],
    topWorks: [],
  };

  // Buscar todas as sessões com join aos quizzes
  const allSessionsRaw = await db
    .select()
    .from(sessions)
    .leftJoin(quizzes, eq(sessions.quizId, quizzes.id));

  // Aplicar filtros
  let filtered = allSessionsRaw;
  if (filters?.school) {
    filtered = filtered.filter((r) => r.sessions.school === filters.school);
  }
  if (filters?.discipline) {
    filtered = filtered.filter((r) => r.quizzes?.discipline === filters.discipline);
  }
  if (filters?.yearGroup) {
    filtered = filtered.filter((r) => r.quizzes?.yearGroup === filters.yearGroup);
  }

  const totalSessions = filtered.length;
  const totalParticipants = filtered.reduce((s, r) => s + r.sessions.participantCount, 0);

  // Número de professores únicos
  const teacherIds = new Set(filtered.map((r) => r.sessions.teacherId));
  const totalTeachers = teacherIds.size;

  // Taxa média de resposta: participantes / (perguntas * participantes) — simplificado como média de participantCount
  const avgParticipants = totalSessions > 0 ? Math.round(totalParticipants / totalSessions) : 0;

  // Agrupar por escola
  const schoolMap: Record<string, { sessions: number; participants: number }> = {};
  for (const r of filtered) {
    const key = r.sessions.school ?? "Não especificada";
    if (!schoolMap[key]) schoolMap[key] = { sessions: 0, participants: 0 };
    schoolMap[key].sessions++;
    schoolMap[key].participants += r.sessions.participantCount;
  }
  const bySchool = Object.entries(schoolMap)
    .map(([school, v]) => ({ school, ...v }))
    .sort((a, b) => b.participants - a.participants);

  // Agrupar por disciplina
  const disciplineMap: Record<string, { sessions: number; participants: number }> = {};
  for (const r of filtered) {
    const key = r.quizzes?.discipline ?? "Não especificada";
    if (!disciplineMap[key]) disciplineMap[key] = { sessions: 0, participants: 0 };
    disciplineMap[key].sessions++;
    disciplineMap[key].participants += r.sessions.participantCount;
  }
  const byDiscipline = Object.entries(disciplineMap)
    .map(([discipline, v]) => ({ discipline, ...v }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8);

  // Agrupar por tema
  const themeMap: Record<string, number> = {};
  for (const r of filtered) {
    const key = (r.quizzes as any)?.theme ?? null;
    if (key) {
      themeMap[key] = (themeMap[key] ?? 0) + 1;
    }
  }
  const byTheme = Object.entries(themeMap)
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Obras mais trabalhadas
  const worksMap: Record<string, number> = {};
  for (const r of filtered) {
    const key = r.quizzes?.literaryWork ?? null;
    if (key) {
      worksMap[key] = (worksMap[key] ?? 0) + 1;
    }
  }
  const topWorks = Object.entries(worksMap)
    .map(([work, count]) => ({ work, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalSessions,
    totalParticipants,
    totalTeachers,
    avgParticipants,
    bySchool,
    byDiscipline,
    byTheme,
    topWorks,
  };
}

// ─── Lista de professores ativos (para coordenação) ─────────────────────────
export async function getActiveTeachers() {
  const db = await getDb();
  if (!db) return [];

  // Buscar todos os professores que já fizeram pelo menos uma sessão
  const rows = await db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      sessionId: sessions.id,
      school: sessions.school,
      participantCount: sessions.participantCount,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.teacherId, users.id))
    .orderBy(desc(sessions.createdAt));

  // Agregar por professor
  const teacherMap: Record<number, {
    userId: number;
    name: string;
    email: string;
    schools: Set<string>;
    totalSessions: number;
    totalParticipants: number;
    lastSession: Date | null;
  }> = {};

  for (const row of rows) {
    if (!teacherMap[row.userId]) {
      teacherMap[row.userId] = {
        userId: row.userId,
        name: row.name ?? "",
        email: row.email ?? "",
        schools: new Set(),
        totalSessions: 0,
        totalParticipants: 0,
        lastSession: null,
      };
    }
    const t = teacherMap[row.userId];
    t.totalSessions++;
    t.totalParticipants += row.participantCount ?? 0;
    if (row.school) t.schools.add(row.school);
    const d = row.createdAt ? new Date(row.createdAt) : null;
    if (d && (!t.lastSession || d > t.lastSession)) t.lastSession = d;
  }

  return Object.values(teacherMap)
    .map((t) => ({
      userId: t.userId,
      name: t.name,
      email: t.email,
      schools: Array.from(t.schools),
      totalSessions: t.totalSessions,
      totalParticipants: t.totalParticipants,
      lastSession: t.lastSession,
    }))
    .sort((a, b) => b.totalSessions - a.totalSessions);
}

// ─── Modo Kahoot ──────────────────────────────────────────────────────────────

/** Avança para a próxima pergunta e regista o timestamp de início */
export async function kahootNextQuestion(
  sessionId: number,
  questionIndex: number,
  durationSeconds: number
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(sessions)
    .set({
      activeQuestionIndex: questionIndex,
      questionStartedAt: new Date(),
      questionDuration: durationSeconds,
      status: "active",
    })
    .where(eq(sessions.id, sessionId));
}

/** Encerra a pergunta ativa (sem avançar para a próxima) */
export async function kahootCloseQuestion(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(sessions)
    .set({ status: "voting_closed" })
    .where(eq(sessions.id, sessionId));
}

/** Submete resposta Kahoot com validação de resposta correta */
export async function saveKahootResponse(data: {
  sessionId: number;
  questionId: number;
  anonToken: string;
  answer: string;
  correctOption: number | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  // Determinar se a resposta é correta
  let isCorrect: boolean | null = null;
  if (data.correctOption !== null && data.correctOption !== undefined) {
    isCorrect = data.answer === String(data.correctOption);
  }

  await db.insert(sessionResponses).values({
    sessionId: data.sessionId,
    questionId: data.questionId,
    anonToken: data.anonToken,
    answer: data.answer,
    answeredAt: new Date(),
    isCorrect,
  });
}

/** Obtém o estado atual da sessão Kahoot para polling */
export async function getKahootState(sessionId: number) {
  const db = await getDb();
  if (!db) return null;

  const sess = await getSessionById(sessionId);
  if (!sess) return null;

  // Contar respostas para a pergunta ativa
  let answersForActive = 0;
  if (sess.activeQuestionIndex >= 0) {
    const quiz = await getQuizById(sess.quizId);
    if (quiz) {
      const qIds: number[] = JSON.parse(quiz.questionIds);
      const activeQId = qIds[sess.activeQuestionIndex];
      if (activeQId) {
        const rows = await db
          .select()
          .from(sessionResponses)
          .where(
            and(
              eq(sessionResponses.sessionId, sessionId),
              eq(sessionResponses.questionId, activeQId)
            )
          );
        answersForActive = rows.length;
      }
    }
  }

  // Calcular tempo restante
  let timeRemaining = 0;
  if (sess.questionStartedAt && sess.status === "active") {
    const elapsed = (Date.now() - new Date(sess.questionStartedAt).getTime()) / 1000;
    timeRemaining = Math.max(0, sess.questionDuration - elapsed);
  }

  // Obter o questionId real da pergunta ativa
  let activeQuestionId: number | null = null;
  let activeQuestionData: { id: number; text: string; type: string; options: string[] | null } | null = null;
  if (sess.activeQuestionIndex >= 0) {
    const quiz = await getQuizById(sess.quizId);
    if (quiz) {
      const qIds: number[] = JSON.parse(quiz.questionIds);
      activeQuestionId = qIds[sess.activeQuestionIndex] ?? null;
      if (activeQuestionId) {
        const allQs = await getQuestions();
        const q = allQs.find((q) => q.id === activeQuestionId);
        if (q) {
          activeQuestionData = {
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options ? JSON.parse(q.options) : null,
          };
        }
      }
    }
  }

  return {
    status: sess.status,
    activeQuestionIndex: sess.activeQuestionIndex,
    activeQuestionId,
    activeQuestion: activeQuestionData,
    questionDuration: sess.questionDuration,
    questionStartedAt: sess.questionStartedAt,
    timeRemaining: Math.round(timeRemaining),
    answersForActive,
    participantCount: sess.participantCount,

  };
}

/** Obtém estatísticas de respostas para uma pergunta específica (para mostrar após fechar) */
export async function getKahootQuestionStats(sessionId: number, questionId: number) {
  const db = await getDb();
  if (!db) return { total: 0, correct: 0, byOption: {} };

  const rows = await db
    .select()
    .from(sessionResponses)
    .where(
      and(
        eq(sessionResponses.sessionId, sessionId),
        eq(sessionResponses.questionId, questionId)
      )
    );

  const total = rows.length;
  const correct = rows.filter((r) => r.isCorrect === true).length;
  const byOption: Record<string, number> = {};
  for (const r of rows) {
    byOption[r.answer] = (byOption[r.answer] ?? 0) + 1;
  }

  return { total, correct, byOption };
}

/** Obtém respostas abertas (texto) de uma pergunta específica */
export async function getKahootOpenAnswers(sessionId: number, questionId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(sessionResponses)
    .where(
      and(
        eq(sessionResponses.sessionId, sessionId),
        eq(sessionResponses.questionId, questionId)
      )
    );
  return rows.map((r) => r.answer).filter(Boolean);
}

/** Placar final: ordena tokens anónimos por nº de respostas corretas (sem identificar ninguém) */
export async function getKahootLeaderboard(sessionId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(sessionResponses)
    .where(eq(sessionResponses.sessionId, sessionId));

  // Agregar por token anónimo
  const map: Record<string, { correct: number; total: number }> = {};
  for (const r of rows) {
    if (!map[r.anonToken]) map[r.anonToken] = { correct: 0, total: 0 };
    map[r.anonToken].total++;
    if (r.isCorrect) map[r.anonToken].correct++;
  }

  // Ordenar por corretas desc, atribuir posição anónima
  const sorted = Object.values(map).sort((a, b) => b.correct - a.correct || b.total - a.total);

  return sorted.map((entry, i) => ({
    position: i + 1,
    correct: entry.correct,
    total: entry.total,
  }));
}
