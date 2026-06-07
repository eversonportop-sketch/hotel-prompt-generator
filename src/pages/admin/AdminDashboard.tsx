import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BedDouble, Users, LayoutDashboard, CalendarDays, LogIn, ArrowRight, Sparkles, QrCode } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const qc = useQueryClient();

  const marcarLimpoMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase
        .from("rooms")
        .update({ needs_cleaning: false } as any)
        .eq("id", roomId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dash-rooms-occupancy"] });
    },
  });

  const { data: quartos = [] } = useQuery({
    queryKey: ["dash-rooms-occupancy"],
    queryFn: async () => {
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("id, name, category, needs_cleaning")
        .eq("status", "active")
        .order("name");
      const { data: resData } = await supabase
        .from("reservations")
        .select(
          "id, room_id, check_out, status, profile_id, guest_id, guests_count, notes, profiles!reservations_profile_id_fkey(full_name), guests!reservations_guest_id_fkey(full_name)",
        )
        .eq("status", "checked_in");
      return (roomsData || []).map((room: any) => {
        const res = (resData || []).find((r: any) => r.room_id === room.id);
        // Extrair crianças das notes (ex: "Crianças: 2 (idades: 4, 8 anos) · grátis")
        let childrenInfo: string | null = null;
        if (res?.notes) {
          const match = res.notes.match(/Crianças:\s*(\d+)\s*\(([^)]+)\)\s*·\s*(\w+)/);
          if (match) childrenInfo = `${match[1]} criança${Number(match[1]) > 1 ? "s" : ""} (${match[2]}) · ${match[3]}`;
        }
        const guestName = res ? ((res.profiles as any)?.full_name || (res.guests as any)?.full_name || null) : null;
        return {
          ...room,
          ocupado: !!res,
          needs_cleaning: !!room.needs_cleaning,
          hospede: guestName,
          check_out: res?.check_out || null,
          guests_count: res?.guests_count || null,
          childrenInfo,
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

  /* ── PIX pendente ── */
  const { data: pixPendente = 0 } = useQuery({
    queryKey: ["dash-pix-pendente"],
    queryFn: async () => {
      const { count } = await supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_payment");
      return count || 0;
    },
    refetchInterval: 30000,
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
  ];

  const pixKpi = {
    label: "PIX Pendente",
    value: pixPendente,
    total: "aguardando confirmação",
    icon: QrCode,
    color: pixPendente > 0 ? "text-amber-400" : "text-cream/30",
    bg: pixPendente > 0 ? "bg-amber-500/10" : "bg-white/5",
    border: pixPendente > 0 ? "border-amber-500/30" : "border-white/5",
    href: "/admin/pix",
    pulse: pixPendente > 0,
  };

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
        {[...kpis, pixKpi].map((kpi, i) => (
          <motion.div key={kpi.label} {...fadeUp(0.05 * i)}>
            <Link
              to={kpi.href}
              className={`block relative overflow-hidden rounded-xl bg-charcoal-light border ${kpi.border} p-5 hover:brightness-110 transition-all duration-200 group ${"pulse" in kpi && kpi.pulse ? "ring-1 ring-amber-500/30" : ""}`}
            >
              <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-4`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className={`font-display text-4xl font-bold mb-1 tabular-nums ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs font-semibold text-white/60 tracking-wide font-body">{kpi.label}</p>
              <ArrowRight className="absolute top-4 right-4 w-3.5 h-3.5 text-white/10 group-hover:text-white/30 transition-colors" />
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Status Quartos */}
      <div className="grid grid-cols-1 gap-4">
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
              {(quartos as any[]).map((q) => {
                const isOcupado = q.ocupado;
                const isLimpeza = !q.ocupado && q.needs_cleaning;
                const isDisponivel = !q.ocupado && !q.needs_cleaning;
                return (
                  <div
                    key={q.id}
                    className={`rounded-lg px-3 py-2.5 border transition-all ${
                      isOcupado
                        ? "bg-red-500/10 border-red-500/20"
                        : isLimpeza
                        ? "bg-amber-500/10 border-amber-500/20"
                        : "bg-emerald-500/10 border-emerald-500/20"
                    }`}
                  >
                    <p className={`text-sm font-semibold font-body ${
                      isOcupado ? "text-red-300" : isLimpeza ? "text-amber-300" : "text-emerald-300"
                    }`}>
                      {q.name}
                    </p>
                    {isOcupado && (
                      <>
                        <p className="text-xs text-red-400/70 font-body truncate">{q.hospede || "—"}</p>
                        {q.guests_count && (
                          <p className="text-[10px] text-red-400/50 font-body mt-0.5">
                            👤 {q.guests_count} adulto{q.guests_count > 1 ? "s" : ""}
                            {q.childrenInfo ? ` · 🧒 ${q.childrenInfo}` : ""}
                          </p>
                        )}
                        <p className="text-[10px] text-red-400/50 font-body">
                          Saída: {q.check_out ? q.check_out.split("-").reverse().slice(0, 2).join("/") : "—"}
                        </p>
                      </>
                    )}
                    {isLimpeza && (
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-amber-400/70 font-body flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Em limpeza
                        </p>
                        <button
                          onClick={() => marcarLimpoMutation.mutate(q.id)}
                          disabled={marcarLimpoMutation.isPending}
                          className="text-[10px] text-amber-400 hover:text-emerald-400 border border-amber-500/30 hover:border-emerald-500/30 rounded px-1.5 py-0.5 font-body transition-colors"
                        >
                          Liberar ✓
                        </button>
                      </div>
                    )}
                    {isDisponivel && (
                      <p className="text-xs text-emerald-400/70 font-body">Disponível</p>
                    )}
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
