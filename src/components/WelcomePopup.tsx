import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const WelcomePopup = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: config } = useQuery({
    queryKey: ["popup-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popup_config")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!config?.enabled) return;
    const dismissed = sessionStorage.getItem("sb_popup_dismissed");
    if (dismissed) return;
    const timer = setTimeout(() => setOpen(true), 2000);
    return () => clearTimeout(timer);
  }, [config]);

  const close = () => {
    setOpen(false);
    sessionStorage.setItem("sb_popup_dismissed", "1");
  };

  if (!config?.enabled) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-primary/20 bg-charcoal p-8 shadow-[0_0_60px_rgba(201,168,76,0.15)]"
          >
            <button onClick={close} className="absolute top-4 right-4 text-cream/30 hover:text-cream transition-colors">
              <X className="w-5 h-5" />
            </button>

            {submitted ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-cream font-display text-lg">
                  {config.success_message || "Obrigado!"}
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                  {config.title && (
                    <h2 className="font-display text-2xl font-bold text-cream mb-1">
                      {config.title}
                    </h2>
                  )}
                  {config.subtitle && (
                    <p className="text-primary/80 text-sm font-body">{config.subtitle}</p>
                  )}
                  {config.description && (
                    <p className="text-cream/50 text-sm font-body mt-3">{config.description}</p>
                  )}
                </div>

                {config.collect_email ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!email.trim()) return;
                      setSubmitted(true);
                      toast.success(config.success_message || "Obrigado!");
                      setTimeout(close, 2500);
                    }}
                    className="space-y-3"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Seu melhor e-mail"
                      required
                      className="w-full rounded-xl border border-primary/20 bg-charcoal-light px-4 py-3 text-sm text-cream placeholder:text-cream/30 font-body focus:outline-none focus:border-primary/50 transition-colors"
                    />
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold font-body transition-all hover:scale-[1.01]"
                      style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)", color: "#000" }}
                    >
                      <Send className="w-4 h-4" />
                      {config.button_text || "Enviar"}
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={close}
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold font-body transition-all hover:scale-[1.01]"
                    style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)", color: "#000" }}
                  >
                    {config.button_text || "Entendi"}
                  </button>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomePopup;
