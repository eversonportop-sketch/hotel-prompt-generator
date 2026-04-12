// ─── AdminBanners ─────────────────────────────────────────────────────────────
// CORREÇÕES aplicadas:
//  1. Banners persistidos no Supabase (tabela `banners`) — antes era só useState local
//  2. Upload real de arquivo do PC via Supabase Storage (bucket `hotel-images`)
//  3. Campo `active` com toggle para ativar/desativar
//  4. Ordem dos banners (drag n' drop não incluído, mas campo `display_order`)
//  5. Preview imediato ao selecionar arquivo

import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Save,
  Upload,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

const PAGE_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "salao", label: "Salão de Festas" },
  { value: "piscina", label: "Piscina" },
] as const;

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  mobile_image_url: string | null;
  active: boolean;
  display_order: number;
  created_at: string;
  page: string;
}

const EMPTY_FORM = {
  title: "",
  image_url: "",
  file: null as File | null,
  mobile_image_url: "",
  mobileFile: null as File | null,
  page: "home" as string,
};

// ── Utilitário: faz upload para o bucket e retorna URL pública ─────────────────
async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("hotel-images")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("hotel-images").getPublicUrl(path);
  return data.publicUrl;
}

const AdminBanners = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  // ── Busca banners do Supabase ────────────────────────────────────────────────
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners" as any)
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as unknown as Banner[];
    },
  });

  // ── Adicionar banner ─────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = form.image_url;
      let mobileImageUrl = form.mobile_image_url || null;

      setUploading(true);
      try {
        if (form.file) imageUrl = await uploadImage(form.file);
        if (form.mobileFile) mobileImageUrl = await uploadImage(form.mobileFile);
      } finally {
        setUploading(false);
      }

      if (!imageUrl) throw new Error("Nenhuma imagem desktop selecionada.");

      const maxOrder = banners.length ? Math.max(...banners.map((b) => b.display_order)) : -1;

      const { error } = await supabase.from("banners" as any).insert({
        title: form.title || null,
        image_url: imageUrl,
        mobile_image_url: mobileImageUrl || null,
        active: true,
        display_order: maxOrder + 1,
        page: form.page,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner adicionado!");
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      closeModal();
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao adicionar banner."),
  });

  // ── Toggle ativo/inativo ─────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("banners" as any)
        .update({ active: !active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  // ── Deletar banner ───────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("banners" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner removido.");
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error("Erro ao remover banner."),
  });

  const closeModal = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
    setPreviewUrl(null);
    setMobilePreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem (JPG, PNG, WebP…)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10 MB.");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setForm({ ...form, file, image_url: "" });
  };

  const handleMobileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem (JPG, PNG, WebP…)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10 MB.");
      return;
    }
    setMobilePreviewUrl(URL.createObjectURL(file));
    setForm({ ...form, mobileFile: file, mobile_image_url: "" });
  };

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Header */}
      <header className="bg-charcoal-light border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hotelLogo} alt="SB Hotel" className="h-10 w-auto object-contain" />
          <span className="text-cream/40 text-xs font-body">Admin</span>
        </div>
        <Link to="/" className="text-cream/50 text-sm font-body hover:text-primary transition-colors">
          Ver Site →
        </Link>
      </header>

      <div className="p-6 md:p-10">
        {/* Topo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-cream/50 hover:text-primary text-sm font-body transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span className="text-cream/20">/</span>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold text-cream">Banners</h1>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Banner
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total", value: banners.length, color: "text-cream" },
            { label: "Ativos", value: banners.filter((b) => b.active).length, color: "text-green-400" },
            { label: "Inativos", value: banners.filter((b) => !b.active).length, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-charcoal-light border border-gold/10 rounded-xl p-4">
              <p className="text-cream/40 text-xs font-body uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Lista de banners */}
        {isLoading ? (
          <div className="text-center py-20 text-cream/30 font-body">Carregando banners...</div>
        ) : banners.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-12 h-12 text-primary/20 mx-auto mb-4" />
            <p className="text-cream/30 font-body">Nenhum banner cadastrado.</p>
            <button onClick={() => setModalOpen(true)} className="mt-4 text-primary text-sm hover:underline font-body">
              Criar primeiro banner
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {banners.map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-charcoal-light border rounded-xl overflow-hidden ${
                  b.active ? "border-gold/15" : "border-red-900/30 opacity-60"
                }`}
              >
                <div className="grid grid-cols-2 gap-2 overflow-hidden relative">
                  <div className="relative">
                    <img
                      src={b.image_url}
                      alt={b.title ?? "Banner Desktop"}
                      className="w-full h-28 object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white/70 px-1.5 py-0.5 rounded font-body">
                      Desktop
                    </span>
                  </div>
                  <div className="relative bg-black/20">
                    {b.mobile_image_url ? (
                      <>
                        <img
                          src={b.mobile_image_url}
                          alt="Banner Mobile"
                          className="w-full h-28 object-cover hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white/70 px-1.5 py-0.5 rounded font-body">
                          Mobile
                        </span>
                      </>
                    ) : (
                      <div className="w-full h-28 flex flex-col items-center justify-center gap-1">
                        <ImageIcon className="w-5 h-5 text-white/10" />
                        <span className="text-[10px] text-white/20 font-body">Sem mobile</span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`absolute top-2 right-2 text-xs font-body px-2 py-1 rounded-full border ${
                      b.active
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}
                  >
                    {b.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="p-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-body uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {PAGE_OPTIONS.find((p) => p.value === (b as any).page)?.label || "Home"}
                  </span>
                  <h3 className="text-cream font-body text-sm truncate">
                    {b.title || <span className="text-cream/30 italic">Sem título</span>}
                  </h3>
                </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: b.id, active: b.active })}
                      className="text-cream/40 hover:text-yellow-400 transition-colors"
                      title={b.active ? "Desativar" : "Ativar"}
                    >
                      {b.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(b.id)}
                      className="text-cream/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal: Novo Banner ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-charcoal border border-gold/20 rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gold/10">
                <h2 className="font-display text-xl font-bold text-cream">Novo Banner</h2>
                <button onClick={closeModal} className="text-cream/40 hover:text-cream">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addMutation.mutate();
                }}
                className="p-6 space-y-4 overflow-y-auto flex-1"
              >
                {/* Página */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">
                    Página
                  </label>
                  <select
                    className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={form.page}
                    onChange={(e) => setForm({ ...form, page: e.target.value })}
                  >
                    {PAGE_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value} className="bg-charcoal text-cream">
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">
                    Título <span className="normal-case text-cream/30">(opcional)</span>
                  </label>
                  <input
                    className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Promoção de Verão"
                  />
                </div>

                {/* Upload desktop */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">
                    Imagem Desktop * <span className="normal-case text-cream/30">1920 × 680 px · proporção 16:6</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative cursor-pointer border-2 border-dashed border-gold/20 hover:border-primary/40 rounded-xl transition-all overflow-hidden"
                  >
                    {previewUrl ? (
                      <div className="relative">
                        <img src={previewUrl} alt="Preview Desktop" className="w-full h-36 object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-cream text-sm font-body">Clique para trocar</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 flex flex-col items-center justify-center gap-3 p-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="text-cream/60 text-sm font-body">Clique para enviar imagem desktop</p>
                          <p className="text-cream/30 text-xs font-body mt-1">JPG, PNG, WebP · Máx 10 MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-gold/10" />
                    <span className="text-cream/20 text-xs font-body">ou cole uma URL</span>
                    <div className="flex-1 h-px bg-gold/10" />
                  </div>
                  <input
                    className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={form.image_url}
                    onChange={(e) => {
                      setForm({ ...form, image_url: e.target.value, file: null });
                      setPreviewUrl(e.target.value || null);
                    }}
                    placeholder="https://..."
                  />
                </div>

                {/* Upload mobile */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">
                    Imagem Mobile{" "}
                    <span className="normal-case text-cream/30">opcional · 750 × 1200 px · proporção 9:16</span>
                  </label>
                  <div
                    onClick={() => mobileFileInputRef.current?.click()}
                    className="relative cursor-pointer border-2 border-dashed border-gold/20 hover:border-primary/40 rounded-xl transition-all overflow-hidden"
                  >
                    {mobilePreviewUrl ? (
                      <div className="relative">
                        <img
                          src={mobilePreviewUrl}
                          alt="Preview Mobile"
                          className="w-full h-36 object-cover object-top"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-cream text-sm font-body">Clique para trocar</p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 flex flex-col items-center justify-center gap-3 p-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Upload className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-cream/60 text-sm font-body">Clique para enviar imagem mobile</p>
                          <p className="text-cream/30 text-xs font-body mt-1">JPG, PNG, WebP · Máx 10 MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={mobileFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleMobileFileChange}
                  />
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-gold/10" />
                    <span className="text-cream/20 text-xs font-body">ou cole uma URL</span>
                    <div className="flex-1 h-px bg-gold/10" />
                  </div>
                  <input
                    className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={form.mobile_image_url}
                    onChange={(e) => {
                      setForm({ ...form, mobile_image_url: e.target.value, mobileFile: null });
                      setMobilePreviewUrl(e.target.value || null);
                    }}
                    placeholder="https://..."
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 border border-gold/20 text-cream/60 hover:text-cream rounded-lg py-3 text-sm font-body transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addMutation.isPending || uploading}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm rounded-lg py-3 hover:scale-[1.01] transition-all disabled:opacity-50"
                  >
                    {addMutation.isPending || uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {uploading ? "Enviando..." : "Salvando..."}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Adicionar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Confirmar exclusão ────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-charcoal border border-red-900/40 rounded-2xl p-8 max-w-sm w-full text-center"
            >
              <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-cream mb-2">Remover banner?</h3>
              <p className="text-cream/50 text-sm font-body mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 border border-gold/20 text-cream/60 rounded-lg py-2.5 text-sm transition hover:text-cream"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteConfirm)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50"
                >
                  {deleteMutation.isPending ? "Removendo..." : "Remover"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBanners;
