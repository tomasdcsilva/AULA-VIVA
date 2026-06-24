import { trpc } from "@/lib/trpc";
import { CheckCircle, Clock, Trophy, Users } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

const OPTION_COLORS = [
  { bg: "bg-[#e21b3c] hover:bg-[#c01532] active:bg-[#a01228]", icon: "▲", label: "A" },
  { bg: "bg-[#1368ce] hover:bg-[#0f55b0] active:bg-[#0c4490]", icon: "◆", label: "B" },
  { bg: "bg-[#d89e00] hover:bg-[#b88500] active:bg-[#9a6f00]", icon: "●", label: "C" },
  { bg: "bg-[#26890c] hover:bg-[#1e6e09] active:bg-[#175607]", icon: "■", label: "D" },
  { bg: "bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6]", icon: "★", label: "E" },
  { bg: "bg-[#0891b2] hover:bg-[#0e7490] active:bg-[#155e75]", icon: "♦", label: "F" },
];

type GamePhase = "waiting" | "question" | "answered" | "results" | "leaderboard" | "finished";

export default function KahootPlayer() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);

  // Token anónimo persistente nesta sessão
  const anonToken = useRef(
    sessionStorage.getItem(`kahoot_token_${sessionId}`) ??
    (() => {
      const t = `anon_${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(`kahoot_token_${sessionId}`, t);
      return t;
    })()
  );

  const [phase, setPhase] = useState<GamePhase>("waiting");
  const [lastQIndex, setLastQIndex] = useState(-1);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [showResultsFor, setShowResultsFor] = useState<number | null>(null);

  const validId = !isNaN(sessionId) && sessionId > 0;

  // Polling do estado da sessão
  const { data: kahootState } = trpc.kahoot.state.useQuery(
    { sessionId },
    { enabled: validId, refetchInterval: 1000 }
  );

  // Obter a pergunta ativa via estado
  const activeQIndex = kahootState?.activeQuestionIndex ?? -1;

  // Estatísticas da pergunta (quando encerrada)
  const { data: qStats } = trpc.kahoot.questionStats.useQuery(
    { sessionId, questionId: showResultsFor ?? 0 },
    { enabled: !!showResultsFor && phase === "results" }
  );

  // Placar final
  const { data: leaderboard } = trpc.kahoot.leaderboard.useQuery(
    { sessionId },
    { enabled: phase === "leaderboard" || phase === "finished" }
  );

  // Mutation para submeter resposta
  const submitAnswer = trpc.kahoot.answer.useMutation({
    onError: (e) => {
      if (!e.message.includes("Já respondeste")) toast.error(e.message);
    },
  });

  // Sincronizar fase com estado do servidor
  useEffect(() => {
    if (!kahootState) return;

    const { status, activeQuestionIndex, timeRemaining } = kahootState;

    if (status === "waiting") {
      setPhase("waiting");
      return;
    }

    if (status === "closed") {
      setPhase("finished");
      return;
    }

    if (status === "active") {
      if (activeQuestionIndex !== lastQIndex) {
        // Nova pergunta
        setLastQIndex(activeQuestionIndex);
        setMyAnswer(null);
        setWasCorrect(null);
        setPhase("question");
        setTimeLeft(timeRemaining);
      } else if (phase === "question") {
        setTimeLeft(timeRemaining);
      }
    }

    if (status === "voting_closed") {
      if (phase === "question" || phase === "answered") {
        setShowResultsFor(null); // será definido quando tivermos o questionId
        setPhase("results");
      }
    }
  }, [kahootState]);

  // Temporizador local
  useEffect(() => {
    if (phase !== "question") return;
    if (timeLeft <= 0) {
      setPhase("answered"); // tempo esgotado sem responder
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const handleAnswer = (optionIndex: number) => {
    if (phase !== "question" || myAnswer !== null) return;
    const answer = String(optionIndex);
    setMyAnswer(answer);
    setPhase("answered");
    submitAnswer.mutate({
      sessionId,
      anonToken: anonToken.current,
      answer,
    });
  };

  const timePct = kahootState ? (timeLeft / (kahootState.questionDuration || 20)) * 100 : 100;
  const activeQuestion = kahootState?.activeQuestion;

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-4">

      {/* ── A AGUARDAR ── */}
      {phase === "waiting" && (
        <div className="text-center text-white">
          <div className="text-6xl mb-6 animate-bounce">🎮</div>
          <h1 className="text-3xl font-display font-black text-gold mb-2">Aula Viva</h1>
          <p className="text-white/60 mb-8">Modo Jogo</p>
          <div className="bg-white/10 rounded-2xl p-8 mb-6">
            <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/80 font-semibold">A aguardar que o professor inicie o jogo...</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
            <Users className="w-4 h-4" />
            <span>{kahootState?.participantCount ?? 0} jogadores na sala</span>
          </div>
        </div>
      )}

      {/* ── PERGUNTA ── */}
      {phase === "question" && (
        <div className="w-full max-w-md">
          {/* Temporizador */}
          <div className="flex justify-center mb-4">
            <div className={`relative w-20 h-20 flex items-center justify-center`}>
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke={timeLeft <= 5 ? "#e21b3c" : "#2ec4b6"}
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - timePct / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <span className={`font-black text-2xl z-10 ${timeLeft <= 5 ? "text-red-400" : "text-white"}`}>
                {timeLeft}
              </span>
            </div>
          </div>

          <p className="text-white/50 text-center text-sm mb-2">
            Pergunta {(kahootState?.activeQuestionIndex ?? 0) + 1}
          </p>

          {/* Texto da pergunta */}
          {activeQuestion && (
            <div className="bg-white/10 rounded-2xl p-4 mb-4 text-center">
              <p className="text-white font-semibold text-base">{activeQuestion.text}</p>
            </div>
          )}

          {/* Botões de resposta */}
          <div className="grid grid-cols-2 gap-3">
            {(activeQuestion?.options ?? ["A", "B", "C", "D"]).map((opt, i) => {
              const color = OPTION_COLORS[i % OPTION_COLORS.length];
              return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`${color.bg} text-white rounded-2xl p-4 flex flex-col items-center justify-center gap-1 font-bold transition-all active:scale-95 shadow-lg min-h-[90px]`}
              >
                <span className="text-2xl">{color.icon}</span>
                <span className="text-xs text-center leading-tight">{typeof opt === "string" ? opt : color.label}</span>
              </button>
            );
            })}
          </div>
        </div>
      )}

      {/* ── RESPONDIDO (a aguardar resultado) ── */}
      {phase === "answered" && (
        <div className="text-center text-white">
          <div className="text-6xl mb-6">⏳</div>
          <h2 className="text-2xl font-display font-bold mb-2">Resposta enviada!</h2>
          <p className="text-white/60">A aguardar que o professor encerre a pergunta...</p>
          {myAnswer !== null && (
            <div className={`mt-6 w-20 h-20 rounded-2xl ${OPTION_COLORS[Number(myAnswer) % OPTION_COLORS.length].bg} flex items-center justify-center mx-auto`}>
              <span className="text-3xl font-black">{OPTION_COLORS[Number(myAnswer) % OPTION_COLORS.length].label}</span>
            </div>
          )}
        </div>
      )}

      {/* ── RESULTADOS DA PERGUNTA ── */}
      {phase === "results" && (
        <div className="text-center text-white w-full max-w-sm">
          {wasCorrect === true && (
            <div className="mb-6">
              <div className="text-6xl mb-3">🎉</div>
              <h2 className="text-2xl font-display font-black text-green-400">Correto!</h2>
            </div>
          )}
          {wasCorrect === false && (
            <div className="mb-6">
              <div className="text-6xl mb-3">😕</div>
              <h2 className="text-2xl font-display font-black text-red-400">Incorreto</h2>
            </div>
          )}
          {wasCorrect === null && myAnswer !== null && (
            <div className="mb-6">
              <div className="text-6xl mb-3">✅</div>
              <h2 className="text-2xl font-display font-bold">Respondeste!</h2>
            </div>
          )}
          {myAnswer === null && (
            <div className="mb-6">
              <div className="text-6xl mb-3">⌛</div>
              <h2 className="text-2xl font-display font-bold text-white/60">Tempo esgotado</h2>
            </div>
          )}
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-white/50 text-sm">A aguardar próxima pergunta...</p>
          </div>
        </div>
      )}

      {/* ── JOGO TERMINADO / PLACAR ── */}
      {(phase === "finished" || phase === "leaderboard") && leaderboard && (
        <div className="text-center text-white w-full max-w-sm">
          <div className="text-5xl mb-4">🏆</div>
          <h2 className="text-2xl font-display font-black mb-1">Jogo Terminado!</h2>
          <p className="text-white/50 text-sm mb-6">Placar anónimo da turma</p>

          <div className="space-y-2 mb-6">
            {leaderboard.slice(0, 10).map((entry, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl p-3 ${
                    i === 0 ? "bg-gold/20 border border-gold/30" :
                    i === 1 ? "bg-white/15" :
                    i === 2 ? "bg-white/10" : "bg-white/5"
                  }`}
                >
                  <span className="text-xl w-8 text-center">{medals[i] ?? `#${entry.position}`}</span>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">Jogador {entry.position}</p>
                  </div>
                  <span className="font-black text-teal">{entry.correct} ✓</span>
                </div>
              );
            })}
          </div>

          <p className="text-white/30 text-xs">Nenhum nome é revelado — anonimato garantido</p>
        </div>
      )}
    </div>
  );
}
