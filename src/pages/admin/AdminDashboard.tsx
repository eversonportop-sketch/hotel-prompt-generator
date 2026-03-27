import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BedDouble, PartyPopper, Waves, Tag, Image, Users, Settings, LayoutDashboard, UtensilsCrossed, CalendarDays, TrendingUp, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import hotelLogo from "@/assets/hotel-sb-logo.png";

const adminModules = [
  { icon: BedDouble, label: "Quartos", href: "/admin/quartos", description: "Gerenciar quartos e acomodações" },
  { icon: CalendarDays, label: "Reservas", href: "/admin/reservas", description: "Gestão de reservas" },
  { icon: PartyPopper, label: "Salão de Festas", href: "/admin/salao", description: "Gerenciar salão de eventos" },
  { icon: Waves, label: "Piscina", href: "/admin/piscina", description: "Configurações da piscina" },
  { icon: UtensilsCrossed, label: "Consumo", href: "/admin/consumo", description: "Frigobar e alimentos" },
  { icon: Tag, label: "Promoções", href: "/admin/promocoes", description: "Gerenciar promoções" },
  { icon: Image, label: "Banners", href: "/admin/banners", description: "Banners do site" },
  { icon: Users, label: "Clientes", href: "/admin/clientes", description: "Cadastro de clientes" },
  { icon: Settings, label: "Configurações", href: "/admin/configuracoes", description: "Dados do hotel" },
];

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  canceled: "Cancelada",
  completed: "Concluída",
  active: "Ativo",
  inactive: "Inativo",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-green-500/20 text-green-400",
  canceled: "bg-red-500/20 text-red-400",
  completed: "bg-blue-500/20 text-blue-400",
  active: "bg-green-500/20 text-green-400",
  inactive: "bg-red-500/20 text-red-400",
};

const today = new Date().toISOString().split("T")[0];

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

  // KPIs
  const totalRooms = rooms.length;
  const totalReservations = reservations.length;
  const todayCheckins = reservations.filter((r: any) => r.check_in === today).length;
  const totalProfiles = profiles.length;

  // Status grouping
  const roomsByStatus: Record<string, number> = {};
  rooms.forEach((r: any) => {
    roomsByStatus[r.status] = (roomsByStatus[r.status] || 0) + 1;
  });

  const reservationsByStatus: Record<string, number> = {};
  reservations.forEach((r: any) => {
    reservationsByStatus[r.status] = (reservationsByStatus[r.status] || 0) + 1;
  });

  // Today's activity
  const todayActivity = reservations.filter(
    (r: any) => r.check_in === today || r.check_out === today
  );

  const kpis = [
    { label: "Total de Quartos", value: totalRooms, icon: BedDouble },
    { label: "Total de Reservas", value: totalReservations, icon: CalendarDays },
    { label: "Check-ins Hoje", value: todayCheckins, icon: TrendingUp },
    { label: "Total de Clientes", value: totalProfiles, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Sidebar header */}
      <header className="bg-charcoal-light border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hotelLogo} alt="Hotel SB" className="h-10 w-auto object-contain" />
          <span className="text-cream/40 text-xs font-body">Admin</span>
        </div>
        <Link to="/" className="text-cream/50 text-sm font-body hover:text-primary transition-colors">
          Ver Site →
        </Link>
      </header>

      <div className="p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-8">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-cream">Dashboard</h1>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="bg-charcoal-light border border-gold/10 rounded-lg p-5 flex items-center gap-4"
              >
                <div className="bg-primary/10 rounded-lg p-3">
                  <kpi.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-cream/50 text-xs font-body">{kpi.label}</p>
                  <p className="text-cream font-display text-2xl font-bold">{kpi.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Status sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Room status */}
            <div className="bg-charcoal-light border border-gold/10 rounded-lg p-5">
              <h3 className="font-display text-sm text-cream/60 mb-3 flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-primary" /> Status dos Quartos
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(roomsByStatus).map(([status, count]) => (
                  <span key={status} className={`px-3 py-1.5 rounded-full text-xs font-body ${statusColors[status] || "bg-charcoal text-cream/50"}`}>
                    {statusLabels[status] || status}: {count}
                  </span>
                ))}
                {Object.keys(roomsByStatus).length === 0 && (
                  <span className="text-cream/30 text-xs font-body">Sem dados</span>
                )}
              </div>
            </div>

            {/* Reservation status */}
            <div className="bg-charcoal-light border border-gold/10 rounded-lg p-5">
              <h3 className="font-display text-sm text-cream/60 mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" /> Status das Reservas
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(reservationsByStatus).map(([status, count]) => (
                  <span key={status} className={`px-3 py-1.5 rounded-full text-xs font-body ${statusColors[status] || "bg-charcoal text-cream/50"}`}>
                    {statusLabels[status] || status}: {count}
                  </span>
                ))}
                {Object.keys(reservationsByStatus).length === 0 && (
                  <span className="text-cream/30 text-xs font-body">Sem dados</span>
                )}
              </div>
            </div>
          </div>

          {/* Today's activity */}
          {todayActivity.length > 0 && (
            <div className="bg-charcoal-light border border-gold/10 rounded-lg p-5 mb-8">
              <h3 className="font-display text-sm text-cream/60 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Movimentação de Hoje
              </h3>
              <div className="space-y-2">
                {todayActivity.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between text-sm font-body border-b border-gold/5 pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${r.check_in === today ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>
                        {r.check_in === today ? "IN" : "OUT"}
                      </span>
                      <span className="text-cream">{(r.profiles as any)?.full_name || "—"}</span>
                    </div>
                    <span className="text-cream/40">{(r.rooms as any)?.name || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminModules.map((mod, index) => (
              <motion.div
                key={mod.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link
                  to={mod.href}
                  className="block bg-charcoal-light border border-gold/10 rounded-lg p-6 hover:border-primary/30 transition-all duration-300 group"
                >
                  <mod.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-display text-lg text-cream mb-1">{mod.label}</h3>
                  <p className="text-cream/40 text-sm font-body">{mod.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
