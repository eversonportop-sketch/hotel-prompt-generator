import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-hotel.jpg";

const HeroSection = () => {
  return (
    <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      <img
        src={heroImage}
        alt="SB Hotel - Fachada premium"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/60 to-charcoal/30" />

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
