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
      color: "from-primary/20 to-primary/5",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: whatsapp,
      sub: "Fale pelo WhatsApp",
      href: `https://wa.me/55${waNum}`,
      color: "from-green-500/20 to-green-500/5",
      external: true,
    },
    {
      icon: Mail,
      label: "E-mail",
      value: email,
      sub: "Envie uma mensagem",
      href: `mailto:${email}`,
      color: "from-blue-500/20 to-blue-500/5",
    },
    {
      icon: MapPin,
      label: "Endereço",
      value: `${address}`,
      sub: city,
      href: maps,
      color: "from-red-500/20 to-red-500/5",
      external: true,
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-32 bg-charcoal overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5 blur-3xl"
          style={{ background: "radial-gradient(circle, #C9A84C, transparent)" }}
        />
        <div className="relative z-10 container-hotel text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-primary font-body text-xs tracking-[0.35em] uppercase mb-4">Entre em contato</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-cream mb-4">
              Fale <span className="text-gradient-gold">Conosco</span>
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold/40" />
              <p className="text-cream/40 font-body text-sm">Sleep Better · Butiá, RS</p>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold/40" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cards de contato */}
      <section className="py-20 bg-background">
        <div className="container-hotel max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
            {cards.map((item, i) => (
              <motion.a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative bg-card border border-border rounded-xl p-6 flex items-center gap-5 hover:border-primary/40 transition-all duration-300 overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
                <div className="relative z-10 w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="relative z-10 flex-1 min-w-0">
                  <p className="text-xs text-primary font-body tracking-[0.2em] uppercase mb-1">{item.label}</p>
                  <p className="text-foreground font-body font-medium truncate">{item.value}</p>
                  <p className="text-muted-foreground text-xs font-body mt-0.5">{item.sub}</p>
                </div>
                <ExternalLink className="relative z-10 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </motion.a>
            ))}
          </div>

          {/* Horários */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card border border-border rounded-xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground">Horários</h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <p className="text-xs text-primary font-body tracking-widest uppercase mb-2">Check-in</p>
                <p className="font-display text-3xl font-bold text-foreground">{checkin}</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <p className="text-xs text-primary font-body tracking-widest uppercase mb-2">Check-out</p>
                <p className="font-display text-3xl font-bold text-foreground">{checkout}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Contato;
