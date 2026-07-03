import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  BarChart2,
  BookOpen,
  Calendar,
  Gamepad2,
  Users,
  MessageSquare,
  MessageCircle,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  HelpCircle,
  FileText,
  Tag,
  Quote,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useParams, useSearch } from "wouter";

const THEME_LABELS: Record<string, string> = {
  stereotypes: "Estereótipos de Género",
  control: "Controlo e Ciúme",
  consent: "Consentimento",
  psychological_violence: "Violência Psicológica",
  healthy_relationships: "Relações Saudáveis",
  jealousy: "Ciúme e Possessividade",
  peer_pressure: "Pressão do Grupo",
  social_media: "Redes Sociais e Identidade",
  masculinities: "Masculinidades",
  emotional_dependency: "Dependência Emocional",
};

function exportStructuredReport(quiz: any, sessions: any[]) {
  const dateStr = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  const themeLabel = quiz.theme ? THEME_LABELS[quiz.theme] ?? quiz.theme : null;
  const COLORS = ["#e21b3c", "#1368ce", "#d89e00", "#26890c", "#7c3aed", "#0891b2"];

  const sessionsHtml = sessions.map((session: any, si: number) => {
    const totalParticipants = session.participantCount ?? 0;
    const totalAnswers = session.questionStats.reduce((sum: number, qs: any) =>
      sum + qs.stats.reduce((s: number, r: any) => s + r.count, 0), 0);
    const answeredQs = session.questionStats.filter((qs: any) => qs.stats.reduce((s: number, r: any) => s + r.count, 0) > 0).length;
    const responseRate = session.questionStats.length > 0
      ? Math.round((answeredQs / session.questionStats.length) * 100) : 0;
    const sessionDateStr = session.sessionDate
      ? new Date(session.sessionDate).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })
      : session.createdAt
        ? new Date(session.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })
        : "";

    // Secção 1 — Identificação
    const identHtml = `
      <div class="section">
        <div class="section-title">1. Identificação da Sessão</div>
        <table class="ident-table">
          <tr><td class="ident-label">Data</td><td>${sessionDateStr || "—"}</td></tr>
          <tr><td class="ident-label">Turma</td><td>${session.className || "—"}</td></tr>
          <tr><td class="ident-label">Disciplina</td><td>${quiz.discipline || "—"}</td></tr>
          <tr><td class="ident-label">Ano de escolaridade</td><td>${quiz.yearGroup || "—"}</td></tr>
          <tr><td class="ident-label">Obra / Tema</td><td>${quiz.literaryWork || themeLabel || "—"}</td></tr>
          <tr><td class="ident-label">Modo</td><td>${session.mode === "kahoot" ? "Modo Jogo (Kahoot)" : "Modo Normal"}</td></tr>
        </table>
      </div>`;

    // Secção 2 — Participação
    const rateBarWidth = responseRate;
    const participHtml = `
      <div class="section">
        <div class="section-title">2. Participação</div>
        <div class="kpi-row">
          <div class="kpi-box"><div class="kpi-num" style="color:#2a9d8f">${totalParticipants}</div><div class="kpi-lbl">Alunos presentes</div></div>
          <div class="kpi-box"><div class="kpi-num" style="color:#1a2e4a">${totalAnswers}</div><div class="kpi-lbl">Respostas dadas</div></div>
          <div class="kpi-box"><div class="kpi-num" style="color:#1a2e4a">${session.questionStats.length}</div><div class="kpi-lbl">Questões no quiz</div></div>
          <div class="kpi-box"><div class="kpi-num" style="color:${responseRate >= 80 ? '#26890c' : responseRate >= 50 ? '#d89e00' : '#e21b3c'}">${responseRate}%</div><div class="kpi-lbl">Taxa de resposta</div></div>
        </div>
        <div style="margin-top:12px">
          <div style="font-size:11px;color:#888;margin-bottom:4px">Taxa de resposta</div>
          <div style="background:#e8e0d0;border-radius:4px;height:10px;overflow:hidden">
            <div style="height:100%;width:${rateBarWidth}%;background:#2a9d8f;border-radius:4px"></div>
          </div>
        </div>
      </div>`;

    // Secção 3 — Resultados por pergunta
    const questionsHtml = session.questionStats.map((qs: any, qi: number) => {
      const totalQ = qs.stats.reduce((s: number, r: any) => s + r.count, 0);
      const isOpen = qs.type === "open";

      if (isOpen) {
        const answersHtml = qs.stats.length > 0
          ? qs.stats.map((r: any) => `<div class="open-answer">"${r.answer}"</div>`).join("")
          : `<div style="color:#888;font-style:italic;font-size:12px">Sem respostas registadas.</div>`;
        return `<div class="question-block">
          <div class="q-num">${qi + 1}</div>
          <div class="q-body">
            <div class="q-text">${qs.text}</div>
            <div class="q-type-badge">Resposta aberta</div>
            <div style="margin-top:8px">${answersHtml}</div>
            <div class="q-total">${totalQ} resposta(s)</div>
          </div>
        </div>`;
      }

      const barsHtml = (qs.options ?? []).map((opt: string, oi: number) => {
        const stat = qs.stats.find((s: any) => s.answer === String(oi));
        const count = stat?.count ?? 0;
        const pct = totalQ > 0 ? Math.round((count / totalQ) * 100) : 0;
        const color = COLORS[oi % COLORS.length];
        return `<div style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
            <span style="font-size:12px;color:#333;max-width:75%">${opt}</span>
            <span style="font-size:12px;font-weight:700;color:#1a2e4a">${count} (${pct}%)</span>
          </div>
          <div style="background:#e8e0d0;border-radius:3px;height:14px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:3px"></div>
          </div>
        </div>`;
      }).join("");

      return `<div class="question-block">
        <div class="q-num">${qi + 1}</div>
        <div class="q-body">
          <div class="q-text">${qs.text}</div>
          <div class="q-type-badge">${qs.type === "scale" ? "Escala de concordância" : "Escolha múltipla"}</div>
          <div style="margin-top:10px">${barsHtml}</div>
          <div class="q-total">${totalQ} resposta(s)</div>
        </div>
      </div>`;
    }).join("");

    const resultsHtml = `
      <div class="section">
        <div class="section-title">3. Resultados do Quiz</div>
        ${questionsHtml}
      </div>`;

    // Secção 4 — Pontos críticos
    const criticalQs = session.questionStats
      .filter((qs: any) => qs.type !== "open")
      .map((qs: any) => {
        const total = qs.stats.reduce((s: number, r: any) => s + r.count, 0);
        if (total === 0) return null;
        const pcts = (qs.options ?? []).map((_: any, oi: number) => {
          const stat = qs.stats.find((s: any) => s.answer === String(oi));
          return (stat?.count ?? 0) / total;
        });
        const mean = pcts.reduce((a: number, b: number) => a + b, 0) / (pcts.length || 1);
        const variance = pcts.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / (pcts.length || 1);
        return { ...qs, dispersion: Math.sqrt(variance), total };
      })
      .filter((qs: any) => qs && qs.dispersion > 0.25)
      .sort((a: any, b: any) => b.dispersion - a.dispersion)
      .slice(0, 3);

    const criticalHtml = criticalQs.length > 0
      ? `<div class="section critical-section">
          <div class="section-title" style="color:#b45309">4. Pontos Críticos</div>
          <p style="font-size:12px;color:#666;margin-bottom:12px">Perguntas com maior dispersão de respostas — indicam temas onde a turma está mais dividida e que merecem debate orientado.</p>
          ${criticalQs.map((qs: any) => `
            <div class="critical-item">
              <div class="critical-icon">⚠</div>
              <div>
                <div style="font-weight:600;font-size:13px;color:#1a2e4a">${qs.text}</div>
                <div style="font-size:11px;color:#888;margin-top:2px">Dispersão elevada · ${qs.total} resposta(s) · Sugestão: retomar em debate presencial</div>
              </div>
            </div>`).join("")}
        </div>`
      : `<div class="section">
          <div class="section-title">4. Pontos Críticos</div>
          <p style="font-size:12px;color:#888;font-style:italic">Não foram identificadas perguntas com dispersão significativa nesta sessão.</p>
        </div>`;

    // Secção 5 — Chat
    const chatSummary = session.chatSummary;
    const chatHtml = chatSummary?.totalMessages > 0
      ? `<div class="section">
          <div class="section-title">5. Resumo do Chat</div>
          <div class="kpi-row" style="margin-bottom:12px">
            <div class="kpi-box"><div class="kpi-num" style="color:#1a2e4a;font-size:24px">${chatSummary.totalMessages}</div><div class="kpi-lbl">Mensagens</div></div>
            ${chatSummary.sensitiveCount > 0 ? `<div class="kpi-box"><div class="kpi-num" style="color:#e21b3c;font-size:24px">${chatSummary.sensitiveCount}</div><div class="kpi-lbl">Sinalizadas</div></div>` : ""}
            ${chatSummary.highlightedMessages?.length > 0 ? `<div class="kpi-box"><div class="kpi-num" style="color:#d89e00;font-size:24px">${chatSummary.highlightedMessages.length}</div><div class="kpi-lbl">Destacadas</div></div>` : ""}
          </div>
          ${chatSummary.highlightedMessages?.length > 0 ? `
            <div style="margin-top:8px">
              <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Excertos anonimizados</div>
              ${chatSummary.highlightedMessages.map((msg: string) => `<div class="chat-excerpt">"${msg}"</div>`).join("")}
            </div>` : ""}
        </div>`
      : `<div class="section">
          <div class="section-title">5. Resumo do Chat</div>
          <p style="font-size:12px;color:#888;font-style:italic">Não houve mensagens no chat nesta sessão.</p>
        </div>`;

    // Secção 6 — Pistas de reflexão
    const reflectionHtml = `
      <div class="section reflection-section">
        <div class="section-title" style="color:#1a6b5e">6. Pistas para a Próxima Aula</div>
        <ul class="reflection-list">
          ${criticalQs.length > 0
            ? `<li>Retoma as perguntas com maior dispersão em debate presencial, pedindo aos alunos que justifiquem a sua posição.</li>
               <li>Usa as respostas abertas como ponto de partida para uma discussão em grupo sobre alternativas saudáveis.</li>`
            : `<li>As respostas foram consistentes. Podes avançar para o tema seguinte ou aprofundar com uma pergunta aberta em aula.</li>`}
          <li>Recorda aos alunos que não há respostas certas — o objetivo é refletir e construir perspetivas críticas.</li>
          <li>Considera partilhar os resultados agregados com a turma no início da próxima aula como ponto de partida para debate.</li>
        </ul>
      </div>`;

    const pageBreak = si > 0 ? `style="page-break-before:always"` : "";
    return `<div class="session-wrapper" ${pageBreak}>
      <div class="session-header">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#2a9d8f;margin-bottom:4px">Sessão</div>
            <div style="font-size:20px;font-weight:900;color:#1a2e4a">${quiz.title}${session.className ? ` — ${session.className}` : ""}</div>
            <div style="font-size:12px;color:#666;margin-top:2px">${sessionDateStr} · Código: ${session.code}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:28px;font-weight:900;color:#2a9d8f">${totalParticipants}</div>
            <div style="font-size:11px;color:#888">alunos</div>
          </div>
        </div>
      </div>
      ${identHtml}${participHtml}${resultsHtml}${criticalHtml}${chatHtml}${reflectionHtml}
    </div>`;
  }).join("");

  const totalAllParticipants = sessions.reduce((s: number, sess: any) => s + (sess.participantCount ?? 0), 0);

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Pedagógico — ${quiz.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #1a2e4a; font-size: 13px; line-height: 1.6; }
    .page { max-width: 820px; margin: 0 auto; padding: 48px 40px; }

    /* Capa */
    .cover { background: linear-gradient(135deg, #1a2e4a 0%, #2a4a6e 100%); color: #fff; padding: 48px 40px; border-radius: 12px; margin-bottom: 40px; }
    .cover-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #2a9d8f; background: rgba(42,157,143,0.15); border: 1px solid rgba(42,157,143,0.3); border-radius: 20px; display: inline-block; padding: 4px 12px; margin-bottom: 16px; }
    .cover h1 { font-size: 28px; font-weight: 900; color: #fff; margin-bottom: 8px; line-height: 1.2; }
    .cover-meta { font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 24px; }
    .cover-meta span { margin-right: 16px; }
    .cover-kpis { display: flex; gap: 24px; margin-top: 24px; }
    .cover-kpi { background: rgba(255,255,255,0.08); border-radius: 8px; padding: 16px 20px; text-align: center; flex: 1; }
    .cover-kpi .num { font-size: 32px; font-weight: 900; color: #2a9d8f; }
    .cover-kpi .lbl { font-size: 10px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
    .excerpt-box { background: rgba(255,255,255,0.12); border-left: 4px solid #2a9d8f; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-top: 20px; font-style: italic; font-size: 13px; color: rgba(255,255,255,0.9); }
    .excerpt-box strong { font-style: normal; color: #7ee8df; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }

    /* Sessão */
    .session-wrapper { margin-bottom: 48px; }
    .session-header { background: #f5f0e8; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px; border-left: 5px solid #2a9d8f; }

    /* Secções */
    .section { margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid #e8e0d0; }
    .section:last-child { border-bottom: none; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #1a2e4a; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 2px solid #e8e0d0; }

    /* Tabela de identificação */
    .ident-table { width: 100%; border-collapse: collapse; }
    .ident-table tr { border-bottom: 1px solid #f0ebe0; }
    .ident-table td { padding: 7px 10px; font-size: 12px; }
    .ident-label { font-weight: 600; color: #888; width: 160px; }

    /* KPIs */
    .kpi-row { display: flex; gap: 12px; }
    .kpi-box { flex: 1; background: #f8f5ef; border-radius: 8px; padding: 14px; text-align: center; }
    .kpi-num { font-size: 28px; font-weight: 900; }
    .kpi-lbl { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 2px; }

    /* Perguntas */
    .question-block { display: flex; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px dashed #e8e0d0; }
    .question-block:last-child { border-bottom: none; margin-bottom: 0; }
    .q-num { width: 24px; height: 24px; background: #1a2e4a; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
    .q-body { flex: 1; }
    .q-text { font-weight: 600; font-size: 13px; color: #1a2e4a; margin-bottom: 4px; }
    .q-type-badge { font-size: 10px; color: #2a9d8f; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
    .q-total { font-size: 11px; color: #aaa; margin-top: 6px; text-align: right; }
    .open-answer { background: #f5f0e8; border-left: 3px solid #2a9d8f; padding: 6px 10px; border-radius: 0 4px 4px 0; font-style: italic; font-size: 12px; color: #444; margin-bottom: 5px; }

    /* Pontos críticos */
    .critical-section { background: #fffbeb; border-radius: 8px; padding: 16px 18px; border: 1px solid #fde68a; }
    .critical-item { display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start; }
    .critical-icon { color: #d97706; font-size: 16px; flex-shrink: 0; margin-top: 1px; }

    /* Chat */
    .chat-excerpt { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; font-style: italic; font-size: 12px; color: #444; margin-bottom: 6px; }

    /* Pistas de reflexão */
    .reflection-section { background: #f0faf8; border-radius: 8px; padding: 16px 18px; border: 1px solid #a7f3d0; }
    .reflection-list { padding-left: 0; list-style: none; }
    .reflection-list li { padding: 5px 0 5px 20px; position: relative; font-size: 12px; color: #1a4a40; }
    .reflection-list li::before { content: "→"; position: absolute; left: 0; color: #2a9d8f; font-weight: 700; }

    /* Rodapé */
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e8e0d0; font-size: 10px; color: #aaa; display: flex; justify-content: space-between; }

    @media print {
      .page { padding: 20px; }
      .cover { border-radius: 0; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Capa -->
  <div class="cover">
    <div class="cover-badge">Relatório Pedagógico · Projeto PesqueirAmiga</div>
    <h1>${quiz.title}</h1>
    <div class="cover-meta">
      ${quiz.literaryWork ? `<span>📖 ${quiz.literaryWork}</span>` : ""}
      ${themeLabel ? `<span>🏷 ${themeLabel}</span>` : ""}
      ${quiz.discipline ? `<span>📚 ${quiz.discipline}</span>` : ""}
      ${quiz.yearGroup ? `<span>🎓 ${quiz.yearGroup}</span>` : ""}
    </div>
    ${quiz.excerpt ? `<div class="excerpt-box"><strong>Excerto de referência</strong>${quiz.excerpt}</div>` : ""}
    <div class="cover-kpis">
      <div class="cover-kpi"><div class="num">${sessions.length}</div><div class="lbl">Sessões</div></div>
      <div class="cover-kpi"><div class="num">${totalAllParticipants}</div><div class="lbl">Participantes</div></div>
      <div class="cover-kpi"><div class="num">${quiz.questions?.length ?? 0}</div><div class="lbl">Questões</div></div>
    </div>
  </div>

  <!-- Sessões -->
  ${sessionsHtml}

  <!-- Rodapé -->
  <div class="footer">
    <span>Aula Viva · Projeto PesqueirAmiga · Master HBM Research, LDA</span>
    <span>Exportado em ${dateStr}</span>
  </div>

</div>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 800);
    toast.success("Relatório aberto para exportação PDF!");
  }
}

const OPTION_COLORS = [
  "#e21b3c",
  "#1368ce",
  "#d89e00",
  "#26890c",
  "#7c3aed",
  "#0891b2",
];

// Detecta perguntas com maior dispersão (ponto crítico pedagógico)
function calcDispersion(stats: { answer: string; count: number }[], total: number): number {
  if (total === 0) return 0;
  const pcts = stats.map((s) => s.count / total);
  const mean = pcts.reduce((a, b) => a + b, 0) / (pcts.length || 1);
  const variance = pcts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (pcts.length || 1);
  return Math.sqrt(variance);
}

export default function QuizStats() {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);
  const { isAuthenticated } = useAuth();
  const search = useSearch();
  const sessionFilter = new URLSearchParams(search).get("session");
  const filteredSessionId = sessionFilter ? Number(sessionFilter) : null;

  const { data, isLoading } = trpc.quizzes.stats.useQuery(
    { id: quizId },
    { enabled: isAuthenticated && !isNaN(quizId) }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="av-section text-center py-24">
        <p className="text-muted-foreground">Quiz não encontrado.</p>
        <Link href="/dashboard" className="av-btn-primary mt-4 inline-block">
          Voltar ao Painel
        </Link>
      </div>
    );
  }

  const { quiz, sessions: allSessions, totalSessions: allTotalSessions, totalParticipants: allTotalParticipants } = data;
  // Filtrar por sessão específica se vier da URL
  const sessions = filteredSessionId
    ? allSessions.filter((s: any) => s.sessionId === filteredSessionId)
    : allSessions;
  const totalSessions = sessions.length;
  const totalParticipants = sessions.reduce((sum: number, s: any) => sum + (s.participantCount ?? 0), 0);
  const avgParticipants = totalSessions > 0 ? Math.round(totalParticipants / totalSessions) : 0;

  return (
    <div className="av-section animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/dashboard" className="mt-1 p-2 rounded-lg hover:bg-cream-dark transition-colors text-muted-foreground hover:text-navy">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="av-badge bg-red-100 text-red-700 flex items-center gap-1">
              <Gamepad2 className="w-3 h-3" /> Relatório de Jogo
            </span>
          </div>
          <h1 className="av-section-title">{quiz.title}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
            {quiz.literaryWork && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {quiz.literaryWork}</span>}
            {(quiz as any).theme && <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {THEME_LABELS[(quiz as any).theme] ?? (quiz as any).theme}</span>}
            {quiz.discipline && <span>📚 {quiz.discipline}</span>}
            {quiz.yearGroup && <span>🎓 {quiz.yearGroup}</span>}
            {quiz.className && <span>👥 {quiz.className}</span>}
          </div>
          {(quiz as any).excerpt && (
            <div className="mt-3 p-3 bg-cream-dark rounded-xl border-l-4 border-teal text-sm text-navy italic flex items-start gap-2 max-w-2xl">
              <Quote className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
              <span>{(quiz as any).excerpt}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => exportStructuredReport({ ...quiz, questions: data.questions }, sessions)}
          className="av-btn-secondary flex items-center gap-2 flex-shrink-0 print:hidden"
        >
          <FileText className="w-4 h-4" /> Exportar PDF
        </button>
      </div>

      {/* Indicadores de participação */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="av-card text-center">
          <div className="text-3xl font-black text-teal">{totalSessions}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" /> Jogos realizados
          </div>
        </div>
        <div className="av-card text-center">
          <div className="text-3xl font-black text-teal">{totalParticipants}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> Total de alunos
          </div>
        </div>
        <div className="av-card text-center">
          <div className="text-3xl font-black text-navy">{data.questions.length}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <HelpCircle className="w-3 h-3" /> Questões no quiz
          </div>
        </div>
        <div className="av-card text-center">
          <div className="text-3xl font-black text-navy">{avgParticipants}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" /> Média por jogo
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="av-card text-center py-16">
          <BarChart2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">Este quiz ainda não foi utilizado em nenhum jogo.</p>
          <p className="text-sm text-muted-foreground">Volta ao painel e clica em <strong>Jogar</strong> para lançar o primeiro jogo.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {sessions.map((session) => {
            const totalAnswers = session.questionStats.reduce((sum, qs) => {
              return sum + qs.stats.reduce((s, r) => s + r.count, 0);
            }, 0);
            const totalQuestions = session.questionStats.length;
            const answeredQuestions = session.questionStats.filter(qs =>
              qs.stats.reduce((s, r) => s + r.count, 0) > 0
            ).length;
            const responseRate = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

            // Pontos críticos: perguntas com maior dispersão de respostas
            const criticalPoints = session.questionStats
              .filter(qs => qs.type !== "open")
              .map((qs) => {
                const total = qs.stats.reduce((s, r) => s + r.count, 0);
                return { ...qs, dispersion: calcDispersion(qs.stats, total), total };
              })
              .filter(qs => qs.total > 0 && qs.dispersion > 0.25)
              .sort((a, b) => b.dispersion - a.dispersion)
              .slice(0, 3);

            return (
              <div key={session.sessionId} className="space-y-6">
                {/* Cabeçalho da sessão */}
                <div className="border-b border-border pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-black text-navy text-xl tracking-widest">{session.code}</span>
                        <span className="av-badge bg-gray-100 text-gray-600">Encerrado</span>
                        {session.mode === "kahoot" && <span className="av-badge bg-purple-100 text-purple-700">Modo Jogo</span>}
                        {(session as any).className && <span className="av-badge bg-teal-light text-teal font-semibold">👥 {(session as any).className}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date((session as any).sessionDate ?? session.createdAt).toLocaleDateString("pt-PT", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                        {" · "}
                        <span className="font-semibold text-navy">{session.participantCount} aluno(s)</span>
                        {" · "}
                        <span className="font-semibold text-teal">{responseRate}% de taxa de resposta</span>
                        {(session as any).chatSummary?.totalMessages > 0 && (
                          <>
                            {" · "}
                            <span className="text-muted-foreground">{(session as any).chatSummary.totalMessages} mensagem(ns) no chat</span>
                            {(session as any).chatSummary.sensitiveCount > 0 && (
                              <span className="text-red-600 font-semibold ml-1">⚠️ {(session as any).chatSummary.sensitiveCount} sensível(is)</span>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Secção 1: Participação */}
                <div className="av-card">
                  <h3 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal" /> Participação
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-black text-teal">{session.participantCount}</div>
                      <div className="text-xs text-muted-foreground mt-1">Alunos presentes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-navy">{totalAnswers}</div>
                      <div className="text-xs text-muted-foreground mt-1">Respostas dadas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-navy">{responseRate}%</div>
                      <div className="text-xs text-muted-foreground mt-1">Taxa de resposta</div>
                    </div>
                  </div>
                  {/* Barra de progresso da taxa de resposta */}
                  <div className="mt-4">
                    <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all duration-700"
                        style={{ width: `${responseRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Secção 2: Resultados por pergunta */}
                <div className="av-card">
                  <h3 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-teal" /> Resultados do Quiz
                  </h3>
                  <div className="space-y-6">
                    {session.questionStats.map((qs, qi) => {
                      const totalQ = qs.stats.reduce((s, r) => s + r.count, 0);
                      const isOpen = qs.type === "open";

                      return (
                        <div key={qs.questionId} className="border-b border-border/50 pb-5 last:border-0 last:pb-0">
                          <p className="text-sm font-semibold text-navy mb-3">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cream-dark text-xs font-bold text-muted-foreground mr-2">{qi + 1}</span>
                            {qs.text.replace(/\?+$/, "")}
                          </p>

                          {totalQ === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Sem respostas registadas.</p>
                          ) : isOpen ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                <MessageSquare className="w-3 h-3" />
                                <span>{totalQ} resposta(s) escrita(s)</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                {qs.stats.map((r, ri) => (
                                  <div
                                    key={ri}
                                    className="bg-cream-dark rounded-lg px-3 py-2 text-sm text-navy italic border-l-2 border-teal"
                                  >
                                    "{r.answer}"
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {qs.options.map((opt, oi) => {
                                const stat = qs.stats.find((s) => s.answer === String(oi));
                                const count = stat?.count ?? 0;
                                const pct = totalQ > 0 ? Math.round((count / totalQ) * 100) : 0;
                                const color = OPTION_COLORS[oi % OPTION_COLORS.length];
                                return (
                                  <div key={oi} className="flex items-center gap-3">
                                    <span
                                      className="w-3 h-3 rounded-sm flex-shrink-0"
                                      style={{ backgroundColor: color }}
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-xs text-muted-foreground">{opt}</span>
                                        <span className="text-xs font-bold text-navy">{count} ({pct}%)</span>
                                      </div>
                                      <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all duration-700"
                                          style={{ width: `${pct}%`, backgroundColor: color }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <p className="text-xs text-muted-foreground text-right">{totalQ} resposta(s)</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Secção 3: Pontos críticos pedagógicos */}
                {criticalPoints.length > 0 && (
                  <div className="av-card border-l-4 border-amber-400">
                    <h3 className="font-display font-bold text-navy mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Pontos Críticos
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Estas perguntas tiveram maior dispersão de respostas — indicam temas onde a turma está mais dividida e que merecem debate orientado.
                    </p>
                    <div className="space-y-3">
                      {criticalPoints.map((qs, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-navy">{qs.text.replace(/\?+$/, "")}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Dispersão elevada — {qs.total} resposta(s). Sugestão: retomar em debate presencial.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Secção 4: Debate da Turma — agrupado por rondas */}
                {(session as any).chatSummary?.totalMessages > 0 && (
                  <div className="av-card border border-gold/30 bg-gold-light/20">
                    <h3 className="font-display font-bold text-navy mb-1 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-amber-600" /> Debate da Turma
                    </h3>
                    {/* Estatísticas rápidas */}
                    <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
                      <span><strong className="text-navy">{(session as any).chatSummary.totalMessages}</strong> mensagens</span>
                      {(session as any).chatSummary.chatRounds?.length > 0 && (
                        <span><strong className="text-navy">{(session as any).chatSummary.chatRounds.length}</strong> ronda(s) de debate</span>
                      )}
                      {(session as any).chatSummary.sensitiveCount > 0 && (
                        <span className="text-red-600"><strong>{(session as any).chatSummary.sensitiveCount}</strong> sinalizadas</span>
                      )}
                      {(session as any).chatSummary.highlightedMessages?.length > 0 && (
                        <span className="text-amber-600"><strong>{(session as any).chatSummary.highlightedMessages.length}</strong> destacadas</span>
                      )}
                    </div>
                    {/* Rondas de debate */}
                    {(session as any).chatSummary.chatRounds?.length > 0 ? (
                      <div className="space-y-5">
                        {(session as any).chatSummary.chatRounds.map((round: { roundId: number; prompt: string | null; messages: { content: string; isSensitive: boolean; isHighlighted: boolean; createdAt: number }[] }) => (
                          <div key={round.roundId}>
                            {/* Cabeçalho da ronda */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex-shrink-0">{round.roundId}</span>
                              <div className="flex-1 h-px bg-amber-200/60" />
                              <span className="text-[10px] text-muted-foreground">{round.messages.length} resposta(s)</span>
                            </div>
                            {/* Pergunta orientadora da ronda */}
                            {round.prompt && (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-2 flex items-start gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 font-medium leading-snug italic">“{round.prompt}”</p>
                              </div>
                            )}
                            {/* Mensagens desta ronda */}
                            <div className="space-y-1.5 pl-1">
                              {round.messages.map((msg, i) => (
                                <div
                                  key={i}
                                  className={`text-sm rounded-lg px-3 py-2 border ${
                                    msg.isSensitive
                                      ? "bg-red-50 border-red-200 text-red-800"
                                      : msg.isHighlighted
                                        ? "bg-amber-50 border-amber-200 text-navy font-medium"
                                        : "bg-white border-gray-100 text-navy"
                                  }`}
                                >
                                  <span className="mr-2">{msg.isHighlighted ? "⭐" : msg.isSensitive ? "⚠️" : "●"}</span>
                                  {msg.content}
                                  <span className="ml-2 text-[10px] text-muted-foreground">
                                    {new Date(msg.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Fallback: mensagens sem rondas (dados antigos) */
                      <div className="space-y-1.5">
                        {(session as any).chatSummary.allMessages?.map((msg: { content: string; isSensitive: boolean; isHighlighted: boolean; createdAt: number }, i: number) => (
                          <div
                            key={i}
                            className={`text-sm rounded-lg px-3 py-2 border ${
                              msg.isSensitive
                                ? "bg-red-50 border-red-200 text-red-800"
                                : msg.isHighlighted
                                  ? "bg-amber-50 border-amber-200 text-navy font-medium italic"
                                  : "bg-white border-gray-100 text-navy"
                            }`}
                          >
                            <span className="mr-2">{msg.isHighlighted ? "⭐" : msg.isSensitive ? "⚠️" : "●"}</span>
                            {msg.content}
                            <span className="ml-2 text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Secção 5: Pistas de reflexão */}
                <div className="av-card bg-teal-light/30 border border-teal/20">
                  <h3 className="font-display font-bold text-navy mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal" /> Pistas para a Próxima Aula
                  </h3>
                  <ul className="space-y-2 text-sm text-navy">
                    {criticalPoints.length > 0 ? (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-teal font-bold mt-0.5">→</span>
                          <span>Retoma as perguntas com maior dispersão em debate presencial, pedindo aos alunos que justifiquem a sua posição.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-teal font-bold mt-0.5">→</span>
                          <span>Usa as respostas abertas como ponto de partida para uma discussão em grupo sobre alternativas saudáveis.</span>
                        </li>
                      </>
                    ) : (
                      <li className="flex items-start gap-2">
                        <span className="text-teal font-bold mt-0.5">→</span>
                        <span>As respostas foram consistentes. Podes avançar para o tema seguinte ou aprofundar com uma pergunta aberta em aula.</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <span className="text-teal font-bold mt-0.5">→</span>
                      <span>Recorda aos alunos que não há respostas certas — o objetivo é refletir e construir perspetivas críticas.</span>
                    </li>
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
