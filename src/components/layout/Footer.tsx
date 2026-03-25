import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Instagram, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-charcoal text-cream/70 border-t border-gold/10">
      <div className="container-hotel py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl font-bold text-gradient-gold mb-4">SB Hotel</h3>
            <p className="text-sm leading-relaxed">
              Experiência premium em hospedagem. Conforto, elegância e sofisticação em cada detalhe.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display text-lg text-cream mb-4">Navegação</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/quartos" className="hover:text-primary transition-colors">Quartos</Link>
              <Link to="/salao" className="hover:text-primary transition-colors">Salão de Festas</Link>
              <Link to="/piscina" className="hover:text-primary transition-colors">Piscina</Link>
              <Link to="/promocoes" className="hover:text-primary transition-colors">Promoções</Link>
              <Link to="/galeria" className="hover:text-primary transition-colors">Galeria</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg text-cream mb-4">Contato</h4>
            <div className="flex flex-col gap-3 text-sm">
              <a href="tel:+5500000000000" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="w-4 h-4 text-primary" />
                (00) 0000-0000
              </a>
              <a href="mailto:contato@sbhotel.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary" />
                contato@sbhotel.com
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <span>Endereço do Hotel</span>
              </div>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display text-lg text-cream mb-4">Redes Sociais</h4>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center hover:bg-primary hover:text-charcoal transition-all duration-300">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center hover:bg-primary hover:text-charcoal transition-all duration-300">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gold/10 text-center text-xs text-cream/40">
          © {new Date().getFullYear()} SB Hotel. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
