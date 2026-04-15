import { motion } from "framer-motion";
import historiaBg from "@/assets/historia-bg.png";
const CTASection = () => (
  <section className="relative py-24 overflow-hidden">
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${historiaBg})` }}
    />
    {/* Overlay harmonizado com bg-charcoal (hsl(220 20% 10%)) */}
    <div
      className="absolute inset-0"
      style={{ background: "linear-gradient(135deg, hsl(220 20% 8% / 0.92) 0%, hsl(220 20% 12% / 0.88) 100%)" }}
    />
    {/* Borda superior de transição */}
    <div
      className="absolute top-0 left-0 right-0 h-px"
      style={{ background: "linear-gradient(90deg, transparent, hsl(38 45% 55% / 0.3), transparent)" }}
    />
    {/* Borda inferior de transição */}
    <div
      className="absolute bottom-0 left-0 right-0 h-px"
      style={{ background: "linear-gradient(90deg, transparent, hsl(38 45% 55% / 0.3), transparent)" }}
    />
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl opacity-15"
      style={{ background: "radial-gradient(circle,#C9A84C,transparent)" }}
    />
    <div className="relative z-10 container-hotel text-center max-w-2xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <p className="font-body text-xs tracking-[0.25em] uppercase text-primary mb-6">Nossa História</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-8 leading-snug">
          Hotel SB onde <span className="text-gradient-gold">história, propósito e acolhimento se encontram.</span>
        </h2>
        <div className="space-y-5 text-white/90 font-body text-base leading-relaxed">
          <p>
            Em meio à essência acolhedora de Butiá nasce o Hotel SB, com propósito inovador. O Hotel SB surge da crença
            profunda no potencial dessa cidade, um lugar que não apenas recebe, mas abraça, carrega histórias, raízes e
            um sentimento raro de pertencimento.
          </p>
          <p>
            Inspirado nos sobrenomes <span className="text-primary font-semibold">Segabinazzi Baldissera</span>, de
            origem italiana, nosso espaço carrega mais que um nome, carrega legado, com propósito familiar, orgulho dos
            nossos antepassados e a força de uma construção familiar que valoriza cada detalhe.
          </p>
          <p>
            Nossa identidade é representada por símbolos, cada elemento traduz aquilo que acreditamos, como
            prosperidade, abundância, vitória, recompensa, nobreza, soberania, força, propósito, tudo foi pensado para
            transmitir não somente estética, mas significado.
          </p>
          <p>
            O Hotel SB nasce para oferecer mais que hospedagem, mas proporcionar uma experiência. Receber você não é um
            serviço, é uma honra. E é com esse olhar atento e genuíno que abrimos nossas portas, para que cada estadia
            seja leve, memorável e, acima de tudo, sentida.
          </p>
        </div>
      </motion.div>
    </div>
  </section>
);
export default CTASection;
