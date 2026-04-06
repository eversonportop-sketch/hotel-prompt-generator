import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wifi,
  Tv,
  Coffee,
  Clock,
  Waves,
  ScrollText,
  Phone,
  Info,
  UtensilsCrossed,
  BedDouble,
  ArrowRight,
  Star,
  CalendarDays,
  LogOut,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";

const ICON_MAP: Record<string, React.ElementType> = {
  wifi: Wifi,
  tv: Tv,
  coffee: Coffee,
  clock: Clock,
  pool: Waves,
  rules: ScrollText,
  phone: Phone,
  info: Info,
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const Portal = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["portal-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, role").eq("id", user!.id).single();
      return data;
    },
  });

  useEffect(() => {
    if (profile?.role === "admin") navigate("/admin");
  }, [profile, navigate]);

  const today = new Date().toISOString().split("T")[0];

  const { data: reservation } = useQuery({
    queryKey: ["portal-reservation", user?.id, today],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("reservations")
        .select("id, room_id, check_in, check_out, rooms(name)")
        .or(`profile_id.eq.${user!.id},client_id.eq.${user!.id}`)
        .in("status", ["pending", "confirmed", "checked_in"])
        .lte("check_in", today)
        .gte("check_out", today)
        .limit(1)
        .maybeSingle();
      if (data) return data;

      // Fallback: qualquer reserva ativa do usuário
      const { data: fallback } = await supabase
        .from("reservations")
        .select("id, room_id, check_in, check_out, rooms(name)")
        .or(`profile_id.eq.${user!.id},client_id.eq.${user!.id}`)
        .in("status", ["pending", "confirmed", "checked_in"])
        .order("check_in", { ascending: false })
        .limit(1)
        .maybeSingle();
      return fallback;
    },
  });

  const { data: infos = [] } = useQuery({
    queryKey: ["portal-hotel-info"],
    queryFn: async () => {
      const { data } = await supabase.from("hotel_info").select("*").eq("active", true).order("display_order");
      return data ?? [];
    },
  });

  if (authLoading) return null;

  const firstName = profile?.full_name?.split(" ")[0] ?? "Hóspede";
  const roomName = (reservation?.rooms as any)?.name;
  const checkin = reservation?.check_in
    ? new Date(reservation.check_in + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : null;
  const checkout = reservation?.check_out
    ? new Date(reservation.check_out + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    : null;

  return (
    <Layout>
      <div className="min-h-screen bg-charcoal">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10"
            style={{ background: "radial-gradient(circle,#C9A84C,transparent)" }}
          />

          <div className="relative container-hotel pt-28 pb-10">
            <motion.div {...fadeUp(0)} className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                  ))}
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-cream mb-1">
                  Olá, <span className="text-gradient-gold">{firstName}</span>!
                </h1>
                <p className="text-cream/40 font-body text-sm">Bem-vindo ao portal do hóspede · SB Hotel</p>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-cream/30 hover:text-cream/60 text-sm font-body transition-colors mt-2"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </motion.div>

            {/* Card reserva */}
            <motion.div {...fadeUp(0.1)} className="mt-8">
              {roomName ? (
                <div
                  className="relative overflow-hidden rounded-2xl border border-gold/20 p-6"
                  style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.12),rgba(201,168,76,0.03))" }}
                >
                  <div
                    className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10"
                    style={{ background: "radial-gradient(circle,#C9A84C,transparent)" }}
                  />
                  <div className="relative flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                        <BedDouble className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-primary/70 font-body tracking-widest uppercase">Seu quarto</p>
                        <p className="font-display text-xl font-bold text-cream">{roomName}</p>
                      </div>
                    </div>
                    {checkin && checkout && (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <CalendarDays className="w-5 h-5 text-primary/70" />
                        </div>
                        <div>
                          <p className="text-xs text-primary/70 font-body tracking-widest uppercase">Estadia</p>
                          <p className="font-body text-cream font-medium">
                            {checkin} → {checkout}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="ml-auto">
                      <span className="px-3 py-1 rounded-full text-xs font-body font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                        Check-in ativo
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-gold/10 bg-charcoal-light p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BedDouble className="w-5 h-5 text-primary/40" />
                  </div>
                  <p className="text-cream/30 font-body text-sm">Nenhuma reserva ativa no momento.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="container-hotel pb-20 space-y-10">
          {/* Cardápio CTA */}
          <motion.div {...fadeUp(0.15)}>
            <Link
              to="/cardapio"
              className="group relative overflow-hidden flex items-center justify-between p-6 rounded-2xl border border-gold/20 hover:border-primary/50 transition-all duration-300"
              style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02))" }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.04))" }}
              />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <UtensilsCrossed className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-cream">Cardápio & Pedidos</p>
                  <p className="text-cream/40 font-body text-sm">Room service direto no seu quarto</p>
                </div>
              </div>
              <ArrowRight className="relative w-5 h-5 text-primary/50 group-hover:text-primary group-hover:translate-x-1.5 transition-all duration-300" />
            </Link>
          </motion.div>

          {/* Informações */}
          {infos.length > 0 && (
            <motion.div {...fadeUp(0.2)}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
                <p className="text-xs font-body tracking-[0.25em] uppercase text-cream/30">Informações do Hotel</p>
                <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {infos.map((info: any, i: number) => {
                  const IconComp = ICON_MAP[info.icon] || Info;
                  return (
                    <motion.div key={info.id} {...fadeUp(0.22 + i * 0.05)}>
                      <div className="group flex items-start gap-4 p-5 rounded-2xl bg-charcoal-light border border-white/5 hover:border-gold/20 transition-all duration-300">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <IconComp className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-cream font-body mb-1">{info.title}</p>
                          <p className="text-xs text-cream/40 whitespace-pre-line font-body leading-relaxed">
                            {info.content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <motion.div {...fadeUp(0.35)} className="text-center pt-6 border-t border-white/5">
            <p className="text-cream/15 font-body text-xs tracking-widest uppercase">
              SB Hotel · Sleep Better · Butiá, RS
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Portal;
