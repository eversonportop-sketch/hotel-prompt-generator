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
  { icon: PartyPopper, label: "Eventos sociais e corporativos" },
  { icon: Music, label: "Sistema de som profissional" },
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
      {/* Hero com foto */}
      <section className="relative h-[60vh] min-h-[450px] flex items-end overflow-hidden">
        <img src={hallImage} alt="Salão de Festas SB Hotel" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-transparent" />
        <div className="relative z-10 container-hotel pb-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-primary font-body text-xs tracking-[0.35em] uppercase mb-3">Eventos</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-cream">
              Salão de <span className="text-gradient-gold">Festas</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-20 bg-background">
        <div className="container-hotel max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
            {/* Coluna esquerda */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="font-display text-3xl font-bold text-foreground mb-5">
                O espaço perfeito para <span className="text-gradient-gold">momentos únicos</span>
              </h2>
              <p className="text-muted-foreground font-body leading-relaxed mb-8">
                Nosso salão de festas oferece um ambiente luxuoso e sofisticado para seus eventos mais especiais. Com
                decoração elegante, iluminação premium e infraestrutura completa, o espaço é ideal para casamentos,
                aniversários, formaturas e eventos corporativos.
              </p>

              {/* Incluído */}
              <h3 className="font-display text-sm font-semibold text-foreground mb-4 tracking-wider uppercase text-primary/70">
                O que está incluído
              </h3>
              <div className="grid grid-cols-1 gap-2 mb-8">
                {INCLUDED.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-body text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <button
                  className="flex items-center gap-3 px-8 py-4 rounded-xl font-body text-sm tracking-[0.15em] uppercase font-semibold transition-all duration-300 hover:scale-[1.02] group"
                  style={{ background: "linear-gradient(135deg, #C9A84C 0%, #E5C97A 100%)", color: "#0A0A0A" }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Solicitar Orçamento
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </a>
            </motion.div>

            {/* Coluna direita — features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <h3 className="font-display text-sm font-semibold text-foreground mb-6 tracking-wider uppercase text-primary/70">
                Infraestrutura
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {FEATURES.map((f) => (
                  <div
                    key={f.label}
                    className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <f.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-body text-foreground">{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Card de destaque */}
              <div
                className="relative rounded-xl overflow-hidden border border-gold/20"
                style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.03))" }}
              >
                <div className="p-6">
                  <p className="text-xs text-primary font-body tracking-[0.2em] uppercase mb-2">Capacidade</p>
                  <p className="font-display text-5xl font-bold text-foreground mb-1">200</p>
                  <p className="text-muted-foreground font-body text-sm">pessoas em layout banquete</p>
                  <div className="mt-4 pt-4 border-t border-gold/10 text-xs text-muted-foreground font-body">
                    Outros layouts disponíveis: coquetel (280 pax), teatro (250 pax), escolar (150 pax)
                  </div>
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
