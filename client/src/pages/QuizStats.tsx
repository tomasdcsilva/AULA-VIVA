import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  BarChart2,
  BookOpen,
  Calendar,
  Gamepad2,
  Users,
  MessageSquare,
  Play,
} from "lucide-react";
import { Link, useParams } from "wouter";

const OPTION_COLORS = [
  "#e21b3c",
  "#1368ce",
  "#d89e00",
  "#26890c",
  "#7c3aed",
  "#0891b2",
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting: { label: "A aguardar", color: "bg-amber-100 text-amber-800" },
  active: { label: "Ativa", color: "bg-green-100 text-green-800" },
  voting_closed: { label: "Votação encerrada", color: "bg-blue-100 text-blue-800" },
  chat_open: { label: "Chat aberto", color: "bg-teal-light text-teal-dark" },
  closed: { label: "Encerrada", color: "bg-gray-100 text-gray-600" },
};

export default function QuizStats() {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = trpc.quizzes.stats.useQuery(
    { id: quizId },
    { enabled: isAuthenticated && !isNaN(quizId) }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="av-section text-center py-24">
        <p className="text-muted-foreground">Quiz não encontrado.</p>
        <Link href="/dashboard" className="av-btn-primary mt-4 inline-block">
          Voltar ao Painel
        </Link>
      </div>
    );
  }

  const { quiz, sessions, totalSessions, totalParticipants } = data;

  return (
    <div className="av-section animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/dashboard" className="mt-1 p-2 rounded-lg hover:bg-cream-dark transition-colors text-muted-foreground hover:text-navy">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="av-section-title">{quiz.title}</h1>
          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
            {quiz.literaryWork && <span>📖 {quiz.literaryWork}</span>}
            {quiz.discipline && <span>📚 {quiz.discipline}</span>}
            {quiz.yearGroup && <span>🎓 {quiz.yearGroup}</span>}
            {quiz.className && <span>👥 {quiz.className}</span>}
          </div>
        </div>
      </div>

      {/* Resumo global */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="av-card text-center">
          <div className="text-3xl font-black text-teal">{totalSessions}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" /> Sessões realizadas
          </div>
        </div>
        <div className="av-card text-center">
          <div className="text-3xl font-black text-teal">{totalParticipants}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> Total de participantes
          </div>
        </div>
        <div className="av-card text-center">
          <div className="text-3xl font-black text-navy">{data.questions.length}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <BookOpen className="w-3 h-3" /> Questões no quiz
          </div>
        </div>
        <div className="av-card text-center">
          <div className="text-3xl font-black text-navy">
            {totalSessions > 0 ? Math.round(totalParticipants / totalSessions) : 0}
          </div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <BarChart2 className="w-3 h-3" /> Média por sessão
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="av-card text-center py-16">
          <BarChart2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">Este quiz ainda não foi utilizado em nenhuma sessão.</p>
          <p className="text-sm text-muted-foreground">Volta ao painel e clica em <strong>Jogar</strong> para lançar a primeira sessão.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sessions.map((session, si) => (
            <div key={session.sessionId} className="av-card">
              {/* Cabeçalho da sessão */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-black text-navy text-xl tracking-widest">{session.code}</span>
                    <span className={`av-badge ${STATUS_LABELS[session.status]?.color ?? "bg-gray-100 text-gray-600"}`}>
                      {STATUS_LABELS[session.status]?.label}
                    </span>
                    {session.mode === "kahoot" ? (
                      <span className="av-badge bg-red-100 text-red-700 flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3" /> Jogo
                      </span>
                    ) : (
                      <span className="av-badge bg-blue-100 text-blue-700 flex items-center gap-1">
                        <Play className="w-3 h-3" /> Sessão
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.createdAt).toLocaleDateString("pt-PT", {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                    {" · "}
                    <span className="font-semibold text-navy">{session.participantCount} participante(s)</span>
                  </p>
                </div>
                <Link
                  href={`/session/${session.sessionId}`}
                  className="text-sm font-semibold text-teal border border-teal rounded-lg py-1.5 px-3 hover:bg-teal hover:text-white transition-colors"
                >
                  Ver sessão completa
                </Link>
              </div>

              {/* Estatísticas por pergunta */}
              <div className="space-y-6">
                {session.questionStats.map((qs, qi) => {
                  const totalAnswers = qs.stats.reduce((s, r) => s + r.count, 0);
                  const isOpen = qs.type === "open";

                  return (
                    <div key={qs.questionId}>
                      <p className="text-sm font-semibold text-navy mb-3">
                        <span className="text-muted-foreground font-normal mr-1">Q{qi + 1}.</span>
                        {qs.text.replace(/\?+$/, "")}
                      </p>

                      {totalAnswers === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Sem respostas registadas.</p>
                      ) : isOpen ? (
                        /* Perguntas abertas — lista de respostas */
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <MessageSquare className="w-3 h-3" />
                            <span>{totalAnswers} resposta(s) escritas</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {qs.stats.map((r, ri) => (
                              <div
                                key={ri}
                                className="bg-cream-dark rounded-lg px-3 py-2 text-sm text-navy italic"
                              >
                                "{r.answer}"
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Perguntas de escolha — barras de distribuição */
                        <div className="space-y-2">
                          {qs.options.map((opt, oi) => {
                            const stat = qs.stats.find((s) => s.answer === String(oi));
                            const count = stat?.count ?? 0;
                            const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
                            const color = OPTION_COLORS[oi % OPTION_COLORS.length];
                            return (
                              <div key={oi} className="flex items-center gap-3">
                                <span
                                  className="w-3 h-3 rounded-sm flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs text-muted-foreground">{opt}</span>
                                    <span className="text-xs font-bold text-navy">{count} ({pct}%)</span>
                                  </div>
                                  <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-700"
                                      style={{ width: `${pct}%`, backgroundColor: color }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <p className="text-xs text-muted-foreground text-right">{totalAnswers} resposta(s)</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
