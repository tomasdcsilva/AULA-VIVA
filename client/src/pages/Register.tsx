import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function Register() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const register = trpc.auth.register.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("As passwords não coincidem."); return; }
    if (password.length < 8) { setError("A password deve ter pelo menos 8 caracteres."); return; }
    register.mutate({ name, email, password });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
        <div className="w-full max-w-md mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#d1fae5" }}>
              <CheckCircle className="w-8 h-8" style={{ color: "var(--color-teal)" }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-navy)" }}>Conta criada!</h2>
            <p className="mb-6" style={{ color: "#6b7280" }}>
              Enviámos um email de confirmação para <strong>{email}</strong>.<br />
              Verifica a tua caixa de entrada e clica no link para ativar a conta.
            </p>
            <Link href="/login">
              <Button className="w-full" style={{ background: "var(--color-teal)", color: "white" }}>
                Ir para o Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
      <div className="w-full max-w-md mx-auto px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-navy)" }}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-extrabold" style={{ color: "var(--color-navy)" }}>
                Aula <span style={{ color: "var(--color-gold)" }}>Viva</span>
              </span>
            </div>
          </Link>
          <p className="mt-2 text-sm" style={{ color: "#6b7280" }}>Projeto PesqueirAmiga</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-navy)" }}>Criar conta</h1>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Regista-te como professor(a) na plataforma</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" style={{ color: "var(--color-navy)" }}>Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: Ana Ferreira"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" style={{ color: "var(--color-navy)" }}>Email profissional</Label>
              <Input
                id="email"
                type="email"
                placeholder="professor@escola.pt"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password" style={{ color: "var(--color-navy)" }}>Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="pr-10"
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

            <div>
              <Label htmlFor="confirm" style={{ color: "var(--color-navy)" }}>Confirmar password</Label>
              <Input
                id="confirm"
                type={showPass ? "text" : "password"}
                placeholder="Repete a password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={register.isPending}
              className="w-full h-11 font-bold text-white"
              style={{ background: "var(--color-teal)" }}
            >
              {register.isPending ? "A criar conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "#6b7280" }}>
            Já tens conta?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--color-teal)" }}>
              Entrar
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#9ca3af" }}>
          Aula Viva · Projeto PesqueirAmiga · Master HBM Research, LDA
        </p>
      </div>
    </div>
  );
}
