import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import poolImage from "@/assets/pool.jpg";

const Piscina = () => {
  return (
    <Layout>
      <section className="relative h-[50vh] min-h-[400px] flex items-end overflow-hidden">
        <img src={poolImage} alt="Piscina SB Hotel" className="absolute inset-0 w-full h-full object-cover" width={800} height={600} />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-transparent" />
        <div className="relative z-10 container-hotel pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-2">Lazer</p>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-cream">
              Nossa <span className="text-gradient-gold">Piscina</span>
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-hotel max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-muted-foreground font-body leading-relaxed mb-8">
              Nossa área de piscina foi projetada para oferecer uma experiência de relaxamento
              completa. Com espreguiçadeiras confortáveis, área de bar e um ambiente cercado por
              paisagismo exuberante, é o lugar perfeito para aproveitar momentos de tranquilidade.
            </p>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-3">Regras de Uso</h3>
              <ul className="text-sm text-muted-foreground space-y-2 font-body">
                <li>• Horário: 7h às 22h</li>
                <li>• Uso obrigatório de trajes de banho</li>
                <li>• Menores de 12 anos acompanhados de responsável</li>
                <li>• Não é permitido alimentos de vidro na área da piscina</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Piscina;
