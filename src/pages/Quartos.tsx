import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Users, BedDouble, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Quartos = () => {
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").eq("status", "active").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-36 bg-charcoal overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-5"
          style={{ background: "radial-gradient(circle,#C9A84C,transparent)" }}
        />
        <div className="relative z-10 container-hotel text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-primary font-body text-xs tracking-[0.4em] uppercase mb-5">Acomodações</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-cream mb-4">
              Nossos <span className="text-gradient-gold">Quartos</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-gold/40" />
              <p className="text-cream/30 font-body text-sm tracking-widest">Conforto e elegância</p>
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-gold/40" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-20 bg-charcoal">
        <div className="container-hotel">
          {isLoading ? (
            <div className="text-center text-cream/30 font-body py-20">Carregando quartos...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center text-cream/30 font-body py-20">Nenhum quarto disponível no momento.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {rooms.map((room: any, index: number) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-charcoal-light rounded-2xl border border-white/5 hover:border-gold/25 overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgba(201,168,76,0.1)]"
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={room.image_url || "/placeholder.svg"}
                      alt={room.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {room.promotional_price && (
                      <div
                        className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold font-body"
                        style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)", color: "#000" }}
                      >
                        Promoção
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-primary font-body tracking-wider uppercase">{room.category}</span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                    <h3 className="font-display text-xl font-semibold text-cream mt-1 mb-3">{room.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-cream/40 font-body mb-5">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary/60" /> {room.capacity} pessoas
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BedDouble className="w-4 h-4 text-primary/60" /> {room.beds}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div>
                        {room.promotional_price && (
                          <span className="text-sm text-cream/30 line-through font-body mr-2">
                            R$ {Number(room.price).toFixed(0)}
                          </span>
                        )}
                        <span className="text-2xl font-display font-bold text-primary">
                          R$ {Number(room.promotional_price || room.price).toFixed(0)}
                        </span>
                        <span className="text-sm text-cream/30 font-body"> /noite</span>
                      </div>
                      <Link to={`/quartos/${room.id}`}>
                        <button
                          className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-body font-semibold transition-all duration-300 hover:scale-[1.02]"
                          style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)", color: "#000" }}
                        >
                          Ver Detalhes
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </Link>
                    </div>
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

export default Quartos;
