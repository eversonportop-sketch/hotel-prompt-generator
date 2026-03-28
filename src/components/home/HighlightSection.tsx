import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import roomImage from "@/assets/room-luxury.jpg";
import hallImage from "@/assets/party-hall.jpg";
import poolImage from "@/assets/pool.jpg";
import { ArrowRight } from "lucide-react";

const highlights = [
  {
    title: "Quartos Premium",
    description: "Suítes elegantes com todo o conforto que você merece. Design sofisticado e amenidades exclusivas.",
    image: roomImage,
    link: "/quartos",
    cta: "Conhecer Quartos",
  },
  {
    title: "Salão de Festas",
    description: "Espaço luxuoso para eventos inesquecíveis. Capacidade e infraestrutura completa para sua celebração.",
    image: hallImage,
    link: "/salao",
    cta: "Ver Salão",
  },
  {
    title: "Piscina",
    description: "Área de lazer premium com piscina e espaço de relaxamento. Momentos únicos de tranquilidade.",
    image: poolImage,
    link: "/piscina",
    cta: "Ver Piscina",
  },
];

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
          Conheça o <span className="text-gradient-gold">SB Hotel</span>
        </h2>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {highlights.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.15 }}
            className="group relative overflow-hidden rounded-2xl bg-charcoal-light border border-white/5 hover:border-gold/25 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(201,168,76,0.1)]"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold text-cream mb-2">{item.title}</h3>
              <p className="text-cream/40 text-sm leading-relaxed mb-5 font-body">{item.description}</p>
              <Link
                to={item.link}
                className="group/btn flex items-center gap-2 text-primary text-sm font-body font-semibold hover:gap-3 transition-all"
              >
                {item.cta} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HighlightSection;
