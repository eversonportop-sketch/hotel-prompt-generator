import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BedDouble, Users, LayoutDashboard, CalendarDays, LogIn, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusLabels: Record<string, string> = {
  confirmed: "Confirmada",
  checked_in: "Hospedado",
  checked_out: "Finalizada",
  canceled: "Cancelada",
};
const statusConfig: Record<string, { bg: string; dot: string; text: string }> = {
  confirmed: { bg: "bg-emerald-500/10", dot: "bg-emerald-400", text: "text-emerald-300" },
  checked_in: { bg: "bg-blue-500/10", dot: "bg-blue-400", text: "text-blue-300" },
  checked_out: { bg: "bg-gray-500/10", dot: "bg-gray-400", text: "text-gray-300" },
  canceled: { bg: "bg-red-500/10", dot: "bg-red-400", text: "text-red-300" },
};

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

const AdminDashboard = () => {
  const today = localToday();

  /* ── Quartos + ocupação ── */
  const { data: quartos = [] } = useQuery({
    queryKey: ["dash-rooms-occupancy"],
    queryFn: async () => {
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("id, name, category")
        .eq("status", "active")
        .order("display_order");
      const { data: resData } = await supabase
        .from("reservations")
        .select(
          "id, room_id, check_out, status, profile_id, client_id, profiles!reservations_profile_id_fkey(full_name)",
        )
        .eq("status", "checked_in");
      return (roomsData || []).map((room: any) => {
        const res = (resData || []).find((r: any) => r.room_id === room.id);
        return {
          ...room,
          ocupado: !!res,
          hospede: res ? (res.profiles as any)?.full_name || null : null,
          check_out: res?.check_out || null,
        };
      });
    },
  });

  /* ── Todas as reservas para KPIs e status ── */
  const { data: reservations = [] } = useQuery({
    queryKey: ["dash-reservations-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, check_in, check_out, status")
        .order("check_in");
      if (error) throw error;
      return (data || []) as { id: string; check_in: string; check_out: string; status: string }[];
    },
  });

  /* ── Contagem de clientes (profiles + guests presenciais) ── */
  const { data: totalClientes = 0 } = useQuery({
    queryKey: ["dash-clientes-total"],
    queryFn: async () => {
      const [pr, gr] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin"),
        supabase.from("guests").select("id", { count: "exact", head: true }),
      ]);
      return (pr.count || 0) + (gr.count || 0);
    },
  });

  const totalRooms = quartos.length;
  const occupiedRooms = quartos.filter((q: any) => q.ocupado).length;
  const freeRooms = totalRooms - occupiedRooms;
  const arrivingToday = reservations.filter(
    (r) => r.status === "confirmed" && r.check_in.slice(0, 10) === today,
  ).length;
  const inHouse = reservations.filter((r) => r.status === "checked_in").length;
  const departingToday = reservations.filter(
    (r) => r.status === "checked_in" && r.check_out.slice(0, 10) === today,
  ).length;

  // Só mostra status relevantes no painel (exclui canceladas para não poluir)
  const statusParaPainel = ["confirmed", "checked_in", "checked_out"];
  const reservationsByStatus: Record<string, number> = {};
  reservations
    .filter((r) => statusParaPainel.includes(r.status))
    .forEach((r) => {
      reservationsByStatus[r.status] = (reservationsByStatus[r.status] || 0) + 1;
    });

  const kpis = [
    {
      label: "Quartos Livres",
      value: freeRooms,
      total: `de ${totalRooms} total`,
      icon: BedDouble,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      href: "/admin/quartos",
    },
    {
      label: "Chegando Hoje",
      value: arrivingToday,
      total: "reservas confirmadas",
      icon: LogIn,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      href: "/admin/checkin",
    },
    {
      label: "Hospedados",
      value: inHouse,
      total: `${departingToday} saindo hoje`,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      href: "/admin/checkin",
    },
    {
      label: "Clientes",
      value: totalClientes,
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

      {/* Status Quartos + Status Reservas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          {quartos.length === 0 ? (
            <p className="text-white/20 text-sm font-body">Nenhum quarto cadastrado</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(quartos as any[]).map((q) => (
                <div
                  key={q.id}
                  className={`rounded-lg px-3 py-2.5 ${q.ocupado ? "bg-red-500/10 border border-red-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}
                >
                  <p className={`text-sm font-semibold font-body ${q.ocupado ? "text-red-300" : "text-emerald-300"}`}>
                    {q.name}
                  </p>
                  {q.ocupado ? (
                    <>
                      <p className="text-xs text-red-400/70 font-body truncate">{q.hospede || "—"}</p>
                      <p className="text-[10px] text-red-400/50 font-body">
                        Saída: {q.check_out ? q.check_out.split("-").reverse().slice(0, 2).join("/") : "—"}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-emerald-400/70 font-body">Disponível</p>
                  )}
                </div>
              ))}
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
      </div>
    </div>
  );
};

export default AdminDashboard;
