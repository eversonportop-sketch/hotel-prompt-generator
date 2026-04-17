import { motion } from "framer-motion";
import { Star, MapPin, Heart, Award } from "lucide-react";

const diferenciais = [
  {
    icon: Star,
    title: "Experiência Premium",
    desc: "Cada detalhe foi planejado para superar suas expectativas e tornar sua estadia inesquecível.",
  },
  {
    icon: MapPin,
    title: "Localização Privilegiada",
    desc: "No coração de Butiá, com fácil acesso a tudo que a cidade tem a oferecer.",
  },
  {
    icon: Heart,
    title: "Atendimento Personalizado",
    desc: "Nossa equipe está dedicada a garantir que cada hóspede se sinta em casa.",
  },
  {
    icon: Award,
    title: "Padrão de Qualidade",
    desc: "Estrutura moderna, limpeza impecável e conforto em cada centímetro do hotel.",
  },
];

const DiferenciaisSection = () => (
  <section
    className="relative py-20 md:py-28 overflow-hidden"
    style={{ background: "linear-gradient(135deg, #0f0e0b 0%, #1a1710 100%)" }}
  >
    <div
      className="absolute top-0 left-0 right-0 h-px"
      style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.25), transparent)" }}
    />
    <div
      className="absolute bottom-0 left-0 right-0 h-px"
      style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.25), transparent)" }}
    />

    <div className="relative z-10 container-hotel">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <p className="text-primary font-body text-xs tracking-[0.35em] uppercase mb-3">Por que nos escolher</p>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-cream">
          Nossos <span className="text-gradient-gold">diferenciais</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {diferenciais.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group flex flex-col items-center text-center p-8 rounded-2xl border border-white/5 hover:border-gold/20 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(201,168,76,0.07)]"
              style={{ background: "rgba(201,168,76,0.03)" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                style={{
                  background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
              >
                <Icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-cream mb-3">{item.title}</h3>
              <p className="text-cream/40 font-body text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

export default DiferenciaisSection;
