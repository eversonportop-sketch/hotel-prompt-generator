import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Users, ArrowRight, Star, DoorOpen, Calendar } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useEffect } from "react";

interface CategoryGroup {
  category: string;
  image: string;
  minPrice: number;
  minPromoPrice: number | null;
  totalRooms: number;
  capacity: number;
  firstRoomId: string;
}

const Quartos = () => {
  const [searchParams] = useSearchParams();
  const checkin = searchParams.get("checkin") || "";
  const checkout = searchParams.get("checkout") || "";
  const guests = Number(searchParams.get("guests") || 2);

  // Salva as datas no sessionStorage para o QuartoDetalhe ler automaticamente
  useEffect(() => {
    if (checkin && checkout) {
      sessionStorage.setItem(
        "reserva_intent",
        JSON.stringify({ checkIn: checkin, checkOut: checkout, guestsCount: guests }),
      );
    }
  }, [checkin, checkout, guests]);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").eq("status", "active").order("name");
      if (error) throw error;
      return data;
    },
  });

  const categories = useMemo<CategoryGroup[]>(() => {
    const map = new Map<string, any[]>();
    rooms.forEach((r: any) => {
      const cat = r.category || "Geral";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    });
    return Array.from(map.entries()).map(([category, list]) => {
      const prices = list.map((r: any) => Number(r.price));
      const regularPrices = list.map((r: any) => Number(r.price));
      const hasPromo = list.some((r: any) => r.promotional_price);
      return {
        category,
        image: list[0].image_url || "/placeholder.svg",
        minPrice: Math.min(...regularPrices),
        minPromoPrice: hasPromo
          ? Math.min(...list.filter((r: any) => r.promotional_price).map((r: any) => Number(r.promotional_price)))
          : null,
        totalRooms: list.length,
        capacity: Math.max(...list.map((r: any) => r.capacity || 2)),
        firstRoomId: list[0].id,
      };
    });
  }, [rooms]);

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

      {/* Banner de datas selecionadas */}
      {checkin && checkout && (
        <section className="bg-charcoal-light border-b border-gold/10">
          <div className="container-hotel py-4 flex flex-wrap items-center justify-center gap-6 text-sm font-body">
            <div className="flex items-center gap-2 text-cream/60">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Check-in:</span>
              <span className="text-cream font-semibold">
                {new Date(checkin + "T12:00:00").toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="w-px h-4 bg-gold/20 hidden sm:block" />
            <div className="flex items-center gap-2 text-cream/60">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Check-out:</span>
              <span className="text-cream font-semibold">
                {new Date(checkout + "T12:00:00").toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="w-px h-4 bg-gold/20 hidden sm:block" />
            <div className="flex items-center gap-2 text-cream/60">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-cream font-semibold">
                {guests} {guests === 1 ? "hóspede" : "hóspedes"}
              </span>
            </div>
            <Link
              to="/"
              className="text-xs text-primary/60 hover:text-primary underline underline-offset-2 transition-colors"
            >
              Alterar datas
            </Link>
          </div>
        </section>
      )}

      {/* Política de preço */}
      <section className="py-8 bg-charcoal">
        <div className="container-hotel">
          <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-gold/20 bg-black/30 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary/70 font-body mb-0.5">Política de tarifas</p>
              <p className="text-sm text-cream/60 font-body leading-relaxed">
                Todos os quartos possuem <span className="text-cream">tarifa mínima para 1 pessoa</span> — quartos com
                configuração flexível de camas conforme sua necessidade. Cada hóspede adicional tem um{" "}
                <span className="text-cream">valor acrescido por pessoa</span>, exibido em cada acomodação.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid por categoria */}
      <section className="py-20 bg-charcoal">
        <div className="container-hotel">
          {isLoading ? (
            <div className="text-center text-cream/30 font-body py-20">Carregando quartos...</div>
          ) : categories.length === 0 ? (
            <div className="text-center text-cream/30 font-body py-20">Nenhum quarto disponível no momento.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {categories.map((cat, index) => (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-charcoal-light rounded-2xl border border-white/5 hover:border-gold/25 overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgba(201,168,76,0.1)]"
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={cat.image}
                      alt={cat.category}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {cat.minPromoPrice !== null && (
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
                      <span className="text-xs text-primary font-body tracking-wider uppercase">{cat.category}</span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                    <h3 className="font-display text-xl font-semibold text-cream mt-1 mb-3">{cat.category}</h3>
                    <div className="flex items-center gap-4 text-sm text-cream/40 font-body mb-5">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary/60" /> Até {cat.capacity} pessoas
                      </span>
                      <span className="flex items-center gap-1.5">
                        <DoorOpen className="w-4 h-4 text-primary/60" /> {cat.totalRooms} quarto
                        {cat.totalRooms > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div>
                        <span className="text-2xl font-display font-bold text-primary">
                          R$ {cat.minPrice.toFixed(0)}
                        </span>
                        <span className="text-sm text-cream/30 font-body"> /noite (1 pessoa)</span>
                        {cat.minPromoPrice !== null && (
                          <div className="text-xs text-primary/70 mt-0.5">
                            + R$ {cat.minPromoPrice.toFixed(0)} por pessoa adicional
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/quartos/${cat.firstRoomId}${checkin ? `?checkin=${checkin}&checkout=${checkout}&guests=${guests}` : ""}`}
                      >
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
