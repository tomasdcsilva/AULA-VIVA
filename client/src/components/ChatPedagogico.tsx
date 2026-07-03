/**
 * ChatPedagogico — Componente reutilizável para o chat anónimo de debate
 *
 * Fluxo pedagógico: Ler → Votar → **Debater** → Refletir/Retomar
 *
 * Funcionalidades:
 * - Painel de regras sempre visível antes e durante o chat
 * - Prompt de debate enviado pelo professor (pergunta orientadora)
 * - Protocolo de apoio para situações sensíveis
 * - Área de mensagens anónimas com scroll automático
 * - Deteção automática de conteúdo sensível com painel de apoio
 */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { MessageCircle, Send, AlertTriangle, ShieldCheck, BookOpen, Phone } from "lucide-react";

interface ChatMessage {
  id: number;
  content: string;
  isSensitive: boolean;
  isHighlighted: boolean;
  isHidden: boolean;
  createdAt: Date;
}

interface ChatPedagogicoProps {
  sessionId: number;
  anonToken: string;
  chatPaused: boolean;
  chatPrompt: string | null;
  /** Tema visual: "light" para fundo claro (StudentSession), "dark" para fundo escuro (KahootPlayer) */
  theme?: "light" | "dark";
}

export default function ChatPedagogico({
  sessionId,
  anonToken,
  chatPaused,
  chatPrompt,
  theme = "light",
}: ChatPedagogicoProps) {
  const [message, setMessage] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";

  const { data: chatMessages, refetch: refetchChat } = trpc.chat.messages.useQuery(
    { sessionId },
    { refetchInterval: 3000 }
  );

  const sendChat = trpc.chat.send.useMutation({
    onSuccess: (r) => {
      setMessage("");
      refetchChat();
      if (r.isSensitive) {
        setShowSupport(true);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    sendChat.mutate({ sessionId, anonToken, content: trimmed });
  };

  // ── Painel de regras (mostrado antes de aceitar) ──────────────────────────
  if (!rulesAccepted) {
    return (
      <div className={`rounded-2xl overflow-hidden ${isDark ? "bg-white/10" : "bg-white border border-border shadow-sm"}`}>
        {/* Cabeçalho */}
        <div className={`px-5 py-4 flex items-center gap-3 ${isDark ? "bg-white/5" : "bg-teal-light"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-teal/30" : "bg-teal/20"}`}>
            <MessageCircle className={`w-5 h-5 ${isDark ? "text-teal-light" : "text-teal-dark"}`} />
          </div>
          <div>
            <h3 className={`font-display font-bold text-base ${isDark ? "text-white" : "text-teal-dark"}`}>
              Debate da Turma
            </h3>
            <p className={`text-xs ${isDark ? "text-white/60" : "text-teal-dark/70"}`}>
              Espaço anónimo de reflexão coletiva
            </p>
          </div>
        </div>

        {/* Regras */}
        <div className="px-5 py-4 space-y-3">
          <div className={`flex items-start gap-2 ${isDark ? "text-white/80" : "text-navy"}`}>
            <ShieldCheck className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">Antes de participar, lê com atenção:</p>
          </div>

          <div className={`rounded-xl p-4 space-y-2.5 text-sm ${isDark ? "bg-white/5" : "bg-cream-dark"}`}>
            <RuleItem isDark={isDark} icon="🔒">
              As tuas mensagens são <strong>completamente anónimas</strong>. Ninguém sabe quem escreveu o quê.
            </RuleItem>
            <RuleItem isDark={isDark} icon="🤝">
              Respeita todas as opiniões, mesmo que discordes. Este é um espaço de reflexão, não de julgamento.
            </RuleItem>
            <RuleItem isDark={isDark} icon="💬">
              Escreve de forma clara e respeitosa. Evita linguagem ofensiva ou que possa magoar alguém.
            </RuleItem>
            <RuleItem isDark={isDark} icon="🚫">
              Não partilhes informações pessoais suas ou de outros colegas.
            </RuleItem>
            <RuleItem isDark={isDark} icon="📞">
              Se precisares de apoio, escreve <strong>"preciso de ajuda"</strong> — o professor será notificado de forma discreta.
            </RuleItem>
          </div>

          {/* Protocolo de apoio (sempre visível) */}
          <div className={`rounded-xl p-3 flex items-start gap-2.5 ${isDark ? "bg-blue-900/40 border border-blue-500/30" : "bg-blue-50 border border-blue-200"}`}>
            <Phone className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? "text-blue-300" : "text-blue-600"}`} />
            <p className={`text-xs ${isDark ? "text-blue-200" : "text-blue-800"}`}>
              <strong>116 111 — Linha de Apoio à Criança e Jovem</strong> (gratuita, 24h) ·
              <strong>1411 — Linha de Prevenção do Suicídio</strong> (gratuita, 24h) ·
              Também podes falar com o psicólogo(a) da escola em privado.
            </p>
          </div>

          <button
            onClick={() => setRulesAccepted(true)}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
              isDark
                ? "bg-teal text-white hover:bg-teal-dark"
                : "bg-teal text-white hover:bg-teal-dark"
            }`}
          >
            Li e aceito as regras — Entrar no debate
          </button>
        </div>
      </div>
    );
  }

  // ── Chat ativo ────────────────────────────────────────────────────────────
  return (
    <div className={`rounded-2xl overflow-hidden ${isDark ? "bg-white/10" : "bg-white border border-border shadow-sm"}`}>
      {/* Cabeçalho */}
      <div className={`px-4 py-3 flex items-center gap-3 ${isDark ? "bg-white/5" : "bg-teal-light"}`}>
        <MessageCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-teal-light" : "text-teal-dark"}`} />
        <h3 className={`font-display font-bold text-sm flex-1 ${isDark ? "text-white" : "text-teal-dark"}`}>
          Debate da Turma
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-teal/30 text-teal-light" : "bg-teal/20 text-teal-dark"}`}>
          Anónimo
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Regras resumidas (sempre visíveis) */}
        <div className={`rounded-xl px-3 py-2 text-xs space-y-0.5 ${isDark ? "bg-white/5 text-white/60" : "bg-cream-dark text-muted-foreground"}`}>
          <p className={`font-semibold mb-1 ${isDark ? "text-white/80" : "text-navy"}`}>Regras do espaço de debate:</p>
          <p>· Respeita todas as opiniões · Sem linguagem ofensiva · Sem dados pessoais</p>
          <p>· As tuas mensagens são anónimas · Escreve "preciso de ajuda" se precisares de apoio</p>
        </div>

        {/* Prompt do professor (pergunta orientadora) */}
        {chatPrompt && (
          <div className={`rounded-xl p-3 flex items-start gap-2.5 ${isDark ? "bg-gold/20 border border-gold/40" : "bg-gold-light border border-gold/50"}`}>
            <BookOpen className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? "text-gold" : "text-amber-700"}`} />
            <div>
              <p className={`text-xs font-semibold mb-0.5 ${isDark ? "text-gold" : "text-amber-700"}`}>
                Pergunta do professor para debate:
              </p>
              <p className={`text-sm font-medium leading-snug ${isDark ? "text-white/90" : "text-navy"}`}>
                {chatPrompt}
              </p>
            </div>
          </div>
        )}

        {/* Protocolo de apoio (aparece quando mensagem sensível é detetada) */}
        {showSupport && (
          <div className={`rounded-xl p-3 animate-fade-in ${isDark ? "bg-blue-900/50 border border-blue-500/40" : "bg-blue-50 border border-blue-300"}`}>
            <div className="flex items-start gap-2">
              <span className="text-xl flex-shrink-0">💙</span>
              <div className="flex-1">
                <p className={`text-xs font-bold mb-1 ${isDark ? "text-blue-200" : "text-blue-900"}`}>
                  Estamos aqui para ajudar
                </p>
                <p className={`text-xs mb-2 ${isDark ? "text-blue-300" : "text-blue-800"}`}>
                  A tua mensagem foi recebida. Se estiveres a passar por uma situação difícil, não estás sozinho/a.
                </p>
                <div className={`space-y-1.5 text-xs ${isDark ? "text-blue-200" : "text-blue-900"}`}>
                  <p>📞 <strong>116 111 — Linha de Apoio à Criança e Jovem</strong> — Gratuita · 24h · Anónima</p>
                  <p>📞 <strong>1411 — Prevenção do Suicídio e Apoio Psicológico</strong> — Gratuita · 24h</p>
                  <p>💬 <strong>Psicólogo(a) da escola</strong> — Podes pedir para falar em privado</p>
                  <p>🌐 <strong>APAV:</strong> apav.pt · <strong>SOS Voz Amiga:</strong> 213 544 545</p>
                </div>
                <button
                  onClick={() => setShowSupport(false)}
                  className={`mt-2 text-xs underline ${isDark ? "text-blue-400" : "text-blue-600"}`}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Aviso de chat pausado */}
        {chatPaused ? (
          <div className={`text-center text-sm py-3 px-4 rounded-xl ${isDark ? "bg-amber-900/40 text-amber-300" : "bg-amber-50 text-amber-700"}`}>
            ⏸ O chat está pausado pelo professor.
          </div>
        ) : null}

        {/* Mensagens */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {!chatMessages || chatMessages.length === 0 ? (
            <p className={`text-center text-sm py-4 ${isDark ? "text-white/40" : "text-muted-foreground"}`}>
              Ainda não há mensagens. Sê o primeiro a partilhar a tua perspetiva!
            </p>
          ) : (
            chatMessages
              .filter((m) => !m.isHidden)
              .map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-xl px-3 py-2 ${
                    msg.isSensitive
                      ? isDark
                        ? "bg-red-900/40 border border-red-500/40"
                        : "bg-red-50 border border-red-200"
                      : msg.isHighlighted
                        ? isDark
                          ? "bg-gold/20 border border-gold/40"
                          : "bg-gold-light border border-gold/50"
                        : isDark
                          ? "bg-white/10"
                          : "bg-cream-dark"
                  }`}
                >
                  {msg.isSensitive && (
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <span className={`text-xs font-bold ${isDark ? "text-red-300" : "text-red-600"}`}>
                        Mensagem sinalizada
                      </span>
                    </div>
                  )}
                  <p className={`text-sm ${isDark ? "text-white/90" : "text-navy"}`}>{msg.content}</p>
                  <p className={`text-xs mt-1 ${isDark ? "text-white/30" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input de mensagem */}
        {!chatPaused && (
          <div className="flex gap-2">
            <input
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal ${
                isDark
                  ? "bg-white/10 text-white placeholder-white/40 border border-white/20"
                  : "bg-card border border-border text-navy"
              }`}
              placeholder="Partilha a tua perspetiva anonimamente..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              maxLength={500}
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || sendChat.isPending}
              className={`px-4 py-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-40 ${
                isDark
                  ? "bg-teal text-white hover:bg-teal-dark"
                  : "bg-teal text-white hover:bg-teal-dark"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componente auxiliar para item de regra ────────────────────────────────────
function RuleItem({
  icon,
  children,
  isDark,
}: {
  icon: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-base flex-shrink-0 leading-5">{icon}</span>
      <p className={`text-sm leading-snug ${isDark ? "text-white/80" : "text-navy/80"}`}>{children}</p>
    </div>
  );
}
