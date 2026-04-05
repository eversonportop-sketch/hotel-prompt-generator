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
  LogIn,
  FileText,
  Phone,
  MapPin,
  CreditCard,
  StickyNote,
  ChevronRight,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
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
  email?: string | null;
  rg?: string | null;
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
const todayDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const TABS = [
  { id: "hospede", label: "Hóspede", icon: User },
  { id: "estadia", label: "Estadia", icon: BedDouble },
  { id: "geral", label: "Info Geral", icon: FileText },
  { id: "confirmar", label: "Confirmar", icon: CheckCircle2 },
] as const;
type TabId = (typeof TABS)[number]["id"];

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Máscaras de formatação ───────────────────────────────────────────────
function maskCPF(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskRG(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 9)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1})$/, "$1-$2");
}
function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.replace(/(\d{1,2})/, "($1");
  if (d.length <= 6) return d.replace(/(\d{2})(\d{1,4})/, "($1) $2");
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}
function maskCEP(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

const Field = ({
  label,
  placeholder,
  value,
  onChange,
  mask,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  mask?: "cpf" | "rg" | "phone" | "cep";
}) => {
  const applyMask = (raw: string) => {
    if (mask === "cpf") return maskCPF(raw);
    if (mask === "rg") return maskRG(raw);
    if (mask === "phone") return maskPhone(raw);
    if (mask === "cep") return maskCEP(raw);
    return raw;
  };
  return (
    <div>
      <label className="text-[10px] text-white/30 font-body uppercase tracking-widest block mb-1.5">{label}</label>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(applyMask(e.target.value))}
        className="w-full bg-white/[0.03] border border-white/8 rounded-lg px-3.5 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/15"
      />
    </div>
  );
};

const SummaryRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="px-5 py-4">
    <p className="text-[10px] text-primary/50 font-body uppercase tracking-[0.15em] mb-1.5">{label}</p>
    {children}
  </div>
);

const NewReservationDrawer = ({ open, onClose }: Props) => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("hospede");
  const [saving, setSaving] = useState(false);
  // Hospede
  const [nameInput, setNameInput] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isNewGuest, setIsNewGuest] = useState(false);
  const [guestData, setGuestData] = useState({
    full_name: "",
    cpf: "",
    rg: "",
    phone: "",
    email: "",
    nationality: "Brasileira",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });
  // Estadia
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>(new Date());
  const [checkOut, setCheckOut] = useState<Date | undefined>(addDays(new Date(), 1));
  const [guestsCount, setGuestsCount] = useState(1);
  // Geral
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("dinheiro");
  // Confirmar
  const [doCheckin, setDoCheckin] = useState(false);

  const { data: guestsList = [] } = useQuery({
    queryKey: ["guests-search-list"],
    queryFn: async () => {
      const [g, p] = await Promise.all([
        supabase.from("guests").select("id,full_name,phone,cpf,email,rg").order("full_name"),
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
  const nights =
    checkIn && checkOut
      ? differenceInDays(
          new Date(format(checkOut, "yyyy-MM-dd") + "T12:00:00"),
          new Date(format(checkIn, "yyyy-MM-dd") + "T12:00:00"),
        )
      : 0;
  const pricePerNight = selectedRoom ? Number(selectedRoom.promotional_price || selectedRoom.price) : 0;
  const totalPrice = nights > 0 ? nights * pricePerNight : 0;
  const guestDisplayName = isNewGuest ? guestData.full_name : selectedGuest?.full_name || "";
  const hospedeOk = isNewGuest ? guestData.full_name.trim().length >= 2 : !!selectedGuest;
  const estadiaOk = !!roomId && !!checkIn && !!checkOut && nights >= 1;

  const reset = () => {
    setActiveTab("hospede");
    setNameInput("");
    setSelectedGuest(null);
    setIsNewGuest(false);
    setGuestData({
      full_name: "",
      cpf: "",
      rg: "",
      phone: "",
      email: "",
      nationality: "Brasileira",
      address: "",
      city: "",
      state: "",
      zip_code: "",
    });
    setRoomId("");
    setCheckIn(new Date());
    setCheckOut(addDays(new Date(), 1));
    setGuestsCount(1);
    setNotes("");
    setPaymentMethod("dinheiro");
    setDoCheckin(false);
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!hospedeOk) return toast.error("Selecione ou cadastre um hóspede.");
    if (!estadiaOk) return toast.error("Selecione quarto e datas válidas.");
    setSaving(true);
    try {
      let guestId = selectedGuest?.id ?? null;
      if (isNewGuest) {
        const { data: gd, error: ge } = await supabase
          .from("guests")
          .insert({
            full_name: guestData.full_name.trim(),
            cpf: guestData.cpf || null,
            rg: guestData.rg || null,
            phone: guestData.phone || null,
            email: guestData.email || null,
            nationality: guestData.nationality || "Brasileira",
            address: guestData.address || null,
            city: guestData.city || null,
            state: guestData.state || null,
            zip_code: guestData.zip_code || null,
          })
          .select("id")
          .single();
        if (ge) throw ge;
        guestId = gd.id;
      }
      const status = doCheckin ? "checked_in" : "confirmed";
      const notesText = [notes, paymentMethod ? `Pagamento: ${paymentMethod}` : ""].filter(Boolean).join(" | ") || null;
      const { error } = await supabase.from("reservations").insert({
        guest_id: guestId,
        room_id: roomId,
        check_in: format(checkIn!, "yyyy-MM-dd"),
        check_out: format(checkOut!, "yyyy-MM-dd"),
        guests_count: guestsCount,
        total_price: totalPrice,
        status,
        notes: notesText,
        ...(doCheckin ? { checked_in_at: new Date().toISOString() } : {}),
      });
      if (error) throw error;
      toast.success(doCheckin ? "Reserva criada e check-in realizado!" : "Reserva criada com sucesso!");
      [
        "reservas-lista",
        "guests-search-list",
        "rooms-active",
        "checkin-confirmed",
        "checkout-open",
        "clientes-lista",
        "admin-dashboard",
      ].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      handleClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const goToTab = (dir: 1 | -1) => {
    if (dir === 1 && activeTab === "hospede" && !hospedeOk) return toast.error("Selecione ou cadastre um hóspede.");
    if (dir === 1 && activeTab === "estadia" && !estadiaOk) return toast.error("Preencha quarto e datas.");
    const idx = TABS.findIndex((t) => t.id === activeTab);
    const next = TABS[idx + dir];
    if (next) setActiveTab(next.id);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-[#0e0e12] border-l border-white/8 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <CalendarDays className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-cream">Nova Reserva</h2>
                  <p className="text-white/25 text-xs font-body mt-0.5">Reserva presencial · recepção</p>
                </div>
              </div>
              <button onClick={handleClose} className="text-white/25 hover:text-cream transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs nav */}
            <div className="flex border-b border-white/5 shrink-0 bg-[#0e0e12]">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isDone = (tab.id === "hospede" && hospedeOk) || (tab.id === "estadia" && estadiaOk);
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-3.5 text-xs font-body transition-all border-b-2 -mb-px flex-1 justify-center ${isActive ? "border-primary text-primary" : "border-transparent text-white/30 hover:text-white/60"}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isDone && !isActive ? "text-emerald-400" : ""}`} />
                    <span className={`hidden sm:inline ${isDone && !isActive ? "text-emerald-400" : ""}`}>
                      {tab.label}
                    </span>
                    {isDone && !isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* ── HÓSPEDE ── */}
              {activeTab === "hospede" && (
                <div className="p-6 space-y-4">
                  {!isNewGuest && !selectedGuest && (
                    <>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input
                          autoFocus
                          placeholder="Nome, CPF ou telefone..."
                          value={nameInput}
                          onChange={(e) => {
                            setNameInput(e.target.value);
                            setSelectedGuest(null);
                          }}
                          className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/8 rounded-xl text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/20"
                        />
                      </div>
                      {nameInput.trim().length >= 1 && (
                        <div className="space-y-1.5">
                          {matchedGuests.map((g) => (
                            <button
                              key={g.id}
                              onClick={() => {
                                setSelectedGuest(g);
                                setNameInput("");
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/15 transition-all text-left group"
                            >
                              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <span className="text-white/40 text-sm font-bold group-hover:text-primary/70 transition-colors">
                                  {g.full_name[0]?.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-cream/90 text-sm font-body font-medium truncate">{g.full_name}</p>
                                <p className="text-white/30 text-xs font-body truncate">{g.phone || g.cpf || "—"}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary/50 transition-colors" />
                            </button>
                          ))}
                          {nameInput.trim().length >= 1 && (
                            <button
                              onClick={() => {
                                setIsNewGuest(true);
                                setGuestData((d) => ({ ...d, full_name: nameInput.trim() }));
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-primary/25 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                            >
                              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                <Plus className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
                              </div>
                              <div>
                                <p className="text-primary/70 text-sm font-body font-medium group-hover:text-primary transition-colors">
                                  Cadastrar "{nameInput.trim()}"
                                </p>
                                <p className="text-white/25 text-xs font-body">Novo hóspede</p>
                              </div>
                            </button>
                          )}
                        </div>
                      )}
                      {nameInput.trim().length < 1 && (
                        <div className="text-center py-8">
                          <div className="w-14 h-14 rounded-full bg-white/[0.03] border border-white/8 flex items-center justify-center mx-auto mb-3">
                            <User className="w-6 h-6 text-white/15" />
                          </div>
                          <p className="text-white/20 text-xs font-body mb-5">
                            Digite para buscar ou cadastrar novo hóspede
                          </p>
                          <button
                            onClick={() => {
                              setIsNewGuest(true);
                              setGuestData((d) => ({ ...d, full_name: "" }));
                            }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all text-primary/60 hover:text-primary text-sm font-body"
                          >
                            <Plus className="w-4 h-4" /> Novo cliente
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {selectedGuest && !isNewGuest && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3.5">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                          <span className="text-emerald-400 font-bold text-sm">
                            {selectedGuest.full_name[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-cream text-sm font-body font-semibold">{selectedGuest.full_name}</p>
                          <p className="text-white/35 text-xs font-body">
                            {selectedGuest.phone || selectedGuest.cpf || "Hóspede cadastrado"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <button
                            onClick={() => {
                              setSelectedGuest(null);
                              setNameInput("");
                            }}
                            className="text-white/25 hover:text-cream transition-colors p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-white/30 text-xs font-body text-center">
                        Hóspede já cadastrado. Avance para a próxima aba.
                      </p>
                    </div>
                  )}

                  {isNewGuest && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Plus className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[10px] text-primary/60 font-body uppercase tracking-[0.15em]">
                            Ficha do Novo Hóspede
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setIsNewGuest(false);
                            setNameInput("");
                          }}
                          className="text-white/25 hover:text-cream text-xs font-body transition-colors flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Cancelar
                        </button>
                      </div>
                      {/* Dados pessoais */}
                      <div className="bg-white/[0.02] border border-white/8 rounded-xl p-4 space-y-3">
                        <p className="text-[10px] text-white/30 font-body uppercase tracking-widest flex items-center gap-1.5">
                          <User className="w-3 h-3" /> Dados Pessoais
                        </p>
                        <Field
                          label="Nome completo *"
                          placeholder="Nome do hóspede"
                          value={guestData.full_name}
                          onChange={(v) => setGuestData((d) => ({ ...d, full_name: v }))}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Field
                            label="CPF"
                            placeholder="000.000.000-00"
                            value={guestData.cpf}
                            onChange={(v) => setGuestData((d) => ({ ...d, cpf: v }))}
                            mask="cpf"
                          />
                          <Field
                            label="RG"
                            placeholder="00.000.000-0"
                            value={guestData.rg}
                            onChange={(v) => setGuestData((d) => ({ ...d, rg: v }))}
                            mask="rg"
                          />
                        </div>
                        <Field
                          label="Nacionalidade"
                          placeholder="Brasileira"
                          value={guestData.nationality}
                          onChange={(v) => setGuestData((d) => ({ ...d, nationality: v }))}
                        />
                      </div>
                      {/* Contato */}
                      <div className="bg-white/[0.02] border border-white/8 rounded-xl p-4 space-y-3">
                        <p className="text-[10px] text-white/30 font-body uppercase tracking-widest flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> Contato
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <Field
                            label="Telefone"
                            placeholder="(51) 99999-0000"
                            value={guestData.phone}
                            onChange={(v) => setGuestData((d) => ({ ...d, phone: v }))}
                            mask="phone"
                          />
                          <Field
                            label="E-mail"
                            placeholder="email@exemplo.com"
                            value={guestData.email}
                            onChange={(v) => setGuestData((d) => ({ ...d, email: v }))}
                          />
                        </div>
                      </div>
                      {/* Endereço */}
                      <div className="bg-white/[0.02] border border-white/8 rounded-xl p-4 space-y-3">
                        <p className="text-[10px] text-white/30 font-body uppercase tracking-widest flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" /> Endereço
                        </p>
                        <Field
                          label="Endereço"
                          placeholder="Rua, número"
                          value={guestData.address}
                          onChange={(v) => setGuestData((d) => ({ ...d, address: v }))}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Field
                            label="Cidade"
                            placeholder="Cidade"
                            value={guestData.city}
                            onChange={(v) => setGuestData((d) => ({ ...d, city: v }))}
                          />
                          <Field
                            label="Estado"
                            placeholder="RS"
                            value={guestData.state}
                            onChange={(v) => setGuestData((d) => ({ ...d, state: v }))}
                          />
                        </div>
                        <Field
                          label="CEP"
                          placeholder="00000-000"
                          value={guestData.zip_code}
                          onChange={(v) => setGuestData((d) => ({ ...d, zip_code: v }))}
                          mask="cep"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ESTADIA ── */}
              {activeTab === "estadia" && (
                <div className="p-6 space-y-6">
                  {/* Datas */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/35 font-body uppercase tracking-[0.15em] mb-3">
                      <CalendarDays className="w-3.5 h-3.5" /> Período da Estadia
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          ["Check-in", checkIn, setCheckIn, todayDate()],
                          ["Check-out", checkOut, setCheckOut, checkIn ? addDays(checkIn, 1) : addDays(todayDate(), 1)],
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
                    {nights > 0 && (
                      <p className="text-primary/60 text-xs font-body mt-2">
                        {nights} {nights === 1 ? "diária" : "diárias"} · R$ {totalPrice.toFixed(2).replace(".", ",")}
                      </p>
                    )}
                  </div>
                  {/* Hóspedes */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/35 font-body uppercase tracking-[0.15em] mb-3">
                      <Users className="w-3.5 h-3.5" /> Número de Hóspedes
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                        className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-cream hover:bg-white/10 transition flex items-center justify-center font-bold text-lg"
                      >
                        −
                      </button>
                      <span className="text-cream font-display text-2xl font-bold w-10 text-center">{guestsCount}</span>
                      <button
                        onClick={() => setGuestsCount(guestsCount + 1)}
                        className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-cream hover:bg-white/10 transition flex items-center justify-center font-bold text-lg"
                      >
                        +
                      </button>
                      {selectedRoom && (
                        <span className="text-white/25 text-xs font-body">Máx. {selectedRoom.capacity}</span>
                      )}
                    </div>
                  </div>
                  {/* Quarto */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/35 font-body uppercase tracking-[0.15em] mb-3">
                      <BedDouble className="w-3.5 h-3.5" /> Quarto
                    </label>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {rooms.map((room) => (
                        <button
                          key={room.id}
                          disabled={room.occupied}
                          onClick={() => !room.occupied && setRoomId(room.id)}
                          className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${room.occupied ? "opacity-40 cursor-not-allowed border-red-500/15 bg-red-500/5" : roomId === room.id ? "border-primary/50 bg-primary/8" : "border-white/6 bg-white/[0.02] hover:border-white/15"}`}
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
                </div>
              )}

              {/* ── INFO GERAL ── */}
              {activeTab === "geral" && (
                <div className="p-6 space-y-5">
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/35 font-body uppercase tracking-[0.15em] mb-3">
                      <CreditCard className="w-3.5 h-3.5" /> Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "dinheiro", label: "Dinheiro" },
                        { id: "cartao_credito", label: "Crédito" },
                        { id: "cartao_debito", label: "Débito" },
                        { id: "pix", label: "PIX" },
                        { id: "transferencia", label: "Transferência" },
                        { id: "faturado", label: "Faturado" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPaymentMethod(p.id)}
                          className={`py-2.5 px-3 rounded-xl border text-sm font-body transition-all ${paymentMethod === p.id ? "border-primary/50 bg-primary/8 text-primary" : "border-white/6 bg-white/[0.02] text-white/50 hover:text-cream hover:border-white/15"}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/35 font-body uppercase tracking-[0.15em] mb-3">
                      <StickyNote className="w-3.5 h-3.5" /> Observações
                    </label>
                    <textarea
                      rows={5}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Preferências, alergias, pedidos especiais, veículos..."
                      className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-3.5 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition resize-none placeholder:text-white/15"
                    />
                  </div>
                </div>
              )}

              {/* ── CONFIRMAR ── */}
              {activeTab === "confirmar" && (
                <div className="p-6 space-y-5">
                  <div className="text-center py-2">
                    <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-cream">Resumo da Reserva</h3>
                    <p className="text-white/25 text-xs font-body mt-1">Confirme os detalhes antes de finalizar</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/8 rounded-xl overflow-hidden divide-y divide-white/5">
                    <SummaryRow label="Hóspede">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center">
                          <span className="text-primary text-xs font-bold">
                            {guestDisplayName[0]?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="text-cream text-sm font-body font-semibold">{guestDisplayName || "—"}</p>
                          {isNewGuest && (
                            <p className="text-white/30 text-[10px] font-body">
                              Novo · {guestData.phone || guestData.cpf || "Sem contato"}
                            </p>
                          )}
                        </div>
                      </div>
                    </SummaryRow>
                    <SummaryRow label="Quarto">
                      <p className="text-cream text-sm font-body font-semibold">{selectedRoom?.name || "—"}</p>
                      <p className="text-white/30 text-xs font-body">
                        {selectedRoom?.category} · {guestsCount} hóspede{guestsCount > 1 ? "s" : ""}
                      </p>
                    </SummaryRow>
                    <SummaryRow label="Período">
                      <div className="flex items-center gap-2 text-cream text-sm font-body">
                        <CalendarDays className="w-3.5 h-3.5 text-white/25" />
                        {checkIn && format(checkIn, "dd/MM/yyyy")} → {checkOut && format(checkOut, "dd/MM/yyyy")}
                      </div>
                      <p className="text-white/30 text-xs font-body mt-0.5">
                        {nights} {nights === 1 ? "noite" : "noites"}
                      </p>
                    </SummaryRow>
                    <SummaryRow label="Pagamento">
                      <p className="text-cream text-sm font-body capitalize">{paymentMethod.replace(/_/g, " ")}</p>
                    </SummaryRow>
                    <div
                      className="px-5 py-4"
                      style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.06),rgba(201,168,76,0.02))" }}
                    >
                      <div className="flex justify-between text-xs text-white/40 font-body mb-2">
                        <span>
                          {nights}n × R$ {pricePerNight.toFixed(0)}
                        </span>
                        <span>R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-primary/15 pt-3">
                        <span className="font-display text-cream font-semibold">Total</span>
                        <span className="font-display text-primary text-2xl font-bold">
                          R$ {totalPrice.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Check-in imediato */}
                  <button
                    onClick={() => setDoCheckin(!doCheckin)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all ${doCheckin ? "border-amber-500/40 bg-amber-500/8" : "border-white/8 bg-white/[0.02] hover:border-white/15"}`}
                  >
                    <div
                      className={`w-12 h-6 rounded-full border transition-all relative shrink-0 ${doCheckin ? "bg-amber-500 border-amber-400" : "bg-white/10 border-white/15"}`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${doCheckin ? "left-[26px]" : "left-0.5"}`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <LogIn className={`w-4 h-4 ${doCheckin ? "text-amber-400" : "text-white/30"}`} />
                        <p
                          className={`text-sm font-body font-medium ${doCheckin ? "text-amber-300" : "text-white/50"}`}
                        >
                          Fazer check-in agora
                        </p>
                      </div>
                      <p className="text-white/25 text-xs font-body mt-0.5">
                        {doCheckin
                          ? "Hóspede marcado como hospedado imediatamente"
                          : "Reserva ficará confirmada aguardando check-in"}
                      </p>
                    </div>
                  </button>
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
            <div className="px-6 py-4 border-t border-white/5 flex items-center gap-3 shrink-0">
              {activeTab !== "hospede" && (
                <button
                  onClick={() => goToTab(-1)}
                  className="px-4 py-2.5 text-sm text-white/40 hover:text-cream font-body border border-white/10 rounded-xl transition-colors"
                >
                  Voltar
                </button>
              )}
              <div className="flex-1" />
              {activeTab !== "confirmar" ? (
                <button
                  onClick={() => goToTab(1)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-black text-sm font-semibold hover:brightness-110 transition-all"
                  style={goldBg}
                >
                  Próximo <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving || !hospedeOk || !estadiaOk}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-black text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                  style={goldBg}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : doCheckin ? (
                    <LogIn className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {saving ? "Salvando..." : doCheckin ? "Reservar e Fazer Check-in" : "Confirmar Reserva"}
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
