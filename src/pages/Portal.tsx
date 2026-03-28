import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wifi, Tv, Coffee, Clock, Waves, ScrollText, Phone, Info,
  UtensilsCrossed, BedDouble, ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";

const ICON_MAP: Record<string, React.ElementType> = {
  wifi: Wifi, tv: Tv, coffee: Coffee, clock: Clock,
  pool: Waves, rules: ScrollText, phone: Phone, info: Info,
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const Portal = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  /* redirect if not logged in */
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  /* profile */
  const { data: profile } = useQuery({
    queryKey: ["portal-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user!.id)
        .single();
      return data;
    },
  });

  /* redirect admin */
  useEffect(() => {
    if (profile?.role === "admin") navigate("/admin");
  }, [profile, navigate]);

  /* active reservation → room */
  const today = new Date().toISOString().split("T")[0];
  const { data: reservation } = useQuery({
    queryKey: ["portal-reservation", user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("reservations")
        .select("id, room_id, check_in, check_out, rooms(name)")
        .eq("client_id", user!.id)
        .in("status", ["pending", "confirmed"])
        .lte("check_in", today)
        .gte("check_out", today)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  /* hotel info */
  const { data: infos = [] } = useQuery({
    queryKey: ["portal-hotel-info"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hotel_info")
        .select("*")
        .eq("active", true)
        .order("display_order");
      return data ?? [];
    },
  });

  if (authLoading) return null;

  const firstName = profile?.full_name?.split(" ")[0] ?? "Hóspede";
  const roomName = (reservation?.rooms as any)?.name;

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* greeting */}
          <motion.div {...fadeUp(0)}>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-cream">
              Olá, <span className="text-gradient-gold">{firstName}</span>!
            </h1>
            {roomName ? (
              <div className="flex items-center gap-2 mt-2">
                <BedDouble className="w-4 h-4 text-primary" />
                <p className="text-sm text-cream/50 font-body">
                  Hospedado no <span className="text-cream/80 font-semibold">{roomName}</span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-cream/40 font-body mt-2">
                Nenhuma reserva ativa encontrada no momento.
              </p>
            )}
          </motion.div>

          {/* cardápio CTA */}
          <motion.div {...fadeUp(0.08)}>
            <Link
              to="/cardapio"
              className="flex items-center justify-between p-5 rounded-xl bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-primary/20 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-cream font-body">Cardápio & Pedidos</p>
                  <p className="text-xs text-cream/40 font-body">Peça direto do seu quarto</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-primary/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          </motion.div>

          {/* hotel info cards */}
          {infos.length > 0 && (
            <motion.div {...fadeUp(0.14)}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-cream/30 font-body mb-4">
                Informações do Hotel
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {infos.map((info: any, i: number) => {
                  const IconComp = ICON_MAP[info.icon] || Info;
                  return (
                    <motion.div key={info.id} {...fadeUp(0.16 + i * 0.04)}>
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-charcoal-light border border-white/5">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconComp className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-cream font-body">{info.title}</p>
                          <p className="text-xs text-cream/40 mt-0.5 whitespace-pre-line font-body">{info.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Portal;
