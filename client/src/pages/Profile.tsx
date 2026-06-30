import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, School, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setSchool((user as any).school ?? "");
    }
  }, [user]);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      utils.auth.meWithLocal.invalidate();
      setSaved(true);
      toast.success("Perfil atualizado com sucesso!");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ name, school: school.trim() || undefined });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
        <div className="text-center">
          <p className="text-navy font-semibold mb-4">Precisas de estar autenticado para aceder ao perfil.</p>
          <Link href="/login">
            <Button style={{ background: "var(--color-teal)", color: "white" }}>Entrar</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-cream)" }}>
        <div className="text-center">
          <p className="text-navy font-semibold mb-4">Precisas de estar autenticado para aceder ao perfil.</p>
          <Link href="/login">
            <Button style={{ background: "var(--color-teal)", color: "white" }}>Entrar</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Voltar */}
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-navy transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
          </button>
        </Link>

        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: "var(--color-navy)" }}>
            {name.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "var(--color-navy)" }}>O meu perfil</h1>
            <p className="text-sm" style={{ color: "#6b7280" }}>{user.email}</p>
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2 mb-1" style={{ color: "var(--color-navy)" }}>
                <User className="w-4 h-4" /> Nome completo
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                minLength={2}
                placeholder="Ex: Ana Ferreira"
              />
            </div>

            <div>
              <Label htmlFor="school" className="flex items-center gap-2 mb-1" style={{ color: "var(--color-navy)" }}>
                <School className="w-4 h-4" /> Escola
              </Label>
              <Input
                id="school"
                type="text"
                value={school}
                onChange={e => setSchool(e.target.value)}
                placeholder="Ex: Escola Secundária de Pesqueira"
              />
              <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                A escola aparece nos relatórios e no painel de coordenação do projeto.
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="w-full h-11 font-bold text-white flex items-center justify-center gap-2"
                style={{ background: saved ? "#059669" : "var(--color-teal)" }}
              >
                {saved ? (
                  <><CheckCircle className="w-4 h-4" /> Guardado!</>
                ) : updateProfile.isPending ? (
                  "A guardar..."
                ) : (
                  "Guardar alterações"
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Info conta */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
          <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--color-navy)" }}>Informação da conta</h2>
          <div className="space-y-2 text-sm" style={{ color: "#6b7280" }}>
            <div className="flex justify-between">
              <span>Email</span>
              <span className="font-medium" style={{ color: "var(--color-navy)" }}>{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Tipo de conta</span>
              <span className="font-medium" style={{ color: "var(--color-navy)" }}>
                {(user as any).role === "admin" ? "Coordenador" : "Professor(a)"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: "#9ca3af" }}>
          Aula Viva · Projeto PesqueirAmiga · Master HBM Research, LDA
        </p>
      </div>
    </div>
  );
}
