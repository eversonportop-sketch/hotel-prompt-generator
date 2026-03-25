import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useState } from "react";
import roomImage from "@/assets/room-luxury.jpg";
import hallImage from "@/assets/party-hall.jpg";
import poolImage from "@/assets/pool.jpg";
import heroImage from "@/assets/hero-hotel.jpg";

const categories = ["Todos", "Quartos", "Salão", "Piscina"];

const photos = [
  { src: roomImage, category: "Quartos", alt: "Suíte Luxury" },
  { src: hallImage, category: "Salão", alt: "Salão de Festas" },
  { src: poolImage, category: "Piscina", alt: "Piscina" },
  { src: heroImage, category: "Quartos", alt: "Hotel Exterior" },
];

const Galeria = () => {
  const [active, setActive] = useState("Todos");
  const filtered = active === "Todos" ? photos : photos.filter((p) => p.category === active);

  return (
    <Layout>
      <section className="section-padding bg-background">
        <div className="container-hotel">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground">
              Nossa <span className="text-gradient-gold">Galeria</span>
            </h1>
          </motion.div>

          <div className="flex justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-5 py-2 rounded-full text-sm font-body transition-all duration-300 ${
                  active === cat
                    ? "bg-primary text-charcoal"
                    : "border border-border text-muted-foreground hover:border-primary/50 hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((photo, index) => (
              <motion.div
                key={`${photo.alt}-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="aspect-[4/3] rounded-lg overflow-hidden group"
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Galeria;
