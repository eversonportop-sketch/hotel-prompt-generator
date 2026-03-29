import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Phone, Mail, Crown, User, Plus, X, Save, Loader2, MapPin, FileText } from "lucide-react";
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
                    <button
                      onClick={() => openEdit(p)}
                      className="text-xs text-white/25 hover:text-primary font-body transition-colors"
                    >
                      Editar
                    </button>
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
    </div>
  );
};

export default AdminClientes;
