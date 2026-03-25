import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import hotelLogo from "@/assets/hotel-sb-logo.png";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/quartos", label: "Quartos" },
  { href: "/salao", label: "Salão de Festas" },
  { href: "/piscina", label: "Piscina" },
  { href: "/promocoes", label: "Promoções" },
  { href: "/galeria", label: "Galeria" },
  { href: "/contato", label: "Contato" },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-charcoal/95 backdrop-blur-md border-b border-gold/10">
      <div className="container-hotel flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={hotelLogo}
            alt="Hotel SB - Sleep Better"
            className="h-10 md:h-12 w-auto object-contain"
          />
          <span className="font-body text-xs text-cream/40 tracking-widest uppercase hidden sm:block">
            Sleep Better
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3 py-2 text-sm font-body tracking-wide transition-colors duration-200 ${
                location.pathname === link.href
                  ? "text-primary"
                  : "text-cream/70 hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/login">
            <Button variant="gold-outline" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              Entrar
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="lg:hidden text-cream/80 hover:text-primary transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
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
              {navLinks.map((link) => (
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
              <Link to="/login" onClick={() => setIsOpen(false)} className="mt-2">
                <Button variant="gold" size="sm" className="w-full gap-2">
                  <User className="w-4 h-4" />
                  Entrar
                </Button>
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
