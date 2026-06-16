import { useAuth } from "@/_core/hooks/useAuth";
import PedagogicBox from "@/components/PedagogicBox";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

const CATEGORIES: Record<string, string> = {
  stereotypes: "Estereótipos de Género",
  control: "Controlo",
  consent: "Consentimento",
  psychological_violence: "Violência Psicológica",
  healthy_relationships: "Relações Saudáveis",
};

const SENSITIVITY: Record<string, string> = {
  low: "🟢 Baixa",
  medium: "🟡 Média",
  high: "🔴 Alta",
};

export default function QuizEditor() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== "new";
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [literaryWork, setLiteraryWork] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [className, setClassName] = useState("");
  const [showResultsImmediately, setShowResultsImmediately] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sensitivityFilter, setSensitivityFilter] = useState("");

  const { data: existingQuiz } = trpc.quizzes.get.useQuery(
    { id: Number(id) },
    { enabled: isEdit && isAuthenticated }
  );

  const { data: questions } = trpc.questions.list.useQuery(
    { category: categoryFilter || undefined, sensitivityLevel: sensitivityFilter || undefined },
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (existingQuiz) {
      setTitle(existingQuiz.title);
      setDescription(existingQuiz.description ?? "");
      setLiteraryWork(existingQuiz.literaryWork ?? "");
      setDiscipline(existingQuiz.discipline ?? "");
      setYearGroup(existingQuiz.yearGroup ?? "");
      setClassName(existingQuiz.className ?? "");
      setShowResultsImmediately(existingQuiz.showResultsImmediately);
      setSelectedIds(JSON.parse(existingQuiz.questionIds ?? "[]"));
    }
  }, [existingQuiz]);

  const createQuiz = trpc.quizzes.create.useMutation({
    onSuccess: () => { toast.success("Quiz criado!"); navigate("/dashboard"); },
    onError: (e) => toast.error(e.message),
  });

  const updateQuiz = trpc.quizzes.update.useMutation({
    onSuccess: () => { toast.success("Quiz atualizado!"); navigate("/dashboard"); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!title.trim()) { toast.error("O título é obrigatório."); return; }
    if (selectedIds.length === 0) { toast.error("Seleciona pelo menos uma pergunta."); return; }
    const payload = { title, description, literaryWork, discipline, yearGroup, className, showResultsImmediately, questionIds: selectedIds };
    if (isEdit) updateQuiz.mutate({ id: Number(id), ...payload });
    else createQuiz.mutate(payload);
  };

  const toggleQuestion = (qId: number) => {
    setSelectedIds((prev) =>
      prev.includes(qId) ? prev.filter((x) => x !== qId) : [...prev, qId]
    );
  };

  return (
    <div className="av-section animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-muted-foreground hover:text-navy transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="av-section-title">{isEdit ? "Editar Quiz" : "Novo Quiz"}</h1>
          <p className="av-section-subtitle">Configura o quiz e seleciona as perguntas do banco validado.</p>
        </div>
      </div>

      <PedagogicBox title="Sobre a criação de quizzes">
        Cada quiz é associado a uma obra literária e a uma turma específica. As perguntas são retiradas do banco
        validado por especialistas em igualdade de género. Podes filtrar por tema e nível de sensibilidade para
        adaptar o quiz ao contexto da tua turma.
      </PedagogicBox>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Coluna esquerda: metadados */}
        <div className="space-y-5">
          <h2 className="text-lg font-display font-bold text-navy">Informações do Quiz</h2>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Título *</label>
            <input
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card"
              placeholder="Ex: Relações tóxicas em 'Ana Karenina'"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Obra Literária</label>
            <input
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card"
              placeholder="Ex: A Culpa é das Estrelas"
              value={literaryWork}
              onChange={(e) => setLiteraryWork(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">Disciplina</label>
              <input
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card"
                placeholder="Ex: Português"
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">Ano Letivo</label>
              <input
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card"
                placeholder="Ex: 9.º ano"
                value={yearGroup}
                onChange={(e) => setYearGroup(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Turma</label>
            <input
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card"
              placeholder="Ex: 9.º A"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Descrição</label>
            <textarea
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card resize-none"
              rows={3}
              placeholder="Contexto pedagógico desta atividade..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-cream-dark rounded-xl">
            <input
              type="checkbox"
              id="showResults"
              checked={showResultsImmediately}
              onChange={(e) => setShowResultsImmediately(e.target.checked)}
              className="w-4 h-4 accent-teal"
            />
            <label htmlFor="showResults" className="text-sm font-semibold text-navy cursor-pointer">
              Mostrar resultados em tempo real aos alunos
            </label>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-2">
              {selectedIds.length} pergunta(s) selecionada(s)
            </p>
            <button
              onClick={handleSave}
              disabled={createQuiz.isPending || updateQuiz.isPending}
              className="av-btn-primary w-full flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isEdit ? "Guardar Alterações" : "Criar Quiz"}
            </button>
          </div>
        </div>

        {/* Coluna direita: banco de perguntas */}
        <div>
          <h2 className="text-lg font-display font-bold text-navy mb-3">Banco de Perguntas</h2>

          {/* Filtros */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <select
              className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todos os temas</option>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
              value={sensitivityFilter}
              onChange={(e) => setSensitivityFilter(e.target.value)}
            >
              <option value="">Toda a sensibilidade</option>
              {Object.entries(SENSITIVITY).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {!questions || questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma pergunta encontrada. Adiciona perguntas no{" "}
                <Link href="/questions" className="text-teal underline">Banco de Perguntas</Link>.
              </div>
            ) : (
              questions.map((q) => {
                const selected = selectedIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestion(q.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selected
                        ? "border-teal bg-teal-light"
                        : "border-border bg-card hover:border-teal/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        selected ? "bg-teal border-teal" : "border-gray-300"
                      }`}>
                        {selected && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy leading-relaxed">{q.text}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="av-badge bg-teal-light text-teal-dark text-xs">
                            {CATEGORIES[q.category]}
                          </span>
                          <span className="av-badge bg-cream-dark text-navy text-xs">
                            {SENSITIVITY[q.sensitivityLevel]}
                          </span>
                          <span className="av-badge bg-cream-dark text-muted-foreground text-xs">
                            {q.type === "multiple_choice" ? "Múltipla escolha" : q.type === "scale" ? "Escala" : "Resposta aberta"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
