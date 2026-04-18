import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Video, Upload, Trash2, Loader2, CheckCircle, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface VideoFile {
  name: string;
  url: string;
}

const HeroVideoUpload = () => {
  const qc = useQueryClient();
  const inputDesktopRef = useRef<HTMLInputElement>(null);
  const inputMobileRef = useRef<HTMLInputElement>(null);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  // ── Vídeo Desktop ──────────────────────────────────────────────────────
  const { data: desktopVideos = [], isLoading: loadingDesktop } = useQuery<VideoFile[]>({
    queryKey: ["hero-video-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("hero-video")
        .list("", { limit: 20, sortBy: { column: "created_at", order: "desc" } });
      if (error || !data) return [];
      return data
        .filter((f) => f.name.match(/\.(mp4|webm|mov)$/i) && !f.name.startsWith("mobile-"))
        .map((f) => ({
          name: f.name,
          url: supabase.storage.from("hero-video").getPublicUrl(f.name).data.publicUrl,
        }));
    },
  });

  // ── Vídeo Mobile ───────────────────────────────────────────────────────
  const { data: mobileVideos = [], isLoading: loadingMobile } = useQuery<VideoFile[]>({
    queryKey: ["hero-video-mobile-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("hero-video")
        .list("", { limit: 20, sortBy: { column: "created_at", order: "desc" } });
      if (error || !data) return [];
      return data
        .filter((f) => f.name.match(/\.(mp4|webm|mov)$/i) && f.name.startsWith("mobile-"))
        .map((f) => ({
          name: f.name,
          url: supabase.storage.from("hero-video").getPublicUrl(f.name).data.publicUrl,
        }));
    },
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["hero-video-admin"] });
    qc.invalidateQueries({ queryKey: ["hero-video-mobile-admin"] });
    qc.invalidateQueries({ queryKey: ["hero-video"] });
    qc.invalidateQueries({ queryKey: ["hero-video-mobile"] });
  };

  // ── Upload ─────────────────────────────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "desktop" | "mobile") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Apenas arquivos de vídeo são permitidos.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Vídeo muito grande. Máx 100MB.");
      return;
    }

    const setUploading = type === "desktop" ? setUploadingDesktop : setUploadingMobile;
    const currentVideos = type === "desktop" ? desktopVideos : mobileVideos;
    const prefix = type === "mobile" ? "mobile-" : "hero-";

    setUploading(true);
    try {
      // Remove vídeos antigos do mesmo tipo
      for (const v of currentVideos) {
        await supabase.storage.from("hero-video").remove([v.name]);
      }

      const ext = file.name.split(".").pop() || "mp4";
      const path = `${prefix}${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("hero-video")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;

      toast.success(`Vídeo ${type === "mobile" ? "mobile" : "desktop"} atualizado!`);
      invalidateAll();
    } catch (err) {
      console.error(err);
      toast.error(`Erro: ${err instanceof Error ? err.message : "desconhecido"}`);
    } finally {
      setUploading(false);
      if (type === "desktop" && inputDesktopRef.current) inputDesktopRef.current.value = "";
      if (type === "mobile" && inputMobileRef.current) inputMobileRef.current.value = "";
    }
  };

  // ── Delete (corrigido) ─────────────────────────────────────────────────
  const handleDelete = async (name: string, type: "desktop" | "mobile") => {
    if (!confirm(`Remover vídeo ${type === "mobile" ? "mobile" : "desktop"} do hero?`)) return;

    const { error } = await supabase.storage.from("hero-video").remove([name]);
    if (error) {
      toast.error(`Erro ao remover: ${error.message}`);
      return;
    }
    toast.success("Vídeo removido.");
    // Força refetch imediato
    await qc.resetQueries({ queryKey: ["hero-video-admin"] });
    await qc.resetQueries({ queryKey: ["hero-video-mobile-admin"] });
    await qc.resetQueries({ queryKey: ["hero-video"] });
    await qc.resetQueries({ queryKey: ["hero-video-mobile"] });
  };

  const activeDesktop = desktopVideos[0];
  const activeMobile = mobileVideos[0];

  // ── Bloco reutilizável ─────────────────────────────────────────────────
  const VideoBlock = ({
    type,
    label,
    hint,
    icon: Icon,
    active,
    loading,
    uploading,
    inputRef,
  }: {
    type: "desktop" | "mobile";
    label: string;
    hint: string;
    icon: React.ElementType;
    active: VideoFile | undefined;
    loading: boolean;
    uploading: boolean;
    inputRef: React.RefObject<HTMLInputElement>;
  }) => (
    <div className="rounded-xl border border-gold/10 bg-charcoal-light/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-cream">{label}</h3>
            <p className="text-[10px] text-cream/30 font-body">{hint}</p>
          </div>
          <span className="text-xs text-cream/30 font-body ml-1">{active ? "• Ativo" : "• Sem vídeo"}</span>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 text-primary text-xs font-semibold hover:from-primary/30 hover:to-primary/20 transition border border-primary/20 disabled:opacity-50 font-body"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? "Enviando..." : active ? "Substituir" : "Enviar vídeo"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => handleUpload(e, type)}
      />

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : active ? (
        <div className="grid md:grid-cols-2 gap-4 items-center">
          <video
            src={active.url}
            controls
            muted
            loop
            className="w-full rounded-lg border border-gold/10 aspect-video object-cover bg-black"
          />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-400 text-sm font-body">
              <CheckCircle className="w-4 h-4" />
              Vídeo ativo no hero
            </div>
            <p className="text-xs text-cream/40 font-body break-all">{active.name}</p>
            <p className="text-xs text-cream/30 font-body">
              Reproduzido em loop, mudo e em autoplay como fundo da página inicial.
            </p>
            <button
              onClick={() => handleDelete(active.name, type)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 transition border border-red-500/20 text-xs font-body"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover vídeo
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="p-10 text-center cursor-pointer hover:bg-charcoal-light transition-colors rounded-xl border-2 border-dashed border-gold/15"
        >
          <Icon className="w-8 h-8 text-primary/30 mx-auto mb-3" />
          <p className="text-sm text-cream/40 font-body">Clique para enviar um vídeo (MP4)</p>
          <p className="text-xs text-cream/20 font-body mt-1">Máx 100MB · será exibido em loop como fundo do hero</p>
        </div>
      )}
    </div>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Video className="w-4 h-4 text-primary" />
        </div>
        <h2 className="font-display text-base font-semibold text-cream">Vídeo do Hero</h2>
      </div>

      <VideoBlock
        type="desktop"
        label="Desktop"
        hint="Exibido em telas maiores"
        icon={Monitor}
        active={activeDesktop}
        loading={loadingDesktop}
        uploading={uploadingDesktop}
        inputRef={inputDesktopRef}
      />

      <VideoBlock
        type="mobile"
        label="Mobile"
        hint="Exibido em celulares (opcional)"
        icon={Smartphone}
        active={activeMobile}
        loading={loadingMobile}
        uploading={uploadingMobile}
        inputRef={inputMobileRef}
      />
    </motion.section>
  );
};

export default HeroVideoUpload;
