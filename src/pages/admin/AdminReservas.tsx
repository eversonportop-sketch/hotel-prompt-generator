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
  Users,
  CalendarIcon,
  Trash2,
  Pencil,
  CheckCircle2,
  Ban,
  Clock,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Guest {
  id: string;
  full_name: string;
  email: string | null;
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
  rooms: { id?: string; name: string; category: string } | null;
  guests: { full_name: string } | null;
  profiles: { full_name: string | null } | null;
}

const STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
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
    color: "bg-gray-500/15 text-gray-300 border-gray-500/25",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  canceled: {
    label: "Cancelada",
    color: "bg-red-500/15 text-red-300 border-red-500/25",
    icon: <Ban className="w-3 h-3" />,
  },
};

const TRANSITIONS: Record<string, { value: string; label: string; style: string }[]> = {
  confirmed: [
    { value: "canceled", label: "Cancelar", style: "text-red-400 hover:bg-red-500/10" },
  ],
  checked_in: [],
  checked_out: [],
  canceled: [{ value: "confirmed", label: "Reativar", style: "text-emerald-400 hover:bg-emerald-500/10" }],
};

const emptyForm = {
  client_id: "",
  room_id: "",
  check_in: undefined as Date | undefined,
  check_out: undefined as Date | undefined,
  guests_count: 1,
  notes: "",
};

const emptyNewClient = {
  full_name: "",
  email: "",
  phone: "",
  cpf: "",
};

const AdminReservas = () => {
  const qc = useQueryClient();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [clientSearch, setClientSearch] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clientMode, setClientMode] = useState<"search" | "new">("search");
  const [newClient, setNewClient] = useState({ ...emptyNewClient });

  // Abre modal com cliente pré-selecionado vindo da página de Clientes
  useEffect(() => {
    const state = location.state as { preselectedGuest?: { id: string; full_name: string } } | null;
    if (state?.preselectedGuest) {
      setEditingId(null);
      setForm({ ...emptyForm, client_id: state.preselectedGuest.id });
      setSelectedName(state.preselectedGuest.full_name);
      setClientMode("search");
      setNewClient({ ...emptyNewClient });
      setClientSearch("");
      setModalOpen(true);
      // Limpa o state para não reabrir ao voltar
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
       const { data, error } = await supabase
         .from("reservations")
         .select(
           "*, profiles(full_name), rooms(id,name,category)",
         )
         .order("created_at", { ascending: false });
      if (error) throw error;
      // Enrich with guest names
      const allData = (data || []) as any[];
      const guestIds = [...new Set(allData.filter((r) => r.guest_id).map((r) => r.guest_id as string))];
      if (guestIds.length) {
        const { data: gd } = await (supabase as any).from("guests").select("id,full_name").in("id", guestIds);
        const gMap: Record<string, string> = {};
        (gd || []).forEach((g: any) => {
          gMap[g.id] = g.full_name;
        });
        allData.forEach((r) => {
          if (r.guest_id && gMap[r.guest_id]) r.guests = { full_name: gMap[r.guest_id] };
        });
      }
      return allData as Reservation[];
    },
  });

  const { data: guestsList = [] } = useQuery({
    queryKey: ["admin-guests-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,phone,cpf")
        .neq("role", "admin")
        .order("full_name");
      if (error) throw error;
      return data as Guest[];
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

  const handleSave = async () => {
    // Validate client
    if (clientMode === "new") {
      if (!newClient.full_name.trim()) {
        toast.error("Informe o nome do cliente.");
        return;
      }
    } else if (!form.client_id) {
      toast.error("Selecione um cliente.");
      return;
    }
    if (!form.room_id) {
      toast.error("Selecione um quarto.");
      return;
    }
    if (!form.check_in || !form.check_out) {
      toast.error("Selecione as datas.");
      return;
    }
    const nights = differenceInDays(form.check_out, form.check_in);
    if (nights < 1) {
      toast.error("Check-out deve ser após o check-in.");
      return;
    }
    const room = rooms.find((r) => r.id === form.room_id)!;
    const total = nights * Number(room.promotional_price || room.price);
    setSaving(true);
    try {
      let guestId = form.client_id;

      // If creating a new client, insert first
      if (clientMode === "new" && !editingId) {
        const { data: gd, error: ge } = await supabase
          .from("profiles")
          .insert({
            id: crypto.randomUUID(),
            full_name: newClient.full_name.trim(),
            email: newClient.email.trim() || null,
            phone: newClient.phone.trim() || null,
            cpf: newClient.cpf.trim() || null,
            role: "guest",
          })
          .select("id")
          .single();
        if (ge) throw ge;
        guestId = gd.id;
        qc.invalidateQueries({ queryKey: ["admin-guests-select"] });
      }

      const payload = {
        client_id: guestId,
        profile_id: guestId,
        room_id: form.room_id,
        check_in: format(form.check_in, "yyyy-MM-dd"),
        check_out: format(form.check_out, "yyyy-MM-dd"),
        guests_count: form.guests_count,
        total_price: total,
        notes: form.notes || null,
      };
      if (editingId) {
        const { error } = await supabase.from("reservations").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Reserva atualizada!");
      } else {
        const { data: avail } = await supabase.rpc("check_room_availability", {
          p_room_id: form.room_id,
          p_check_in: payload.check_in,
          p_check_out: payload.check_out,
        });
        if (!avail) {
          toast.error("Quarto indisponível para essas datas.");
          setSaving(false);
          return;
        }
        const { error } = await supabase.from("reservations").insert({ ...payload, status: "confirmed" });
        if (error) throw error;
        toast.success("Reserva criada!");
      }
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      closeModal();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setClientSearch("");
    setSelectedName("");
    setClientMode("search");
    setNewClient({ ...emptyNewClient });
    setModalOpen(true);
  };
  const openEdit = (r: Reservation) => {
    const cid = r.profile_id || r.guest_id || r.client_id || "";
    setEditingId(r.id);
    setForm({
      client_id: cid,
      room_id: (r.rooms as any)?.id || "",
      check_in: new Date(r.check_in + "T12:00:00"),
      check_out: new Date(r.check_out + "T12:00:00"),
      guests_count: r.guests_count,
      notes: r.notes || "",
    });
    setSelectedName((r.guests as any)?.full_name || (r.profiles as any)?.full_name || "");
    setClientSearch("");
    setClientMode("search");
    setNewClient({ ...emptyNewClient });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setClientSearch("");
    setSelectedName("");
    setClientMode("search");
    setNewClient({ ...emptyNewClient });
  };

  const filtered = reservations.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const cn = (r.guests as any)?.full_name ?? (r.profiles as any)?.full_name ?? "";
    const rn = (r.rooms as any)?.name ?? "";
    return matchStatus && (!q || cn.toLowerCase().includes(q) || rn.toLowerCase().includes(q));
  });

  const filteredGuests = guestsList.filter((g) => {
    const q = clientSearch.toLowerCase();
    return (
      !q ||
      g.full_name?.toLowerCase().includes(q) ||
      g.email?.toLowerCase().includes(q) ||
      g.phone?.includes(q) ||
      g.cpf?.includes(q)
    );
  });

  const selectedRoom = rooms.find((r) => r.id === form.room_id);
  const nights = form.check_in && form.check_out ? differenceInDays(form.check_out, form.check_in) : 0;
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
      label: "Hospedados",
      value: reservations.filter((r) => r.status === "checked_in").length,
      color: "text-blue-400",
      border: "border-blue-500/20",
      bg: "bg-blue-500/10",
      filter: "checked_in",
    },
    {
      label: "Finalizadas",
      value: reservations.filter((r) => r.status === "checked_out").length,
      color: "text-gray-400",
      border: "border-gray-500/20",
      bg: "bg-gray-500/10",
      filter: "checked_out",
    },
  ];

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
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-black text-sm font-body font-semibold hover:brightness-110 transition-all"
          style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)" }}
        >
          <Plus className="w-4 h-4" /> Nova Reserva
        </button>
      </div>

      {/* KPIs clicáveis */}
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

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-charcoal-light border border-white/5 rounded-xl text-cream text-sm focus:border-primary/40 focus:outline-none transition placeholder:text-white/20 font-body"
            placeholder="Buscar por cliente ou quarto..."
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
                {["Cliente", "Quarto", "Período", "Noites", "Total", "Status", ""].map((h) => (
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
                const st = STATUS[r.status] ?? STATUS.confirmed;
                const transitions = TRANSITIONS[r.status] ?? [];
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

      {/* Modal Nova/Editar Reserva */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              key="bd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primary" />
                    <h2 className="font-display text-lg font-semibold text-cream">
                      {editingId ? "Editar Reserva" : "Nova Reserva"}
                    </h2>
                  </div>
                  <button onClick={closeModal} className="text-white/25 hover:text-cream transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">
                  {/* 1. CLIENTE */}
                  <section className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[10px] text-white/40 font-body uppercase tracking-widest">
                        <User className="w-3 h-3" />
                        Cliente
                      </label>
                      {!editingId && (
                        <div className="flex items-center gap-1 bg-white/4 border border-white/8 rounded-lg p-0.5">
                          <button
                            onClick={() => {
                              setClientMode("search");
                              setNewClient({ ...emptyNewClient });
                            }}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-body font-semibold transition-all ${clientMode === "search" ? "bg-white/10 text-cream" : "text-white/30 hover:text-white/60"}`}
                          >
                            Buscar
                          </button>
                          <button
                            onClick={() => {
                              setClientMode("new");
                              setForm((f) => ({ ...f, client_id: "" }));
                              setSelectedName("");
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-body font-semibold transition-all ${clientMode === "new" ? "bg-primary/20 text-primary" : "text-white/30 hover:text-white/60"}`}
                          >
                            <UserPlus className="w-3 h-3" /> Novo
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Modo: cadastrar novo cliente */}
                    {clientMode === "new" ? (
                      <div className="border border-primary/20 bg-primary/4 rounded-xl p-4 space-y-3">
                        <p className="text-[10px] text-primary/60 font-body uppercase tracking-widest font-semibold">
                          Dados do novo cliente
                        </p>
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-white/30 font-body uppercase tracking-widest block mb-1">
                              Nome completo <span className="text-red-400">*</span>
                            </label>
                            <input
                              placeholder="Ex: João da Silva"
                              value={newClient.full_name}
                              onChange={(e) => setNewClient((c) => ({ ...c, full_name: e.target.value }))}
                              className="w-full bg-[#1a1a1f] border border-white/8 rounded-lg px-3 py-2 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/15"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-white/30 font-body uppercase tracking-widest block mb-1">
                                Telefone
                              </label>
                              <input
                                placeholder="(51) 99999-0000"
                                value={newClient.phone}
                                onChange={(e) => setNewClient((c) => ({ ...c, phone: e.target.value }))}
                                className="w-full bg-[#1a1a1f] border border-white/8 rounded-lg px-3 py-2 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/15"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-white/30 font-body uppercase tracking-widest block mb-1">
                                CPF
                              </label>
                              <input
                                placeholder="000.000.000-00"
                                value={newClient.cpf}
                                onChange={(e) => setNewClient((c) => ({ ...c, cpf: e.target.value }))}
                                className="w-full bg-[#1a1a1f] border border-white/8 rounded-lg px-3 py-2 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/15"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-white/30 font-body uppercase tracking-widest block mb-1">
                              E-mail
                            </label>
                            <input
                              placeholder="email@exemplo.com"
                              type="email"
                              value={newClient.email}
                              onChange={(e) => setNewClient((c) => ({ ...c, email: e.target.value }))}
                              className="w-full bg-[#1a1a1f] border border-white/8 rounded-lg px-3 py-2 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/15"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Cliente já selecionado */}
                        {form.client_id ? (
                          <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                              <span className="text-emerald-400 text-sm font-display font-bold">
                                {selectedName[0]?.toUpperCase() ?? "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-cream text-sm font-body font-medium truncate">{selectedName}</p>
                              <p className="text-white/30 text-xs font-body mt-0.5">Cliente selecionado</p>
                            </div>
                            <button
                              onClick={() => {
                                setForm((f) => ({ ...f, client_id: "" }));
                                setSelectedName("");
                              }}
                              className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          /* Busca de clientes */
                          <div className="border border-white/8 rounded-xl overflow-hidden">
                            <div className="relative">
                              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
                              <input
                                placeholder="Buscar por nome, CPF ou telefone..."
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-[#0d0d10] text-cream text-sm font-body focus:outline-none border-b border-white/5 transition placeholder:text-white/15"
                              />
                            </div>
                            <div className="max-h-44 overflow-y-auto divide-y divide-white/4">
                              {filteredGuests.length === 0 ? (
                                <div className="flex flex-col items-center py-7 gap-3">
                                  <UserPlus className="w-7 h-7 text-white/10" />
                                  <p className="text-white/25 text-xs font-body text-center">
                                    {clientSearch ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                                  </p>
                                  <button
                                    onClick={() => setClientMode("new")}
                                    className="text-primary/60 hover:text-primary text-xs font-body font-semibold flex items-center gap-1 transition-colors"
                                  >
                                    <UserPlus className="w-3 h-3" /> Cadastrar novo cliente
                                  </button>
                                </div>
                              ) : (
                                filteredGuests.map((p) => (
                                  <button
                                    key={p.id}
                                    onClick={() => {
                                      setForm((f) => ({ ...f, client_id: p.id }));
                                      setSelectedName(p.full_name ?? "");
                                      setClientSearch("");
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/4 transition-colors text-left group"
                                  >
                                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                                      <span className="text-white/30 text-xs font-display font-bold group-hover:text-primary/60 transition-colors">
                                        {(p.full_name ?? "?")[0].toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-cream/80 text-sm font-body font-medium truncate">
                                        {p.full_name}
                                      </p>
                                      <p className="text-white/25 text-xs font-body truncate">
                                        {p.email || p.phone || p.cpf || "—"}
                                      </p>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </section>

                  {/* 2. QUARTO */}
                  <section>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/40 font-body uppercase tracking-widest mb-2">
                      <BedDouble className="w-3 h-3" />
                      Quarto
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {rooms.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => setForm((f) => ({ ...f, room_id: room.id, guests_count: 1 }))}
                          className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${form.room_id === room.id ? "border-primary/50 bg-primary/8" : "border-white/8 bg-[#1a1a1f] hover:border-white/18"}`}
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
                  </section>

                  {/* 3. DATAS */}
                  <section className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["Check-in", "check_in", today],
                        ["Check-out", "check_out", form.check_in ? addDays(form.check_in, 1) : addDays(today, 1)],
                      ] as const
                    ).map(([label, key, minDate]) => (
                      <div key={key}>
                        <label className="flex items-center gap-1.5 text-[10px] text-white/40 font-body uppercase tracking-widest mb-2">
                          <CalendarIcon className="w-3 h-3" />
                          {label}
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2.5 bg-[#1a1a1f] border border-white/8 rounded-xl text-sm font-body hover:border-white/20 transition",
                                form[key] ? "text-cream" : "text-white/25",
                              )}
                            >
                              <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                              {form[key] ? format(form[key]!, "dd/MM/yyyy") : "Selecionar"}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={form[key]}
                              initialFocus
                              onSelect={(d) => setForm((f) => ({ ...f, [key]: d }))}
                              disabled={(date) => date < (minDate as Date)}
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    ))}
                  </section>

                  {/* 4. HÓSPEDES */}
                  <section>
                    <label className="flex items-center gap-1.5 text-[10px] text-white/40 font-body uppercase tracking-widest mb-2">
                      <Users className="w-3 h-3" />
                      Nº de Hóspedes
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedRoom?.capacity ?? 10}
                      value={form.guests_count}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          guests_count: Math.max(
                            1,
                            Math.min(selectedRoom?.capacity ?? 10, parseInt(e.target.value) || 1),
                          ),
                        }))
                      }
                      className="w-full bg-[#1a1a1f] border border-white/8 rounded-xl px-3 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/50 transition"
                    />
                    {selectedRoom && (
                      <p className="text-white/20 text-xs font-body mt-1">Máximo: {selectedRoom.capacity} hóspedes</p>
                    )}
                  </section>

                  {/* 5. OBSERVAÇÕES */}
                  <section>
                    <label className="text-[10px] text-white/40 font-body uppercase tracking-widest block mb-2">
                      Observações <span className="text-white/20 normal-case">(opcional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: quarto com vista, mobilidade reduzida..."
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full bg-[#1a1a1f] border border-white/8 rounded-xl px-3 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/50 transition placeholder:text-white/15 resize-none"
                    />
                  </section>

                  {/* Preview total */}
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
                        <span className="font-display text-cream font-semibold text-sm">Total da hospedagem</span>
                        <span className="font-display text-primary text-xl font-bold">
                          R$ {totalPreview.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 shrink-0">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-sm text-white/40 hover:text-cream font-body transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-black text-sm font-body font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)" }}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
                    {saving ? "Salvando..." : editingId ? "Salvar Alterações" : "Confirmar Reserva"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Excluir */}
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
              key="dmod"
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
