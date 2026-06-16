import { useAuth } from "@/_core/hooks/useAuth";
import PedagogicBox from "@/components/PedagogicBox";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Play, Square, MessageCircle, PauseCircle, PlayCircle,
  Eye, EyeOff, Flag, Star, BarChart3, FileText, Copy, Users
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
  const { isAuthenticated } = useAuth();
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [reportVisible, setReportVisible] = useState(false);

  const { data: session, refetch: refetchSession } = trpc.sessions.get.useQuery(
    { id: sessionId },
    { enabled: isAuthenticated, refetchInterval: 5000 }
  );

  const { data: quiz } = trpc.quizzes.get.useQuery(
    { id: session?.quizId ?? 0 },
    { enabled: !!session }
  );

  const { data: questions } = trpc.questions.list.useQuery(undefined, { enabled: !!quiz });

  const { data: chatMessages, refetch: refetchChat } = trpc.chat.allMessages.useQuery(
    { sessionId },
    { enabled: isAuthenticated, refetchInterval: 3000 }
  );

  const { data: report } = trpc.report.generate.useQuery(
    { sessionId },
    { enabled: reportVisible && isAuthenticated }
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

  if (!session) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const status = session.status as SessionStatus;

  return (
    <div className="av-section animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-muted-foreground hover:text-navy transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="av-section-title">Gerir Sessão</h1>
          <p className="av-section-subtitle">{quiz?.title ?? "Carregando..."}</p>
        </div>
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
            <button
              onClick={() => updateStatus.mutate({ id: sessionId, status: "voting_closed" })}
              className="bg-amber-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-2"
            >
              <Square className="w-4 h-4" /> Encerrar Votação
            </button>
          )}
          {status === "voting_closed" && (
            <button
              onClick={() => updateStatus.mutate({ id: sessionId, status: "chat_open", chatEnabled: true })}
              className="av-btn-primary flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" /> Abrir Chat para Debate
            </button>
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
        {activeQuestionId && stats && stats.length > 0 ? (
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
        )}
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

            <button
              onClick={() => {
                const content = JSON.stringify(report, null, 2);
                const blob = new Blob([content], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `relatorio_${report.sessionCode}_${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Relatório exportado!");
              }}
              className="av-btn-secondary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Exportar Relatório
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
