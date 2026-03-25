import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import roomImage from "@/assets/room-luxury.jpg";
import hallImage from "@/assets/party-hall.jpg";
import poolImage from "@/assets/pool.jpg";

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

const HighlightSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-hotel">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-3">
            Nossos Espaços
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
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
              className="group relative overflow-hidden rounded-lg bg-card border border-border hover:border-primary/30 transition-all duration-500"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {item.description}
                </p>
                <Link to={item.link}>
                  <Button variant="gold-outline" size="sm">
                    {item.cta}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HighlightSection;
