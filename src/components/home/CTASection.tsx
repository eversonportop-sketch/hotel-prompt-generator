import { motion } from "framer-motion";
import historiaBg from "@/assets/historia-bg.png";

const CTASection = () => (
  <section className="relative py-16 md:py-24 overflow-hidden">
    {/* Imagem de fundo — object-cover via img tag para controle total no mobile */}
    <img
      src={historiaBg}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 w-full h-full object-cover object-center"
    />

    {/* Overlay charcoal mais denso no mobile para suavizar o texto */}
    <div className="absolute inset-0" style={{ background: "hsl(220 20% 8% / 0.82)" }} />

    {/* Linha dourada superior */}
    <div
      className="absolute top-0 left-0 right-0 h-px"
      style={{ background: "linear-gradient(90deg, transparent, hsl(38 45% 55% / 0.5), transparent)" }}
    />
    {/* Linha dourada inferior */}
    <div
      className="absolute bottom-0 left-0 right-0 h-px"
      style={{ background: "linear-gradient(90deg, transparent, hsl(38 45% 55% / 0.5), transparent)" }}
    />

    <div className="relative z-10 w-full max-w-xl mx-auto px-5 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        {/* Label com traços laterais */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div
            className="h-px w-8 md:w-12"
            style={{ background: "linear-gradient(90deg, transparent, hsl(38 45% 55%))" }}
          />
          <p className="font-body text-[10px] md:text-xs tracking-[0.25em] uppercase text-primary">Nossa História</p>
          <div
            className="h-px w-8 md:w-12"
            style={{ background: "linear-gradient(90deg, hsl(38 45% 55%), transparent)" }}
          />
        </div>

        {/* Título — substituído text-white por cream/90 para não agredir os olhos */}
        <h2
          className="font-display text-2xl md:text-4xl font-bold mb-6 md:mb-8 leading-snug"
          style={{ color: "hsl(40 30% 92%)" }}
        >
          Hotel SB onde <span className="text-gradient-gold">história, propósito e acolhimento se encontram.</span>
        </h2>

        {/* Parágrafos — cor já estava boa, mantida */}
        <div
          className="space-y-4 font-body text-sm md:text-base leading-relaxed text-left"
          style={{ color: "hsl(40 20% 82%)" }}
        >
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
