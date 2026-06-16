import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Contexto de teste ────────────────────────────────────────────────────────
type AuthUser = NonNullable<TrpcContext["user"]>;

function makeCtx(overrides?: Partial<AuthUser>): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthUser = {
    id: 1,
    openId: "test-user-001",
    email: "professor@escola.pt",
    name: "Prof. Teste",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe("auth.logout", () => {
  it("limpa o cookie de sessão e retorna sucesso", async () => {
    const { ctx, clearedCookies } = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });

  it("auth.me retorna null quando não autenticado", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });
});

// ─── Banco de Perguntas ───────────────────────────────────────────────────────
describe("questions.list", () => {
  it("retorna uma lista (pode estar vazia em ambiente de teste)", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.questions.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("aceita filtros de categoria e sensibilidade sem erro", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.questions.list({
      category: "healthy_relationships",
      sensitivityLevel: "low",
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Sessão — join com código inválido ───────────────────────────────────────
describe("sessions.join", () => {
  it("lança NOT_FOUND para código inexistente", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.sessions.join({ code: "ZZ-999" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

// ─── Votação — submit sem sessão válida ──────────────────────────────────────
describe("votes.submit", () => {
  it("lança BAD_REQUEST para sessão inexistente", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.votes.submit({
        sessionId: 99999,
        questionId: 1,
        anonToken: "token-teste",
        answer: "Sim",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

// ─── Chat — send sem sessão válida ───────────────────────────────────────────
describe("chat.send", () => {
  it("lança NOT_FOUND para sessão inexistente", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.chat.send({
        sessionId: 99999,
        anonToken: "token-teste",
        content: "Olá turma!",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

// ─── Coordenação — acesso restrito ───────────────────────────────────────────
describe("coordination.stats", () => {
  it("lança FORBIDDEN para utilizador sem role admin", async () => {
    const { ctx } = makeCtx({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.coordination.stats({})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
