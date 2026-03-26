import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Pencil, Trash2, BedDouble,
  Users, ToggleLeft, ToggleRight, X, Save, ImagePlus
} from "lucide-react";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

// ─── tipos ───────────────────────────────────────────────────────────────────
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
  amenities: string[] | null;
  status: string;
  display_order: number;
}

const EMPTY_FORM = {
  name: "",
  category: "Standard",
  beds: "1 cama de casal",
  capacity: 2,
  price: 0,
  promotional_price: "",
  description: "",
  image_url: "",
  amenities: "",
  display_order: 0,
};

const CATEGORIES = ["Standard", "Luxo", "Super Luxo", "Suite", "Suite Master"];

// ─── componente ──────────────────────────────────────────────────────────────
const AdminQuartos = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── queries ──
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Room[];
    },
  });

  // ── mutations ──
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof EMPTY_FORM) => {
      const data = {
        name: payload.name,
        category: payload.category,
        beds: payload.beds,
        capacity: Number(payload.capacity),
        price: Number(payload.price),
        promotional_price: payload.promotional_price !== "" ? Number(payload.promotional_price) : null,
        description: payload.description || null,
        image_url: payload.image_url || null,
        amenities: payload.amenities
          ? payload.amenities.split(",").map((a) => a.trim()).filter(Boolean)
          : [],
        display_order: Number(payload.display_order),
      };

      if (editingRoom) {
        const { error } = await supabase.from("rooms").update(data).eq("id", editingRoom.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rooms").insert({ ...data, status: "active" });
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

  const toggleStatusMutation = useMutation({
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
    },
    onError: () => toast.error("Erro ao excluir quarto."),
  });

  // ── helpers ──
  const openCreate = () => {
    setEditingRoom(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      category: room.category,
      beds: room.beds,
      capacity: room.capacity,
      price: room.price,
      promotional_price: room.promotional_price != null ? String(room.promotional_price) : "",
      description: room.description ?? "",
      image_url: room.image_url ?? "",
      amenities: (room.amenities ?? []).join(", "),
      display_order: room.display_order,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRoom(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error("Nome e preço são obrigatórios.");
      return;
    }
    saveMutation.mutate(form);
  };

  // ── render ──
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
        {/* Breadcrumb + ação */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-cream/50 hover:text-primary text-sm font-body transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
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
            <Plus className="w-4 h-4" />
            Novo Quarto
          </button>
        </div>

        {/* Resumo */}
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

        {/* Lista */}
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
            {rooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-charcoal-light border rounded-xl overflow-hidden transition-all ${
                  room.status === "active" ? "border-gold/15" : "border-red-900/30 opacity-60"
                }`}
              >
                {/* Imagem */}
                <div className="aspect-[16/9] bg-black/40 relative overflow-hidden">
                  {room.image_url ? (
                    <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImagePlus className="w-8 h-8 text-cream/10" />
                    </div>
                  )}
                  <span
                    className={`absolute top-3 right-3 text-xs font-body px-2 py-1 rounded-full ${
                      room.status === "active"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {room.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {/* Conteúdo */}
                <div className="p-5">
                  <span className="text-xs text-primary font-body tracking-widest uppercase">{room.category}</span>
                  <h3 className="font-display text-lg font-semibold text-cream mt-1 mb-2">{room.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-cream/40 mb-4">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{room.capacity} pessoas</span>
                    <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{room.beds}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xl font-display font-bold text-primary">
                        R$ {Number(room.promotional_price || room.price).toFixed(0)}
                      </span>
                      {room.promotional_price && (
                        <span className="text-xs text-cream/30 line-through ml-2">R$ {Number(room.price).toFixed(0)}</span>
                      )}
                      <span className="text-xs text-cream/30"> /noite</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gold/10">
                    <button
                      onClick={() => openEdit(room)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs text-cream/60 hover:text-primary border border-gold/15 hover:border-primary/40 rounded-lg py-2 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => toggleStatusMutation.mutate({ id: room.id, status: room.status })}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs text-cream/60 hover:text-yellow-400 border border-gold/15 hover:border-yellow-400/40 rounded-lg py-2 transition-all"
                    >
                      {room.status === "active" ? (
                        <><ToggleRight className="w-3.5 h-3.5" /> Desativar</>
                      ) : (
                        <><ToggleLeft className="w-3.5 h-3.5" /> Ativar</>
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
            ))}
          </div>
        )}
      </div>

      {/* ── Modal criar/editar ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-charcoal border border-gold/20 rounded-2xl w-full max-w-2xl shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-gold/10">
                <h2 className="font-display text-xl font-bold text-cream">
                  {editingRoom ? "Editar Quarto" : "Novo Quarto"}
                </h2>
                <button onClick={closeModal} className="text-cream/40 hover:text-cream transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Nome *</label>
                    <input
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Suíte Master"
                      required
                    />
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Categoria</label>
                    <select
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Camas */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Camas</label>
                    <input
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.beds}
                      onChange={(e) => setForm({ ...form, beds: e.target.value })}
                      placeholder="Ex: 2 camas de solteiro"
                    />
                  </div>

                  {/* Capacidade */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Capacidade</label>
                    <input
                      type="number" min={1} max={20}
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    />
                  </div>

                  {/* Ordem */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Ordem de exibição</label>
                    <input
                      type="number" min={0}
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.display_order}
                      onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                    />
                  </div>

                  {/* Preço */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Preço / noite (R$) *</label>
                    <input
                      type="number" min={0} step="0.01"
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      required
                    />
                  </div>

                  {/* Preço promocional */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Preço promocional (R$)</label>
                    <input
                      type="number" min={0} step="0.01"
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.promotional_price}
                      onChange={(e) => setForm({ ...form, promotional_price: e.target.value })}
                      placeholder="Deixe vazio para sem promoção"
                    />
                  </div>

                  {/* URL da imagem */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">URL da imagem</label>
                    <input
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                    {form.image_url && (
                      <img src={form.image_url} alt="preview" className="mt-2 h-24 w-full object-cover rounded-lg opacity-80" />
                    )}
                  </div>

                  {/* Descrição */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Descrição</label>
                    <textarea
                      rows={3}
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition resize-none"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Descreva o quarto..."
                    />
                  </div>

                  {/* Comodidades */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">
                      Comodidades <span className="normal-case text-cream/30">(separadas por vírgula)</span>
                    </label>
                    <input
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={form.amenities}
                      onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                      placeholder="Wi-Fi, Ar-condicionado, TV, Frigobar"
                    />
                  </div>
                </div>

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
                    disabled={saveMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm rounded-lg py-3 hover:scale-[1.01] transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saveMutation.isPending ? "Salvando..." : editingRoom ? "Salvar alterações" : "Criar quarto"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal confirmar exclusão ── */}
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
              <h3 className="font-display text-xl font-bold text-cream mb-2">Excluir quarto?</h3>
              <p className="text-cream/50 text-sm font-body mb-6">
                Esta ação não pode ser desfeita. O quarto será removido permanentemente.
              </p>
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

export default AdminQuartos;
