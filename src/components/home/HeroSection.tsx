import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, Search, Star, ChevronLeft, ChevronRight } from "lucide-react";
import hotelLogo from "@/assets/hotel-sb-logo.png";

const HeroSection = () => {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [bannerIdx, setBannerIdx] = useState(0);

  const { data: banners = [] } = useQuery({
    queryKey: ["hero-banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("banners")
        .select("id, image_url, title")
        .eq("active", true)
        .order("display_order");
      return data || [];
    },
  });

  // Busca vídeo do hero no bucket "hero-video" (pega o mais recente)
  const { data: heroVideoUrl } = useQuery({
    queryKey: ["hero-video"],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("hero-video")
        .list("", { limit: 10, sortBy: { column: "created_at", order: "desc" } });
      if (error || !data || data.length === 0) return null;
      const videoFile = data.find((f) => f.name.match(/\.(mp4|webm|mov)$/i));
      if (!videoFile) return null;
      const { data: urlData } = supabase.storage.from("hero-video").getPublicUrl(videoFile.name);
      return urlData.publicUrl;
    },
  });

  const currentBanner = banners[bannerIdx];

  const prevBanner = () => setBannerIdx((i) => (i - 1 + banners.length) % banners.length);
  const nextBanner = () => setBannerIdx((i) => (i + 1) % banners.length);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Fundo: vídeo (prioridade) > banner do admin > gradiente padrão */}
      {heroVideoUrl ? (
        <>
          <video
            key={heroVideoUrl}
            src={heroVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </>
      ) : currentBanner?.image_url ? (
        <>
          {/* Desktop */}
          <motion.div
            key={currentBanner.image_url + "-desktop"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-cover bg-center hidden md:block"
            style={{ backgroundImage: `url(${currentBanner.image_url})` }}
          />
          {/* Mobile/Tablet — usa mobile_image_url se existir, senão cai no desktop */}
          <motion.div
            key={currentBanner.image_url + "-mobile"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-cover bg-top md:hidden"
            style={{ backgroundImage: `url(${(currentBanner as any).mobile_image_url || currentBanner.image_url})` }}
          />
          <div className="absolute inset-0 bg-black/60" />
          {/* Navegação do carrossel */}
          {banners.length > 1 && (
            <>
              <button
                onClick={prevBanner}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextBanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBannerIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === bannerIdx ? "bg-primary scale-125" : "bg-white/40"}`}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {/* Ken Burns via Framer Motion */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              style={{
                position: "absolute",
                inset: "-8%",
                backgroundImage: "url(https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1920&q=85)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              animate={{
                scale: [1, 1.1, 1.06, 1],
                x: [0, -30, 20, 0],
                y: [0, -15, 10, 0],
              }}
              transition={{
                duration: 20,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
          </div>
          {/* Overlay escuro */}
          <div className="absolute inset-0 bg-black/55" />
          {/* Gradiente dourado sutil */}
          <div
            className="absolute inset-0 opacity-25"
            style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.2) 0%, transparent 60%)" }}
          />
        </>
      )}

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
          <span className="text-cream">Hotel</span> <span className="text-gradient-gold">SB</span>
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
          Experiência premium em cada hospedagem, onde cada detalhe nasce para acolher com excelência.
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
                    background: "linear-gradient(135deg, #C9A84C 0%, #A07830 100%)",
                    color: "#0D0D0D",
                    border: "1px solid rgba(201,168,76,0.4)",
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
            { value: "23", label: "Quartos" },
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
