import { trpc } from "@/lib/trpc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { Maximize2, Minimize2, Users, Clock } from "lucide-react";

const CHART_COLORS = [
  "oklch(52% 0.13 185)",
  "oklch(78% 0.14 80)",
  "oklch(38% 0.12 185)",
  "oklch(65% 0.14 80)",
  "oklch(60% 0.10 185)",
  "oklch(70% 0.12 300)",
];

const STATUS_LABELS: Record<string, string> = {
  waiting: "A aguardar alunos...",
  active: "Votação aberta",
  voting_closed: "Votação encerrada",
  chat_open: "Debate em curso",
  closed: "Sessão encerrada",
};

export default function ProjectionView() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const { data: session } = trpc.sessions.get.useQuery(
    { id: sessionId },
    { enabled: !!sessionId && !isNaN(sessionId), refetchInterval: 3000 }
  );

  const { data: quiz } = trpc.quizzes.get.useQuery(
    { id: session?.quizId ?? 0 },
    { enabled: !!session?.quizId }
  );

  const { data: questions } = trpc.questions.list.useQuery(
    undefined,
    { enabled: !!quiz }
  );

  const { data: stats, refetch: refetchStats } = trpc.votes.stats.useQuery(
    { sessionId, questionId: activeQuestionId ?? 0 },
    { enabled: !!activeQuestionId, refetchInterval: 2000 }
  );

  // Cronómetro
  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const sessionQuestions = quiz
    ? (JSON.parse(quiz.questionIds) as number[])
        .map((qid) => questions?.find((q) => q.id === qid))
        .filter(Boolean)
    : [];

  const activeQuestion = activeQuestionId
    ? sessionQuestions.find((q) => q?.id === activeQuestionId)
    : null;

  const chartData = stats?.map((s) => ({
    name: s.answer.length > 30 ? s.answer.slice(0, 30) + "…" : s.answer,
    fullName: s.answer,
    value: s.percentage,
    count: s.count,
  })) ?? [];

  const totalVotes = stats?.reduce((acc, s) => acc + s.count, 0) ?? 0;

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-teal rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{quiz?.title ?? "Aula Viva"}</h1>
            <p className="text-white/60 text-sm">{quiz?.literaryWork ? `📖 ${quiz.literaryWork}` : quiz?.discipline ?? ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Código de entrada */}
          <div className="text-center">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-0.5">Código de Entrada</p>
            <div className="bg-teal text-white font-mono font-bold text-2xl px-5 py-2 rounded-xl tracking-widest">
              {session?.code ?? "—"}
            </div>
          </div>
          {/* Participantes */}
          <div className="text-center">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-0.5">Participantes</p>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Users className="w-6 h-6 text-gold" />
              {session?.participantCount ?? 0}
            </div>
          </div>
          {/* Cronómetro */}
          <div className="text-center">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-0.5">Tempo</p>
            <div className="flex items-center gap-2 text-2xl font-bold font-mono">
              <Clock className="w-5 h-5 text-white/60" />
              {formatTime(elapsed)}
            </div>
          </div>
          {/* Estado */}
          <div className="text-center">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-0.5">Estado</p>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
              session?.status === "active" ? "bg-green-500/20 text-green-300" :
              session?.status === "chat_open" ? "bg-blue-500/20 text-blue-300" :
              session?.status === "waiting" ? "bg-yellow-500/20 text-yellow-300" :
              "bg-white/10 text-white/60"
            }`}>
              {STATUS_LABELS[session?.status ?? "waiting"]}
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title={isFullscreen ? "Sair do ecrã completo" : "Ecrã completo"}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-1 gap-0">
        {/* Painel esquerdo — lista de perguntas */}
        <div className="w-72 border-r border-white/10 p-4 overflow-y-auto">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Perguntas do Quiz</p>
          {sessionQuestions.length === 0 ? (
            <p className="text-white/40 text-sm">Nenhuma pergunta.</p>
          ) : (
            <div className="space-y-2">
              {sessionQuestions.map((q, i) => q && (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionId(q.id === activeQuestionId ? null : q.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all text-sm ${
                    activeQuestionId === q.id
                      ? "bg-teal text-white"
                      : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <span className="font-bold mr-2 text-white/40">{i + 1}.</span>
                  {q.text.length > 80 ? q.text.slice(0, 80) + "…" : q.text}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Área central — pergunta ativa e gráfico */}
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          {!activeQuestion ? (
            <div className="text-center">
              <div className="text-8xl mb-6">📊</div>
              <h2 className="text-3xl font-bold text-white/80 mb-3">Vista de Projeção</h2>
              <p className="text-white/50 text-lg max-w-md">
                Seleciona uma pergunta à esquerda para ver os resultados em tempo real.
              </p>
              <div className="mt-8 bg-white/5 rounded-2xl p-6 max-w-sm mx-auto">
                <p className="text-white/40 text-sm mb-2">Os alunos entram em</p>
                <p className="text-white font-mono text-lg font-bold">aulaviva.manus.space/join</p>
                <p className="text-white/40 text-sm mt-2">com o código</p>
                <p className="text-teal font-mono text-3xl font-bold tracking-widest mt-1">{session?.code ?? "—"}</p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl">
              {/* Pergunta */}
              <div className="bg-white/5 rounded-2xl p-8 mb-8 text-center">
                <p className="text-white/50 text-sm uppercase tracking-widest mb-3">Pergunta</p>
                <h2 className="text-3xl font-bold text-white leading-tight">{activeQuestion.text}</h2>
              </div>

              {/* Gráfico */}
              {chartData.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-white/50 text-sm uppercase tracking-widest">Resultados</p>
                    <span className="text-white/60 text-sm">{totalVotes} resposta{totalVotes !== 1 ? "s" : ""}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData} margin={{ top: 0, right: 20, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 13 }}
                        angle={-20}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                        tickFormatter={(v) => `${v}%`}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        formatter={(value: number, _: string, props: any) => [
                          `${value}% (${props.payload?.count} votos)`,
                          props.payload?.fullName ?? "",
                        ]}
                        contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, color: "#fff" }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={80}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">⏳</div>
                  <p className="text-white/50 text-xl">A aguardar respostas...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rodapé */}
      <div className="px-8 py-3 border-t border-white/10 flex items-center justify-between">
        <p className="text-white/30 text-xs">Aula Viva · Projeto PesqueirAmiga · Master HBM Research, LDA</p>
        <p className="text-white/30 text-xs">Entra em <span className="text-white/50 font-mono">aulaviva.manus.space/join</span> com o código <span className="text-teal font-mono font-bold">{session?.code ?? "—"}</span></p>
      </div>
    </div>
  );
}
