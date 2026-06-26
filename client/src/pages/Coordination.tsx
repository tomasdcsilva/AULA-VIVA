import { useAuth } from "@/_core/hooks/useAuth";
import PedagogicBox from "@/components/PedagogicBox";
import { trpc } from "@/lib/trpc";
import { BarChart3, Users, BookOpen, School, Calendar, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
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

  return (
    <div className="av-section animate-fade-in">
      <div className="mb-6">
        <h1 className="av-section-title">Painel de Coordenação</h1>
        <p className="av-section-subtitle">Métricas agregadas por escola, turma e disciplina — sem identificação individual.</p>
      </div>

      <PedagogicBox title="Sobre o Painel de Coordenação">
        Este painel apresenta indicadores globais de utilização da plataforma. Todos os dados são
        <strong> sempre agregados</strong> — nunca é possível identificar um aluno individualmente.
        O objetivo é apoiar a coordenação pedagógica na monitorização do alcance das atividades de
        sensibilização para a igualdade de género.
      </PedagogicBox>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
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
      </div>

      {/* Gráfico por escola */}
      {bySchoolData.length > 0 && (
        <div className="av-card mt-6">
          <h2 className="font-display font-bold text-navy mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal" /> Participações por Escola
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySchoolData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(88% 0.02 85)" />
                <XAxis dataKey="school" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: "0.75rem", border: "1px solid oklch(88% 0.02 85)" }}
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
        </div>
      )}
    </div>
  );
}
