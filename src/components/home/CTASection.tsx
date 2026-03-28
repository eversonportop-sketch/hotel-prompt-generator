import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";

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
    <div className="relative z-10 container-hotel text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex items-center justify-center gap-1.5 mb-5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-primary text-primary" />
          ))}
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-cream mb-4">
          Pronto para sua <span className="text-gradient-gold">experiência</span>?
        </h2>
        <p className="text-cream/40 font-body max-w-lg mx-auto mb-10 text-lg leading-relaxed">
          Cadastre-se e tenha acesso exclusivo ao portal do hóspede, cardápio e as melhores ofertas do SB Hotel.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/cadastro">
            <button
              className="group flex items-center gap-2 px-10 py-4 rounded-xl font-body font-semibold text-sm tracking-[0.15em] uppercase transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(201,168,76,0.3)]"
              style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)", color: "#000" }}
            >
              Criar Conta Grátis <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
          <Link to="/login">
            <button className="flex items-center gap-2 px-10 py-4 rounded-xl font-body font-semibold text-sm tracking-[0.15em] uppercase border border-gold/30 text-cream/70 hover:text-cream hover:border-gold/60 transition-all">
              Já tenho conta
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
