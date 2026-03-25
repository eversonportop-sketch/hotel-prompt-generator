import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockPromotions = [
  { id: 1, title: "Pacote Romântico", description: "2 noites na Suíte Premium com café da manhã e decoração especial.", type: "Pacote", cta: "Reservar" },
  { id: 2, title: "15% OFF Midweek", description: "Desconto exclusivo para hospedagens de segunda a quinta-feira.", type: "Desconto", cta: "Aproveitar" },
  { id: 3, title: "Família Feliz", description: "Crianças até 6 anos não pagam. Inclui acesso à piscina e café da manhã.", type: "Destaque", cta: "Saiba Mais" },
];

const Promocoes = () => {
  return (
    <Layout>
      <section className="section-padding bg-background">
        <div className="container-hotel">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground">
              Promoções <span className="text-gradient-gold">Especiais</span>
            </h1>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {mockPromotions.map((promo, index) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card border border-border rounded-lg p-8 text-center hover:border-primary/30 transition-all duration-300"
              >
                <span className="text-xs text-primary font-body tracking-wider uppercase">{promo.type}</span>
                <h3 className="font-display text-xl font-semibold text-foreground mt-2 mb-3">{promo.title}</h3>
                <p className="text-muted-foreground text-sm font-body mb-6 leading-relaxed">{promo.description}</p>
                <Button variant="gold" size="sm">{promo.cta}</Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Promocoes;
