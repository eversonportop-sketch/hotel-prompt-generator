import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Sparkles, Tag, Clock, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const Promocoes = () => {
  const { data: promos = [], isLoading } = useQuery({
    queryKey: ["promotions-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("active", true) // campo correto que o admin usa
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
              <p className="text-cream/20 font-body text-sm mt-2">Volte em breve para conferir nossas ofertas!</p>
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
                  {/* Imagem ou banner de desconto */}
                  {promo.image_url ? (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={promo.image_url}
                        alt={promo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-charcoal flex items-center justify-center">
                      <div className="text-center">
                        {promo.discount_percent > 0 && (
                          <p className="font-display text-4xl font-bold text-primary">{promo.discount_percent}%</p>
                        )}
                        {promo.discount_fixed > 0 && (
                          <p className="font-display text-4xl font-bold text-primary">R$ {promo.discount_fixed}</p>
                        )}
                        <p className="text-cream/50 font-body text-sm tracking-widest uppercase mt-1">off</p>
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-body tracking-wider uppercase px-3 py-1 rounded-full border bg-primary/10 text-primary border-primary/20">
                        Promoção
                      </span>
                      <span className="font-display text-lg font-bold text-primary">
                        {promo.discount_percent > 0
                          ? `-${promo.discount_percent}%`
                          : promo.discount_fixed > 0
                            ? `-R$${promo.discount_fixed}`
                            : ""}
                      </span>
                    </div>

                    <h3 className="font-display text-xl font-semibold text-cream mb-2">{promo.title}</h3>
                    {promo.description && (
                      <p className="text-cream/40 text-sm font-body leading-relaxed mb-4 flex-1">{promo.description}</p>
                    )}

                    {promo.valid_until && (
                      <div className="flex items-center gap-1.5 text-xs text-cream/40 font-body mb-4">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Válido até {new Date(promo.valid_until).toLocaleDateString("pt-BR")}</span>
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
