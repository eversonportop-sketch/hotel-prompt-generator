import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Mail, Loader2, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import hotelLogo from "@/assets/hotel-sb-logo.png";

const STORAGE_KEY = "sb_hotel_popup_seen";
const DELAY_MS = 2500;

interface PopupConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  collect_email: boolean;
  success_message: string;
}

const DEFAULT_CONFIG: PopupConfig = {
  enabled: false,
  title: "Bem-vindo ao SB Hotel",
  subtitle: "Sleep Better",
  description: "Experiência premium em hospedagem. Conforto, elegância e sofisticação em cada detalhe.",
  button_text: "Conhecer o hotel",
  collect_email: false,
  success_message: "Obrigado! Em breve entraremos em contato.",
};

const WelcomePopup = () => {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const { data: config } = useQuery({
    queryKey: ["popup-config"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("popup_config").select("*").eq("id", 1).maybeSingle();
      return (data as PopupConfig) || DEFAULT_CONFIG;
    },
  });

  useEffect(() => {
    if (!config?.enabled) return;
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (seen) return;
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [config]);

  const close = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      await (supabase as any).from("newsletter_subscribers").insert({ email, source: "popup" });
      setDone(true);
      setTimeout(() => close(), 2500);
    } catch {
      setError("Erro ao cadastrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const cfg = config || DEFAULT_CONFIG;

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md relative overflow-hidden rounded-2xl shadow-2xl"
              style={{ background: "linear-gradient(160deg, #1a1710 0%, #0f0e0b 100%)" }}
            >
              {/* Glow */}
              <div
                className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-20"
                style={{ background: "radial-gradient(circle, #C9A84C, transparent)" }}
              />
              {/* Grid */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                }}
              />

              <button
                onClick={close}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10 p-8 text-center">
                <img src={hotelLogo} alt="SB Hotel" className="h-14 w-auto object-contain mx-auto mb-5" />

                {!done ? (
                  <>
                    {cfg.subtitle && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 mb-4">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-primary text-xs font-body tracking-widest uppercase">{cfg.subtitle}</span>
                      </div>
                    )}

                    <h2 className="font-display text-3xl font-bold text-cream mb-3 leading-tight">{cfg.title}</h2>

                    {cfg.description && (
                      <p className="text-cream/40 font-body text-sm leading-relaxed mb-6">{cfg.description}</p>
                    )}

                    {cfg.collect_email ? (
                      <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-cream text-sm placeholder:text-white/20 focus:border-primary/50 focus:outline-none transition"
                          />
                        </div>
                        {error && <p className="text-red-400 text-xs font-body">{error}</p>}
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3.5 rounded-xl font-body font-semibold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-60"
                          style={{ background: "linear-gradient(135deg, #C9A84C, #E5C97A)", color: "#0A0A0A" }}
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {loading ? "Enviando..." : cfg.button_text}
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={close}
                        className="w-full py-3.5 rounded-xl font-body font-semibold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                        style={{ background: "linear-gradient(135deg, #C9A84C, #E5C97A)", color: "#0A0A0A" }}
                      >
                        <Sparkles className="w-4 h-4" />
                        {cfg.button_text}
                      </button>
                    )}

                    <button
                      onClick={close}
                      className="mt-4 text-xs text-white/20 hover:text-white/40 font-body transition-colors"
                    >
                      Fechar
                    </button>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4">
                    <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
                    <h3 className="font-display text-2xl font-bold text-cream mb-2">Obrigado!</h3>
                    <p className="text-cream/50 font-body text-sm">{cfg.success_message}</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WelcomePopup;
