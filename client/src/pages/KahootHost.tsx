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
  MessageCircle,
  Send,
  PauseCircle,
  PlayCircle,
  Star,
  Flag,
  Eye,
  EyeOff,
  BookOpen,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

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
  const [chatPromptInput, setChatPromptInput] = useState("");
  const [promptSent, setPromptSent] = useState(false);

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

  // Mensagens do chat ao vivo (apenas quando o chat está ativo)
  const { data: liveChatMessages, isLoading: loadingChat, isError: chatError, refetch: refetchLiveChat } = trpc.chat.allMessages.useQuery(
    { sessionId },
    { enabled: validId && isAuthenticated && !!kahootState?.chatEnabled, refetchInterval: 2000 }
  );

  const moderateMsg = trpc.chat.moderate.useMutation({
    onSuccess: () => refetchLiveChat(),
    onError: (e) => toast.error(e.message),
  });

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

  const setChatPrompt = trpc.sessions.setChatPrompt.useMutation({
    onSuccess: () => {
      toast.success("Pergunta de debate enviada para os alunos!");
      setPromptSent(true);
    },
    onError: (e) => toast.error(e.message),
  });

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
      // Se a pergunta está marcada como "apenas no relatório", avançar automaticamente
      const hiddenIds: number[] = quiz?.hiddenResultsQuestionIds
        ? JSON.parse((quiz as any).hiddenResultsQuestionIds)
        : [];
      const currentQId = quiz ? (JSON.parse(quiz.questionIds) as number[])[kahootState.activeQuestionIndex] : null;
      if (currentQId && hiddenIds.includes(currentQId)) {
        // Avançar automaticamente sem mostrar resultados
        const next = kahootState.activeQuestionIndex + 1;
        const total = quiz ? (JSON.parse(quiz.questionIds) as number[]).length : 0;
        if (next >= total) {
          setPhase("leaderboard");
          updateSession.mutate({ id: sessionId, status: "closed" });
        } else {
          handleLaunchQuestion(next);
        }
      } else {
        setPhase("results");
        setShowingResults(true);
      }
    }
  }, [kahootState]);

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

  // Temporizador local (complementa o polling) — avança automaticamente quando o tempo acaba
  useEffect(() => {
    if (phase !== "question") return;
    if (timeLeft <= 0) {
      handleCloseQuestion();
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, handleCloseQuestion]);

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
              <div className="flex justify-center mt-4">
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG value={`${window.location.origin}/join?code=${session.code}`} size={140} level="M" />
                </div>
              </div>
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
              <ArrowRight className="w-4 h-4" /> {currentQIndex + 1 >= totalQuestions ? "Terminar Sessão" : `Próxima Pergunta (${currentQIndex + 2}/${totalQuestions})`}
            </button>
          </div>
        )}

        {/* ── RESULTADOS DA PERGUNTA ── */}
        {phase === "results" && activeQuestion && qStats && (
          <div className="w-full max-w-4xl flex flex-col gap-4">
            {/* Cabeçalho */}
            <div className="text-center">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Pergunta {currentQIndex + 1} / {totalQuestions}</p>
              <h2 className="text-2xl font-display font-bold leading-snug">{activeQuestion.text.replace(/\?+$/, '')}</h2>
            </div>

            {/* Respostas abertas */}
            {activeQuestion.type === "open" && openAnswers && openAnswers.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {openAnswers.map((ans, i) => (
                  <div key={i} className="bg-white/10 rounded-xl px-4 py-4 text-white/90 text-sm italic">
                    “{ans}”
                  </div>
                ))}
              </div>
            )}

            {/* Barras de resultados — só mostra se não for "apenas no relatório" */}
            {(activeQuestion.type === "scale" || activeQuestion.options) && activeQuestion.type !== "open" &&
              !(() => {
                const hiddenIds: number[] = quiz?.hiddenResultsQuestionIds
                  ? JSON.parse((quiz as any).hiddenResultsQuestionIds)
                  : [];
                return activeQId ? hiddenIds.includes(activeQId) : false;
              })() && (
              <div className="space-y-4">
                {(activeQuestion.type === "scale"
                  ? SCALE_OPTIONS
                  : (JSON.parse(activeQuestion.options!) as string[])
                ).map((opt, i) => {
                  const count = qStats.byOption[String(i)] ?? 0;
                  const pct = qStats.total > 0 ? Math.round((count / qStats.total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <span className={`w-10 h-10 rounded-xl flex-shrink-0 ${OPTION_COLORS[i % OPTION_COLORS.length].bg}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-base font-semibold text-white">{opt}</span>
                          <span className="text-base font-black text-gold">{count} <span className="text-white/60 font-normal text-sm">({pct}%)</span></span>
                        </div>
                        <div className="h-5 bg-white/10 rounded-full overflow-hidden">
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

            {/* Rodapé com total e botão */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-3 flex-shrink-0">
                <BarChart2 className="w-5 h-5 text-teal" />
                <span className="font-semibold text-sm">{qStats.total} respostas</span>
              </div>
              <button
                onClick={handleNextQuestion}
                className="flex-1 bg-teal hover:bg-teal-dark text-white font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
              >
                {currentQIndex + 1 >= totalQuestions ? (
                  <><Trophy className="w-5 h-5" /> Terminar Sessão</>
                ) : (
                  <><ArrowRight className="w-5 h-5" /> Próxima Questão ({currentQIndex + 2}/{totalQuestions})</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── SESSÃO TERMINADA ── */}
        {phase === "leaderboard" && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🎓</div>
              <h2 className="text-3xl font-display font-black mb-2">Sessão Concluída!</h2>
              <p className="text-white/60">
                Todas as questões foram respondidas. As opiniões da turma estão disponíveis no relatório.
              </p>
            </div>

            <div className="bg-white/10 rounded-2xl p-5 mb-5 space-y-3">
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

            {/* Painel de Debate — controlo do chat pós-jogo */}
            <div className="bg-white/10 rounded-2xl p-5 mb-5">
              <h3 className="font-display font-bold text-white text-base mb-1 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-teal" /> Debate da Turma
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Ativa o chat para os alunos debaterem. Podes enviar uma pergunta orientadora antes de abrir.
              </p>

              {/* Prompt de debate */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">Escolhe uma pergunta do quiz para debate:</p>
                <div className="space-y-1.5 mb-3">
                  {(() => {
                    if (!quiz || !allQuestions) return (
                      <p className="text-white/40 text-xs">A carregar perguntas...</p>
                    );
                    const qIds: number[] = JSON.parse(quiz.questionIds);
                    const quizQuestions = qIds
                      .map((id) => allQuestions.find((q) => q.id === id))
                      .filter(Boolean) as typeof allQuestions;
                    if (quizQuestions.length === 0) return (
                      <p className="text-white/40 text-xs">Nenhuma pergunta encontrada.</p>
                    );
                    return quizQuestions.map((q, i) => (
                      <button
                        key={q.id}
                        onClick={() => { setChatPromptInput(q.text); setPromptSent(false); }}
                        className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-colors flex items-start gap-2 ${
                          chatPromptInput === q.text
                            ? "bg-teal/30 border border-teal/60 text-white"
                            : "bg-white/10 text-white/80 hover:bg-white/20 border border-transparent"
                        }`}
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 text-white/60 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        <span className="leading-snug">{q.text}</span>
                      </button>
                    ));
                  })()}
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                    placeholder="Escreve ou escolhe uma pergunta..."
                    value={chatPromptInput}
                    onChange={(e) => { setChatPromptInput(e.target.value); setPromptSent(false); }}
                    maxLength={300}
                  />
                  <button
                    onClick={() => {
                      if (!chatPromptInput.trim()) return;
                      setChatPrompt.mutate({ id: sessionId, chatPrompt: chatPromptInput.trim() });
                    }}
                    disabled={!chatPromptInput.trim() || setChatPrompt.isPending}
                    className="bg-gold text-navy font-bold px-4 py-2.5 rounded-xl hover:bg-gold/80 disabled:opacity-40 transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    {promptSent ? "✓" : "Enviar"}
                  </button>
                </div>
              </div>

              {/* Botões de controlo do chat */}
              <div className="flex flex-wrap gap-3">
                {!kahootState?.chatEnabled ? (
                  <button
                    onClick={() => updateSession.mutate({ id: sessionId, status: "closed", chatEnabled: true })}
                    className="bg-teal hover:bg-teal-dark text-white font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Abrir Debate
                  </button>
                ) : (
                  <button
                    onClick={() => updateSession.mutate({ id: sessionId, status: "closed", chatPaused: !kahootState?.chatPaused })}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2"
                  >
                    {kahootState?.chatPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                    {kahootState?.chatPaused ? "Retomar Chat" : "Pausar Chat"}
                  </button>
                )}
                {kahootState?.chatEnabled && (
                  <div className="flex items-center gap-2 text-teal text-sm font-semibold">
                    <div className="w-2 h-2 bg-teal rounded-full animate-pulse" />
                    Chat ativo
                    {liveChatMessages && liveChatMessages.length > 0 && (
                      <span className="ml-1 bg-teal/30 text-teal-light text-xs font-bold px-2 py-0.5 rounded-full">
                        {liveChatMessages.length}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Mensagens ao vivo */}
              {kahootState?.chatEnabled && (
                <div className="mt-4">
                  {/* Pergunta orientadora ativa */}
                  {kahootState.chatPrompt && (
                    <div className="bg-gold/20 border border-gold/40 rounded-xl px-3 py-2.5 mb-3 flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gold uppercase tracking-wide mb-0.5">Pergunta de debate enviada aos alunos</p>
                        <p className="text-sm text-white/90 leading-snug">{kahootState.chatPrompt}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-2">
                    Respostas dos alunos ao debate ({liveChatMessages?.length ?? 0}):
                  </p>
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {loadingChat ? (
                      <p className="text-white/40 text-sm text-center py-4">A carregar mensagens...</p>
                    ) : chatError ? (
                      <p className="text-red-400 text-sm text-center py-4">Erro ao carregar mensagens. Tenta atualizar a página.</p>
                    ) : !liveChatMessages || liveChatMessages.length === 0 ? (
                      <p className="text-white/40 text-sm text-center py-4">
                        Nenhuma mensagem ainda. Os alunos podem escrever agora.
                      </p>
                    ) : (
                      [...liveChatMessages].reverse().map((msg) => (
                        <div
                          key={msg.id}
                          className={`rounded-xl px-3 py-2.5 flex items-start gap-2.5 ${
                            msg.isSensitive
                              ? "bg-red-900/60 border border-red-500/50"
                              : msg.isHighlighted
                                ? "bg-gold/20 border border-gold/40"
                                : msg.isHidden
                                  ? "bg-white/5 opacity-40"
                                  : "bg-white/10"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            {msg.isSensitive && (
                              <span className="text-xs font-bold text-red-400 block mb-0.5">⚠️ Sensível</span>
                            )}
                            <p className="text-sm text-white leading-snug break-words">{msg.content}</p>
                            <p className="text-xs text-white/40 mt-0.5">
                              {new Date(msg.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                            </p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => moderateMsg.mutate({ messageId: msg.id, action: "highlight", sessionId })}
                              disabled={moderateMsg.isPending}
                              title="Destacar"
                              className="p-1.5 text-amber-400 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moderateMsg.mutate({ messageId: msg.id, action: "flag_sensitive", sessionId })}
                              disabled={moderateMsg.isPending}
                              title="Sinalizar sensível"
                              className="p-1.5 text-red-400 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moderateMsg.mutate({ messageId: msg.id, action: "hide", sessionId })}
                              disabled={moderateMsg.isPending}
                              title="Ocultar"
                              className="p-1.5 text-white/40 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-40"
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
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3 rounded-xl transition-all"
            >
              Voltar ao Painel
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
