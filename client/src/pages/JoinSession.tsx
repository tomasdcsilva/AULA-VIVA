import { BookOpen, ArrowRight, Shield } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function JoinSession() {
  const [code, setCode] = useState("");
  const [, navigate] = useLocation();

  const join = trpc.sessions.join.useMutation({
    onSuccess: (data) => {
      // Guardar dados da sessão no sessionStorage (sem identificação)
      sessionStorage.setItem("av_session", JSON.stringify(data));
      navigate(`/student/${data.sessionId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) { toast.error("Introduz o código da sessão."); return; }
    join.mutate({ code: cleaned });
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-3xl font-display font-bold text-navy">
            Aula<span className="text-teal">Viva</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Plataforma de debate seguro em sala de aula</p>
        </div>

        {/* Cartão de entrada */}
        <div className="av-card shadow-lg">
          <h2 className="text-xl font-display font-bold text-navy mb-1">Entrar na Sessão</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Introduz o código que o teu professor escreveu no quadro.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Código da Sessão</label>
              <input
                type="text"
                className="w-full border-2 border-border rounded-xl px-4 py-4 text-2xl font-mono font-bold text-center text-navy tracking-[0.3em] uppercase focus:outline-none focus:border-teal bg-cream-dark placeholder:text-muted-foreground/40 placeholder:text-lg placeholder:tracking-normal"
                placeholder="AB-123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={join.isPending}
              className="av-btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
            >
              {join.isPending ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Entrar <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>

        {/* Garantia de anonimato */}
        <div className="mt-5 flex items-start gap-3 bg-teal-light rounded-xl p-4">
          <Shield className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-teal-dark">A tua identidade está protegida</p>
            <p className="text-xs text-teal-dark/80 mt-0.5 leading-relaxed">
              Não precisas de criar conta nem de revelar o teu nome. As tuas respostas são completamente
              anónimas — nenhum professor ou colega consegue saber o que respondeste.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
