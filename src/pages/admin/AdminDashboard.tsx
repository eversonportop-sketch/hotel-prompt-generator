import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BedDouble,
  Info,
  PartyPopper,
  Waves,
  Tag,
  Image,
  Users,
  Settings,
  Sparkles,
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  TrendingUp,
  Clock,
  ArrowRight,
  LogIn,
  LogOut,
  Receipt,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const adminModules = [
  {
    icon: CalendarDays,
    label: "Reservas",
    href: "/admin/reservas",
    description: "Gestão de reservas",
    color: "from-emerald-900/30 to-emerald-800/10",
    group: "Operacional",
  },
  {
    icon: LogIn,
    label: "Check-in",
    href: "/admin/checkin",
    description: "Registrar entradas",
    color: "from-sky-900/30 to-sky-800/10",
    group: "Operacional",
  },
  {
    icon: Receipt,
    label: "Checkout",
    href: "/admin/checkout",
    description: "Fechar conta do hóspede",
    color: "from-green-900/30 to-green-800/10",
    group: "Operacional",
  },
  {
    icon: UtensilsCrossed,
    label: "Consumo",
    href: "/admin/consumo",
    description: "Frigobar e room service",
    color: "from-rose-900/30 to-rose-800/10",
    group: "Operacional",
  },
  {
    icon: BedDouble,
    label: "Quartos",
    href: "/admin/quartos",
    description: "Gerenciar acomodações",
    color: "from-amber-900/30 to-amber-800/10",
    group: "Gestão",
  },
  {
    icon: Users,
    label: "Clientes",
    href: "/admin/clientes",
    description: "Cadastro de clientes",
    color: "from-teal-900/30 to-teal-800/10",
    group: "Gestão",
  },
  {
    icon: Waves,
    label: "Piscina",
    href: "/admin/piscina",
    description: "Configurações da piscina",
    color: "from-cyan-900/30 to-cyan-800/10",
    group: "Gestão",
  },
  {
    icon: PartyPopper,
    label: "Salão",
    href: "/admin/salao",
    description: "Gerenciar salão de eventos",
    color: "from-purple-900/30 to-purple-800/10",
    group: "Gestão",
  },
  {
    icon: Tag,
    label: "Promoções",
    href: "/admin/promocoes",
    description: "Gerenciar promoções",
    color: "from-orange-900/30 to-orange-800/10",
    group: "Conteúdo",
  },
  {
    icon: Image,
    label: "Banners",
    href: "/admin/banners",
    description: "Banners do site",
    color: "from-indigo-900/30 to-indigo-800/10",
    group: "Conteúdo",
  },
  {
    icon: Image,
    label: "Mídia",
    href: "/admin/midia",
    description: "Galeria de imagens",
    color: "from-pink-900/30 to-pink-800/10",
    group: "Conteúdo",
  },
  {
    icon: Info,
    label: "Informações",
    href: "/admin/informacoes",
    description: "Dados úteis para hóspedes",
    color: "from-yellow-900/30 to-yellow-800/10",
    group: "Conteúdo",
  },
  {
    icon: Settings,
    label: "Configurações",
    href: "/admin/configuracoes",
    description: "Dados do hotel",
    color: "from-slate-900/30 to-slate-800/10",
    group: "Conteúdo",
  },
  {
    icon: Sparkles,
    label: "Popup",
    href: "/admin/popup",
    description: "Gerenciar popups do site",
    color: "from-fuchsia-900/30 to-fuchsia-800/10",
    group: "Conteúdo",
  },
];

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
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

function formatDateShort(date: Date): string {
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
        .select("id, status, check_in, check_out, room_id, rooms(name), profiles(full_name)");
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
  const totalReservations = reservations.length;
  const todayCheckins = reservations.filter((r: any) => r.check_in === today).length;
  const totalProfiles = profiles.length;

  const roomsByStatus: Record<string, number> = {};
  rooms.forEach((r: any) => {
    roomsByStatus[r.status] = (roomsByStatus[r.status] || 0) + 1;
  });

  const reservationsByStatus: Record<string, number> = {};
  reservations.forEach((r: any) => {
    reservationsByStatus[r.status] = (reservationsByStatus[r.status] || 0) + 1;
  });

  const todayActivity = reservations.filter((r: any) => r.check_in === today || r.check_out === today);

  const kpis = [
    {
      label: "Quartos",
      value: totalRooms,
      icon: BedDouble,
      sub: "Total cadastrados",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Reservas",
      value: totalReservations,
      icon: CalendarDays,
      sub: "Total de reservas",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Check-ins Hoje",
      value: todayCheckins,
      icon: TrendingUp,
      sub: formatDateShort(new Date()),
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      label: "Clientes",
      value: totalProfiles,
      icon: Users,
      sub: "Clientes cadastrados",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 text-cream">
      {/* Título */}
      <motion.div {...fadeUp(0)} className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/15">
          <LayoutDashboard className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-cream leading-none">Dashboard</h1>
          <p className="text-white/30 text-xs mt-0.5 font-body">Visão geral do hotel</p>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp(0.06 * i)}>
            <div className="relative overflow-hidden rounded-xl bg-charcoal-light border border-white/5 p-5 hover:border-white/10 transition-all duration-300 cursor-default">
              <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-4`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className={`font-display text-4xl font-bold mb-1 tabular-nums ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs font-semibold text-white/60 tracking-wide font-body">{kpi.label}</p>
              <p className="text-xs text-white/25 mt-0.5 font-body">{kpi.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Status + Movimentação */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quartos */}
        <motion.div {...fadeUp(0.18)} className="rounded-xl bg-charcoal-light border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BedDouble className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/35 font-body">
              Status dos Quartos
            </h3>
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

        {/* Reservas */}
        <motion.div {...fadeUp(0.22)} className="rounded-xl bg-charcoal-light border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/35 font-body">
              Status das Reservas
            </h3>
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

        {/* Movimentação */}
        <motion.div {...fadeUp(0.26)} className="rounded-xl bg-charcoal-light border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/35 font-body">
              Movimentação Hoje
            </h3>
          </div>
          {todayActivity.length === 0 ? (
            <div className="flex items-center justify-center h-16">
              <p className="text-white/20 text-sm font-body">Nenhuma movimentação hoje</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayActivity.slice(0, 5).map((r: any) => {
                const isIn = r.check_in === today;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold font-body ${isIn ? "bg-emerald-500/15 text-emerald-400" : "bg-sky-500/15 text-sky-400"}`}
                      >
                        {isIn ? <LogIn className="w-2.5 h-2.5" /> : <LogOut className="w-2.5 h-2.5" />}
                        {isIn ? "IN" : "OUT"}
                      </span>
                      <span className="text-sm text-cream/70 font-body truncate max-w-[120px]">
                        {(r.profiles as any)?.full_name || "—"}
                      </span>
                    </div>
                    <span className="text-xs text-white/30 font-body">{(r.rooms as any)?.name || "—"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Módulos por grupo */}
      {(["Operacional", "Gestão", "Conteúdo"] as const).map((group, gi) => {
        const groupMods = adminModules.filter((m) => m.group === group);
        return (
          <motion.div key={group} {...fadeUp(0.3 + gi * 0.08)}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/25 font-body mb-3">{group}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {groupMods.map((mod, index) => (
                <motion.div key={mod.label} {...fadeUp(0.3 + gi * 0.08 + index * 0.04)}>
                  <Link
                    to={mod.href}
                    className="flex flex-col gap-3 p-4 rounded-xl bg-charcoal-light border border-white/5 hover:border-primary/25 transition-all duration-200 group relative overflow-hidden"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${mod.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />
                    <div className="relative">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        <mod.icon className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-cream leading-tight font-body">{mod.label}</p>
                      <p className="text-xs text-white/30 mt-0.5 leading-snug font-body">{mod.description}</p>
                    </div>
                    <div className="relative flex items-center gap-1 text-xs text-primary/40 group-hover:text-primary transition-colors font-body">
                      <span>Acessar</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default AdminDashboard;
