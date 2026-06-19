import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { BookOpen, Shield, BarChart3, MessageCircle, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Se já autenticado, redirecionar para o dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      {/* Header simples */}
      <header className="px-6 py-5 flex items-center gap-2">
        <div className="w-9 h-9 bg-teal rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="font-display font-bold text-white text-xl">
          Aula<span className="text-gold">Viva</span>
        </span>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Card de login */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
            {/* Ícone e título */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal/20 border border-teal/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-teal-light" />
              </div>
              <h1 className="text-2xl font-display font-bold text-white mb-2">
                Entrar na Aula Viva
              </h1>
              <p className="text-white/50 text-sm leading-relaxed">
                Plataforma pedagógica para professores e coordenadores escolares do projeto PesqueirAmiga.
              </p>
            </div>

            {/* Botão de login */}
            <a
              href={getLoginUrl()}
              className="w-full flex items-center justify-center gap-3 bg-teal hover:bg-teal/90 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-teal/20 group"
            >
              <span>Criar conta ou entrar</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </a>

            {/* Separador */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs uppercase tracking-wider">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Acesso para alunos */}
            <a
              href="/join"
              className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
            >
              Entrar com código de sessão
              <span className="text-white/30 text-xs">(alunos)</span>
            </a>
          </div>

          {/* Funcionalidades resumidas */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              { icon: Shield, label: "Anonimato total dos alunos" },
              { icon: BarChart3, label: "Estatísticas em tempo real" },
              { icon: MessageCircle, label: "Chat moderado pelo professor" },
              { icon: BookOpen, label: "Banco de perguntas validado" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5"
              >
                <Icon className="w-4 h-4 text-teal-light shrink-0" />
                <span className="text-white/50 text-xs leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {/* Rodapé */}
          <p className="text-center text-white/20 text-xs mt-8">
            Projeto PesqueirAmiga · Master HBM Research, LDA · Porto
          </p>
        </div>
      </div>
    </div>
  );
}
