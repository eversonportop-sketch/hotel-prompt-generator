import { useState } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { key: "quartos", label: "Quartos", icon: BedDouble },
  { key: "salao", label: "Salão de Festas", icon: PartyPopper },
  { key: "piscina", label: "Piscina", icon: Waves },
  { key: "promocoes", label: "Promoções", icon: Tag },
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

async function uploadImage(file: File, category: string): Promise<{ path: string; url: string }> {
  const ext = file.name.split(".").pop();
  const path = `${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("hotel-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("hotel-images").getPublicUrl(path);
  return { path, url: data.publicUrl };
}

const AdminMidia = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [uploading, setUploading] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<MediaItem | null>(null);

  const { data: media = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ["admin-media"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_media")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MediaItem[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, category }: { file: File; category: Category }) => {
      const { path, url } = await uploadImage(file, category);
      const { error } = await supabase.from("hotel_media").insert({
        file_name: file.name,
        file_path: path,
        public_url: url,
        category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-media"] });
      toast({ title: "Imagem enviada com sucesso" });
      setUploading(null);
    },
    onError: () => toast({ title: "Erro ao enviar imagem", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: MediaItem) => {
      await supabase.storage.from("hotel-images").remove([item.file_path]);
      const { error } = await supabase.from("hotel_media").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-media"] });
      toast({ title: "Imagem excluída" });
      setDeleteConfirm(null);
    },
    onError: () => toast({ title: "Erro ao excluir imagem", variant: "destructive" }),
  });

  const handleFileSelect = (category: Category) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Imagem muito grande (máx 5MB)", variant: "destructive" });
        return;
      }
      setUploading(category);
      uploadMutation.mutate({ file, category });
    };
    input.click();
  };

  const mediaByCategory = (cat: string) => media.filter((m) => m.category === cat);

  return (
    <div className="min-h-screen bg-charcoal text-cream">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-charcoal/80 border-b border-white/5 px-6 py-3 flex items-center gap-4">
        <Link
          to="/admin"
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-primary transition-colors font-body"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <ImageIcon className="w-4 h-4 text-primary" />
          </div>
          <h1 className="font-display text-lg font-semibold text-cream">Galeria de Mídia</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          CATEGORIES.map((cat) => {
            const items = mediaByCategory(cat.key);
            const Icon = cat.icon;
            return (
              <motion.section
                key={cat.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Category header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="font-display text-base font-semibold text-cream">{cat.label}</h2>
                    <span className="text-xs text-white/30 font-body">{items.length} imagens</span>
                  </div>
                  <button
                    onClick={() => handleFileSelect(cat.key)}
                    disabled={uploading === cat.key}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition disabled:opacity-50 font-body"
                  >
                    {uploading === cat.key ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploading === cat.key ? "Enviando..." : "Upload"}
                  </button>
                </div>

                {/* Image grid */}
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-charcoal-light p-8 text-center">
                    <ImageIcon className="w-8 h-8 text-white/10 mx-auto mb-2" />
                    <p className="text-sm text-white/25 font-body">Nenhuma imagem nesta categoria</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <AnimatePresence>
                      {items.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="group relative rounded-xl overflow-hidden border border-white/5 bg-charcoal-light aspect-square"
                        >
                          <img
                            src={item.public_url}
                            alt={item.file_name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                            <button
                              onClick={() => setDeleteConfirm(item)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-red-600/80 hover:bg-red-500 text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                            <p className="text-[10px] text-white/70 truncate font-body">{item.file_name}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.section>
            );
          })
        )}
      </div>

      {/* Delete confirmation */}
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-charcoal-light border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-semibold text-cream">Excluir imagem?</h3>
                <button onClick={() => setDeleteConfirm(null)} className="text-white/30 hover:text-white/60">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-white/50 font-body">
                A imagem <strong className="text-cream">{deleteConfirm.file_name}</strong> será removida permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 border border-white/10 text-white/50 rounded-lg py-2.5 text-sm hover:bg-white/5 transition font-body"
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
