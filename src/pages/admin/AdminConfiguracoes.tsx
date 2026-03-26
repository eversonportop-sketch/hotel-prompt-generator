import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Save, Phone, Mail, MapPin, Globe, Instagram, Facebook } from "lucide-react";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

const STORAGE_KEY = "hotel_settings";

const DEFAULT_SETTINGS = {
  hotel_name: "SB Hotel",
  tagline: "Experiência premium em hospedagem",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  city: "",
  check_in_time: "14:00",
  check_out_time: "12:00",
  website: "",
  instagram: "",
  facebook: "",
  google_maps_url: "",
  about: "",
};

const AdminConfiguracoes = () => {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setForm({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) }); } catch {}
    }
    setLoaded(true);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSaving(false);
    toast.success("Configurações salvas!");
  };

  const field = (
    label: string,
    key: keyof typeof DEFAULT_SETTINGS,
    placeholder?: string,
    icon?: React.ReactNode,
    type = "text"
  ) => (
    <div>
      <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/30">{icon}</span>
        )}
        <input
          type={type}
          className={`w-full bg-black/50 border border-gold/20 rounded-lg py-3 text-cream text-sm focus:border-primary focus:outline-none transition ${icon ? "pl-10 pr-4" : "px-4"}`}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
        />
      </div>
    </div>
  );

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-charcoal">
      <header className="bg-charcoal-light border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hotelLogo} alt="SB Hotel" className="h-10 w-auto object-contain" />
          <span className="text-cream/40 text-xs font-body">Admin</span>
        </div>
        <Link to="/" className="text-cream/50 text-sm font-body hover:text-primary transition-colors">Ver Site →</Link>
      </header>

      <div className="p-6 md:p-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin" className="inline-flex items-center gap-2 text-cream/50 hover:text-primary text-sm font-body transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-cream/20">/</span>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h1 className="font-display text-2xl font-bold text-cream">Configurações</h1>
          </div>
        </div>

        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSave} className="space-y-8">

          {/* Identidade */}
          <div className="bg-charcoal-light border border-gold/10 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-cream mb-5 pb-3 border-b border-gold/10">Identidade do Hotel</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("Nome do hotel", "hotel_name", "SB Hotel")}
              {field("Slogan", "tagline", "Experiência premium...")}
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Sobre o hotel</label>
                <textarea rows={3} className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition resize-none"
                  value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} placeholder="Descreva brevemente o hotel..." />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-charcoal-light border border-gold/10 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-cream mb-5 pb-3 border-b border-gold/10">Contato</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("Telefone", "phone", "(00) 0000-0000", <Phone className="w-4 h-4" />)}
              {field("WhatsApp", "whatsapp", "(00) 00000-0000", <Phone className="w-4 h-4" />)}
              {field("E-mail", "email", "contato@sbhotel.com", <Mail className="w-4 h-4" />, "email")}
              {field("Endereço", "address", "Rua Exemplo, 123", <MapPin className="w-4 h-4" />)}
              {field("Cidade / Estado", "city", "Cidade - UF")}
            </div>
          </div>

          {/* Horários */}
          <div className="bg-charcoal-light border border-gold/10 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-cream mb-5 pb-3 border-b border-gold/10">Horários</h2>
            <div className="grid grid-cols-2 gap-4">
              {field("Check-in", "check_in_time", "14:00", undefined, "time")}
              {field("Check-out", "check_out_time", "12:00", undefined, "time")}
            </div>
          </div>

          {/* Redes sociais */}
          <div className="bg-charcoal-light border border-gold/10 rounded-xl p-6">
            <h2 className="font-display text-base font-semibold text-cream mb-5 pb-3 border-b border-gold/10">Presença Digital</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("Website", "website", "https://sbhotel.com", <Globe className="w-4 h-4" />)}
              {field("Instagram", "instagram", "@sbhotel", <Instagram className="w-4 h-4" />)}
              {field("Facebook", "facebook", "facebook.com/sbhotel", <Facebook className="w-4 h-4" />)}
              {field("Link Google Maps", "google_maps_url", "https://maps.google.com/...", <MapPin className="w-4 h-4" />)}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold px-8 py-3 rounded-lg hover:scale-[1.02] transition-all disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </motion.form>
      </div>
    </div>
  );
};

export default AdminConfiguracoes;
