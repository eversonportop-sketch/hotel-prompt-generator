import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Search,
  Plus,
  X,
  Loader2,
  BedDouble,
  User,
  CalendarIcon,
  Trash2,
  Pencil,
  CheckCircle2,
  Ban,
  Clock,
  ChevronDown,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  category: string;
  price: number;
  promotional_price: number | null;
  capacity: number;
}
interface Reservation {
  id: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  total_price: number;
  status: string;
  notes: string | null;
  client_id: string | null;
  profile_id: string | null;
  guest_id: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  rooms: { id?: string; name: string; category: string } | null;
  guests: { full_name: string } | null;
  profiles: { full_name: string | null } | null;
}

const STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-500/15 text-yellow-300 border-yellow-500/25",
    icon: <Clock className="w-3 h-3" />,
  },
  confirmed: {
    label: "Confirmada",
    color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  completed: {
    label: "Concluída",
    color: "bg-blue-500/15 text-blue-300 border-blue-500/25",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  canceled: {
    label: "Cancelada",
    color: "bg-red-500/15 text-red-300 border-red-500/25",
    icon: <Ban className="w-3 h-3" />,
  },
};
const TRANSITIONS: Record<string, { value: string; label: string; style: string }[]> = {
  pending: [
    { value: "confirmed", label: "Confirmar", style: "text-emerald-400 hover:bg-emerald-500/10" },
    { value: "canceled", label: "Cancelar", style: "text-red-400 hover:bg-red-500/10" },
  ],
  confirmed: [{ value: "canceled", label: "Cancelar", style: "text-red-400 hover:bg-red-500/10" }],
  completed: [],
  canceled: [{ value: "pending", label: "Reativar", style: "text-yellow-400 hover:bg-yellow-500/10" }],
};
const emptyNewClient = { full_name: "", phone: "", cpf: "", email: "" };

const AdminReservas = () => {
  const qc = useQueryClient();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Nova Reserva modal
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [nameInput, setNameInput] = useState("");
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    name: string;
    phone?: string;
    cpf?: string;
  } | null>(null);
  const [newClient, setNewClient] = useState({ ...emptyNewClient });
  const [isNew, setIsNew] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guestsCount, setGuestsCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [editRoomId, setEditRoomId] = useState("");
  const [editCheckIn, setEditCheckIn] = useState<Date | undefined>();
  const [editCheckOut, setEditCheckOut] = useState<Date | undefined>();
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    const state = location.state as { preselectedGuest?: { id: string; full_name: string } } | null;
    if (state?.preselectedGuest) {
      openModal();
      setSelectedClient({ id: state.preselectedGuest.id, name: state.preselectedGuest.full_name });
      setIsNew(false);
      setStep(2);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, profiles(full_name), rooms(id,name,category), checked_in_at, checked_out_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const all = (data || []) as any[];
      const gids = [...new Set(all.filter((r) => r.guest_id).map((r) => r.guest_id as string))];
      if (gids.length) {
        const { data: gd } = await (supabase as any).from("guests").select("id,full_name").in("id", gids);
        const gMap: Record<string, string> = {};
        (gd || []).forEach((g: any) => {
          gMap[g.id] = g.full_name;
        });
        all.forEach((r) => {
          if (r.guest_id && gMap[r.guest_id]) r.guests = { full_name: gMap[r.guest_id] };
        });
      }
      return all as Reservation[];
    },
  });

  const { data: clientsList = [] } = useQuery({
    queryKey: ["admin-clients-search"],
    queryFn: async () => {
      const [pr, gr] = await Promise.all([
        supabase.from("profiles").select("id,full_name,phone,cpf").neq("role", "admin").order("full_name"),
        supabase.from("guests").select("id,full_name,phone,cpf").order("full_name"),
      ]);
      const all = [...(pr.data || []), ...(gr.data || [])] as any[];
      const seen = new Set<string>();
      return all.filter((g) => {
        if (seen.has(g.id)) return false;
        seen.add(g.id);
        return true;
      });
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["admin-rooms-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id,name,category,price,promotional_price,capacity")
        .eq("status", "active")
        .order("display_order");
      if (error) throw error;
      return data as Room[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar."),
  });

  const deleteReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      toast.success("Reserva excluída.");
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  const filtered = reservations.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const cn = (r.guests as any)?.full_name ?? (r.profiles as any)?.full_name ?? "";
    return (
      matchStatus && (!q || cn.toLowerCase().includes(q) || ((r.rooms as any)?.name ?? "").toLowerCase().includes(q))
    );
  });

  const matchedClients =
    nameInput.trim().length >= 1
      ? clientsList
          .filter(
            (c) =>
              c.full_name?.toLowerCase().includes(nameInput.toLowerCase()) ||
              c.phone?.includes(nameInput) ||
              c.cpf?.includes(nameInput),
          )
          .slice(0, 6)
      : [];

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPreview =
    selectedRoom && nights > 0 ? nights * Number(selectedRoom.promotional_price || selectedRoom.price) : 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const kpis = [
    {
      label: "Total",
      value: reservations.length,
      color: "text-cream",
      border: "border-white/10",
      bg: "bg-white/5",
      filter: "all",
    },
    {
      label: "Confirmadas",
      value: reservations.filter((r) => r.status === "confirmed").length,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/10",
      filter: "confirmed",
    },
    {
      label: "Pendentes",
      value: reservations.filter((r) => r.status === "pending").length,
      color: "text-yellow-400",
      border: "border-yellow-500/20",
      bg: "bg-yellow-500/10",
      filter: "pending",
    },
    {
      label: "Concluídas",
      value: reservations.filter((r) => r.status === "completed").length,
      color: "text-blue-400",
      border: "border-blue-500/20",
      bg: "bg-blue-500/10",
      filter: "completed",
    },
  ];

  const openModal = () => {
    setModalOpen(true);
    setStep(1);
    setNameInput("");
    setSelectedClient(null);
    setIsNew(false);
    setNewClient({ ...emptyNewClient });
    setRoomId("");
    setCheckIn(undefined);
    setCheckOut(undefined);
    setGuestsCount(1);
    setNotes("");
  };

  const pickExisting = (c: any) => {
    setSelectedClient({ id: c.id, name: c.full_name, phone: c.phone, cpf: c.cpf });
    setIsNew(false);
    setStep(2);
  };
  const pickNew = () => {
    setIsNew(true);
    setNewClient((n) => ({ ...n, full_name: nameInput.trim() }));
    setSelectedClient(null);
    setStep(2);
  };

  const handleSave = async () => {
    if (isNew && !newClient.full_name.trim()) {
      toast.error("Informe o nome.");
      return;
    }
    if (!isNew && !selectedClient) {
      toast.error("Selecione um hóspede.");
      return;
    }
    if (!roomId) {
      toast.error("Selecione um quarto.");
      return;
    }
    if (!checkIn || !checkOut || nights < 1) {
      toast.error("Datas inválidas.");
      return;
    }
    const room = rooms.find((r) => r.id === roomId)!;
    const total = nights * Number(room.promotional_price || room.price);
    setSaving(true);
    try {
      let guestId = selectedClient?.id ?? null;
      if (isNew) {
        const { data: gd, error: ge } = await supabase
          .from("guests")
          .insert({
            full_name: newClient.full_name.trim(),
            phone: newClient.phone || null,
            cpf: newClient.cpf || null,
            email: newClient.email || null,
          })
          .select("id")
          .single();
        if (ge) throw ge;
        guestId = gd.id;
        qc.invalidateQueries({ queryKey: ["admin-clients-search"] });
      }
      const payload = {
        ...(isNew ? { guest_id: guestId } : { profile_id: guestId }),
        room_id: roomId,
        check_in: format(checkIn, "yyyy-MM-dd"),
        check_out: format(checkOut, "yyyy-MM-dd"),
        guests_count: guestsCount,
        total_price: total,
        notes: notes || null,
        status: "confirmed",
      };
      const { data: avail } = await supabase.rpc("check_room_availability", {
        p_room_id: roomId,
        p_check_in: payload.check_in,
        p_check_out: payload.check_out,
      });
      if (!avail) {
        toast.error("Quarto indisponível para essas datas.");
        setSaving(false);
        return;
      }
      const { error } = await supabase.from("reservations").insert(payload);
      if (error) throw error;
      toast.success(isNew ? "Hóspede cadastrado e reserva criada!" : "Reserva criada!");
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (r: Reservation) => {
    setEditingRes(r);
    setEditRoomId((r.rooms as any)?.id || "");
    setEditCheckIn(new Date(r.check_in + "T12:00:00"));
    setEditCheckOut(new Date(r.check_out + "T12:00:00"));
    setEditNotes(r.notes || "");
  };

  const handleEditSave = async () => {
    if (!editingRes || !editCheckIn || !editCheckOut) return;
    const n = differenceInDays(editCheckOut, editCheckIn);
    if (n < 1) {
      toast.error("Check-out deve ser após o check-in.");
      return;
    }
    const room = rooms.find((r) => r.id === editRoomId);
    const total = n * Number(room?.promotional_price || room?.price || 0);
    setEditSaving(true);
    try {
      const { error } = await supabase
        .from("reservations")
        .update({
          room_id: editRoomId,
          check_in: format(editCheckIn, "yyyy-MM-dd"),
          check_out: format(editCheckOut, "yyyy-MM-dd"),
          guests_count: 1,
          total_price: total,
          notes: editNotes || null,
        })
        .eq("id", editingRes.id);
      if (error) throw error;
      toast.success("Reserva atualizada!");
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      setEditingRes(null);
    } catch (err: any) {
      toast.error(err.message || "Erro.");
    } finally {
      setEditSaving(false);
    }
  };

  const btnGold =
    "flex items-center gap-2 px-5 py-2.5 rounded-lg text-black text-sm font-body font-semibold hover:brightness-110 transition-all disabled:opacity-50";
  const goldBg = { background: "linear-gradient(135deg,#C9A84C,#E5C97A)" };

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
        <button onClick={openModal} className={btnGold} style={goldBg}>
          <Plus className="w-4 h-4" /> Nova Reserva
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <button
            key={k.label}
            onClick={() => setStatusFilter(k.filter)}
            className={`${k.bg} border ${k.border} rounded-xl p-4 text-left transition-all hover:brightness-110 ${statusFilter === k.filter ? "ring-1 ring-white/20" : ""}`}
          >
            <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">{k.label}</p>
            <p className={`font-display text-3xl font-bold ${k.color}`}>{k.value}</p>
          </button>
        ))}
      </div>

      {/* Search */}
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
            <option value="pending">Pendente</option>
            <option value="confirmed">Confirmada</option>
            <option value="canceled">Cancelada</option>
            <option value="completed">Concluída</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-white/20 font-body gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays className="w-12 h-12 text-primary/20 mx-auto mb-3" />
          <p className="text-white/30 font-body text-sm">Nenhuma reserva encontrada.</p>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="mt-2 text-xs text-primary/60 hover:text-primary font-body transition-colors"
            >
              Limpar filtro
            </button>
          )}
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
              {filtered.map((r, i) => {
                const clientName = (r.profiles as any)?.full_name || (r.guests as any)?.full_name;
                const roomName = (r.rooms as any)?.name;
                const roomCat = (r.rooms as any)?.category;
                const n = differenceInDays(new Date(r.check_out + "T12:00:00"), new Date(r.check_in + "T12:00:00"));
                const st = STATUS[r.status] ?? STATUS.pending;
                const transitions = TRANSITIONS[r.status] ?? [];
                const canCheckin = (r.status === "confirmed" || r.status === "pending") && !r.checked_in_at;
                return (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.025 }}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                          <span className="text-white/40 text-xs font-display font-bold">
                            {clientName ? clientName[0].toUpperCase() : "?"}
                          </span>
                        </div>
                        <span className="text-cream/80 text-sm font-body">
                          {clientName || <span className="text-white/25 italic">Sem cliente</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-cream/80 text-sm font-body">{roomName || "—"}</p>
                      {roomCat && <p className="text-white/30 text-xs font-body mt-0.5">{roomCat}</p>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-white/60 text-xs font-body">
                        {format(new Date(r.check_in + "T12:00:00"), "dd MMM", { locale: ptBR })}
                      </p>
                      <p className="text-white/30 text-xs font-body">
                        → {format(new Date(r.check_out + "T12:00:00"), "dd MMM yy", { locale: ptBR })}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-white/40 text-sm font-body">{n}n</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-primary font-display font-semibold text-sm">
                        R$ {Number(r.total_price).toFixed(2).replace(".", ",")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-body ${st.color}`}
                      >
                        {st.icon}
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canCheckin && (
                          <a
                            href="/admin/checkin"
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-body text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <LogIn className="w-3.5 h-3.5" /> Check-in
                          </a>
                        )}
                        {transitions.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => updateStatus.mutate({ id: r.id, status: t.value })}
                            className={`text-xs px-2.5 py-1.5 rounded-lg font-body transition-colors ${t.style}`}
                          >
                            {t.label}
                          </button>
                        ))}
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1.5 rounded-lg text-white/25 hover:text-cream hover:bg-white/8 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ MODAL NOVA RESERVA ═══ */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              key="bd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              key="m"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal header */}
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
                        className="text-white/30 hover:text-cream transition-colors text-lg leading-none"
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
                      <div
                        className={`w-5 h-1 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-white/10"}`}
                      />
                      <div
                        className={`w-5 h-1 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-white/10"}`}
                      />
                    </div>
                    <button
                      onClick={() => setModalOpen(false)}
                      className="text-white/25 hover:text-cream transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* STEP 1 */}
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
                      {matchedClients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => pickExisting(c)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/12 transition-all text-left group"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                            <span className="text-white/40 text-sm font-display font-bold group-hover:text-primary/60 transition-colors">
                              {(c.full_name ?? "?")[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-cream/90 text-sm font-body font-medium truncate">{c.full_name}</p>
                            <p className="text-white/30 text-xs font-body truncate">{c.phone || c.cpf || "—"}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-primary/50 transition-colors" />
                        </button>
                      ))}
                      {nameInput.trim().length >= 2 && (
                        <button
                          onClick={pickNew}
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
                          <ArrowRight className="w-4 h-4 text-primary/30 group-hover:text-primary/60 transition-colors" />
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

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                    {/* Client summary */}
                    <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                        <span className="text-emerald-400 text-sm font-display font-bold">
                          {(isNew ? newClient.full_name : (selectedClient?.name ?? "?"))[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-cream text-sm font-body font-medium truncate">
                          {isNew ? newClient.full_name : selectedClient?.name}
                        </p>
                        <p className="text-white/30 text-xs font-body">
                          {isNew ? "Novo hóspede" : selectedClient?.phone || selectedClient?.cpf || "Cadastrado"}
                        </p>
                      </div>
                    </div>

                    {/* New client extra fields */}
                    {isNew && (
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
                              value={(newClient as any)[key]}
                              onChange={(e) => setNewClient((c) => ({ ...c, [key]: e.target.value }))}
                              className="w-full bg-[#1a1a1f] border border-white/8 rounded-lg px-3 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/15"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Room */}
                    <div>
                      <label className="flex items-center gap-1.5 text-[10px] text-white/40 font-body uppercase tracking-widest mb-2">
                        <BedDouble className="w-3 h-3" /> Quarto
                      </label>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {rooms.map((room) => (
                          <button
                            key={room.id}
                            onClick={() => setRoomId(room.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${roomId === room.id ? "border-primary/50 bg-primary/8" : "border-white/8 bg-[#1a1a1f] hover:border-white/18"}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-cream text-sm font-body font-medium">{room.name}</p>
                                <p className="text-white/30 text-xs font-body mt-0.5">
                                  {room.category} · até {room.capacity} hóspedes
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-primary font-display font-semibold text-sm">
                                  R$ {Number(room.promotional_price || room.price).toFixed(0)}
                                </p>
                                <p className="text-white/25 text-xs font-body">/noite</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      {(
                        [
                          ["Check-in", checkIn, setCheckIn, today],
                          ["Check-out", checkOut, setCheckOut, checkIn ? addDays(checkIn, 1) : addDays(today, 1)],
                        ] as const
                      ).map(([label, val, setter, minDate]) => (
                        <div key={label as string}>
                          <label className="flex items-center gap-1.5 text-[10px] text-white/40 font-body uppercase tracking-widest mb-2">
                            <CalendarIcon className="w-3 h-3" /> {label as string}
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-2.5 bg-[#1a1a1f] border border-white/8 rounded-xl text-sm font-body hover:border-white/20 transition",
                                  val ? "text-cream" : "text-white/25",
                                )}
                              >
                                <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                                {val ? format(val as Date, "dd/MM/yyyy") : "Selecionar"}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={val as Date | undefined}
                                initialFocus
                                onSelect={(d) => (setter as (d: Date | undefined) => void)(d)}
                                disabled={(date) => date < (minDate as Date)}
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    {totalPreview > 0 && (
                      <div className="bg-primary/6 border border-primary/18 rounded-xl p-4">
                        <div className="flex justify-between text-xs font-body text-white/40 mb-2">
                          <span>
                            {nights} {nights === 1 ? "diária" : "diárias"} × R${" "}
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
                    <button onClick={handleSave} disabled={saving} className={btnGold} style={goldBg}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {saving ? "Salvando..." : "Confirmar Reserva"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ MODAL EDITAR ═══ */}
      <AnimatePresence>
        {editingRes && (
          <>
            <motion.div
              key="ebd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setEditingRes(null)}
            />
            <motion.div
              key="em"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-primary" />
                    <h2 className="font-display text-lg font-semibold text-cream">Editar Reserva</h2>
                  </div>
                  <button
                    onClick={() => setEditingRes(null)}
                    className="text-white/25 hover:text-cream transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/40 font-body uppercase tracking-widest mb-2">
                      <BedDouble className="w-3 h-3" /> Quarto
                    </label>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {rooms.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => setEditRoomId(room.id)}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${editRoomId === room.id ? "border-primary/50 bg-primary/8" : "border-white/8 bg-[#1a1a1f] hover:border-white/18"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-cream text-sm font-body font-medium">{room.name}</p>
                              <p className="text-white/30 text-xs font-body mt-0.5">
                                {room.category} · até {room.capacity} hósp.
                              </p>
                            </div>
                            <p className="text-primary font-display font-semibold text-sm">
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
                        ["Check-in", editCheckIn, setEditCheckIn, today],
                        [
                          "Check-out",
                          editCheckOut,
                          setEditCheckOut,
                          editCheckIn ? addDays(editCheckIn, 1) : addDays(today, 1),
                        ],
                      ] as const
                    ).map(([label, val, setter, minDate]) => (
                      <div key={label as string}>
                        <label className="flex items-center gap-1.5 text-[10px] text-white/40 font-body uppercase tracking-widest mb-2">
                          <CalendarIcon className="w-3 h-3" /> {label as string}
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2.5 bg-[#1a1a1f] border border-white/8 rounded-xl text-sm font-body hover:border-white/20 transition",
                                val ? "text-cream" : "text-white/25",
                              )}
                            >
                              <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                              {val ? format(val as Date, "dd/MM/yyyy") : "Selecionar"}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={val as Date | undefined}
                              initialFocus
                              onSelect={(d) => (setter as (d: Date | undefined) => void)(d)}
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
                    onClick={() => setEditingRes(null)}
                    className="px-4 py-2 text-sm text-white/40 hover:text-cream font-body transition-colors"
                  >
                    Cancelar
                  </button>
                  <button onClick={handleEditSave} disabled={editSaving} className={btnGold} style={goldBg}>
                    {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {editSaving ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ MODAL EXCLUIR ═══ */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div
              key="dbg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              key="dm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
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
                    className="flex-1 py-2.5 text-sm font-body font-semibold rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25 transition-colors disabled:opacity-50"
                  >
                    {deleteReservation.isPending ? "Excluindo..." : "Confirmar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminReservas;
