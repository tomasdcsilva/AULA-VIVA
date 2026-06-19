import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createQuestion,
  createQuiz,
  createSession,
  deleteQuiz,
  getAllChatMessages,
  getAllResponsesForSession,
  getChatMessageById,
  getChatMessages,
  getCoordinationStats,
  getKahootLeaderboard,
  getKahootQuestionStats,
  getKahootState,
  getQuestions,
  getQuizById,
  getQuizzesByTeacher,
  getResponseStats,
  getSessionByCode,
  getSessionById,
  getSessionsByTeacher,
  hasResponded,
  incrementParticipant,
  kahootCloseQuestion,
  kahootNextQuestion,
  moderateMessage,
  saveChatMessage,
  saveKahootResponse,
  saveResponse,
  updateQuiz,
  updateSession,
} from "./db";

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
      return { success: true } as const;
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
        }).optional()
      )
      .query(({ input }) => getQuestions(input)),

    create: protectedProcedure
      .input(
        z.object({
          text: z.string().min(5),
          type: z.enum(["multiple_choice", "scale", "open"]),
          category: z.enum([
            "stereotypes",
            "control",
            "consent",
            "psychological_violence",
            "healthy_relationships",
          ]),
          sensitivityLevel: z.enum(["low", "medium", "high"]).default("low"),
          options: z.array(z.string()).optional(),
          discipline: z.string().optional(),
          yearGroup: z.string().optional(),
          literaryWork: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await createQuestion({
          ...input,
          options: input.options ? JSON.stringify(input.options) : undefined,
          isValidated: ctx.user.role === "admin",
          createdBy: ctx.user.id,
        });
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
          discipline: z.string().optional(),
          yearGroup: z.string().optional(),
          className: z.string().optional(),
          showResultsImmediately: z.boolean().default(false),
          questionIds: z.array(z.number()),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await createQuiz({
          ...input,
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
          discipline: z.string().optional(),
          yearGroup: z.string().optional(),
          className: z.string().optional(),
          showResultsImmediately: z.boolean().optional(),
          questionIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const quiz = await getQuizById(input.id);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
        if (quiz.createdBy !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, questionIds, ...rest } = input;
        await updateQuiz(id, {
          ...rest,
          ...(questionIds ? { questionIds: JSON.stringify(questionIds) } : {}),
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const quiz = await getQuizById(input.id);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
        if (quiz.createdBy !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
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
          questionIds: quiz.questionIds,
          createdBy: ctx.user.id,
        });
        return { id: newId };
      }),
  }),

  // ── Sessões ───────────────────────────────────────────────────────────────
  sessions: router({
    create: protectedProcedure
      .input(
        z.object({
          quizId: z.number(),
          school: z.string().optional(),
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
        return getResponseStats(input.sessionId, input.questionId);
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
          quizTitle: quiz?.title ?? "",
          literaryWork: quiz?.literaryWork ?? "",
          discipline: quiz?.discipline ?? "",
          yearGroup: quiz?.yearGroup ?? "",
          className: quiz?.className ?? "",
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
