import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Save, Phone, Mail, MapPin, Globe, Instagram, Facebook, Loader2 } from "lucide-react";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

const KEYS = [
  "hotel_name",
  "tagline",
  "about",
  "phone",
  "whatsapp",
  "email",
  "address",
  "city",
  "check_in_time",
  "check_out_time",
  "website",
  "instagram",
  "facebook",
  "google_maps_url",
  "auto_cleaning",
];

const DEFAULT_SETTINGS: Record<string, string> = {
  hotel_name: "SB Hotel",
  tagline: "Experiência premium em hospedagem",
  about: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  city: "Butiá - RS",
  check_in_time: "14:00",
  check_out_time: "12:00",
  website: "",
  instagram: "",
  facebook: "",
  google_maps_url: "",
  auto_cleaning: "true",
};

const AdminConfiguracoes = () => {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carregar do Supabase
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("hotel_settings" as any)
        .select("key, value")
        .in("key", KEYS);

      if (!error && data) {
        const merged = { ...DEFAULT_SETTINGS };
        data.forEach((row: any) => {
          if (row.value !== null && row.value !== undefined) {
            merged[row.key] = row.value;
          }
        });
        setForm(merged);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Salvar no Supabase
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const upserts = KEYS.map((key) => ({
        key,
        value: form[key] ?? "",
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("hotel_settings" as any).upsert(upserts, { onConflict: "key" });

      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: string, placeholder?: string, icon?: React.ReactNode, type = "text") => (
    <div>
      <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/30">{icon}</span>}
        <input
          type={type}
          className={`w-full bg-black/50 border border-gold/20 rounded-lg py-3 text-cream text-sm focus:border-primary focus:outline-none transition ${icon ? "pl-10 pr-4" : "px-4"}`}
          value={form[key] ?? ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

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

      <div className="p-6 md:p-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-cream/50 hover:text-primary text-sm font-body transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-cream/20">/</span>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h1 className="font-display text-2xl font-bold text-cream">Configurações</h1>
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 mb-6 text-sm text-primary/80 font-body">
          As informações salvas aqui aparecem automaticamente no rodapé e nas páginas do site.
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSave}
          className="space-y-8"
        >
          {/* Identidade */}
          <div className="bg-charcoal-light border border-gold/10 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-cream mb-5 pb-3 border-b border-gold/10">
              Identidade do Hotel
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("Nome do hotel", "hotel_name", "SB Hotel")}
              {field("Slogan", "tagline", "Experiência premium...")}
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Sobre o hotel</label>
                <textarea
                  rows={3}
                  className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition resize-none"
                  value={form.about ?? ""}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                  placeholder="Descreva brevemente o hotel..."
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-charcoal-light border border-gold/10 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-cream mb-5 pb-3 border-b border-gold/10">
              Contato
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("Telefone", "phone", "(51) 99999-9999", <Phone className="w-4 h-4" />)}
              {field("WhatsApp", "whatsapp", "(51) 99999-9999", <Phone className="w-4 h-4" />)}
              {field("E-mail", "email", "contato@sbhotel.com", <Mail className="w-4 h-4" />, "email")}
              {field("Endereço", "address", "Rua Exemplo, 123", <MapPin className="w-4 h-4" />)}
              {field("Cidade / Estado", "city", "Butiá - RS")}
            </div>
          </div>

          {/* Horários */}
          <div className="bg-charcoal-light border border-gold/10 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-cream mb-5 pb-3 border-b border-gold/10">
              Horários
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {field("Check-in", "check_in_time", "14:00", undefined, "time")}
              {field("Check-out", "check_out_time", "12:00", undefined, "time")}
            </div>
          </div>

          {/* Redes sociais */}
          <div className="bg-charcoal-light border border-gold/10 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-cream mb-5 pb-3 border-b border-gold/10">
              Presença Digital
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("Website", "website", "https://sbhotel.com", <Globe className="w-4 h-4" />)}
              {field("Instagram", "instagram", "@sbhotel", <Instagram className="w-4 h-4" />)}
              {field("Facebook", "facebook", "facebook.com/sbhotel", <Facebook className="w-4 h-4" />)}
              {field(
                "Link Google Maps",
                "google_maps_url",
                "https://maps.google.com/...",
                <MapPin className="w-4 h-4" />,
              )}
            </div>
          </div>

          {/* Operacional */}
          <div className="bg-charcoal-light border border-gold/10 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-cream mb-5 pb-3 border-b border-gold/10">
              Operacional
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cream text-sm font-body font-medium">Limpeza automática após checkout</p>
                <p className="text-cream/40 text-xs font-body mt-0.5">
                  Quando ativado, o quarto vai para "Em Limpeza" automaticamente após o checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, auto_cleaning: form.auto_cleaning === "true" ? "false" : "true" })}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  form.auto_cleaning === "true" ? "bg-primary" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    form.auto_cleaning === "true" ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold px-8 py-3 rounded-lg hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default AdminConfiguracoes;
