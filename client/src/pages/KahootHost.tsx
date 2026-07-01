import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ChevronRight,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Trophy,
  Play,
  StopCircle,
  BarChart2,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";

const SCALE_OPTIONS = [
  "Concordo totalmente",
  "Concordo parcialmente",
  "Discordo parcialmente",
  "Discordo totalmente",
];

const OPTION_COLORS = [
  { bg: "bg-[#e21b3c]" },
  { bg: "bg-[#1368ce]" },
  { bg: "bg-[#d89e00]" },
  { bg: "bg-[#26890c]" },
  { bg: "bg-[#7c3aed]" },
  { bg: "bg-[#0891b2]" },
];

export default function KahootHost() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const [phase, setPhase] = useState<"lobby" | "question" | "results" | "leaderboard">("lobby");
  const [currentQIndex, setCurrentQIndex] = useState(-1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [duration, setDuration] = useState(20);
  const [showingResults, setShowingResults] = useState(false);

  const validId = !isNaN(sessionId) && sessionId > 0;

  // Dados da sessão e quiz
  const { data: session } = trpc.sessions.get.useQuery(
    { id: sessionId },
    { enabled: validId && isAuthenticated, refetchInterval: 2000 }
  );
  const { data: quiz } = trpc.quizzes.get.useQuery(
    { id: session?.quizId ?? 0 },
    { enabled: !!session?.quizId && isAuthenticated }
  );
  const { data: allQuestions } = trpc.questions.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Estado Kahoot via polling
  const { data: kahootState, refetch: refetchState } = trpc.kahoot.state.useQuery(
    { sessionId },
    { enabled: validId, refetchInterval: 1000 }
  );

  // Estatísticas da pergunta atual
  const activeQId = quiz && allQuestions && currentQIndex >= 0
    ? (JSON.parse(quiz.questionIds) as number[])[currentQIndex]
    : null;
  const activeQuestion = allQuestions?.find((q) => q.id === activeQId);

  const { data: qStats, refetch: refetchStats } = trpc.kahoot.questionStats.useQuery(
    { sessionId, questionId: activeQId ?? 0 },
    { enabled: !!activeQId && showingResults }
  );

  // Respostas abertas da pergunta atual
  const { data: openAnswers } = trpc.kahoot.openAnswers.useQuery(
    { sessionId, questionId: activeQId ?? 0 },
    { enabled: !!activeQId && showingResults && activeQuestion?.type === "open" }
  );

  // Placar final
  const { data: leaderboard } = trpc.kahoot.leaderboard.useQuery(
    { sessionId },
    { enabled: phase === "leaderboard" }
  );

  // Mutations
  const nextQuestion = trpc.kahoot.nextQuestion.useMutation({
    onSuccess: () => refetchState(),
    onError: (e) => toast.error(e.message),
  });
  const closeQuestion = trpc.kahoot.closeQuestion.useMutation({
    onSuccess: () => { refetchState(); refetchStats(); },
    onError: (e) => toast.error(e.message),
  });
  const updateSession = trpc.sessions.updateStatus.useMutation();

  // Sincronizar fase com estado do servidor
  useEffect(() => {
    if (!kahootState) return;
    if (kahootState.activeQuestionIndex >= 0) {
      setCurrentQIndex(kahootState.activeQuestionIndex);
    }
    if (kahootState.status === "active") {
      setPhase("question");
      setShowingResults(false);
      setTimeLeft(kahootState.timeRemaining);
    } else if (kahootState.status === "voting_closed" && phase === "question") {
      setPhase("results");
      setShowingResults(true);
    }
  }, [kahootState]);

  // Temporizador local (complementa o polling)
  useEffect(() => {
    if (phase !== "question") return;
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const questionIds: number[] = quiz ? JSON.parse(quiz.questionIds) : [];
  const totalQuestions = questionIds.length;

  const handleLaunchQuestion = useCallback(
    (index: number) => {
      setCurrentQIndex(index);
      setPhase("question");
      setShowingResults(false);
      setTimeLeft(duration);
      nextQuestion.mutate({ sessionId, questionIndex: index, durationSeconds: duration });
    },
    [sessionId, duration, nextQuestion]
  );

  const handleCloseQuestion = useCallback(() => {
    closeQuestion.mutate({ sessionId });
    setPhase("results");
    setShowingResults(true);
  }, [sessionId, closeQuestion]);

  const handleNextQuestion = useCallback(() => {
    const next = currentQIndex + 1;
    if (next >= totalQuestions) {
      setPhase("leaderboard");
      updateSession.mutate({ id: sessionId, status: "closed" });
    } else {
      handleLaunchQuestion(next);
    }
  }, [currentQIndex, totalQuestions, handleLaunchQuestion, sessionId, updateSession]);

  const handleStartGame = () => {
      updateSession.mutate({ id: sessionId, status: "active" });
    handleLaunchQuestion(0);
  };

  if (!session || !quiz) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const progressPct = totalQuestions > 0 ? ((currentQIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <div className="min-h-screen bg-navy text-white flex flex-col">
      {/* Barra superior */}
      <header className="bg-navy-light border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-display font-black text-gold">Aula</span>
          <span className="text-2xl font-display font-black text-teal">Viva</span>
          <span className="ml-2 px-3 py-1 bg-teal/20 text-teal text-sm rounded-full font-semibold">
            MODO JOGO
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-white/70">
            <Users className="w-4 h-4" /> {kahootState?.participantCount ?? session.participantCount} jogadores
          </span>
          <span className="bg-gold text-navy font-bold px-3 py-1 rounded-lg text-base tracking-widest">
            {session.code}
          </span>
        </div>
      </header>

      {/* Barra de progresso */}
      {phase !== "lobby" && (
        <div className="h-1.5 bg-white/10">
          <div
            className="h-full bg-teal transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">

        {/* ── LOBBY ── */}
        {phase === "lobby" && (
          <div className="text-center max-w-lg">
            <div className="text-6xl mb-4">🎮</div>
            <h1 className="text-3xl font-display font-black mb-2">{quiz.title}</h1>
            {quiz.literaryWork && (
              <p className="text-white/60 mb-6">📖 {quiz.literaryWork}</p>
            )}
            <div className="bg-white/10 rounded-2xl p-6 mb-6">
              <p className="text-white/70 text-sm mb-1">Código de entrada</p>
              <p className="text-5xl font-black tracking-widest text-gold">{session.code}</p>
              <p className="text-white/50 text-xs mt-2">Os alunos entram em <strong>aulaviva.manus.space/join</strong></p>
            </div>
            <div className="flex items-center justify-center gap-2 mb-6 text-white/60">
              <Users className="w-5 h-5" />
              <span>{kahootState?.participantCount ?? session.participantCount} jogador(es) na sala</span>
            </div>
            <div className="flex items-center gap-3 justify-center mb-6">
              <label className="text-white/70 text-sm">Tempo por pergunta:</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm"
              >
                {[10, 15, 20, 30, 45, 60].map((s) => (
                  <option key={s} value={s}>{s} segundos</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleStartGame}
              className="bg-teal hover:bg-teal-dark text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 mx-auto"
            >
              <Play className="w-5 h-5" /> Iniciar Jogo
            </button>
            <p className="text-white/40 text-xs mt-4">{totalQuestions} perguntas</p>
          </div>
        )}

        {/* ── PERGUNTA ATIVA ── */}
        {phase === "question" && activeQuestion && (
          <div className="w-full max-w-3xl">
            {/* Cabeçalho da pergunta */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/60 text-sm">
                Pergunta {currentQIndex + 1} / {totalQuestions}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-teal" />
                  {kahootState?.answersForActive ?? 0} respostas
                </span>
              </div>
            </div>

            {/* Temporizador circular */}
            <div className="flex justify-center mb-6">
              <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center font-black text-3xl transition-colors ${
                timeLeft > 10 ? "border-teal text-teal" : "border-red-400 text-red-400"
              }`}>
                {timeLeft}
              </div>
            </div>

            {/* Texto da pergunta */}
            <div className="bg-white/10 rounded-2xl p-6 mb-6 text-center">
              <p className="text-xl font-display font-bold">{activeQuestion.text.replace(/\?+$/, '')}</p>
            </div>

            {/* Opções de resposta */}
            {(activeQuestion.type === "scale" || activeQuestion.options) && activeQuestion.type !== "open" && (() => {
              const opts = activeQuestion.type === "scale"
                ? SCALE_OPTIONS
                : (JSON.parse(activeQuestion.options!) as string[]);
              return (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {opts.map((opt, i) => (
                    <div
                      key={i}
                      className={`${OPTION_COLORS[i % OPTION_COLORS.length].bg} rounded-xl p-4 flex items-center gap-3`}
                    >
                      <span className="font-semibold text-sm text-white">{opt}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            <button
              onClick={handleCloseQuestion}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <StopCircle className="w-4 h-4" /> Encerrar Pergunta
            </button>
          </div>
        )}

        {/* ── RESULTADOS DA PERGUNTA ── */}
        {phase === "results" && activeQuestion && qStats && (
          <div className="w-full max-w-3xl">
            <div className="text-center mb-6">
              <h2 className="text-xl font-display font-bold mb-1">Distribuição de Opiniões</h2>
              <p className="text-white/60 text-sm">{activeQuestion.text.replace(/\?+$/, '')}</p>
            </div>

            {/* Respostas abertas */}
            {activeQuestion.type === "open" && openAnswers && openAnswers.length > 0 && (
              <div className="space-y-2 mb-6">
                {openAnswers.map((ans, i) => (
                  <div key={i} className="bg-white/10 rounded-xl px-4 py-3 text-white/90 text-sm italic">
                    "{ans}"
                  </div>
                ))}
              </div>
            )}

            {/* Gráfico de barras — só mostra se não estiver marcado como "apenas no relatório" */}
            {(activeQuestion.type === "scale" || activeQuestion.options) && activeQuestion.type !== "open" &&
              !(() => {
                const hiddenIds: number[] = quiz?.hiddenResultsQuestionIds
                  ? JSON.parse((quiz as any).hiddenResultsQuestionIds)
                  : [];
                return activeQId ? hiddenIds.includes(activeQId) : false;
              })() && (
              <div className="space-y-3 mb-6">
                {(activeQuestion.type === "scale"
                  ? SCALE_OPTIONS
                  : (JSON.parse(activeQuestion.options!) as string[])
                ).map((opt, i) => {
                  const count = qStats.byOption[String(i)] ?? 0;
                  const pct = qStats.total > 0 ? Math.round((count / qStats.total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex-shrink-0 ${OPTION_COLORS[i % OPTION_COLORS.length].bg}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white/80">{opt}</span>
                          <span className="text-sm font-bold">{count} ({pct}%)</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${OPTION_COLORS[i % OPTION_COLORS.length].bg}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between bg-white/10 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-teal">
                <BarChart2 className="w-5 h-5" />
                <span className="font-semibold">{qStats.total} respostas recebidas</span>
              </div>
            </div>

            <button
              onClick={handleNextQuestion}
              className="w-full bg-teal hover:bg-teal-dark text-white font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
            >
              {currentQIndex + 1 >= totalQuestions ? (
                <><Trophy className="w-5 h-5" /> Terminar Sessão</>
              ) : (
                <><ArrowRight className="w-5 h-5" /> Próxima Questão ({currentQIndex + 2}/{totalQuestions})</>
              )}
            </button>
          </div>
        )}

        {/* ── SESSÃO TERMINADA ── */}
        {phase === "leaderboard" && (
          <div className="w-full max-w-lg text-center">
            <div className="text-5xl mb-4">🎓</div>
            <h2 className="text-3xl font-display font-black mb-2">Sessão Concluída!</h2>
            <p className="text-white/60 mb-8">
              Todas as questões foram respondidas. As opiniões da turma estão disponíveis no relatório.
            </p>

            <div className="bg-white/10 rounded-2xl p-6 mb-8 text-left space-y-3">
              <p className="text-white/80 text-sm font-semibold uppercase tracking-wide mb-2">Resumo da sessão</p>
              {leaderboard && (
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Participantes anónimos</span>
                  <span className="font-bold text-teal">{leaderboard.length}</span>
                </div>
              )}
              {leaderboard && (
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Total de respostas</span>
                  <span className="font-bold text-teal">{leaderboard.reduce((s, e) => s + e.total, 0)}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="bg-teal hover:bg-teal-dark text-white font-bold px-8 py-3 rounded-xl transition-all"
            >
              Voltar ao Painel
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
