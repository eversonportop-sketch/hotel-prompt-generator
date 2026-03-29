import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Save, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

interface PopupConfig {
  id: number;
  enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  collect_email: boolean;
  success_message: string;
}

const DEFAULT: Omit<PopupConfig, "id"> = {
  enabled: false,
  title: "Bem-vindo ao SB Hotel",
  subtitle: "Sleep Better",
  description: "Experiência premium em hospedagem. Conforto, elegância e sofisticação em cada detalhe.",
  button_text: "Conhecer o hotel",
  collect_email: false,
  success_message: "Obrigado! Em breve entraremos em contato.",
};

const AdminPopup = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState(DEFAULT);
  const [saved, setSaved] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["popup-config"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("popup_config").select("*").eq("id", 1).maybeSingle();
      return data as PopupConfig | null;
    },
  });

  useEffect(() => {
    if (config) setForm(config);
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: existing } = await (supabase as any).from("popup_config").select("id").eq("id", 1).maybeSingle();

      if (existing) {
        const { error } = await (supabase as any).from("popup_config").update(form).eq("id", 1);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("popup_config").insert({ ...form, id: 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["popup-config"] });
      setSaved(true);
      toast.success("Popup salvo com sucesso!");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: () => toast.error("Erro ao salvar. Verifique se a tabela popup_config existe no Supabase."),
  });

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5 font-body">{label}</label>
      {children}
    </div>
  );

  const inputClass =
    "w-full bg-black/40 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm placeholder:text-white/20 focus:border-primary/50 focus:outline-none transition font-body";

  return (
    <div className="min-h-screen bg-charcoal">
      <header className="bg-charcoal-light border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hotelLogo} alt="SB Hotel" className="h-10 w-auto object-contain" />
          <span className="text-cream/40 text-xs font-body">Admin</span>
        </div>
        <Link to="/" className="text-cream/50 text-sm font-body hover:text-primary transition-colors">
          Ver Site →
        </Link>
      </header>

      <div className="p-6 md:p-10 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-cream/50 hover:text-primary text-sm font-body transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-cream/20">/</span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="font-display text-2xl font-bold text-cream">Popup de Boas-vindas</h1>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Ativar/desativar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border p-5 flex items-center justify-between transition-all ${
                form.enabled ? "bg-emerald-500/10 border-emerald-500/30" : "bg-charcoal-light border-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                {form.enabled ? (
                  <Eye className="w-5 h-5 text-emerald-400" />
                ) : (
                  <EyeOff className="w-5 h-5 text-white/30" />
                )}
                <div>
                  <p className="text-sm font-semibold text-cream font-body">
                    {form.enabled ? "Popup ativado" : "Popup desativado"}
                  </p>
                  <p className="text-xs text-white/30 font-body">
                    {form.enabled ? "Visitantes verão o popup ao entrar no site" : "Nenhum popup será exibido"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setForm({ ...form, enabled: !form.enabled })}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form.enabled ? "bg-emerald-500" : "bg-white/10"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${form.enabled ? "left-7" : "left-1"}`}
                />
              </button>
            </motion.div>

            {/* Conteúdo */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-charcoal-light border border-white/5 rounded-xl p-6 space-y-4"
            >
              <h2 className="font-display text-base font-semibold text-cream mb-2">Conteúdo</h2>

              <Field label="Título principal *">
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Bem-vindo ao SB Hotel"
                />
              </Field>

              <Field label="Subtítulo / Badge (opcional)">
                <input
                  className={inputClass}
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Ex: Oferta especial · Sleep Better"
                />
              </Field>

              <Field label="Descrição (opcional)">
                <textarea
                  rows={3}
                  className={`${inputClass} resize-none`}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Texto abaixo do título..."
                />
              </Field>

              <Field label="Texto do botão *">
                <input
                  className={inputClass}
                  value={form.button_text}
                  onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                  placeholder="Ex: Reservar agora · Conhecer o hotel"
                />
              </Field>
            </motion.div>

            {/* Captura de email */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-charcoal-light border border-white/5 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold text-cream">Capturar e-mail</h2>
                  <p className="text-xs text-white/30 font-body mt-0.5">Exibe campo de email no popup</p>
                </div>
                <button
                  onClick={() => setForm({ ...form, collect_email: !form.collect_email })}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form.collect_email ? "bg-primary" : "bg-white/10"}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${form.collect_email ? "left-7" : "left-1"}`}
                  />
                </button>
              </div>

              {form.collect_email && (
                <Field label="Mensagem de sucesso após cadastro">
                  <input
                    className={inputClass}
                    value={form.success_message}
                    onChange={(e) => setForm({ ...form, success_message: e.target.value })}
                    placeholder="Ex: Obrigado! Em breve entraremos em contato."
                  />
                </Field>
              )}
            </motion.div>

            {/* Preview resumido */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-charcoal-light border border-white/5 rounded-xl p-6"
            >
              <h2 className="font-display text-base font-semibold text-cream mb-4">Preview</h2>
              <div
                className="rounded-xl border border-gold/20 p-6 text-center max-w-xs mx-auto"
                style={{ background: "linear-gradient(160deg, #1a1710, #0f0e0b)" }}
              >
                {form.subtitle && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 mb-3">
                    <Sparkles className="w-2.5 h-2.5 text-primary" />
                    <span className="text-primary text-xs font-body">{form.subtitle}</span>
                  </div>
                )}
                <p className="font-display text-lg font-bold text-cream mb-2">{form.title || "Título do popup"}</p>
                {form.description && <p className="text-cream/40 text-xs font-body mb-4">{form.description}</p>}
                {form.collect_email && (
                  <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-3 text-left">
                    <span className="text-white/20 text-xs font-body">seu@email.com</span>
                  </div>
                )}
                <div
                  className="py-2 rounded-lg text-xs font-semibold font-body"
                  style={{ background: "linear-gradient(135deg, #C9A84C, #E5C97A)", color: "#0A0A0A" }}
                >
                  {form.button_text || "Botão"}
                </div>
              </div>
            </motion.div>

            {/* Salvar */}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-body font-semibold text-sm tracking-wider uppercase transition-all hover:scale-[1.01] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #C9A84C, #E5C97A)", color: "#0A0A0A" }}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveMutation.isPending ? "Salvando..." : saved ? "Salvo!" : "Salvar configurações"}
            </button>

            {/* Info SQL */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-5 py-4">
              <p className="text-xs text-amber-300 font-body leading-relaxed">
                <strong>Necessário no Supabase:</strong> Execute este SQL antes de usar:
              </p>
              <pre className="text-xs text-amber-200/70 font-mono mt-2 leading-relaxed overflow-x-auto">{`CREATE TABLE IF NOT EXISTS popup_config (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean DEFAULT false,
  title text,
  subtitle text,
  description text,
  button_text text,
  collect_email boolean DEFAULT false,
  success_message text
);`}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPopup;
