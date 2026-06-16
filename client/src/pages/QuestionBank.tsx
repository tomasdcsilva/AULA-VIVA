import { useAuth } from "@/_core/hooks/useAuth";
import PedagogicBox from "@/components/PedagogicBox";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CATEGORIES: Record<string, string> = {
  stereotypes: "Estereótipos de Género",
  control: "Controlo",
  consent: "Consentimento",
  psychological_violence: "Violência Psicológica",
  healthy_relationships: "Relações Saudáveis",
};

const CATEGORY_COLORS: Record<string, string> = {
  stereotypes: "bg-purple-100 text-purple-800",
  control: "bg-red-100 text-red-800",
  consent: "bg-blue-100 text-blue-800",
  psychological_violence: "bg-orange-100 text-orange-800",
  healthy_relationships: "bg-green-100 text-green-800",
};

const SENSITIVITY: Record<string, string> = {
  low: "🟢 Baixa",
  medium: "🟡 Média",
  high: "🔴 Alta",
};

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Múltipla Escolha",
  scale: "Escala",
  open: "Resposta Aberta",
};

const DEFAULT_OPTIONS: Record<string, string[]> = {
  multiple_choice: ["Concordo totalmente", "Concordo", "Discordo", "Discordo totalmente"],
  scale: ["1", "2", "3", "4", "5"],
  open: [],
};

export default function QuestionBank() {
  const { isAuthenticated } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sensitivityFilter, setSensitivityFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Formulário
  const [text, setText] = useState("");
  const [type, setType] = useState<"multiple_choice" | "scale" | "open">("multiple_choice");
  const [category, setCategory] = useState<string>("healthy_relationships");
  const [sensitivityLevel, setSensitivityLevel] = useState<"low" | "medium" | "high">("low");
  const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS.multiple_choice);
  const [discipline, setDiscipline] = useState("");
  const [literaryWork, setLiteraryWork] = useState("");

  const { data: questions, refetch } = trpc.questions.list.useQuery(
    { category: categoryFilter || undefined, sensitivityLevel: sensitivityFilter || undefined },
    { enabled: isAuthenticated }
  );

  const createQuestion = trpc.questions.create.useMutation({
    onSuccess: () => {
      toast.success("Pergunta adicionada ao banco!");
      refetch();
      setShowForm(false);
      setText(""); setOptions(DEFAULT_OPTIONS.multiple_choice);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleTypeChange = (t: "multiple_choice" | "scale" | "open") => {
    setType(t);
    setOptions(DEFAULT_OPTIONS[t]);
  };

  const handleSubmit = () => {
    if (!text.trim()) { toast.error("O texto da pergunta é obrigatório."); return; }
    createQuestion.mutate({
      text,
      type,
      category: category as any,
      sensitivityLevel,
      options: type !== "open" ? options : undefined,
      discipline: discipline || undefined,
      literaryWork: literaryWork || undefined,
    });
  };

  return (
    <div className="av-section animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="av-section-title">Banco de Perguntas</h1>
          <p className="av-section-subtitle">Perguntas validadas organizadas por tema e nível de sensibilidade.</p>
        </div>
        {isAuthenticated && (
          <button onClick={() => setShowForm(!showForm)} className="av-btn-primary flex items-center gap-2 w-fit">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancelar" : "Nova Pergunta"}
          </button>
        )}
      </div>

      <PedagogicBox title="Sobre o Banco de Perguntas">
        Este banco reúne perguntas revistas por especialistas em igualdade de género e educação para a cidadania.
        Estão organizadas por cinco temas centrais e por nível de sensibilidade, para que o professor possa
        adaptar a atividade ao contexto e à maturidade da turma. Perguntas com sensibilidade alta requerem
        preparação prévia e um ambiente de confiança estabelecido.
      </PedagogicBox>

      {/* Formulário de nova pergunta */}
      {showForm && (
        <div className="av-card mt-6 animate-scale-in">
          <h2 className="text-lg font-display font-bold text-navy mb-4">Adicionar Pergunta</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">Texto da Pergunta *</label>
              <textarea
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card resize-none"
                rows={3}
                placeholder="Escreve a pergunta..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Tipo</label>
                <select
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
                  value={type}
                  onChange={(e) => handleTypeChange(e.target.value as any)}
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Tema</label>
                <select
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Sensibilidade</label>
                <select
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
                  value={sensitivityLevel}
                  onChange={(e) => setSensitivityLevel(e.target.value as any)}
                >
                  {Object.entries(SENSITIVITY).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {type !== "open" && (
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Opções de Resposta</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
                        value={opt}
                        onChange={(e) => {
                          const next = [...options];
                          next[i] = e.target.value;
                          setOptions(next);
                        }}
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => setOptions(options.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-600 p-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {type === "multiple_choice" && options.length < 6 && (
                    <button
                      onClick={() => setOptions([...options, ""])}
                      className="text-teal text-sm font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Adicionar opção
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Disciplina</label>
                <input
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
                  placeholder="Ex: Português"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Obra Literária</label>
                <input
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
                  placeholder="Ex: O Diário de Anne Frank"
                  value={literaryWork}
                  onChange={(e) => setLiteraryWork(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSubmit} disabled={createQuestion.isPending} className="av-btn-primary">
                Guardar Pergunta
              </button>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-navy font-semibold text-sm px-4 py-3">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mt-6 mb-4">
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
        {(categoryFilter || sensitivityFilter) && (
          <button
            onClick={() => { setCategoryFilter(""); setSensitivityFilter(""); }}
            className="text-sm text-teal font-semibold hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Limpar filtros
          </button>
        )}
      </div>

      {/* Lista de perguntas */}
      {!questions || questions.length === 0 ? (
        <div className="av-card text-center py-12">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma pergunta encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div key={q.id} className="av-card hover:shadow-md transition-shadow">
              <p className="font-medium text-navy mb-3 leading-relaxed">{q.text}</p>
              <div className="flex flex-wrap gap-2">
                <span className={`av-badge ${CATEGORY_COLORS[q.category] ?? "bg-gray-100 text-gray-700"}`}>
                  {CATEGORIES[q.category]}
                </span>
                <span className="av-badge bg-cream-dark text-navy">
                  {SENSITIVITY[q.sensitivityLevel]}
                </span>
                <span className="av-badge bg-cream-dark text-muted-foreground">
                  {TYPE_LABELS[q.type]}
                </span>
                {q.literaryWork && (
                  <span className="av-badge bg-gold-light text-amber-900">📖 {q.literaryWork}</span>
                )}
                {q.discipline && (
                  <span className="av-badge bg-cream-dark text-muted-foreground">📚 {q.discipline}</span>
                )}
              </div>
              {q.type !== "open" && q.options && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(JSON.parse(q.options) as string[]).map((opt, i) => (
                    <span key={i} className="text-xs bg-cream-dark text-navy px-2 py-1 rounded-lg">
                      {opt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
