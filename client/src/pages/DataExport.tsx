import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  Download,
  Database,
  Users,
  BookOpen,
  MessageSquare,
  FileText,
  BarChart3,
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// ─── Utilitário: converter array de objetos em CSV ────────────────────────────
function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob(["\uFEFF" + toCSV(rows), "\n"], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DataExport() {
  const { user, isAuthenticated } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const { data: exportData, refetch, isFetching } = trpc.coordination.exportAll.useQuery(undefined, {
    enabled: false, // só carrega quando o utilizador clica
    staleTime: 0,
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold text-navy mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground mb-4">
          A exportação de dados está disponível apenas para coordenadores e administradores.
        </p>
        <Link href="/" className="av-btn-primary">Voltar ao Início</Link>
      </div>
    );
  }

  const stamp = () => new Date().toISOString().slice(0, 10);

  async function handleExportAll() {
    setExporting(true);
    toast.loading("A carregar todos os dados...", { id: "export" });
    try {
      const result = await refetch();
      const data = result.data;
      if (!data) throw new Error("Sem dados");

      // Exportar JSON completo
      downloadJSON(`aulaviva_backup_${stamp()}.json`, data);

      setLastExport(new Date().toLocaleString("pt-PT"));
      toast.success("Backup completo descarregado com sucesso!", { id: "export" });
    } catch {
      toast.error("Erro ao exportar dados. Tente novamente.", { id: "export" });
    } finally {
      setExporting(false);
    }
  }

  async function handleExportTable(
    label: string,
    key: "users" | "questions" | "quizzes" | "sessions" | "responses" | "chatMessages"
  ) {
    toast.loading(`A exportar ${label}...`, { id: `export-${key}` });
    try {
      const result = await refetch();
      const rows = result.data?.[key] as Record<string, unknown>[] | undefined;
      if (!rows) throw new Error("Sem dados");
      downloadCSV(`aulaviva_${key}_${stamp()}.csv`, rows);
      toast.success(`${label} exportado com sucesso!`, { id: `export-${key}` });
    } catch {
      toast.error("Erro ao exportar. Tente novamente.", { id: `export-${key}` });
    }
  }

  const tables = [
    {
      key: "users" as const,
      label: "Professores",
      icon: Users,
      description: "Nome, email, escola, data de registo",
      color: "bg-teal-light text-teal",
    },
    {
      key: "questions" as const,
      label: "Perguntas",
      icon: HelpCircle,
      description: "Banco de perguntas completo com opções e metadados",
      color: "bg-gold-light text-amber-700",
    },
    {
      key: "quizzes" as const,
      label: "Quizzes",
      icon: BookOpen,
      description: "Todos os quizzes criados pelos professores",
      color: "bg-teal-light text-teal",
    },
    {
      key: "sessions" as const,
      label: "Sessões",
      icon: BarChart3,
      description: "Sessões realizadas com código, escola, turma e data",
      color: "bg-gold-light text-amber-700",
    },
    {
      key: "responses" as const,
      label: "Respostas",
      icon: FileText,
      description: "Respostas anónimas dos alunos (sem identificação)",
      color: "bg-teal-light text-teal",
    },
    {
      key: "chatMessages" as const,
      label: "Chat",
      icon: MessageSquare,
      description: "Mensagens de chat das sessões (anonimizadas)",
      color: "bg-gold-light text-amber-700",
    },
  ];

  const counts = exportData?.counts;

  return (
    <div className="av-section animate-fade-in">
      {/* Cabeçalho */}
      <div className="mb-6">
        <Link href="/coordination" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-navy transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Painel de Coordenação
        </Link>
        <h1 className="av-section-title">Exportação e Backup de Dados</h1>
        <p className="av-section-subtitle">
          Descarregue uma cópia de segurança de todos os dados da plataforma para o seu computador.
        </p>
      </div>

      {/* Aviso de boas práticas */}
      <div className="av-card border-l-4 border-l-amber-400 bg-amber-50 mb-6">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 mb-1">Recomendação de backup</p>
            <p className="text-sm text-amber-800">
              Faça um backup completo pelo menos uma vez por mês e guarde o ficheiro num local seguro
              (pasta partilhada, pen drive ou email). O Manus não garante cópias de segurança automáticas
              dos dados da plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* Botão de backup completo */}
      <div className="av-card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-navy text-lg">Backup Completo</h2>
              <p className="text-sm text-muted-foreground">
                Um único ficheiro JSON com todos os dados — professores, quizzes, sessões, respostas e chat.
              </p>
              {lastExport && (
                <p className="text-xs text-teal flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Último backup: {lastExport}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleExportAll}
            disabled={exporting || isFetching}
            className="av-btn-primary flex items-center gap-2 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {exporting || isFetching ? "A exportar..." : "Descarregar Backup Completo"}
          </button>
        </div>
      </div>

      {/* Exportação por tabela */}
      <h2 className="font-display font-bold text-navy text-lg mb-3">Exportar por Tabela (CSV)</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Cada tabela é exportada como um ficheiro CSV que pode abrir diretamente no Excel ou Google Sheets.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map(({ key, label, icon: Icon, description, color }) => (
          <div key={key} className="av-card flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-navy text-sm">{label}</p>
                {counts && (
                  <p className="text-xs text-teal font-medium">
                    {counts[key].toLocaleString("pt-PT")} registos
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
            <button
              onClick={() => handleExportTable(label, key)}
              disabled={isFetching}
              className="mt-auto w-full flex items-center justify-center gap-1.5 text-sm font-medium text-teal border border-teal/30 rounded-lg py-2 hover:bg-teal-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>
        ))}
      </div>

      {/* Nota sobre privacidade */}
      <div className="av-card mt-6 bg-muted/40">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Nota de privacidade:</strong> As respostas dos alunos e as mensagens de chat são
          completamente anónimas — estão associadas apenas a tokens temporários de sessão, sem qualquer
          ligação a nomes, emails ou outros dados pessoais. Os ficheiros exportados não contêm informação
          que permita identificar alunos individualmente.
        </p>
      </div>
    </div>
  );
}
