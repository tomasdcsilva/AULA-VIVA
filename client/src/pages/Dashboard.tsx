import { useAuth } from "@/_core/hooks/useAuth";
import PedagogicBox from "@/components/PedagogicBox";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus, Play, Clock, CheckCircle, Trash2, Copy, Gamepad2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting:       { label: "A aguardar", color: "bg-amber-100 text-amber-800" },
  active:        { label: "Ativa", color: "bg-green-100 text-green-800" },
  voting_closed: { label: "Votação encerrada", color: "bg-blue-100 text-blue-800" },
  chat_open:     { label: "Chat aberto", color: "bg-teal-light text-teal-dark" },
  closed:        { label: "Encerrada", color: "bg-gray-100 text-gray-600" },
};

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: quizzes, refetch: refetchQuizzes } = trpc.quizzes.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: sessions } = trpc.sessions.list.useQuery(undefined, { enabled: isAuthenticated });
  const deleteQuiz = trpc.quizzes.delete.useMutation({ onSuccess: () => refetchQuizzes() });
  const duplicateQuiz = trpc.quizzes.duplicate.useMutation({
    onSuccess: () => { refetchQuizzes(); toast.success("Quiz duplicado!"); },
    onError: (e) => toast.error(e.message),
  });
  const createKahootSession = trpc.sessions.create.useMutation({
    onSuccess: (s) => {
      navigate(`/kahoot/host/${s.id}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const handleLaunchKahoot = (quizId: number) => {
    createKahootSession.mutate({ quizId, mode: "kahoot" });
  };
  const createSession = trpc.sessions.create.useMutation({
    onSuccess: (s) => {
      toast.success(`Sessão criada! Código: ${s.code}`);
      refetchQuizzes();
    },
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <BookOpen className="w-12 h-12 text-teal mx-auto mb-4" />
      <h2 className="text-2xl font-display font-bold text-navy mb-2">Área do Professor</h2>
      <p className="text-muted-foreground mb-6">Inicia sessão para aceder ao painel e criar quizzes.</p>
      <a href="/login" className="av-btn-primary">Entrar como Professor</a>
    </div>
  );

  const activeSessions = sessions?.filter((s) => s.status !== "closed") ?? [];
  const recentSessions = sessions?.slice(0, 5) ?? [];

  return (
    <div className="av-section animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="av-section-title">Painel do Professor</h1>
          <p className="av-section-subtitle">Gere os teus quizzes e sessões de aula.</p>
        </div>
        <Link href="/quiz/new" className="av-btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" /> Novo Quiz
        </Link>
      </div>

      {/* Explicação pedagógica */}
      <PedagogicBox title="Como funciona o Painel do Professor">
        Aqui podes criar quizzes associados a obras literárias, lançar sessões de aula com um código temporário
        e acompanhar os resultados em tempo real. Cada sessão gera um código único que os alunos usam para
        participar anonimamente — sem criar conta nem revelar a identidade.
      </PedagogicBox>

      {/* Sessões ativas */}
      {activeSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-display font-bold text-navy mb-3 flex items-center gap-2">
            <Play className="w-5 h-5 text-teal" /> Sessões Ativas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((s) => (
              <div key={s.id} className="av-card-teal flex items-center justify-between gap-4">
                <div>
                  <span className={`av-badge ${STATUS_LABELS[s.status]?.color ?? "bg-gray-100 text-gray-600"} mb-2`}>
                    {STATUS_LABELS[s.status]?.label}
                  </span>
                  <p className="font-bold text-navy text-lg tracking-widest">{s.code}</p>
                  <p className="text-xs text-muted-foreground">{s.participantCount} participante(s)</p>
                </div>
                <Link href={`/session/${s.id}`} className="av-btn-primary text-sm px-4 py-2">
                  Gerir
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quizzes */}
      <div className="mt-8">
        <h2 className="text-lg font-display font-bold text-navy mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-teal" /> Os Meus Quizzes
        </h2>
        {!quizzes || quizzes.length === 0 ? (
          <div className="av-card text-center py-12">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Ainda não tens quizzes criados.</p>
            <Link href="/quiz/new" className="av-btn-primary">Criar o Primeiro Quiz</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((q) => (
              <div key={q.id} className="av-card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-display font-bold text-navy">{q.title}</h3>
                    {q.literaryWork && (
                      <p className="text-xs text-muted-foreground mt-0.5">📖 {q.literaryWork}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => duplicateQuiz.mutate({ id: q.id })}
                      className="p-2 text-muted-foreground hover:text-teal transition-colors rounded-lg hover:bg-teal-light"
                      title="Duplicar quiz"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Eliminar este quiz?")) deleteQuiz.mutate({ id: q.id });
                      }}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                  {q.discipline && <span className="av-badge bg-cream-dark text-navy">📚 {q.discipline}</span>}
                  {q.yearGroup && <span className="av-badge bg-cream-dark text-navy">🎓 {q.yearGroup}</span>}
                  {q.className && <span className="av-badge bg-cream-dark text-navy">👥 {q.className}</span>}
                </div>
                <div className="flex gap-2">
                  <Link href={`/quiz/${q.id}/edit`} className="text-center text-sm font-semibold text-teal border border-teal rounded-lg py-2 px-3 hover:bg-teal hover:text-white transition-colors">
                    Editar
                  </Link>
                  <button
                    onClick={() => createSession.mutate({ quizId: q.id })}
                    disabled={createSession.isPending}
                    className="flex-1 av-btn-primary text-sm py-2 flex items-center justify-center gap-1"
                  >
                    <Play className="w-3 h-3" /> Sessão
                  </button>
                  <button
                    onClick={() => handleLaunchKahoot(q.id)}
                    disabled={createKahootSession.isPending}
                    title="Lançar em Modo Jogo (Kahoot)"
                    className="bg-[#e21b3c] hover:bg-[#c01532] text-white text-sm py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 font-semibold"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" /> Jogo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sessões recentes */}
      {recentSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-display font-bold text-navy mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" /> Sessões Recentes
          </h2>
          <div className="av-card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Código</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Participantes</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-cream-dark/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-navy">{s.code}</td>
                    <td className="px-4 py-3">
                      <span className={`av-badge ${STATUS_LABELS[s.status]?.color ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[s.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.participantCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("pt-PT")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/session/${s.id}`} className="text-teal font-semibold hover:underline text-xs">
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
