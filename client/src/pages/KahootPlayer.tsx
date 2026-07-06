import { trpc } from "@/lib/trpc";
import { Users } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import ChatPedagogico from "@/components/ChatPedagogico";

const OPTION_COLORS = [
  { bg: "bg-[#e21b3c] hover:bg-[#c01532] active:bg-[#a01228]", hex: "#e21b3c" },
  { bg: "bg-[#1368ce] hover:bg-[#0f55b0] active:bg-[#0c4490]", hex: "#1368ce" },
  { bg: "bg-[#d89e00] hover:bg-[#b88500] active:bg-[#9a6f00]", hex: "#d89e00" },
  { bg: "bg-[#26890c] hover:bg-[#1e6e09] active:bg-[#175607]", hex: "#26890c" },
  { bg: "bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6]", hex: "#7c3aed" },
  { bg: "bg-[#0891b2] hover:bg-[#0e7490] active:bg-[#155e75]", hex: "#0891b2" },
];

type GamePhase = "waiting" | "question" | "answered" | "results" | "leaderboard" | "finished";

export default function KahootPlayer() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);

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
  const [openText, setOpenText] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  const validId = !isNaN(sessionId) && sessionId > 0;

  const { data: kahootState } = trpc.kahoot.state.useQuery(
    { sessionId },
    { enabled: validId, refetchInterval: 1000 }
  );

  const submitAnswer = trpc.kahoot.answer.useMutation({
    onError: (e) => {
      if (!e.message.includes("Já respondeste")) toast.error(e.message);
    },
  });

  useEffect(() => {
    if (!kahootState) return;
    const { status, activeQuestionIndex, timeRemaining } = kahootState;

    if (status === "waiting") { setPhase("waiting"); return; }
    if (status === "closed") { setPhase("finished"); return; }

    if (status === "active") {
      if (activeQuestionIndex !== lastQIndex) {
        setLastQIndex(activeQuestionIndex);
        setMyAnswer(null);
        setOpenText("");
        setPhase("question");
        setTimeLeft(timeRemaining);
      } else if (phase === "question") {
        setTimeLeft(timeRemaining);
      }
    }

    if (status === "voting_closed") {
      if (phase === "question" || phase === "answered") {
        // Se a pergunta ativa está oculta, não avança para "results" (sem gráficos)
        const hidden = kahootState?.hiddenResultsQuestionIds ?? [];
        const activeId = kahootState?.activeQuestionId;
        if (activeId && hidden.includes(activeId)) {
          // Mantém em "answered" — aguarda próxima pergunta silenciosamente
        } else {
          setPhase("results");
        }
      }
    }
  }, [kahootState]);

  useEffect(() => {
    if (phase !== "question") return;
    if (timeLeft <= 0) { setPhase("answered"); return; }
    const t = setTimeout(() => setTimeLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const handleAnswer = (optionIndex: number) => {
    if (phase !== "question" || myAnswer !== null) return;
    const answer = String(optionIndex);
    setMyAnswer(answer);
    setPhase("answered");
    submitAnswer.mutate({ sessionId, anonToken: anonToken.current, answer });
  };

  const handleOpenSubmit = () => {
    if (phase !== "question" || myAnswer !== null || !openText.trim()) return;
    setMyAnswer(openText.trim());
    setPhase("answered");
    submitAnswer.mutate({ sessionId, anonToken: anonToken.current, answer: openText.trim() });
  };

  const timePct = kahootState ? (timeLeft / (kahootState.questionDuration || 20)) * 100 : 100;
  const activeQuestion = kahootState?.activeQuestion;
  const isOpen = activeQuestion?.type === "open";
  const isScale = activeQuestion?.type === "scale";
  const cleanText = (t: string) => t.replace(/\?+$/, "");

  const SCALE_OPTIONS = [
    "Concordo totalmente",
    "Concordo parcialmente",
    "Discordo parcialmente",
    "Discordo totalmente",
  ];

  const handleSkip = () => {
    if (phase !== "question" || myAnswer !== null) return;
    setMyAnswer("__skip__");
    setPhase("answered");
    // não envia nada ao servidor — simplesmente marca como respondido localmente
  };

  // Estado do chat (para o ecrã de fim de jogo)
  const chatEnabled = kahootState?.chatEnabled ?? false;
  const chatPaused = kahootState?.chatPaused ?? false;
  const chatPrompt = kahootState?.chatPrompt ?? null;

  return (
    <div className="fixed inset-0 bg-navy flex flex-col items-center justify-center p-4 overflow-hidden">

      {/* ── A AGUARDAR ── */}
      {phase === "waiting" && (
        <div className="text-center text-white max-w-sm w-full">
          <div className="text-5xl mb-4 animate-bounce">🎮</div>
          <h1 className="text-3xl font-display font-black text-gold mb-1">Aula Viva</h1>
          <p className="text-white/60 mb-6 text-sm">Modo Jogo Interativo</p>

          {/* Regras de participação segura */}
          <div className="bg-white/10 rounded-2xl p-5 mb-5 text-left space-y-3">
            <p className="text-white font-bold text-sm mb-3 text-center">Antes de começar, lê com atenção:</p>
            <div className="flex items-start gap-3">
              <span className="text-teal text-lg flex-shrink-0">🔒</span>
              <p className="text-white/80 text-sm">As tuas respostas são <strong className="text-white">completamente anónimas</strong>. O professor não sabe quem respondeu o quê.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-teal text-lg flex-shrink-0">🤔</span>
              <p className="text-white/80 text-sm">Não há respostas certas ou erradas. O importante é <strong className="text-white">refletir honestamente</strong>.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-teal text-lg flex-shrink-0">👋</span>
              <p className="text-white/80 text-sm">Se alguma pergunta te fizer sentir desconfortável, podes sempre clicar em <strong className="text-white">&ldquo;Prefiro não responder&rdquo;</strong>.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-teal text-lg flex-shrink-0">📞</span>
              <p className="text-white/80 text-sm">Se precisares de apoio ou te sentires desconfortável, fala com o teu professor ou com o <strong className="text-white">psicólogo(a) da escola</strong>.</p>
            </div>
          </div>

          {/* Indicador de espera */}
          <div className="bg-white/5 rounded-xl px-5 py-3 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-teal border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-white/70 text-sm">A aguardar que o professor inicie...</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-white/40 text-xs mt-3">
            <Users className="w-3.5 h-3.5" />
            <span>{kahootState?.participantCount ?? 0} jogadores na sala</span>
          </div>
        </div>
      )}

      {/* ── PERGUNTA ── */}
      {phase === "question" && (
        <div className="w-full max-w-md flex flex-col gap-4">
          {/* Temporizador */}
          <div className="flex justify-center">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r="27"
                  fill="none"
                  stroke={timeLeft <= 5 ? "#e21b3c" : "#2ec4b6"}
                  strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 27}`}
                  strokeDashoffset={`${2 * Math.PI * 27 * (1 - timePct / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <span className={`font-black text-xl z-10 ${timeLeft <= 5 ? "text-red-400" : "text-white"}`}>
                {timeLeft}
              </span>
            </div>
          </div>

          {/* Texto da pergunta */}
          {activeQuestion && (
            <div className="bg-white/10 rounded-2xl p-4 text-center">
              <p className="text-white font-semibold text-base leading-snug">
                {cleanText(activeQuestion.text)}
              </p>
            </div>
          )}

          {/* Botão prefiro não responder */}
          {myAnswer === null && (
            <button
              onClick={handleSkip}
              className="text-white/40 hover:text-white/70 text-xs underline text-center transition-colors mt-1"
            >
              Prefiro não responder
            </button>
          )}

          {/* Pergunta aberta — caixa de texto */}
          {isOpen ? (
            <div className="flex flex-col gap-3">
              <textarea
                className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-teal"
                rows={4}
                placeholder="Escreve a tua resposta aqui..."
                value={openText}
                onChange={(e) => setOpenText(e.target.value)}
                disabled={myAnswer !== null}
              />
              <button
                onClick={handleOpenSubmit}
                disabled={!openText.trim() || myAnswer !== null}
                className="bg-teal hover:bg-teal-dark disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 text-lg"
              >
                Enviar resposta
              </button>
            </div>
          ) : isScale ? (
            /* Perguntas de escala — blocos de cor com texto */
            <div className="flex flex-col gap-3">
              {SCALE_OPTIONS.map((label, i) => {
                const color = OPTION_COLORS[i % OPTION_COLORS.length];
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className={`${color.bg} rounded-2xl transition-all active:scale-95 shadow-lg py-5 w-full text-white font-bold text-base`}
                    aria-label={label}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Perguntas de escolha múltipla — cartões coloridos com texto */
            <div className="grid grid-cols-2 gap-3">
              {(activeQuestion?.options ?? ["A", "B", "C", "D"]).map((opt, i) => {
                const color = OPTION_COLORS[i % OPTION_COLORS.length];
                const SHAPES = ["▲", "◆", "●", "■"];
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className={`${color.bg} rounded-2xl transition-all active:scale-95 shadow-lg min-h-[90px] w-full flex flex-col items-center justify-center gap-2 px-3 py-4 text-white font-bold text-sm text-center`}
                    aria-label={opt}
                  >
                    <span className="text-xl opacity-80">{SHAPES[i % SHAPES.length]}</span>
                    <span className="leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RESPONDIDO ── */}
      {phase === "answered" && (
        <div className="text-center text-white">
          <div className="text-6xl mb-6">{myAnswer === "__skip__" ? "⏭️" : "✅"}</div>
          <h2 className="text-2xl font-display font-bold mb-2">
            {myAnswer === "__skip__" ? "Sem resposta" : "Resposta enviada!"}
          </h2>
          <p className="text-white/60">A aguardar que o professor avance...</p>
          {myAnswer !== null && !isOpen && myAnswer !== "__skip__" && !isScale && (
            <div
              className={`mt-6 w-20 h-20 rounded-2xl mx-auto ${OPTION_COLORS[Number(myAnswer) % OPTION_COLORS.length]?.bg ?? "bg-teal"}`}
            />
          )}
          {myAnswer !== null && isScale && myAnswer !== "__skip__" && (
            <div className={`mt-6 rounded-2xl mx-auto px-6 py-3 font-bold text-white ${OPTION_COLORS[Number(myAnswer) % OPTION_COLORS.length]?.bg ?? "bg-teal"}`}>
              {SCALE_OPTIONS[Number(myAnswer)] ?? ""}
            </div>
          )}
          {myAnswer !== null && isOpen && (
            <div className="mt-6 bg-white/10 rounded-2xl p-4 max-w-xs mx-auto text-sm text-white/80 italic">
              "{myAnswer}"
            </div>
          )}
        </div>
      )}

      {/* ── RESULTADOS DA PERGUNTA ── */}
      {phase === "results" && (
        <div className="text-center text-white w-full max-w-sm">
          <div className="mb-6">
            <div className="text-6xl mb-3">✅</div>
            <h2 className="text-2xl font-display font-bold">Obrigado pela tua opinião!</h2>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-white/50 text-sm">A aguardar próxima questão...</p>
          </div>
        </div>
      )}

      {/* ── JOGO TERMINADO ── */}
      {(phase === "finished" || phase === "leaderboard") && (
        <div className="w-full max-w-sm overflow-y-auto max-h-screen py-4">
          {/* Mensagem de conclusão */}
          <div className="text-center text-white mb-6">
            <div className="text-6xl mb-4">🎓</div>
            <h2 className="text-2xl font-display font-black mb-2">Sessão concluída!</h2>
            <p className="text-white/60 text-sm">
              Obrigado pela tua participação. As tuas respostas foram registadas de forma anónima.
            </p>
          </div>

          {/* Chat pedagógico — aparece apenas quando o professor ativa */}
          {chatEnabled ? (
            <div className="animate-fade-in">
              <ChatPedagogico
                sessionId={sessionId}
                anonToken={anonToken.current}
                chatPaused={chatPaused}
                chatPrompt={chatPrompt}
                theme="dark"
              />
            </div>
          ) : (
            /* Ecrã de espera: aguarda que o professor abra o debate */
            <div className="bg-white/10 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-3">💬</div>
              <p className="text-white font-bold text-base mb-2">Momento de Debate</p>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                O professor irá abrir o espaço de debate em breve. Quando ativado, poderás partilhar a tua perspetiva de forma anónima.
              </p>
              <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
                <div className="w-2 h-2 bg-teal rounded-full animate-pulse" />
                A aguardar que o professor abra o debate...
              </div>
            </div>
          )}

          <p className="text-white/30 text-xs mt-6 text-center">Nenhum nome é revelado — anonimato garantido</p>
        </div>
      )}
    </div>
  );
}
