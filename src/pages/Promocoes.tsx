import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Sparkles, Tag, Clock, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const TYPE_LABELS: Record<string, string> = {
  percentage: "Desconto",
  fixed: "Valor Fixo",
  package: "Pacote",
  season: "Temporada",
  last_minute: "Última Hora",
};

const TYPE_COLORS: Record<string, string> = {
  percentage: "bg-green-500/10 text-green-600 border-green-500/20",
  fixed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  package: "bg-primary/10 text-primary border-primary/20",
  season: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  last_minute: "bg-red-500/10 text-red-600 border-red-500/20",
};

const Promocoes = () => {
  const { data: promos = [], isLoading } = useQuery({
    queryKey: ["promotions-public"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("promotions")
        .select("*")
        .eq("is_active", true)
        .eq("show_on_homepage", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-32 bg-charcoal overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5 blur-3xl"
          style={{ background: "radial-gradient(circle, #C9A84C, transparent)" }}
        />
        <div className="relative z-10 container-hotel text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
            <h1 className="font-display text-5xl md:text-7xl font-bold text-cream mb-4">
              Promoções <span className="text-gradient-gold">Especiais</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/40" />
              <p className="text-cream/40 font-body text-sm">Ofertas exclusivas para você</p>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/40" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Promoções */}
      <section className="py-20 bg-charcoal">
        <div className="container-hotel">
          {isLoading ? (
            <div className="text-center py-20 text-cream/40 font-body animate-pulse">Carregando promoções...</div>
          ) : promos.length === 0 ? (
            <div className="text-center py-20">
              <Tag className="w-12 h-12 text-primary/20 mx-auto mb-4" />
              <p className="text-cream/40 font-body">Nenhuma promoção ativa no momento.</p>
              <p className="text-cream/40/60 font-body text-sm mt-2">Volte em breve para conferir nossas ofertas!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {promos.map((promo: any, index: number) => (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-charcoal-light border border-gold/10 rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-lg flex flex-col"
                >
                  {/* Imagem ou banner de cor */}
                  {promo.cover_image_url ? (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={promo.cover_image_url}
                        alt={promo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-charcoal flex items-center justify-center">
                      <div className="text-center">
                        <p className="font-display text-4xl font-bold text-primary">
                          {promo.type === "percentage" ? `${promo.discount_value}%` : `R$${promo.discount_value}`}
                        </p>
                        <p className="text-cream/50 font-body text-sm tracking-widest uppercase mt-1">off</p>
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs font-body tracking-wider uppercase px-3 py-1 rounded-full border ${TYPE_COLORS[promo.type] || "bg-primary/10 text-primary border-primary/20"}`}
                      >
                        {TYPE_LABELS[promo.type] || promo.type}
                      </span>
                      {promo.discount_value > 0 && (
                        <span className="font-display text-lg font-bold text-primary">
                          {promo.type === "percentage" ? `-${promo.discount_value}%` : `-R$${promo.discount_value}`}
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-xl font-semibold text-cream mb-2">{promo.title}</h3>
                    <p className="text-cream/40 text-sm font-body leading-relaxed mb-4 flex-1">{promo.description}</p>

                    {promo.valid_until && (
                      <div className="flex items-center gap-1.5 text-xs text-cream/40 font-body mb-4">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Válido até {new Date(promo.valid_until).toLocaleDateString("pt-BR")}</span>
                      </div>
                    )}

                    {promo.promo_code && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mb-4 flex items-center justify-between">
                        <span className="text-xs text-cream/40 font-body">Código:</span>
                        <span className="font-mono text-sm font-bold text-primary tracking-widest">
                          {promo.promo_code}
                        </span>
                      </div>
                    )}

                    <Link to="/quartos" className="w-full mt-auto">
                      <button
                        className="w-full py-3 rounded-lg font-body text-sm tracking-[0.15em] uppercase font-semibold transition-all duration-300 flex items-center justify-center gap-2 group"
                        style={{ background: "linear-gradient(135deg, #C9A84C 0%, #E5C97A 100%)", color: "#0A0A0A" }}
                      >
                        Aproveitar oferta
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Promocoes;
