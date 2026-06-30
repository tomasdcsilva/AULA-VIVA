import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, ArrowLeft, KeyRound, Eye, EyeOff } from "lucide-react";

type Step = "email" | "code" | "success";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const forgot = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => { setError(""); setStep("code"); },
    onError: (e) => setError(e.message),
  });

  const resetWithCode = trpc.auth.resetPasswordWithCode.useMutation({
    onSuccess: () => setStep("success"),
    onError: (e) => setError(e.message),
  });

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 3) inputRefs[index + 1].current?.focus();
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      setCode(pasted.split(""));
      inputRefs[3].current?.focus();
    }
    e.preventDefault();
  };

  const codeComplete = code.every(d => d !== "");

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!codeComplete || password.length < 8) return;
    resetWithCode.mutate({ email, code: code.join(""), password });
  };

  const Logo = () => (
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
  );

  // Passo 3: Sucesso
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
        <div className="w-full max-w-md mx-auto px-6">
          <Logo />
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#d1fae5" }}>
              <KeyRound className="w-8 h-8" style={{ color: "var(--color-teal)" }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-navy)" }}>Password alterada!</h2>
            <p className="mb-6 text-sm leading-relaxed" style={{ color: "#6b7280" }}>
              A tua password foi redefinida com sucesso. Podes entrar agora com a nova password.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full h-11 font-bold text-white"
              style={{ background: "var(--color-teal)" }}
            >
              Ir para o login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Passo 2: Inserir código + nova password
  if (step === "code") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
        <div className="w-full max-w-md mx-auto px-6 py-12">
          <Logo />
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <button
              onClick={() => { setStep("email"); setCode(["","","",""]); setError(""); }}
              className="inline-flex items-center gap-1 text-sm mb-6 hover:underline"
              style={{ color: "var(--color-teal)" }}
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>

            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-navy)" }}>Verifica o teu email</h1>
            <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
              Enviámos um código de 4 dígitos para <strong>{email}</strong>. Insere o código e define a nova password.
            </p>

            <form onSubmit={handleSubmitCode} className="space-y-5">
              {/* Input de 4 dígitos */}
              <div>
                <Label className="mb-3 block text-sm font-semibold" style={{ color: "var(--color-navy)" }}>
                  Código de verificação
                </Label>
                <div className="flex gap-3 justify-center" onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={inputRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(i, e)}
                      className="w-14 h-16 text-center text-3xl font-bold rounded-xl border-2 outline-none transition-all"
                      style={{
                        borderColor: digit ? "var(--color-teal)" : "#d1d5db",
                        color: "var(--color-navy)",
                        background: digit ? "#f0fdf4" : "white",
                      }}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Nova password */}
              <div>
                <Label htmlFor="password" style={{ color: "var(--color-navy)" }}>Nova password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="text-xs mt-1" style={{ color: "#dc2626" }}>Mínimo 8 caracteres</p>
                )}
              </div>

              {error && (
                <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={resetWithCode.isPending || !codeComplete || password.length < 8}
                className="w-full h-11 font-bold text-white"
                style={{ background: "var(--color-teal)", opacity: (!codeComplete || password.length < 8) ? 0.6 : 1 }}
              >
                {resetWithCode.isPending ? "A verificar..." : "Confirmar e alterar password"}
              </Button>

              <p className="text-center text-xs" style={{ color: "#9ca3af" }}>
                Não recebeste o email?{" "}
                <button
                  type="button"
                  onClick={() => { setCode(["","","",""]); setError(""); forgot.mutate({ email }); }}
                  className="underline hover:text-gray-600"
                  disabled={forgot.isPending}
                >
                  Reenviar código
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Passo 1: Inserir email
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
      <div className="w-full max-w-md mx-auto px-6 py-12">
        <Logo />
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <Link href="/login" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: "var(--color-teal)" }}>
            <ArrowLeft className="w-4 h-4" /> Voltar ao login
          </Link>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-navy)" }}>Recuperar password</h1>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
            Indica o teu email e enviaremos um código de 4 dígitos para redefinires a password.
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
              {forgot.isPending ? "A enviar..." : "Enviar código"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
