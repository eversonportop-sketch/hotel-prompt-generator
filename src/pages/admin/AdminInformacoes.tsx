import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Info,
  Wifi,
  Tv,
  Coffee,
  Clock,
  Waves,
  ScrollText,
  Phone,
  GripVertical,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

/* ── icon map ─────────────────────────────────────── */
const ICON_OPTIONS = [
  { value: "wifi", label: "Wi-Fi", Icon: Wifi },
  { value: "tv", label: "TV", Icon: Tv },
  { value: "coffee", label: "Café", Icon: Coffee },
  { value: "clock", label: "Horário", Icon: Clock },
  { value: "pool", label: "Piscina", Icon: Waves },
  { value: "rules", label: "Regras", Icon: ScrollText },
  { value: "phone", label: "Telefone", Icon: Phone },
  { value: "info", label: "Info", Icon: Info },
] as const;

function iconComponent(value: string | null) {
  const found = ICON_OPTIONS.find((o) => o.value === value);
  return found ? found.Icon : Info;
}

/* ── types ────────────────────────────────────────── */
interface HotelInfo {
  id: string;
  title: string;
  content: string;
  icon: string | null;
  display_order: number | null;
  active: boolean | null;
}

const EMPTY: Omit<HotelInfo, "id"> = {
  title: "",
  content: "",
  icon: "info",
  display_order: 0,
  active: true,
};

/* ── animation helper ─────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

/* ── component ────────────────────────────────────── */
const AdminInformacoes = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HotelInfo | null>(null);
  const [form, setForm] = useState<Omit<HotelInfo, "id">>(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* ── queries ── */
  const { data: items = [], isLoading } = useQuery<HotelInfo[]>({
    queryKey: ["admin-hotel-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_info")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as HotelInfo[];
    },
  });

  /* ── mutations ── */
  const saveMutation = useMutation({
    mutationFn: async (payload: Omit<HotelInfo, "id"> & { id?: string }) => {
      if (payload.id) {
        const { error } = await supabase.from("hotel_info").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hotel_info").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hotel-info"] });
      toast({ title: editing ? "Informação atualizada" : "Informação criada" });
      closeModal();
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("hotel_info").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-hotel-info"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hotel_info").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hotel-info"] });
      toast({ title: "Informação excluída" });
      setDeleteConfirm(null);
    },
    onError: () => toast({ title: "Erro ao excluir", variant: "destructive" }),
  });

  /* ── helpers ── */
  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, display_order: items.length });
    setModalOpen(true);
  };
  const openEdit = (item: HotelInfo) => {
    setEditing(item);
    setForm({ title: item.title, content: item.content, icon: item.icon, display_order: item.display_order, active: item.active });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(editing ? { ...form, id: editing.id } : form);
  };

  return (
    <div className="min-h-screen bg-charcoal text-cream">
      {/* header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-charcoal/80 border-b border-white/5 px-6 py-3 flex items-center gap-4">
        <Link to="/admin" className="text-white/40 hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-display text-lg font-semibold text-cream">Informações do Hotel</h1>
          <p className="text-xs text-white/30 font-body">Cadastre dados úteis para hóspedes</p>
        </div>
        <button
          onClick={openCreate}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm font-semibold hover:bg-primary/30 transition-colors font-body"
        >
          <Plus className="w-4 h-4" /> Nova Informação
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {isLoading ? (
          <p className="text-white/20 text-sm text-center py-12 font-body">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-12 font-body">Nenhuma informação cadastrada</p>
        ) : (
          items.map((item, i) => {
            const IconComp = iconComponent(item.icon);
            return (
              <motion.div key={item.id} {...fadeUp(i * 0.04)}>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-charcoal-light border border-white/5 hover:border-primary/15 transition-all group">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IconComp className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-cream font-body">{item.title}</p>
                    <p className="text-xs text-white/40 mt-0.5 whitespace-pre-line font-body">{item.content}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={item.active ?? true}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: item.id, active: v })}
                    />
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-primary transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── modal create/edit ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              onSubmit={handleSubmit}
              className="bg-charcoal-light border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-5"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-cream">
                  {editing ? "Editar Informação" : "Nova Informação"}
                </h2>
                <button type="button" onClick={closeModal} className="text-white/30 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* título */}
              <div className="space-y-1">
                <label className="text-xs text-white/40 font-body">Título</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-charcoal border border-white/10 text-cream text-sm focus:border-primary/40 outline-none font-body"
                  placeholder="Ex: Senha do Wi-Fi"
                />
              </div>

              {/* conteúdo */}
              <div className="space-y-1">
                <label className="text-xs text-white/40 font-body">Conteúdo</label>
                <textarea
                  required
                  rows={3}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-charcoal border border-white/10 text-cream text-sm focus:border-primary/40 outline-none resize-none font-body"
                  placeholder="Ex: SBHotel2024"
                />
              </div>

              {/* ícone */}
              <div className="space-y-1">
                <label className="text-xs text-white/40 font-body">Ícone</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((opt) => {
                    const active = form.icon === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, icon: opt.value })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-body transition-colors ${
                          active
                            ? "border-primary/40 bg-primary/15 text-primary"
                            : "border-white/10 text-white/40 hover:border-white/20"
                        }`}
                      >
                        <opt.Icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ordem */}
              <div className="space-y-1">
                <label className="text-xs text-white/40 font-body">Ordem de exibição</label>
                <input
                  type="number"
                  value={form.display_order ?? 0}
                  onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                  className="w-24 px-3 py-2 rounded-lg bg-charcoal border border-white/10 text-cream text-sm focus:border-primary/40 outline-none font-body"
                />
              </div>

              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full py-2.5 rounded-lg bg-primary text-charcoal font-semibold text-sm hover:bg-primary/90 transition-colors font-body disabled:opacity-50"
              >
                {saveMutation.isPending ? "Salvando…" : editing ? "Salvar Alterações" : "Criar Informação"}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── delete confirm ── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-charcoal-light border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4 text-center"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <Trash2 className="w-8 h-8 text-red-400 mx-auto" />
              <p className="text-cream font-body text-sm">Tem certeza que deseja excluir esta informação?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors font-body"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors font-body disabled:opacity-50"
                >
                  {deleteMutation.isPending ? "Excluindo…" : "Excluir"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminInformacoes;
