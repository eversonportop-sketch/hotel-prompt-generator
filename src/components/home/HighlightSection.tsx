import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import roomImage from "@/assets/room-luxury.jpg";
import hallImage from "@/assets/party-hall.jpg";
import poolImage from "@/assets/pool.jpg";

const highlights = [
  {
    tag: "Acomodações",
    title: "Suítes & Quartos",
    description:
      "Ambientes pensados para oferecer repouso e sofisticação. Cada detalhe — da roupa de cama ao acabamento — foi escolhido para transformar sua estadia em uma experiência memorável.",
    storageKey: "quartos",
    fallback: roomImage,
    link: "/quartos",
    cta: "Conhecer Quartos",
  },
  {
    tag: "Eventos",
    title: "Salão de Festas",
    description:
      "Um ambiente amplo e acolhedor, ideal para celebrar momentos especiais. Estrutura completa, atendimento personalizado e uma curadoria de detalhes que elevam cada evento a uma experiência única.",
    storageKey: "salao",
    fallback: hallImage,
    link: "/salao",
    cta: "Ver o Salão",
  },
  {
    tag: "Lazer",
    title: "Área de Piscina",
    description:
      "Um ambiente de relaxamento e tranquilidade, onde o tempo desacelera e o bem-estar ganha o protagonismo, com uma infraestrutura pensada em cada detalhe para você poder relaxar e renovar suas energias.",
    storageKey: "piscina",
    fallback: poolImage,
    link: "/piscina",
    cta: "Conhecer a Piscina",
  },
];

function useFirstImage(category: string, fallback: string) {
  return useQuery({
    queryKey: ["highlight-img", category],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("hotel_gallery")
        .select("public_url")
        .eq("category", category)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error || !data || data.length === 0) return fallback;
      return data[0].public_url || fallback;
    },
    staleTime: 1000 * 60 * 5,
  });
}

function HighlightCard({ item, index }: { item: (typeof highlights)[0]; index: number }) {
  const { data: image } = useFirstImage(item.storageKey, item.fallback);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
    >
      <Link
        to={item.link}
        className="group block relative overflow-hidden rounded-2xl bg-charcoal-light border border-white/5 hover:border-gold/25 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(201,168,76,0.1)]"
      >
        {/* Imagem */}
        <div className="aspect-[4/3] overflow-hidden relative bg-charcoal-light">
          <img
            src={image || item.fallback}
            alt={item.title}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent pointer-events-none" />

          {/* Tag sobre a imagem */}
          <span className="absolute top-4 left-4 z-10 font-body text-[10px] tracking-[0.25em] uppercase text-primary bg-charcoal/80 backdrop-blur-md px-3 py-1 rounded-full border border-gold/30 shadow-lg">
            {item.tag}
          </span>
        </div>

        {/* Conteúdo */}
        <div className="p-6 flex flex-col gap-3">
          <h3 className="font-display text-xl font-semibold text-cream leading-tight">{item.title}</h3>

          <div className="w-8 h-px bg-gold/40" />

          <p className="text-cream/55 text-sm leading-relaxed font-body">{item.description}</p>

          <span className="group/btn inline-flex items-center gap-2 text-primary text-xs font-body font-semibold tracking-[0.15em] uppercase mt-1 group-hover:gap-3 transition-all">
            {item.cta}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

const HighlightSection = () => (
  <section className="py-24 bg-charcoal">
    <div className="container-hotel">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <p className="text-primary font-body text-xs tracking-[0.35em] uppercase mb-3">Nossos Espaços</p>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-cream">
          Conheça o <span className="text-gradient-gold">Hotel SB</span>
        </h2>
        <p className="text-cream/35 font-body text-sm md:text-base mt-4 max-w-md mx-auto leading-relaxed">
          Cada espaço foi projetado para oferecer conforto, beleza e experiências que ficam na memória.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {highlights.map((item, index) => (
          <HighlightCard key={item.title} item={item} index={index} />
        ))}
      </div>
    </div>
  </section>
);

export default HighlightSection;
