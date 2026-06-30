import { useAuth } from "@/_core/hooks/useAuth";
import PedagogicBox from "@/components/PedagogicBox";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Users,
  BookOpen,
  School,
  Calendar,
  TrendingUp,
  GraduationCap,
  BookMarked,
  Tag,
  Mail,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "oklch(52% 0.13 185)",
  "oklch(78% 0.14 80)",
  "oklch(38% 0.12 185)",
  "oklch(65% 0.14 80)",
  "oklch(60% 0.10 185)",
  "oklch(72% 0.10 185)",
];

const STATUS_LABELS: Record<string, string> = {
  waiting: "A aguardar",
  active: "Ativa",
  voting_closed: "Votação encerrada",
  chat_open: "Chat aberto",
  closed: "Encerrada",
};

const THEME_LABELS: Record<string, string> = {
  stereotypes: "Estereótipos de Género",
  control: "Controlo e Ciúme",
  consent: "Consentimento",
  psychological_violence: "Violência Psicológica",
  healthy_relationships: "Relações Saudáveis",
  jealousy: "Ciúme e Possessividade",
  peer_pressure: "Pressão do Grupo",
  social_media: "Redes Sociais",
  masculinities: "Masculinidades",
  emotional_dependency: "Dependência Emocional",
};

export default function Coordination() {
  const { user, isAuthenticated } = useAuth();
  const [schoolFilter, setSchoolFilter] = useState("");

  const { data: stats } = trpc.coordination.stats.useQuery(
    { school: schoolFilter || undefined },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: sessions } = trpc.coordination.sessions.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const { data: teachers } = trpc.coordination.teachers.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  if (!isAuthenticated || user?.role !== "admin") return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-2xl font-display font-bold text-navy mb-2">Acesso Restrito</h2>
      <p className="text-muted-foreground mb-4">
        O painel de coordenação está disponível apenas para coordenadores e administradores.
      </p>
      <Link href="/" className="av-btn-primary">Voltar ao Início</Link>
    </div>
  );

  const bySchoolData = stats?.bySchool ?? [];
  const byDisciplineData = stats?.byDiscipline ?? [];
  const byThemeData = (stats?.byTheme ?? []).map((t) => ({
    ...t,
    label: THEME_LABELS[t.theme] ?? t.theme,
  }));
  const topWorks = stats?.topWorks ?? [];

  return (
    <div className="av-section animate-fade-in">
      <div className="mb-6">
        <h1 className="av-section-title">Painel de Coordenação</h1>
        <p className="av-section-subtitle">Indicadores agregados por escola, turma e disciplina — sem identificação individual.</p>
      </div>

      <PedagogicBox title="Sobre o Painel de Coordenação">
        Este painel apresenta indicadores globais de utilização da plataforma. Todos os dados são
        <strong> sempre agregados</strong> — nunca é possível identificar um aluno individualmente.
        O objetivo é apoiar a coordenação pedagógica na monitorização do alcance das atividades de
        sensibilização para a igualdade de género e produzir evidências de impacto para a candidatura.
      </PedagogicBox>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <div className="av-card text-center">
          <div className="w-10 h-10 bg-teal-light rounded-xl flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-5 h-5 text-teal" />
          </div>
          <p className="text-3xl font-bold text-navy">{stats?.totalSessions ?? 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Sessões realizadas</p>
        </div>
        <div className="av-card text-center">
          <div className="w-10 h-10 bg-gold-light rounded-xl flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5 text-amber-700" />
          </div>
          <p className="text-3xl font-bold text-navy">{stats?.totalParticipants ?? 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Participações anónimas</p>
        </div>
        <div className="av-card text-center">
          <div className="w-10 h-10 bg-teal-light rounded-xl flex items-center justify-center mx-auto mb-2">
            <School className="w-5 h-5 text-teal" />
          </div>
          <p className="text-3xl font-bold text-navy">{bySchoolData.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Escolas envolvidas</p>
        </div>
        <div className="av-card text-center">
          <div className="w-10 h-10 bg-teal-light rounded-xl flex items-center justify-center mx-auto mb-2">
            <GraduationCap className="w-5 h-5 text-teal" />
          </div>
          <p className="text-3xl font-bold text-navy">{stats?.totalTeachers ?? 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Professores ativos</p>
        </div>
      </div>

      {/* Média de participantes por sessão */}
      {(stats?.avgParticipants ?? 0) > 0 && (
        <div className="av-card mt-4 flex items-center gap-4 py-3">
          <div className="w-10 h-10 bg-gold-light rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">
              Média de <span className="text-teal">{stats?.avgParticipants}</span> participantes por sessão
            </p>
            <p className="text-xs text-muted-foreground">Calculado sobre todas as sessões registadas</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Gráfico por escola */}
        {bySchoolData.length > 0 && (
          <div className="av-card">
            <h2 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
              <School className="w-5 h-5 text-teal" /> Participações por Escola
            </h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySchoolData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(88% 0.02 85)" />
                  <XAxis dataKey="school" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "0.75rem", border: "1px solid oklch(88% 0.02 85)" }}
                    formatter={(v: number) => [v, "Participantes"]}
                  />
                  <Bar dataKey="participants" name="Participantes" radius={[6, 6, 0, 0]}>
                    {bySchoolData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Gráfico por disciplina */}
        {byDisciplineData.length > 0 && (
          <div className="av-card">
            <h2 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-teal" /> Sessões por Disciplina
            </h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDisciplineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(88% 0.02 85)" />
                  <XAxis dataKey="discipline" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "0.75rem", border: "1px solid oklch(88% 0.02 85)" }}
                    formatter={(v: number) => [v, "Sessões"]}
                  />
                  <Bar dataKey="sessions" name="Sessões" radius={[6, 6, 0, 0]}>
                    {byDisciplineData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Temas mais trabalhados */}
      {byThemeData.length > 0 && (
        <div className="av-card mt-6">
          <h2 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-teal" /> Temas Mais Trabalhados
          </h2>
          <div className="space-y-2">
            {byThemeData.map((t, i) => {
              const max = byThemeData[0]?.count ?? 1;
              const pct = Math.round((t.count / max) * 100);
              return (
                <div key={t.theme} className="flex items-center gap-3">
                  <span className="text-sm text-navy w-44 truncate flex-shrink-0">{t.label}</span>
                  <div className="flex-1 bg-cream-dark rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right flex-shrink-0">{t.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Obras mais trabalhadas */}
      {topWorks.length > 0 && (
        <div className="av-card mt-6">
          <h2 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal" /> Obras Literárias Mais Trabalhadas
          </h2>
          <div className="space-y-2">
            {topWorks.map((w, i) => (
              <div key={w.work} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-light text-teal text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-navy">{w.work}</span>
                </div>
                <span className="av-badge bg-cream-dark text-navy text-xs flex-shrink-0">{w.count} sessão(ões)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de sessões */}
      {sessions && sessions.length > 0 && (
        <div className="av-card mt-6 overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-display font-bold text-navy flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal" /> Histórico de Sessões
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dados agregados — nenhum aluno é identificado individualmente.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Código</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Escola</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Turma</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Estado</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Participantes</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Data</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-t border-border hover:bg-cream-dark/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-navy">{s.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.school ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{(s as any).className ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`av-badge text-xs ${
                        s.status === "closed"
                          ? "bg-gray-100 text-gray-600"
                          : s.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-teal-light text-teal-dark"
                      }`}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy font-semibold">{s.participantCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("pt-PT")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!sessions || sessions.length === 0) && (
        <div className="av-card mt-6 text-center py-12">
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Ainda não há sessões registadas na plataforma.</p>
          <p className="text-xs text-muted-foreground mt-1">Os indicadores aparecerão aqui assim que os professores realizarem as primeiras sessões.</p>
        </div>
      )}

      {/* Tabela de professores ativos */}
      {teachers && teachers.length > 0 && (
        <div className="av-card mt-6 overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-display font-bold text-navy flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal" /> Professores com Atividade Registada
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Professores que já realizaram pelo menos uma sessão na plataforma.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-dark">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Escola(s)</th>
                  <th className="text-right px-4 py-3 font-semibold text-navy">Sessões</th>
                  <th className="text-right px-4 py-3 font-semibold text-navy">Participantes</th>
                  <th className="text-left px-4 py-3 font-semibold text-navy">Última sessão</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.userId} className="border-t border-border hover:bg-cream-dark/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-navy">{t.name || "—"}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${t.email}`}
                        className="flex items-center gap-1.5 text-teal hover:underline"
                      >
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        {t.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.schools.length > 0
                        ? t.schools.join(", ")
                        : <span className="italic text-xs">Não especificada</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-navy">{t.totalSessions}</td>
                    <td className="px-4 py-3 text-right text-navy">{t.totalParticipants}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {t.lastSession
                        ? new Date(t.lastSession).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
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
