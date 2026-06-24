import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";
import { getUserById } from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/** Lê um cookie pelo nome a partir do header raw (sem precisar de cookie-parser) */
function getCookieFromHeader(req: CreateExpressContextOptions["req"], name: string): string | undefined {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return undefined;
  const parsed = parseCookieHeader(rawCookie);
  return parsed[name];
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // 1. Tentar autenticar via OAuth do Manus (cookie de sessão padrão)
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  // 2. Se não autenticado via OAuth, tentar o JWT próprio (av_token)
  if (!user) {
    try {
      const avToken = getCookieFromHeader(opts.req, "av_token");
      if (avToken) {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "aula-viva-secret");
        const { payload } = await jwtVerify(avToken, secret);
        const userId = Number(payload.sub);
        if (userId) {
          user = (await getUserById(userId)) ?? null;
        }
      }
    } catch {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
