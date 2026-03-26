import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Tag, Plus, Pencil, Trash2, X, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
  discount_fixed: number | null;
  image_url: string | null;
  active: boolean;
  valid_from: string;
  valid_until: string | null;
}

const EMPTY = {
  title: "",
  description: "",
  discount_percent: "",
  discount_fixed: "",
  image_url: "",
  valid_from: new Date().toISOString().split("T")[0],
  valid_until: "",
};

const AdminPromocoes = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Promotion[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description || null,
        discount_percent: form.discount_percent !== "" ? Number(form.discount_percent) : null,
        discount_fixed: form.discount_fixed !== "" ? Number(form.discount_fixed) : null,
        image_url: form.image_url || null,
        valid_from: form.valid_from,
        valid_until: form.valid_until || null,
      };
      if (editing) {
        const { error } = await supabase.from("promotions").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("promotions").insert({ ...payload, active: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Promoção atualizada!" : "Promoção criada!");
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      closeModal();
    },
    onError: () => toast.error("Erro ao salvar promoção."),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("promotions").update({ active: !active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-promotions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Promoção excluída.");
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      setDeleteConfirm(null);
    },
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description ?? "",
      discount_percent: p.discount_percent?.toString() ?? "",
      discount_fixed: p.discount_fixed?.toString() ?? "",
      image_url: p.image_url ?? "",
      valid_from: p.valid_from.split("T")[0],
      valid_until: p.valid_until?.split("T")[0] ?? "",
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(EMPTY); };

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
              <Tag className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold text-cream">Promoções</h1>
            </div>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:scale-[1.02] transition-all">
            <Plus className="w-4 h-4" /> Nova Promoção
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-cream/30 font-body">Carregando...</div>
        ) : promos.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="w-12 h-12 text-primary/20 mx-auto mb-4" />
            <p className="text-cream/30 font-body">Nenhuma promoção cadastrada.</p>
            <button onClick={openCreate} className="mt-4 text-primary text-sm hover:underline font-body">Criar primeira promoção</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {promos.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`bg-charcoal-light border rounded-xl overflow-hidden ${p.active ? "border-gold/15" : "border-red-900/30 opacity-60"}`}>
                {p.image_url && (
                  <div className="aspect-[16/7] overflow-hidden">
                    <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-display text-lg font-semibold text-cream">{p.title}</h3>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-body ${p.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {p.active ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  {p.description && <p className="text-cream/40 text-sm font-body mb-3 line-clamp-2">{p.description}</p>}
                  <div className="flex items-center gap-3 mb-3">
                    {p.discount_percent && (
                      <span className="text-primary font-display font-bold text-xl">{p.discount_percent}% OFF</span>
                    )}
                    {p.discount_fixed && (
                      <span className="text-primary font-display font-bold text-xl">R$ {p.discount_fixed} OFF</span>
                    )}
                  </div>
                  <p className="text-cream/30 text-xs font-body mb-4">
                    Válida: {format(new Date(p.valid_from), "dd/MM/yyyy", { locale: ptBR })}
                    {p.valid_until && ` até ${format(new Date(p.valid_until), "dd/MM/yyyy", { locale: ptBR })}`}
                  </p>
                  <div className="flex items-center gap-2 pt-4 border-t border-gold/10">
                    <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-cream/60 hover:text-primary border border-gold/15 hover:border-primary/40 rounded-lg py-2 transition-all">
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={() => toggleMutation.mutate({ id: p.id, active: p.active })} className="flex-1 flex items-center justify-center gap-1.5 text-xs text-cream/60 hover:text-yellow-400 border border-gold/15 hover:border-yellow-400/40 rounded-lg py-2 transition-all">
                      {p.active ? <><ToggleRight className="w-3.5 h-3.5" /> Pausar</> : <><ToggleLeft className="w-3.5 h-3.5" /> Ativar</>}
                    </button>
                    <button onClick={() => setDeleteConfirm(p.id)} className="flex items-center justify-center text-xs text-cream/40 hover:text-red-400 border border-gold/15 hover:border-red-400/40 rounded-lg p-2 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-charcoal border border-gold/20 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gold/10">
                <h2 className="font-display text-xl font-bold text-cream">{editing ? "Editar Promoção" : "Nova Promoção"}</h2>
                <button onClick={closeModal} className="text-cream/40 hover:text-cream"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Título *</label>
                  <input className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Ex: Fim de semana especial" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Descrição</label>
                  <textarea rows={2} className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition resize-none"
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Desconto %</label>
                    <input type="number" min={0} max={100} className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} placeholder="Ex: 20" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Desconto R$</label>
                    <input type="number" min={0} className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.discount_fixed} onChange={(e) => setForm({ ...form, discount_fixed: e.target.value })} placeholder="Ex: 50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Válida de *</label>
                    <input type="date" className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Válida até</label>
                    <input type="date" className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">URL da imagem</label>
                  <input className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="flex-1 border border-gold/20 text-cream/60 hover:text-cream rounded-lg py-3 text-sm font-body transition-all">Cancelar</button>
                  <button type="submit" disabled={saveMutation.isPending} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm rounded-lg py-3 hover:scale-[1.01] transition-all disabled:opacity-50">
                    <Save className="w-4 h-4" />{saveMutation.isPending ? "Salvando..." : editing ? "Salvar" : "Criar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmar exclusão */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-charcoal border border-red-900/40 rounded-2xl p-8 max-w-sm w-full text-center">
              <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-cream mb-2">Excluir promoção?</h3>
              <p className="text-cream/50 text-sm font-body mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gold/20 text-cream/60 rounded-lg py-2.5 text-sm transition hover:text-cream">Cancelar</button>
                <button onClick={() => deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending} className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50">
                  {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPromocoes;
