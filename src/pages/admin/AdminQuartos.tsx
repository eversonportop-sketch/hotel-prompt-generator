import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  BedDouble,
  Users,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Images,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

interface Room {
  id: string;
  name: string;
  category: string;
  beds: string;
  capacity: number;
  price: number;
  promotional_price: number | null;
  description: string | null;
  image_url: string | null;
  gallery: string[] | null;
  amenities: string[] | null;
  status: string;
  display_order: number;
}

const EMPTY_FORM = {
  name: "",
  category: "",
  beds: "1 cama de casal",
  capacity: 2,
  price: 0,
  promotional_price: "" as string | number,
  description: "",
  image_url: "",
  gallery_input: "",
  gallery: [] as string[],
  amenities: "",
  display_order: 0,
};

async function uploadRoomImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `rooms/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("hotel-images")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw new Error(`Upload falhou: ${error.message}`);
  const { data } = supabase.storage.from("hotel-images").getPublicUrl(path);
  return data.publicUrl;
}

// ── Componentes externos (fora do AdminQuartos) ────────────────────────────────

const GalleryViewer = ({ images, name }: { images: string[]; name: string }) => {
  const [idx, setIdx] = useState(0);
  if (!images.length)
    return (
      <div className="w-full aspect-[16/9] bg-black/40 flex items-center justify-center rounded-lg">
        <ImagePlus className="w-8 h-8 text-cream/10" />
      </div>
    );
  return (
    <div className="relative aspect-[16/9] rounded-lg overflow-hidden group">
      <img src={images[idx]} alt={name} className="w-full h-full object-cover transition-all duration-500" />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-primary scale-125" : "bg-white/50"}`}
              />
            ))}
          </div>
          <span className="absolute top-2 right-2 bg-black/60 text-xs text-cream/70 px-2 py-0.5 rounded-full font-body">
            <Images className="w-3 h-3 inline mr-1" />
            {images.length}
          </span>
        </>
      )}
    </div>
  );
};

const AdminHeader = () => (
  <header className="bg-charcoal-light border-b border-gold/10 px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <img src={hotelLogo} alt="SB Hotel" className="h-10 w-auto object-contain" />
      <span className="text-cream/40 text-xs font-body">Admin</span>
    </div>
    <Link to="/" className="text-cream/50 text-sm font-body hover:text-primary transition-colors">
      Ver Site →
    </Link>
  </header>
);

interface RoomModalProps {
  editingRoom: Room | null;
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  uploadingFile: boolean;
  filePreviewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onClose: () => void;
  onSubmit: () => void;
  onAddGalleryImage: () => void;
  onRemoveGalleryImage: (url: string) => void;
  isPending: boolean;
}

const RoomModal = ({
  editingRoom,
  form,
  setForm,
  uploadingFile,
  filePreviewUrl,
  fileInputRef,
  onClose,
  onSubmit,
  onAddGalleryImage,
  onRemoveGalleryImage,
  isPending,
}: RoomModalProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-charcoal border border-gold/20 rounded-2xl w-full max-w-2xl shadow-2xl"
    >
      <div className="flex items-center justify-between p-6 border-b border-gold/10">
        <h2 className="font-display text-xl font-bold text-cream">{editingRoom ? "Editar Quarto" : "Novo Quarto"}</h2>
        <button onClick={onClose} className="text-cream/40 hover:text-cream">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Nome *</label>
            <input
              className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Suíte Master"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">
              Categoria / Grupo (opcional)
            </label>
            <input
              className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Ex: Geral, Família, Vista Mar…"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Camas</label>
            <input
              className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
              value={form.beds}
              onChange={(e) => setForm((f) => ({ ...f, beds: e.target.value }))}
              placeholder="Ex: 1 cama de casal"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Capacidade</label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
              value={form.capacity}
              onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Ordem de exibição</label>
            <input
              type="number"
              min={0}
              className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
              value={form.display_order}
              onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">
              Tarifa mínima — 1 pessoa (R$) *
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
              value={form.price === 0 ? "" : form.price}
              placeholder="0,00"
              onFocus={(e) => e.target.select()}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value === "" ? 0 : Number(e.target.value) }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">
              Adicional por pessoa (R$)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
              value={form.promotional_price}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setForm((f) => ({ ...f, promotional_price: e.target.value }))}
              placeholder="Vazio = sem adicional"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Galeria de fotos</label>
            <div
              onClick={() => !uploadingFile && fileInputRef.current?.click()}
              className={`relative cursor-pointer border-2 border-dashed rounded-xl transition-all mb-3 ${uploadingFile ? "border-primary/40 bg-primary/5" : "border-gold/20 hover:border-primary/40"}`}
            >
              {filePreviewUrl && uploadingFile ? (
                <div className="relative h-24 overflow-hidden rounded-xl">
                  <img src={filePreviewUrl} alt="" className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="ml-2 text-cream text-sm font-body">Enviando...</span>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-cream/60 text-sm font-body">Clique para enviar foto do PC</p>
                    <p className="text-cream/30 text-xs font-body">JPG, PNG, WebP · Máx 10 MB</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                value={form.gallery_input}
                onChange={(e) => setForm((f) => ({ ...f, gallery_input: e.target.value }))}
                placeholder="Ou cole uma URL: https://exemplo.com/foto.jpg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddGalleryImage();
                  }
                }}
              />
              <button
                type="button"
                onClick={onAddGalleryImage}
                className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.gallery.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                {form.gallery.map((url, i) => (
                  <div
                    key={i}
                    className={`relative group rounded-lg overflow-hidden border-2 transition ${url === form.image_url ? "border-primary" : "border-gold/20"}`}
                  >
                    <img src={url} alt="" className="w-full h-16 object-cover" />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                      {url !== form.image_url && (
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, image_url: url }))}
                          className="text-xs text-primary font-body bg-black/80 px-1.5 py-0.5 rounded w-full text-center"
                        >
                          Capa
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemoveGalleryImage(url)}
                        className="text-xs text-red-400 font-body bg-black/80 px-1.5 py-0.5 rounded w-full text-center"
                      >
                        Remover
                      </button>
                    </div>
                    {url === form.image_url && (
                      <span className="absolute top-0.5 left-0.5 text-xs bg-primary text-black px-1 py-0.5 rounded font-body leading-none">
                        ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Descrição</label>
            <textarea
              rows={3}
              className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition resize-none"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descreva o quarto..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">
              Comodidades <span className="normal-case text-cream/30">(separadas por vírgula)</span>
            </label>
            <input
              className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
              value={form.amenities}
              onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value }))}
              placeholder="Wi-Fi, Ar-condicionado, TV, Frigobar"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gold/20 text-cream/60 hover:text-cream rounded-lg py-3 text-sm font-body transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || uploadingFile}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm rounded-lg py-3 hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {editingRoom ? "Salvar alterações" : "Criar quarto"}
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  </motion.div>
);

const DeleteConfirm = ({
  onCancel,
  onConfirm,
  isPending,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) => (
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
      <h3 className="font-display text-xl font-bold text-cream mb-2">Excluir quarto?</h3>
      <p className="text-cream/50 text-sm font-body mb-6">Esta ação não pode ser desfeita.</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 border border-gold/20 text-cream/60 rounded-lg py-2.5 text-sm transition hover:text-cream"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={isPending}
          className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50"
        >
          {isPending ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ── Componente principal ───────────────────────────────────────────────────────
const AdminQuartos = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rooms").select("*").order("name");
      if (error) throw error;
      return data as Room[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const allImages = [
        ...(form.image_url ? [form.image_url] : []),
        ...form.gallery.filter((u) => u !== form.image_url),
      ];
      const payload = {
        name: form.name,
        category: form.category,
        beds: form.beds,
        capacity: Number(form.capacity),
        price: Number(form.price),
        promotional_price: form.promotional_price !== "" ? Number(form.promotional_price) : null,
        description: form.description || null,
        image_url: allImages[0] || null,
        gallery: allImages,
        amenities: form.amenities
          ? form.amenities
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
        display_order: Number(form.display_order),
      };
      if (editingRoom) {
        const { error } = await supabase.from("rooms").update(payload).eq("id", editingRoom.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rooms").insert({ ...payload, status: "active" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingRoom ? "Quarto atualizado!" : "Quarto criado!");
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      closeModal();
    },
    onError: () => toast.error("Erro ao salvar quarto."),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("rooms")
        .update({ status: status === "active" ? "inactive" : "active" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quarto excluído.");
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setDeleteConfirm(null);
      if (view === "detail") {
        setView("list");
        setSelectedRoom(null);
      }
    },
    onError: () => toast.error("Erro ao excluir."),
  });

  const openCreate = () => {
    setEditingRoom(null);
    setForm(EMPTY_FORM);
    setFilePreviewUrl(null);
    setModalOpen(true);
  };
  const openEdit = (room: Room) => {
    setEditingRoom(room);
    const gallery = room.gallery?.length ? room.gallery : room.image_url ? [room.image_url] : [];
    setForm({
      name: room.name,
      category: room.category,
      beds: room.beds,
      capacity: room.capacity,
      price: room.price,
      promotional_price: room.promotional_price ?? "",
      description: room.description ?? "",
      image_url: room.image_url ?? "",
      gallery_input: "",
      gallery,
      amenities: (room.amenities ?? []).join(", "),
      display_order: room.display_order,
    });
    setFilePreviewUrl(null);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingRoom(null);
    setForm(EMPTY_FORM);
    setFilePreviewUrl(null);
  };

  const addGalleryImage = () => {
    const url = form.gallery_input.trim();
    if (!url) return;
    if (form.gallery.includes(url)) {
      toast.error("Imagem já adicionada.");
      return;
    }
    setForm((f) => {
      const g = [...f.gallery, url];
      return { ...f, gallery: g, gallery_input: "", image_url: f.image_url || url };
    });
  };

  const removeGalleryImage = (url: string) => {
    setForm((f) => {
      const g = f.gallery.filter((u) => u !== url);
      return { ...f, gallery: g, image_url: f.image_url === url ? (g[0] ?? "") : f.image_url };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem (JPG, PNG, WebP…)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10 MB.");
      return;
    }
    setFilePreviewUrl(URL.createObjectURL(file));
    setUploadingFile(true);
    try {
      const publicUrl = await uploadRoomImage(file);
      setForm((f) => {
        const g = [...f.gallery, publicUrl];
        return { ...f, gallery: g, gallery_input: "", image_url: f.image_url || publicUrl };
      });
      toast.success("Imagem adicionada à galeria!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer upload.");
    } finally {
      setUploadingFile(false);
      setFilePreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (view === "detail" && selectedRoom) {
    const room = rooms.find((r) => r.id === selectedRoom.id) ?? selectedRoom;
    const images = room.gallery?.length ? room.gallery : room.image_url ? [room.image_url] : [];
    return (
      <div className="min-h-screen bg-charcoal">
        <AdminHeader />
        <div className="p-6 md:p-10 max-w-4xl">
          <div className="flex items-center gap-2 mb-8">
            <button
              onClick={() => {
                setView("list");
                setSelectedRoom(null);
              }}
              className="inline-flex items-center gap-2 text-cream/50 hover:text-primary text-sm font-body transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Quartos
            </button>
            <span className="text-cream/20">/</span>
            <span className="text-cream/60 text-sm font-body">{room.name}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <GalleryViewer images={images} name={room.name} />
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="w-16 h-12 object-cover rounded shrink-0 border border-gold/20 cursor-pointer hover:border-primary/50 transition"
                    />
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-body ${room.status === "active" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
                >
                  {room.status === "active" ? "Ativo" : "Inativo"}
                </span>
                <span className="text-xs text-primary font-body tracking-widest uppercase">{room.category}</span>
              </div>
              <h1 className="font-display text-3xl font-bold text-cream mt-1 mb-3">{room.name}</h1>
              <div className="flex items-center gap-4 text-sm text-cream/50 mb-4">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {room.capacity} pessoas
                </span>
                <span className="flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4" />
                  {room.beds}
                </span>
              </div>
              {room.description && (
                <p className="text-cream/50 font-body text-sm leading-relaxed mb-4">{room.description}</p>
              )}
              <div className="mb-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-bold text-primary">
                    R$ {Number(room.price).toFixed(0)}
                  </span>
                  <span className="text-sm text-cream/30">/noite (1 pessoa)</span>
                </div>
                {room.promotional_price && (
                  <div className="text-sm text-primary/70 mt-1">
                    + R$ {Number(room.promotional_price).toFixed(0)} por pessoa adicional
                  </div>
                )}
              </div>
              {room.amenities && room.amenities.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-widest text-cream/30 mb-2 font-body">Comodidades</p>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((a) => (
                      <span
                        key={a}
                        className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-body"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t border-gold/10">
                <button
                  onClick={() => openEdit(room)}
                  className="flex-1 flex items-center justify-center gap-2 border border-gold/20 text-cream/60 hover:text-primary hover:border-primary/40 rounded-lg py-2.5 text-sm transition-all"
                >
                  <Pencil className="w-4 h-4" /> Editar
                </button>
                <button
                  onClick={() => toggleMutation.mutate({ id: room.id, status: room.status })}
                  className="flex-1 flex items-center justify-center gap-2 border border-gold/20 text-cream/60 hover:text-yellow-400 hover:border-yellow-400/40 rounded-lg py-2.5 text-sm transition-all"
                >
                  {room.status === "active" ? (
                    <>
                      <ToggleRight className="w-4 h-4" /> Desativar
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" /> Ativar
                    </>
                  )}
                </button>
                <button
                  onClick={() => setDeleteConfirm(room.id)}
                  className="flex items-center justify-center border border-gold/20 text-cream/40 hover:text-red-400 hover:border-red-400/40 rounded-lg px-3 py-2.5 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        <AnimatePresence>
          {modalOpen && (
            <RoomModal
              editingRoom={editingRoom}
              form={form}
              setForm={setForm}
              uploadingFile={uploadingFile}
              filePreviewUrl={filePreviewUrl}
              fileInputRef={fileInputRef}
              onClose={closeModal}
              onSubmit={() => saveMutation.mutate()}
              onAddGalleryImage={addGalleryImage}
              onRemoveGalleryImage={removeGalleryImage}
              isPending={saveMutation.isPending}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {deleteConfirm && (
            <DeleteConfirm
              onCancel={() => setDeleteConfirm(null)}
              onConfirm={() => deleteMutation.mutate(deleteConfirm!)}
              isPending={deleteMutation.isPending}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal">
      <AdminHeader />
      <div className="p-6 md:p-10">
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
              <BedDouble className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold text-cream">Quartos</h1>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Quarto
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: rooms.length, color: "text-cream" },
            { label: "Ativos", value: rooms.filter((r) => r.status === "active").length, color: "text-green-400" },
            { label: "Inativos", value: rooms.filter((r) => r.status !== "active").length, color: "text-red-400" },
            {
              label: "Menor preço",
              value: rooms.length ? `R$ ${Math.min(...rooms.map((r) => r.price)).toFixed(0)}` : "—",
              color: "text-primary",
            },
          ].map((s) => (
            <div key={s.label} className="bg-charcoal-light border border-gold/10 rounded-xl p-4">
              <p className="text-cream/40 text-xs font-body uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
        {isLoading ? (
          <div className="text-center py-20 text-cream/30 font-body">Carregando quartos...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <BedDouble className="w-12 h-12 text-primary/20 mx-auto mb-4" />
            <p className="text-cream/30 font-body">Nenhum quarto cadastrado.</p>
            <button onClick={openCreate} className="mt-4 text-primary text-sm hover:underline font-body">
              Cadastrar primeiro quarto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {rooms.map((room, i) => {
              const images = room.gallery?.length ? room.gallery : room.image_url ? [room.image_url] : [];
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-charcoal-light border rounded-xl overflow-hidden ${room.status === "active" ? "border-gold/15" : "border-red-900/30 opacity-60"}`}
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedRoom(room);
                      setView("detail");
                    }}
                  >
                    <div className="aspect-[16/9] relative overflow-hidden bg-black/40">
                      {images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={room.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImagePlus className="w-8 h-8 text-cream/10" />
                        </div>
                      )}
                      <span
                        className={`absolute top-3 right-3 text-xs font-body px-2 py-1 rounded-full ${room.status === "active" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}
                      >
                        {room.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                      {images.length > 1 && (
                        <span className="absolute bottom-3 right-3 bg-black/60 text-xs text-cream/70 px-2 py-0.5 rounded-full font-body">
                          <Images className="w-3 h-3 inline mr-1" />
                          {images.length} fotos
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <span className="text-xs text-primary font-body tracking-widest uppercase">{room.category}</span>
                    <h3
                      className="font-display text-lg font-semibold text-cream mt-1 mb-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        setSelectedRoom(room);
                        setView("detail");
                      }}
                    >
                      {room.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-cream/40 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {room.capacity} pessoas
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5" />
                        {room.beds}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xl font-display font-bold text-primary">
                        R$ {Number(room.price).toFixed(0)}
                      </span>
                      <span className="text-xs text-cream/30">/noite (1 pessoa)</span>
                    </div>
                    {room.promotional_price && (
                      <div className="text-xs text-primary/70 mb-3">
                        + R$ {Number(room.promotional_price).toFixed(0)} por pessoa adicional
                      </div>
                    )}
                    {!room.promotional_price && <div className="mb-4" />}
                    <div className="flex items-center gap-2 pt-4 border-t border-gold/10">
                      <button
                        onClick={() => openEdit(room)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs text-cream/60 hover:text-primary border border-gold/15 hover:border-primary/40 rounded-lg py-2 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate({ id: room.id, status: room.status })}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs text-cream/60 hover:text-yellow-400 border border-gold/15 hover:border-yellow-400/40 rounded-lg py-2 transition-all"
                      >
                        {room.status === "active" ? (
                          <>
                            <ToggleRight className="w-3.5 h-3.5" /> Desativar
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5" /> Ativar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(room.id)}
                        className="flex items-center justify-center text-xs text-cream/40 hover:text-red-400 border border-gold/15 hover:border-red-400/40 rounded-lg p-2 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
      <AnimatePresence>
        {modalOpen && (
          <RoomModal
            editingRoom={editingRoom}
            form={form}
            setForm={setForm}
            uploadingFile={uploadingFile}
            filePreviewUrl={filePreviewUrl}
            fileInputRef={fileInputRef}
            onClose={closeModal}
            onSubmit={() => saveMutation.mutate()}
            onAddGalleryImage={addGalleryImage}
            onRemoveGalleryImage={removeGalleryImage}
            isPending={saveMutation.isPending}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirm
            onCancel={() => setDeleteConfirm(null)}
            onConfirm={() => deleteMutation.mutate(deleteConfirm!)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminQuartos;
