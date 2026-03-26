import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users, Minus, Plus } from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const HeroSection = () => {
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const navigate = useNavigate();
  const today = startOfDay(new Date());

  const handleSearch = () => {
    if (!checkIn || !checkOut) return;
    navigate(
      `/quartos?checkin=${format(checkIn, "yyyy-MM-dd")}&checkout=${format(checkOut, "yyyy-MM-dd")}&guests=${guests}`,
    );
  };

  const adjustGuests = (delta: number) => {
    setGuests((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  return (
    <section
      className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden"
      style={{ border: "1px solid rgba(201, 168, 76, 0.15)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, #0A0A0A 0%, #1a1500 100%)",
        }}
      />

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
              {/* Check-in */}
              <div className="text-left">
                <label className="text-xs uppercase tracking-widest text-primary/70 mb-2 block">Check-in</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center gap-2 bg-black/70 border border-primary/20 rounded-lg px-4 py-3 text-left transition hover:border-primary/50 focus:outline-none focus:border-primary",
                        checkIn ? "text-cream" : "text-cream/40",
                      )}
                    >
                      <CalendarIcon className="w-4 h-4 text-primary/60 shrink-0" />
                      <span className="font-body text-sm">
                        {checkIn ? format(checkIn, "dd MMM yyyy", { locale: ptBR }) : "Selecionar data"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={(d) => {
                        setCheckIn(d);
                        // Limpa checkout se a nova data de entrada for igual ou posterior
                        if (d && checkOut && !isBefore(d, checkOut)) {
                          setCheckOut(undefined);
                        }
                      }}
                      disabled={(date) => isBefore(date, today)}
                      initialFocus
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Check-out */}
              <div className="text-left">
                <label className="text-xs uppercase tracking-widest text-primary/70 mb-2 block">Check-out</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center gap-2 bg-black/70 border border-primary/20 rounded-lg px-4 py-3 text-left transition hover:border-primary/50 focus:outline-none focus:border-primary",
                        checkOut ? "text-cream" : "text-cream/40",
                      )}
                    >
                      <CalendarIcon className="w-4 h-4 text-primary/60 shrink-0" />
                      <span className="font-body text-sm">
                        {checkOut ? format(checkOut, "dd MMM yyyy", { locale: ptBR }) : "Selecionar data"}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={(d) => setCheckOut(d)}
                      disabled={(date) => isBefore(date, checkIn ? addDays(checkIn, 1) : addDays(today, 1))}
                      initialFocus
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Hóspedes — contador +/- premium */}
              <div className="text-left">
                <label className="text-xs uppercase tracking-widest text-primary/70 mb-2 block">Hóspedes</label>
                <div className="flex items-center bg-black/70 border border-primary/20 rounded-lg overflow-hidden">
                  <button
                    onClick={() => adjustGuests(-1)}
                    disabled={guests <= 1}
                    className="px-3 py-3 text-primary/70 hover:text-primary hover:bg-primary/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Diminuir hóspedes"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 flex items-center justify-center gap-2 text-cream font-body text-sm py-3">
                    <Users className="w-4 h-4 text-primary/60" />
                    <span>
                      {guests} {guests === 1 ? "hóspede" : "hóspedes"}
                    </span>
                  </div>
                  <button
                    onClick={() => adjustGuests(1)}
                    disabled={guests >= 10}
                    className="px-3 py-3 text-primary/70 hover:text-primary hover:bg-primary/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Aumentar hóspedes"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Botão buscar */}
              <button
                onClick={handleSearch}
                disabled={!checkIn || !checkOut}
                className="h-[52px] rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold tracking-wide hover:scale-[1.02] transition-all duration-200 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
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
