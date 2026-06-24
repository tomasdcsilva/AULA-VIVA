import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { BookOpen, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verify = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => setStatus("success"),
    onError: (e) => { setStatus("error"); setMessage(e.message); },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      verify.mutate({ token: t });
    } else {
      setStatus("error");
      setMessage("Link inválido.");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
      <div className="w-full max-w-md mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--color-navy)" }}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold" style={{ color: "var(--color-navy)" }}>
              Aula <span style={{ color: "var(--color-gold)" }}>Viva</span>
            </span>
          </div>

          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: "var(--color-teal)" }} />
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-navy)" }}>A verificar email...</h2>
              <p className="text-sm" style={{ color: "#6b7280" }}>Aguarda um momento.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#d1fae5" }}>
                <CheckCircle className="w-8 h-8" style={{ color: "var(--color-teal)" }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-navy)" }}>Email confirmado!</h2>
              <p className="mb-6 text-sm" style={{ color: "#6b7280" }}>
                A tua conta está ativa. Podes entrar agora.
              </p>
              <Link href="/login">
                <Button className="w-full" style={{ background: "var(--color-teal)", color: "white" }}>
                  Entrar na Aula Viva
                </Button>
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#fef2f2" }}>
                <AlertCircle className="w-8 h-8" style={{ color: "#dc2626" }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-navy)" }}>Erro na verificação</h2>
              <p className="mb-6 text-sm" style={{ color: "#6b7280" }}>{message}</p>
              <Link href="/register">
                <Button variant="outline" className="w-full">Criar nova conta</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
