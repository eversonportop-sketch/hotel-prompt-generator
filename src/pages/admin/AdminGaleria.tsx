import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon,
  Upload,
  Trash2,
  BedDouble,
  PartyPopper,
  Waves,
  CalendarDays,
  Loader2,
  X,
  ZoomIn,
  Play,
} from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "gallery_quartos", label: "Quartos", icon: BedDouble },
  { key: "gallery_salao", label: "Salão de Festas", icon: PartyPopper },
  { key: "gallery_piscina", label: "Piscina", icon: Waves },
  { key: "gallery_eventos", label: "Eventos", icon: CalendarDays },
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

function isVideo(name: string) {
  return /\.(mp4|webm|mov|avi|mkv)$/i.test(name);
}

async function uploadSingle(file: File, category: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: storageError } = await supabase.storage
    .from("hotel-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (storageError) throw new Error(`Storage: ${storageError.message}`);

  const { data } = supabase.storage.from("hotel-images").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const mediaType = isVideo(file.name) ? "video" : "image";

  const { error: dbError } = await supabase.from("hotel_media").insert({
    file_name: file.name,
    file_path: path,
    public_url: publicUrl,
    category,
    media_type: mediaType,
  } as any);

  if (dbError) {
    await supabase.storage.from("hotel-images").remove([path]);
    throw new Error(`DB: ${dbError.message}`);
  }

  return publicUrl;
}

// ════════════════════════════════════════════════════════════════════
const AdminGaleria = () => {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Category>("gallery_quartos");
  const [lightbox, setLightbox] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["admin-gallery", activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_media")
        .select("*")
        .eq("category", activeTab)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MediaItem[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: MediaItem) => {
      await supabase.storage.from("hotel-images").remove([item.file_path]);
      const { error } = await supabase.from("hotel_media").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mídia removida!");
      qc.invalidateQueries({ queryKey: ["admin-gallery", activeTab] });
    },
    onError: () => toast.error("Erro ao remover mídia."),
  });

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => /\.(jpg|jpeg|png|webp|gif|mp4|webm|mov)$/i.test(f.name));
      if (!arr.length) return toast.error("Nenhum arquivo válido (imagem ou vídeo).");

      setUploading(true);
      let ok = 0;
      for (const file of arr) {
        try {
          await uploadSingle(file, activeTab);
          ok++;
        } catch (e: any) {
          toast.error(`Erro: ${file.name} — ${e.message}`);
        }
      }
      setUploading(false);
      if (ok > 0) {
        toast.success(`${ok} arquivo(s) enviado(s)!`);
        qc.invalidateQueries({ queryKey: ["admin-gallery", activeTab] });
      }
    },
    [activeTab, qc],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const catLabel = CATEGORIES.find((c) => c.key === activeTab)?.label || "";

  return (
    <div className="p-6 md:p-8 space-y-6 text-cream">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <ImageIcon className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-cream leading-none">Galeria</h1>
          <p className="text-white/30 text-xs mt-0.5 font-body">Gerencie fotos e vídeos da galeria pública</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => {
          const active = activeTab === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body transition-all border ${
                active
                  ? "bg-primary/15 border-primary/30 text-primary font-semibold"
                  : "border-white/5 text-white/40 hover:text-cream hover:border-white/10"
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragOver ? "border-primary/60 bg-primary/5" : "border-white/10 hover:border-white/20 bg-white/[0.02]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-body text-sm">Enviando...</span>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 font-body text-sm">
              Arraste fotos/vídeos ou clique para enviar em <strong className="text-cream/70">{catLabel}</strong>
            </p>
            <p className="text-white/20 font-body text-xs mt-1">JPG, PNG, WebP, GIF, MP4, WebM</p>
          </>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-white/20 gap-2 font-body">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-16">
          <ImageIcon className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 font-body text-sm">Nenhuma mídia em {catLabel}.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence>
            {media.map((item) => {
              const video = isVideo(item.file_name);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-white/5 hover:border-primary/25 transition-all"
                >
                  {video ? (
                    <video src={item.public_url} className="w-full h-full object-cover" muted preload="metadata" />
                  ) : (
                    <img
                      src={item.public_url}
                      alt={item.file_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}

                  {video && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setLightbox(item)}
                      className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-cream hover:bg-white/20 transition"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Excluir esta mídia?")) deleteMutation.mutate(item);
                      }}
                      className="w-9 h-9 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-cream transition-colors">
              <X className="w-5 h-5" />
            </button>
            {isVideo(lightbox.file_name) ? (
              <video
                src={lightbox.public_url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={lightbox.public_url}
                alt={lightbox.file_name}
                className="max-w-full max-h-[85vh] object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminGaleria;
