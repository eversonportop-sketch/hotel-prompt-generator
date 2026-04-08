import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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

/* ── Lightbox ── */
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
    <button
      onClick={onClose}
      className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
    >
      <X className="w-5 h-5 text-white" />
    </button>
    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-body">
      {index + 1} / {images.length}
    </div>
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
  </motion.div>
);

/* ── Galeria ── */
const RoomGallery = ({ images, name }: { images: string[]; name: string }) => {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  if (!images.length)
    return (
      <div className="aspect-[4/3] rounded-xl bg-charcoal border border-gold/10 flex items-center justify-center">
        <BedDouble className="w-12 h-12 text-cream/10" />
      </div>
    );
  return (
    <>
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
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
            <ZoomIn className="w-5 h-5 text-white" />
          </div>
        </div>
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(true);
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 hover:bg-black/90 text-white text-xs font-body px-3 py-1.5 rounded-full transition-colors"
          >
            <Images className="w-3.5 h-3.5" /> Ver todas as {images.length} fotos
          </button>
        )}
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
      {images.length > 1 && (
        <div className={`grid gap-2 mt-2 ${images.length >= 4 ? "grid-cols-4" : `grid-cols-${images.length - 1}`}`}>
          {images.slice(1, 5).map((img, i) => {
            const idx = i + 1;
            const isLast = idx === 4 && images.length > 5;
            return (
              <div
                key={i}
                onClick={() => (isLast ? setLightbox(true) : setActive(idx))}
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${active === idx ? "border-primary" : "border-transparent hover:border-gold/40"}`}
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

/* ════════════════════════════════════════════════════════════════════════════ */
const QuartoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guestsCount, setGuestsCount] = useState(1);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [categoryAvail, setCategoryAvail] = useState<{ free: number; total: number; freeRoomId: string | null } | null>(
    null,
  );
  const [checking, setChecking] = useState(false);

  // Flag para saber se restauramos intent e precisamos checar disponibilidade
  const [pendingAvailCheck, setPendingAvailCheck] = useState(false);

  // Restaura intenção de reserva após login
  useEffect(() => {
    if (user) {
      const raw = sessionStorage.getItem("reserva_intent");
      if (raw) {
        try {
          const intent = JSON.parse(raw);
          if (intent.checkIn) setCheckIn(new Date(intent.checkIn + "T12:00:00"));
          if (intent.checkOut) setCheckOut(new Date(intent.checkOut + "T12:00:00"));
          if (intent.guestsCount) setGuestsCount(intent.guestsCount);
          sessionStorage.removeItem("reserva_intent");
          setPendingAvailCheck(true);
        } catch {
          sessionStorage.removeItem("reserva_intent");
        }
      }
    }
  }, [user]);

  // Dispara checkAvailability quando room carrega e temos check pendente
  useEffect(() => {
    if (pendingAvailCheck && room && checkIn && checkOut) {
      setPendingAvailCheck(false);
      checkAvailability();
    }
  }, [pendingAvailCheck, room, checkIn, checkOut]);

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
    if (!checkIn || !checkOut || !room) return;
    setChecking(true);
    try {
      const ci = format(checkIn, "yyyy-MM-dd");
      const co = format(checkOut, "yyyy-MM-dd");

      // Busca todos os quartos ativos da mesma categoria
      const { data: catRooms } = await supabase
        .from("rooms")
        .select("id")
        .eq("category", room.category)
        .eq("status", "active");
      const allIds = (catRooms || []).map((r: any) => r.id);

      // Busca reservas conflitantes
      const { data: conflicts } = await supabase
        .from("reservations")
        .select("room_id")
        .in("room_id", allIds)
        .in("status", ["confirmed", "pending"])
        .lt("check_in", co)
        .gt("check_out", ci);

      const occupiedIds = new Set((conflicts || []).map((c: any) => c.room_id));
      const freeIds = allIds.filter((rid: string) => !occupiedIds.has(rid));

      const free = freeIds.length;
      setCategoryAvail({ free, total: allIds.length, freeRoomId: free > 0 ? freeIds[0] : null });
      setAvailable(free > 0);
    } catch {
      toast.error("Erro ao verificar disponibilidade");
    } finally {
      setChecking(false);
    }
  };

  // Cria reserva usando profile_id (correto)
  const reservationMutation = useMutation({
    mutationFn: async () => {
      if (!user || !room || !checkIn || !checkOut || !categoryAvail?.freeRoomId) throw new Error("Dados incompletos");
      const nights = differenceInDays(checkOut, checkIn);
      const price = Number(room.promotional_price || room.price);

      const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();

      const { error } = await supabase.from("reservations").insert({
        client_id: user.id,
        profile_id: profile?.id ?? user.id,
        room_id: categoryAvail.freeRoomId, // quarto livre da categoria
        check_in: format(checkIn, "yyyy-MM-dd"),
        check_out: format(checkOut, "yyyy-MM-dd"),
        guests_count: guestsCount,
        total_price: nights * price,
        status: "confirmed",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva criada! Aguarde confirmação.");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setCheckIn(undefined);
      setCheckOut(undefined);
      setAvailable(null);
      setCategoryAvail(null);
      setGuestsCount(1);
    },
    onError: (err: any) => {
      toast.error(
        err?.message?.includes("not available")
          ? "Categoria indisponível para as datas selecionadas."
          : err?.message || "Erro ao criar reserva.",
      );
    },
  });

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const effectivePrice = room ? Number(room.promotional_price || room.price) : 0;
  const today = new Date();

  if (isLoading)
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-cream/30 font-body animate-pulse">Carregando...</div>
        </div>
      </Layout>
    );
  if (!room)
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-cream/30 font-body">Quarto não encontrado.</p>
        </div>
      </Layout>
    );

  const images: string[] = room.gallery?.length ? room.gallery : room.image_url ? [room.image_url] : [];

  return (
    <Layout>
      <section className="py-20 bg-charcoal">
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
              {/* Galeria */}
              <div>
                <RoomGallery images={images} name={room.name} />
              </div>

              {/* Detalhes + reserva */}
              <div>
                <span className="text-xs text-primary font-body tracking-[0.3em] uppercase">{room.category}</span>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-cream mt-2 mb-4">{room.name}</h1>

                <div className="flex items-center gap-4 text-sm text-cream/50 mb-6">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" /> {room.capacity} pessoas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-primary" /> {room.beds}
                  </span>
                </div>

                {room.description && <p className="text-cream/50 font-body mb-6 leading-relaxed">{room.description}</p>}

                {room.amenities && (room.amenities as string[]).length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-display text-sm font-semibold text-cream mb-3 tracking-wider uppercase text-primary/70">
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
                <div className="mb-6 pb-6 border-b border-gold/15">
                  {room.promotional_price ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-display font-bold text-primary">
                        R$ {Number(room.promotional_price).toFixed(0)}
                      </span>
                      <span className="text-xl text-cream/50 line-through">R$ {Number(room.price).toFixed(0)}</span>
                      <span className="text-sm text-cream/50">/noite</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-display font-bold text-primary">
                        R$ {Number(room.price).toFixed(0)}
                      </span>
                      <span className="text-sm text-cream/50"> /noite</span>
                    </div>
                  )}
                </div>

                {/* Formulário reserva */}
                <div className="bg-charcoal-light border border-gold/15 rounded-xl p-6 space-y-4">
                  <h3 className="font-display text-lg font-semibold text-cream">Verificar Disponibilidade</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="font-body text-sm text-cream/60">Check-in</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start border-gold/20 bg-charcoal text-cream hover:bg-charcoal-light hover:text-cream",
                              !checkIn && "text-cream/50",
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
                              setCategoryAvail(null);
                              if (d && checkOut && d >= checkOut) setCheckOut(undefined);
                            }}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <label className="font-body text-sm text-cream/60">Check-out</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start border-gold/20 bg-charcoal text-cream hover:bg-charcoal-light hover:text-cream",
                              !checkOut && "text-cream/50",
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
                              setCategoryAvail(null);
                            }}
                            disabled={(date) => date <= (checkIn || new Date())}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-body text-sm text-cream/60">Hóspedes</label>
                    <input
                      type="number"
                      min={1}
                      max={room.capacity}
                      value={guestsCount}
                      onChange={(e) =>
                        setGuestsCount(Math.max(1, Math.min(room.capacity, parseInt(e.target.value) || 1)))
                      }
                      className="w-full bg-charcoal border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm font-body focus:outline-none focus:border-primary/50 transition"
                    />
                  </div>

                  {nights > 0 && (
                    <div className="bg-secondary/50 rounded-lg p-3 text-sm font-body">
                      <div className="flex justify-between">
                        <span className="text-cream/50">
                          {nights} diária{nights > 1 ? "s" : ""} × R$ {effectivePrice.toFixed(0)}
                        </span>
                        <span className="font-semibold text-cream">R$ {(nights * effectivePrice).toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {categoryAvail !== null && (
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm font-body p-3 rounded-lg",
                        categoryAvail.free > 0
                          ? "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
                          : "text-destructive bg-destructive/10",
                      )}
                    >
                      {categoryAvail.free > 0 ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {categoryAvail.free === 0
                        ? "Indisponível nas datas selecionadas"
                        : categoryAvail.free === 1
                          ? "1 quarto disponível nesta categoria"
                          : `${categoryAvail.free} quartos disponíveis nesta categoria`}
                    </div>
                  )}

                  <div className="flex gap-3">
                    {/* Ver disponibilidade — funciona SEM login */}
                    <Button
                      variant="gold-outline"
                      className="flex-1"
                      disabled={!checkIn || !checkOut || checking}
                      onClick={checkAvailability}
                    >
                      {checking ? "Verificando..." : "Ver Disponibilidade"}
                    </Button>

                    {/* Reservar — exige login */}
                    <Button
                      variant="gold"
                      className="flex-1"
                      disabled={
                        !checkIn ||
                        !checkOut ||
                        !available ||
                        !categoryAvail?.freeRoomId ||
                        reservationMutation.isPending
                      }
                      onClick={() => {
                        if (!user) {
                          // Salva intenção e redireciona para cadastro/login
                          sessionStorage.setItem(
                            "reserva_intent",
                            JSON.stringify({
                              checkIn: checkIn ? format(checkIn, "yyyy-MM-dd") : null,
                              checkOut: checkOut ? format(checkOut, "yyyy-MM-dd") : null,
                              guestsCount,
                            }),
                          );
                          navigate(`/cadastro?redirect=/quartos/${id}`);
                          return;
                        }
                        reservationMutation.mutate();
                      }}
                    >
                      {reservationMutation.isPending ? "Reservando..." : user ? "Reservar" : "Reservar (Criar conta)"}
                    </Button>
                  </div>

                  {!user && available && (
                    <p className="text-center text-xs text-cream/30 font-body">
                      Já tem conta?{" "}
                      <button
                        onClick={() => {
                          sessionStorage.setItem(
                            "reserva_intent",
                            JSON.stringify({
                              checkIn: checkIn ? format(checkIn, "yyyy-MM-dd") : null,
                              checkOut: checkOut ? format(checkOut, "yyyy-MM-dd") : null,
                              guestsCount,
                            }),
                          );
                          navigate(`/login?redirect=/quartos/${id}`);
                        }}
                        className="text-primary hover:underline"
                      >
                        Entrar
                      </button>
                    </p>
                  )}
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
