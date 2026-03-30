import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BedDouble,
  Users,
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  Clock,
  LogIn,
  LogOut,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  canceled: "Cancelada",
  completed: "Concluída",
  active: "Ativo",
  inactive: "Inativo",
};
const statusConfig: Record<string, { bg: string; dot: string; text: string }> = {
  pending: { bg: "bg-amber-500/10", dot: "bg-amber-400", text: "text-amber-300" },
  confirmed: { bg: "bg-emerald-500/10", dot: "bg-emerald-400", text: "text-emerald-300" },
  canceled: { bg: "bg-red-500/10", dot: "bg-red-400", text: "text-red-300" },
  completed: { bg: "bg-sky-500/10", dot: "bg-sky-400", text: "text-sky-300" },
  active: { bg: "bg-emerald-500/10", dot: "bg-emerald-400", text: "text-emerald-300" },
  inactive: { bg: "bg-red-500/10", dot: "bg-red-400", text: "text-red-300" },
};

const today = new Date().toISOString().split("T")[0];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

function formatDateFull(date: Date) {
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}
function formatDateShort(date: Date) {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${date.getDate().toString().padStart(2, "0")} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

const AdminDashboard = () => {
  const { data: rooms = [] } = useQuery({
    queryKey: ["dash-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("id, status");
      if (error) throw error;
      return data;
    },
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["dash-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, status, check_in, check_out, rooms(name), profiles(full_name)");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["dash-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id");
      if (error) throw error;
      return data;
    },
  });

  const totalRooms = rooms.length;
  const activeRooms = (rooms as any[]).filter((r) => r.status === "active").length;
  const totalReservations = reservations.length;
  const confirmedReservations = (reservations as any[]).filter((r) => r.status === "confirmed").length;
  const todayCheckins = (reservations as any[]).filter((r) => r.check_in === today).length;
  const todayCheckouts = (reservations as any[]).filter((r) => r.check_out === today).length;
  const totalProfiles = profiles.length;

  const roomsByStatus: Record<string, number> = {};
  (rooms as any[]).forEach((r) => {
    roomsByStatus[r.status] = (roomsByStatus[r.status] || 0) + 1;
  });

  const reservationsByStatus: Record<string, number> = {};
  (reservations as any[]).forEach((r) => {
    reservationsByStatus[r.status] = (reservationsByStatus[r.status] || 0) + 1;
  });

  const todayActivity = (reservations as any[]).filter((r) => r.check_in === today || r.check_out === today);

  const kpis = [
    {
      label: "Quartos Ativos",
      value: activeRooms,
      total: `de ${totalRooms} total`,
      icon: BedDouble,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      href: "/admin/quartos",
    },
    {
      label: "Reservas",
      value: totalReservations,
      total: `${confirmedReservations} confirmadas`,
      icon: CalendarDays,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      href: "/admin/reservas",
    },
    {
      label: "Movimento Hoje",
      value: todayCheckins + todayCheckouts,
      total: `${todayCheckins} in · ${todayCheckouts} out`,
      icon: TrendingUp,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      href: "/admin/checkin",
    },
    {
      label: "Clientes",
      value: totalProfiles,
      total: "cadastrados",
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      href: "/admin/clientes",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 text-cream">
      {/* Cabeçalho */}
      <motion.div {...fadeUp(0)} className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/15">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-cream leading-none">Dashboard</h1>
            <p className="text-white/30 text-xs mt-0.5 font-body">{formatDateFull(new Date())}</p>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp(0.05 * i)}>
            <Link
              to={kpi.href}
              className={`block relative overflow-hidden rounded-xl bg-charcoal-light border ${kpi.border} p-5 hover:brightness-110 transition-all duration-200 group`}
            >
              <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-4`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className={`font-display text-4xl font-bold mb-1 tabular-nums ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs font-semibold text-white/60 tracking-wide font-body">{kpi.label}</p>
              <p className="text-xs text-white/25 mt-0.5 font-body">{kpi.total}</p>
              <ArrowRight className="absolute top-4 right-4 w-3.5 h-3.5 text-white/10 group-hover:text-white/30 transition-colors" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Status + Movimentação */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Quartos */}
        <motion.div {...fadeUp(0.2)} className="rounded-xl bg-charcoal-light border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BedDouble className="w-3.5 h-3.5 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30 font-body">
                Status dos Quartos
              </h3>
            </div>
            <Link
              to="/admin/quartos"
              className="text-[10px] text-primary/50 hover:text-primary font-body transition-colors"
            >
              Ver todos →
            </Link>
          </div>
          {Object.keys(roomsByStatus).length === 0 ? (
            <p className="text-white/20 text-sm font-body">Nenhum quarto cadastrado</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(roomsByStatus).map(([status, count]) => {
                const cfg = statusConfig[status] || { bg: "bg-white/5", dot: "bg-white/30", text: "text-white/50" };
                return (
                  <div key={status} className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${cfg.bg}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span className={`text-sm font-body ${cfg.text}`}>{statusLabels[status] || status}</span>
                    </div>
                    <span className={`text-sm font-bold font-body ${cfg.text}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Status Reservas */}
        <motion.div {...fadeUp(0.24)} className="rounded-xl bg-charcoal-light border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30 font-body">
                Status das Reservas
              </h3>
            </div>
            <Link
              to="/admin/reservas"
              className="text-[10px] text-primary/50 hover:text-primary font-body transition-colors"
            >
              Ver todas →
            </Link>
          </div>
          {Object.keys(reservationsByStatus).length === 0 ? (
            <p className="text-white/20 text-sm font-body">Nenhuma reserva encontrada</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(reservationsByStatus).map(([status, count]) => {
                const cfg = statusConfig[status] || { bg: "bg-white/5", dot: "bg-white/30", text: "text-white/50" };
                return (
                  <div key={status} className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${cfg.bg}`}>
                    <div className="flex items-center gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span className={`text-sm font-body ${cfg.text}`}>{statusLabels[status] || status}</span>
                    </div>
                    <span className={`text-sm font-bold font-body ${cfg.text}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Movimentação Hoje */}
        <motion.div {...fadeUp(0.28)} className="rounded-xl bg-charcoal-light border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/30 font-body">
              Movimentação Hoje · {formatDateShort(new Date())}
            </h3>
          </div>

          {/* mini contadores */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-emerald-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <p className="text-emerald-400 font-bold text-lg font-display leading-none">{todayCheckins}</p>
                <p className="text-emerald-400/60 text-[10px] font-body">Check-ins</p>
              </div>
            </div>
            <div className="bg-sky-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5 text-sky-400" />
              <div>
                <p className="text-sky-400 font-bold text-lg font-display leading-none">{todayCheckouts}</p>
                <p className="text-sky-400/60 text-[10px] font-body">Checkouts</p>
              </div>
            </div>
          </div>

          {todayActivity.length === 0 ? (
            <p className="text-white/20 text-sm font-body text-center py-2">Nenhuma movimentação hoje</p>
          ) : (
            <div className="space-y-2">
              {todayActivity.slice(0, 4).map((r: any) => {
                const isIn = r.check_in === today;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold font-body ${isIn ? "bg-emerald-500/15 text-emerald-400" : "bg-sky-500/15 text-sky-400"}`}
                      >
                        {isIn ? <LogIn className="w-2.5 h-2.5" /> : <LogOut className="w-2.5 h-2.5" />}
                        {isIn ? "IN" : "OUT"}
                      </span>
                      <span className="text-sm text-cream/70 font-body truncate max-w-[100px]">
                        {r.profiles?.full_name || "—"}
                      </span>
                    </div>
                    <span className="text-xs text-white/30 font-body">{r.rooms?.name || "—"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

    </div>
  );
};

export default AdminDashboard;
