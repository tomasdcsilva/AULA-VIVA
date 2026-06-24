import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Eye, EyeOff, Shield, BarChart3, MessageCircle } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  const meQuery = trpc.auth.meWithLocal.useQuery(undefined, { retry: false });

  useEffect(() => {
    if (meQuery.data) navigate("/dashboard");
  }, [meQuery.data]);

  const login = trpc.auth.login.useMutation({
    onSuccess: () => { window.location.href = "/dashboard"; },
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-cream)" }}>
      {/* Painel esquerdo — visual */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12" style={{ background: "var(--color-navy)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-teal)" }}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white">
            Aula <span style={{ color: "var(--color-gold)" }}>Viva</span>
          </span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            A plataforma que transforma a leitura em debate
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-8">
            Promove a reflexão sobre relações saudáveis e igualdade de género com os teus alunos, de forma segura e anónima.
          </p>
          <div className="space-y-3">
            {[
              { icon: Shield, label: "Anonimato total dos alunos" },
              { icon: BarChart3, label: "Estatísticas em tempo real" },
              { icon: MessageCircle, label: "Chat moderado pelo professor" },
              { icon: BookOpen, label: "Banco de perguntas validado" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Icon className="w-4 h-4 text-white/70" />
                </div>
                <span className="text-white/70 text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs">
          Projeto PesqueirAmiga · Master HBM Research, LDA
        </p>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--color-navy)" }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold" style={{ color: "var(--color-navy)" }}>
              Aula <span style={{ color: "var(--color-gold)" }}>Viva</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-navy)" }}>Bem-vindo(a) de volta</h1>
          <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Entra na tua conta de professor(a)</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: "var(--color-navy)" }}>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="professor@escola.pt"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="mt-1 h-11"
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password" className="text-sm font-medium" style={{ color: "var(--color-navy)" }}>Password</Label>
                <Link href="/forgot-password" className="text-xs hover:underline" style={{ color: "var(--color-teal)" }}>
                  Esqueci a password
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="A tua password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full h-11 font-bold text-white mt-2"
              style={{ background: "var(--color-teal)" }}
            >
              {login.isPending ? "A entrar..." : "Entrar"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "#e5e7eb" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-cream" style={{ color: "#9ca3af", background: "var(--color-cream)" }}>ou</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-center text-sm" style={{ color: "#6b7280" }}>
              Não tens conta?{" "}
              <Link href="/register" className="font-semibold hover:underline" style={{ color: "var(--color-teal)" }}>
                Criar conta gratuita
              </Link>
            </p>
            <p className="text-center text-sm" style={{ color: "#6b7280" }}>
              És aluno?{" "}
              <Link href="/join" className="font-semibold hover:underline" style={{ color: "var(--color-navy)" }}>
                Entrar com código de sessão
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
