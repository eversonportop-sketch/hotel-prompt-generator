import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  X,
  Search,
  User,
  Plus,
  BedDouble,
  CalendarDays,
  Users,
  CheckCircle2,
  Loader2,
  Star,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Guest {
  id: string;
  full_name: string;
  phone: string | null;
  cpf: string | null;
}
interface Room {
  id: string;
  name: string;
  category: string;
  price: number;
  promotional_price: number | null;
  capacity: number;
  occupied: boolean;
}

const goldBg = { background: "linear-gradient(135deg,#C9A84C,#E5C97A)" };

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

const NewReservationDrawer = ({ open, onClose }: Props) => {
  const qc = useQueryClient();

  // State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [nameInput, setNameInput] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isNewGuest, setIsNewGuest] = useState(false);
  const [newGuestData, setNewGuestData] = useState({ full_name: "", phone: "", cpf: "" });
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guestsCount, setGuestsCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Queries
  const { data: guestsList = [] } = useQuery({
    queryKey: ["guests-search-list"],
    queryFn: async () => {
      const [g, p] = await Promise.all([
        supabase.from("guests").select("id,full_name,phone,cpf").order("full_name"),
        supabase.from("profiles").select("id,full_name,phone,cpf").neq("role", "admin").order("full_name"),
      ]);
      const all = [...(g.data || []), ...(p.data || [])] as Guest[];
      const seen = new Set<string>();
      return all.filter((x) => {
        if (seen.has(x.id)) return false;
        seen.add(x.id);
        return true;
      });
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id,name,category,price,promotional_price,capacity")
        .eq("status", "active")
        .order("display_order");
      if (error) throw error;
      const { data: active } = await supabase.from("reservations").select("room_id").eq("status", "checked_in");
      const occupied = new Set((active || []).map((r: any) => r.room_id));
      return (data as Room[]).map((r) => ({ ...r, occupied: occupied.has(r.id) }));
    },
  });

  // Computed
  const matchedGuests = useMemo(() => {
    if (nameInput.trim().length < 1) return [];
    return guestsList
      .filter(
        (g) =>
          g.full_name?.toLowerCase().includes(nameInput.toLowerCase()) ||
          g.phone?.includes(nameInput) ||
          g.cpf?.includes(nameInput),
      )
      .slice(0, 6);
  }, [nameInput, guestsList]);

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const n =
    checkIn && checkOut
      ? differenceInDays(new Date(format(checkOut, "yyyy-MM-dd") + "T12:00:00"), new Date(format(checkIn, "yyyy-MM-dd") + "T12:00:00"))
      : 0;
  const pricePerNight = selectedRoom ? Number(selectedRoom.promotional_price || selectedRoom.price) : 0;
  const totalPreview = n > 0 ? n * pricePerNight : 0;

  const guestName = isNewGuest ? newGuestData.full_name : selectedGuest?.full_name || "";

  // Reset
  const reset = () => {
    setStep(1);
    setNameInput("");
    setSelectedGuest(null);
    setIsNewGuest(false);
    setNewGuestData({ full_name: "", phone: "", cpf: "" });
    setRoomId("");
    setCheckIn(undefined);
    setCheckOut(undefined);
    setGuestsCount(1);
    setNotes("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Save
  const handleSave = async () => {
    if (!roomId) return toast.error("Selecione um quarto.");
    if (!checkIn || !checkOut || n < 1) return toast.error("Datas inválidas.");
    if (isNewGuest && !newGuestData.full_name.trim()) return toast.error("Informe o nome do hóspede.");
    if (!isNewGuest && !selectedGuest) return toast.error("Selecione um hóspede.");

    setSaving(true);
    try {
      let guestId = selectedGuest?.id ?? null;
      if (isNewGuest) {
        const { data: gd, error: ge } = await supabase
          .from("guests")
          .insert({
            full_name: newGuestData.full_name.trim(),
            phone: newGuestData.phone || null,
            cpf: newGuestData.cpf || null,
          })
          .select("id")
          .single();
        if (ge) throw ge;
        guestId = gd.id;
      }
      const { error } = await supabase.from("reservations").insert({
        guest_id: guestId,
        room_id: roomId,
        check_in: format(checkIn, "yyyy-MM-dd"),
        check_out: format(checkOut, "yyyy-MM-dd"),
        guests_count: guestsCount,
        total_price: totalPreview,
        status: "confirmed",
        notes: notes || null,
      });
      if (error) throw error;
      toast.success("Reserva criada com sucesso!");
      qc.invalidateQueries({ queryKey: ["reservas-lista"] });
      qc.invalidateQueries({ queryKey: ["guests-search-list"] });
      qc.invalidateQueries({ queryKey: ["rooms-active"] });
      handleClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar reserva.");
    } finally {
      setSaving(false);
    }
  };

  const canProceedStep2 = isNewGuest ? newGuestData.full_name.trim().length >= 2 : !!selectedGuest;
  const canProceedStep3 = !!roomId && !!checkIn && !!checkOut && n >= 1;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-[#0e0e12] border-l border-white/8 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <CalendarDays className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-cream">Nova Reserva</h2>
                  <p className="text-white/25 text-xs font-body mt-0.5">
                    {step === 1 ? "Selecione o hóspede" : step === 2 ? "Estadia e quarto" : "Confirmar reserva"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Steps indicator */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        s <= step ? "w-6 bg-primary" : "w-4 bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <button onClick={handleClose} className="text-white/25 hover:text-cream transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* ═══ STEP 1: Hóspede ═══ */}
              {step === 1 && (
                <div className="p-7 space-y-5">
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/35 font-body uppercase tracking-[0.15em] mb-3">
                      <User className="w-3.5 h-3.5" /> Hóspede
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        autoFocus
                        placeholder="Nome, CPF ou telefone..."
                        value={nameInput}
                        onChange={(e) => {
                          setNameInput(e.target.value);
                          setSelectedGuest(null);
                          setIsNewGuest(false);
                        }}
                        className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/8 rounded-xl text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  {/* Selected guest preview */}
                  {selectedGuest && !isNewGuest && (
                    <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3.5">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                        <span className="text-emerald-400 font-bold">{selectedGuest.full_name[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-cream text-sm font-body font-semibold">{selectedGuest.full_name}</p>
                        <p className="text-white/35 text-xs font-body">
                          {selectedGuest.phone || selectedGuest.cpf || "Hóspede cadastrado"}
                        </p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  )}

                  {/* Guest search results */}
                  {!selectedGuest && nameInput.trim().length >= 1 && (
                    <div className="space-y-1.5">
                      {matchedGuests.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => {
                            setSelectedGuest(g);
                            setIsNewGuest(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all text-left group"
                        >
                          <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            <span className="text-white/40 text-sm font-bold group-hover:text-primary/70 transition-colors">
                              {g.full_name[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-cream/90 text-sm font-body font-medium truncate">{g.full_name}</p>
                            <p className="text-white/30 text-xs font-body truncate">{g.phone || g.cpf || "—"}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* New guest option */}
                  {!selectedGuest && nameInput.trim().length >= 2 && (
                    <button
                      onClick={() => {
                        setIsNewGuest(true);
                        setNewGuestData({ full_name: nameInput.trim(), phone: "", cpf: "" });
                        setSelectedGuest(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dashed border-primary/25 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1">
                        <p className="text-primary/70 text-sm font-body font-medium group-hover:text-primary transition-colors">
                          Cadastrar "{nameInput.trim()}"
                        </p>
                        <p className="text-white/25 text-xs font-body">Novo hóspede</p>
                      </div>
                    </button>
                  )}

                  {/* New guest form */}
                  {isNewGuest && (
                    <div className="bg-white/[0.02] border border-white/8 rounded-xl p-5 space-y-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] text-primary/60 font-body uppercase tracking-[0.15em]">
                          Ficha do Hóspede
                        </span>
                      </div>
                      {[
                        ["Nome completo", "full_name", "Nome do hóspede"],
                        ["Telefone", "phone", "(51) 99999-0000"],
                        ["CPF", "cpf", "000.000.000-00"],
                      ].map(([label, key, ph]) => (
                        <div key={key}>
                          <label className="text-[10px] text-white/30 font-body uppercase tracking-widest block mb-1.5">
                            {label}
                          </label>
                          <input
                            placeholder={ph}
                            value={(newGuestData as any)[key]}
                            onChange={(e) => setNewGuestData((d) => ({ ...d, [key]: e.target.value }))}
                            className="w-full bg-white/[0.03] border border-white/8 rounded-lg px-3.5 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/15"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {!selectedGuest && !isNewGuest && nameInput.trim().length < 2 && (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/8 flex items-center justify-center mx-auto mb-3">
                        <User className="w-6 h-6 text-white/15" />
                      </div>
                      <p className="text-white/20 text-xs font-body">
                        Digite o nome para buscar ou cadastrar um hóspede
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ STEP 2: Estadia & Quarto ═══ */}
              {step === 2 && (
                <div className="p-7 space-y-6">
                  {/* Guest summary mini */}
                  <div className="flex items-center gap-3 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-primary text-sm font-bold">{guestName[0]?.toUpperCase() || "?"}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-cream text-sm font-body font-medium">{guestName}</p>
                      <p className="text-white/25 text-xs font-body">{isNewGuest ? "Novo hóspede" : "Cadastrado"}</p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-white/25 hover:text-primary text-xs font-body transition-colors">
                      Alterar
                    </button>
                  </div>

                  {/* Dates */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/35 font-body uppercase tracking-[0.15em] mb-3">
                      <CalendarDays className="w-3.5 h-3.5" /> Período da Estadia
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          ["Check-in", checkIn, setCheckIn, today()],
                          ["Check-out", checkOut, setCheckOut, checkIn ? addDays(checkIn, 1) : addDays(today(), 1)],
                        ] as const
                      ).map(([label, val, setter, minDate]) => (
                        <div key={label as string}>
                          <label className="text-[10px] text-white/25 font-body uppercase tracking-widest block mb-1.5">
                            {label as string}
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  "w-full flex items-center gap-2 px-3.5 py-3 bg-white/[0.03] border border-white/8 rounded-xl text-sm font-body hover:border-white/18 transition",
                                  val ? "text-cream" : "text-white/25",
                                )}
                              >
                                <CalendarDays className="w-3.5 h-3.5 text-white/20" />
                                {val ? format(val as Date, "dd/MM/yyyy") : "Selecionar"}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={val as Date | undefined}
                                initialFocus
                                onSelect={(d) => (setter as any)(d)}
                                disabled={(date) => date < (minDate as Date)}
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      ))}
                    </div>
                    {n > 0 && (
                      <p className="text-white/25 text-xs font-body mt-2">
                        {n} {n === 1 ? "diária" : "diárias"}
                      </p>
                    )}
                  </div>

                  {/* Guests count */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/35 font-body uppercase tracking-[0.15em] mb-2">
                      <Users className="w-3.5 h-3.5" /> Hóspedes
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                        className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-cream hover:bg-white/10 transition flex items-center justify-center font-bold"
                      >
                        −
                      </button>
                      <span className="text-cream font-display text-lg font-bold w-8 text-center">{guestsCount}</span>
                      <button
                        onClick={() => setGuestsCount(guestsCount + 1)}
                        className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-cream hover:bg-white/10 transition flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Room selection */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/35 font-body uppercase tracking-[0.15em] mb-3">
                      <BedDouble className="w-3.5 h-3.5" /> Quarto
                    </label>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {rooms.map((room) => (
                        <button
                          key={room.id}
                          disabled={room.occupied}
                          onClick={() => !room.occupied && setRoomId(room.id)}
                          className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                            room.occupied
                              ? "opacity-40 cursor-not-allowed border-red-500/15 bg-red-500/5"
                              : roomId === room.id
                                ? "border-primary/50 bg-primary/8 shadow-[0_0_20px_rgba(201,168,76,0.08)]"
                                : "border-white/6 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-cream text-sm font-body font-medium">{room.name}</p>
                                {room.occupied && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-body">
                                    Ocupado
                                  </span>
                                )}
                                {roomId === room.id && !room.occupied && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                )}
                              </div>
                              <p className="text-white/25 text-xs font-body mt-0.5">
                                {room.category} · até {room.capacity} hóspedes
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-primary font-semibold text-sm font-display">
                                R$ {Number(room.promotional_price || room.price).toFixed(0)}
                              </p>
                              <p className="text-white/20 text-[10px] font-body">/noite</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[10px] text-white/30 font-body uppercase tracking-widest block mb-1.5">
                      Observações (opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Preferências, alergias, pedidos especiais..."
                      className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-3.5 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition resize-none placeholder:text-white/15"
                    />
                  </div>
                </div>
              )}

              {/* ═══ STEP 3: Resumo ═══ */}
              {step === 3 && (
                <div className="p-7 space-y-5">
                  <div className="text-center py-2">
                    <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-cream">Resumo da Reserva</h3>
                    <p className="text-white/25 text-xs font-body mt-1">Confirme os detalhes antes de finalizar</p>
                  </div>

                  {/* Summary card */}
                  <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden">
                    {/* Guest */}
                    <div className="px-5 py-4 border-b border-white/5">
                      <p className="text-[10px] text-primary/50 font-body uppercase tracking-[0.15em] mb-1.5">Hóspede</p>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center">
                          <span className="text-primary font-bold text-sm">{guestName[0]?.toUpperCase() || "?"}</span>
                        </div>
                        <div>
                          <p className="text-cream text-sm font-body font-semibold">{guestName}</p>
                          <p className="text-white/30 text-xs font-body">
                            {isNewGuest
                              ? `Novo · ${newGuestData.phone || newGuestData.cpf || "Sem contato"}`
                              : selectedGuest?.phone || selectedGuest?.cpf || "Cadastrado"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Room */}
                    <div className="px-5 py-4 border-b border-white/5">
                      <p className="text-[10px] text-primary/50 font-body uppercase tracking-[0.15em] mb-1.5">Quarto</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-cream text-sm font-body font-semibold">{selectedRoom?.name || "—"}</p>
                          <p className="text-white/30 text-xs font-body">{selectedRoom?.category}</p>
                        </div>
                        <p className="text-primary font-display font-semibold text-sm">
                          R$ {pricePerNight.toFixed(0)}/noite
                        </p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="px-5 py-4 border-b border-white/5">
                      <p className="text-[10px] text-primary/50 font-body uppercase tracking-[0.15em] mb-1.5">Estadia</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-cream text-sm font-body">
                          <CalendarDays className="w-3.5 h-3.5 text-white/25" />
                          {checkIn && format(checkIn, "dd/MM/yyyy")} → {checkOut && format(checkOut, "dd/MM/yyyy")}
                        </div>
                        <span className="text-white/40 text-xs font-body">
                          {n} {n === 1 ? "noite" : "noites"} · {guestsCount} hóspede{guestsCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div
                      className="px-5 py-5"
                      style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.06),rgba(201,168,76,0.02))" }}
                    >
                      <div className="flex justify-between text-xs font-body text-white/40 mb-2">
                        <span>
                          {n} {n === 1 ? "diária" : "diárias"} × R$ {pricePerNight.toFixed(0)}
                        </span>
                        <span>R$ {totalPreview.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-primary/15 pt-3">
                        <span className="font-display text-cream font-semibold">Total</span>
                        <span className="font-display text-primary text-2xl font-bold">
                          R$ {totalPreview.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-body">
                      <CheckCircle2 className="w-3 h-3" /> Status: Confirmada
                    </span>
                  </div>

                  {notes && (
                    <div className="bg-white/[0.02] border border-white/6 rounded-lg px-4 py-3">
                      <p className="text-[10px] text-white/25 font-body uppercase tracking-widest mb-1">Observações</p>
                      <p className="text-white/50 text-sm font-body">{notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 py-5 border-t border-white/5 flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                  className="px-4 py-2.5 text-sm text-white/40 hover:text-cream font-body border border-white/10 rounded-xl transition-colors"
                >
                  Voltar
                </button>
              )}
              <div className="flex-1" />
              {step === 1 && (
                <button
                  onClick={() => canProceedStep2 && setStep(2)}
                  disabled={!canProceedStep2}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-black text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={goldBg}
                >
                  Continuar
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={() => canProceedStep3 && setStep(3)}
                  disabled={!canProceedStep3}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-black text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={goldBg}
                >
                  Revisar Reserva
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-black text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                  style={goldBg}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {saving ? "Criando..." : "Confirmar Reserva"}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewReservationDrawer;
