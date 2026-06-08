import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
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
  QrCode,
  Copy,
  CheckCheck,
  MessageCircle,
  Clock,
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
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guestsCount, setGuestsCount] = useState(1);
  const [guestsInput, setGuestsInput] = useState("1");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [categoryAvail, setCategoryAvail] = useState<{ free: number; total: number; freeRoomId: string | null } | null>(
    null,
  );
  const [checking, setChecking] = useState(false);

  // Flags para o fluxo automático após login (cliente já clicou "Reservar" antes)
  const [pendingAvailCheck, setPendingAvailCheck] = useState(false);
  const [autoReserve, setAutoReserve] = useState(false);

  // PIX
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [pixWhatsapp, setPixWhatsapp] = useState("");
  const [pixCity, setPixCity] = useState("");
  const [pixName, setPixName] = useState("");
  const [pixCopied, setPixCopied] = useState(false);
  const [pixConfirming, setPixConfirming] = useState(false);

  // Preenche datas vindas direto da URL (?checkin=...&checkout=...&guests=...)
  useEffect(() => {
    const ci = searchParams.get("checkin");
    const co = searchParams.get("checkout");
    const g  = searchParams.get("guests");
    if (ci) setCheckIn(new Date(ci + "T12:00:00"));
    if (co) setCheckOut(new Date(co + "T12:00:00"));
    if (g)  { setGuestsCount(Number(g)); setGuestsInput(g); }
  }, []);

  // Preenche datas ao chegar da busca (sem precisar estar logado)
  useEffect(() => {
    if (!user) {
      const raw = localStorage.getItem("reserva_intent");
      if (raw) {
        try {
          const intent = JSON.parse(raw);
          if (intent.checkIn) setCheckIn(new Date(intent.checkIn + "T12:00:00"));
          if (intent.checkOut) setCheckOut(new Date(intent.checkOut + "T12:00:00"));
          if (intent.guestsCount) {
            setGuestsCount(intent.guestsCount);
            setGuestsInput(String(intent.guestsCount));
          }
          // NÃO remove do localStorage aqui — o fluxo de login ainda precisa dele
        } catch {
          /* ignora */
        }
      }
    }
  }, []);

  // Restaura intenção de reserva após login
  useEffect(() => {
    if (user) {
      const raw = localStorage.getItem("reserva_intent");
      if (raw) {
        try {
          const intent = JSON.parse(raw);
          if (intent.checkIn) setCheckIn(new Date(intent.checkIn + "T12:00:00"));
          if (intent.checkOut) setCheckOut(new Date(intent.checkOut + "T12:00:00"));
          if (intent.guestsCount) {
            setGuestsCount(intent.guestsCount);
            setGuestsInput(String(intent.guestsCount));
          }
          localStorage.removeItem("reserva_intent");
          setPendingAvailCheck(true);
          setAutoReserve(true); // Cliente já clicou "Reservar" → criar automaticamente
        } catch {
          localStorage.removeItem("reserva_intent");
        }
      }
    }
  }, [user]);

  // Carregar configurações PIX do hotel
  useEffect(() => {
    const loadPixSettings = async () => {
      const { data } = await supabase
        .from("hotel_settings" as any)
        .select("key, value")
        .in("key", ["pix_key", "whatsapp", "pix_name", "pix_city"]);
      if (data) {
        const pix = data.find((d: any) => d.key === "pix_key");
        const wa  = data.find((d: any) => d.key === "whatsapp");
        const nm  = data.find((d: any) => d.key === "pix_name");
        const ct  = data.find((d: any) => d.key === "pix_city");
        if (pix?.value) setPixKey(pix.value);
        if (wa?.value)  setPixWhatsapp(wa.value);
        if (nm?.value)  setPixName(nm.value);
        if (ct?.value)  setPixCity(ct.value);
      }
    };
    loadPixSettings();
  }, []);

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
        .in("status", ["confirmed", "pending", "pending_payment", "checked_in"])
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
  // Dispara checkAvailability quando room carrega e temos check pendente
  useEffect(() => {
    if (pendingAvailCheck && room && checkIn && checkOut) {
      setPendingAvailCheck(false);
      checkAvailability();
    }
  }, [pendingAvailCheck, room, checkIn, checkOut]);

  // Auto-reservar após login: cliente acabou de criar conta ou fez login
  // Phone já foi validado no Cadastro — abre modal PIX direto
  useEffect(() => {
    if (autoReserve && user && categoryAvail?.freeRoomId && available && !reservationMutation.isPending) {
      setAutoReserve(false);
      setShowPixModal(true);
    }
  }, [autoReserve, user, categoryAvail, available]);

  // Cria reserva usando profile_id (correto)
  const reservationMutation = useMutation({
    mutationFn: async () => {
      if (!user || !room || !checkIn || !checkOut || !categoryAvail?.freeRoomId) throw new Error("Dados incompletos");
      const nights = differenceInDays(checkOut, checkIn);
      const basePrice = Number(room.price);
      const extraPerPerson = room.promotional_price ? Number(room.promotional_price) : 0;
      const price = basePrice + extraPerPerson * Math.max(0, guestsCount - 1);

      const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();

      const { error } = await supabase.from("reservations").insert({
        client_id: user.id,
        profile_id: profile?.id ?? user.id,
        room_id: categoryAvail.freeRoomId, // quarto livre da categoria
        check_in: format(checkIn, "yyyy-MM-dd"),
        check_out: format(checkOut, "yyyy-MM-dd"),
        guests_count: guestsCount,
        total_price: nights * price,
        status: "pending_payment",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva enviada! Aguardando confirmação do pagamento PIX.");
      setShowPixModal(false);
      queryClient.invalidateQueries({ queryKey: ["checkin-confirmed"] });
      queryClient.invalidateQueries({ queryKey: ["reservas-lista"] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["dash-reservations-all"] });
      setCheckIn(undefined);
      setCheckOut(undefined);
      setAvailable(null);
      setCategoryAvail(null);
      setGuestsCount(1);
      setGuestsInput("1");
      setAutoReserve(false);
    },
    onError: (err: any) => {
      setAutoReserve(false);
      toast.error(
        err?.message?.includes("not available")
          ? "Categoria indisponível para as datas selecionadas."
          : err?.message || "Erro ao criar reserva.",
      );
    },
  });

  // ── Gera payload BR Code oficial do PIX (EMV/CPI) ──
  const gerarBRCode = (chave: string, nome: string, cidade: string, valor: number): string => {
    const emv = (id: string, val: string) => {
      const len = val.length.toString().padStart(2, "0");
      return `${id}${len}${val}`;
    };
    const nomeClean   = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 25).toUpperCase();
    const cidadeClean = cidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 15).toUpperCase();

    const payload =
      emv("00", "01") +
      emv("26", emv("00", "BR.GOV.BCB.PIX") + emv("01", chave)) +
      emv("52", "0000") +
      emv("53", "986") +
      (valor > 0 ? emv("54", valor.toFixed(2)) : "") +
      emv("58", "BR") +
      emv("59", nomeClean) +
      emv("60", cidadeClean) +
      emv("62", emv("05", "***"));

    // CRC16-CCITT
    const str = payload + "6304";
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return payload + "6304" + crc.toString(16).toUpperCase().padStart(4, "0");
  };

  const handleReservarClick = async () => {
    if (nights <= 0) {
      toast.error("Check-in e check-out não podem ser no mesmo dia.");
      return;
    }
    if (!user) {
      localStorage.setItem(
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
    // Usuário logado — abre modal PIX direto
    // (telefone já foi validado no momento do cadastro)
    setShowPixModal(true);
  };

  const handlePixConfirm = async () => {
    if (!user || !room || !checkIn || !checkOut || !categoryAvail?.freeRoomId) return;
    if (nights <= 0) {
      toast.error("Datas inválidas. Check-in e check-out não podem ser iguais.");
      setShowPixModal(false);
      return;
    }
    setPixConfirming(true);
    // Abre WhatsApp com mensagem pré-pronta
    const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
    const basePrice = room ? Number(room.price) : 0;
    const extraPerPerson = room?.promotional_price ? Number(room.promotional_price) : 0;
    const effectivePrice = basePrice + extraPerPerson * Math.max(0, guestsCount - 1);
    const totalValue = nights * effectivePrice;
    const waNumber = pixWhatsapp.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá! Acabei de realizar o pagamento via PIX para minha reserva no Hotel SB.

` +
      `📋 *Dados da Reserva:*
` +
      `• Quarto: ${room.name}
` +
      `• Check-in: ${format(checkIn, "dd/MM/yyyy")}
` +
      `• Check-out: ${format(checkOut, "dd/MM/yyyy")}
` +
      `• Hóspedes: ${guestsCount}
` +
      `• Valor: R$ ${totalValue.toFixed(2)}

` +
      `Segue o comprovante do PIX. Aguardo confirmação!`
    );
    // Primeiro cria a reserva; ao confirmar (onSuccess), o WhatsApp é aberto
    reservationMutation.mutate(undefined, {
      onSuccess: () => {
        if (waNumber) {
          window.open(`https://wa.me/55${waNumber}?text=${msg}`, "_blank");
        }
      },
    });
    setPixConfirming(false);
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixKey);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const basePrice = room ? Number(room.price) : 0;
  const extraPerPerson = room?.promotional_price ? Number(room.promotional_price) : 0;
  const effectivePrice = basePrice + extraPerPerson * Math.max(0, guestsCount - 1);
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
    <>
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
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold text-primary">
                      R$ {Number(room.price).toFixed(0)}
                    </span>
                    <span className="text-sm text-cream/50">/noite (1 pessoa)</span>
                  </div>
                  {room.promotional_price && (
                    <div className="text-sm text-primary/70 mt-1">
                      + R$ {Number(room.promotional_price).toFixed(0)} por pessoa adicional
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
                      value={guestsInput}
                      onChange={(e) => {
                        setGuestsInput(e.target.value);
                        const parsed = parseInt(e.target.value);
                        if (!isNaN(parsed)) {
                          setGuestsCount(Math.max(1, Math.min(room.capacity, parsed)));
                        }
                      }}
                      onBlur={() => {
                        const parsed = parseInt(guestsInput);
                        const clamped = isNaN(parsed) ? 1 : Math.max(1, Math.min(room.capacity, parsed));
                        setGuestsCount(clamped);
                        setGuestsInput(String(clamped));
                      }}
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

                    {/* Reservar — exige login, abre modal PIX */}
                    <Button
                      variant="gold"
                      className="flex-1"
                      disabled={
                        !checkIn ||
                        !checkOut ||
                        nights <= 0 ||
                        !available ||
                        !categoryAvail?.freeRoomId ||
                        reservationMutation.isPending
                      }
                      onClick={handleReservarClick}
                    >
                      {reservationMutation.isPending ? "Reservando..." : user ? "Reservar via PIX" : "Reservar (Criar conta)"}
                    </Button>
                  </div>

                  {!user && available && (
                    <p className="text-center text-xs text-cream/30 font-body">
                      Já tem conta?{" "}
                      <button
                        onClick={() => {
                          localStorage.setItem(
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

    {/* ── Modal PIX ── */}
    <AnimatePresence>
      {showPixModal && room && checkIn && checkOut && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4"
          onClick={() => setShowPixModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-md bg-charcoal border border-gold/20 rounded-2xl p-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPixModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-cream">Pagamento via PIX</h2>
                <p className="text-xs text-cream/40 font-body">Finalize sua reserva</p>
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-charcoal-light border border-gold/10 rounded-xl p-3 mb-3 space-y-1.5 text-sm font-body">
              <div className="flex justify-between text-cream/60">
                <span>Quarto</span>
                <span className="text-cream font-semibold">{room.name}</span>
              </div>
              <div className="flex justify-between text-cream/60">
                <span>Check-in</span>
                <span className="text-cream">{format(checkIn, "dd/MM/yyyy")}</span>
              </div>
              <div className="flex justify-between text-cream/60">
                <span>Check-out</span>
                <span className="text-cream">{format(checkOut, "dd/MM/yyyy")}</span>
              </div>
              <div className="flex justify-between text-cream/60">
                <span>Hóspedes</span>
                <span className="text-cream">{guestsCount}</span>
              </div>
              <div className="border-t border-gold/10 pt-2 flex justify-between">
                <span className="text-cream/60">Total</span>
                <span className="text-primary font-bold text-base">R$ {(nights * effectivePrice).toFixed(2)}</span>
              </div>
            </div>

            {/* Chave PIX + QR Code */}
            {pixKey ? (
              <div className="mb-3">
                <p className="text-xs uppercase tracking-widest text-primary/60 mb-2 font-body">Chave PIX</p>
                <div className="flex items-center gap-2 bg-charcoal-light border border-gold/20 rounded-xl px-4 py-3">
                  <span className="flex-1 text-cream font-body text-sm font-semibold tracking-wide">{pixKey}</span>
                  <button
                    onClick={copyPixKey}
                    className="text-primary hover:text-primary/70 transition-colors flex items-center gap-1 text-xs font-body"
                  >
                    {pixCopied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {pixCopied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                {/* QR Code */}
                <div className="flex flex-col items-center mt-3 mb-1">
                  <div className="bg-white p-2 rounded-xl shadow-lg">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(pixName && pixCity ? gerarBRCode(pixKey, pixName, pixCity, nights * effectivePrice) : pixKey)}`}
                      alt="QR Code PIX"
                      width={120}
                      height={120}
                      className="rounded"
                    />
                  </div>
                  <p className="text-xs text-cream/30 font-body mt-2">Escaneie com o app do seu banco</p>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-body">
                ⚠️ Chave PIX não configurada. Contate o hotel.
              </div>
            )}

            {/* Instruções */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 mb-3 space-y-1.5">
              <p className="text-xs font-semibold text-primary/80 font-body uppercase tracking-wider mb-2">Como pagar:</p>
              {[
                "Abra o app do seu banco",
                `Transfira R$ ${(nights * effectivePrice).toFixed(2)} para a chave PIX acima`,
                "Clique no botão abaixo para enviar o comprovante via WhatsApp",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-cream/60 text-xs font-body">{step}</span>
                </div>
              ))}
            </div>

            {/* Aviso */}
            <div className="flex items-center gap-2 text-xs text-cream/30 font-body mb-3">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Sua reserva ficará <strong className="text-cream/50">aguardando pagamento</strong> até a confirmação manual pelo hotel.</span>
            </div>

            {/* Botão principal */}
            <button
              onClick={handlePixConfirm}
              disabled={pixConfirming || reservationMutation.isPending || !pixKey}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-body font-semibold text-sm transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff" }}
            >
              <MessageCircle className="w-4 h-4" />
              {reservationMutation.isPending ? "Enviando reserva..." : "Enviei o PIX — Enviar comprovante via WhatsApp"}
            </button>

            {!pixWhatsapp && (
              <p className="text-center text-xs text-cream/20 font-body mt-2">WhatsApp do hotel não configurado.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default QuartoDetalhe;
