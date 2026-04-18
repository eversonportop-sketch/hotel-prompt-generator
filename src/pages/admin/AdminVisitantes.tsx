import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Eye, CalendarDays, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const AdminVisitantes = () => {
  // Registra visita ao montar
  useEffect(() => {
    supabase
      .from("page_views" as any)
      .insert({
        page: window.location.pathname,
        user_agent: navigator.userAgent,
      })
      .then(() => {});
  }, []);

  const { data: views = [] } = useQuery({
    queryKey: ["admin-page-views"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from("page_views" as any)
        .select("id, created_at, page")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  const { hoje, semana, mes, chartData } = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let h = 0,
      s = 0,
      m = 0;
    const buckets: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }

    for (const v of views) {
      const dt = new Date(v.created_at);
      if (dt >= today) h++;
      if (dt >= weekAgo) s++;
      if (dt >= monthStart) m++;
      const key = dt.toISOString().slice(0, 10);
      if (key in buckets) buckets[key]++;
    }

    const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const chart = Object.entries(buckets).map(([date, total]) => {
      const d = new Date(date + "T00:00:00");
      return {
        dia: `${labels[d.getDay()]} ${d.getDate()}`,
        visitas: total,
      };
    });

    return { hoje: h, semana: s, mes: m, chartData: chart };
  }, [views]);

  const cards = [
    { label: "Hoje", value: hoje, icon: Eye, delay: 0 },
    { label: "Esta semana", value: semana, icon: CalendarDays, delay: 0.05 },
    { label: "Este mês", value: mes, icon: TrendingUp, delay: 0.1 },
  ];

  return (
    <div className="min-h-screen bg-charcoal text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <motion.div {...fadeUp(0)} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-white/40 font-body">
              Analytics
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-display font-semibold text-cream">
            Visitantes
          </h1>
          <p className="text-white/40 font-body text-sm mt-2">
            Acompanhe o tráfego do seu site em tempo real.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {cards.map((c) => (
            <motion.div
              key={c.label}
              {...fadeUp(c.delay)}
              className="bg-charcoal-light border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-body">
                  {c.label}
                </span>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <c.icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-4xl font-display font-semibold text-cream">{c.value}</p>
              <p className="text-xs text-white/30 font-body mt-1">visitas registradas</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          {...fadeUp(0.15)}
          className="bg-charcoal-light border border-white/5 rounded-2xl p-6"
        >
          <div className="mb-6">
            <h2 className="text-lg font-display font-semibold text-cream">Últimos 7 dias</h2>
            <p className="text-xs text-white/40 font-body mt-1">Visitas diárias</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="dia"
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.4)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{
                    background: "hsl(var(--charcoal-light, 220 14% 12%))",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminVisitantes;
