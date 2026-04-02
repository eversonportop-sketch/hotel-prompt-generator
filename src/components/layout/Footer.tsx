import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Instagram, Facebook } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const useSettings = () => {
  return useQuery({
    queryKey: ["hotel_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("hotel_settings" as any).select("key, value");
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        map[row.key] = row.value ?? "";
      });
      return map;
    },
    staleTime: 1000 * 60 * 5,
  });
};

const Footer = () => {
  const { data: s = {} } = useSettings();

  const phone = s.phone || "(00) 0000-0000";
  const email = s.email || "contato@sbhotel.com";
  const address = s.address || "Endereço do Hotel";
  const city = s.city || "Butiá - RS";
  const instagram = s.instagram || "#";
  const facebook = s.facebook || "#";
  const googleMaps = s.google_maps_url || "#";
  const whatsapp = s.whatsapp || "";
  const tagline = s.tagline || "Experiência premium em hospedagem. Conforto, elegância e sofisticação em cada detalhe.";

  const igHref = instagram.startsWith("http")
    ? instagram
    : instagram !== "#"
      ? `https://instagram.com/${instagram.replace("@", "")}`
      : "#";
  const fbHref = facebook.startsWith("http") ? facebook : facebook !== "#" ? `https://facebook.com/${facebook}` : "#";
  const telHref = `tel:${(whatsapp || phone).replace(/\D/g, "")}`;
  const mailHref = `mailto:${email}`;

  return (
    <footer className="bg-charcoal text-cream/70 border-t border-gold/10">
      <div className="container-hotel py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* 1 — Logo + Estrelas + Redes */}
          <div>
            <h3 className="font-display text-2xl font-bold text-gradient-gold mb-2">SB Hotel</h3>
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-primary text-sm">★</span>
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-5">{tagline}</p>
            <div className="flex gap-3">
              <a
                href={igHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center hover:bg-primary hover:text-charcoal hover:border-primary transition-all duration-300"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={fbHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center hover:bg-primary hover:text-charcoal hover:border-primary transition-all duration-300"
              >
                <Facebook className="w-4 h-4" />
              </a>
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full border border-gold/30 flex items-center justify-center hover:bg-primary hover:text-charcoal hover:border-primary transition-all duration-300"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* 2 — Navegação */}
          <div>
            <h4 className="font-display text-lg text-cream mb-4">Navegação</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/" className="hover:text-primary transition-colors">Home</Link>
              <Link to="/quartos" className="hover:text-primary transition-colors">Quartos</Link>
              <Link to="/promocoes" className="hover:text-primary transition-colors">Promoções</Link>
              <Link to="/salao" className="hover:text-primary transition-colors">Salão de Festas</Link>
              <Link to="/piscina" className="hover:text-primary transition-colors">Piscina</Link>
              <Link to="/galeria" className="hover:text-primary transition-colors">Galeria</Link>
            </div>
          </div>

          {/* 3 — Área do Cliente */}
          <div>
            <h4 className="font-display text-lg text-cream mb-4">Área do Cliente</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
              <Link to="/cadastro" className="hover:text-primary transition-colors">Cadastro</Link>
              <Link to="/portal" className="hover:text-primary transition-colors">Portal do Hóspede</Link>
            </div>
          </div>

          {/* 4 — Contato */}
          <div>
            <h4 className="font-display text-lg text-cream mb-4">Contato</h4>
            <div className="flex flex-col gap-3 text-sm">
              <a href={telHref} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                {phone}
              </a>
              <a href={mailHref} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                {email}
              </a>
              <a
                href={googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 hover:text-primary transition-colors"
              >
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{address}{city ? `, ${city}` : ""}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gold/10 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-cream/40">
          <span>© {new Date().getFullYear()} SB Hotel · Butiá, Rio Grande do Sul. Todos os direitos reservados.</span>
          <span>Feito com ♥ para sua melhor estadia</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
