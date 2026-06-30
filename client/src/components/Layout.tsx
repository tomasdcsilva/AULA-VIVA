import { useAuth } from "@/_core/hooks/useAuth";
import { BookOpen, Home, LogOut, Menu, User, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = isAuthenticated
    ? [
        { href: "/dashboard", label: "Painel", icon: Home },
        { href: "/questions", label: "Banco de Perguntas", icon: BookOpen },
      ]
    : [];

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Navbar */}
      <header className="bg-navy shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-teal rounded-lg flex items-center justify-center shadow-sm group-hover:bg-teal-dark transition-colors">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-white text-lg tracking-tight">
              Aula<span className="text-gold">Viva</span>
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location.startsWith(href)
                    ? "bg-teal text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="text-white/70 hover:text-white text-sm transition-colors hover:underline"
                >
                  {user?.name}
                </Link>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1 text-white/70 hover:text-white text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="bg-teal text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-teal-dark transition-colors"
              >
                Entrar como Professor
              </a>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-navy border-t border-white/10 px-4 pb-4 animate-fade-in">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 py-3 text-white/80 hover:text-white font-semibold border-b border-white/10"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 py-3 text-white/80 hover:text-white font-semibold border-b border-white/10"
                >
                  <User className="w-4 h-4" />
                  {user?.name || "Perfil"}
                </Link>
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="flex items-center gap-2 py-3 text-white/60 hover:text-white text-sm w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="block py-3 text-teal font-semibold"
              >
                Entrar como Professor
              </a>
            )}
          </div>
        )}
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-navy/90 text-white/50 text-xs text-center py-4 mt-auto">
        <span>
          Aula Viva · Projeto PesqueirAmiga · Master HBM Research, LDA
        </span>
        <span className="mx-2">·</span>
        <a href="/manual" className="text-white/40 hover:text-white/70 underline transition-colors">
          Manual de Utilização
        </a>
      </footer>
    </div>
  );
}
