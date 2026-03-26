import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Calendar, Users, Search, Star } from "lucide-react";
import hotelLogo from "@/assets/hotel-sb-logo.png";

const HeroSection = () => {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Fundo com gradiente rico */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 20% 50%, #1a1200 0%, #0A0A0A 50%, #0d0800 100%)",
        }}
      />

      {/* Grade decorativa */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Brilho central */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)" }}
      />

      {/* Brilho lateral esquerdo */}
      <div
        className="absolute top-1/2 left-0 w-[300px] h-[400px] rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #C0272D 0%, transparent 70%)" }}
      />

      {/* Partículas douradas animadas */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full"
          style={{
            background: "#C9A84C",
            left: `${10 + i * 7.5}%`,
            top: `${15 + (i % 5) * 15}%`,
            opacity: 0.4 + (i % 3) * 0.2,
          }}
          animate={{
            y: [-8, 8, -8],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Linhas decorativas laterais */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3 opacity-30">
        <div className="w-px h-24 bg-gradient-to-b from-transparent to-gold" />
        <div className="w-1 h-1 rounded-full bg-gold" />
        <div className="w-px h-24 bg-gradient-to-b from-gold to-transparent" />
      </div>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3 opacity-30">
        <div className="w-px h-24 bg-gradient-to-b from-transparent to-gold" />
        <div className="w-1 h-1 rounded-full bg-gold" />
        <div className="w-px h-24 bg-gradient-to-b from-gold to-transparent" />
      </div>

      {/* Conteúdo principal */}
      <div className="relative z-10 text-center container-hotel px-6 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <img src={hotelLogo} alt="Hotel SB" className="h-24 md:h-32 w-auto mx-auto drop-shadow-2xl" />
        </motion.div>

        {/* Estrelas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center gap-1.5 mb-6"
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
            >
              <Star className="w-4 h-4 fill-primary text-primary" />
            </motion.div>
          ))}
        </motion.div>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.1em" }}
          animate={{ opacity: 1, letterSpacing: "0.35em" }}
          transition={{ duration: 1, delay: 0.4 }}
          className="flex items-center gap-4 mb-5"
        >
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary opacity-60" />
          <p className="text-primary font-body text-xs tracking-[0.35em] uppercase">Butiá · Rio Grande do Sul</p>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary opacity-60" />
        </motion.div>

        {/* Título principal */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
          className="font-display text-6xl md:text-8xl lg:text-9xl font-bold mb-4 leading-none"
        >
          <span className="text-cream">SB</span> <span className="text-gradient-gold">Hotel</span>
        </motion.h1>

        {/* Tagline com separador dourado */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex items-center gap-4 mb-4"
        >
          <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-gold/50" />
          <p className="font-display text-primary text-sm md:text-base tracking-[0.4em] uppercase italic">
            Sleep Better
          </p>
          <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-gold/50" />
        </motion.div>

        {/* Descrição */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="text-cream/60 font-body text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Experiência premium em hospedagem. Conforto, elegância e sofisticação em cada detalhe.
        </motion.p>

        {/* Botões */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link to="/quartos">
            <Button variant="hero" size="lg" className="px-10 py-6 text-base min-w-48">
              Ver Quartos
            </Button>
          </Link>
          <Link to="/contato">
            <Button variant="gold-outline" size="lg" className="px-10 py-6 text-base min-w-48">
              Fale Conosco
            </Button>
          </Link>
        </motion.div>

        {/* Buscador de reservas */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="w-full max-w-3xl"
        >
          {/* Linha decorativa acima */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            <p className="text-cream/30 font-body text-xs tracking-[0.2em] uppercase">Verificar Disponibilidade</p>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          </div>

          <div
            className="rounded-lg p-1"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0.05) 100%)",
              border: "1px solid rgba(201,168,76,0.25)",
            }}
          >
            <div className="bg-charcoal/95 backdrop-blur rounded-md p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                {/* Check-in */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-primary font-body tracking-[0.15em] uppercase mb-2">
                    <Calendar className="w-3 h-3" />
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-charcoal-light border border-gold/15 text-cream rounded px-3 py-2.5 text-sm font-body focus:outline-none focus:border-gold/40 transition-colors"
                  />
                </div>
                {/* Check-out */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-primary font-body tracking-[0.15em] uppercase mb-2">
                    <Calendar className="w-3 h-3" />
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-charcoal-light border border-gold/15 text-cream rounded px-3 py-2.5 text-sm font-body focus:outline-none focus:border-gold/40 transition-colors"
                  />
                </div>
                {/* Hóspedes */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-primary font-body tracking-[0.15em] uppercase mb-2">
                    <Users className="w-3 h-3" />
                    Hóspedes
                  </label>
                  <div className="flex items-center gap-2 bg-charcoal-light border border-gold/15 rounded px-3 py-2.5">
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="text-cream/50 hover:text-primary transition-colors w-5 h-5 flex items-center justify-center text-lg leading-none"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center text-cream text-sm font-body">
                      {guests} {guests === 1 ? "hóspede" : "hóspedes"}
                    </span>
                    <button
                      onClick={() => setGuests(Math.min(6, guests + 1))}
                      className="text-cream/50 hover:text-primary transition-colors w-5 h-5 flex items-center justify-center text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <Link
                to={`/quartos${checkIn ? `?checkin=${checkIn}&checkout=${checkOut}&guests=${guests}` : ""}`}
                className="block"
              >
                <button
                  className="w-full py-3 rounded font-body text-sm tracking-[0.2em] uppercase font-medium transition-all duration-300 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #C0272D 0%, #8B1A1E 100%)",
                    color: "#F5F0E8",
                    border: "1px solid rgba(192,39,45,0.3)",
                  }}
                >
                  <Search className="w-4 h-4" />
                  Buscar Quartos Disponíveis
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          className="flex items-center gap-8 mt-10"
        >
          {[
            { value: "24", label: "Quartos" },
            { value: "5★", label: "Avaliação" },
            { value: "100%", label: "Premium" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="font-display text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-cream/30 text-xs font-body tracking-widest uppercase">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Borda inferior dourada */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </section>
  );
};

export default HeroSection;
