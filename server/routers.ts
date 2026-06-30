import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  approveQuestion,
  createPasswordResetToken,
  createQuestion,
  createQuiz,
  createSession,
  deleteQuiz,
  getAllChatMessages,
  getAllResponsesForSession,
  getChatMessageById,
  getChatMessages,
  getActiveTeachers,
  getCoordinationStats,
  getKahootLeaderboard,
  getKahootOpenAnswers,
  getKahootQuestionStats,
  getKahootState,
  getPendingQuestions,
  getQuestions,
  getQuizById,
  getQuizzesByTeacher,
  getResponseStats,
  getSessionByCode,
  getSessionById,
  getSessionsByQuiz,
  getSessionsByTeacher,
  getUserById,
  hasResponded,
  incrementParticipant,
  kahootCloseQuestion,
  kahootNextQuestion,
  loginUser,
  moderateMessage,
  registerUser,
  rejectQuestion,
  resetPassword,
  saveChatMessage,
  saveKahootResponse,
  saveResponse,
  updateQuestion,
  updateQuiz,
  updateSession,
  verifyEmail,
} from "./db";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";

function getAvToken(req: any): string | undefined {
  const rawCookie = req.headers?.cookie;
  if (!rawCookie) return undefined;
  const parsed = parseCookieHeader(rawCookie);
  return parsed["av_token"];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateSessionCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "0123456789";
  const part1 = Array.from({ length: 2 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  const part2 = Array.from({ length: 3 }, () => digits[Math.floor(Math.random() * digits.length)]).join("");
  return `${part1}-${part2}`;
}

const SENSITIVE_KEYWORDS = [
  "ajuda", "socorro", "violência", "abuso", "medo", "magoar", "suicídio",
  "machucar", "ameaça", "forçou", "forçar", "violou", "violar", "help",
  "abuse", "hurt", "scared", "afraid",
];

function detectSensitive(text: string): boolean {
  const lower = text.toLowerCase();
  return SENSITIVE_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Router principal ─────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("av_token", { path: "/" });
      return { success: true } as const;
    }),

    register: publicProcedure
      .input(z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8) }))
      .mutation(async ({ input }) => {
        try {
          const { user, verificationToken } = await registerUser(input);
          try { await sendVerificationEmail(user.email!, user.name!, verificationToken); } catch (e) { console.error("[Email]", e); }
          return { success: true, message: "Conta criada com sucesso! Podes entrar agora." };
        } catch (e: any) {
          if (e.message === "EMAIL_TAKEN") throw new Error("Este email já está registado.");
          throw e;
        }
      }),

    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await loginUser(input.email, input.password);
          const secret = new TextEncoder().encode(process.env.JWT_SECRET || "aula-viva-secret");
          const token = await new SignJWT({ sub: String(user.id), role: user.role })
            .setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(secret);
          ctx.res.cookie("av_token", token, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 30 * 24 * 60 * 60 });
          return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
        } catch (e: any) {
          if (e.message === "INVALID_CREDENTIALS") throw new Error("Email ou password incorretos.");
          if (e.message === "EMAIL_NOT_VERIFIED") throw new Error("Confirma o teu email antes de entrar.");
          throw e;
        }
      }),

    verifyEmail: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        try { await verifyEmail(input.token); return { success: true }; }
        catch (e: any) {
          if (e.message === "INVALID_TOKEN") throw new Error("Link inválido ou já utilizado.");
          if (e.message === "TOKEN_EXPIRED") throw new Error("Este link expirou.");
          throw e;
        }
      }),

    forgotPassword: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const result = await createPasswordResetToken(input.email);
        if (result) { try { await sendPasswordResetEmail(result.user.email!, result.user.name!, result.resetToken); } catch (e) { console.error("[Email]", e); } }
        return { success: true };
      }),

    resetPassword: publicProcedure
      .input(z.object({ token: z.string(), password: z.string().min(8) }))
      .mutation(async ({ input }) => {
        try { await resetPassword(input.token, input.password); return { success: true }; }
        catch (e: any) {
          if (e.message === "INVALID_TOKEN") throw new Error("Link inválido ou já utilizado.");
          if (e.message === "TOKEN_EXPIRED") throw new Error("Este link expirou. Pede um novo.");
          throw e;
        }
      }),

    meWithLocal: publicProcedure.query(async ({ ctx }) => {
      if (ctx.user) return ctx.user;
      const avToken = getAvToken(ctx.req);
      if (!avToken) return null;
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "aula-viva-secret");
        const { payload } = await jwtVerify(avToken, secret);
        const userId = Number(payload.sub);
        if (!userId) return null;
        return await getUserById(userId);
      } catch { return null; }
    }),
  }),

  // ── Banco de Perguntas ────────────────────────────────────────────────────
  questions: router({
    list: publicProcedure
      .input(
        z.object({
          category: z.string().optional(),
          sensitivityLevel: z.string().optional(),
          discipline: z.string().optional(),
          educationLevel: z.string().optional(),
          approvedOnly: z.boolean().optional(),
          systemOnly: z.boolean().optional(),
          teacherOnly: z.boolean().optional(),
          createdBy: z.number().optional(),
        }).optional()
      )
      .query(({ input }) => getQuestions(input)),

    // Perguntas do professor autenticado
    myQuestions: protectedProcedure
      .input(z.object({
        category: z.string().optional(),
        educationLevel: z.string().optional(),
      }).optional())
      .query(({ input, ctx }) => getQuestions({
        ...input,
        createdBy: ctx.user.id,
        approvedOnly: false,
      })),

    // Sugestões do sistema (pública, para o QuizEditor)
    suggestions: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        educationLevel: z.string().optional(),
        sensitivityLevel: z.string().optional(),
      }).optional())
      .query(({ input }) => getQuestions({ ...input, systemOnly: true })),

    // Perguntas pendentes de aprovação (admin)
    pending: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getPendingQuestions();
      }),

    // Aprovar pergunta (admin)
    approve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await approveQuestion(input.id);
        return { success: true };
      }),

    // Rejeitar/eliminar pergunta (admin)
    reject: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await rejectQuestion(input.id);
        return { success: true };
      }),

    // Atualizar pergunta (admin)
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          text: z.string().min(1).optional(),
          correctOption: z.number().nullable().optional(),
          educationLevel: z.enum(["2nd_cycle", "3rd_cycle", "secondary", "all"]).optional(),
          sensitivityLevel: z.enum(["low", "medium", "high"]).optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await updateQuestion(id, data as any);
        return { success: true };
      }),

    create: protectedProcedure
      .input(
        z.object({
          text: z.string().min(1),
          type: z.enum(["multiple_choice", "scale", "open"]),
          category: z.enum([
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
          ]),
          sensitivityLevel: z.enum(["low", "medium", "high"]).default("low"),
          educationLevel: z.enum(["2nd_cycle", "3rd_cycle", "secondary", "all"]).default("all"),
          options: z.array(z.string()).optional(),
          correctOption: z.number().nullable().optional(),
          discipline: z.string().optional(),
          yearGroup: z.string().optional(),
          literaryWork: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const isAdmin = ctx.user.role === "admin";
        // Perguntas criadas por professores são aprovadas automaticamente (são deles)
        // Só perguntas submetidas para o banco global precisam de aprovação do admin
        await createQuestion({
          ...input,
          options: input.options ? JSON.stringify(input.options) : undefined,
          correctOption: input.correctOption ?? undefined,
          isValidated: true,   // aprovadas automaticamente para uso próprio
          isApproved: true,
          isSystemSuggestion: false, // nunca é sugestão do sistema
          submittedBy: isAdmin ? undefined : ctx.user.id,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),

    // Atualizar pergunta própria (professor) ou qualquer uma (admin)
    updateOwn: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          text: z.string().min(1).optional(),
          options: z.array(z.string()).optional(),
          category: z.string().optional(),
          sensitivityLevel: z.enum(["low", "medium", "high"]).optional(),
          educationLevel: z.enum(["2nd_cycle", "3rd_cycle", "secondary", "all"]).optional(),
          discipline: z.string().optional(),
          literaryWork: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { questions: qTable } = await import("../drizzle/schema");
        const { eq: eqFn } = await import("drizzle-orm");
        const rows = await db.select().from(qTable).where(eqFn(qTable.id, input.id)).limit(1);
        const q = rows[0];
        if (!q) throw new TRPCError({ code: "NOT_FOUND" });
        if (q.isSystemSuggestion) throw new TRPCError({ code: "FORBIDDEN", message: "Não podes editar sugestões do sistema." });
        if (q.createdBy !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        const { id, options, category, ...rest } = input;
        await db.update(qTable).set({
          ...rest,
          ...(category !== undefined ? { category: category as any } : {}),
          ...(options !== undefined ? { options: JSON.stringify(options) } : {}),
        }).where(eqFn(qTable.id, id));
        return { success: true };
      }),

    // Eliminar pergunta própria (professor) ou qualquer uma (admin)
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { questions: qTable } = await import("../drizzle/schema");
        const { eq: eqFn } = await import("drizzle-orm");
        const rows = await db.select().from(qTable).where(eqFn(qTable.id, input.id)).limit(1);
        const q = rows[0];
        if (!q) throw new TRPCError({ code: "NOT_FOUND" });
        if (q.isSystemSuggestion) throw new TRPCError({ code: "FORBIDDEN", message: "Não podes eliminar sugestões do sistema." });
        if (q.createdBy !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        await db.delete(qTable).where(eqFn(qTable.id, input.id));
        return { success: true };
      }),
  }),

  // ── Quizzes ───────────────────────────────────────────────────────────────
  quizzes: router({
    list: protectedProcedure.query(({ ctx }) => getQuizzesByTeacher(ctx.user.id)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const quiz = await getQuizById(input.id);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
        if (quiz.createdBy !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        return quiz;
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          literaryWork: z.string().optional(),
          excerpt: z.string().optional(),
          theme: z.string().optional(),
          discipline: z.string().optional(),
          yearGroup: z.string().optional(),
          className: z.string().optional(),
          showResultsImmediately: z.boolean().default(false),
          hiddenResultsQuestionIds: z.array(z.number()).optional(),
          questionIds: z.array(z.number()),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "user")
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas professores podem criar quizzes." });
        const { hiddenResultsQuestionIds, ...rest } = input;
        const id = await createQuiz({
          ...rest,
          hiddenResultsQuestionIds: hiddenResultsQuestionIds ? JSON.stringify(hiddenResultsQuestionIds) : null,
          questionIds: JSON.stringify(input.questionIds),
          createdBy: ctx.user.id,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          literaryWork: z.string().optional(),
          excerpt: z.string().optional(),
          theme: z.string().optional(),
          discipline: z.string().optional(),
          yearGroup: z.string().optional(),
          className: z.string().optional(),
          showResultsImmediately: z.boolean().optional(),
          hiddenResultsQuestionIds: z.array(z.number()).optional(),
          questionIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const quiz = await getQuizById(input.id);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
        if (quiz.createdBy !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, questionIds, hiddenResultsQuestionIds, ...rest } = input;
        await updateQuiz(id, {
          ...rest,
          ...(questionIds ? { questionIds: JSON.stringify(questionIds) } : {}),
          hiddenResultsQuestionIds: hiddenResultsQuestionIds !== undefined ? JSON.stringify(hiddenResultsQuestionIds) : undefined,
        });
        return { success: true };
      }),

        delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const quiz = await getQuizById(input.id);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
        if (quiz.createdBy !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { sessions: sessTable, sessionResponses, chatMessages } = await import("../drizzle/schema");
        const { eq: eqFn, inArray } = await import("drizzle-orm");
        // Buscar todas as sessões deste quiz
        const quizSessions = await db.select({ id: sessTable.id }).from(sessTable).where(eqFn(sessTable.quizId, input.id));
        const sessionIds = quizSessions.map(s => s.id);
        if (sessionIds.length > 0) {
          await db.delete(sessionResponses).where(inArray(sessionResponses.sessionId, sessionIds));
          await db.delete(chatMessages).where(inArray(chatMessages.sessionId, sessionIds));
          await db.delete(sessTable).where(inArray(sessTable.id, sessionIds));
        }
        await deleteQuiz(input.id);
        return { success: true };
      }),
    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const quiz = await getQuizById(input.id);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
        if (quiz.createdBy !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        const newId = await createQuiz({
          title: `${quiz.title} (cópia)`,
          description: quiz.description ?? undefined,
          literaryWork: quiz.literaryWork ?? undefined,
          discipline: quiz.discipline ?? undefined,
          yearGroup: quiz.yearGroup ?? undefined,
          className: quiz.className ?? undefined,
          showResultsImmediately: quiz.showResultsImmediately ?? false,
          hiddenResultsQuestionIds: quiz.hiddenResultsQuestionIds ?? null,
          questionIds: quiz.questionIds,
          createdBy: ctx.user.id,
        });
        return { id: newId };
      }),

    // Estatísticas agregadas de todas as sessões de um quiz
    stats: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const quiz = await getQuizById(input.id);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
        if (quiz.createdBy !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });

        const quizSessions = await getSessionsByQuiz(input.id);
        const questionIds: number[] = JSON.parse(quiz.questionIds);
        const allQs = await getQuestions();
        const sessionQs = allQs.filter((q) => questionIds.includes(q.id));

        // Para cada sessão, buscar stats por pergunta
        const sessionStats = await Promise.all(
          quizSessions.map(async (s) => {
            const messages = await getAllChatMessages(s.id);
            const visibleMessages = messages.filter((m) => !m.isHidden);
            const sensitiveCount = messages.filter((m) => m.isSensitive).length;
            const highlightedMessages = messages.filter((m) => m.isHighlighted).map((m) => m.content);
            return {
              sessionId: s.id,
              code: s.code,
              status: s.status,
              mode: s.mode,
              participantCount: s.participantCount,
              createdAt: s.createdAt,
              className: (s as any).className ?? "",
              sessionDate: (s as any).sessionDate ?? s.createdAt,
              chatSummary: {
                totalMessages: visibleMessages.length,
                sensitiveCount,
                highlightedMessages,
              },
              questionStats: await Promise.all(
                sessionQs.map(async (q) => ({
                  questionId: q.id,
                  text: q.text,
                  type: q.type,
                  options: q.options ? JSON.parse(q.options) as string[] : [],
                  stats: await getResponseStats(s.id, q.id),
                }))
              ),
            };
          })
        );

        return {
          quiz,
          questions: sessionQs,
                    sessions: sessionStats,
          totalSessions: quizSessions.length,
          totalParticipants: quizSessions.reduce((s, sess) => s + sess.participantCount, 0),
        };
      }),

  }),
  // ── Sessões ───────────────────────────────────────────────────────────────
  sessions: router({
    create: protectedProcedure
      .input(
        z.object({
          quizId: z.number(),
          school: z.string().optional(),
          className: z.string().optional(),
          sessionDate: z.string().optional(), // ISO date string
          mode: z.enum(["normal", "kahoot"]).optional().default("normal"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const quiz = await getQuizById(input.quizId);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
        if (quiz.createdBy !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        let code = generateSessionCode();
        // garantir unicidade
        let existing = await getSessionByCode(code);
        while (existing) {
          code = generateSessionCode();
          existing = await getSessionByCode(code);
        }
        await createSession({
          code,
          quizId: input.quizId,
          teacherId: ctx.user.id,
          school: input.school,
          className: input.className,
          sessionDate: input.sessionDate ? new Date(input.sessionDate) : new Date(),
          mode: input.mode,
          status: "waiting",
        });
        const session = await getSessionByCode(code);
        return session!;
      }),

    list: protectedProcedure.query(({ ctx }) => getSessionsByTeacher(ctx.user.id)),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const s = await getSessionById(input.id);
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        if (s.teacherId !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        return s;
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["waiting", "active", "voting_closed", "chat_open", "closed"]),
          chatEnabled: z.boolean().optional(),
          chatPaused: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const s = await getSessionById(input.id);
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        if (s.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...rest } = input;
        await updateSession(id, {
          ...rest,
          ...(input.status === "closed" ? { closedAt: new Date() } : {}),
        });
        return { success: true };
      }),

    // Acesso público por código (alunos)
    join: publicProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input }) => {
        const s = await getSessionByCode(input.code.toUpperCase());
        if (!s) throw new TRPCError({ code: "NOT_FOUND", message: "Código inválido ou sessão não encontrada." });
        if (s.status === "closed") throw new TRPCError({ code: "BAD_REQUEST", message: "Esta sessão já foi encerrada." });
        // Gerar token anónimo para este aluno nesta sessão
        const anonToken = nanoid(32);
        await incrementParticipant(s.id);
        // Buscar quiz e perguntas
        const quiz = await getQuizById(s.quizId);
        const questionIds: number[] = quiz ? JSON.parse(quiz.questionIds) : [];
        const allQuestions = await getQuestions();
        const sessionQuestions = allQuestions.filter((q) => questionIds.includes(q.id));
        return {
          sessionId: s.id,
          sessionCode: s.code,
          anonToken,
          status: s.status,
          mode: s.mode,
          showResultsImmediately: quiz?.showResultsImmediately ?? false,
          hiddenResultsQuestionIds: quiz?.hiddenResultsQuestionIds ? JSON.parse(quiz.hiddenResultsQuestionIds) as number[] : [],
          chatEnabled: s.chatEnabled,
          questions: sessionQuestions.map((q) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options ? JSON.parse(q.options) : [],
          })),
          quizTitle: quiz?.title ?? "",
          literaryWork: quiz?.literaryWork ?? "",
        };
      }),

    // Polling do estado da sessão (para alunos)
    status: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const s = await getSessionById(input.sessionId);
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        return { status: s.status, chatEnabled: s.chatEnabled, chatPaused: s.chatPaused };
      }),

    // Eliminar sessão e todos os dados associados
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await import("./db").then(m => m.getDb());
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { sessions: sessTable, sessionResponses, chatMessages } = await import("../drizzle/schema");
        const { eq: eqFn } = await import("drizzle-orm");
        const rows = await db.select().from(sessTable).where(eqFn(sessTable.id, input.id)).limit(1);
        const s = rows[0];
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        if (s.teacherId !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        // Eliminar dados associados primeiro (respostas e chat)
        await db.delete(sessionResponses).where(eqFn(sessionResponses.sessionId, input.id));
        await db.delete(chatMessages).where(eqFn(chatMessages.sessionId, input.id));
        await db.delete(sessTable).where(eqFn(sessTable.id, input.id));
        return { success: true };
      }),
  }),

  // ── Votação Anónima ───────────────────────────────────────────────────────
  votes: router({
    submit: publicProcedure
      .input(
        z.object({
          sessionId: z.number(),
          questionId: z.number(),
          anonToken: z.string(),
          answer: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const s = await getSessionById(input.sessionId);
        if (!s || s.status !== "active")
          throw new TRPCError({ code: "BAD_REQUEST", message: "A votação não está aberta neste momento." });
        const already = await hasResponded(input.sessionId, input.questionId, input.anonToken);
        if (already) throw new TRPCError({ code: "BAD_REQUEST", message: "Já respondeste a esta pergunta." });
        await saveResponse({
          sessionId: input.sessionId,
          questionId: input.questionId,
          anonToken: input.anonToken,
          answer: input.answer,
        });
        return { success: true };
      }),

    stats: publicProcedure
      .input(z.object({ sessionId: z.number(), questionId: z.number() }))
      .query(async ({ input }) => {
        const s = await getSessionById(input.sessionId);
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        const raw = await getResponseStats(input.sessionId, input.questionId);
        // Enriquecer com labels legíveis
        const SCALE_LABELS: Record<string, string> = {
          "0": "Concordo totalmente",
          "1": "Concordo parcialmente",
          "2": "Discordo parcialmente",
          "3": "Discordo totalmente",
        };
        // Buscar a pergunta para obter as opções
        const allQs = await getQuestions();
        const q = allQs.find((x) => x.id === input.questionId);
        return raw.map((r) => {
          let label = r.answer;
          if (q?.type === "scale") {
            label = SCALE_LABELS[r.answer] ?? r.answer;
          } else if (q?.type === "multiple_choice" && q.options) {
            const opts = JSON.parse(q.options) as string[];
            const idx = Number(r.answer);
            if (!isNaN(idx) && opts[idx]) label = opts[idx];
          }
          return { ...r, answer: label };
        });
      }),
  }),

  // ── Chat Anónimo ──────────────────────────────────────────────────────────
  chat: router({
    send: publicProcedure
      .input(
        z.object({
          sessionId: z.number(),
          anonToken: z.string(),
          content: z.string().min(1).max(500),
        })
      )
      .mutation(async ({ input }) => {
        const s = await getSessionById(input.sessionId);
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        if (!s.chatEnabled) throw new TRPCError({ code: "BAD_REQUEST", message: "Chat não está ativo." });
        if (s.chatPaused) throw new TRPCError({ code: "BAD_REQUEST", message: "O chat está pausado." });
        const isSensitive = detectSensitive(input.content);
        const id = await saveChatMessage({
          sessionId: input.sessionId,
          anonToken: input.anonToken,
          content: input.content,
          isSensitive,
        });
        return { id, isSensitive };
      }),

    messages: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(({ input }) => getChatMessages(input.sessionId)),

    // Moderação pelo professor
    moderate: protectedProcedure
      .input(
        z.object({
          messageId: z.number(),
          action: z.enum(["hide", "highlight", "flag_sensitive"]),
          sessionId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const s = await getSessionById(input.sessionId);
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        if (s.teacherId !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN", message: "Só o professor da sessão pode moderar mensagens." });
        // Validar que a mensagem pertence realmente a esta sessão
        const msg = await getChatMessageById(input.messageId);
        if (!msg || msg.sessionId !== input.sessionId)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Mensagem não pertence a esta sessão." });
        await moderateMessage(input.messageId, input.action);
        return { success: true };
      }),

    allMessages: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input, ctx }) => {
        const s = await getSessionById(input.sessionId);
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        if (s.teacherId !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        return getAllChatMessages(input.sessionId);
      }),
  }),

  // ── Relatório Pedagógico ──────────────────────────────────────────────────
  report: router({
    generate: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input, ctx }) => {
        const s = await getSessionById(input.sessionId);
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        if (s.teacherId !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });

        const quiz = await getQuizById(s.quizId);
        const questionIds: number[] = quiz ? JSON.parse(quiz.questionIds) : [];
        const allQs = await getQuestions();
        const sessionQs = allQs.filter((q) => questionIds.includes(q.id));

        // Estatísticas por pergunta
        const questionStats = await Promise.all(
          sessionQs.map(async (q) => ({
            question: q.text,
            type: q.type,
            stats: await getResponseStats(s.id, q.id),
          }))
        );

        // Mensagens do chat (anonimizadas)
        const messages = await getAllChatMessages(s.id);
        const visibleMessages = messages.filter((m) => !m.isHidden);
        const sensitiveCount = messages.filter((m) => m.isSensitive).length;
        const highlightedMessages = messages
          .filter((m) => m.isHighlighted)
          .map((m) => m.content);

        return {
          sessionCode: s.code,
          school: s.school,
          className: (s as any).className ?? quiz?.className ?? "",
          sessionDate: (s as any).sessionDate ?? s.createdAt,
          quizTitle: quiz?.title ?? "",
          literaryWork: quiz?.literaryWork ?? "",
          excerpt: (quiz as any)?.excerpt ?? "",
          theme: (quiz as any)?.theme ?? "",
          discipline: quiz?.discipline ?? "",
          yearGroup: quiz?.yearGroup ?? "",
          date: s.createdAt,
          totalParticipants: s.participantCount,
          questionStats,
          chatSummary: {
            totalMessages: visibleMessages.length,
            sensitiveCount,
            highlightedMessages,
          },
          suggestions: generateSuggestions(questionStats),
        };
      }),
  }),

  // ── Kahoot ────────────────────────────────────────────────────────────────
  kahoot: router({
    /** Estado atual da sessão (polling a cada 1s pelo aluno e professor) */
    state: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(({ input }) => getKahootState(input.sessionId)),

    /** Professor lança a próxima pergunta */
    nextQuestion: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          questionIndex: z.number(),
          durationSeconds: z.number().min(5).max(120).default(20),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const s = await getSessionById(input.sessionId);
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        if (s.teacherId !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        await kahootNextQuestion(input.sessionId, input.questionIndex, input.durationSeconds);
        return { success: true };
      }),

    /** Professor encerra a pergunta ativa */
    closeQuestion: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const s = await getSessionById(input.sessionId);
        if (!s) throw new TRPCError({ code: "NOT_FOUND" });
        if (s.teacherId !== ctx.user.id && ctx.user.role !== "admin")
          throw new TRPCError({ code: "FORBIDDEN" });
        await kahootCloseQuestion(input.sessionId);
        return { success: true };
      }),

    /** Aluno submete resposta rápida (anónima) */
    answer: publicProcedure
      .input(
        z.object({
          sessionId: z.number(),
          anonToken: z.string(),
          answer: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const s = await getSessionById(input.sessionId);
        if (!s || s.status !== "active")
          throw new TRPCError({ code: "BAD_REQUEST", message: "Pergunta não está aberta." });
        // Obter o questionId real da pergunta ativa
        const quiz = await getQuizById(s.quizId);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND", message: "Quiz não encontrado." });
        const qIds: number[] = JSON.parse(quiz.questionIds);
        const activeQId = qIds[s.activeQuestionIndex];
        if (!activeQId) throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma pergunta ativa." });
        // Evitar resposta dupla
        const already = await hasResponded(input.sessionId, activeQId, input.anonToken);
        if (already) throw new TRPCError({ code: "BAD_REQUEST", message: "Já respondeste." });
        // Obter resposta correta
        const { questions: qTable } = await import("../drizzle/schema");
        const { eq: eqFn } = await import("drizzle-orm");
        const db = await import("./db").then((m) => m.getDb());
        let correctOption: number | null = null;
        if (db) {
          const qRows = await db.select().from(qTable).where(eqFn(qTable.id, activeQId)).limit(1);
          correctOption = qRows[0]?.correctOption ?? null;
        }
        await saveKahootResponse({
          sessionId: input.sessionId,
          questionId: activeQId,
          anonToken: input.anonToken,
          answer: input.answer,
          correctOption,
        });
        return { success: true, questionId: activeQId };
      }),

    /** Estatísticas de uma pergunta (após fechar) */
    questionStats: publicProcedure
      .input(z.object({ sessionId: z.number(), questionId: z.number() }))
      .query(({ input }) => getKahootQuestionStats(input.sessionId, input.questionId)),

    /** Respostas abertas de uma pergunta */
    openAnswers: publicProcedure
      .input(z.object({ sessionId: z.number(), questionId: z.number() }))
      .query(({ input }) => getKahootOpenAnswers(input.sessionId, input.questionId)),

    /** Placar final anónimo */
    leaderboard: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(({ input }) => getKahootLeaderboard(input.sessionId)),
  }),

  // ── Coordenação ───────────────────────────────────────────────────────────
  coordination: router({
    stats: protectedProcedure
      .input(
        z.object({
          school: z.string().optional(),
          discipline: z.string().optional(),
          yearGroup: z.string().optional(),
        }).optional()
      )
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getCoordinationStats(input);
      }),

    sessions: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await import("./db").then((m) => m.getDb());
        if (!db) return [];
        const { sessions: sessTable } = await import("../drizzle/schema");
        const { desc: descFn } = await import("drizzle-orm");
        return db.select().from(sessTable).orderBy(descFn(sessTable.createdAt)).limit(100);
      }),

    teachers: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return getActiveTeachers();
      }),
  }),
});

// ─── Gerador de sugestões pedagógicas ─────────────────────────────────────────
function generateSuggestions(
  stats: { question: string; type: string; stats: { answer: string; percentage: number }[] }[]
): string[] {
  const suggestions: string[] = [];
  for (const qs of stats) {
    const topAnswer = qs.stats.sort((a, b) => b.percentage - a.percentage)[0];
    if (!topAnswer) continue;
    if (qs.type === "multiple_choice" && topAnswer.percentage < 50) {
      suggestions.push(`A pergunta "${qs.question.slice(0, 60)}..." gerou respostas muito divididas — vale a pena aprofundar em aula.`);
    }
    if (topAnswer.percentage >= 70) {
      suggestions.push(`A maioria da turma respondeu "${topAnswer.answer}" — explore se este consenso reflete compreensão crítica ou normalização.`);
    }
  }
  if (suggestions.length === 0) {
    suggestions.push("Reveja os resultados com a turma e identifique os temas com mais divergência para aprofundar na próxima aula.");
  }
  return suggestions;
}

export type AppRouter = typeof appRouter;
