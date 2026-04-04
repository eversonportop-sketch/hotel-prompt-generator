import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarDays,
  Search,
  Plus,
  X,
  Loader2,
  BedDouble,
  User,
  Pencil,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Clock,
  Ban,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface Room {
  id: string;
  name: string;
  category: string;
  price: number;
  promotional_price: number | null;
  capacity: number;
}
interface Guest {
  id: string;
  full_name: string;
  phone: string | null;
  cpf: string | null;
}
interface Reservation {
  id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  notes: string | null;
  guest_id: string | null;
  profile_id: string | null;
  room_id: string;
  guests_count: number;
  rooms: { id: string; name: string; category: string } | null;
  guestName: string;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  confirmed: {
    label: "Confirmada",
    color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  checked_in: {
    label: "Hospedado",
    color: "bg-blue-500/15 text-blue-300 border-blue-500/25",
    icon: <Clock className="w-3 h-3" />,
  },
  checked_out: {
    label: "Finalizada",
    color: "bg-white/10 text-white/40 border-white/10",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  canceled: {
    label: "Cancelada",
    color: "bg-red-500/15 text-red-300 border-red-500/25",
    icon: <Ban className="w-3 h-3" />,
  },
};

const goldBg = { background: "linear-gradient(135deg,#C9A84C,#E5C97A)" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d: string) => format(new Date(d + "T12:00:00"), "dd MMM", { locale: ptBR });
const fmtFull = (d: string) => format(new Date(d + "T12:00:00"), "dd/MM/yyyy");
const nights = (ci: string, co: string) => differenceInDays(new Date(co + "T12:00:00"), new Date(ci + "T12:00:00"));
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ═════════════════════════════════════════════════════════════════════════════
const AdminReservas = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modal Nova Reserva
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [nameInput, setNameInput] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [isNewGuest, setIsNewGuest] = useState(false);
  const [newGuestData, setNewGuestData] = useState({ full_name: "", phone: "", cpf: "", email: "" });
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);

  // Modal Editar
  const [editRes, setEditRes] = useState<Reservation | null>(null);
  const [editRoomId, setEditRoomId] = useState("");
  const [editCheckIn, setEditCheckIn] = useState<Date | undefined>();
  const [editCheckOut, setEditCheckOut] = useState<Date | undefined>();
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["reservas-lista"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id, check_in, check_out, total_price, status, notes, guest_id, profile_id, room_id, guests_count, rooms(id,name,category)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data || []) as any[];
      // Buscar nomes de guests presenciais
      const gids = [...new Set(rows.filter((r) => r.guest_id).map((r) => r.guest_id as string))];
      const pids = [...new Set(rows.filter((r) => r.profile_id).map((r) => r.profile_id as string))];
      const gMap: Record<string, string> = {};

      if (gids.length) {
        const { data: gd } = await supabase.from("guests").select("id,full_name").in("id", gids);
        (gd || []).forEach((g: any) => {
          gMap[g.id] = g.full_name;
        });
      }
      if (pids.length) {
        const { data: pd } = await supabase.from("profiles").select("id,full_name").in("id", pids);
        (pd || []).forEach((p: any) => {
          gMap[p.id] = p.full_name;
        });
      }

      return rows.map((r) => ({
        ...r,
        guestName: (r.guest_id && gMap[r.guest_id]) || (r.profile_id && gMap[r.profile_id]) || "—",
      })) as Reservation[];
    },
  });

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
      // Marcar quartos com check-in ativo
      const { data: active } = await supabase.from("reservations").select("room_id").eq("status", "checked_in");
      const occupied = new Set((active || []).map((r: any) => r.room_id));
      return (data as Room[]).map((r) => ({ ...r, occupied: occupied.has(r.id) }));
    },
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const cancelReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").update({ status: "canceled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservas-lista"] });
      toast.success("Reserva cancelada.");
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao cancelar."),
  });

  const deleteReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservas-lista"] });
      toast.success("Reserva excluída.");
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  // ─── Filtros ───────────────────────────────────────────────────────────────
  const filtered = reservations.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.guestName.toLowerCase().includes(q) || (r.rooms as any)?.name?.toLowerCase().includes(q);
  });

  const kpis = [
    {
      label: "Total",
      value: reservations.length,
      color: "text-cream",
      bg: "bg-white/5 border-white/10",
      filter: "all",
    },
    {
      label: "Confirmadas",
      value: reservations.filter((r) => r.status === "confirmed").length,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      filter: "confirmed",
    },
    {
      label: "Hospedados",
      value: reservations.filter((r) => r.status === "checked_in").length,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      filter: "checked_in",
    },
    {
      label: "Finalizadas",
      value: reservations.filter((r) => r.status === "checked_out").length,
      color: "text-white/40",
      bg: "bg-white/5 border-white/10",
      filter: "checked_out",
    },
  ];

  // ─── Nova Reserva: busca de hóspedes ───────────────────────────────────────
  const matchedGuests =
    nameInput.trim().length >= 1
      ? guestsList
          .filter(
            (g) =>
              g.full_name?.toLowerCase().includes(nameInput.toLowerCase()) ||
              g.phone?.includes(nameInput) ||
              g.cpf?.includes(nameInput),
          )
          .slice(0, 6)
      : [];

  const selectedRoom = (rooms as any[]).find((r) => r.id === roomId);
  const n = checkIn && checkOut ? nights(format(checkIn, "yyyy-MM-dd"), format(checkOut, "yyyy-MM-dd")) : 0;
  const totalPreview = selectedRoom && n > 0 ? n * Number(selectedRoom.promotional_price || selectedRoom.price) : 0;

  const openModal = () => {
    setModalOpen(true);
    setStep(1);
    setNameInput("");
    setSelectedGuest(null);
    setIsNewGuest(false);
    setNewGuestData({ full_name: "", phone: "", cpf: "", email: "" });
    setRoomId("");
    setCheckIn(undefined);
    setCheckOut(undefined);
  };

  const handleSave = async () => {
    if (!roomId) return toast.error("Selecione um quarto.");
    if (!checkIn || !checkOut || n < 1) return toast.error("Datas inválidas.");
    if (isNewGuest && !newGuestData.full_name.trim()) return toast.error("Informe o nome.");
    if (!isNewGuest && !selectedGuest) return toast.error("Selecione um hóspede.");

    const room = (rooms as any[]).find((r) => r.id === roomId)!;
    const total = n * Number(room.promotional_price || room.price);
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
            email: newGuestData.email || null,
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
        guests_count: 1,
        total_price: total,
        status: "confirmed",
      });
      if (error) throw error;
      toast.success("Reserva criada!");
      qc.invalidateQueries({ queryKey: ["reservas-lista"] });
      qc.invalidateQueries({ queryKey: ["guests-search-list"] });
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (r: Reservation) => {
    setEditRes(r);
    setEditRoomId(r.rooms ? (r.rooms as any).id : "");
    setEditCheckIn(new Date(r.check_in + "T12:00:00"));
    setEditCheckOut(new Date(r.check_out + "T12:00:00"));
    setEditNotes(r.notes || "");
  };

  const handleEditSave = async () => {
    if (!editRes || !editCheckIn || !editCheckOut) return;
    const n2 = nights(format(editCheckIn, "yyyy-MM-dd"), format(editCheckOut, "yyyy-MM-dd"));
    if (n2 < 1) return toast.error("Check-out deve ser após o check-in.");
    const room = (rooms as any[]).find((r) => r.id === editRoomId);
    const total = n2 * Number(room?.promotional_price || room?.price || 0);
    setEditSaving(true);
    try {
      const { error } = await supabase
        .from("reservations")
        .update({
          room_id: editRoomId,
          check_in: format(editCheckIn, "yyyy-MM-dd"),
          check_out: format(editCheckOut, "yyyy-MM-dd"),
          total_price: total,
          notes: editNotes || null,
        })
        .eq("id", editRes.id);
      if (error) throw error;
      toast.success("Reserva atualizada!");
      qc.invalidateQueries({ queryKey: ["reservas-lista"] });
      setEditRes(null);
    } catch (e: any) {
      toast.error(e.message || "Erro.");
    } finally {
      setEditSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 space-y-6 text-cream">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CalendarDays className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-cream leading-none">Reservas</h1>
            <p className="text-white/30 text-xs mt-0.5 font-body">Gestão e controle de reservas</p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-black text-sm font-semibold hover:brightness-110 transition-all"
          style={goldBg}
        >
          <Plus className="w-4 h-4" /> Nova Reserva
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <button
            key={k.label}
            onClick={() => setStatusFilter(k.filter)}
            className={`${k.bg} border rounded-xl p-4 text-left transition-all hover:brightness-110 ${statusFilter === k.filter ? "ring-1 ring-white/20" : ""}`}
          >
            <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">{k.label}</p>
            <p className={`font-display text-3xl font-bold ${k.color}`}>{k.value}</p>
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-charcoal-light border border-white/5 rounded-xl text-cream text-sm focus:border-primary/40 focus:outline-none transition placeholder:text-white/20 font-body"
            placeholder="Buscar por hóspede ou quarto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-charcoal-light border border-white/5 rounded-xl pl-4 pr-10 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition cursor-pointer"
          >
            <option value="all">Todos os status</option>
            <option value="confirmed">Confirmada</option>
            <option value="checked_in">Hospedado</option>
            <option value="checked_out">Finalizada</option>
            <option value="canceled">Cancelada</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-white/20 gap-2 font-body">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays className="w-12 h-12 text-primary/20 mx-auto mb-3" />
          <p className="text-white/30 font-body text-sm">Nenhuma reserva encontrada.</p>
        </div>
      ) : (
        <div className="bg-charcoal-light border border-white/5 rounded-xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Hóspede", "Quarto", "Período", "Noites", "Total", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-white/25 font-body"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const st = STATUS[r.status as keyof typeof STATUS] ?? STATUS.confirmed;
                const n2 = nights(r.check_in, r.check_out);
                return (
                  <tr
                    key={r.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                          <span className="text-white/40 text-xs font-bold">
                            {r.guestName[0]?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <span className="text-cream/80 text-sm font-body">{r.guestName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-cream/80 text-sm font-body">{(r.rooms as any)?.name ?? "—"}</p>
                      <p className="text-white/30 text-xs font-body mt-0.5">{(r.rooms as any)?.category}</p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-white/60 text-xs font-body">{fmt(r.check_in)}</p>
                      <p className="text-white/30 text-xs font-body">→ {fmt(r.check_out)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-white/40 text-sm font-body">{n2}n</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-primary font-semibold text-sm">
                        R$ {Number(r.total_price).toFixed(2).replace(".", ",")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-body ${st.color}`}
                      >
                        {st.icon} {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {r.status === "confirmed" && (
                          <button
                            onClick={() => openEdit(r)}
                            className="p-1.5 rounded-lg text-white/25 hover:text-cream hover:bg-white/8 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ MODAL NOVA RESERVA ═══ */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  {step === 2 && (
                    <button
                      onClick={() => {
                        setStep(1);
                        setRoomId("");
                        setCheckIn(undefined);
                        setCheckOut(undefined);
                      }}
                      className="text-white/30 hover:text-cream transition-colors"
                    >
                      ←
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <h2 className="font-display text-lg font-semibold text-cream">
                      {step === 1 ? "Nova Reserva" : "Detalhes"}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className={`w-5 h-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-white/10"}`} />
                    <div className={`w-5 h-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-white/10"}`} />
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-white/25 hover:text-cream transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Step 1 — Hóspede */}
              {step === 1 && (
                <div className="px-6 py-5 flex-1 overflow-y-auto">
                  <label className="flex items-center gap-1.5 text-[10px] text-white/40 font-body uppercase tracking-widest mb-3">
                    <User className="w-3 h-3" /> Nome do hóspede
                  </label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                    <input
                      autoFocus
                      placeholder="Digitar nome, CPF ou telefone..."
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0d0d10] border border-white/8 rounded-xl text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    {matchedGuests.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setSelectedGuest(g);
                          setIsNewGuest(false);
                          setStep(2);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/12 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                          <span className="text-white/40 text-sm font-bold group-hover:text-primary/60 transition-colors">
                            {g.full_name[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-cream/90 text-sm font-body font-medium truncate">{g.full_name}</p>
                          <p className="text-white/30 text-xs font-body truncate">{g.phone || g.cpf || "—"}</p>
                        </div>
                      </button>
                    ))}
                    {nameInput.trim().length >= 2 && (
                      <button
                        onClick={() => {
                          setIsNewGuest(true);
                          setNewGuestData((d) => ({ ...d, full_name: nameInput.trim() }));
                          setSelectedGuest(null);
                          setStep(2);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-primary/25 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Plus className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-primary/70 text-sm font-body font-medium group-hover:text-primary transition-colors">
                            Novo: "{nameInput.trim()}"
                          </p>
                          <p className="text-white/25 text-xs font-body">Cadastrar e criar reserva</p>
                        </div>
                      </button>
                    )}
                    {nameInput.trim().length < 2 && (
                      <p className="text-white/20 text-xs font-body text-center py-6">
                        Digite o nome para buscar ou criar um novo hóspede
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2 — Detalhes */}
              {step === 2 && (
                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                  {/* Resumo hóspede */}
                  <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                      <span className="text-emerald-400 text-sm font-bold">
                        {(isNewGuest ? newGuestData.full_name : (selectedGuest?.full_name ?? "?"))[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-cream text-sm font-body font-medium truncate">
                        {isNewGuest ? newGuestData.full_name : selectedGuest?.full_name}
                      </p>
                      <p className="text-white/30 text-xs font-body">
                        {isNewGuest ? "Novo hóspede" : selectedGuest?.phone || selectedGuest?.cpf || "Cadastrado"}
                      </p>
                    </div>
                  </div>

                  {/* Dados extras do novo hóspede */}
                  {isNewGuest && (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["CPF", "cpf", "000.000.000-00"],
                        ["Telefone", "phone", "(51) 99999-0000"],
                      ].map(([label, key, ph]) => (
                        <div key={key}>
                          <label className="text-[10px] text-white/30 font-body uppercase tracking-widest block mb-1.5">
                            {label}
                          </label>
                          <input
                            placeholder={ph}
                            value={(newGuestData as any)[key]}
                            onChange={(e) => setNewGuestData((d) => ({ ...d, [key]: e.target.value }))}
                            className="w-full bg-[#1a1a1f] border border-white/8 rounded-lg px-3 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/15"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quartos */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/40 font-body uppercase tracking-widest mb-2">
                      <BedDouble className="w-3 h-3" /> Quarto
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {(rooms as any[]).map((room) => (
                        <button
                          key={room.id}
                          disabled={room.occupied}
                          onClick={() => !room.occupied && setRoomId(room.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                            room.occupied
                              ? "opacity-50 cursor-not-allowed border-red-500/20 bg-red-500/5"
                              : roomId === room.id
                                ? "border-primary/50 bg-primary/8"
                                : "border-white/8 bg-[#1a1a1f] hover:border-white/18"
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
                              </div>
                              <p className="text-white/30 text-xs font-body mt-0.5">
                                {room.category} · até {room.capacity} hóspedes
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-primary font-semibold text-sm">
                                R$ {Number(room.promotional_price || room.price).toFixed(0)}
                              </p>
                              <p className="text-white/25 text-xs font-body">/noite</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Datas */}
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["Check-in", checkIn, setCheckIn, today()],
                        ["Check-out", checkOut, setCheckOut, checkIn ? addDays(checkIn, 1) : addDays(today(), 1)],
                      ] as const
                    ).map(([label, val, setter, minDate]) => (
                      <div key={label as string}>
                        <label className="text-[10px] text-white/40 font-body uppercase tracking-widest block mb-2">
                          {label as string}
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2.5 bg-[#1a1a1f] border border-white/8 rounded-xl text-sm font-body hover:border-white/20 transition",
                                val ? "text-cream" : "text-white/25",
                              )}
                            >
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

                  {/* Total preview */}
                  {totalPreview > 0 && (
                    <div className="bg-primary/6 border border-primary/18 rounded-xl p-4">
                      <div className="flex justify-between text-xs font-body text-white/40 mb-2">
                        <span>
                          {n} {n === 1 ? "diária" : "diárias"} × R${" "}
                          {Number(selectedRoom!.promotional_price || selectedRoom!.price).toFixed(0)}
                        </span>
                        <span>R$ {totalPreview.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-primary/12 pt-2">
                        <span className="font-display text-cream font-semibold text-sm">Total</span>
                        <span className="font-display text-primary text-xl font-bold">
                          R$ {totalPreview.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 shrink-0">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-white/40 hover:text-cream font-body transition-colors"
                >
                  Cancelar
                </button>
                {step === 2 && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-black text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                    style={goldBg}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {saving ? "Salvando..." : "Confirmar Reserva"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ MODAL EDITAR ═══ */}
      {editRes && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setEditRes(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-cream">Editar Reserva</h2>
                </div>
                <button onClick={() => setEditRes(null)} className="text-white/25 hover:text-cream transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                <p className="text-white/40 text-sm font-body">
                  Hóspede: <span className="text-cream">{editRes.guestName}</span>
                </p>
                <div>
                  <label className="text-[10px] text-white/40 font-body uppercase tracking-widest block mb-2">
                    <BedDouble className="w-3 h-3 inline mr-1" />
                    Quarto
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {(rooms as any[]).map((room) => (
                      <button
                        key={room.id}
                        disabled={room.occupied && editRoomId !== room.id}
                        onClick={() => setEditRoomId(room.id)}
                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          editRoomId === room.id
                            ? "border-primary/50 bg-primary/8"
                            : room.occupied
                              ? "opacity-50 cursor-not-allowed border-red-500/20 bg-red-500/5"
                              : "border-white/8 bg-[#1a1a1f] hover:border-white/18"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-cream text-sm font-body font-medium">{room.name}</p>
                              {room.occupied && editRoomId !== room.id && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-body">
                                  Ocupado
                                </span>
                              )}
                            </div>
                            <p className="text-white/30 text-xs font-body mt-0.5">
                              {room.category} · até {room.capacity} hósp.
                            </p>
                          </div>
                          <p className="text-primary font-semibold text-sm">
                            R$ {Number(room.promotional_price || room.price).toFixed(0)}
                            <span className="text-white/25 text-xs">/n</span>
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["Check-in", editCheckIn, setEditCheckIn, today()],
                      [
                        "Check-out",
                        editCheckOut,
                        setEditCheckOut,
                        editCheckIn ? addDays(editCheckIn, 1) : addDays(today(), 1),
                      ],
                    ] as const
                  ).map(([label, val, setter, minDate]) => (
                    <div key={label as string}>
                      <label className="text-[10px] text-white/40 font-body uppercase tracking-widest block mb-2">
                        {label as string}
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2.5 bg-[#1a1a1f] border border-white/8 rounded-xl text-sm font-body hover:border-white/20 transition",
                              val ? "text-cream" : "text-white/25",
                            )}
                          >
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
                <div>
                  <label className="text-[10px] text-white/40 font-body uppercase tracking-widest block mb-2">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-[#1a1a1f] border border-white/8 rounded-xl px-3 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/50 transition resize-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 shrink-0">
                <button
                  onClick={() => setEditRes(null)}
                  className="px-4 py-2 text-sm text-white/40 hover:text-cream font-body transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-black text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                  style={goldBg}
                >
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {editSaving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ MODAL EXCLUIR/CANCELAR ═══ */}
      {deleteId && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl pointer-events-auto p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-cream">Excluir reserva?</h3>
                  <p className="text-white/30 text-xs font-body mt-0.5">Essa ação não pode ser desfeita.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 text-sm text-white/40 hover:text-cream font-body border border-white/10 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteReservation.mutate(deleteId!)}
                  disabled={deleteReservation.isPending}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25 transition-colors disabled:opacity-50"
                >
                  {deleteReservation.isPending ? "Excluindo..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminReservas;
