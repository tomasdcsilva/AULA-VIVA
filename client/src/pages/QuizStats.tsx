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
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  HelpCircle,
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

// Detecta perguntas com maior dispersão (ponto crítico pedagógico)
function calcDispersion(stats: { answer: string; count: number }[], total: number): number {
  if (total === 0) return 0;
  const pcts = stats.map((s) => s.count / total);
  const mean = pcts.reduce((a, b) => a + b, 0) / (pcts.length || 1);
  const variance = pcts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (pcts.length || 1);
  return Math.sqrt(variance);
}

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
  const avgParticipants = totalSessions > 0 ? Math.round(totalParticipants / totalSessions) : 0;

  return (
    <div className="av-section animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/dashboard" className="mt-1 p-2 rounded-lg hover:bg-cream-dark transition-colors text-muted-foreground hover:text-navy">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="av-badge bg-red-100 text-red-700 flex items-center gap-1">
              <Gamepad2 className="w-3 h-3" /> Relatório de Jogo
            </span>
          </div>
          <h1 className="av-section-title">{quiz.title}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
            {quiz.literaryWork && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {quiz.literaryWork}</span>}
            {quiz.discipline && <span>📚 {quiz.discipline}</span>}
            {quiz.yearGroup && <span>🎓 {quiz.yearGroup}</span>}
            {quiz.className && <span>👥 {quiz.className}</span>}
          </div>
        </div>
      </div>

      {/* Indicadores de participação */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="av-card text-center">
          <div className="text-3xl font-black text-teal">{totalSessions}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" /> Jogos realizados
          </div>
        </div>
        <div className="av-card text-center">
          <div className="text-3xl font-black text-teal">{totalParticipants}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> Total de alunos
          </div>
        </div>
        <div className="av-card text-center">
          <div className="text-3xl font-black text-navy">{data.questions.length}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <HelpCircle className="w-3 h-3" /> Questões no quiz
          </div>
        </div>
        <div className="av-card text-center">
          <div className="text-3xl font-black text-navy">{avgParticipants}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" /> Média por jogo
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="av-card text-center py-16">
          <BarChart2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">Este quiz ainda não foi utilizado em nenhum jogo.</p>
          <p className="text-sm text-muted-foreground">Volta ao painel e clica em <strong>Jogar</strong> para lançar o primeiro jogo.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {sessions.map((session) => {
            const totalAnswers = session.questionStats.reduce((sum, qs) => {
              return sum + qs.stats.reduce((s, r) => s + r.count, 0);
            }, 0);
            const totalQuestions = session.questionStats.length;
            const answeredQuestions = session.questionStats.filter(qs =>
              qs.stats.reduce((s, r) => s + r.count, 0) > 0
            ).length;
            const responseRate = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

            // Pontos críticos: perguntas com maior dispersão de respostas
            const criticalPoints = session.questionStats
              .filter(qs => qs.type !== "open")
              .map((qs) => {
                const total = qs.stats.reduce((s, r) => s + r.count, 0);
                return { ...qs, dispersion: calcDispersion(qs.stats, total), total };
              })
              .filter(qs => qs.total > 0 && qs.dispersion > 0.25)
              .sort((a, b) => b.dispersion - a.dispersion)
              .slice(0, 3);

            return (
              <div key={session.sessionId} className="space-y-6">
                {/* Cabeçalho da sessão */}
                <div className="border-b border-border pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-black text-navy text-xl tracking-widest">{session.code}</span>
                        <span className="av-badge bg-gray-100 text-gray-600">Encerrado</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.createdAt).toLocaleDateString("pt-PT", {
                          day: "2-digit", month: "long", year: "numeric",
                        })}
                        {" · "}
                        <span className="font-semibold text-navy">{session.participantCount} aluno(s)</span>
                        {" · "}
                        <span className="font-semibold text-teal">{responseRate}% de taxa de resposta</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Secção 1: Participação */}
                <div className="av-card">
                  <h3 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal" /> Participação
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-black text-teal">{session.participantCount}</div>
                      <div className="text-xs text-muted-foreground mt-1">Alunos presentes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-navy">{totalAnswers}</div>
                      <div className="text-xs text-muted-foreground mt-1">Respostas dadas</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-navy">{responseRate}%</div>
                      <div className="text-xs text-muted-foreground mt-1">Taxa de resposta</div>
                    </div>
                  </div>
                  {/* Barra de progresso da taxa de resposta */}
                  <div className="mt-4">
                    <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all duration-700"
                        style={{ width: `${responseRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Secção 2: Resultados por pergunta */}
                <div className="av-card">
                  <h3 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-teal" /> Resultados do Quiz
                  </h3>
                  <div className="space-y-6">
                    {session.questionStats.map((qs, qi) => {
                      const totalQ = qs.stats.reduce((s, r) => s + r.count, 0);
                      const isOpen = qs.type === "open";

                      return (
                        <div key={qs.questionId} className="border-b border-border/50 pb-5 last:border-0 last:pb-0">
                          <p className="text-sm font-semibold text-navy mb-3">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-cream-dark text-xs font-bold text-muted-foreground mr-2">{qi + 1}</span>
                            {qs.text.replace(/\?+$/, "")}
                          </p>

                          {totalQ === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Sem respostas registadas.</p>
                          ) : isOpen ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                <MessageSquare className="w-3 h-3" />
                                <span>{totalQ} resposta(s) escrita(s)</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                {qs.stats.map((r, ri) => (
                                  <div
                                    key={ri}
                                    className="bg-cream-dark rounded-lg px-3 py-2 text-sm text-navy italic border-l-2 border-teal"
                                  >
                                    "{r.answer}"
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {qs.options.map((opt, oi) => {
                                const stat = qs.stats.find((s) => s.answer === String(oi));
                                const count = stat?.count ?? 0;
                                const pct = totalQ > 0 ? Math.round((count / totalQ) * 100) : 0;
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
                              <p className="text-xs text-muted-foreground text-right">{totalQ} resposta(s)</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Secção 3: Pontos críticos pedagógicos */}
                {criticalPoints.length > 0 && (
                  <div className="av-card border-l-4 border-amber-400">
                    <h3 className="font-display font-bold text-navy mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Pontos Críticos
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Estas perguntas tiveram maior dispersão de respostas — indicam temas onde a turma está mais dividida e que merecem debate orientado.
                    </p>
                    <div className="space-y-3">
                      {criticalPoints.map((qs, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-navy">{qs.text.replace(/\?+$/, "")}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Dispersão elevada — {qs.total} resposta(s). Sugestão: retomar em debate presencial.
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Secção 4: Pistas de reflexão */}
                <div className="av-card bg-teal-light/30 border border-teal/20">
                  <h3 className="font-display font-bold text-navy mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal" /> Pistas para a Próxima Aula
                  </h3>
                  <ul className="space-y-2 text-sm text-navy">
                    {criticalPoints.length > 0 ? (
                      <>
                        <li className="flex items-start gap-2">
                          <span className="text-teal font-bold mt-0.5">→</span>
                          <span>Retoma as perguntas com maior dispersão em debate presencial, pedindo aos alunos que justifiquem a sua posição.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-teal font-bold mt-0.5">→</span>
                          <span>Usa as respostas abertas como ponto de partida para uma discussão em grupo sobre alternativas saudáveis.</span>
                        </li>
                      </>
                    ) : (
                      <li className="flex items-start gap-2">
                        <span className="text-teal font-bold mt-0.5">→</span>
                        <span>As respostas foram consistentes. Podes avançar para o tema seguinte ou aprofundar com uma pergunta aberta em aula.</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <span className="text-teal font-bold mt-0.5">→</span>
                      <span>Recorda aos alunos que não há respostas certas — o objetivo é refletir e construir perspetivas críticas.</span>
                    </li>
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
