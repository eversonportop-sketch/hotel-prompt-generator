import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ImageIcon,
  Upload,
  Trash2,
  BedDouble,
  PartyPopper,
  Waves,
  Tag,
  Loader2,
  X,
  CheckCircle,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import HeroVideoUpload from "@/components/admin/HeroVideoUpload";

const CATEGORIES = [
  { key: "quartos", label: "Quartos", icon: BedDouble },
  { key: "salao", label: "Salão de Festas", icon: PartyPopper },
  { key: "piscina", label: "Piscina", icon: Waves },
] as const;

type Category = (typeof CATEGORIES)[number]["key"];

interface MediaItem {
  id: string;
  file_name: string;
  file_path: string;
  public_url: string;
  category: string;
  created_at: string;
}

interface UploadProgress {
  name: string;
  status: "uploading" | "done" | "error";
}

async function uploadSingle(file: File, category: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  // 1. Upload para o Storage
  const { error: storageError } = await supabase.storage
    .from("gallery")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (storageError) {
    console.error("Erro no upload do storage:", storageError);
    throw new Error(`Storage: ${storageError.message}`);
  }

  // 2. Pegar URL pública
  const { data } = supabase.storage.from("gallery").getPublicUrl(path);

  // 3. Salvar no banco
  const { error: dbError } = await (supabase.from as any)("hotel_gallery").insert({
    file_name: file.name,
    file_path: path,
    public_url: data.publicUrl,
    category,
  });

  if (dbError) {
    console.error("Erro ao salvar no banco:", dbError);
    // Remove o arquivo do storage se falhou no banco
    await supabase.storage.from("gallery").remove([path]);
    throw new Error(`Banco: ${dbError.message}`);
  }

  return data.publicUrl;
}

const AdminMidia = () => {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [progresses, setProgresses] = useState<UploadProgress[]>([]);
  const [dragging, setDragging] = useState<Category | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MediaItem | null>(null);

  const { data: media = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ["admin-media"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("hotel_gallery").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("Erro ao buscar mídia:", error);
        throw error;
      }
      return (data ?? []) as MediaItem[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: MediaItem) => {
      await supabase.storage.from("gallery").remove([item.file_path]);
      const { error } = await (supabase.from as any)("hotel_gallery").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-media"] });
      toast.success("Imagem excluída.");
      setDeleteConfirm(null);
    },
    onError: () => toast.error("Erro ao excluir imagem."),
  });

  // Upload de múltiplos arquivos
  const handleFiles = useCallback(
    async (files: FileList | File[], category: Category) => {
      const arr = Array.from(files);
      if (!arr.length) return;

      // Validação
      const invalid = arr.filter((f) => !f.type.startsWith("image/") || f.size > 10 * 1024 * 1024);
      if (invalid.length) {
        toast.error(`${invalid.length} arquivo(s) inválido(s) — apenas imagens até 10MB.`);
      }
      const valid = arr.filter((f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024);
      if (!valid.length) return;

      // Inicializa progresso
      setProgresses(valid.map((f) => ({ name: f.name, status: "uploading" })));

      let successCount = 0;
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        try {
          await uploadSingle(file, category);
          successCount++;
          setProgresses((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "done" } : p)));
        } catch (err) {
          console.error("Falha no upload:", err);
          setProgresses((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "error" } : p)));
          toast.error(`Erro ao enviar "${file.name}": ${err instanceof Error ? err.message : "Erro desconhecido"}`);
        }
      }

      qc.invalidateQueries({ queryKey: ["admin-media"] });
      toast.success(`${successCount} de ${valid.length} imagem(ns) enviada(s)!`);
      setTimeout(() => setProgresses([]), 2000);
    },
    [qc],
  );

  const openPicker = (category: Category) => {
    setActiveCategory(category);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeCategory && e.target.files?.length) {
      handleFiles(e.target.files, activeCategory);
    }
  };

  const onDrop = (e: React.DragEvent, category: Category) => {
    e.preventDefault();
    setDragging(null);
    handleFiles(e.dataTransfer.files, category);
  };

  const mediaByCategory = (cat: string) => media.filter((m) => m.category === cat);
  const isUploading = progresses.some((p) => p.status === "uploading");

  return (
    <div className="min-h-screen bg-charcoal text-cream">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-charcoal/90 border-b border-gold/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-xs text-cream/40 hover:text-primary transition-colors font-body"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <ImageIcon className="w-4 h-4 text-primary" />
            </div>
            <h1 className="font-display text-lg font-semibold text-cream">Galeria de Mídia</h1>
          </div>
        </div>
        <p className="text-xs text-cream/30 font-body hidden md:block">
          Selecione várias fotos de uma vez · Arraste e solte nas categorias
        </p>
      </header>

      {/* Barra de progresso dos uploads */}
      <AnimatePresence>
        {progresses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-charcoal-light border-b border-gold/10 px-6 py-3"
          >
            <p className="text-xs text-primary font-body mb-2 tracking-wider uppercase">
              Enviando {progresses.length} imagem(ns)...
            </p>
            <div className="flex flex-wrap gap-2">
              {progresses.map((p, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 text-xs font-body px-2.5 py-1 rounded-full border ${
                    p.status === "done"
                      ? "border-green-500/30 bg-green-500/10 text-green-400"
                      : p.status === "error"
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : "border-gold/20 bg-gold/5 text-cream/60"
                  }`}
                >
                  {p.status === "uploading" && <Loader2 className="w-3 h-3 animate-spin" />}
                  {p.status === "done" && <CheckCircle className="w-3 h-3" />}
                  {p.status === "error" && <X className="w-3 h-3" />}
                  <span className="max-w-[120px] truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input file oculto — múltiplo */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileInputChange} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <HeroVideoUpload />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          CATEGORIES.map((cat) => {
            const items = mediaByCategory(cat.key);
            const Icon = cat.icon;
            const isDraggingHere = dragging === cat.key;

            return (
              <motion.section
                key={cat.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Cabeçalho da categoria */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="font-display text-base font-semibold text-cream">{cat.label}</h2>
                    <span className="text-xs text-cream/30 font-body">
                      {items.length} {items.length === 1 ? "imagem" : "imagens"}
                    </span>
                  </div>
                  <button
                    onClick={() => openPicker(cat.key)}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-xs font-semibold hover:from-primary/30 hover:to-primary/20 transition border border-primary/20 disabled:opacity-50 font-body"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Enviar fotos
                  </button>
                </div>

                {/* Zona de drop + grid */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(cat.key);
                  }}
                  onDragLeave={() => setDragging(null)}
                  onDrop={(e) => onDrop(e, cat.key)}
                  className={`rounded-xl border-2 transition-all duration-200 ${
                    isDraggingHere
                      ? "border-primary bg-primary/5 scale-[1.01]"
                      : items.length === 0
                        ? "border-dashed border-gold/15"
                        : "border-transparent"
                  }`}
                >
                  {items.length === 0 ? (
                    <div
                      onClick={() => openPicker(cat.key)}
                      className="p-10 text-center cursor-pointer hover:bg-charcoal-light/50 transition-colors rounded-xl"
                    >
                      <Upload className="w-8 h-8 text-primary/30 mx-auto mb-3" />
                      <p className="text-sm text-cream/30 font-body">
                        {isDraggingHere ? "Solte para enviar!" : "Clique ou arraste fotos aqui"}
                      </p>
                      <p className="text-xs text-cream/15 font-body mt-1">
                        JPG, PNG, WebP · Máx 10MB por foto · Múltiplas fotos permitidas
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-1">
                      {/* Card de adicionar mais */}
                      <div
                        onClick={() => openPicker(cat.key)}
                        className="aspect-square rounded-xl border-2 border-dashed border-gold/15 hover:border-primary/40 bg-charcoal-light cursor-pointer flex flex-col items-center justify-center gap-2 transition-all hover:bg-primary/5"
                      >
                        <Upload className="w-5 h-5 text-primary/50" />
                        <span className="text-xs text-cream/30 font-body text-center px-2">Adicionar mais</span>
                      </div>

                      <AnimatePresence>
                        {items.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="group relative rounded-xl overflow-hidden border border-gold/10 bg-charcoal-light aspect-square"
                          >
                            <img
                              src={item.public_url}
                              alt={item.file_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center gap-2">
                              <button
                                onClick={() => setLightbox(item.public_url)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(item)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-red-600/80 hover:bg-red-500 text-white"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {/* Nome */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                              <p className="text-[10px] text-white/60 truncate font-body">{item.file_name}</p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </motion.section>
            );
          })
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightbox}
              alt=""
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmação de exclusão */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-charcoal-light border border-gold/10 rounded-2xl p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-cream">Excluir imagem?</h3>
                <button onClick={() => setDeleteConfirm(null)} className="text-cream/30 hover:text-cream/60">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-cream/50 font-body">
                <span className="text-cream font-medium">{deleteConfirm.file_name}</span> será removida permanentemente.
              </p>
              {deleteConfirm.public_url && (
                <img
                  src={deleteConfirm.public_url}
                  alt=""
                  className="w-full h-32 object-cover rounded-lg border border-gold/10"
                />
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 border border-gold/10 text-cream/50 rounded-lg py-2.5 text-sm hover:bg-cream/5 transition font-body"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteConfirm)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50 font-body"
                >
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

export default AdminMidia;
