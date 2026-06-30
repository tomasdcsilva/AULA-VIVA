import { Info, X } from "lucide-react";
import { useState } from "react";

interface PedagogicBoxProps {
  title?: string;
  children: React.ReactNode;
  variant?: "teal" | "gold" | "sensitive";
  /** Se fornecido, o utilizador pode fechar a caixa e a preferência fica guardada em localStorage */
  dismissKey?: string;
}

export default function PedagogicBox({
  title,
  children,
  variant = "teal",
  dismissKey,
}: PedagogicBoxProps) {
  const storageKey = dismissKey ? `av_dismissed_${dismissKey}` : null;
  const [dismissed, setDismissed] = useState(() =>
    storageKey ? localStorage.getItem(storageKey) === "1" : false
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, "1");
    setDismissed(true);
  };

  const styles = {
    teal: "bg-teal-light border-l-4 border-teal text-teal-dark",
    gold: "bg-gold-light border-l-4 border-gold text-amber-900",
    sensitive: "bg-amber-50 border-l-4 border-amber-400 text-amber-800",
  };

  const closeStyles = {
    teal: "text-teal-dark/50 hover:text-teal-dark",
    gold: "text-amber-900/50 hover:text-amber-900",
    sensitive: "text-amber-800/50 hover:text-amber-800",
  };

  return (
    <div className={`${styles[variant]} rounded-r-xl p-4 text-sm animate-fade-in`}>
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-70" />
        <div className="flex-1">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="leading-relaxed opacity-90">{children}</p>
        </div>
        {dismissKey && (
          <button
            onClick={handleDismiss}
            className={`${closeStyles[variant]} flex-shrink-0 transition-colors p-0.5 rounded`}
            aria-label="Fechar aviso"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
