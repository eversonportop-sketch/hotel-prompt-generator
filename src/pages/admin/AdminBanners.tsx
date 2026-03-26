// ─── AdminBanners ───────────────────────────────────────────────────────────
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Image as ImageIcon, Plus, Trash2, X, Save } from "lucide-react";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

interface Banner {
  id: string;
  title: string;
  image_url: string;
  active: boolean;
}

const AdminBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", image_url: "" });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) { toast.error("URL da imagem obrigatória."); return; }
    setBanners([...banners, { id: Date.now().toString(), ...form, active: true }]);
    toast.success("Banner adicionado!");
    setModalOpen(false);
    setForm({ title: "", image_url: "" });
  };

  const handleDelete = (id: string) => {
    setBanners(banners.filter((b) => b.id !== id));
    toast.success("Banner removido.");
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <header className="bg-charcoal-light border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hotelLogo} alt="SB Hotel" className="h-10 w-auto object-contain" />
          <span className="text-cream/40 text-xs font-body">Admin</span>
        </div>
        <Link to="/" className="text-cream/50 text-sm font-body hover:text-primary transition-colors">Ver Site →</Link>
      </header>
      <div className="p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="inline-flex items-center gap-2 text-cream/50 hover:text-primary text-sm font-body transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span className="text-cream/20">/</span>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold text-cream">Banners</h1>
            </div>
          </div>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:scale-[1.02] transition-all">
            <Plus className="w-4 h-4" /> Novo Banner
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-12 h-12 text-primary/20 mx-auto mb-4" />
            <p className="text-cream/30 font-body">Nenhum banner cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {banners.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-charcoal-light border border-gold/15 rounded-xl overflow-hidden">
                <div className="aspect-[16/7] overflow-hidden">
                  <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <h3 className="text-cream font-body text-sm">{b.title || "Sem título"}</h3>
                  <button onClick={() => handleDelete(b.id)} className="text-cream/30 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-charcoal border border-gold/20 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gold/10">
                <h2 className="font-display text-xl font-bold text-cream">Novo Banner</h2>
                <button onClick={() => setModalOpen(false)} className="text-cream/40 hover:text-cream"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAdd} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Título</label>
                  <input className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título do banner" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">URL da imagem *</label>
                  <input className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." required />
                  {form.image_url && <img src={form.image_url} alt="preview" className="mt-2 h-20 w-full object-cover rounded-lg opacity-80" />}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-gold/20 text-cream/60 hover:text-cream rounded-lg py-3 text-sm font-body transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm rounded-lg py-3 hover:scale-[1.01] transition-all">
                    <Save className="w-4 h-4" /> Adicionar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBanners;
