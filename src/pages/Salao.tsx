import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, PartyPopper } from "lucide-react";
import hallImage from "@/assets/party-hall.jpg";

const Salao = () => {
  return (
    <Layout>
      <section className="relative h-[50vh] min-h-[400px] flex items-end overflow-hidden">
        <img src={hallImage} alt="Salão de Festas SB Hotel" className="absolute inset-0 w-full h-full object-cover" width={800} height={600} />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-transparent" />
        <div className="relative z-10 container-hotel pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-2">Eventos</p>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-cream">
              Salão de <span className="text-gradient-gold">Festas</span>
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container-hotel max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-body">Capacidade: até 200 pessoas</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <PartyPopper className="w-5 h-5 text-primary" />
                <span className="font-body">Eventos sociais e corporativos</span>
              </div>
            </div>
            <p className="text-muted-foreground font-body leading-relaxed mb-8">
              Nosso salão de festas oferece um ambiente luxuoso e sofisticado para seus eventos mais especiais.
              Com decoração elegante, iluminação premium e infraestrutura completa, o espaço é ideal para
              casamentos, aniversários, formaturas e eventos corporativos.
            </p>
            <Button variant="hero" size="lg" className="px-10 py-6">
              Solicitar Orçamento
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Salao;
