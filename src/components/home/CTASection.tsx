import { motion } from "framer-motion";

const CTASection = () => (
  <section className="relative py-28 bg-charcoal overflow-hidden">
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
    <div className="relative z-10 container-hotel text-center max-w-2xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <p className="font-body text-xs tracking-[0.25em] uppercase text-primary mb-6">Nossa História</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-cream mb-8 leading-snug">
          Nascemos em Butiá, <span className="text-gradient-gold">por amor a ela.</span>
        </h2>
        <div className="space-y-5 text-cream/50 font-body text-base leading-relaxed">
          <p>
            O SB Hotel nasce com um propósito inovador, acreditando no grande potencial da nossa cidade e no amor por
            Butiá — a cidade que tanto nos acolhe.
          </p>
          <p>
            <span className="text-cream/70">Scalabrini. Baldinsera.</span> Sobrenomes de origem italiana, com propósito
            familiar e orgulho dos nossos antepassados. Do brasão Scalabrini, o trilho — símbolo de prosperidade,
            abundância e fertilidade. Do brasão Baldinsera, a coroa — honra, vitória, nobreza e soberania. Assim nasce
            nossa identidade.
          </p>
          <p>
            Esperamos poder lhe proporcionar uma estadia com o máximo de conforto e tranquilidade, e passar um pouco do
            nosso orgulho em receber cada hóspede neste mais novo empreendimento.
          </p>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
