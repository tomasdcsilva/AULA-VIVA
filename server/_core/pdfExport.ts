import { Express, Request, Response } from "express";
import puppeteer from "puppeteer-core";
import { getDb } from "../db";
import { sessions, quizzes, sessionResponses, questions, chatMessages, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { jwtVerify } from "jose";
import { parse as parseCookieHeader } from "cookie";

async function getUserFromRequest(req: Request) {
  try {
    const rawCookie = req.headers?.cookie;
    if (!rawCookie) return null;
    const parsed = parseCookieHeader(rawCookie);
    const token = parsed["av_token"];
    if (!token) return null;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "aula-viva-secret");
    const { payload } = await jwtVerify(token, secret);
    return { id: Number(payload.sub), role: payload.role as string };
  } catch { return null; }
}

function buildReportHtml(data: {
  quizTitle: string;
  literaryWork: string;
  discipline: string;
  className: string;
  sessionCode: string;
  sessionDate: string;
  teacherName: string;
  school: string;
  totalParticipants: number;
  responseRate: number;
  duration: string;
  questionStats: { question: string; stats: { answer: string; count: number; percentage: number }[] }[];
  chatMessages: string[];
  sensitiveCount: number;
  suggestions: string[];
}): string {
  const COLORS = ["#0d9488", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#10b981"];

  const statsHtml = data.questionStats.map((qs, i) => {
    const bars = qs.stats.map((s, si) => `
      <div style="margin:6px 0;">
        <div style="display:flex;align-items:center;gap:10px;font-size:13px;">
          <span style="min-width:200px;color:#374151;">${s.answer}</span>
          <div style="flex:1;background:#e5e7eb;border-radius:4px;height:20px;overflow:hidden;">
            <div style="width:${s.percentage}%;background:${COLORS[si % COLORS.length]};height:20px;border-radius:4px;transition:width 0.3s;"></div>
          </div>
          <span style="font-weight:700;min-width:50px;color:#111827;">${s.percentage}% <span style="font-weight:400;color:#6b7280;">(${s.count})</span></span>
        </div>
      </div>`).join("");
    return `
      <div style="margin-bottom:20px;padding:16px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;">
        <p style="font-weight:700;font-size:14px;color:#1e293b;margin:0 0 12px;">${i + 1}. ${qs.question}</p>
        ${bars || "<p style='color:#9ca3af;font-size:13px;font-style:italic;'>Sem respostas registadas.</p>"}
      </div>`;
  }).join("");

  const chatHtml = data.chatMessages.length > 0
    ? data.chatMessages.map(m => `<div style="background:#f0fdfa;border-left:3px solid #0d9488;padding:8px 14px;margin:6px 0;font-size:13px;color:#1e293b;border-radius:0 6px 6px 0;">${m}</div>`).join("")
    : `<p style="color:#9ca3af;font-size:13px;font-style:italic;">Nenhuma mensagem no chat desta sessão.</p>`;

  const suggestionsHtml = data.suggestions.map(s => `
    <div style="display:flex;gap:10px;align-items:flex-start;margin:8px 0;">
      <span style="color:#0d9488;font-weight:700;font-size:16px;margin-top:-1px;">→</span>
      <span style="font-size:13px;color:#374151;">${s}</span>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Pedagógico — ${data.quizTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8f5f0; color: #1e293b; }
    .cover { background: #0f172a; color: white; padding: 48px 56px; min-height: 220px; }
    .cover h1 { font-size: 28px; font-weight: 800; margin-bottom: 6px; }
    .cover .subtitle { font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 24px; }
    .cover .meta { display: flex; gap: 24px; flex-wrap: wrap; margin-top: 20px; }
    .cover .meta-item { font-size: 13px; color: rgba(255,255,255,0.8); }
    .cover .meta-item strong { display: block; font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
    .kpis { display: flex; gap: 0; background: #1e293b; }
    .kpi { flex: 1; padding: 20px 24px; border-right: 1px solid rgba(255,255,255,0.1); }
    .kpi:last-child { border-right: none; }
    .kpi .value { font-size: 32px; font-weight: 800; color: #2dd4bf; }
    .kpi .label { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
    .content { padding: 40px 56px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 16px; }
    .alert { background: #fef3c7; border: 1px solid #f59e0b; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #92400e; margin-bottom: 16px; }
    .footer { background: #f1f5f9; border-top: 1px solid #e2e8f0; padding: 16px 56px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { body { background: white; } .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .kpis { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="cover">
    <div class="subtitle">RELATÓRIO PEDAGÓGICO · AULA VIVA · PROJETO PESQUEIRAMIGA</div>
    <h1>${data.quizTitle}</h1>
    <div class="meta">
      ${data.literaryWork ? `<div class="meta-item"><strong>Obra Literária</strong>${data.literaryWork}</div>` : ""}
      ${data.discipline ? `<div class="meta-item"><strong>Disciplina</strong>${data.discipline}</div>` : ""}
      ${data.className ? `<div class="meta-item"><strong>Turma</strong>${data.className}</div>` : ""}
      <div class="meta-item"><strong>Data</strong>${data.sessionDate}</div>
      ${data.teacherName ? `<div class="meta-item"><strong>Professor(a)</strong>${data.teacherName}</div>` : ""}
      ${data.school ? `<div class="meta-item"><strong>Escola</strong>${data.school}</div>` : ""}
      ${data.duration ? `<div class="meta-item"><strong>Duração</strong>${data.duration}</div>` : ""}
      <div class="meta-item"><strong>Código</strong>${data.sessionCode}</div>
    </div>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="value">${data.totalParticipants}</div><div class="label">Participantes</div></div>
    <div class="kpi"><div class="value">${data.responseRate}%</div><div class="label">Taxa de Resposta</div></div>
    <div class="kpi"><div class="value">${data.questionStats.length}</div><div class="label">Questões</div></div>
    <div class="kpi"><div class="value">${data.chatMessages.length}</div><div class="label">Mensagens no Chat</div></div>
  </div>

  <div class="content">
    ${data.sensitiveCount > 0 ? `<div class="alert">⚠️ Foram detetadas <strong>${data.sensitiveCount}</strong> mensagem(ns) com conteúdo potencialmente sensível. Considera acompanhamento individualizado.</div>` : ""}

    <div class="section">
      <div class="section-title">Resultados do Quiz</div>
      ${statsHtml || "<p style='color:#9ca3af;font-size:13px;'>Sem dados de votação.</p>"}
    </div>

    <div class="section">
      <div class="section-title">Resumo do Chat — Excertos Anonimizados</div>
      ${chatHtml}
    </div>

    <div class="section">
      <div class="section-title">Pistas de Reflexão para a Próxima Aula</div>
      ${suggestionsHtml}
    </div>
  </div>

  <div class="footer">
    <span>Gerado em ${new Date().toLocaleDateString("pt-PT")} · Aula Viva · Projeto PesqueirAmiga · Master HBM Research, LDA</span>
    <span>Este relatório não contém dados que permitam identificar alunos individualmente.</span>
  </div>
</body>
</html>`;
}

export function registerPdfExport(app: Express) {
  app.get("/api/report/:sessionId/pdf", async (req: Request, res: Response) => {
    try {
      const user = await getUserFromRequest(req);
      if (!user) { res.status(401).json({ error: "Não autenticado" }); return; }

      const sessionId = Number(req.params.sessionId);
      if (isNaN(sessionId)) { res.status(400).json({ error: "ID inválido" }); return; }

      const db = await getDb();
      if (!db) { res.status(503).json({ error: "Base de dados indisponível" }); return; }

      // Buscar sessão
      const sessionRows = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
      const session = sessionRows[0];
      if (!session) { res.status(404).json({ error: "Sessão não encontrada" }); return; }

      // Verificar ownership (professor da sessão ou admin)
      if (session.teacherId !== user.id && user.role !== "admin") {
        res.status(403).json({ error: "Acesso negado" }); return;
      }

      // Buscar quiz
      const quizRows = await db.select().from(quizzes).where(eq(quizzes.id, session.quizId)).limit(1);
      const quiz = quizRows[0];

      // Buscar professor
      const teacherRows = await db.select().from(users).where(eq(users.id, session.teacherId)).limit(1);
      const teacher = teacherRows[0];

      // Buscar perguntas do quiz
      const questionIds: number[] = JSON.parse(quiz?.questionIds ?? "[]");
      const allQuestions = questionIds.length > 0
        ? await db.select().from(questions).where(
            questionIds.length === 1
              ? eq(questions.id, questionIds[0])
              : require("drizzle-orm").inArray(questions.id, questionIds)
          )
        : [];

      // Buscar respostas
      const responses = await db.select().from(sessionResponses).where(eq(sessionResponses.sessionId, sessionId));

      // Buscar chat
      const chat = await db.select().from(chatMessages)
        .where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.isHidden, false)));

      // Calcular estatísticas por pergunta
      const questionStats = allQuestions.map(q => {
        const qResponses = responses.filter(r => r.questionId === q.id);
        const options: string[] = JSON.parse(q.options ?? "[]");
        const stats = options.map(opt => {
          const count = qResponses.filter(r => r.answer === opt).length;
          const percentage = qResponses.length > 0 ? Math.round((count / qResponses.length) * 100) : 0;
          return { answer: opt, count, percentage };
        });
        return { question: q.text, stats };
      });

      // Duração
      let duration = "";
      if (session.closedAt && session.createdAt) {
        const ms = new Date(session.closedAt).getTime() - new Date(session.createdAt).getTime();
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        duration = `${mins}m ${secs}s`;
      }

      // Sugestões
      const suggestions = [
        "Retoma os resultados desta sessão no início da próxima aula — partilha os gráficos com a turma e convida à reflexão.",
        "Identifica as perguntas com maior dispersão de respostas e aprofunda o debate em torno dessas questões.",
        "Considera propor uma atividade de escrita criativa a partir de um dos dilemas levantados.",
        "Consulta o psicólogo escolar se identificares alunos que possam precisar de apoio adicional.",
      ];

      const sensitiveCount = chat.filter(m => m.isSensitive).length;
      const highlightedMessages = chat
        .filter(m => m.isHighlighted || m.isSensitive)
        .slice(0, 8)
        .map(m => m.content);

      const html = buildReportHtml({
        quizTitle: quiz?.title ?? "Quiz",
        literaryWork: quiz?.literaryWork ?? "",
        discipline: quiz?.discipline ?? "",
        className: session.className ?? quiz?.className ?? "",
        sessionCode: session.code,
        sessionDate: new Date(session.createdAt).toLocaleDateString("pt-PT"),
        teacherName: teacher?.name ?? "",
        school: teacher?.school ?? "",
        totalParticipants: session.participantCount,
        responseRate: responses.length > 0 && questionIds.length > 0
          ? Math.round((responses.length / (session.participantCount * questionIds.length)) * 100)
          : 0,
        duration,
        questionStats,
        chatMessages: highlightedMessages,
        sensitiveCount,
        suggestions,
      });

      // Gerar PDF com Puppeteer — executablePath dinâmico para dev e produção
      let executablePath: string;
      if (process.env.NODE_ENV === "production") {
        const chromium = await import("@sparticuz/chromium-min");
        executablePath = await chromium.default.executablePath(
          "https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.tar"
        );
      } else {
        executablePath = process.env.CHROMIUM_PATH ||
          ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"]
            .find(p => { try { require("fs").accessSync(p); return true; } catch { return false; } })
          || "/usr/bin/chromium";
      }
      const browser = await puppeteer.launch({
        executablePath,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        headless: true,
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });
      await browser.close();

      const filename = `relatorio_${session.code}_${new Date().toISOString().slice(0, 10)}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(Buffer.from(pdfBuffer));
    } catch (err) {
      console.error("[PDF Export]", err);
      res.status(500).json({ error: "Erro ao gerar PDF" });
    }
  });
}
