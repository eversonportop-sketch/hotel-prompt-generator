import Layout from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
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
  const [lightbox, setLightbox] = useState<number | null>(null);
  const filtered = active === "Todos" ? photos : photos.filter((p) => p.category === active);

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
            <p className="text-primary font-body text-xs tracking-[0.4em] uppercase mb-5">Imagens</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-cream mb-4">
              Nossa <span className="text-gradient-gold">Galeria</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-gold/40" />
              <p className="text-cream/30 font-body text-sm tracking-widest">Conheça nossos espaços</p>
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-gold/40" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Galeria */}
      <section className="py-20 bg-charcoal">
        <div className="container-hotel">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap justify-center mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-5 py-2 rounded-full text-sm font-body transition-all duration-200 border ${
                  active === cat
                    ? "text-black border-primary font-semibold"
                    : "border-white/10 text-cream/50 hover:text-cream hover:border-white/20"
                }`}
                style={active === cat ? { background: "linear-gradient(135deg,#C9A84C,#E5C97A)" } : {}}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((photo, i) => (
                <motion.div
                  key={photo.alt}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/5 hover:border-gold/25 cursor-pointer transition-all duration-300 hover:shadow-[0_8px_40px_rgba(201,168,76,0.1)]"
                  onClick={() => setLightbox(photos.indexOf(photo))}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-sm flex items-center justify-center">
                      <ZoomIn className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs text-primary font-body tracking-widest uppercase">{photo.category}</span>
                    <p className="text-cream font-display font-semibold text-sm">{photo.alt}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-cream transition-colors">
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={photos[lightbox].src}
              alt={photos[lightbox].alt}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 text-center">
              <p className="text-cream/60 font-body text-sm">{photos[lightbox].alt}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Galeria;
