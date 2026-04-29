import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarDays,
  Search,
  Plus,
  X,
  Loader2,
  BedDouble,
  Pencil,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Clock,
  Ban,
  TrendingUp,
  Lock,
  CalendarPlus,
  FileText,
  Printer,
} from "lucide-react";
import { format, differenceInDays, addDays, startOfDay, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import NewReservationDrawer from "@/components/admin/NewReservationDrawer";

// ── PIN de supervisor ────────────────────────────────────────────────────────
const SUPERVISOR_PIN = "Andre1982ok";

// ── Modal de PIN ──────────────────────────────────────────────────────────────
const PinModal = ({
  title,
  description,
  onClose,
  onSuccess,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [pinValue, setPinValue] = React.useState("");
  const [pinError, setPinError] = React.useState(false);

  const handleConfirm = () => {
    if (pinValue === SUPERVISOR_PIN) {
      onSuccess();
      onClose();
    } else {
      setPinError(true);
      setPinValue("");
      setTimeout(() => setPinError(false), 1500);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[#111114] border border-white/10 rounded-2xl p-8 max-w-xs w-full text-center shadow-2xl pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${pinError ? "bg-red-500/20 border border-red-500/40" : "bg-amber-500/10 border border-amber-500/20"}`}
          >
            <Lock className={`w-6 h-6 ${pinError ? "text-red-400" : "text-amber-400"}`} />
          </div>
          <h3 className="font-display text-lg font-bold text-cream mb-1">{title}</h3>
          <p className="text-white/40 text-sm font-body mb-6">{description}</p>
          <input
            type="password"
            maxLength={20}
            autoFocus
            className={`w-full text-center text-2xl tracking-[0.5em] bg-black/50 border rounded-lg px-4 py-3 text-cream focus:outline-none transition mb-2 ${pinError ? "border-red-500/60" : "border-white/10 focus:border-amber-500/50"}`}
            value={pinValue}
            onChange={(e) => setPinValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            placeholder="••••"
          />
          {pinError && <p className="text-red-400 text-xs font-body mb-2">PIN incorreto. Tente novamente.</p>}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm text-white/40 hover:text-cream font-body border border-white/10 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-black transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)" }}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Tipos ───────────────────────────────────────────────────────────────────
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
  checked_out_at: string | null;
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
  const [pinDeleteOpen, setPinDeleteOpen] = useState(false);
  const pendingDeleteRef = React.useRef<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [periodoFat, setPeriodoFat] = useState<"hoje" | "semana" | "mes" | "ano">("hoje");
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [pinRelatorioOpen, setPinRelatorioOpen] = useState(false);
  const [relatorioAutenticado, setRelatorioAutenticado] = useState(false);
  const [fatAutenticado, setFatAutenticado] = useState(false);
  const [pinFatOpen, setPinFatOpen] = useState(false);

  // Modal Estender Estadia
  const [extendRes, setExtendRes] = useState<Reservation | null>(null);
  const [extendCheckOut, setExtendCheckOut] = useState<Date | undefined>();
  const [extendSaving, setExtendSaving] = useState(false);

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
          "id, check_in, check_out, checked_out_at, total_price, status, notes, guest_id, profile_id, room_id, guests_count, rooms(id,name,category)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data || []) as any[];
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

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id,name,category,price,promotional_price,capacity")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
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
      setSearch("");
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

  // ─── Faturamento finalizadas ───────────────────────────────────────────────
  const finalizadas = reservations.filter((r) => r.status === "checked_out" && r.checked_out_at);
  const now = new Date();

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
    const basePrice = Number(room?.price || 0);
    const extraPerPerson = room?.promotional_price ? Number(room.promotional_price) : 0;
    const guestsQty = Number(editRes.guests_count || 1);
    const total = n2 * (basePrice + extraPerPerson * Math.max(0, guestsQty - 1));
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

  const handleExtendSave = async () => {
    if (!extendRes || !extendCheckOut) return;
    const newCheckOut = format(extendCheckOut, "yyyy-MM-dd");
    const n2 = nights(extendRes.check_in, newCheckOut);
    if (n2 < 1) return toast.error("Nova data deve ser após o check-in.");
    const currentNights = nights(extendRes.check_in, extendRes.check_out);
    if (n2 <= currentNights) return toast.error("Nova data deve ser após o checkout atual.");
    const dailyRate = currentNights > 0 ? Number(extendRes.total_price) / currentNights : Number(extendRes.total_price);
    const newTotal = parseFloat((dailyRate * n2).toFixed(2));
    setExtendSaving(true);
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ check_out: newCheckOut, total_price: newTotal })
        .eq("id", extendRes.id);
      if (error) throw error;
      toast.success(`Estadia estendida até ${format(extendCheckOut, "dd/MM/yyyy")}!`);
      qc.invalidateQueries({ queryKey: ["reservas-lista"] });
      setExtendRes(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao estender estadia.");
    } finally {
      setExtendSaving(false);
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
          onClick={() => setDrawerOpen(true)}
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

      {/* Faturamento */}
      <div className="bg-charcoal-light border border-white/5 rounded-xl p-5 space-y-4">
        {/* Header + combo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30 font-body">
              Faturamento — Finalizadas
            </h3>
          </div>
          <select
            value={periodoFat}
            onChange={(e) => setPeriodoFat(e.target.value as any)}
            className="text-xs border border-white/10 text-cream font-body rounded-lg px-3 py-1.5 outline-none cursor-pointer transition-colors appearance-none"
            style={{ background: "#1a1a20" }}
          >
            <option value="hoje" style={{ background: "#1a1a20" }}>
              Hoje
            </option>
            <option value="semana" style={{ background: "#1a1a20" }}>
              Esta semana
            </option>
            <option value="mes" style={{ background: "#1a1a20" }}>
              Este mês
            </option>
            <option value="ano" style={{ background: "#1a1a20" }}>
              Este ano
            </option>
          </select>
          <button
            onClick={() => {
              if (relatorioAutenticado) {
                setRelatorioOpen(true);
              } else {
                setPinRelatorioOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-black text-xs font-semibold hover:brightness-110 transition-all ml-2"
            style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)" }}
          >
            <FileText className="w-3.5 h-3.5" />
            Gerar Relatório
          </button>
        </div>

        {/* Cards resumo */}
        {!fatAutenticado ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <p className="text-white/40 text-sm font-body uppercase tracking-widest">Acesso restrito</p>
            <button
              onClick={() => setPinFatOpen(true)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-black text-xs font-semibold hover:brightness-110 transition-all"
              style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)" }}
            >
              <Lock className="w-3.5 h-3.5" />
              Desbloquear
            </button>
          </div>
        ) : (() => {
          const desde =
            periodoFat === "hoje"
              ? startOfDay(now)
              : periodoFat === "semana"
                ? startOfWeek(now, { weekStartsOn: 1 })
                : periodoFat === "mes"
                  ? startOfMonth(now)
                  : startOfYear(now);
          const resPeriodo = finalizadas.filter((r) => new Date(r.checked_out_at!) >= desde);
          const totalPeriodo = resPeriodo.reduce((s, r) => s + Number(r.total_price), 0);
          const ticketMedio = resPeriodo.length > 0 ? totalPeriodo / resPeriodo.length : 0;
          return (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-primary/8 border border-primary/20 rounded-lg px-4 py-3">
                  <p className="text-[10px] text-primary/50 font-body uppercase tracking-widest mb-1">Total</p>
                  <p className="font-display text-xl font-bold text-primary">
                    R$ {totalPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-lg px-4 py-3">
                  <p className="text-[10px] text-white/30 font-body uppercase tracking-widest mb-1">Checkouts</p>
                  <p className="font-display text-xl font-bold text-cream/80">{resPeriodo.length}</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-lg px-4 py-3">
                  <p className="text-[10px] text-white/30 font-body uppercase tracking-widest mb-1">Ticket médio</p>
                  <p className="font-display text-xl font-bold text-cream/80">
                    R$ {ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Tabela detalhada */}
              {resPeriodo.length === 0 ? (
                <p className="text-center text-white/20 text-sm font-body py-4">Nenhum checkout no período.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-white/5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        {["Hóspede", "Quarto", "Período", "Checkout", "Valor"].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-2.5 text-[10px] uppercase tracking-widest text-white/25 font-body"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resPeriodo.map((r) => {
                        const n2 = nights(r.check_in, r.check_out);
                        return (
                          <tr
                            key={r.id}
                            className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                                  <span className="text-white/40 text-[10px] font-bold">
                                    {r.guestName[0]?.toUpperCase() ?? "?"}
                                  </span>
                                </div>
                                <span className="text-cream/80 font-body">{r.guestName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-cream/70 font-body">{(r.rooms as any)?.name ?? "—"}</p>
                              <p className="text-white/30 text-xs font-body">{(r.rooms as any)?.category}</p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="text-white/50 text-xs font-body">
                                {fmt(r.check_in)} → {fmt(r.check_out)}
                              </p>
                              <p className="text-white/25 text-xs font-body">{n2}n</p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="text-white/50 text-xs font-body">
                                {format(new Date(r.checked_out_at!), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-primary font-semibold font-body">
                                R$ {Number(r.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-primary/20 bg-primary/5">
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-xs text-white/30 font-body font-semibold uppercase tracking-wider"
                        >
                          Total do período
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-primary font-display font-bold text-base">
                            R$ {totalPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          );
        })()}
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
                {["Hóspede", "Quarto", "Período", "Noites", "Status", ""].map((h) => (
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
                            title="Editar reserva"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {r.status === "checked_in" && (
                          <button
                            onClick={() => {
                              setExtendRes(r);
                              setExtendCheckOut(new Date(r.check_out + "T12:00:00"));
                            }}
                            className="p-1.5 rounded-lg text-white/25 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Estender estadia"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            pendingDeleteRef.current = r.id;
                            setPinDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Excluir reserva"
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

      {/* ═══ DRAWER NOVA RESERVA ═══ */}
      <NewReservationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

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

      {/* ═══ MODAL ESTENDER ESTADIA ═══ */}
      {extendRes && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setExtendRes(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl pointer-events-auto p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <CalendarPlus className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-cream">Estender Estadia</h3>
                    <p className="text-white/30 text-xs font-body mt-0.5">{extendRes.guestName}</p>
                  </div>
                </div>
                <button onClick={() => setExtendRes(null)} className="text-white/25 hover:text-cream transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm font-body">
                <p className="text-white/40">
                  Checkout atual: <span className="text-cream">{fmt(extendRes.check_out)}</span>
                </p>
                <p className="text-white/40 mt-1">
                  Quarto: <span className="text-cream">{(extendRes.rooms as any)?.name ?? "—"}</span>
                </p>
              </div>

              <div>
                <label className="text-[10px] text-white/40 font-body uppercase tracking-widest block mb-2">
                  Nova data de checkout
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#1a1a1f] border border-white/8 rounded-xl text-sm font-body hover:border-white/20 transition text-cream">
                      <CalendarDays className="w-4 h-4 text-white/30" />
                      {extendCheckOut ? format(extendCheckOut, "dd/MM/yyyy") : "Selecionar data"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={extendCheckOut}
                      initialFocus
                      onSelect={(d) => d && setExtendCheckOut(d)}
                      disabled={(date) => date <= new Date(extendRes.check_out + "T12:00:00")}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {extendCheckOut && (
                  <p className="text-xs text-blue-400/70 font-body mt-2">
                    {nights(extendRes.check_in, format(extendCheckOut, "yyyy-MM-dd"))} noites no total
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setExtendRes(null)}
                  className="flex-1 py-2.5 text-sm text-white/40 hover:text-cream font-body border border-white/10 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExtendSave}
                  disabled={extendSaving || !extendCheckOut}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-black transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)" }}
                >
                  {extendSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
                  {extendSaving ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ MODAL PIN EXCLUSÃO ═══ */}
      {pinDeleteOpen && (
        <PinModal
          title="Confirmar exclusão"
          description="Digite o PIN de supervisor para excluir esta reserva."
          onClose={() => {
            setPinDeleteOpen(false);
            pendingDeleteRef.current = null;
          }}
          onSuccess={() => {
            if (pendingDeleteRef.current) setDeleteId(pendingDeleteRef.current);
            pendingDeleteRef.current = null;
          }}
        />
      )}

      {/* ═══ MODAL PIN RELATÓRIO ═══ */}
      {pinRelatorioOpen && (
        <PinModal
          title="Acessar relatório"
          description="Digite o PIN de supervisor para gerar o relatório."
          onClose={() => setPinRelatorioOpen(false)}
          onSuccess={() => {
            setRelatorioAutenticado(true);
            setRelatorioOpen(true);
          }}
        />
      )}

      {pinFatOpen && (
        <PinModal
          title="Acesso ao Faturamento"
          description="Digite a senha de administrador para visualizar."
          onClose={() => setPinFatOpen(false)}
          onSuccess={() => setFatAutenticado(true)}
        />
      )}

      {/* ═══ MODAL RELATÓRIO ═══ */}
      {relatorioOpen && (() => {
        const desde =
          periodoFat === "hoje"
            ? startOfDay(now)
            : periodoFat === "semana"
              ? startOfWeek(now, { weekStartsOn: 1 })
              : periodoFat === "mes"
                ? startOfMonth(now)
                : startOfYear(now);

        const resPeriodoRel = finalizadas.filter(
          (r) => new Date(r.checked_out_at!) >= desde
        );
        const totalRel = resPeriodoRel.reduce((s, r) => s + Number(r.total_price), 0);
        const ticketMedioRel = resPeriodoRel.length > 0 ? totalRel / resPeriodoRel.length : 0;

        const periodoLabel =
          periodoFat === "hoje"
            ? "Hoje"
            : periodoFat === "semana"
              ? "Esta semana"
              : periodoFat === "mes"
                ? "Este mês"
                : "Este ano";

        const porQuarto: Record<string, { nome: string; categoria: string; reservas: number; noites: number; total: number }> = {};
        resPeriodoRel.forEach((r) => {
          const nome = (r.rooms as any)?.name ?? "—";
          const cat = (r.rooms as any)?.category ?? "—";
          const n2 = nights(r.check_in, r.check_out);
          if (!porQuarto[nome]) porQuarto[nome] = { nome, categoria: cat, reservas: 0, noites: 0, total: 0 };
          porQuarto[nome].reservas += 1;
          porQuarto[nome].noites += n2;
          porQuarto[nome].total += Number(r.total_price);
        });
        const quartosList = Object.values(porQuarto).sort((a, b) => b.total - a.total);

        return (
          <>
            <div
              className="fixed inset-0 z-[55] bg-black/80 backdrop-blur-sm no-print"
              onClick={() => setRelatorioOpen(false)}
            />
            <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 pointer-events-none no-print">
              <div
                id="relatorio-print"
                className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-5 border-b border-white/10 no-print">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <h3 className="font-display text-base font-semibold text-cream">
                      Relatório de Faturamento — {periodoLabel}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-black text-sm font-semibold hover:brightness-110 transition-all"
                      style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)" }}
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </button>
                    <button
                      onClick={() => setRelatorioOpen(false)}
                      className="text-white/25 hover:text-cream transition-colors ml-2"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto p-6 space-y-6">
                  <div className="hidden print-only">
                    <h1 className="text-xl font-bold">Hotel SB — Relatório de Faturamento</h1>
                    <p>Período: {periodoLabel}</p>
                    <p>Gerado em: {format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3 font-body">
                      Resumo Executivo
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-charcoal-light border border-white/5 rounded-lg p-4">
                        <p className="text-white/40 text-xs font-body mb-1">Total Faturado</p>
                        <p className="text-cream text-lg font-display font-semibold">
                          R$ {totalRel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-charcoal-light border border-white/5 rounded-lg p-4">
                        <p className="text-white/40 text-xs font-body mb-1">Checkouts</p>
                        <p className="text-cream text-lg font-display font-semibold">{resPeriodoRel.length}</p>
                      </div>
                      <div className="bg-charcoal-light border border-white/5 rounded-lg p-4">
                        <p className="text-white/40 text-xs font-body mb-1">Ticket Médio</p>
                        <p className="text-cream text-lg font-display font-semibold">
                          R$ {ticketMedioRel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      {quartosList[0] && (
                        <div className="bg-charcoal-light border border-white/5 rounded-lg p-4">
                          <p className="text-white/40 text-xs font-body mb-1">Melhor Quarto</p>
                          <p className="text-cream text-sm font-display font-semibold">{quartosList[0].nome}</p>
                          <p className="text-primary text-xs font-body mt-1">
                            R$ {quartosList[0].total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {quartosList.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3 font-body">
                        Faturamento por Quarto
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              {["Quarto", "Categoria", "Reservas", "Noites", "Total (R$)", "% do Total"].map((h) => (
                                <th key={h} className="text-left text-xs uppercase tracking-wider text-white/40 font-body py-2 px-3">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {quartosList.map((q) => (
                              <tr key={q.nome} className="border-b border-white/5">
                                <td className="py-2 px-3 text-cream font-body">{q.nome}</td>
                                <td className="py-2 px-3 text-white/60 font-body">{q.categoria}</td>
                                <td className="py-2 px-3 text-white/60 font-body">{q.reservas}</td>
                                <td className="py-2 px-3 text-white/60 font-body">{q.noites}n</td>
                                <td className="py-2 px-3 text-cream font-body">
                                  R$ {q.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 px-3 text-primary font-body">
                                  {totalRel > 0 ? ((q.total / totalRel) * 100).toFixed(1) : "0"}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {resPeriodoRel.length === 0 ? (
                    <p className="text-white/40 text-sm font-body text-center py-8">
                      Nenhum checkout no período selecionado.
                    </p>
                  ) : (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3 font-body">
                        Lista Completa de Checkouts
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              {["Hóspede", "Quarto", "Período", "Checkout", "Valor"].map((h) => (
                                <th key={h} className="text-left text-xs uppercase tracking-wider text-white/40 font-body py-2 px-3">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {resPeriodoRel.map((r) => {
                              const n2 = nights(r.check_in, r.check_out);
                              return (
                                <tr key={r.id} className="border-b border-white/5">
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary text-xs font-semibold">
                                        {r.guestName[0]?.toUpperCase() ?? "?"}
                                      </div>
                                      <span className="text-cream font-body">{r.guestName}</span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3">
                                    <p className="text-cream font-body">{(r.rooms as any)?.name ?? "—"}</p>
                                    <p className="text-white/40 text-xs font-body">{(r.rooms as any)?.category}</p>
                                  </td>
                                  <td className="py-2 px-3">
                                    <p className="text-white/60 text-xs font-body">{fmt(r.check_in)} → {fmt(r.check_out)}</p>
                                    <p className="text-white/40 text-xs font-body">{n2}n</p>
                                  </td>
                                  <td className="py-2 px-3 text-white/60 text-xs font-body">
                                    {format(new Date(r.checked_out_at!), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                  </td>
                                  <td className="py-2 px-3 text-cream font-semibold font-body">
                                    R$ {Number(r.total_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-white/20">
                              <td colSpan={4} className="py-3 px-3 text-right text-white/60 font-body uppercase text-xs tracking-wider">
                                Total do período
                              </td>
                              <td className="py-3 px-3 text-primary font-display font-semibold">
                                R$ {totalRel.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* ═══ MODAL EXCLUIR ═══ */}
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
