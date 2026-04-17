import { motion } from "framer-motion";
import { Wifi, Wind, Tv, Coffee, Car, Shield, Clock, Waves } from "lucide-react";

const amenities = [
  { icon: Wifi, label: "Wi-Fi de Alta Velocidade", desc: "Conexão premium em todo o hotel" },
  { icon: Wind, label: "Ar-Condicionado", desc: "Clima ideal em cada ambiente" },
  { icon: Tv, label: "TV a Cabo", desc: "Entretenimento completo" },
  { icon: Coffee, label: "Café da Manhã", desc: "Buffet completo incluso" },
  { icon: Car, label: "Estacionamento", desc: "Privativo e seguro" },
  { icon: Waves, label: "Área de Piscina", desc: "Lazer exclusivo para hóspedes" },
  { icon: Shield, label: "Segurança 24h", desc: "Monitoramento integral" },
  { icon: Clock, label: "Recepção 24h", desc: "Sempre à sua disposição" },
];

const AmenitiesSection = () => (
  <section className="relative py-20 md:py-28 bg-charcoal overflow-hidden">
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)",
        backgroundSize: "60px 60px",
      }}
    />
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-[0.06]"
      style={{ background: "radial-gradient(circle, #C9A84C, transparent)" }}
    />

    <div className="relative z-10 container-hotel">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <p className="text-primary font-body text-xs tracking-[0.35em] uppercase mb-3">Comodidades</p>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-cream">
          Tudo que você <span className="text-gradient-gold">precisa</span>
        </h2>
        <p className="text-cream/35 font-body text-sm md:text-base mt-4 max-w-md mx-auto leading-relaxed">
          Cada detalhe foi pensado para garantir conforto, praticidade e bem-estar durante toda a sua estadia.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {amenities.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group relative flex flex-col items-center text-center p-6 rounded-2xl bg-charcoal-light border border-white/5 hover:border-gold/25 transition-all duration-400 hover:shadow-[0_4px_30px_rgba(201,168,76,0.08)] cursor-default"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-body font-semibold text-cream text-sm leading-tight mb-1">{item.label}</h3>
              <p className="text-cream/35 font-body text-xs leading-relaxed">{item.desc}</p>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-primary group-hover:w-12 transition-all duration-400" />
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

export default AmenitiesSection;
