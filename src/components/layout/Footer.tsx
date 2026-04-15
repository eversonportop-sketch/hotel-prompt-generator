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
    <footer className="relative bg-charcoal text-cream/70 overflow-hidden">
      {/* Gradient glow at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 5%, hsl(38 45% 55% / 0.6) 30%, hsl(38 40% 72% / 0.8) 50%, hsl(38 45% 55% / 0.6) 70%, transparent 95%)",
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, hsl(38 45% 55% / 0.04) 0%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 100%, hsl(38 45% 55% / 0.03) 0%, transparent 70%)",
        }}
      />

      <div className="container-hotel relative py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* 1 — Brand */}
          <div className="lg:pr-6 text-center md:text-left">
            <h3 className="font-display text-3xl font-bold text-gradient-gold mb-1 tracking-wide">Hotel SB</h3>
            <div className="flex gap-0.5 mb-4 justify-center md:justify-start">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-primary text-xs">
                  ★
                </span>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-cream/50 mb-6 font-body italic">{tagline}</p>
            <div className="flex gap-3 justify-center md:justify-start">
              {[
                { href: igHref, icon: Instagram, label: "Instagram" },
                { href: fbHref, icon: Facebook, label: "Facebook" },
                ...(whatsapp
                  ? [{ href: `https://wa.me/${whatsapp.replace(/\D/g, "")}`, icon: Phone, label: "WhatsApp" }]
                  : []),
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group w-10 h-10 rounded-full border border-gold/20 flex items-center justify-center transition-all duration-500 hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_12px_hsl(38_45%_55%/0.2)]"
                >
                  <Icon className="w-4 h-4 text-cream/40 group-hover:text-primary transition-colors duration-500" />
                </a>
              ))}
            </div>
          </div>

          {/* 2 — Navegação */}
          <div className="text-center md:text-left">
            <h4 className="font-display text-sm uppercase tracking-[0.2em] text-primary/80 mb-5 font-medium">
              Navegação
            </h4>
            <div
              className="w-8 h-px mb-5 mx-auto md:mx-0"
              style={{ background: "linear-gradient(90deg, hsl(38 45% 55% / 0.5), transparent)" }}
            />
            <div className="flex flex-col gap-3 text-sm font-body items-center md:items-start">
              {[
                { to: "/", label: "Home" },
                { to: "/quartos", label: "Quartos" },
                { to: "/promocoes", label: "Promoções" },
                { to: "/salao", label: "Salão de Festas" },
                { to: "/piscina", label: "Piscina" },
                { to: "/galeria", label: "Galeria" },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-cream/50 hover:text-primary transition-colors duration-300 hover:translate-x-1 transform inline-block"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* 3 — Área do Cliente */}
          <div className="text-center md:text-left">
            <h4 className="font-display text-sm uppercase tracking-[0.2em] text-primary/80 mb-5 font-medium">
              Área do Cliente
            </h4>
            <div
              className="w-8 h-px mb-5 mx-auto md:mx-0"
              style={{ background: "linear-gradient(90deg, hsl(38 45% 55% / 0.5), transparent)" }}
            />
            <div className="flex flex-col gap-3 text-sm font-body items-center md:items-start">
              {[
                { to: "/login", label: "Login" },
                { to: "/cadastro", label: "Cadastro" },
                { to: "/portal", label: "Portal do Hóspede" },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-cream/50 hover:text-primary transition-colors duration-300 hover:translate-x-1 transform inline-block"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* 4 — Contato */}
          <div className="text-center md:text-left">
            <h4 className="font-display text-sm uppercase tracking-[0.2em] text-primary/80 mb-5 font-medium">
              Contato
            </h4>
            <div
              className="w-8 h-px mb-5 mx-auto md:mx-0"
              style={{ background: "linear-gradient(90deg, hsl(38 45% 55% / 0.5), transparent)" }}
            />
            <div className="flex flex-col gap-4 text-sm font-body items-center md:items-start">
              <a
                href={telHref}
                className="group flex items-center gap-3 text-cream/50 hover:text-cream/80 transition-colors duration-300"
              >
                <span className="w-8 h-8 rounded-full border border-gold/15 flex items-center justify-center group-hover:border-primary/40 transition-colors duration-300">
                  <Phone className="w-3.5 h-3.5 text-primary/70" />
                </span>
                {phone}
              </a>
              <a
                href={mailHref}
                className="group flex items-center gap-3 text-cream/50 hover:text-cream/80 transition-colors duration-300"
              >
                <span className="w-8 h-8 rounded-full border border-gold/15 flex items-center justify-center group-hover:border-primary/40 transition-colors duration-300">
                  <Mail className="w-3.5 h-3.5 text-primary/70" />
                </span>
                {email}
              </a>
              <a
                href={googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 text-cream/50 hover:text-cream/80 transition-colors duration-300"
              >
                <span className="w-8 h-8 rounded-full border border-gold/15 flex items-center justify-center flex-shrink-0 group-hover:border-primary/40 transition-colors duration-300">
                  <MapPin className="w-3.5 h-3.5 text-primary/70" />
                </span>
                <span className="pt-1.5">
                  {address}
                  {city ? `, ${city}` : ""}
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 md:mt-16 pt-6 relative">
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent 10%, hsl(38 45% 55% / 0.15) 50%, transparent 90%)",
            }}
          />
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-cream/30 font-body tracking-wide text-center">
            <span>© {new Date().getFullYear()} Hotel SB · Butiá, Rio Grande do Sul</span>
            <span className="text-cream/20">✦ Feito com elegância para sua melhor estadia ✦</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
