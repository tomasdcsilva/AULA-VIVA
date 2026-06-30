import { useAuth } from "@/_core/hooks/useAuth";
import PedagogicBox from "@/components/PedagogicBox";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  Plus,
  Play,
  Clock,
  Trash2,
  Copy,
  Gamepad2,
  BarChart2,
  Pencil,
  X,
  CalendarDays,
  Users2,
  School,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  waiting:       { label: "A aguardar", color: "bg-amber-100 text-amber-800" },
  active:        { label: "Ativa", color: "bg-green-100 text-green-800" },
  voting_closed: { label: "Votação encerrada", color: "bg-blue-100 text-blue-800" },
  chat_open:     { label: "Chat aberto", color: "bg-teal-light text-teal-dark" },
  closed:        { label: "Encerrada", color: "bg-gray-100 text-gray-600" },
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface LaunchModalProps {
  quiz: { id: number; title: string; className?: string | null; discipline?: string | null };
  onClose: () => void;
  onLaunch: (data: { quizId: number; school?: string; className?: string; sessionDate?: string; mode: "kahoot" }) => void;
  isPending: boolean;
}

function LaunchModal({ quiz, onClose, onLaunch, isPending }: LaunchModalProps) {
  const [school, setSchool] = useState("");
  const [className, setClassName] = useState(quiz.className ?? "");
  const [sessionDate, setSessionDate] = useState(todayISO());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLaunch({
      quizId: quiz.id,
      school: school || undefined,
      className: className || undefined,
      sessionDate: sessionDate || undefined,
      mode: "kahoot",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-navy transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#e21b3c]/10 rounded-xl flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-[#e21b3c]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-navy text-lg">Lançar Sessão</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[220px]">{quiz.title}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          Confirma os dados da turma antes de iniciar. Estes dados aparecerão no relatório pedagógico.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1 flex items-center gap-1.5">
              <School className="w-4 h-4 text-teal" /> Escola
            </label>
            <input
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-background"
              placeholder="Ex: EB 2,3 de Pesqueira"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1 flex items-center gap-1.5">
              <Users2 className="w-4 h-4 text-teal" /> Turma
            </label>
            <input
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-background"
              placeholder="Ex: 9.º A"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-teal" /> Data da Sessão
            </label>
            <input
              type="date"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-background"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border rounded-xl py-2.5 text-sm font-semibold text-navy hover:bg-cream-dark transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-[#e21b3c] hover:bg-[#c01532] text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Gamepad2 className="w-4 h-4" />
              )}
              Iniciar Jogo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: quizzes, refetch: refetchQuizzes } = trpc.quizzes.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: sessions } = trpc.sessions.list.useQuery(undefined, { enabled: isAuthenticated });
  const [launchQuiz, setLaunchQuiz] = useState<{ id: number; title: string; className?: string | null; discipline?: string | null } | null>(null);

  const deleteSession = trpc.sessions.delete.useMutation({
    onSuccess: () => { toast.success("Sessão eliminada."); },
    onError: (e) => toast.error(e.message),
  });

  const handleDeleteSession = (id: number) => {
    if (confirm("Eliminar esta sessão? Todos os dados (respostas e chat) serão apagados.")) {
      deleteSession.mutate({ id });
    }
  };

  const deleteQuiz = trpc.quizzes.delete.useMutation({
    onSuccess: () => { refetchQuizzes(); toast.success("Quiz eliminado."); },
    onError: (e) => toast.error(e.message),
  });
  const duplicateQuiz = trpc.quizzes.duplicate.useMutation({
    onSuccess: () => { refetchQuizzes(); toast.success("Quiz duplicado!"); },
    onError: (e) => toast.error(e.message),
  });
  const createKahootSession = trpc.sessions.create.useMutation({
    onSuccess: (s) => { setLaunchQuiz(null); navigate(`/kahoot/host/${s.id}`); },
    onError: (e) => toast.error(e.message),
  });

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Eliminar o quiz "${title}"? Esta ação não pode ser desfeita.`)) {
      deleteQuiz.mutate({ id });
    }
  };

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
  const completedSessions = sessions?.filter((s) => s.status === "closed") ?? [];

  return (
    <div className="av-section animate-fade-in">
      {/* Modal de lançamento */}
      {launchQuiz && (
        <LaunchModal
          quiz={launchQuiz}
          onClose={() => setLaunchQuiz(null)}
          onLaunch={(data) => createKahootSession.mutate(data)}
          isPending={createKahootSession.isPending}
        />
      )}

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
      <PedagogicBox title="Como funciona o Painel do Professor" dismissKey="dashboard_howto">
        Aqui podes criar quizzes e lançá-los em aula. Clica em <strong>Jogar</strong> para lançar o quiz em modo
        interativo: aparece um código que os alunos introduzem no telemóvel para responder anonimamente.
        Depois da sessão, clica em <strong>Gerir</strong> para ver as estatísticas e as respostas da turma.
      </PedagogicBox>

      {/* Jogo em curso */}
      {activeSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-display font-bold text-navy mb-3 flex items-center gap-2">
            <Play className="w-5 h-5 text-green-600" /> Jogo em Curso
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((s) => (
              <div key={s.id} className="av-card-teal flex items-center justify-between gap-4 border-l-4 border-green-500">
                <div>
                  <span className="av-badge bg-green-100 text-green-800 mb-2 flex items-center gap-1 w-fit">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    A decorrer
                  </span>
                  <p className="font-semibold text-navy text-base mb-0.5">{s.quizTitle ?? s.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.className && <span className="text-teal-700 font-medium">{s.className}</span>}
                    {s.className && " · "}
                    {s.participantCount} aluno(s) ligado(s)
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">Código: {s.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/kahoot/host/${s.id}`} className="av-btn-primary text-sm px-4 py-2">
                    Continuar
                  </Link>
                  <button
                    onClick={() => handleDeleteSession(s.id)}
                    disabled={deleteSession.isPending}
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    title="Eliminar sessão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
              <div key={q.id} className="av-card hover:shadow-md transition-shadow flex flex-col">
                {/* Cabeçalho do cartão */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-navy truncate">{q.title}</h3>
                    {q.literaryWork && (
                      <p className="text-xs text-muted-foreground mt-0.5">📖 {q.literaryWork}</p>
                    )}
                  </div>
                  {/* Ações secundárias: duplicar e eliminar */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => duplicateQuiz.mutate({ id: q.id })}
                      className="p-2 text-muted-foreground hover:text-teal transition-colors rounded-lg hover:bg-teal-light"
                      title="Duplicar quiz"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id, q.title)}
                      disabled={deleteQuiz.isPending}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Eliminar quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4 text-xs text-muted-foreground">
                  {q.discipline && <span className="av-badge bg-cream-dark text-navy">📚 {q.discipline}</span>}
                  {q.yearGroup && <span className="av-badge bg-cream-dark text-navy">🎓 {q.yearGroup}</span>}
                  {q.className && <span className="av-badge bg-cream-dark text-navy">👥 {q.className}</span>}
                </div>

                {/* Botão principal: Jogar */}
                <button
                  onClick={() => setLaunchQuiz(q)}
                  className="w-full bg-[#e21b3c] hover:bg-[#c01532] active:scale-95 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-base transition-all mb-3 shadow-sm"
                >
                  <Gamepad2 className="w-5 h-5" /> Jogar
                </button>

                {/* Botões secundários: Editar e Gerir */}
                <div className="flex gap-2">
                  <Link
                    href={`/quiz/${q.id}/edit`}
                    className="flex-1 text-center text-sm font-semibold text-teal border border-teal rounded-lg py-2 px-3 hover:bg-teal hover:text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </Link>
                  <Link
                    href={`/quiz/${q.id}/stats`}
                    className="flex-1 text-center text-sm font-semibold text-navy border border-navy/20 rounded-lg py-2 px-3 hover:bg-navy hover:text-white transition-colors flex items-center justify-center gap-1"
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Gerir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Jogos Realizados */}
      {completedSessions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-display font-bold text-navy mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" /> Jogos Realizados
          </h2>
          <div className="space-y-3">
            {completedSessions.slice(0, 5).map((s) => (
              <div key={s.id} className="av-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cream-dark flex items-center justify-center flex-shrink-0">
                    <Gamepad2 className="w-5 h-5 text-navy" />
                  </div>
                  <div>
                    <p className="font-semibold text-navy text-sm">{s.quizTitle ?? s.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {(s as any).className && <span className="font-medium text-teal-700">{(s as any).className}</span>}
                      {(s as any).className && " · "}
                      {new Date(s.createdAt).toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}
                      {" · "}
                      <span className="font-semibold text-navy">{s.participantCount} aluno(s)</span>
                    </p>
                  </div>
                </div>
                <Link
                  href={`/quiz/${s.quizId}/stats?session=${s.id}`}
                  className="text-xs font-semibold text-teal border border-teal rounded-lg py-1.5 px-3 hover:bg-teal hover:text-white transition-colors w-fit"
                >
                  Ver Relatório
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
