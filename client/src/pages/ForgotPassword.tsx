import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, CheckCircle, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const forgot = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => setSent(true),
    onError: (e) => setError(e.message),
  });

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
        <div className="w-full max-w-md mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#d1fae5" }}>
              <CheckCircle className="w-8 h-8" style={{ color: "var(--color-teal)" }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-navy)" }}>Email enviado!</h2>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: "#6b7280" }}>
              Se existe uma conta associada a <strong>{email}</strong>, receberás um email com instruções para redefinir a password nos próximos minutos.
            </p>
            <Link href="/login">
              <Button className="w-full" style={{ background: "var(--color-teal)", color: "white" }}>
                Voltar ao login
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
          <Link href="/login" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: "var(--color-teal)" }}>
            <ArrowLeft className="w-4 h-4" /> Voltar ao login
          </Link>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-navy)" }}>Recuperar password</h1>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
            Indica o teu email e enviaremos um link para redefinir a password.
          </p>

          <form onSubmit={e => { e.preventDefault(); setError(""); forgot.mutate({ email }); }} className="space-y-4">
            <div>
              <Label htmlFor="email" style={{ color: "var(--color-navy)" }}>Email</Label>
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

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={forgot.isPending}
              className="w-full h-11 font-bold text-white"
              style={{ background: "var(--color-teal)" }}
            >
              {forgot.isPending ? "A enviar..." : "Enviar link de recuperação"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
