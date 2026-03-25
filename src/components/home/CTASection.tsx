import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-hotel text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pronto para sua <span className="text-gradient-gold">experiência</span>?
          </h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto mb-8">
            Cadastre-se e tenha acesso exclusivo às melhores ofertas do SB Hotel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cadastro">
              <Button variant="hero" size="lg" className="px-10 py-6">
                Criar Conta
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="gold-outline" size="lg" className="px-10 py-6">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
