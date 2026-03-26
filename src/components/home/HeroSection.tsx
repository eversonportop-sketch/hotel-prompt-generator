import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const HeroSection = () => {
  const [heroImage, setHeroImage] = useState<string | null>(null);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const navigate = useNavigate();

  const handleSearch = () => {
    navigate(`/quartos?checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`);
  };

  return (
    <section
      className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden"
      style={{
        border: "1px solid rgba(201, 168, 76, 0.15)",
      }}
    >
      {heroImage ? (
        <>
          <img src={heroImage} alt="SB Hotel" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/70 to-[#0A0A0A]/40" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, #0A0A0A 0%, #1a1500 100%)",
          }}
        />
      )}

      <div className="relative z-10 text-center container-hotel">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-4">Bem-vindo ao</p>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-cream mb-6">
            SB <span className="text-gradient-gold">Hotel</span>
          </h1>

          <p className="text-cream/70 font-body text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Experiência premium em hospedagem. Conforto, elegância e sofisticação em cada detalhe.
          </p>

          {/* FORM RESERVA PREMIUM */}
          <div className="bg-gradient-to-br from-[#0A0A0A]/90 to-[#1a1500]/80 backdrop-blur-xl border border-primary/20 rounded-2xl p-6 md:p-8 mb-10 max-w-5xl mx-auto shadow-[0_0_40px_rgba(201,168,76,0.08)]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="text-left">
                <label className="text-xs uppercase tracking-widest text-primary/70 mb-2 block">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-black/70 border border-primary/20 rounded-lg px-4 py-3 text-cream focus:border-primary focus:outline-none transition"
                />
              </div>

              <div className="text-left">
                <label className="text-xs uppercase tracking-widest text-primary/70 mb-2 block">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-black/70 border border-primary/20 rounded-lg px-4 py-3 text-cream focus:border-primary focus:outline-none transition"
                />
              </div>

              <div className="text-left">
                <label className="text-xs uppercase tracking-widest text-primary/70 mb-2 block">Hóspedes</label>
                <input
                  type="number"
                  min={1}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full bg-black/70 border border-primary/20 rounded-lg px-4 py-3 text-cream focus:border-primary focus:outline-none transition"
                />
              </div>

              <button
                onClick={handleSearch}
                className="h-[52px] rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold tracking-wide hover:scale-[1.02] transition-all duration-200 shadow-lg"
              >
                Buscar
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/quartos">
              <Button variant="hero" size="lg" className="px-10 py-6 text-base">
                Ver Quartos
              </Button>
            </Link>

            <Link to="/contato">
              <Button variant="gold-outline" size="lg" className="px-10 py-6 text-base">
                Fale Conosco
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
