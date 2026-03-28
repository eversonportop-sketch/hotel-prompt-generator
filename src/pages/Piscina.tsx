import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Waves, Clock, Sun, Shield, MessageCircle, ArrowRight } from "lucide-react";
import poolImage from "@/assets/pool.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const useSettings = () =>
  useQuery({
    queryKey: ["hotel_settings"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("hotel_settings").select("key, value");
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => {
        map[r.key] = r.value ?? "";
      });
      return map;
    },
    staleTime: 1000 * 60 * 5,
  });

const RULES = [
  "Uso obrigatório de trajes de banho",
  "Menores de 12 anos acompanhados de responsável",
  "Não é permitido vidro na área da piscina",
  "Chapéu e protetor solar recomendados",
  "Alimentação somente na área do bar",
  "Respeite os outros hóspedes",
];

const AMENITIES = [
  { icon: Sun, label: "Espreguiçadeiras", desc: "Confortáveis e com reserva" },
  { icon: Waves, label: "Piscina Adulto", desc: "1,40m de profundidade" },
  { icon: Shield, label: "Piscina Infantil", desc: "Área segura para crianças" },
  { icon: MessageCircle, label: "Bar à Beira", desc: "Drinks e petiscos" },
];

const Piscina = () => {
  const { data: s = {} } = useSettings();
  const poolHours = s.pool_hours || "07:00 às 22:00";
  const whatsapp = s.whatsapp || s.phone || "";
  const waNum = whatsapp.replace(/\D/g, "");
  const waMsg = encodeURIComponent("Olá! Gostaria de reservar uma espreguiçadeira na piscina do Hotel SB.");
  const waHref = waNum ? `https://wa.me/55${waNum}?text=${waMsg}` : `mailto:${s.email || "contato@sbhotel.com"}`;

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[65vh] min-h-[500px] flex items-end overflow-hidden">
        <img src={poolImage} alt="Piscina SB Hotel" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-charcoal/10" />
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(ellipse at 80% 100%,#C9A84C22,transparent 60%)" }}
        />
        <div className="relative z-10 container-hotel pb-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-primary font-body text-xs tracking-[0.4em] uppercase mb-3">Lazer</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-cream">
              Nossa <span className="text-gradient-gold">Piscina</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-24 bg-charcoal">
        <div className="container-hotel max-w-5xl">
          {/* Horário destaque */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mb-16"
          >
            <div
              className="flex items-center gap-4 rounded-2xl border border-gold/20 px-8 py-5"
              style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.02))" }}
            >
              <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-primary font-body tracking-widest uppercase mb-0.5">
                  Horário de funcionamento
                </p>
                <p className="font-display text-2xl font-bold text-cream">{poolHours}</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Esquerda */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold text-cream mb-5 leading-tight">
                Relaxe em <span className="text-gradient-gold">grande estilo</span>
              </h2>
              <p className="text-cream/40 font-body leading-relaxed mb-10">
                Nossa área de piscina foi projetada para oferecer uma experiência de relaxamento completa. Com
                espreguiçadeiras confortáveis, área de bar e um ambiente cercado por paisagismo exuberante, é o lugar
                perfeito para momentos de tranquilidade.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-10">
                {AMENITIES.map((a) => (
                  <div
                    key={a.label}
                    className="group bg-charcoal-light border border-white/5 rounded-xl p-4 hover:border-gold/20 transition-all duration-300"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <a.icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="font-body font-semibold text-cream text-sm">{a.label}</p>
                    <p className="font-body text-cream/40 text-xs mt-0.5">{a.desc}</p>
                  </div>
                ))}
              </div>

              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <button
                  className="group flex items-center gap-3 px-8 py-4 rounded-xl font-body text-sm tracking-[0.15em] uppercase font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(201,168,76,0.3)]"
                  style={{ background: "linear-gradient(135deg,#C9A84C 0%,#E5C97A 100%)", color: "#0A0A0A" }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Reservar Espreguiçadeira
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </a>
            </motion.div>

            {/* Regras */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div
                className="relative overflow-hidden rounded-2xl border border-gold/15 p-7"
                style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0))" }}
              >
                <div
                  className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10"
                  style={{ background: "radial-gradient(circle,#C9A84C,transparent)" }}
                />
                <div className="relative flex items-center gap-3 mb-7">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-cream">Regras de uso</h3>
                </div>
                <div className="relative space-y-1">
                  {RULES.map((rule, i) => (
                    <div key={i} className="flex items-start gap-4 py-3.5 border-b border-white/5 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-primary text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className="text-sm font-body text-cream/50 leading-relaxed">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Piscina;
