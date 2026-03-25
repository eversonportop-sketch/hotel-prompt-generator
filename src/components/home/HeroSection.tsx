import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const HeroSection = () => {
  const [heroImage, setHeroImage] = useState<string | null>(null);

  // Future: load hero image from admin config / Supabase
  // useEffect(() => { fetchHeroImage().then(setHeroImage); }, []);

  return (
    <section
      className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden"
      style={{
        border: '1px solid rgba(201, 168, 76, 0.15)',
      }}
    >
      {/* Background: image or gradient */}
      {heroImage ? (
        <>
          <img
            src={heroImage}
            alt="SB Hotel"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-[#0A0A0A]/40" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, #0A0A0A 0%, #1a1500 100%)',
          }}
        />
      )}

      <div className="relative z-10 text-center container-hotel">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-4">
            Bem-vindo ao
          </p>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-cream mb-6">
            SB <span className="text-gradient-gold">Hotel</span>
          </h1>
          <p className="text-cream/70 font-body text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Experiência premium em hospedagem. Conforto, elegância e sofisticação em cada detalhe.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quartos">
              <Button variant="hero" size="lg" className="px-10 py-6 text-base">
                Ver Quartos
              </Button>
            </Link>
            <Link to="/contato">
              <Button variant="gold-outline" size="lg" className="px-10 py-6 text-base">
                Fale Conosco
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
