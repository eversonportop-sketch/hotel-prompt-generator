import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, MessageCircle, Clock, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const useSettings = () =>
  useQuery({
    queryKey: ["hotel_settings"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("hotel_settings").select("key, value");
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => {
        map[r.key] = r.value ?? "";
      });
      return map;
    },
    staleTime: 1000 * 60 * 5,
  });

const Contato = () => {
  const { data: s = {} } = useSettings();
  const phone = s.phone || "(00) 0000-0000";
  const whatsapp = s.whatsapp || s.phone || "(00) 00000-0000";
  const email = s.email || "contato@sbhotel.com";
  const address = s.address || "Endereço do Hotel";
  const city = s.city || "Butiá - RS";
  const maps = s.google_maps_url || "#";
  const checkin = s.check_in_time || "14:00";
  const checkout = s.check_out_time || "12:00";
  const waNum = whatsapp.replace(/\D/g, "");

  const cards = [
    {
      icon: Phone,
      label: "Telefone",
      value: phone,
      sub: "Ligue para nós",
      href: `tel:${phone.replace(/\D/g, "")}`,
      accent: "from-primary/20 to-primary/5 border-primary/20",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: whatsapp,
      sub: "Fale pelo WhatsApp",
      href: `https://wa.me/55${waNum}`,
      external: true,
      accent: "from-green-500/15 to-green-500/5 border-green-500/20",
    },
    {
      icon: Mail,
      label: "E-mail",
      value: email,
      sub: "Envie uma mensagem",
      href: `mailto:${email}`,
      accent: "from-blue-500/15 to-blue-500/5 border-blue-500/20",
    },
    {
      icon: MapPin,
      label: "Endereço",
      value: address,
      sub: city,
      href: maps,
      external: true,
      accent: "from-red-500/15 to-red-500/5 border-red-500/20",
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-36 bg-charcoal overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-5"
          style={{ background: "radial-gradient(circle,#C9A84C,transparent)" }}
        />
        <div className="relative z-10 container-hotel text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-primary font-body text-xs tracking-[0.4em] uppercase mb-5">Entre em contato</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-cream mb-6">
              Fale <span className="text-gradient-gold">Conosco</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-20 bg-gradient-to-r from-transparent to-gold/40" />
              <p className="text-cream/30 font-body text-sm tracking-widest">Sleep Better · Butiá, RS</p>
              <div className="h-px w-20 bg-gradient-to-l from-transparent to-gold/40" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cards */}
      <section className="py-20 bg-charcoal">
        <div className="container-hotel max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {cards.map((item, i) => (
              <motion.a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`group relative overflow-hidden bg-charcoal-light border rounded-2xl p-6 flex items-center gap-5 hover:scale-[1.01] transition-all duration-300 ${item.accent}`}
                style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0))" }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
                <div className="relative z-10 w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="relative z-10 flex-1 min-w-0">
                  <p className="text-xs text-primary font-body tracking-[0.2em] uppercase mb-1">{item.label}</p>
                  <p className="text-cream font-body font-medium truncate">{item.value}</p>
                  <p className="text-cream/40 text-xs font-body mt-0.5">{item.sub}</p>
                </div>
                <ExternalLink className="relative z-10 w-4 h-4 text-cream/20 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </motion.a>
            ))}
          </div>

          {/* Horários */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl border border-gold/15 p-8"
            style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.07),rgba(201,168,76,0.02))" }}
          >
            <div
              className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10"
              style={{ background: "radial-gradient(circle,#C9A84C,transparent)" }}
            />
            <div className="relative flex items-center gap-3 mb-7">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display text-xl font-semibold text-cream">Horários</h2>
            </div>
            <div className="relative grid grid-cols-2 gap-5">
              {[
                { label: "Check-in", time: checkin },
                { label: "Check-out", time: checkout },
              ].map((h) => (
                <div key={h.label} className="text-center p-5 rounded-xl bg-charcoal-light border border-white/5">
                  <p className="text-xs text-primary font-body tracking-widest uppercase mb-2">{h.label}</p>
                  <p className="font-display text-4xl font-bold text-cream">{h.time}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Contato;
