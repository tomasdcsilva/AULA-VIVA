import { Shield, BarChart3, CheckCircle, BookOpen, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import ChatPedagogico from "@/components/ChatPedagogico";

interface SessionData {
  sessionId: number;
  sessionCode: string;
  anonToken: string;
  status: string;
  showResultsImmediately: boolean;
  hiddenResultsQuestionIds: number[];
  chatEnabled: boolean;
  questions: { id: number; text: string; type: string; options: string[] }[];
  quizTitle: string;
  literaryWork: string;
  isAsync: boolean;
}

const CHART_COLORS = [
  "oklch(52% 0.13 185)",
  "oklch(78% 0.14 80)",
  "oklch(38% 0.12 185)",
  "oklch(65% 0.14 80)",
  "oklch(60% 0.10 185)",
];

const SCALE_LABELS: Record<string, string> = {
  "0": "Concordo totalmente",
  "1": "Concordo parcialmente",
  "2": "Discordo parcialmente",
  "3": "Discordo totalmente",
};

export default function StudentSession() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);
  const [, navigate] = useLocation();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("av_session");
    if (!raw) { navigate("/join"); return; }
    try {
      const data = JSON.parse(raw) as SessionData;
      if (data.sessionId !== sessionId) { navigate("/join"); return; }
      setSessionData(data);
    } catch {
      navigate("/join");
    }
  }, [sessionId]);

  const { data: statusData, refetch: refetchStatus } = trpc.sessions.status.useQuery(
    { sessionId },
    { refetchInterval: 4000, enabled: !!sessionData }
  );

  const activeQ = sessionData?.questions[currentQ];

  const { data: stats } = trpc.votes.stats.useQuery(
    { sessionId, questionId: activeQ?.id ?? 0 },
    {
      enabled: showStats && !!activeQ,
      refetchInterval: 3000,
    }
  );

  const submitVote = trpc.votes.submit.useMutation({
    onSuccess: () => {
      if (!activeQ) return;
      setSubmitted((prev) => ({ ...prev, [activeQ.id]: true }));
      const isHidden = sessionData?.hiddenResultsQuestionIds?.includes(activeQ.id) ?? false;
      // Só mostra stats se showResultsImmediately E a pergunta não está oculta
      if (sessionData?.showResultsImmediately && !isHidden) setShowStats(true);
      toast.success("Resposta enviada!");
      // Modo assíncrono: avançar automaticamente para a próxima pergunta após 1.5s
      if (sessionData?.isAsync) {
        const nextIdx = currentQ + 1;
        if (nextIdx < (sessionData?.questions.length ?? 0)) {
          setTimeout(() => { setCurrentQ(nextIdx); setShowStats(false); }, 1500);
        }
      }
    },
    onError: (e) => toast.error(e.message),
  });

  if (!sessionData) return (
    <div className="flex items-center justify-center min-h-screen bg-cream">
      <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const currentStatus = statusData?.status ?? sessionData.status;
  const chatEnabled = statusData?.chatEnabled ?? sessionData.chatEnabled;
  const chatPaused = statusData?.chatPaused ?? false;

  // Sessão encerrada
  if (currentStatus === "closed") return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md text-center animate-scale-in">
        <CheckCircle className="w-16 h-16 text-teal mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold text-navy mb-2">Sessão encerrada</h2>
        <p className="text-muted-foreground">Obrigado pela tua participação! A tua identidade permanece protegida.</p>
      </div>
    </div>
  );

  // A aguardar (só para sessões não-assíncronas)
  if (currentStatus === "waiting" && !sessionData.isAsync) return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md text-center animate-fade-in">
        <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gold" />
        </div>
        <h2 className="text-2xl font-display font-bold text-navy mb-2">Aguarda o professor...</h2>
        <p className="text-muted-foreground mb-4">A sessão ainda não foi aberta. Fica atento ao quadro.</p>
        <div className="bg-teal-light rounded-xl p-4 text-left">
          <p className="font-bold text-teal-dark text-sm">{sessionData.quizTitle}</p>
          {sessionData.literaryWork && (
            <p className="text-xs text-teal-dark/80 mt-1">📖 {sessionData.literaryWork}</p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <div className="w-2 h-2 bg-teal rounded-full animate-pulse" />
          A aguardar início da votação...
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-navy px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-display font-bold text-sm">{sessionData.quizTitle}</p>
          {sessionData.literaryWork && (
            <p className="text-white/50 text-xs">📖 {sessionData.literaryWork}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-teal-light text-xs">
          <Shield className="w-3 h-3" /> Anónimo
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Modo assíncrono: ecrã de conclusão quando todas as perguntas foram respondidas */}
        {sessionData.isAsync && sessionData.questions.length > 0 && sessionData.questions.every(q => submitted[q.id]) && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center animate-scale-in">
              <CheckCircle className="w-16 h-16 text-teal mx-auto mb-4" />
              <h2 className="text-2xl font-display font-bold text-navy mb-2">Concluíste o quiz!</h2>
              <p className="text-muted-foreground mb-4">Obrigado pela tua participação! A tua identidade permanece protegida.</p>
              <div className="bg-teal-light rounded-xl p-4 text-left max-w-xs mx-auto">
                <p className="font-bold text-teal-dark text-sm">{sessionData.quizTitle}</p>
                <p className="text-xs text-teal-dark/70 mt-1">{sessionData.questions.length} perguntas respondidas</p>
              </div>
            </div>
          </div>
        )}

        {/* Votação */}
        {(!sessionData.isAsync || !sessionData.questions.every(q => submitted[q.id])) && (currentStatus === "active" || currentStatus === "voting_closed") && (
          <div className="animate-fade-in">
            {/* Navegação entre perguntas */}
            <div className="flex gap-1.5 mb-5 flex-wrap">
              {sessionData.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => { setCurrentQ(i); setShowStats(false); }}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                    i === currentQ
                      ? "bg-teal text-white"
                      : submitted[q.id]
                        ? "bg-teal-light text-teal-dark"
                        : "bg-cream-dark text-navy hover:bg-teal-light"
                  }`}
                >
                  {submitted[q.id] ? "✓" : i + 1}
                </button>
              ))}
            </div>

            {activeQ && (
              <div className="av-card shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Pergunta {currentQ + 1} de {sessionData.questions.length}
                </p>
                <h2 className="text-lg font-display font-bold text-navy mb-5 leading-snug">
                  {activeQ.text}
                </h2>

                {/* Múltipla escolha — cartões coloridos */}
                {activeQ.type === "multiple_choice" && (() => {
                  const CARD_COLORS = [
                    { bg: "#e21b3c", hover: "#c41535" },
                    { bg: "#1368ce", hover: "#0f55b0" },
                    { bg: "#d89e00", hover: "#b88600" },
                    { bg: "#26890c", hover: "#1e6e09" },
                    { bg: "#7c3aed", hover: "#6b2fd4" },
                    { bg: "#0891b2", hover: "#0778a0" },
                  ];
                  const SHAPES = ["▲", "◆", "●", "■", "★", "♥"];
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      {activeQ.options.map((opt, i) => {
                        const color = CARD_COLORS[i % CARD_COLORS.length];
                        const isSelected = answers[activeQ.id] === opt;
                        const isDisabled = submitted[activeQ.id] || currentStatus === "voting_closed";
                        return (
                          <button
                            key={opt}
                            disabled={isDisabled}
                            onClick={() => !isDisabled && setAnswers((prev) => ({ ...prev, [activeQ.id]: opt }))}
                            style={{
                              backgroundColor: color.bg,
                              opacity: isDisabled && !isSelected ? 0.55 : 1,
                              outline: isSelected ? "3px solid white" : "none",
                              outlineOffset: "2px",
                              transform: isSelected ? "scale(0.97)" : "scale(1)",
                              transition: "all 0.15s ease-out",
                            }}
                            className="relative flex flex-col items-center justify-center gap-2 rounded-2xl px-3 py-4 min-h-[90px] text-white font-bold text-sm text-center shadow-md active:scale-95 disabled:cursor-not-allowed"
                          >
                            <span className="text-xl opacity-80">{SHAPES[i % SHAPES.length]}</span>
                            <span className="leading-snug">{opt}</span>
                            {isSelected && (
                              <span className="absolute top-2 right-2 text-white text-xs bg-white/20 rounded-full w-5 h-5 flex items-center justify-center">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Escala */}
                {activeQ.type === "scale" && (
                  <div className="space-y-2">
                    {["0", "1", "2", "3"].map((v) => (
                      <button
                        key={v}
                        disabled={submitted[activeQ.id] || currentStatus === "voting_closed"}
                        onClick={() => setAnswers((prev) => ({ ...prev, [activeQ.id]: v }))}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          answers[activeQ.id] === v
                            ? "border-teal bg-teal-light text-teal-dark"
                            : "border-border bg-card hover:border-teal/40 text-navy"
                        } disabled:cursor-not-allowed`}
                      >
                        {SCALE_LABELS[v]}
                      </button>
                    ))}
                  </div>
                )}

                {/* Resposta aberta */}
                {activeQ.type === "open" && (
                  <textarea
                    className="w-full border-2 border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal bg-card resize-none"
                    rows={4}
                    placeholder="Escreve a tua resposta aqui..."
                    disabled={submitted[activeQ.id] || currentStatus === "voting_closed"}
                    value={answers[activeQ.id] ?? ""}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [activeQ.id]: e.target.value }))}
                  />
                )}

                {/* Botão submeter */}
                {!submitted[activeQ.id] && currentStatus === "active" && (
                  <button
                    disabled={!answers[activeQ.id] || submitVote.isPending}
                    onClick={() =>
                      submitVote.mutate({
                        sessionId,
                        questionId: activeQ.id,
                        anonToken: sessionData.anonToken,
                        answer: answers[activeQ.id],
                      })
                    }
                    className="av-btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enviar Resposta
                  </button>
                )}

                {/* Após submissão */}
                {submitted[activeQ.id] && (() => {
                  const isHidden = sessionData?.hiddenResultsQuestionIds?.includes(activeQ.id) ?? false;
                  const hasNextQ = currentQ + 1 < sessionData.questions.length;

                  return (
                    <div className="mt-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-teal text-sm font-semibold mb-3">
                        <CheckCircle className="w-4 h-4" /> Resposta enviada com sucesso!
                      </div>

                      {/* Se resultados ocultos: mostrar botão "Próxima Pergunta" */}
                      {isHidden && hasNextQ && (
                        <button
                          onClick={() => { setCurrentQ(currentQ + 1); setShowStats(false); }}
                          className="av-btn-primary w-full flex items-center justify-center gap-2"
                        >
                          Próxima Pergunta <ArrowRight className="w-4 h-4" />
                        </button>
                      )}

                      {/* Se resultados ocultos e é a última pergunta */}
                      {isHidden && !hasNextQ && (
                        <div className="bg-teal-light rounded-xl p-4 text-center">
                          <p className="text-teal-dark font-semibold text-sm">✅ Concluíste todas as perguntas!</p>
                          <p className="text-teal-dark/70 text-xs mt-1">Os resultados serão partilhados pelo professor no relatório.</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Estatísticas — ocultas se a pergunta estiver na lista hiddenResultsQuestionIds */}
                {(showStats || currentStatus === "voting_closed") && stats && stats.length > 0 && !(sessionData?.hiddenResultsQuestionIds?.includes(activeQ.id) ?? false) && (
                  <div className="mt-5 animate-fade-in">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" /> Resultados da Turma
                    </p>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(88% 0.02 85)" />
                          <XAxis dataKey="answer" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(v: number, _: string, entry: any) => [`${entry.payload.percentage}%`, "Turma"]}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {stats.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chat Pedagógico */}
        {chatEnabled && (
          <div className="mt-6 animate-fade-in">
            <ChatPedagogico
              sessionId={sessionId}
              anonToken={sessionData.anonToken}
              chatPaused={chatPaused}
              chatPrompt={statusData?.chatPrompt ?? null}
              theme="light"
            />
          </div>
        )}

      </div>
    </div>
  );
}
