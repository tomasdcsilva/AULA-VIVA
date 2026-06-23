import { useAuth } from "@/_core/hooks/useAuth";
import PedagogicBox from "@/components/PedagogicBox";
import { trpc } from "@/lib/trpc";
import { BookOpen, CheckCircle, Plus, Shield, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CATEGORIES: Record<string, string> = {
  stereotypes: "Estereótipos de Género",
  control: "Controlo",
  consent: "Consentimento",
  psychological_violence: "Violência Psicológica",
  healthy_relationships: "Relações Saudáveis",
  jealousy: "Ciúme",
  peer_pressure: "Pressão do Grupo",
  social_media: "Redes Sociais",
  masculinities: "Masculinidades",
  emotional_dependency: "Dependência Emocional",
};

const CATEGORY_COLORS: Record<string, string> = {
  stereotypes: "bg-purple-100 text-purple-800",
  control: "bg-red-100 text-red-800",
  consent: "bg-blue-100 text-blue-800",
  psychological_violence: "bg-orange-100 text-orange-800",
  healthy_relationships: "bg-green-100 text-green-800",
  jealousy: "bg-pink-100 text-pink-800",
  peer_pressure: "bg-yellow-100 text-yellow-800",
  social_media: "bg-sky-100 text-sky-800",
  masculinities: "bg-indigo-100 text-indigo-800",
  emotional_dependency: "bg-rose-100 text-rose-800",
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

const EDUCATION_LEVELS: Record<string, string> = {
  all: "Todos os níveis",
  "2nd_cycle": "2.º Ciclo (5.º-6.º ano)",
  "3rd_cycle": "3.º Ciclo (7.º-9.º ano)",
  secondary: "Ensino Secundário (10.º-12.º ano)",
};

const DEFAULT_OPTIONS: Record<string, string[]> = {
  multiple_choice: ["Concordo totalmente", "Concordo", "Discordo", "Discordo totalmente"],
  scale: ["1 – Discordo totalmente", "2", "3", "4", "5 – Concordo totalmente"],
  open: [],
};

export default function QuestionBank() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = (user as any)?.role === "admin";

  const [categoryFilter, setCategoryFilter] = useState("");
  const [sensitivityFilter, setSensitivityFilter] = useState("");
  const [educationFilter, setEducationFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPending, setShowPending] = useState(false);

  // Formulário
  const [text, setText] = useState("");
  const [type, setType] = useState<"multiple_choice" | "scale" | "open">("multiple_choice");
  const [category, setCategory] = useState<string>("healthy_relationships");
  const [sensitivityLevel, setSensitivityLevel] = useState<"low" | "medium" | "high">("low");
  const [educationLevel, setEducationLevel] = useState<string>("all");
  const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS.multiple_choice);
  const [correctOption, setCorrectOption] = useState<number | null>(null);
  const [discipline, setDiscipline] = useState("");
  const [literaryWork, setLiteraryWork] = useState("");

  const { data: questions, refetch } = trpc.questions.list.useQuery(
    {
      category: categoryFilter || undefined,
      sensitivityLevel: sensitivityFilter || undefined,
      educationLevel: educationFilter || undefined,
    },
    { enabled: isAuthenticated }
  );

  const { data: pendingQuestions, refetch: refetchPending } = trpc.questions.pending.useQuery(
    undefined,
    { enabled: isAdmin && showPending }
  );

  const createQuestion = trpc.questions.create.useMutation({
    onSuccess: (data) => {
      if (data.pending) {
        toast.success("Pergunta submetida para aprovação! O coordenador irá revê-la em breve.");
      } else {
        toast.success("Pergunta adicionada ao banco!");
      }
      refetch();
      setShowForm(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const approveQuestion = trpc.questions.approve.useMutation({
    onSuccess: () => { toast.success("Pergunta aprovada!"); refetch(); refetchPending(); },
    onError: (e) => toast.error(e.message),
  });

  const rejectQuestion = trpc.questions.reject.useMutation({
    onSuccess: () => { toast.success("Pergunta rejeitada."); refetchPending(); },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setText(""); setOptions(DEFAULT_OPTIONS.multiple_choice);
    setCorrectOption(null); setDiscipline(""); setLiteraryWork("");
    setType("multiple_choice"); setCategory("healthy_relationships");
    setSensitivityLevel("low"); setEducationLevel("all");
  };

  const handleTypeChange = (t: "multiple_choice" | "scale" | "open") => {
    setType(t);
    setOptions(DEFAULT_OPTIONS[t]);
    setCorrectOption(null);
  };

  const handleSubmit = () => {
    if (!text.trim()) { toast.error("O texto da pergunta é obrigatório."); return; }
    createQuestion.mutate({
      text,
      type,
      category: category as any,
      sensitivityLevel,
      educationLevel: educationLevel as any,
      options: type !== "open" ? options.filter(o => o.trim()) : undefined,
      correctOption: correctOption ?? undefined,
      discipline: discipline || undefined,
      literaryWork: literaryWork || undefined,
    });
  };

  const hasFilters = categoryFilter || sensitivityFilter || educationFilter;

  return (
    <div className="av-section animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="av-section-title">Banco de Perguntas</h1>
          <p className="av-section-subtitle">Perguntas organizadas por tema, nível de ensino e sensibilidade.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setShowPending(!showPending)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showPending ? "bg-amber-500 text-white" : "border border-amber-400 text-amber-700 hover:bg-amber-50"}`}
            >
              <Shield className="w-4 h-4" />
              Pendentes {pendingQuestions && pendingQuestions.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingQuestions.length}
                </span>
              )}
            </button>
          )}
          {isAuthenticated && (
            <button onClick={() => setShowForm(!showForm)} className="av-btn-primary flex items-center gap-2 w-fit">
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? "Cancelar" : "Propor Pergunta"}
            </button>
          )}
        </div>
      </div>

      <PedagogicBox title="Sobre o Banco de Perguntas">
        Este banco reúne perguntas organizadas por dez temas centrais — desde estereótipos de género até dependência emocional e redes sociais — e por nível de ensino, para que o professor possa adaptar a atividade ao contexto e à maturidade da turma. Professores podem propor novas perguntas, que ficam pendentes até aprovação pelo coordenador. Perguntas com sensibilidade alta requerem preparação prévia e um ambiente de confiança estabelecido.
      </PedagogicBox>

      {/* Painel de perguntas pendentes (admin) */}
      {isAdmin && showPending && (
        <div className="av-card mt-6 border-2 border-amber-300 animate-scale-in">
          <h2 className="text-lg font-display font-bold text-navy mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            Perguntas Pendentes de Aprovação
          </h2>
          {!pendingQuestions || pendingQuestions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Nenhuma pergunta pendente.</p>
          ) : (
            <div className="space-y-3">
              {pendingQuestions.map((q) => (
                <div key={q.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="font-medium text-navy mb-2">{q.text}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`av-badge ${CATEGORY_COLORS[q.category] ?? "bg-gray-100 text-gray-700"}`}>
                      {CATEGORIES[q.category]}
                    </span>
                    <span className="av-badge bg-cream-dark text-navy">{SENSITIVITY[q.sensitivityLevel]}</span>
                    <span className="av-badge bg-cream-dark text-muted-foreground">{TYPE_LABELS[q.type]}</span>
                    <span className="av-badge bg-blue-100 text-blue-800">{EDUCATION_LEVELS[q.educationLevel]}</span>
                  </div>
                  {q.options && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(JSON.parse(q.options) as string[]).map((opt, i) => (
                        <span key={i} className={`text-xs px-2 py-1 rounded-lg ${q.correctOption === i ? "bg-green-200 text-green-800 font-bold" : "bg-cream-dark text-navy"}`}>
                          {q.correctOption === i ? "✓ " : ""}{opt}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveQuestion.mutate({ id: q.id })}
                      disabled={approveQuestion.isPending}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Aprovar
                    </button>
                    <button
                      onClick={() => rejectQuestion.mutate({ id: q.id })}
                      disabled={rejectQuestion.isPending}
                      className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulário de nova pergunta */}
      {showForm && (
        <div className="av-card mt-6 animate-scale-in">
          <h2 className="text-lg font-display font-bold text-navy mb-1">
            {isAdmin ? "Adicionar Pergunta" : "Propor Pergunta"}
          </h2>
          {!isAdmin && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              A tua pergunta ficará pendente de aprovação pelo coordenador antes de aparecer no banco.
            </p>
          )}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <label className="block text-sm font-semibold text-navy mb-1">Nível de Ensino</label>
                <select
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                >
                  {Object.entries(EDUCATION_LEVELS).map(([k, v]) => (
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
                <label className="block text-sm font-semibold text-navy mb-2">
                  Opções de Resposta
                  {type === "multiple_choice" && (
                    <span className="text-xs text-muted-foreground font-normal ml-2">
                      (clica no círculo para marcar a resposta correta)
                    </span>
                  )}
                </label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      {type === "multiple_choice" && (
                        <button
                          type="button"
                          onClick={() => setCorrectOption(correctOption === i ? null : i)}
                          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${correctOption === i ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}`}
                          title="Marcar como resposta correta"
                        >
                          {correctOption === i && <span className="text-white text-xs flex items-center justify-center w-full h-full">✓</span>}
                        </button>
                      )}
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
                          onClick={() => {
                            setOptions(options.filter((_, j) => j !== i));
                            if (correctOption === i) setCorrectOption(null);
                          }}
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
                {isAdmin ? "Guardar Pergunta" : "Submeter para Aprovação"}
              </button>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-muted-foreground hover:text-navy font-semibold text-sm px-4 py-3">
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
          value={educationFilter}
          onChange={(e) => setEducationFilter(e.target.value)}
        >
          <option value="">Todos os níveis de ensino</option>
          {Object.entries(EDUCATION_LEVELS).filter(([k]) => k !== "all").map(([k, v]) => (
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
        {hasFilters && (
          <button
            onClick={() => { setCategoryFilter(""); setSensitivityFilter(""); setEducationFilter(""); }}
            className="text-sm text-teal font-semibold hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Limpar filtros
          </button>
        )}
      </div>

      {/* Contagem */}
      {questions && questions.length > 0 && (
        <p className="text-sm text-muted-foreground mb-3">
          {questions.length} pergunta{questions.length !== 1 ? "s" : ""} encontrada{questions.length !== 1 ? "s" : ""}
          {hasFilters ? " com os filtros selecionados" : " no banco"}
        </p>
      )}

      {/* Lista de perguntas */}
      {!questions || questions.length === 0 ? (
        <div className="av-card text-center py-12">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma pergunta encontrada{hasFilters ? " com estes filtros" : ""}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => {
            const opts = q.options ? (JSON.parse(q.options) as string[]) : [];
            return (
              <div key={q.id} className="av-card hover:shadow-md transition-shadow">
                <p className="font-medium text-navy mb-3 leading-relaxed">{q.text}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`av-badge ${CATEGORY_COLORS[q.category] ?? "bg-gray-100 text-gray-700"}`}>
                    {CATEGORIES[q.category]}
                  </span>
                  <span className="av-badge bg-blue-100 text-blue-800">
                    {EDUCATION_LEVELS[q.educationLevel] ?? q.educationLevel}
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
                {opts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {opts.map((opt, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2.5 py-1 rounded-lg border ${
                          q.correctOption === i
                            ? "bg-green-100 text-green-800 border-green-300 font-semibold"
                            : "bg-cream-dark text-navy border-transparent"
                        }`}
                      >
                        {q.correctOption === i ? "✓ " : ""}{opt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
