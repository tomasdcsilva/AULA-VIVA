import { useAuth } from "@/_core/hooks/useAuth";
import PedagogicBox from "@/components/PedagogicBox";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus, Trash2, ArrowLeft, Save, Sparkles, User, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

const CATEGORIES: Record<string, string> = {
  stereotypes: "Estereótipos de Género",
  control: "Controlo",
  consent: "Consentimento",
  psychological_violence: "Violência Psicológica",
  healthy_relationships: "Relações Saudáveis",
  jealousy: "Ciúme e Possessividade",
  peer_pressure: "Pressão do Grupo",
  social_media: "Redes Sociais e Identidade",
  masculinities: "Masculinidades",
  emotional_dependency: "Dependência Emocional",
};

const SENSITIVITY: Record<string, string> = {
  low: "🟢 Baixa",
  medium: "🟡 Média",
  high: "🔴 Alta",
};

const EMPTY_NEW_Q = {
  text: "",
  type: "multiple_choice" as "multiple_choice" | "scale" | "open",
  category: "stereotypes" as string,
  sensitivityLevel: "low" as "low" | "medium" | "high",
  educationLevel: "all" as "3rd_cycle" | "secondary" | "all",
  options: ["", "", "", ""],
};

interface QuizEditorProps {
  id?: string;
}

export default function QuizEditor({ id: propId }: QuizEditorProps = {}) {
  const params = useParams<{ id: string }>();
  const id = propId ?? params.id ?? "new";
  const isEdit = id !== "new";
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  // Metadados do quiz
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [literaryWork, setLiteraryWork] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [theme, setTheme] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [className, setClassName] = useState("");
  const [showResultsImmediately, setShowResultsImmediately] = useState(false);
  const [hideAllResults, setHideAllResults] = useState(false);
  const [hiddenResultsIds, setHiddenResultsIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Filtros do banco
  const [categoryFilter, setCategoryFilter] = useState("");
  const [educationLevelFilter, setEducationLevelFilter] = useState("");
  const [sensitivityFilter, setSensitivityFilter] = useState("");
  const [bankTab, setBankTab] = useState<"suggestions" | "mine">("suggestions");

  // Formulário de nova pergunta
  const [showNewQForm, setShowNewQForm] = useState(false);
  const [newQ, setNewQ] = useState({ ...EMPTY_NEW_Q });

  const numericId = isEdit ? Number(id) : 0;
  const validId = isEdit && !isNaN(numericId) && numericId > 0;

  const { data: existingQuiz } = trpc.quizzes.get.useQuery(
    { id: numericId },
    { enabled: validId && isAuthenticated }
  );

  // Sugestões do sistema
  const { data: suggestions } = trpc.questions.suggestions.useQuery(
    { category: categoryFilter || undefined, educationLevel: educationLevelFilter || undefined, sensitivityLevel: sensitivityFilter || undefined },
    { enabled: isAuthenticated }
  );

  // Perguntas do professor
  const { data: myQuestions, refetch: refetchMine } = trpc.questions.myQuestions.useQuery(
    { category: categoryFilter || undefined, educationLevel: educationLevelFilter || undefined },
    { enabled: isAuthenticated }
  );

  const utils = trpc.useUtils();

  useEffect(() => {
    if (existingQuiz) {
      setDataLoaded(false);
      setTitle(existingQuiz.title);
      setDescription(existingQuiz.description ?? "");
      setLiteraryWork(existingQuiz.literaryWork ?? "");
      setExcerpt((existingQuiz as any).excerpt ?? "");
      setTheme((existingQuiz as any).theme ?? "");
      setDiscipline(existingQuiz.discipline ?? "");
      setYearGroup(existingQuiz.yearGroup ?? "");
      setClassName(existingQuiz.className ?? "");
      setShowResultsImmediately(existingQuiz.showResultsImmediately);
      const hiddenIds = JSON.parse((existingQuiz as any).hiddenResultsQuestionIds ?? "[]") as number[];
      const allQIds = JSON.parse(existingQuiz.questionIds ?? "[]") as number[];
      const isHideAll = allQIds.length > 0 && allQIds.every((id) => hiddenIds.includes(id));
      setHideAllResults(isHideAll);
      setHiddenResultsIds(hiddenIds);
      setSelectedIds(JSON.parse(existingQuiz.questionIds ?? "[]"));
      setTimeout(() => setDataLoaded(true), 100);
    } else if (!isEdit) {
      setDataLoaded(true);
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

  const createQuestion = trpc.questions.create.useMutation({
    onSuccess: () => {
      toast.success("Pergunta criada e adicionada!");
      setShowNewQForm(false);
      setNewQ({ ...EMPTY_NEW_Q });
      refetchMine();
      setBankTab("mine");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteQuestion = trpc.questions.delete.useMutation({
    onSuccess: () => { toast.success("Pergunta eliminada."); refetchMine(); },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (dataLoaded) setIsDirty(true);
  }, [title, description, literaryWork, excerpt, theme, discipline, yearGroup, className, showResultsImmediately, hideAllResults, hiddenResultsIds, selectedIds]);

  const toggleHideResults = (qId: number) => {
    setHiddenResultsIds((prev) =>
      prev.includes(qId) ? prev.filter((x) => x !== qId) : [...prev, qId]
    );
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !savedOnce) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, savedOnce]);

  const handleSave = () => {
    if (!title.trim()) { toast.error("O título é obrigatório."); return; }
    if (selectedIds.length === 0) { toast.error("Seleciona pelo menos uma pergunta."); return; }
    const effectiveHiddenIds = hideAllResults ? selectedIds : hiddenResultsIds;
    const payload = { title, description, literaryWork, excerpt: excerpt || undefined, theme: theme || undefined, discipline, yearGroup, className, showResultsImmediately: hideAllResults ? false : showResultsImmediately, hiddenResultsQuestionIds: effectiveHiddenIds, questionIds: selectedIds };
    setSavedOnce(true);
    if (isEdit) updateQuiz.mutate({ id: numericId, ...payload });
    else createQuiz.mutate(payload);
  };

  const toggleQuestion = (qId: number) => {
    setSelectedIds((prev) => prev.includes(qId) ? prev.filter((x) => x !== qId) : [...prev, qId]);
  };

  // "Usar como base": copia a sugestão como nova pergunta do professor
  const useSuggestionAsBase = (q: any) => {
    setNewQ({
      text: q.text,
      type: q.type,
      category: q.category,
      sensitivityLevel: q.sensitivityLevel,
      educationLevel: q.educationLevel,
      options: q.options ? JSON.parse(q.options) : ["", "", "", ""],
    });
    setShowNewQForm(true);
    setBankTab("mine");
    setTimeout(() => document.getElementById("new-q-form")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleCreateQuestion = () => {
    if (!newQ.text.trim()) { toast.error("O texto da pergunta é obrigatório."); return; }
    const opts = newQ.type !== "open" ? newQ.options.filter(o => o.trim()) : undefined;
    if (newQ.type === "multiple_choice" && (!opts || opts.length < 2)) {
      toast.error("Adiciona pelo menos 2 opções de resposta."); return;
    }
    createQuestion.mutate({
      text: newQ.text,
      type: newQ.type,
      category: newQ.category as any,
      sensitivityLevel: newQ.sensitivityLevel,
      educationLevel: newQ.educationLevel,
      options: opts,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="av-section text-center py-24">
        <div className="max-w-sm mx-auto">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-navy mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-6">Apenas professores registados podem criar e editar quizzes.</p>
          <Link href="/login" className="av-btn-primary">Entrar na Plataforma</Link>
        </div>
      </div>
    );
  }

  const displayedQuestions = bankTab === "suggestions" ? (suggestions ?? []) : (myQuestions ?? []);

  return (
    <div className="av-section animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => {
            if (isDirty && !savedOnce && (title || selectedIds.length > 0)) {
              if (!window.confirm("Tens alterações não guardadas. Tens a certeza que queres sair?")) return;
            }
            navigate("/dashboard");
          }}
          className="text-muted-foreground hover:text-navy transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="av-section-title">{isEdit ? "Editar Quiz" : "Novo Quiz"}</h1>
          <p className="av-section-subtitle">Configura o quiz e seleciona ou cria as perguntas.</p>
        </div>
      </div>

      <PedagogicBox title="Como funciona o banco de perguntas">
        O banco tem <strong>sugestões do sistema</strong> — perguntas validadas sobre igualdade de género — que podes usar diretamente ou adaptar como ponto de partida. Podes também criar as tuas próprias perguntas, que ficam guardadas para uso futuro.
      </PedagogicBox>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Coluna esquerda: metadados */}
        <div className="space-y-5">
          <h2 className="text-lg font-display font-bold text-navy">Informações do Quiz</h2>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Título *</label>
            <input className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card" placeholder="Ex: Relações tóxicas em 'Ana Karenina'" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Obra Literária</label>
            <input className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card" placeholder="Ex: A Culpa é das Estrelas" value={literaryWork} onChange={(e) => setLiteraryWork(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Tema Central</label>
            <select className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card" value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="">Selecionar tema (opcional)</option>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Excerto Literário <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <textarea className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card resize-none" rows={4} placeholder="Cola aqui o excerto do texto que vai ser apresentado à turma antes das perguntas..." value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Este excerto será mostrado no relatório pedagógico como ponto de partida da atividade.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">Disciplina</label>
              <input className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card" placeholder="Ex: Português" value={discipline} onChange={(e) => setDiscipline(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1">Ano Letivo</label>
              <input className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card" placeholder="Ex: 9.º ano" value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Turma</label>
            <input className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card" placeholder="Ex: 9.º A" value={className} onChange={(e) => setClassName(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1">Descrição</label>
            <textarea className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-card resize-none" rows={3} placeholder="Contexto pedagógico desta atividade..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-2">
            <div className={`flex items-center gap-3 p-4 bg-cream-dark rounded-xl transition-opacity ${hideAllResults ? 'opacity-40 pointer-events-none' : ''}`}>
              <input type="checkbox" id="showResults" checked={showResultsImmediately && !hideAllResults} onChange={(e) => setShowResultsImmediately(e.target.checked)} className="w-4 h-4 accent-teal" disabled={hideAllResults} />
              <label htmlFor="showResults" className="text-sm font-semibold text-navy cursor-pointer">Mostrar resultados em tempo real aos alunos</label>
            </div>
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <input type="checkbox" id="hideAllResults" checked={hideAllResults} onChange={(e) => { setHideAllResults(e.target.checked); if (e.target.checked) setShowResultsImmediately(false); }} className="w-4 h-4 accent-amber-500" />
              <div>
                <label htmlFor="hideAllResults" className="text-sm font-semibold text-amber-800 cursor-pointer">Resultados apenas no relatório</label>
                <p className="text-xs text-amber-600 mt-0.5">Nenhuma pergunta mostra gráficos à turma. Os dados são recolhidos e aparecem no relatório pedagógico.</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-2">{selectedIds.length} pergunta(s) selecionada(s)</p>
            <button onClick={handleSave} disabled={createQuiz.isPending || updateQuiz.isPending} className="av-btn-primary w-full flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {isEdit ? "Guardar Alterações" : "Criar Quiz"}
            </button>
          </div>
        </div>

        {/* Coluna direita: banco de perguntas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-bold text-navy">Perguntas</h2>
            <button
              onClick={() => { setShowNewQForm(!showNewQForm); setNewQ({ ...EMPTY_NEW_Q }); }}
              className="flex items-center gap-1.5 text-sm font-semibold text-teal hover:text-teal-dark transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova pergunta
            </button>
          </div>

          {/* Formulário de nova pergunta */}
          {showNewQForm && (
            <div id="new-q-form" className="mb-4 p-4 bg-cream-dark rounded-xl border border-teal/30 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-teal" />
                <span className="text-sm font-bold text-navy">Criar pergunta própria</span>
              </div>
              <textarea
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal resize-none"
                rows={3}
                placeholder="Texto da pergunta..."
                value={newQ.text}
                onChange={(e) => setNewQ(q => ({ ...q, text: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <select className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal" value={newQ.type} onChange={(e) => setNewQ(q => ({ ...q, type: e.target.value as any }))}>
                  <option value="multiple_choice">Múltipla escolha</option>
                  <option value="scale">Escala concordo/discordo</option>
                  <option value="open">Resposta aberta</option>
                </select>
                <select className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal" value={newQ.category} onChange={(e) => setNewQ(q => ({ ...q, category: e.target.value }))}>
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal" value={newQ.sensitivityLevel} onChange={(e) => setNewQ(q => ({ ...q, sensitivityLevel: e.target.value as any }))}>
                  <option value="low">🟢 Sensibilidade baixa</option>
                  <option value="medium">🟡 Sensibilidade média</option>
                  <option value="high">🔴 Sensibilidade alta</option>
                </select>
                <select className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal" value={newQ.educationLevel} onChange={(e) => setNewQ(q => ({ ...q, educationLevel: e.target.value as any }))}>
                  <option value="all">Todos os níveis</option>
                  <option value="3rd_cycle">3.º Ciclo</option>
                  <option value="secondary">Secundário</option>
                </select>
              </div>
              {newQ.type === "multiple_choice" && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-navy">Opções de resposta</p>
                  {newQ.options.map((opt, i) => (
                    <input key={i} className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal" placeholder={`Opção ${i + 1}`} value={opt} onChange={(e) => { const o = [...newQ.options]; o[i] = e.target.value; setNewQ(q => ({ ...q, options: o })); }} />
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={handleCreateQuestion} disabled={createQuestion.isPending} className="av-btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" />
                  {createQuestion.isPending ? "A guardar..." : "Guardar pergunta"}
                </button>
                <button onClick={() => setShowNewQForm(false)} className="text-sm text-muted-foreground hover:text-navy transition-colors px-3">Cancelar</button>
              </div>
            </div>
          )}

          {/* Tabs: sugestões / minhas perguntas */}
          <div className="flex gap-1 mb-3 bg-cream-dark rounded-xl p-1">
            <button
              onClick={() => setBankTab("suggestions")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-lg transition-all ${bankTab === "suggestions" ? "bg-white text-teal shadow-sm" : "text-muted-foreground hover:text-navy"}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Sugestões ({suggestions?.length ?? 0})
            </button>
            <button
              onClick={() => setBankTab("mine")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-lg transition-all ${bankTab === "mine" ? "bg-white text-teal shadow-sm" : "text-muted-foreground hover:text-navy"}`}
            >
              <User className="w-3.5 h-3.5" />
              As minhas ({myQuestions?.length ?? 0})
            </button>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <select className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Todos os temas</option>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal" value={educationLevelFilter} onChange={(e) => setEducationLevelFilter(e.target.value)}>
              <option value="">Todos os níveis</option>
              <option value="3rd_cycle">3.º Ciclo</option>
              <option value="secondary">Secundário</option>
            </select>
            {bankTab === "suggestions" && (
              <select className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-teal" value={sensitivityFilter} onChange={(e) => setSensitivityFilter(e.target.value)}>
                <option value="">Toda a sensibilidade</option>
                <option value="low">🟢 Baixa</option>
                <option value="medium">🟡 Média</option>
                <option value="high">🔴 Alta</option>
              </select>
            )}
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {displayedQuestions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {bankTab === "mine"
                  ? <span>Ainda não tens perguntas criadas. Clica em <strong>Nova pergunta</strong> para começar, ou usa <strong>Usar como base</strong> numa sugestão.</span>
                  : "Nenhuma sugestão encontrada com estes filtros."}
              </div>
            ) : (
              displayedQuestions.map((q) => {
                const selected = selectedIds.includes(q.id);
                return (
                  <div key={q.id} className={`p-4 rounded-xl border-2 transition-all ${selected ? "border-teal bg-teal-light" : "border-border bg-card"}`}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleQuestion(q.id)}
                        className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors cursor-pointer ${selected ? "bg-teal border-teal" : "border-gray-300 hover:border-teal/60"}`}
                      >
                        {selected && <span className="text-white text-xs font-bold">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy leading-relaxed">{q.text}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="av-badge bg-teal-light text-teal-dark text-xs">{CATEGORIES[q.category]}</span>
                          <span className="av-badge bg-cream-dark text-navy text-xs">{SENSITIVITY[q.sensitivityLevel]}</span>
                          <span className="av-badge bg-cream-dark text-muted-foreground text-xs">
                            {q.type === "multiple_choice" ? "Múltipla escolha" : q.type === "scale" ? "Escala" : "Resposta aberta"}
                          </span>
                          {(q as any).isSystemSuggestion && (
                            <span className="av-badge bg-amber-100 text-amber-700 text-xs flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />Sugestão</span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {(q as any).isSystemSuggestion && (
                            <button
                              onClick={() => useSuggestionAsBase(q)}
                              className="text-xs text-teal hover:text-teal-dark font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              Usar como base
                            </button>
                          )}
                          {selected && (
                            <button
                              onClick={() => toggleHideResults(q.id)}
                              title={hiddenResultsIds.includes(q.id) ? "Resultados ocultos à turma" : "Resultados visíveis à turma"}
                              className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
                                hiddenResultsIds.includes(q.id)
                                  ? "text-amber-600 hover:text-amber-800"
                                  : "text-muted-foreground hover:text-navy"
                              }`}
                            >
                              {hiddenResultsIds.includes(q.id) ? "🔒 Só no relatório" : "👁 Visível à turma"}
                            </button>
                          )}
                          {!(q as any).isSystemSuggestion && (
                            <button
                              onClick={() => { if (window.confirm("Eliminar esta pergunta?")) deleteQuestion.mutate({ id: q.id }); }}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Eliminar
                            </button>
                          )}
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
