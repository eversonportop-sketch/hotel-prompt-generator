import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Phone,
  Mail,
  User,
  Plus,
  X,
  Save,
  Loader2,
  FileText,
  History,
  BedDouble,
  ShoppingCart,
  CalendarPlus,
  Trash2,
  KeyRound,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Client {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  city: string | null;
  created_at: string;
  role: string | null;
}

const emptyForm = {
  full_name: "",
  email: "",
  cpf: "",
  phone: "",
  city: "",
};

const AdminClientes = () => {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [historyClient, setHistoryClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [portalClient, setPortalClient] = useState<Client | null>(null);
  const [portalEmail, setPortalEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [creatingPortal, setCreatingPortal] = useState(false);
  const navigate = useNavigate();

  const qc = useQueryClient();

  /* ── Query: busca clientes operacionais (não admin) ── */
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,phone,cpf,city,created_at,role")
        .neq("role", "admin")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Client[];
    },
  });

  const filtered = clients.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.full_name?.toLowerCase().includes(q) ||
      g.phone?.toLowerCase().includes(q) ||
      g.email?.toLowerCase().includes(q) ||
      g.cpf?.includes(q)
    );
  });

  const openNew = () => {
    setEditClient(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (g: Client) => {
    setEditClient(g);
    setForm({
      full_name: g.full_name || "",
      email: g.email || "",
      cpf: g.cpf || "",
      phone: g.phone || "",
      city: g.city || "",
    });
    setModalOpen(true);
  };

  /* ── Salvar cliente operacional (sem auth) ── */
  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Telefone é obrigatório");
      return;
    }
    if (!form.cpf.trim()) {
      toast.error("CPF/Documento é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        cpf: form.cpf.trim() || null,
        email: form.email.trim() || null,
        city: form.city.trim() || null,
      };

      if (editClient) {
        const { error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", editClient.id);
        if (error) throw error;
        toast.success("Cliente atualizado!");
      } else {
        const { error } = await supabase.from("profiles").insert({
          ...payload,
          id: crypto.randomUUID(),
          role: "guest",
        });
        if (error) throw error;
        toast.success("Cliente cadastrado!");
      }
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      qc.invalidateQueries({ queryKey: ["admin-profiles-select"] });
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      qc.invalidateQueries({ queryKey: ["admin-profiles-select"] });
      toast.success("Cliente excluído.");
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao excluir cliente."),
  });

  const handleNewReservation = (g: Client) => {
    navigate("/admin/reservas", { state: { preselectedGuest: { id: g.id, full_name: g.full_name } } });
  };

  /* ── Criar acesso ao portal (auth) ── */
  const handleCreatePortalAccess = async () => {
    if (!portalClient) return;
    if (!portalEmail.trim()) {
      toast.error("Informe o e-mail para acesso ao portal.");
      return;
    }
    if (!portalPassword.trim() || portalPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setCreatingPortal(true);
    try {
      // Create auth user via Supabase admin invite or signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: portalEmail.trim(),
        password: portalPassword.trim(),
        options: {
          data: {
            full_name: portalClient.full_name,
          },
        },
      });
      if (authError) throw authError;

      // Update the profile to link auth user id and set email
      if (authData.user) {
        // Update the existing operational profile to link the auth id
        await supabase
          .from("profiles")
          .update({ email: portalEmail.trim() })
          .eq("id", portalClient.id);
      }

      toast.success("Acesso ao portal criado! O cliente pode fazer login com o e-mail e senha informados.");
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      setPortalClient(null);
      setPortalEmail("");
      setPortalPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar acesso ao portal.");
    } finally {
      setCreatingPortal(false);
    }
  };

  const field = (
    label: string,
    key: keyof typeof emptyForm,
    placeholder: string,
    icon: React.ReactNode,
    type = "text",
    required = false,
  ) => (
    <div>
      <label className="flex items-center gap-1.5 text-xs text-white/40 font-body uppercase tracking-wider mb-1.5">
        {icon}
        {label} {required && <span className="text-primary">*</span>}
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
            <p className="text-white/30 text-xs mt-0.5 font-body">Cadastro de hóspedes presenciais</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-black text-sm font-body font-semibold hover:brightness-110 transition-all"
          style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)" }}
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">Total</p>
          <p className="font-display text-3xl font-bold text-cream">{clients.length}</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">Cadastrados Hoje</p>
          <p className="font-display text-3xl font-bold text-purple-400">
            {clients.filter((g) => g.created_at?.startsWith(new Date().toISOString().split("T")[0])).length}
          </p>
        </div>
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
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => (
                <motion.tr
                  key={g.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-primary text-sm font-display font-bold">
                          {(g.full_name ?? "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-cream text-sm font-body font-medium">{g.full_name}</p>
                        {g.email && <p className="text-white/30 text-xs font-body">{g.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {g.phone ? (
                      <span className="text-white/50 text-sm font-body flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        {g.phone}
                      </span>
                    ) : (
                      <span className="text-white/20 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-white/40 text-sm font-body">
                      {g.cpf || <span className="text-white/20">—</span>}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-white/40 text-sm font-body">
                      {format(new Date(g.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleNewReservation(g)}
                        className="flex items-center gap-1 text-xs text-white/25 hover:text-primary font-body transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
                        title="Nova Reserva"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Reserva</span>
                      </button>
                      <button
                        onClick={() => {
                          setPortalClient(g);
                          setPortalEmail(g.email || "");
                          setPortalPassword("");
                        }}
                        className="flex items-center gap-1 text-xs text-white/25 hover:text-cyan-400 font-body transition-colors px-2 py-1 rounded-lg hover:bg-cyan-500/10"
                        title="Criar acesso ao portal"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Portal</span>
                      </button>
                      <button
                        onClick={() => setHistoryClient(g)}
                        className="flex items-center gap-1 text-xs text-white/25 hover:text-blue-400 font-body transition-colors px-2 py-1 rounded-lg hover:bg-blue-500/10"
                        title="Histórico"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">Histórico</span>
                      </button>
                      <button
                        onClick={() => openEdit(g)}
                        className="text-xs text-white/25 hover:text-amber-400 font-body transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10"
                        title="Editar"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteId(g.id)}
                        className="text-xs text-white/20 hover:text-red-400 font-body transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <h2 className="font-display text-lg font-semibold text-cream">
                      {editClient ? "Editar Cliente" : "Novo Cliente"}
                    </h2>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-white/25 hover:text-cream transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                  {field("Nome completo", "full_name", "João da Silva", <User className="w-3 h-3" />, "text", true)}
                  <div className="grid grid-cols-2 gap-3">
                    {field("Telefone", "phone", "(51) 99999-9999", <Phone className="w-3 h-3" />, "tel", true)}
                    {field("CPF / Documento", "cpf", "000.000.000-00", <FileText className="w-3 h-3" />, "text", true)}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {field("E-mail", "email", "joao@email.com", <Mail className="w-3 h-3" />, "email")}
                    {field("Cidade", "city", "Porto Alegre", <MapPin className="w-3 h-3" />)}
                  </div>
                  <p className="text-white/20 text-[10px] font-body">
                    Este cadastro é apenas operacional. Para dar acesso ao portal, use o botão "Portal" na lista de clientes.
                  </p>
                </div>

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
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-black text-sm font-body font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)" }}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editClient ? "Salvar Alterações" : "Cadastrar Cliente"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Excluir */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div
              key="del-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              key="del-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl pointer-events-auto p-6 space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-cream">Excluir cliente?</h3>
                    <p className="text-white/30 text-xs font-body mt-0.5">O histórico de reservas será mantido.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="flex-1 py-2.5 text-sm text-white/40 hover:text-cream font-body border border-white/10 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => deleteClient.mutate(deleteId!)}
                    disabled={deleteClient.isPending}
                    className="flex-1 py-2.5 text-sm font-body font-semibold rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25 transition-colors disabled:opacity-50"
                  >
                    {deleteClient.isPending ? "Excluindo..." : "Confirmar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal Criar Acesso ao Portal */}
      <AnimatePresence>
        {portalClient && (
          <>
            <motion.div
              key="portal-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setPortalClient(null)}
            />
            <motion.div
              key="portal-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    <h2 className="font-display text-lg font-semibold text-cream">Criar Acesso ao Portal</h2>
                  </div>
                  <button
                    onClick={() => setPortalClient(null)}
                    className="text-white/25 hover:text-cream transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-primary text-sm font-display font-bold">
                        {(portalClient.full_name ?? "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-cream text-sm font-body font-medium">{portalClient.full_name}</p>
                      <p className="text-white/30 text-xs font-body">Cliente operacional</p>
                    </div>
                  </div>

                  <p className="text-white/30 text-xs font-body">
                    O cliente poderá fazer login no portal com o e-mail e senha informados abaixo.
                  </p>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-white/40 font-body uppercase tracking-wider mb-1.5">
                      <Mail className="w-3 h-3" />
                      E-mail para login <span className="text-primary">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="cliente@email.com"
                      value={portalEmail}
                      onChange={(e) => setPortalEmail(e.target.value)}
                      className="w-full bg-[#1a1a1f] border border-white/10 rounded-lg px-3 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/50 transition placeholder:text-white/20"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-white/40 font-body uppercase tracking-wider mb-1.5">
                      <KeyRound className="w-3 h-3" />
                      Senha <span className="text-primary">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                      className="w-full bg-[#1a1a1f] border border-white/10 rounded-lg px-3 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/50 transition placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
                  <button
                    onClick={() => setPortalClient(null)}
                    className="px-4 py-2 text-sm text-white/40 hover:text-cream font-body transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreatePortalAccess}
                    disabled={creatingPortal}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-body font-semibold transition-all disabled:opacity-50 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25"
                  >
                    {creatingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    {creatingPortal ? "Criando..." : "Criar Acesso"}
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
  confirmed: "Confirmada",
  checked_in: "Hospedado",
  checked_out: "Finalizada",
  canceled: "Cancelada",
};
const statusColors: Record<string, string> = {
  confirmed: "bg-green-500/15 text-green-400 border-green-500/20",
  checked_in: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  checked_out: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  canceled: "bg-red-500/15 text-red-400 border-red-500/20",
};

const ClientHistoryModal = ({ client, onClose }: { client: Client; onClose: () => void }) => {
  const [tab, setTab] = useState<"reservas" | "consumo">("reservas");

  // Busca reservas vinculadas por client_id ou profile_id
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["client-history", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, rooms(name, category, price)")
        .or(`profile_id.eq.${client.id},client_id.eq.${client.id}`)
        .order("check_in", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Busca consumo vinculado às reservas do cliente
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
              <h2 className="font-display text-lg font-semibold text-cream">{client.full_name}</h2>
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
                          {(r.rooms as any)?.category} · R$ {Number((r.rooms as any)?.price || 0).toFixed(0)}/noite
                        </p>
                        <p className="text-white/25 text-xs font-body mt-0.5">
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
