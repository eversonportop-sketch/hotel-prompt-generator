import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  Save,
  CalendarIcon,
  Trash2,
  Pencil,
  FileText,
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ── Tipos ──────────────────────────────────────────────────────────────────── */
interface Profile {
  id: string;
  full_name: string | null;
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
  profile_id: string | null;
  client_id: string | null;
  rooms: { id: string; name: string; category: string } | null;
  profiles: { full_name: string | null } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  canceled: "Cancelada",
  completed: "Concluída",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  confirmed: "bg-green-500/15 text-green-400 border-green-500/25",
  canceled: "bg-red-500/15 text-red-400 border-red-500/25",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/25",
};

const emptyForm = {
  profile_id: "",
  room_id: "",
  check_in: undefined as Date | undefined,
  check_out: undefined as Date | undefined,
  guests_count: 1,
  notes: "",
};

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const getClientName = (r: Reservation) => (r.profiles as any)?.full_name || null;

const getNights = (r: Reservation) =>
  differenceInDays(new Date(r.check_out + "T12:00:00"), new Date(r.check_in + "T12:00:00"));

/* ════════════════════════════════════════════════════════════════════════════ */
const AdminReservas = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal criar / editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [clientSearch, setClientSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Confirmação de exclusão
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Detalhe (ver notas)
  const [detailRow, setDetailRow] = useState<Reservation | null>(null);

  /* ── Queries ──────────────────────────────────────────────────────────────── */
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, rooms(id, name, category), profiles!reservations_profile_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fallback: busca nomes de reservas antigas que só têm client_id
      const orphans = (data || []).filter((r: any) => !r.profiles?.full_name && r.client_id);
      if (orphans.length > 0) {
        const ids = [...new Set(orphans.map((r: any) => r.client_id as string))];
        const { data: pData } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const map: Record<string, string> = {};
        (pData || []).forEach((p: any) => {
          map[p.id] = p.full_name;
        });
        (data || []).forEach((r: any) => {
          if (!r.profiles?.full_name && r.client_id && map[r.client_id]) {
            r.profiles = { full_name: map[r.client_id] };
          }
        });
      }
      return (data || []) as Reservation[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, cpf")
        .order("full_name");
      if (error) throw error;
      return data as unknown as Profile[];
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["admin-rooms-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, category, price, promotional_price, capacity")
        .eq("status", "active")
        .order("display_order");
      if (error) throw error;
      return data as Room[];
    },
  });

  /* ── Mutations ────────────────────────────────────────────────────────────── */
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status."),
  });

  const deleteReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      toast.success("Reserva excluída.");
      setDeleteConfirm(null);
    },
    onError: () => toast.error("Erro ao excluir reserva."),
  });

  /* ── Salvar (criar ou editar) ─────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.profile_id) {
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
      if (editingId) {
        // ── Editar reserva existente ──
        const { error } = await supabase
          .from("reservations")
          .update({
            profile_id: form.profile_id,
            client_id: form.profile_id,
            room_id: form.room_id,
            check_in: format(form.check_in, "yyyy-MM-dd"),
            check_out: format(form.check_out, "yyyy-MM-dd"),
            guests_count: form.guests_count,
            total_price: total,
            notes: form.notes || null,
          })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Reserva atualizada!");
      } else {
        // ── Criar nova reserva ──
        const { data: available, error: availErr } = await supabase.rpc("check_room_availability", {
          p_room_id: form.room_id,
          p_check_in: format(form.check_in, "yyyy-MM-dd"),
          p_check_out: format(form.check_out, "yyyy-MM-dd"),
        });
        if (availErr) throw availErr;
        if (!available) {
          toast.error("Quarto indisponível para essas datas.");
          setSaving(false);
          return;
        }
        const { error } = await supabase.from("reservations").insert({
          profile_id: form.profile_id,
          client_id: form.profile_id,
          room_id: form.room_id,
          check_in: format(form.check_in, "yyyy-MM-dd"),
          check_out: format(form.check_out, "yyyy-MM-dd"),
          guests_count: form.guests_count,
          total_price: total,
          status: "confirmed",
          notes: form.notes || null,
        });
        if (error) throw error;
        toast.success("Reserva criada e confirmada!");
      }

      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      closeModal();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar reserva.");
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setClientSearch("");
    setModalOpen(true);
  };

  const openEdit = (r: Reservation) => {
    setEditingId(r.id);
    setForm({
      profile_id: r.profile_id || r.client_id || "",
      room_id: (r.rooms as any)?.id || "",
      check_in: new Date(r.check_in + "T12:00:00"),
      check_out: new Date(r.check_out + "T12:00:00"),
      guests_count: r.guests_count,
      notes: r.notes || "",
    });
    setClientSearch("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setClientSearch("");
  };

  /* ── Filtros ──────────────────────────────────────────────────────────────── */
  const filtered = reservations.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const clientName = getClientName(r) ?? "";
    const roomName = (r.rooms as any)?.name ?? "";
    return matchStatus && (!q || clientName.toLowerCase().includes(q) || roomName.toLowerCase().includes(q));
  });

  const filteredClients = profiles.filter((p) => {
    const q = clientSearch.toLowerCase();
    return (
      !q ||
      p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.cpf?.includes(q)
    );
  });

  const selectedClient = profiles.find((p) => p.id === form.profile_id);
  const selectedRoom = rooms.find((r) => r.id === form.room_id);
  const nights = form.check_in && form.check_out ? differenceInDays(form.check_out, form.check_in) : 0;
  const totalPreview =
    selectedRoom && nights > 0 ? nights * Number(selectedRoom.promotional_price || selectedRoom.price) : 0;
  const today = new Date();

  const kpis = [
    { label: "Total", value: reservations.length, color: "text-cream", border: "border-white/10", bg: "bg-white/5" },
    {
      label: "Confirmadas",
      value: reservations.filter((r) => r.status === "confirmed").length,
      color: "text-green-400",
      border: "border-green-500/20",
      bg: "bg-green-500/10",
    },
    {
      label: "Pendentes",
      value: reservations.filter((r) => r.status === "pending").length,
      color: "text-yellow-400",
      border: "border-yellow-500/20",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Concluídas",
      value: reservations.filter((r) => r.status === "completed").length,
      color: "text-blue-400",
      border: "border-blue-500/20",
      bg: "bg-blue-500/10",
    },
  ];

  /* ── Render ───────────────────────────────────────────────────────────────── */
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
            <p className="text-white/30 text-xs mt-0.5 font-body">Gestão de reservas</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-xl p-4`}>
            <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">{k.label}</p>
            <p className={`font-display text-3xl font-bold ${k.color}`}>{k.value}</p>
          </div>
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-charcoal-light border border-white/5 rounded-xl px-4 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="confirmed">Confirmada</option>
          <option value="canceled">Cancelada</option>
          <option value="completed">Concluída</option>
        </select>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-white/20 font-body gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <CalendarDays className="w-12 h-12 text-primary/20 mx-auto mb-4" />
          <p className="text-white/30 font-body">Nenhuma reserva encontrada.</p>
        </div>
      ) : (
        <div className="bg-charcoal-light border border-white/5 rounded-xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Cliente", "Quarto / Tipo", "Período", "Noites", "Total", "Status", "Ações"].map((h) => (
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
                const clientName = getClientName(r);
                const roomName = (r.rooms as any)?.name;
                const roomCat = (r.rooms as any)?.category;
                const n = getNights(r);
                return (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.025 }}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Cliente */}
                    <td className="px-5 py-4">
                      <span className="text-cream text-sm font-body">
                        {clientName || <span className="text-white/25">—</span>}
                      </span>
                    </td>

                    {/* Quarto + categoria */}
                    <td className="px-5 py-4">
                      <p className="text-cream/80 text-sm font-body">{roomName || "—"}</p>
                      {roomCat && <p className="text-white/30 text-xs font-body mt-0.5">{roomCat}</p>}
                    </td>

                    {/* Período check-in → check-out */}
                    <td className="px-5 py-4">
                      <p className="text-white/60 text-xs font-body">
                        {format(new Date(r.check_in + "T12:00:00"), "dd/MM/yy")}
                      </p>
                      <p className="text-white/30 text-xs font-body">
                        → {format(new Date(r.check_out + "T12:00:00"), "dd/MM/yy")}
                      </p>
                    </td>

                    {/* Noites */}
                    <td className="px-5 py-4">
                      <span className="text-white/50 text-sm font-body">{n}n</span>
                    </td>

                    {/* Total */}
                    <td className="px-5 py-4">
                      <span className="text-primary font-display font-semibold">
                        R$ {Number(r.total_price).toFixed(2)}
                      </span>
                    </td>

                    {/* Status badge + select */}
                    <td className="px-5 py-4">
                      <select
                        value={r.status}
                        onChange={(e) => updateStatus.mutate({ id: r.id, status: e.target.value })}
                        className={`rounded-lg px-2 py-1.5 text-xs font-body border focus:outline-none transition cursor-pointer ${STATUS_COLORS[r.status] || "bg-white/10 text-white/40 border-white/10"}`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="canceled">Cancelada</option>
                        <option value="completed">Concluída</option>
                      </select>
                    </td>

                    {/* Ações: notas | editar | excluir */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {r.notes && (
                          <button
                            onClick={() => setDetailRow(r)}
                            title="Ver observações"
                            className="p-1.5 rounded-lg text-white/30 hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(r)}
                          title="Editar"
                          className="p-1.5 rounded-lg text-white/30 hover:text-cream hover:bg-white/10 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(r.id)}
                          title="Excluir"
                          className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ── Modal Criar / Editar ──────────────────────────────────────────────── */}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header modal */}
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
                  {/* Cliente */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-white/40 font-body uppercase tracking-wider mb-2">
                      <User className="w-3 h-3" /> Cliente
                    </label>
                    {selectedClient ? (
                      <div className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-lg px-4 py-3">
                        <div>
                          <p className="text-cream text-sm font-body font-medium">{selectedClient.full_name}</p>
                          <p className="text-white/40 text-xs font-body mt-0.5">
                            {selectedClient.email || selectedClient.phone || selectedClient.cpf}
                          </p>
                        </div>
                        <button
                          onClick={() => setForm((f) => ({ ...f, profile_id: "" }))}
                          className="text-white/30 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                          <input
                            placeholder="Buscar por nome, email, CPF ou telefone..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-[#1a1a1f] border border-white/10 rounded-lg text-cream text-sm font-body focus:outline-none focus:border-primary/50 transition placeholder:text-white/20"
                          />
                        </div>
                        <div className="bg-[#1a1a1f] border border-white/5 rounded-lg max-h-40 overflow-y-auto divide-y divide-white/5">
                          {filteredClients.length === 0 ? (
                            <p className="text-white/20 text-xs font-body text-center py-4">
                              {clientSearch ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                            </p>
                          ) : (
                            filteredClients.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setForm((f) => ({ ...f, profile_id: p.id }));
                                  setClientSearch("");
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors"
                              >
                                <p className="text-cream text-sm font-body">{p.full_name ?? "Sem nome"}</p>
                                <p className="text-white/30 text-xs font-body">{p.email || p.phone || p.cpf || "—"}</p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quarto */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-white/40 font-body uppercase tracking-wider mb-2">
                      <BedDouble className="w-3 h-3" /> Quarto
                    </label>
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {rooms.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => setForm((f) => ({ ...f, room_id: room.id, guests_count: 1 }))}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                            form.room_id === room.id
                              ? "border-primary/50 bg-primary/10"
                              : "border-white/10 bg-[#1a1a1f] hover:border-white/20"
                          }`}
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

                  {/* Check-in / Check-out */}
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["Check-in", "check_in", today],
                        ["Check-out", "check_out", form.check_in ? addDays(form.check_in, 1) : addDays(today, 1)],
                      ] as const
                    ).map(([label, key, minDate]) => (
                      <div key={key}>
                        <label className="flex items-center gap-1.5 text-xs text-white/40 font-body uppercase tracking-wider mb-2">
                          <CalendarIcon className="w-3 h-3" /> {label}
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2.5 bg-[#1a1a1f] border border-white/10 rounded-lg text-sm font-body hover:border-white/20 transition",
                                form[key] ? "text-cream" : "text-white/25",
                              )}
                            >
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {form[key] ? format(form[key]!, "dd/MM/yyyy") : "Selecionar"}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={form[key]}
                              onSelect={(d) => setForm((f) => ({ ...f, [key]: d }))}
                              disabled={(date) => date < (minDate as Date)}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    ))}
                  </div>

                  {/* Hóspedes */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-white/40 font-body uppercase tracking-wider mb-2">
                      <Users className="w-3 h-3" /> Hóspedes
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
                      className="w-full bg-[#1a1a1f] border border-white/10 rounded-lg px-3 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/50 transition"
                    />
                    {selectedRoom && (
                      <p className="text-white/25 text-xs font-body mt-1">Máximo: {selectedRoom.capacity} hóspedes</p>
                    )}
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="text-xs text-white/40 font-body uppercase tracking-wider block mb-2">
                      Observações (opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: pedido especial, mobilidade reduzida..."
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full bg-[#1a1a1f] border border-white/10 rounded-lg px-3 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/50 transition placeholder:text-white/15 resize-none"
                    />
                  </div>

                  {/* Preview total */}
                  {totalPreview > 0 && (
                    <div className="bg-primary/8 border border-primary/20 rounded-xl p-4">
                      <div className="flex justify-between text-sm font-body text-white/50 mb-1">
                        <span>
                          {nights} {nights === 1 ? "diária" : "diárias"} × R${" "}
                          {Number(selectedRoom!.promotional_price || selectedRoom!.price).toFixed(0)}
                        </span>
                        <span>R$ {totalPreview.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-primary/15 pt-2 mt-2">
                        <span className="font-display text-cream font-semibold">Total</span>
                        <span className="font-display text-primary text-xl font-bold">
                          R$ {totalPreview.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer modal */}
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
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? "Salvando..." : editingId ? "Salvar Alterações" : "Confirmar Reserva"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modal Detalhe (notas) ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailRow && (
          <>
            <motion.div
              key="dbg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setDetailRow(null)}
            />
            <motion.div
              key="dmodal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl pointer-events-auto p-6 space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-cream">Observações</h3>
                  <button
                    onClick={() => setDetailRow(null)}
                    className="text-white/25 hover:text-cream transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-white/60 font-body leading-relaxed">{detailRow.notes}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modal Confirmar Exclusão ──────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              key="dbg2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              key="dmodal2"
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
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-cream">Excluir reserva?</h3>
                    <p className="text-white/30 text-xs font-body mt-0.5">Essa ação não pode ser desfeita.</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2 text-sm text-white/40 hover:text-cream font-body border border-white/10 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => deleteReservation.mutate(deleteConfirm)}
                    disabled={deleteReservation.isPending}
                    className="flex-1 py-2 text-sm font-body font-semibold rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors disabled:opacity-50"
                  >
                    {deleteReservation.isPending ? "Excluindo..." : "Confirmar exclusão"}
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
