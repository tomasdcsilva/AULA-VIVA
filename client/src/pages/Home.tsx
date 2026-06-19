import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { BookOpen, MessageCircle, BarChart3, FileText, Shield, Users, ChevronRight } from "lucide-react";
import { Link } from "wouter";

const steps = [
  {
    num: "1",
    title: "Ler",
    desc: "O professor apresenta um excerto literário ou situação narrativa à turma.",
    color: "bg-teal",
  },
  {
    num: "2",
    title: "Votar",
    desc: "Os alunos respondem anonimamente pelo telemóvel, sem criar conta.",
    color: "bg-gold",
  },
  {
    num: "3",
    title: "Debater",
    desc: "A turma vê os resultados em gráficos e discute no chat com segurança.",
    color: "bg-teal",
  },
  {
    num: "4",
    title: "Refletir",
    desc: "O professor recebe um relatório pedagógico para preparar a aula seguinte.",
    color: "bg-gold",
  },
];

const features = [
  {
    icon: BookOpen,
    title: "Banco de Perguntas Validado",
    desc: "Perguntas organizadas por tema — estereótipos, controlo, consentimento, violência psicológica e relações saudáveis — revistas por especialistas.",
    color: "text-teal",
    bg: "bg-teal-light",
  },
  {
    icon: Shield,
    title: "Anonimato Total",
    desc: "Os alunos entram apenas com um código temporário. Nenhuma resposta é associada a nomes ou identidades.",
    color: "text-teal",
    bg: "bg-teal-light",
  },
  {
    icon: BarChart3,
    title: "Estatísticas em Tempo Real",
    desc: "Gráficos de barras e percentagens por resposta, visíveis à turma para abrir debate fundamentado.",
    color: "text-amber-700",
    bg: "bg-gold-light",
  },
  {
    icon: MessageCircle,
    title: "Chat Anónimo Moderado",
    desc: "Espaço de debate com regras visíveis, moderação ativa pelo professor e protocolo para mensagens sensíveis.",
    color: "text-teal",
    bg: "bg-teal-light",
  },
  {
    icon: FileText,
    title: "Relatório Pedagógico",
    desc: "Resumo automático com resultados, tendências, tópicos emergentes do chat e sugestões para a próxima aula.",
    color: "text-amber-700",
    bg: "bg-gold-light",
  },
  {
    icon: Users,
    title: "Painel de Coordenação",
    desc: "Métricas agregadas por escola, turma e disciplina — sempre sem identificação individual dos alunos.",
    color: "text-teal",
    bg: "bg-teal-light",
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-cream min-h-screen">
      {/* Hero */}
      <section className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, oklch(52% 0.13 185) 0%, transparent 60%)" }}
        />
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-2xl">
            <span className="inline-block bg-teal/20 text-teal-light text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Projeto PesqueirAmiga · Ação A1
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 leading-tight">
              Plataforma <span className="text-gold">Aula Viva</span>
            </h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Quiz, votação anónima e debate orientado para leituras críticas sobre
              desigualdade de género e relações tóxicas em contexto escolar.
            </p>
            <div className="flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link href="/quiz/new" className="av-btn-primary flex items-center gap-2">
                  Criar Quiz <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link href="/login" className="av-btn-primary flex items-center gap-2">
                  Entrar como Professor <ChevronRight className="w-4 h-4" />
                </Link>
              )}
              <Link href="/join" className="bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
                Entrar com Código de Sessão
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Fluxo pedagógico */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display font-bold text-navy mb-2">Da leitura à reflexão.</h2>
          <p className="text-muted-foreground">Uma aula que ganha vida através da participação segura.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((s) => (
            <div key={s.num} className="bg-card rounded-xl p-6 shadow-sm border border-border text-center animate-fade-in">
              <div className={`w-10 h-10 ${s.color} rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3`}>
                {s.num}
              </div>
              <h3 className="font-display font-bold text-navy text-lg mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="bg-cream-dark py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-navy mb-2">O que a plataforma oferece</h2>
            <p className="text-muted-foreground">Ferramentas pedagógicas para professores, alunos e coordenadores.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-card rounded-xl p-6 shadow-sm border border-border animate-fade-in">
                <div className={`w-10 h-10 ${f.bg} rounded-lg flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-display font-bold text-navy mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="bg-navy rounded-2xl p-10 md:p-14">
          <h2 className="text-3xl font-display font-bold text-white mb-3">
            Pronto para começar?
          </h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            Cria o teu primeiro quiz, lança uma sessão e transforma uma leitura numa experiência participativa.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard" className="av-btn-primary">
                Ir para o Painel
              </Link>
            ) : (
              <a href={getLoginUrl()} className="av-btn-primary">
                Entrar como Professor
              </a>
            )}
            <Link href="/join" className="bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
              Entrar com Código de Sessão
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
