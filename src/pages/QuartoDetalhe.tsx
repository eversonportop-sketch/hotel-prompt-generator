import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Users,
  BedDouble,
  CalendarIcon,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Images,
  ZoomIn,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Lightbox ──────────────────────────────────────────────────────────────── */
const Lightbox = ({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
    onClick={onClose}
  >
    {/* Fechar */}
    <button
      onClick={onClose}
      className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
    >
      <X className="w-5 h-5 text-white" />
    </button>

    {/* Contador */}
    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-body">
      {index + 1} / {images.length}
    </div>

    {/* Prev */}
    {images.length > 1 && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
    )}

    {/* Imagem */}
    <AnimatePresence mode="wait">
      <motion.img
        key={index}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        src={images[index]}
        alt=""
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </AnimatePresence>

    {/* Next */}
    {images.length > 1 && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>
    )}

    {/* Thumbnails */}
    {images.length > 1 && (
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[80vw] pb-1">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className={`shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-all ${
              i === index ? "border-primary scale-110" : "border-white/20 opacity-60 hover:opacity-100"
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    )}
  </motion.div>
);

/* ── Galeria principal ─────────────────────────────────────────────────────── */
const RoomGallery = ({ images, name }: { images: string[]; name: string }) => {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) {
    return (
      <div className="aspect-[4/3] rounded-xl bg-charcoal border border-gold/10 flex items-center justify-center">
        <BedDouble className="w-12 h-12 text-cream/10" />
      </div>
    );
  }

  // Layout igual aos grandes hotéis: foto principal grande + grid de 4 thumbnails
  return (
    <>
      {/* Foto principal */}
      <div
        className="relative rounded-xl overflow-hidden bg-black group cursor-pointer"
        style={{ aspectRatio: images.length > 1 ? "4/3" : "16/9" }}
        onClick={() => setLightbox(true)}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={active}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            src={images[active]}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </AnimatePresence>

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
            <ZoomIn className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Badge número de fotos */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(true);
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 hover:bg-black/90 text-white text-xs font-body px-3 py-1.5 rounded-full transition-colors"
          >
            <Images className="w-3.5 h-3.5" />
            Ver todas as {images.length} fotos
          </button>
        )}

        {/* Setas na foto principal */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActive((i) => (i - 1 + images.length) % images.length);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActive((i) => (i + 1) % images.length);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Grid de thumbnails — máximo 5 visíveis */}
      {images.length > 1 && (
        <div className={`grid gap-2 mt-2 ${images.length >= 4 ? "grid-cols-4" : `grid-cols-${images.length - 1}`}`}>
          {images.slice(1, 5).map((img, i) => {
            const idx = i + 1;
            const isLast = idx === 4 && images.length > 5;
            return (
              <div
                key={i}
                onClick={() => (isLast ? setLightbox(true) : setActive(idx))}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  active === idx ? "border-primary" : "border-transparent hover:border-gold/40"
                }`}
                style={{ aspectRatio: "4/3" }}
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                {isLast && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <span className="text-white font-display text-2xl font-bold">+{images.length - 5}</span>
                    <span className="text-white/70 text-xs font-body">fotos</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dots indicadores */}
      {images.length > 1 && images.length <= 8 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all ${
                i === active ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-cream/20 hover:bg-cream/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox
            images={images}
            index={active}
            onClose={() => setLightbox(false)}
            onPrev={() => setActive((i) => (i - 1 + images.length) % images.length)}
            onNext={() => setActive((i) => (i + 1) % images.length)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

/* ── Página principal ──────────────────────────────────────────────────────── */
const QuartoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guestsCount, setGuestsCount] = useState(1);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const checkAvailability = async () => {
    if (!checkIn || !checkOut || !id) return;
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc("check_room_availability", {
        p_room_id: id,
        p_check_in: format(checkIn, "yyyy-MM-dd"),
        p_check_out: format(checkOut, "yyyy-MM-dd"),
      });
      if (error) throw error;
      setAvailable(data as boolean);
    } catch {
      toast.error("Erro ao verificar disponibilidade");
    } finally {
      setChecking(false);
    }
  };

  const reservationMutation = useMutation({
    mutationFn: async () => {
      if (!user || !room || !checkIn || !checkOut) throw new Error("Dados incompletos");
      const nights = differenceInDays(checkOut, checkIn);
      const price = room.promotional_price || room.price;
      const { error } = await supabase.from("reservations").insert({
        client_id: user.id,
        room_id: room.id,
        check_in: format(checkIn, "yyyy-MM-dd"),
        check_out: format(checkOut, "yyyy-MM-dd"),
        guests_count: guestsCount,
        total_price: nights * Number(price),
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setCheckIn(undefined);
      setCheckOut(undefined);
      setAvailable(null);
      setGuestsCount(1);
    },
    onError: (err: any) => {
      toast.error(
        err?.message?.includes("not available")
          ? "Quarto indisponível para as datas selecionadas."
          : err?.message || "Erro ao criar reserva.",
      );
    },
  });

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const effectivePrice = room ? Number(room.promotional_price || room.price) : 0;
  const today = new Date();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-cream/30 font-body animate-pulse">Carregando...</div>
        </div>
      </Layout>
    );
  }

  if (!room) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-cream/30 font-body">Quarto não encontrado.</p>
        </div>
      </Layout>
    );
  }

  const images: string[] = room.gallery?.length ? room.gallery : room.image_url ? [room.image_url] : [];

  return (
    <Layout>
      <section className="section-padding bg-background">
        <div className="container-hotel">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-8 text-sm font-body">
              <button
                onClick={() => navigate("/quartos")}
                className="text-cream/40 hover:text-primary transition-colors"
              >
                Quartos
              </button>
              <span className="text-cream/20">/</span>
              <span className="text-cream/70">{room.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
              {/* ── Coluna galeria ── */}
              <div>
                <RoomGallery images={images} name={room.name} />
              </div>

              {/* ── Coluna detalhes + reserva ── */}
              <div>
                {/* Categoria + nome */}
                <span className="text-xs text-primary font-body tracking-[0.3em] uppercase">{room.category}</span>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">{room.name}</h1>

                {/* Specs */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" /> {room.capacity} pessoas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-primary" /> {room.beds}
                  </span>
                </div>

                {/* Descrição */}
                {room.description && (
                  <p className="text-muted-foreground font-body mb-6 leading-relaxed">{room.description}</p>
                )}

                {/* Comodidades */}
                {room.amenities && (room.amenities as string[]).length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-display text-sm font-semibold text-foreground mb-3 tracking-wider uppercase text-primary/70">
                      Comodidades
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(room.amenities as string[]).map((a: string) => (
                        <span
                          key={a}
                          className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full font-body"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preço */}
                <div className="mb-6 pb-6 border-b border-border">
                  {room.promotional_price ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-display font-bold text-primary">
                        R$ {Number(room.promotional_price).toFixed(0)}
                      </span>
                      <span className="text-xl text-muted-foreground line-through">
                        R$ {Number(room.price).toFixed(0)}
                      </span>
                      <span className="text-sm text-muted-foreground">/noite</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-display font-bold text-primary">
                        R$ {Number(room.price).toFixed(0)}
                      </span>
                      <span className="text-sm text-muted-foreground"> /noite</span>
                    </div>
                  )}
                </div>

                {/* Formulário de reserva */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="font-display text-lg font-semibold text-foreground">Fazer Reserva</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-body text-sm">Check-in</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !checkIn && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {checkIn ? format(checkIn, "dd/MM/yyyy") : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={checkIn}
                            onSelect={(d) => {
                              setCheckIn(d);
                              setAvailable(null);
                              if (d && checkOut && d >= checkOut) setCheckOut(undefined);
                            }}
                            disabled={(date) => date < today}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-body text-sm">Check-out</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !checkOut && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {checkOut ? format(checkOut, "dd/MM/yyyy") : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={checkOut}
                            onSelect={(d) => {
                              setCheckOut(d);
                              setAvailable(null);
                            }}
                            disabled={(date) => date < (checkIn ? addDays(checkIn, 1) : addDays(today, 1))}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-body text-sm">Hóspedes</Label>
                    <Input
                      type="number"
                      min={1}
                      max={room.capacity}
                      value={guestsCount}
                      onChange={(e) =>
                        setGuestsCount(Math.max(1, Math.min(room.capacity, parseInt(e.target.value) || 1)))
                      }
                    />
                  </div>

                  {nights > 0 && (
                    <div className="bg-secondary/50 rounded-lg p-3 text-sm font-body">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          {nights} diária{nights > 1 ? "s" : ""} × R$ {effectivePrice.toFixed(0)}
                        </span>
                        <span className="font-semibold text-foreground">R$ {(nights * effectivePrice).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {available !== null && (
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm font-body p-3 rounded-lg",
                        available
                          ? "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
                          : "text-destructive bg-destructive/10",
                      )}
                    >
                      {available ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {available ? "Quarto disponível!" : "Quarto indisponível para estas datas."}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="gold-outline"
                      className="flex-1"
                      disabled={!checkIn || !checkOut || checking}
                      onClick={checkAvailability}
                    >
                      {checking ? "Verificando..." : "Ver Disponibilidade"}
                    </Button>
                    <Button
                      variant="gold"
                      className="flex-1"
                      disabled={!checkIn || !checkOut || !available || reservationMutation.isPending}
                      onClick={() => {
                        if (!user) {
                          toast.error("Faça login para reservar.");
                          navigate("/login");
                          return;
                        }
                        reservationMutation.mutate();
                      }}
                    >
                      {reservationMutation.isPending ? "Reservando..." : "Reservar"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default QuartoDetalhe;
