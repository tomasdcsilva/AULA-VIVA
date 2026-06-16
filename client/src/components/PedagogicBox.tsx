import { Info } from "lucide-react";

interface PedagogicBoxProps {
  title?: string;
  children: React.ReactNode;
  variant?: "teal" | "gold" | "sensitive";
}

export default function PedagogicBox({ title, children, variant = "teal" }: PedagogicBoxProps) {
  const styles = {
    teal: "bg-teal-light border-l-4 border-teal text-teal-dark",
    gold: "bg-gold-light border-l-4 border-gold text-amber-900",
    sensitive: "bg-amber-50 border-l-4 border-amber-400 text-amber-800",
  };

  return (
    <div className={`${styles[variant]} rounded-r-xl p-4 text-sm animate-fade-in`}>
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-70" />
        <div>
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="leading-relaxed opacity-90">{children}</p>
        </div>
      </div>
    </div>
  );
}
