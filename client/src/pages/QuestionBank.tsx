import { useAuth } from "@/_core/hooks/useAuth";
import PedagogicBox from "@/components/PedagogicBox";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  CheckCircle,
  MessageSquare,
  Plus,
  Scale,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Tipos de perguntas pré-definidos (documentos do projeto) ─────────────────
const QUESTION_TEMPLATES = [
  {
    id: "behavior",
    icon: "🔍",
    label: "Reconhecimento de Comportamento",
    description: "O aluno identifica se um comportamento representa cuidado, ciúme, controlo ou violência.",
    example: "Este comportamento representa cuidado, ciúme, controlo ou violência?",
    type: "multiple_choice" as const,
    options: ["Cuidado", "Ciúme", "Controlo", "Violência"],
    category: "control",
    sensitivityLevel: "medium",
  },
  {
    id: "literary",
    icon: "📖",
    label: "Interpretação Literária",
    description: "O aluno analisa que ideia de género, poder ou relação está presente numa fala ou cena.",
    example: "Que ideia de género está presente nesta fala da personagem?",
    type: "multiple_choice" as const,
    options: ["Igualdade", "Estereótipo de género", "Dominação", "Empatia"],
    category: "stereotypes",
    sensitivityLevel: "low",
  },
  {
    id: "dilemma",
    icon: "⚖️",
    label: "Dilema Ético",
    description: "O aluno toma posição sobre o que a personagem deveria fazer numa situação difícil.",
    example: "O que deveria a personagem fazer nesta situação?",
    type: "multiple_choice" as const,
    options: ["Falar com alguém de confiança", "Ignorar a situação", "Confrontar diretamente", "Pedir ajuda profissional"],
    category: "healthy_relationships",
    sensitivityLevel: "medium",
  },
  {
    id: "scale",
    icon: "📊",
    label: "Escala de Concordância",
    description: "O aluno indica o grau de concordância com uma afirmação sobre relações ou comportamentos.",
    example: "Pedir passwords pode ser sinal de confiança numa relação.",
    type: "scale" as const,
    options: ["Concordo totalmente", "Concordo parcialmente", "Discordo parcialmente", "Discordo totalmente"],
    category: "control",
    sensitivityLevel: "medium",
  },
  {
    id: "open",
    icon: "✏️",
    label: "Resposta Aberta",
    description: "O aluno escreve livremente uma alternativa, reflexão ou proposta de solução.",
    example: "Que alternativa seria mais respeitadora nesta cena?",
    type: "open" as const,
    options: [],
    category: "healthy_relationships",
    sensitivityLevel: "low",
  },
];

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
  scale: "Escala de Concordância",
  open: "Resposta Aberta",
};

const EDUCATION_LEVELS: Record<string, string> = {
  all: "Todos os níveis",
  "2nd_cycle": "2.º Ciclo (5.º-6.º ano)",
  "3rd_cycle": "3.º Ciclo (7.º-9.º ano)",
  secondary: "Ensino Secundário (10.º-12.º ano)",
};

export default function QuestionBank() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = (user as any)?.role === "admin";

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [educationFilter, setEducationFilter] = useState("");

  // Formulário (preenchido a partir do template ou manualmente)
  const [text, setText] = useState("");
  const [type, setType] = useState<"multiple_choice" | "scale" | "open">("multiple_choice");
  const [category, setCategory] = useState<string>("healthy_relationships");
  const [sensitivityLevel, setSensitivityLevel] = useState<"low" | "medium" | "high">("low");
  const [educationLevel, setEducationLevel] = useState<string>("all");
  const [options, setOptions] = useState<string[]>([]);
  const [discipline, setDiscipline] = useState("");
  const [literaryWork, setLiteraryWork] = useState("");

  const { data: questions, refetch } = trpc.questions.list.useQuery(
    {
      category: categoryFilter || undefined,
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
      if ((data as any).pending) {
        toast.success("Pergunta submetida para aprovação! O coordenador irá revê-la em breve.");
      } else {
        toast.success("Pergunta adicionada ao banco!");
      }
      refetch();
      closeAllForms();
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

  const closeAllForms = () => {
    setSelectedTemplate(null);
    setShowCustomForm(false);
    setText(""); setOptions([]); setDiscipline(""); setLiteraryWork("");
    setType("multiple_choice"); setCategory("healthy_relationships");
    setSensitivityLevel("low"); setEducationLevel("all");
  };

  const openTemplate = (tpl: typeof QUESTION_TEMPLATES[0]) => {
    setSelectedTemplate(tpl.id);
    setShowCustomForm(false);
    setText("");
    setType(tpl.type);
    setCategory(tpl.category);
    setSensitivityLevel(tpl.sensitivityLevel as any);
    setOptions([...tpl.options]);
    setEducationLevel("all");
    setDiscipline(""); setLiteraryWork("");
  };

  const openCustomForm = () => {
    setShowCustomForm(true);
    setSelectedTemplate(null);
    setText(""); setOptions(["", ""]); setType("multiple_choice");
    setCategory("healthy_relationships"); setSensitivityLevel("low");
    setEducationLevel("all"); setDiscipline(""); setLiteraryWork("");
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
      discipline: discipline || undefined,
      literaryWork: literaryWork || undefined,
    });
  };

  const activeTemplate = QUESTION_TEMPLATES.find(t => t.id === selectedTemplate);
  const showForm = !!selectedTemplate || showCustomForm;
  const hasFilters = categoryFilter || educationFilter;

  return (
    <div className="av-section animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="av-section-title">Banco de Perguntas</h1>
          <p className="av-section-subtitle">Perguntas organizadas por tipo e nível de ensino.</p>
        </div>
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
      </div>

      <PedagogicBox title="Como usar o Banco de Perguntas">
        Escolhe um dos cinco tipos de pergunta abaixo — cada um foi desenhado para desenvolver uma competência específica nos alunos. Escreve o texto adaptado à obra ou tema que estás a trabalhar em aula e adiciona-a ao banco para usar nos teus quizzes.
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
                        <span key={i} className="text-xs px-2 py-1 rounded-lg bg-cream-dark text-navy">{opt}</span>
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

      {/* ── 5 tipos de perguntas pré-definidos ── */}
      {!showForm && (
        <div className="mt-6">
          <h2 className="text-base font-display font-bold text-navy mb-3">Propor uma nova pergunta</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Escolhe o tipo de pergunta que melhor se adapta ao que queres trabalhar em aula:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {QUESTION_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => openTemplate(tpl)}
                className="av-card text-left hover:border-teal hover:shadow-md transition-all group border-2 border-transparent"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy text-sm group-hover:text-teal transition-colors">{tpl.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tpl.description}</p>
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 mt-2 italic">
                      Ex: "{tpl.example}"
                    </p>
                  </div>
                </div>
              </button>
            ))}
            {/* Botão de pergunta livre */}
            <button
              onClick={openCustomForm}
              className="av-card text-left hover:border-teal hover:shadow-md transition-all group border-2 border-dashed border-border"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl"><MessageSquare className="w-6 h-6 text-teal mt-0.5" /></span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy text-sm group-hover:text-teal transition-colors">Pergunta Livre</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Cria uma pergunta completamente personalizada, com o tipo e opções que quiseres.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── Formulário (template ou livre) ── */}
      {showForm && (
        <div className="av-card mt-6 animate-scale-in border-2 border-teal/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-display font-bold text-navy">
                {activeTemplate ? (
                  <span className="flex items-center gap-2">{activeTemplate.icon} {activeTemplate.label}</span>
                ) : (
                  "Pergunta Livre"
                )}
              </h2>
              {activeTemplate && (
                <p className="text-xs text-muted-foreground mt-0.5">{activeTemplate.description}</p>
              )}
            </div>
            <button onClick={closeAllForms} className="text-muted-foreground hover:text-navy p-1">
              <X className="w-5 h-5" />
            </button>
          </div>



          <div className="space-y-4">
            {/* Texto da pergunta */}
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">
                {activeTemplate?.type === "scale" ? "Afirmação *" : "Texto da Pergunta *"}
              </label>
              {activeTemplate && (
                <p className="text-xs text-muted-foreground mb-1.5 italic">Exemplo: "{activeTemplate.example}"</p>
              )}
              <textarea
                className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card resize-none"
                rows={3}
                placeholder={activeTemplate ? `Adapta ao teu contexto de aula...` : "Escreve a pergunta..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {/* Opções — apenas para múltipla escolha livre (não escala) */}
            {showCustomForm && type !== "open" && type !== "scale" && (
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Opções de Resposta</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
                        value={opt}
                        placeholder={`Opção ${i + 1}`}
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
                  {options.length < 6 && (
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

            {/* Opções de escala — fixas, não editáveis */}
            {(activeTemplate?.type === "scale" || (!activeTemplate && type === "scale")) && (
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Opções (fixas)</label>
                <div className="space-y-1.5">
                  {["Concordo totalmente", "Concordo parcialmente", "Discordo parcialmente", "Discordo totalmente"].map((opt, i) => (
                    <div key={i} className="flex items-center gap-2 bg-cream-dark/50 rounded-lg px-3 py-2">
                      <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm text-navy">{opt}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">As opções de escala são sempre as mesmas para garantir consistência.</p>
              </div>
            )}

            {/* Opções de múltipla escolha template — mostrar como informação */}
            {activeTemplate?.type === "multiple_choice" && (
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Opções sugeridas</label>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt, i) => (
                    <input
                      key={i}
                      className="border border-border rounded-lg px-3 py-1.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal min-w-0 w-40"
                      value={opt}
                      onChange={(e) => {
                        const next = [...options];
                        next[i] = e.target.value;
                        setOptions(next);
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Podes editar as opções para se adaptarem ao contexto da obra.</p>
              </div>
            )}

            {/* Metadados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="block text-sm font-semibold text-navy mb-1">Obra Literária</label>
                <input
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
                  placeholder="Ex: O Diário de Anne Frank"
                  value={literaryWork}
                  onChange={(e) => setLiteraryWork(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Disciplina</label>
                <input
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
                  placeholder="Ex: Português"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                />
              </div>
            </div>

            {/* Tipo (apenas para pergunta livre) */}
            {showCustomForm && (
              <div>
                <label className="block text-sm font-semibold text-navy mb-1">Tipo de Pergunta</label>
                <select
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal"
                  value={type}
                  onChange={(e) => {
                    const t = e.target.value as any;
                    setType(t);
                    if (t === "scale") setOptions(["Concordo totalmente", "Concordo parcialmente", "Discordo parcialmente", "Discordo totalmente"]);
                    else if (t === "open") setOptions([]);
                    else setOptions(["", ""]);
                  }}
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={handleSubmit} disabled={createQuestion.isPending} className="av-btn-primary">
                {isAdmin ? "Guardar Pergunta" : "Submeter para Aprovação"}
              </button>
              <button onClick={closeAllForms} className="text-muted-foreground hover:text-navy font-semibold text-sm px-4 py-3">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Banco existente ── */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-display font-bold text-navy">
            Perguntas no Banco
            {questions && <span className="text-muted-foreground font-normal text-sm ml-2">({questions.length})</span>}
          </h2>
          <div className="flex flex-wrap gap-2">
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
              <option value="">Todos os níveis</option>
              {Object.entries(EDUCATION_LEVELS).filter(([k]) => k !== "all").map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            {hasFilters && (
              <button
                onClick={() => { setCategoryFilter(""); setEducationFilter(""); }}
                className="text-sm text-teal font-semibold hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>
        </div>

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
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">
                      {QUESTION_TEMPLATES.find(t => t.type === q.type)?.icon ?? "❓"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy mb-2 leading-relaxed">{q.text}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`av-badge ${CATEGORY_COLORS[q.category] ?? "bg-gray-100 text-gray-700"}`}>
                          {CATEGORIES[q.category]}
                        </span>
                        <span className="av-badge bg-blue-100 text-blue-800">
                          {EDUCATION_LEVELS[q.educationLevel] ?? q.educationLevel}
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
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {opts.map((opt, i) => (
                            <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-cream-dark text-navy border border-transparent">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
