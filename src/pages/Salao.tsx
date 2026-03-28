import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import {
  Users,
  PartyPopper,
  Music,
  Utensils,
  Projector,
  Wifi,
  MessageCircle,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import hallImage from "@/assets/party-hall.jpg";
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

const FEATURES = [
  { icon: Users, label: "Até 200 pessoas" },
  { icon: PartyPopper, label: "Social e corporativo" },
  { icon: Music, label: "Som profissional" },
  { icon: Utensils, label: "Área para buffet" },
  { icon: Projector, label: "Projetor e telão" },
  { icon: Wifi, label: "Wi-Fi de alta velocidade" },
];

const INCLUDED = [
  "Mesas e cadeiras incluídas",
  "Estacionamento para convidados",
  "Iluminação especial ajustável",
  "Suporte da equipe do hotel",
  "Área de preparação exclusiva",
  "Climatização central",
];

const Salao = () => {
  const { data: s = {} } = useSettings();
  const whatsapp = s.whatsapp || s.phone || "";
  const waNum = whatsapp.replace(/\D/g, "");
  const waMsg = encodeURIComponent("Olá! Gostaria de solicitar um orçamento para o Salão de Festas do Hotel SB.");
  const waHref = waNum ? `https://wa.me/55${waNum}?text=${waMsg}` : `mailto:${s.email || "contato@sbhotel.com"}`;

  return (
    <Layout>
      {/* Hero */}
      <section className="relative h-[65vh] min-h-[500px] flex items-end overflow-hidden">
        <img src={hallImage} alt="Salão de Festas SB Hotel" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-charcoal/10" />
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: "radial-gradient(ellipse at 20% 100%,#C9A84C22,transparent 60%)" }}
        />
        <div className="relative z-10 container-hotel pb-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-primary font-body text-xs tracking-[0.4em] uppercase mb-3">Eventos</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-cream">
              Salão de <span className="text-gradient-gold">Festas</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-24 bg-charcoal">
        <div className="container-hotel max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Esquerda */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold text-cream mb-5 leading-tight">
                O espaço perfeito para <span className="text-gradient-gold">momentos únicos</span>
              </h2>
              <p className="text-cream/40 font-body leading-relaxed mb-10">
                Nosso salão de festas oferece um ambiente luxuoso e sofisticado para seus eventos mais especiais. Com
                decoração elegante, iluminação premium e infraestrutura completa, ideal para casamentos, aniversários,
                formaturas e eventos corporativos.
              </p>

              <p className="text-xs text-primary font-body tracking-[0.25em] uppercase mb-4">O que está incluído</p>
              <div className="space-y-3 mb-10">
                {INCLUDED.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-cream/60 font-body text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <button
                  className="group flex items-center gap-3 px-8 py-4 rounded-xl font-body text-sm tracking-[0.15em] uppercase font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(201,168,76,0.3)]"
                  style={{ background: "linear-gradient(135deg,#C9A84C 0%,#E5C97A 100%)", color: "#0A0A0A" }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Solicitar Orçamento
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </a>
            </motion.div>

            {/* Direita */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <p className="text-xs text-primary font-body tracking-[0.25em] uppercase mb-5">Infraestrutura</p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {FEATURES.map((f) => (
                  <div
                    key={f.label}
                    className="group bg-charcoal-light border border-white/5 rounded-xl p-4 flex items-center gap-3 hover:border-gold/20 transition-all duration-300"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <f.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-body text-cream/70">{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Capacidade */}
              <div
                className="relative overflow-hidden rounded-2xl border border-gold/20 p-7"
                style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.02))" }}
              >
                <div
                  className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-15"
                  style={{ background: "radial-gradient(circle,#C9A84C,transparent)" }}
                />
                <p className="text-xs text-primary font-body tracking-[0.25em] uppercase mb-2">Capacidade</p>
                <p className="font-display text-6xl font-bold text-cream mb-1">200</p>
                <p className="text-cream/40 font-body text-sm">pessoas em layout banquete</p>
                <div className="mt-5 pt-5 border-t border-gold/10 text-xs text-cream/30 font-body">
                  Outros layouts: coquetel (280 pax) · teatro (250 pax) · escolar (150 pax)
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Salao;
