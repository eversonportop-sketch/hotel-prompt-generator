// ─── AdminSalao ────────────────────────────────────────────────────────────────
// Módulo completo: agendamentos do salão de festas
// Tabela Supabase: hall_bookings
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, PartyPopper, Plus, Pencil, Trash2, X, Save,
  Users, CalendarDays, Clock, DollarSign, Loader2, Search,
  Phone, Mail, ChevronLeft, ChevronRight, CreditCard,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, eachDayOfInterval, isSameMonth, isSameDay, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

interface HallBooking {
  id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  guests_count: number;
  total_price: number;
  status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
}

const EVENT_TYPES = [
  "Casamento", "Aniversário", "Formatura", "Evento Corporativo",
  "Confraternização", "Batizado", "Outro",
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pendente",   color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  confirmed: { label: "Confirmado", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  canceled:  { label: "Cancelado",  color: "bg-red-500/20 text-red-400 border-red-500/30" },
  completed: { label: "Concluído",  color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  none:    { label: "Sem pagamento", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  partial: { label: "Sinal pago",   color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  full:    { label: "Pago total",   color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
};

const EMPTY: Omit<HallBooking, "id" | "created_at"> = {
  client_name: "",
  client_phone: "",
  client_email: "",
  event_type: "Casamento",
  event_date: "",
  start_time: "08:00",
  end_time: "18:00",
  guests_count: 50,
  total_price: 0,
  status: "pending",
  payment_status: "none",
  notes: "",
};

/* ── helpers de período ──────────────────────────────────────────────────── */
function getWeekRange() {
  const now = new Date();
  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
}
function getMonthRange() {
  const now = new Date();
  return { start: startOfMonth(now), end: endOfMonth(now) };
}
function getYearRange() {
  const now = new Date();
  return { start: startOfYear(now), end: endOfYear(now) };
}
function revenueInRange(bookings: HallBooking[], start: Date, end: Date) {
  const s = format(start, "yyyy-MM-dd");
  const e = format(end, "yyyy-MM-dd");
  return bookings
    .filter(b => (b.status === "confirmed" || b.status === "completed") && b.event_date >= s && b.event_date <= e)
    .reduce((sum, b) => sum + Number(b.total_price), 0);
}

/* ── conflito de horário ─────────────────────────────────────────────────── */
function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function hasConflict(bookings: HallBooking[], form: Omit<HallBooking, "id" | "created_at">, editingId?: string) {
  const fStart = timeToMin(form.start_time);
  const fEnd = timeToMin(form.end_time);
  return bookings.some(b => {
    if (b.id === editingId) return false;
    if (b.status === "canceled") return false;
    if (b.event_date !== form.event_date) return false;
    const bStart = timeToMin(b.start_time);
    const bEnd = timeToMin(b.end_time);
    return fStart < bEnd && fEnd > bStart;
  });
}

const AdminSalao = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HallBooking | null>(null);
  const [form, setForm] = useState<Omit<HallBooking, "id" | "created_at">>(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-hall-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hall_bookings")
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data as unknown as HallBooking[]).map(b => ({
        ...b,
        payment_status: (b as any).payment_status ?? "none",
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (hasConflict(bookings, form, editing?.id)) {
        setConflictError(true);
        throw new Error("Já existe um evento nesse horário.");
      }
      setConflictError(false);
      const payload: any = {
        client_name: form.client_name,
        client_phone: form.client_phone || null,
        client_email: form.client_email || null,
        event_type: form.event_type,
        event_date: form.event_date,
        start_time: form.start_time,
        end_time: form.end_time,
        guests_count: Number(form.guests_count),
        total_price: Number(form.total_price),
        status: form.status,
        payment_status: form.payment_status,
        notes: form.notes || null,
      };
      if (editing) {
        const { error } = await supabase.from("hall_bookings").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hall_bookings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Agendamento atualizado!" : "Agendamento criado!");
      qc.invalidateQueries({ queryKey: ["admin-hall-bookings"] });
      closeModal();
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hall_bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento excluído.");
      qc.invalidateQueries({ queryKey: ["admin-hall-bookings"] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setConflictError(false); setModalOpen(true); };
  const openEdit = (b: HallBooking) => {
    setEditing(b);
    setForm({
      client_name: b.client_name,
      client_phone: b.client_phone ?? "",
      client_email: b.client_email ?? "",
      event_type: b.event_type,
      event_date: b.event_date,
      start_time: b.start_time,
      end_time: b.end_time,
      guests_count: b.guests_count,
      total_price: b.total_price,
      status: b.status,
      payment_status: b.payment_status ?? "none",
      notes: b.notes ?? "",
    });
    setConflictError(false);
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(EMPTY); setConflictError(false); };

  const filtered = bookings.filter((b) => {
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.client_name.toLowerCase().includes(q) || b.event_type.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const today = new Date().toISOString().split("T")[0];
  const upcoming = bookings.filter((b) => b.event_date >= today && b.status !== "canceled").length;

  /* ── receitas ──────────────────────────────────────────────────────────── */
  const weekRange = getWeekRange();
  const monthRange = getMonthRange();
  const yearRange = getYearRange();
  const revenueWeek = revenueInRange(bookings, weekRange.start, weekRange.end);
  const revenueMonth = revenueInRange(bookings, monthRange.start, monthRange.end);
  const revenueYear = revenueInRange(bookings, yearRange.start, yearRange.end);

  /* ── calendário ────────────────────────────────────────────────────────── */
  const calDays = useMemo(() => {
    const monthStart = startOfMonth(calMonth);
    const monthEnd = endOfMonth(calMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 0 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [calMonth]);

  const eventDatesSet = useMemo(() => {
    const set = new Set<string>();
    bookings.filter(b => b.status !== "canceled").forEach(b => set.add(b.event_date));
    return set;
  }, [bookings]);

  const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="min-h-screen bg-charcoal text-cream font-body">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-charcoal/95 backdrop-blur border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hotelLogo} alt="Logo" className="h-8 w-auto" />
          <span className="text-sm font-display text-gold/60">Admin</span>
        </div>
        <Link to="/" className="text-xs text-cream/40 hover:text-primary transition">Ver Site →</Link>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Topo */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link to="/admin" className="text-xs text-cream/40 hover:text-primary transition inline-flex items-center gap-1 mb-2">
              <ArrowLeft className="w-3 h-3" /> Dashboard
            </Link>
            <span className="text-cream/30 mx-2">/</span>
            <div className="flex items-center gap-3 mt-1">
              <PartyPopper className="w-6 h-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-cream">Salão de Festas</h1>
            </div>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm rounded-xl px-5 py-2.5 hover:scale-[1.02] transition-all shadow-lg">
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total", value: bookings.length, color: "text-cream" },
            { label: "Próximos eventos", value: upcoming, color: "text-primary" },
            { label: "Confirmados", value: bookings.filter(b => b.status === "confirmed").length, color: "text-green-400" },
            { label: "Receita semanal", value: `R$ ${revenueWeek.toFixed(0)}`, color: "text-cyan-400" },
            { label: "Receita mensal", value: `R$ ${revenueMonth.toFixed(0)}`, color: "text-primary" },
            { label: "Receita anual", value: `R$ ${revenueYear.toFixed(0)}`, color: "text-emerald-400" },
          ].map(s => (
            <div key={s.label} className="bg-charcoal-light border border-gold/10 rounded-xl p-4 text-center">
              <p className="text-[11px] text-cream/40 font-body uppercase tracking-wider">{s.label}</p>
              <p className={`text-xl font-display font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Calendário mensal ────────────────────────────────────────────── */}
        <div className="bg-charcoal-light border border-gold/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalMonth(m => addMonths(m, -1))} className="p-1.5 text-cream/40 hover:text-cream border border-gold/10 rounded-lg transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="font-display font-semibold text-cream capitalize">
              {format(calMonth, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <button onClick={() => setCalMonth(m => addMonths(m, 1))} className="p-1.5 text-cream/40 hover:text-cream border border-gold/10 rounded-lg transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-cream/40 mb-1">
            {WEEKDAY_LABELS.map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calDays.map(day => {
              const dateStr = format(day, "yyyy-MM-dd");
              const inMonth = isSameMonth(day, calMonth);
              const isToday = isSameDay(day, new Date());
              const hasEvent = eventDatesSet.has(dateStr);
              return (
                <div
                  key={dateStr}
                  className={`relative h-9 flex items-center justify-center rounded-lg text-xs transition
                    ${!inMonth ? "text-cream/15" : "text-cream/70"}
                    ${isToday ? "ring-1 ring-primary/50 font-bold text-primary" : ""}
                    ${hasEvent && inMonth ? "bg-primary/20 font-semibold text-primary" : ""}
                  `}
                >
                  {day.getDate()}
                  {hasEvent && inMonth && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
            <input
              className="w-full bg-charcoal-light border border-gold/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-cream placeholder:text-cream/30 focus:border-primary/40 focus:outline-none transition"
              placeholder="Buscar por cliente ou tipo de evento…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-charcoal-light border border-gold/10 rounded-xl px-4 py-2.5 text-sm text-cream focus:border-primary/40 focus:outline-none transition"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Lista */}
        {isLoading ? (
          <p className="text-center text-cream/40 py-16 flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Carregando agendamentos...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-cream/40 space-y-3">
            <PartyPopper className="w-10 h-10 mx-auto text-cream/20" />
            <p className="text-sm">Nenhum agendamento encontrado.</p>
            <button onClick={openCreate} className="text-primary text-sm hover:underline">Criar primeiro agendamento</button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((b, i) => {
              const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
              const payCfg = PAYMENT_STATUS_CONFIG[b.payment_status] ?? PAYMENT_STATUS_CONFIG.none;
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-charcoal-light border border-gold/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/20 transition-all">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cfg.color}`}>{cfg.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${payCfg.color}`}>{payCfg.label}</span>
                      <span className="text-xs text-cream/40">{b.event_type}</span>
                    </div>
                    <p className="font-display font-semibold text-cream">{b.client_name}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-cream/50">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{format(new Date(b.event_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.start_time} – {b.end_time}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{b.guests_count} pessoas</span>
                      {b.client_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{b.client_phone}</span>}
                      {b.client_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{b.client_email}</span>}
                    </div>
                    {b.notes && <p className="text-xs text-cream/30 italic">"{b.notes}"</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-display font-bold text-primary text-lg">R$ {Number(b.total_price).toFixed(0)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(b)} className="p-2 text-cream/40 hover:text-primary border border-gold/15 hover:border-primary/40 rounded-lg transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(b.id)} className="p-2 text-cream/40 hover:text-red-400 border border-gold/15 hover:border-red-400/40 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-charcoal border border-gold/20 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gold/10">
                <h2 className="font-display text-xl font-bold text-cream">{editing ? "Editar Agendamento" : "Novo Agendamento"}</h2>
                <button onClick={closeModal} className="text-cream/40 hover:text-cream"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="p-6 space-y-4">
                {/* Conflict error */}
                {conflictError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    Já existe um evento agendado nessa data e horário. Escolha outro horário.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-cream/50 block mb-1">Nome do cliente *</label>
                    <input className="w-full bg-charcoal-light border border-gold/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:border-primary/40 focus:outline-none" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required placeholder="Nome completo" />
                  </div>
                  <div>
                    <label className="text-xs text-cream/50 block mb-1">Telefone</label>
                    <input className="w-full bg-charcoal-light border border-gold/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:border-primary/40 focus:outline-none" value={form.client_phone ?? ""} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label className="text-xs text-cream/50 block mb-1">E-mail</label>
                    <input className="w-full bg-charcoal-light border border-gold/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:border-primary/40 focus:outline-none" value={form.client_email ?? ""} onChange={(e) => setForm({ ...form, client_email: e.target.value })} placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <label className="text-xs text-cream/50 block mb-1">Tipo de evento *</label>
                    <select className="w-full bg-charcoal-light border border-gold/10 rounded-lg px-3 py-2 text-sm text-cream focus:border-primary/40 focus:outline-none" value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
                      {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-cream/50 block mb-1">Data do evento *</label>
                    <input type="date" className="w-full bg-charcoal-light border border-gold/10 rounded-lg px-3 py-2 text-sm text-cream focus:border-primary/40 focus:outline-none" value={form.event_date} onChange={(e) => { setForm({ ...form, event_date: e.target.value }); setConflictError(false); }} required />
                  </div>
                  <div>
                    <label className="text-xs text-cream/50 block mb-1">Início</label>
                    <input type="time" className="w-full bg-charcoal-light border border-gold/10 rounded-lg px-3 py-2 text-sm text-cream focus:border-primary/40 focus:outline-none" value={form.start_time} onChange={(e) => { setForm({ ...form, start_time: e.target.value }); setConflictError(false); }} />
                  </div>
                  <div>
                    <label className="text-xs text-cream/50 block mb-1">Término</label>
                    <input type="time" className="w-full bg-charcoal-light border border-gold/10 rounded-lg px-3 py-2 text-sm text-cream focus:border-primary/40 focus:outline-none" value={form.end_time} onChange={(e) => { setForm({ ...form, end_time: e.target.value }); setConflictError(false); }} />
                  </div>
                  <div>
                    <label className="text-xs text-cream/50 block mb-1">Nº de convidados</label>
                    <input type="number" className="w-full bg-charcoal-light border border-gold/10 rounded-lg px-3 py-2 text-sm text-cream focus:border-primary/40 focus:outline-none" value={form.guests_count} onChange={(e) => setForm({ ...form, guests_count: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-cream/50 block mb-1">Valor total (R$)</label>
                    <input type="number" className="w-full bg-charcoal-light border border-gold/10 rounded-lg px-3 py-2 text-sm text-cream focus:border-primary/40 focus:outline-none" value={form.total_price} onChange={(e) => setForm({ ...form, total_price: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-cream/50 block mb-1">Status</label>
                    <select className="w-full bg-charcoal-light border border-gold/10 rounded-lg px-3 py-2 text-sm text-cream focus:border-primary/40 focus:outline-none" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-cream/50 block mb-1">Pagamento</label>
                    <select className="w-full bg-charcoal-light border border-gold/10 rounded-lg px-3 py-2 text-sm text-cream focus:border-primary/40 focus:outline-none" value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
                      {Object.entries(PAYMENT_STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-cream/50 block mb-1">Observações</label>
                    <textarea className="w-full bg-charcoal-light border border-gold/10 rounded-lg px-3 py-2 text-sm text-cream placeholder:text-cream/30 focus:border-primary/40 focus:outline-none resize-none" rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Pedidos especiais, decoração, cardápio..." />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 border border-gold/20 text-cream/60 hover:text-cream rounded-lg py-3 text-sm font-body transition-all">Cancelar</button>
                  <button type="submit" disabled={saveMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm rounded-lg py-3 hover:scale-[1.01] transition-all disabled:opacity-50">
                    {saveMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" />{editing ? "Salvar" : "Criar agendamento"}</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmar exclusão ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-charcoal border border-red-900/40 rounded-2xl p-8 max-w-sm w-full text-center">
              <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-cream mb-2">Excluir agendamento?</h3>
              <p className="text-cream/50 text-sm font-body mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gold/20 text-cream/60 rounded-lg py-2.5 text-sm transition hover:text-cream">Cancelar</button>
                <button onClick={() => deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50">
                  {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSalao;
