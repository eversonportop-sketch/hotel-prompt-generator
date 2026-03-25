import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const PromotionsSection = () => {
  return (
    <section className="section-padding bg-charcoal">
      <div className="container-hotel text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="font-display text-3xl md:text-5xl font-bold text-cream mb-4">
            Promoções <span className="text-gradient-gold">Especiais</span>
          </h2>
          <p className="text-cream/60 font-body max-w-xl mx-auto mb-8 leading-relaxed">
            Aproveite nossas ofertas exclusivas e viva uma experiência inesquecível no SB Hotel.
          </p>
          <Link to="/promocoes">
            <Button variant="hero" size="lg" className="px-10 py-6">
              Ver Promoções
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PromotionsSection;
