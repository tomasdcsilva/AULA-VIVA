import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
    else setError("Link inválido. Pede um novo email de recuperação.");
  }, []);

  const reset = trpc.auth.resetPassword.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("As passwords não coincidem."); return; }
    if (password.length < 8) { setError("A password deve ter pelo menos 8 caracteres."); return; }
    reset.mutate({ token, password });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
        <div className="w-full max-w-md mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#d1fae5" }}>
              <CheckCircle className="w-8 h-8" style={{ color: "var(--color-teal)" }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-navy)" }}>Password redefinida!</h2>
            <p className="mb-6 text-sm" style={{ color: "#6b7280" }}>
              A tua password foi alterada com sucesso. Podes entrar agora.
            </p>
            <Link href="/login">
              <Button className="w-full" style={{ background: "var(--color-teal)", color: "white" }}>
                Entrar
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
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-navy)" }}>Nova password</h1>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Define uma nova password para a tua conta.</p>

          {!token ? (
            <div className="rounded-lg px-4 py-3 flex items-center gap-2" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-sm">Link inválido. <Link href="/forgot-password" className="underline">Pede um novo.</Link></span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password" style={{ color: "var(--color-navy)" }}>Nova password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm" style={{ color: "var(--color-navy)" }}>Confirmar password</Label>
                <Input
                  id="confirm"
                  type={showPass ? "text" : "password"}
                  placeholder="Repete a nova password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="mt-1 h-11"
                />
              </div>

              {error && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={reset.isPending}
                className="w-full h-11 font-bold text-white"
                style={{ background: "var(--color-teal)" }}
              >
                {reset.isPending ? "A guardar..." : "Guardar nova password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
