import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Phone,
  Mail,
  Crown,
  User,
  Plus,
  X,
  Save,
  Loader2,
  MapPin,
  FileText,
  History,
  BedDouble,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  cpf?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
}

const emptyForm = {
  full_name: "",
  email: "",
  cpf: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  role: "guest",
};

const AdminClientes = () => {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [historyClient, setHistoryClient] = useState<Profile | null>(null);

  const qc = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.cpf?.includes(q)
    );
  });

  const total = profiles.length;
  const admins = profiles.filter((p) => p.role === "admin").length;
  const clients = total - admins;

  const openNew = () => {
    setEditProfile(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (p: Profile) => {
    setEditProfile(p);
    setForm({
      full_name: p.full_name || "",
      email: p.email || "",
      cpf: p.cpf || "",
      phone: p.phone || "",
      address: p.address || "",
      city: p.city || "",
      state: p.state || "",
      role: p.role || "guest",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      if (editProfile) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: form.full_name,
            phone: form.phone || null,
            cpf: form.cpf || null,
            email: form.email || null,
            address: form.address || null,
            city: form.city || null,
            state: form.state || null,
            role: form.role,
          })
          .eq("id", editProfile.id);
        if (error) throw error;
        toast.success("Cliente atualizado!");
      } else {
        // Criar novo cliente direto na tabela profiles (sem auth)
        const newId = crypto.randomUUID();
        const { error } = await supabase.from("profiles").insert({
          id: newId,
          full_name: form.full_name,
          phone: form.phone || null,
          cpf: form.cpf || null,
          email: form.email || null,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          role: form.role,
        });
        if (error) throw error;
        toast.success("Cliente cadastrado!");
      }
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof typeof emptyForm,
    placeholder: string,
    icon: React.ReactNode,
    type = "text",
  ) => (
    <div>
      <label className="flex items-center gap-1.5 text-xs text-white/40 font-body uppercase tracking-wider mb-1.5">
        {icon}
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-[#1a1a1f] border border-white/10 rounded-lg px-3 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/50 transition placeholder:text-white/20"
      />
    </div>
  );

  return (
    <div className="p-6 md:p-8 space-y-6 text-cream">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-cream leading-none">Clientes</h1>
            <p className="text-white/30 text-xs mt-0.5 font-body">Cadastro e gestão de hóspedes</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-body font-medium hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: total, color: "text-cream", bg: "bg-white/5", border: "border-white/10" },
          {
            label: "Hóspedes",
            value: clients,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/20",
          },
          {
            label: "Admins",
            value: admins,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20",
          },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
            <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          className="w-full bg-charcoal-light border border-white/5 rounded-xl pl-11 pr-4 py-3 text-cream text-sm focus:border-primary/40 focus:outline-none transition placeholder:text-white/20 font-body"
          placeholder="Buscar por nome, telefone, email, CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-white/20 font-body gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-primary/20 mx-auto mb-4" />
          <p className="text-white/30 font-body">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="bg-charcoal-light border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-white/25 font-body">
                  Cliente
                </th>
                <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-white/25 font-body hidden md:table-cell">
                  Contato
                </th>
                <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-white/25 font-body hidden lg:table-cell">
                  CPF
                </th>
                <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-white/25 font-body hidden md:table-cell">
                  Cadastro
                </th>
                <th className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-white/25 font-body">
                  Perfil
                </th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-primary text-sm font-display font-bold">
                          {(p.full_name ?? "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-cream text-sm font-body font-medium">{p.full_name ?? "Sem nome"}</p>
                        {p.email && <p className="text-white/30 text-xs font-body">{p.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex flex-col gap-1">
                      {p.phone ? (
                        <span className="text-white/50 text-sm font-body flex items-center gap-1.5">
                          <Phone className="w-3 h-3" />
                          {p.phone}
                        </span>
                      ) : (
                        <span className="text-white/20 text-sm">—</span>
                      )}
                      {p.city && (
                        <span className="text-white/30 text-xs font-body flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {p.city}
                          {p.state ? `, ${p.state}` : ""}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-white/40 text-sm font-body">
                      {p.cpf || <span className="text-white/20">—</span>}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-white/40 text-sm font-body">
                      {format(new Date(p.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-body ${
                        p.role === "admin"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}
                    >
                      {p.role === "admin" ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {p.role === "admin" ? "Admin" : "Hóspede"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setHistoryClient(p)}
                        className="text-xs text-white/25 hover:text-blue-400 font-body transition-colors flex items-center gap-1"
                      >
                        <History className="w-3 h-3" />
                        Histórico
                      </button>
                      <button
                        onClick={() => openEdit(p)}
                        className="text-xs text-white/25 hover:text-primary font-body transition-colors"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de cadastro / edição */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl pointer-events-auto overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header modal */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <h2 className="font-display text-lg font-semibold text-cream">
                      {editProfile ? "Editar Cliente" : "Novo Cliente"}
                    </h2>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-white/25 hover:text-cream transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Campos */}
                <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                  {field("Nome completo", "full_name", "João da Silva", <User className="w-3 h-3" />)}
                  {field("E-mail", "email", "joao@email.com", <Mail className="w-3 h-3" />, "email")}

                  <div className="grid grid-cols-2 gap-3">
                    {field("CPF", "cpf", "000.000.000-00", <FileText className="w-3 h-3" />)}
                    {field("Telefone", "phone", "(51) 99999-9999", <Phone className="w-3 h-3" />, "tel")}
                  </div>

                  {field("Endereço", "address", "Rua das Flores, 123", <MapPin className="w-3 h-3" />)}

                  <div className="grid grid-cols-2 gap-3">
                    {field("Cidade", "city", "Butiá", <MapPin className="w-3 h-3" />)}
                    {field("Estado", "state", "RS", <MapPin className="w-3 h-3" />)}
                  </div>

                  {/* Perfil */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-white/40 font-body uppercase tracking-wider mb-1.5">
                      <Crown className="w-3 h-3" /> Perfil
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      className="w-full bg-[#1a1a1f] border border-white/10 rounded-lg px-3 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/50 transition"
                    >
                      <option value="guest">Hóspede</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                {/* Footer modal */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-sm text-white/40 hover:text-cream font-body transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-body font-medium hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editProfile ? "Salvar Alterações" : "Cadastrar Cliente"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Histórico do Cliente */}
      <AnimatePresence>
        {historyClient && <ClientHistoryModal client={historyClient} onClose={() => setHistoryClient(null)} />}
      </AnimatePresence>
    </div>
  );
};

/* ── Modal de histórico ─────────────────────────────────────────────────────── */
const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  completed: "Concluída",
  canceled: "Cancelada",
};
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  confirmed: "bg-green-500/15 text-green-400 border-green-500/20",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  canceled: "bg-red-500/15 text-red-400 border-red-500/20",
};

const ClientHistoryModal = ({ client, onClose }: { client: Profile; onClose: () => void }) => {
  const [tab, setTab] = useState<"reservas" | "consumo">("reservas");

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["client-history", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, rooms(name, category)")
        .eq("client_id", client.id)
        .order("check_in", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["client-orders", client.id],
    queryFn: async () => {
      if (!reservations.length) return [];
      const ids = reservations.map((r: any) => r.id);
      const { data, error } = await supabase
        .from("consumption_orders")
        .select("*")
        .in("reservation_id", ids)
        .order("created_at", { ascending: false });
      if (error) return [];
      return data;
    },
    enabled: reservations.length > 0,
  });

  const totalReservas = reservations.reduce((s: number, r: any) => s + Number(r.total_price || 0), 0);
  const totalConsumo = orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
  const totalGeral = totalReservas + totalConsumo;

  return (
    <>
      <motion.div
        key="hist-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="hist-modal"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 60 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-[#0e0e11] border-l border-white/10 flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-primary text-sm font-display font-bold">
                {(client.full_name ?? "?")[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-cream">{client.full_name ?? "Cliente"}</h2>
              <p className="text-white/30 text-xs font-body">Histórico completo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/25 hover:text-cream transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPIs rápidos */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-white/5">
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-white/30 text-[10px] uppercase tracking-wider font-body mb-1">Estadias</p>
            <p className="text-cream font-display text-2xl font-bold">{reservations.length}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-white/30 text-[10px] uppercase tracking-wider font-body mb-1">Hospedagem</p>
            <p className="text-primary font-display text-lg font-bold">
              R$ {totalReservas.toFixed(2).replace(".", ",")}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-white/30 text-[10px] uppercase tracking-wider font-body mb-1">Total geral</p>
            <p className="text-green-400 font-display text-lg font-bold">
              R$ {totalGeral.toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-white/5">
          <button
            onClick={() => setTab("reservas")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-body transition-all ${
              tab === "reservas"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            <BedDouble className="w-3.5 h-3.5" />
            Reservas ({reservations.length})
          </button>
          <button
            onClick={() => setTab("consumo")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-body transition-all ${
              tab === "consumo"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Consumo ({orders.length})
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-white/20 font-body gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : tab === "reservas" ? (
            reservations.length === 0 ? (
              <div className="text-center py-16">
                <BedDouble className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/25 font-body text-sm">Nenhuma reserva encontrada</p>
              </div>
            ) : (
              reservations.map((r: any) => {
                const nights = Math.max(
                  1,
                  Math.round((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 86400000),
                );
                const roomOrders = orders.filter((o: any) => o.reservation_id === r.id);
                const consumoRes = roomOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
                return (
                  <div key={r.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-cream font-body font-medium text-sm">{(r.rooms as any)?.name ?? "Quarto"}</p>
                        <p className="text-white/30 text-xs font-body mt-0.5">
                          {format(new Date(r.check_in + "T12:00:00"), "dd MMM yyyy", { locale: ptBR })}
                          {" → "}
                          {format(new Date(r.check_out + "T12:00:00"), "dd MMM yyyy", { locale: ptBR })}
                          {" · "}
                          {nights}n
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full border font-body ${
                          statusColors[r.status] ?? "bg-white/10 text-white/40 border-white/10"
                        }`}
                      >
                        {statusLabels[r.status] ?? r.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-body border-t border-white/5 pt-3">
                      <span className="text-white/30">
                        Diárias:{" "}
                        <span className="text-white/60">R$ {Number(r.total_price).toFixed(2).replace(".", ",")}</span>
                      </span>
                      {consumoRes > 0 && (
                        <span className="text-white/30">
                          Consumo:{" "}
                          <span className="text-amber-400">+ R$ {consumoRes.toFixed(2).replace(".", ",")}</span>
                        </span>
                      )}
                      <span className="text-primary font-medium">
                        Total: R$ {(Number(r.total_price) + consumoRes).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    {/* Consumos dessa reserva */}
                    {roomOrders.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                        {roomOrders.map((o: any) => (
                          <div key={o.id} className="flex justify-between text-xs font-body text-white/30">
                            <span>
                              {o.item_name} × {o.quantity}
                            </span>
                            <span className="text-white/50">R$ {Number(o.total).toFixed(2).replace(".", ",")}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : orders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/25 font-body text-sm">Nenhum pedido de consumo</p>
            </div>
          ) : (
            orders.map((o: any) => (
              <div
                key={o.id}
                className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-cream text-sm font-body">
                    {o.item_name} × {o.quantity}
                  </p>
                  <p className="text-white/25 text-xs font-body mt-0.5">
                    {format(new Date(o.created_at), "dd/MM/yyyy HH:mm")} · {o.room_number}
                  </p>
                </div>
                <p className="text-primary text-sm font-body font-medium">
                  R$ {Number(o.total).toFixed(2).replace(".", ",")}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer com total */}
        {tab === "consumo" && orders.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-white/30 text-sm font-body">Total em consumo</span>
            <span className="text-amber-400 font-display text-lg font-bold">
              R$ {totalConsumo.toFixed(2).replace(".", ",")}
            </span>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default AdminClientes;
