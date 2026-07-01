import { useAuth } from "@/_core/hooks/useAuth";
import PedagogicBox from "@/components/PedagogicBox";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Play, Square, MessageCircle, PauseCircle, PlayCircle,
  Eye, EyeOff, Flag, Star, BarChart3, FileText, Copy, Users, Monitor, Sheet
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const STATUS_FLOW = ["waiting", "active", "voting_closed", "chat_open", "closed"] as const;
type SessionStatus = (typeof STATUS_FLOW)[number];

const STATUS_LABELS: Record<string, string> = {
  waiting: "A aguardar alunos",
  active: "Votação aberta",
  voting_closed: "Votação encerrada",
  chat_open: "Chat aberto",
  closed: "Sessão encerrada",
};

const CHART_COLORS = [
  "oklch(52% 0.13 185)",
  "oklch(78% 0.14 80)",
  "oklch(38% 0.12 185)",
  "oklch(65% 0.14 80)",
  "oklch(60% 0.10 185)",
];

export default function SessionManager() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);
  const isValidId = !isNaN(sessionId) && sessionId > 0;
  const { isAuthenticated } = useAuth();
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [reportVisible, setReportVisible] = useState(false);

  const { data: session, refetch: refetchSession } = trpc.sessions.get.useQuery(
    { id: sessionId },
    { enabled: isAuthenticated && isValidId, refetchInterval: 5000 }
  );

  const { data: quiz } = trpc.quizzes.get.useQuery(
    { id: session?.quizId ?? 0 },
    { enabled: !!session }
  );

  const { data: questions } = trpc.questions.list.useQuery(undefined, { enabled: !!quiz });

  const { data: chatMessages, refetch: refetchChat } = trpc.chat.allMessages.useQuery(
    { sessionId },
    { enabled: isAuthenticated && isValidId, refetchInterval: 3000 }
  );

  const { data: report } = trpc.report.generate.useQuery(
    { sessionId },
    { enabled: reportVisible && isAuthenticated && isValidId }
  );

  const updateStatus = trpc.sessions.updateStatus.useMutation({
    onSuccess: () => refetchSession(),
    onError: (e) => toast.error(e.message),
  });

  const moderate = trpc.chat.moderate.useMutation({
    onSuccess: () => refetchChat(),
    onError: (e) => toast.error(e.message),
  });

  const { data: stats } = trpc.votes.stats.useQuery(
    { sessionId, questionId: activeQuestionId ?? 0 },
    { enabled: !!activeQuestionId, refetchInterval: 3000 }
  );

  const sessionQuestions = quiz
    ? (JSON.parse(quiz.questionIds) as number[])
        .map((qid) => questions?.find((q) => q.id === qid))
        .filter(Boolean)
    : [];

  const copyCode = () => {
    if (session?.code) {
      navigator.clipboard.writeText(session.code);
      toast.success("Código copiado!");
    }
  };

  if (!isValidId) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-muted-foreground">Sessão não encontrada.</p>
      <a href="/dashboard" className="av-btn-primary">Voltar ao Painel</a>
    </div>
  );

  if (!session) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const status = session.status as SessionStatus;

  return (
    <div className="av-section animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-muted-foreground hover:text-navy transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="av-section-title">Gerir Sessão</h1>
            <p className="av-section-subtitle">{quiz?.title ?? "Carregando..."}</p>
          </div>
        </div>
        <a
          href={`/projection/${sessionId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-navy/80 transition-colors"
          title="Abrir vista de projeção para o quadro"
        >
          <Monitor className="w-4 h-4" />
          Vista de Projeção
        </a>
      </div>

      <PedagogicBox title="Gestão da Sessão de Aula">
        Aqui controlas o fluxo da sessão: abre a votação, encerra-a quando todos tiverem respondido,
        ativa o chat para debate e modera as mensagens. Mensagens assinaladas como sensíveis ficam
        destacadas para a tua atenção imediata.
      </PedagogicBox>

      {/* Painel de estado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Código */}
        <div className="av-card-teal text-center">
          <p className="text-xs font-semibold text-teal-dark uppercase tracking-wider mb-1">Código da Sessão</p>
          <p className="text-4xl font-mono font-bold text-navy tracking-widest mb-2">{session.code}</p>
          <button onClick={copyCode} className="text-teal text-sm font-semibold flex items-center gap-1 mx-auto hover:underline">
            <Copy className="w-3 h-3" /> Copiar
          </button>
        </div>

        {/* Estado */}
        <div className="av-card text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Estado</p>
          <span className="inline-block bg-teal-light text-teal-dark font-bold px-4 py-2 rounded-full text-sm">
            {STATUS_LABELS[status]}
          </span>
        </div>

        {/* Participantes */}
        <div className="av-card text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Participantes</p>
          <p className="text-4xl font-bold text-navy">{session.participantCount}</p>
          <p className="text-xs text-muted-foreground mt-1">alunos anónimos</p>
        </div>
      </div>

      {/* Controlos de fluxo */}
      <div className="av-card mt-6">
        <h2 className="font-display font-bold text-navy mb-4">Controlos da Sessão</h2>
        <div className="flex flex-wrap gap-3">
          {status === "waiting" && (
            <button
              onClick={() => updateStatus.mutate({ id: sessionId, status: "active" })}
              className="av-btn-primary flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Abrir Votação
            </button>
          )}
          {status === "active" && (
            <>
              <button
                onClick={() => updateStatus.mutate({ id: sessionId, status: "voting_closed" })}
                className="bg-amber-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-2"
              >
                <Square className="w-4 h-4" /> Encerrar Votação
              </button>
              <button
                onClick={() => { if (confirm("Tens a certeza que queres encerrar a sessão agora?")) updateStatus.mutate({ id: sessionId, status: "closed" }); }}
                className="bg-red-100 text-red-700 font-semibold px-5 py-3 rounded-xl hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <Square className="w-4 h-4" /> Encerrar Sessão
              </button>
            </>
          )}
          {status === "voting_closed" && (
            <>
              <button
                onClick={() => updateStatus.mutate({ id: sessionId, status: "chat_open", chatEnabled: true })}
                className="av-btn-primary flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Abrir Chat para Debate
              </button>
              <button
                onClick={() => { if (confirm("Tens a certeza que queres encerrar a sessão agora?")) updateStatus.mutate({ id: sessionId, status: "closed" }); }}
                className="bg-red-100 text-red-700 font-semibold px-5 py-3 rounded-xl hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <Square className="w-4 h-4" /> Encerrar Sessão
              </button>
            </>
          )}
          {status === "chat_open" && (
            <>
              <button
                onClick={() => updateStatus.mutate({ id: sessionId, status: "chat_open", chatPaused: !session.chatPaused })}
                className="bg-amber-100 text-amber-800 font-semibold px-5 py-3 rounded-xl hover:bg-amber-200 transition-colors flex items-center gap-2"
              >
                {session.chatPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                {session.chatPaused ? "Retomar Chat" : "Pausar Chat"}
              </button>
              <button
                onClick={() => updateStatus.mutate({ id: sessionId, status: "closed" })}
                className="bg-red-100 text-red-700 font-semibold px-5 py-3 rounded-xl hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <Square className="w-4 h-4" /> Encerrar Sessão
              </button>
            </>
          )}
          {status === "closed" && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              ✅ Sessão encerrada em {session.closedAt ? new Date(session.closedAt).toLocaleString("pt-PT") : "—"}
            </div>
          )}
        </div>
      </div>

      {/* Estatísticas por pergunta */}
      <div className="av-card mt-6">
        <h2 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal" /> Estatísticas de Votação
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {sessionQuestions.map((q) => q && (
            <button
              key={q.id}
              onClick={() => setActiveQuestionId(q.id)}
              className={`text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                activeQuestionId === q.id
                  ? "bg-teal text-white"
                  : "bg-cream-dark text-navy hover:bg-teal-light"
              }`}
            >
              {q.text.slice(0, 40)}…
            </button>
          ))}
        </div>
        {(() => {
          const hiddenIds: number[] = quiz?.hiddenResultsQuestionIds
            ? JSON.parse((quiz as any).hiddenResultsQuestionIds)
            : [];
          const isHidden = activeQuestionId ? hiddenIds.includes(activeQuestionId) : false;
          if (isHidden) {
            return (
              <div className="flex items-center gap-3 py-6 px-4 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-2xl">📋</span>
                <p className="text-amber-800 text-sm font-semibold">Resultados apenas no relatório — não são mostrados durante a sessão.</p>
              </div>
            );
          }
          return activeQuestionId && stats && stats.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(88% 0.02 85)" />
                  <XAxis dataKey="answer" tick={{ fontSize: 11, fill: "oklch(50% 0.025 240)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(50% 0.025 240)" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "0.75rem", border: "1px solid oklch(88% 0.02 85)" }}
                    formatter={(v: number, _: string, entry: any) => [`${v} resp. (${entry.payload.percentage}%)`, "Respostas"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {activeQuestionId ? "Sem respostas ainda." : "Seleciona uma pergunta para ver as estatísticas."}
            </p>
          );
        })()}
      </div>

      {/* Chat */}
      {(status === "chat_open" || status === "closed") && chatMessages && (
        <div className="av-card mt-6">
          <h2 className="font-display font-bold text-navy mb-2 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-teal" /> Moderação do Chat
          </h2>
          <PedagogicBox variant="sensitive" title="Protocolo para mensagens sensíveis">
            Mensagens com conteúdo sensível (pedidos de ajuda, referências a violência ou abuso) são
            sinalizadas automaticamente e destacadas a vermelho. Intervém discretamente, oferece apoio
            privado ao aluno e, se necessário, contacta o serviço de psicologia escolar.
          </PedagogicBox>
          <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
            {chatMessages.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">Nenhuma mensagem ainda.</p>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl flex items-start gap-3 ${
                    msg.isSensitive
                      ? "bg-red-50 border border-red-200"
                      : msg.isHighlighted
                        ? "bg-gold-light border border-gold"
                        : msg.isHidden
                          ? "bg-gray-50 opacity-50"
                          : "bg-cream-dark"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {msg.isSensitive && (
                      <span className="text-xs font-bold text-red-600 block mb-1">⚠️ Mensagem sensível</span>
                    )}
                    <p className="text-sm text-navy">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString("pt-PT")}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => moderate.mutate({ messageId: msg.id, action: "highlight", sessionId })}
                      title="Destacar"
                      className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moderate.mutate({ messageId: msg.id, action: "flag_sensitive", sessionId })}
                      title="Sinalizar sensível"
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moderate.mutate({ messageId: msg.id, action: "hide", sessionId })}
                      title="Ocultar"
                      className="p-1.5 text-muted-foreground hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {msg.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Relatório */}
      <div className="av-card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-navy flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal" /> Relatório Pedagógico
          </h2>
          <button
            onClick={() => setReportVisible(!reportVisible)}
            className="av-btn-primary text-sm px-4 py-2"
          >
            {reportVisible ? "Ocultar" : "Gerar Relatório"}
          </button>
        </div>

        {reportVisible && report && (
          <div className="animate-fade-in space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-cream-dark rounded-xl p-3">
                <p className="text-muted-foreground text-xs">Turma</p>
                <p className="font-bold text-navy">{report.className || "—"}</p>
              </div>
              <div className="bg-cream-dark rounded-xl p-3">
                <p className="text-muted-foreground text-xs">Disciplina</p>
                <p className="font-bold text-navy">{report.discipline || "—"}</p>
              </div>
              <div className="bg-cream-dark rounded-xl p-3">
                <p className="text-muted-foreground text-xs">Participantes</p>
                <p className="font-bold text-navy">{report.totalParticipants}</p>
              </div>
              <div className="bg-cream-dark rounded-xl p-3">
                <p className="text-muted-foreground text-xs">Mensagens no Chat</p>
                <p className="font-bold text-navy">{report.chatSummary.totalMessages}</p>
              </div>
            </div>

            {report.chatSummary.sensitiveCount > 0 && (
              <PedagogicBox variant="sensitive" title="Atenção — Mensagens Sensíveis">
                Foram detetadas {report.chatSummary.sensitiveCount} mensagem(ns) com conteúdo potencialmente
                sensível. Revê-as na secção de moderação e considera acompanhamento individualizado.
              </PedagogicBox>
            )}

            <div>
              <h3 className="font-semibold text-navy mb-2">Sugestões para a Próxima Aula</h3>
              <ul className="space-y-2">
                {report.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-navy">
                    <span className="text-teal mt-0.5">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 flex-wrap">
            <button
              onClick={async () => {
                try {
                  toast.loading("A gerar PDF...", { id: "pdf" });
                  const res = await fetch(`/api/report/${sessionId}/pdf`);
                  if (!res.ok) throw new Error("Erro ao gerar PDF");
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  // Abrir numa nova aba para o browser mostrar o diálogo "Guardar Como"
                  const w = window.open(url, "_blank");
                  if (!w) {
                    // Fallback: se o popup foi bloqueado, descarregar diretamente
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `relatorio_${report.sessionCode}_${new Date().toISOString().slice(0, 10)}.pdf`;
                    a.click();
                  }
                  setTimeout(() => URL.revokeObjectURL(url), 10000);
                  toast.success("PDF pronto — guarde a partir do visualizador!", { id: "pdf" });
                } catch (e) {
                  toast.error("Erro ao gerar PDF", { id: "pdf" });
                }
              }}
              className="av-btn-primary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Exportar PDF
            </button>
            <button
              onClick={() => {
                const date = new Date().toLocaleDateString("pt-PT");
                const statsHtml = report.questionStats.map((qs, i) => {
                  const bars = qs.stats.map(s =>
                    `<div style="margin:4px 0;">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <span style="min-width:180px;font-size:13px;">${s.answer}</span>
                        <div style="flex:1;background:#e5e7eb;border-radius:4px;height:18px;">
                          <div style="width:${s.percentage}%;background:#0d9488;height:18px;border-radius:4px;"></div>
                        </div>
                        <span style="font-size:13px;font-weight:600;min-width:40px;">${s.percentage}%</span>
                      </div>
                    </div>`
                  ).join("");
                  return `<div style="margin-bottom:20px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
                    <p style="font-weight:600;margin:0 0 8px;">${i+1}. ${qs.question}</p>
                    ${bars || "<p style='color:#6b7280;font-size:13px;'>Sem respostas registadas.</p>"}
                  </div>`;
                }).join("");
                const chatHtml = report.chatSummary.highlightedMessages.length > 0
                  ? `<div style="margin-top:16px;"><h3 style="font-size:15px;">Mensagens Destacadas</h3>${report.chatSummary.highlightedMessages.map(m => `<p style="background:#f0fdfa;border-left:3px solid #0d9488;padding:8px 12px;margin:6px 0;font-size:13px;">${m}</p>`).join("")}</div>`
                  : "";
                const suggestionsHtml = report.suggestions.map(s => `<li style="margin:6px 0;font-size:13px;">${s}</li>`).join("");
                const html = `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8"><title>Relatório Pedagógico — ${report.quizTitle}</title>
                <style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#1e293b;padding:0 20px;}h1{color:#0d9488;}h2{color:#1e293b;font-size:17px;margin-top:24px;}table{width:100%;border-collapse:collapse;margin:12px 0;}td,th{padding:8px 12px;border:1px solid #e5e7eb;font-size:13px;}th{background:#f8f5f0;}.footer{margin-top:40px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px;}</style></head>
                <body>
                <h1>📋 Relatório Pedagógico — Aula Viva</h1>
                <table><tr><th>Quiz</th><td>${report.quizTitle}</td><th>Código</th><td>${report.sessionCode}</td></tr>
                <tr><th>Turma</th><td>${report.className || "—"}</td><th>Disciplina</th><td>${report.discipline || "—"}</td></tr>
                <tr><th>Obra Literária</th><td>${report.literaryWork || "—"}</td><th>Data</th><td>${date}</td></tr>
                <tr><th>Participantes</th><td>${report.totalParticipants}</td><th>Mensagens no Chat</th><td>${report.chatSummary.totalMessages}</td></tr></table>
                ${report.chatSummary.sensitiveCount > 0 ? `<p style="background:#fef3c7;border:1px solid #f59e0b;padding:10px;border-radius:6px;font-size:13px;">⚠️ Foram detetadas ${report.chatSummary.sensitiveCount} mensagem(ns) com conteúdo potencialmente sensível. Considera acompanhamento individualizado.</p>` : ""}
                <h2>Resultados por Pergunta</h2>${statsHtml}
                ${chatHtml}
                <h2>Sugestões para a Próxima Aula</h2><ul>${suggestionsHtml}</ul>
                <div class="footer">Gerado em ${date} · Aula Viva · Projeto PesqueirAmiga · Master HBM Research, LDA<br>Este relatório não contém dados que permitam identificar alunos individualmente.</div>
                </body></html>`;
                const blob = new Blob([html], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const win = window.open(url, "_blank");
                if (win) { win.onload = () => { win.print(); }; }
                toast.success("Relatório aberto para impressão/PDF!");
              }}
              className="bg-cream-dark text-navy font-semibold px-5 py-3 rounded-xl hover:bg-cream transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Exportar HTML
            </button>
              <button
                onClick={() => {
                  // Exportar Excel com dados da sessão
                  import("xlsx").then((XLSX) => {
                    const wb = XLSX.utils.book_new();

                    // Folha 1: Informações da Sessão
                    const infoData = [
                      ["Campo", "Valor"],
                      ["Quiz", report.quizTitle],
                      ["Código da Sessão", report.sessionCode],
                      ["Turma", report.className || "—"],
                      ["Disciplina", report.discipline || "—"],
                      ["Obra Literária", report.literaryWork || "—"],
                      ["Escola", report.school || "—"],
                      ["Nº Participantes", report.totalParticipants],
                      ["Taxa de Resposta", report.questionStats.length > 0
                        ? `${Math.round((report.questionStats[0].stats.reduce((a, s) => a + s.count, 0) / Math.max(report.totalParticipants, 1)) * 100)}%`
                        : "N/A"],
                      ["Mensagens no Chat", report.chatSummary.totalMessages],
                      ["Mensagens Sensíveis", report.chatSummary.sensitiveCount],
                      ["Data de Exportação", new Date().toLocaleDateString("pt-PT")],
                    ];
                    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
                    XLSX.utils.book_append_sheet(wb, wsInfo, "Sessão");

                    // Folha 2: Resultados por Pergunta
                    const resultsData: (string | number)[][] = [["Pergunta", "Resposta", "Votos", "Percentagem (%)", "Total Respostas"]];
                    report.questionStats.forEach((qs) => {
                      qs.stats.forEach((s, i) => {
                        resultsData.push([
                          i === 0 ? qs.question : "",
                          s.answer,
                          s.count,
                          s.percentage,
                          qs.stats.reduce((acc, s) => acc + s.count, 0),
                        ]);
                      });
                      if (qs.stats.length === 0) {
                        resultsData.push([qs.question, "Sem respostas", 0, 0, 0]);
                      }
                    });
                    const wsResults = XLSX.utils.aoa_to_sheet(resultsData);
                    XLSX.utils.book_append_sheet(wb, wsResults, "Resultados");

                    // Folha 3: Sugestões
                    const suggestionsData: string[][] = [["Sugestões para a Próxima Aula"]];
                    report.suggestions.forEach((s) => suggestionsData.push([s]));
                    const wsSuggestions = XLSX.utils.aoa_to_sheet(suggestionsData);
                    XLSX.utils.book_append_sheet(wb, wsSuggestions, "Sugestões");

                    XLSX.writeFile(wb, `relatorio_${report.sessionCode}_${new Date().toISOString().slice(0, 10)}.xlsx`);
                    toast.success("Excel descarregado!");
                  }).catch(() => toast.error("Erro ao gerar Excel"));
                }}
                className="bg-green-600 text-white font-semibold px-5 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Sheet className="w-4 h-4" /> Exportar Excel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
