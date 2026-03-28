import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, ChevronDown, LogOut, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import hotelLogo from "@/assets/hotel-sb-logo.png";

// ─── Traduções ────────────────────────────────────────────────────────────────
const translations = {
  pt: {
    flag: "🇧🇷",
    label: "PT",
    login: "Entrar",
    nav: [
      { href: "/", label: "Início" },
      { href: "/quartos", label: "Quartos" },
      { href: "/salao", label: "Salão de Festas" },
      { href: "/piscina", label: "Piscina" },
      { href: "/promocoes", label: "Promoções" },
      { href: "/galeria", label: "Galeria" },
      { href: "/contato", label: "Contato" },
    ],
  },
  es: {
    flag: "🇦🇷",
    label: "ES",
    login: "Ingresar",
    nav: [
      { href: "/", label: "Inicio" },
      { href: "/quartos", label: "Habitaciones" },
      { href: "/salao", label: "Salón de Eventos" },
      { href: "/piscina", label: "Piscina" },
      { href: "/promocoes", label: "Promociones" },
      { href: "/galeria", label: "Galería" },
      { href: "/contato", label: "Contacto" },
    ],
  },
};

type Lang = keyof typeof translations;

// ─── Seletor de idioma ────────────────────────────────────────────────────────
const LanguageSelector = ({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) => {
  const [open, setOpen] = useState(false);
  const current = translations[lang];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-gold/30 hover:border-gold/60 text-cream/80 hover:text-primary transition-all duration-200 text-sm font-body tracking-wide"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span>{current.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 bg-charcoal border border-gold/20 rounded shadow-xl overflow-hidden min-w-[130px]"
            >
              {(Object.keys(translations) as Lang[]).map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    setLang(code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-body tracking-wide transition-colors duration-150 hover:bg-charcoal-light ${
                    lang === code ? "text-primary bg-charcoal-light" : "text-cream/70"
                  }`}
                >
                  <span className="text-base">{translations[code].flag}</span>
                  <span>{code === "pt" ? "Português" : "Español"}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Header principal ─────────────────────────────────────────────────────────
const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("pt");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { nav, login } = translations[lang];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-charcoal/95 backdrop-blur-md border-b border-gold/10">
      <div className="container-hotel flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-3">
          <img src={hotelLogo} alt="Hotel SB - Sleep Better" className="h-10 md:h-12 w-auto object-contain" />
          <span className="font-body text-xs text-cream/40 tracking-widest uppercase hidden sm:block">
            Sleep Better
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3 py-2 text-sm font-body tracking-wide transition-colors duration-200 ${
                location.pathname === link.href ? "text-primary" : "text-cream/70 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/cardapio"
              className={`px-3 py-2 text-sm font-body tracking-wide transition-colors duration-200 flex items-center gap-1.5 ${
                location.pathname === "/cardapio" ? "text-primary" : "text-cream/70 hover:text-primary"
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              Cardápio
            </Link>
          )}
        </nav>

        {/* Desktop direita */}
        <div className="hidden lg:flex items-center gap-3">
          <LanguageSelector lang={lang} setLang={setLang} />
          {user ? (
            <Button variant="gold-outline" size="sm" className="gap-2" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="gold-outline" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                {login}
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="lg:hidden flex items-center gap-2">
          <LanguageSelector lang={lang} setLang={setLang} />
          <button onClick={() => setIsOpen(!isOpen)} className="text-cream/80 hover:text-primary transition-colors">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-charcoal border-t border-gold/10 overflow-hidden"
          >
            <nav className="container-hotel py-4 flex flex-col gap-1">
              {nav.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 text-sm font-body tracking-wide rounded transition-colors ${
                    location.pathname === link.href
                      ? "text-primary bg-charcoal-light"
                      : "text-cream/70 hover:text-primary hover:bg-charcoal-light"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <Link
                  to="/cardapio"
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 text-sm font-body tracking-wide rounded transition-colors flex items-center gap-2 ${
                    location.pathname === "/cardapio"
                      ? "text-primary bg-charcoal-light"
                      : "text-cream/70 hover:text-primary hover:bg-charcoal-light"
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  Cardápio
                </Link>
              )}
              {user ? (
                <button
                  onClick={() => { setIsOpen(false); handleSignOut(); }}
                  className="mt-2"
                >
                  <Button variant="gold" size="sm" className="w-full gap-2">
                    <LogOut className="w-4 h-4" />
                    Sair
                  </Button>
                </button>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)} className="mt-2">
                  <Button variant="gold" size="sm" className="w-full gap-2">
                    <User className="w-4 h-4" />
                    {login}
                  </Button>
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
