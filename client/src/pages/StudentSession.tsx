import { Shield, MessageCircle, BarChart3, Send, CheckCircle, AlertTriangle, BookOpen } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

interface SessionData {
  sessionId: number;
  sessionCode: string;
  anonToken: string;
  status: string;
  showResultsImmediately: boolean;
  chatEnabled: boolean;
  questions: { id: number; text: string; type: string; options: string[] }[];
  quizTitle: string;
  literaryWork: string;
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
  const [chatMessage, setChatMessage] = useState("");
  const [showStats, setShowStats] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const { data: chatMessages, refetch: refetchChat } = trpc.chat.messages.useQuery(
    { sessionId },
    { refetchInterval: 3000, enabled: statusData?.chatEnabled ?? false }
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
      if (sessionData?.showResultsImmediately) setShowStats(true);
      toast.success("Resposta enviada!");
    },
    onError: (e) => toast.error(e.message),
  });

  const sendChat = trpc.chat.send.useMutation({
    onSuccess: (r) => {
      setChatMessage("");
      refetchChat();
      if (r.isSensitive) {
        toast("A tua mensagem foi sinalizada. Se precisares de apoio, fala com o teu professor.", {
          icon: "💙",
          duration: 6000,
        });
      }
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  // A aguardar
  if (currentStatus === "waiting") return (
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
        {/* Votação */}
        {(currentStatus === "active" || currentStatus === "voting_closed") && (
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

                {/* Múltipla escolha */}
                {activeQ.type === "multiple_choice" && (
                  <div className="space-y-2">
                    {activeQ.options.map((opt) => (
                      <button
                        key={opt}
                        disabled={submitted[activeQ.id] || currentStatus === "voting_closed"}
                        onClick={() => setAnswers((prev) => ({ ...prev, [activeQ.id]: opt }))}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          answers[activeQ.id] === opt
                            ? "border-teal bg-teal-light text-teal-dark"
                            : "border-border bg-card hover:border-teal/40 text-navy"
                        } disabled:cursor-not-allowed`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

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

                {submitted[activeQ.id] && (
                  <div className="mt-4 flex items-center gap-2 text-teal text-sm font-semibold">
                    <CheckCircle className="w-4 h-4" /> Resposta enviada com sucesso!
                  </div>
                )}

                {/* Estatísticas */}
                {(showStats || currentStatus === "voting_closed") && stats && stats.length > 0 && (
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

        {/* Chat */}
        {chatEnabled && (
          <div className="mt-6 animate-fade-in">
            <div className="av-card">
              <h2 className="font-display font-bold text-navy mb-2 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-teal" /> Debate da Turma
              </h2>

              {/* Regras do chat */}
              <div className="bg-cream-dark rounded-xl p-3 mb-3 text-xs text-muted-foreground">
                <p className="font-semibold text-navy mb-1">Regras do espaço de debate:</p>
                <p>· Respeita todas as opiniões · Não uses linguagem ofensiva · Podes partilhar a tua perspetiva com segurança</p>
              </div>

              {/* Protocolo sensível */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Se precisares de ajuda ou te sentires em risco, escreve "preciso de ajuda" — o professor será notificado de forma discreta.</p>
              </div>

              {/* Mensagens */}
              <div className="space-y-2 max-h-64 overflow-y-auto mb-3 pr-1">
                {!chatMessages || chatMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">Ainda não há mensagens. Sê o primeiro a partilhar!</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="bg-cream-dark rounded-xl px-3 py-2">
                      <p className="text-sm text-navy">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              {chatPaused ? (
                <div className="text-center text-sm text-amber-700 bg-amber-50 rounded-xl py-3 px-4">
                  ⏸ O chat está pausado pelo professor.
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card"
                    placeholder="Partilha a tua perspetiva..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (chatMessage.trim()) {
                          sendChat.mutate({ sessionId, anonToken: sessionData.anonToken, content: chatMessage.trim() });
                        }
                      }
                    }}
                    maxLength={500}
                  />
                  <button
                    onClick={() => {
                      if (chatMessage.trim()) {
                        sendChat.mutate({ sessionId, anonToken: sessionData.anonToken, content: chatMessage.trim() });
                      }
                    }}
                    disabled={!chatMessage.trim() || sendChat.isPending}
                    className="av-btn-primary px-4 py-2.5 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
