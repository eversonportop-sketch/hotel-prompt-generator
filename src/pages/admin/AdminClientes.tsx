import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Cliente {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  rg: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
  source: "guest" | "profile";
  reservations_count?: number;
}

const goldBg = { background: "linear-gradient(135deg,#C9A84C,#E5C97A)" };
const fmt = (d: string) => format(new Date(d), "dd MMM yyyy", { locale: ptBR });

const maskCPF = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const maskRG = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 9)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1})$/, "$1-$2");

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
};

const Field = ({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="text-[10px] text-white/30 font-body uppercase tracking-widest block mb-1.5">{label}</label>
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/[0.03] border border-white/8 rounded-lg px-3.5 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/15"
    />
  </div>
);

const AdminClientes = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [editData, setEditData] = useState({
    full_name: "",
    phone: "",
    cpf: "",
    rg: "",
    email: "",
    nationality: "Brasileira",
    address: "",
    city: "",
    state: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<{ id: string; source: "guest" | "profile"; name: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "name">("date");

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes-lista"],
    queryFn: async () => {
      const [g, p] = await Promise.all([
        supabase
          .from("guests")
          .select("id,full_name,email,phone,cpf,rg,nationality,address,city,state,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id,full_name,phone,cpf,created_at")
          .neq("role", "admin")
          .order("created_at", { ascending: false }),
      ]);
      // Contar reservas por guest
      const { data: reservas } = await supabase.from("reservations").select("guest_id, profile_id");
      const countMap: Record<string, number> = {};
      (reservas || []).forEach((r: any) => {
        const ref = r.guest_id || r.profile_id;
        if (ref) countMap[ref] = (countMap[ref] || 0) + 1;
      });

      // IDs de guests que já foram migrados para um profile (reservas com profile_id preenchido)
      const migratedGuestIds = new Set(
        (reservas || []).filter((r: any) => r.guest_id && r.profile_id).map((r: any) => r.guest_id as string),
      );

      const guests: Cliente[] = (g.data || [])
        .filter((x: any) => !migratedGuestIds.has(x.id))
        .map((x: any) => ({
          ...x,
          source: "guest" as const,
          reservations_count: countMap[x.id] || 0,
        }));
      const profiles: Cliente[] = (p.data || []).map((x: any) => ({
        ...x,
        email: null,
        rg: null,
        nationality: null,
        address: null,
        city: null,
        state: null,
        source: "profile" as const,
        reservations_count: countMap[x.id] || 0,
      }));
      return [...guests, ...profiles].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    },
  });

  const openEdit = (c: Cliente) => {
    setEditCliente(c);
    setEditData({
      full_name: c.full_name || "",
      phone: c.phone || "",
      cpf: c.cpf || "",
      rg: c.rg || "",
      email: c.email || "",
      nationality: c.nationality || "Brasileira",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
    });
  };

  const saveEdit = async () => {
    if (!editCliente) return;
    if (!editData.full_name.trim()) return toast.error("Nome é obrigatório.");
    setEditSaving(true);
    try {
      if (editCliente.source === "guest") {
        const guestPayload = {
          full_name: editData.full_name.trim(),
          phone: editData.phone || null,
          cpf: editData.cpf || null,
          rg: editData.rg || null,
          email: editData.email || null,
          nationality: editData.nationality || null,
          address: editData.address || null,
          city: editData.city || null,
          state: editData.state || null,
        } as any;
        const { error } = await supabase.from("guests").update(guestPayload).eq("id", editCliente.id);
        if (error) throw error;
      } else {
        const profilePayload = {
          full_name: editData.full_name.trim(),
          phone: editData.phone || null,
          cpf: editData.cpf || null,
        } as any;
        const { error } = await supabase.from("profiles").update(profilePayload).eq("id", editCliente.id);
        if (error) throw error;
      }
      toast.success("Cliente atualizado!");
      qc.invalidateQueries({ queryKey: ["clientes-lista"] });
      setEditCliente(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar.");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteCliente = useMutation({
    mutationFn: async ({ id, source }: { id: string; source: "guest" | "profile" }) => {
      const table = source === "guest" ? "guests" : "profiles";
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente excluído.");
      qc.invalidateQueries({ queryKey: ["clientes-lista"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao excluir. Verifique se não há reservas vinculadas."),
  });

  const filtered = clientes
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.full_name?.toLowerCase().includes(q) ||
        c.cpf?.includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) =>
      sortBy === "name"
        ? a.full_name.localeCompare(b.full_name, "pt-BR", { sensitivity: "base" })
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  const colors = [
    "bg-blue-500/20 text-blue-300",
    "bg-purple-500/20 text-purple-300",
    "bg-emerald-500/20 text-emerald-300",
    "bg-amber-500/20 text-amber-300",
    "bg-pink-500/20 text-pink-300",
  ];
  const colorFor = (id: string) => colors[id.charCodeAt(0) % colors.length];

  return (
    <div className="p-6 md:p-8 space-y-6 text-cream">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-cream leading-none">Clientes</h1>
            <p className="text-white/30 text-xs mt-0.5 font-body">{clientes.length} cadastrados</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <UserPlus className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-blue-300/80 text-xs font-body">
          Para cadastrar um novo cliente, use <strong className="text-blue-300">+ Nova Reserva</strong> na aba Reservas
          — o cliente é criado automaticamente na ficha do hóspede.
        </p>
      </div>

      {/* Busca + Ordenação */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-charcoal-light border border-white/5 rounded-xl text-cream text-sm focus:border-primary/40 focus:outline-none transition placeholder:text-white/20 font-body"
            placeholder="Buscar por nome, CPF, telefone ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setSortBy((s) => (s === "name" ? "date" : "name"))}
          title={sortBy === "name" ? "Ordenado A→Z" : "Ordenado por data"}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-body font-medium transition-all ${
            sortBy === "name"
              ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
              : "bg-white/5 border-white/8 text-white/40 hover:text-cream hover:bg-white/8"
          }`}
        >
          <span>{sortBy === "name" ? "A→Z" : "Data"}</span>
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-white/20 gap-2 font-body">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-primary/20 mx-auto mb-3" />
          <p className="text-white/30 font-body text-sm">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
          {filtered.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <div
                key={c.id}
                className="bg-charcoal-light border border-white/5 rounded-xl overflow-hidden transition-all hover:border-white/10"
              >
                {/* Row principal */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${colorFor(c.id)} border-white/10`}
                  >
                    <span className="text-sm font-bold">{initials(c.full_name)}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-cream font-body font-semibold text-sm">{c.full_name}</p>
                      {c.source === "profile" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25 font-body">
                          Portal
                        </span>
                      )}
                      {(c.reservations_count || 0) > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary/70 border border-primary/20 font-body">
                          {c.reservations_count} reserva{(c.reservations_count || 0) > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {c.email && (
                        <span className="flex items-center gap-1 text-white/35 text-xs font-body">
                          <Mail className="w-3 h-3" /> {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1 text-white/35 text-xs font-body">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </span>
                      )}
                      {c.cpf && (
                        <span className="flex items-center gap-1 text-white/35 text-xs font-body">
                          <CreditCard className="w-3 h-3" /> {c.cpf}
                        </span>
                      )}
                      {!c.email && !c.phone && !c.cpf && (
                        <span className="text-white/20 text-xs font-body">Sem contato cadastrado</span>
                      )}
                    </div>
                  </div>
                  {/* Data + ações */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-white/20 text-xs font-body hidden md:block">{fmt(c.created_at)}</span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className={`p-1.5 rounded-lg text-white/25 hover:text-cream hover:bg-white/8 transition-all ${isExpanded ? "bg-white/5 text-cream" : ""}`}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 rounded-lg text-white/25 hover:text-cream hover:bg-white/8 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId({ id: c.id, source: c.source, name: c.full_name })}
                      className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expandido: detalhes */}
                {isExpanded && (
                  <div className="border-t border-white/5 px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DetailItem label="RG" value={c.rg} />
                    <DetailItem label="Nacionalidade" value={c.nationality} />
                    <DetailItem label="Cidade" value={c.city ? `${c.city}${c.state ? ` / ${c.state}` : ""}` : null} />
                    <DetailItem label="Endereço" value={c.address} />
                    <DetailItem label="Cadastrado em" value={fmt(c.created_at)} />
                    <DetailItem label="Origem" value={c.source === "guest" ? "Recepção" : "Portal online"} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ MODAL EDITAR ══ */}
      {editCliente && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setEditCliente(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-cream">Editar Cliente</h2>
                </div>
                <button
                  onClick={() => setEditCliente(null)}
                  className="text-white/25 hover:text-cream transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                <Field
                  label="Nome completo *"
                  placeholder="Nome"
                  value={editData.full_name}
                  onChange={(v) => setEditData((d) => ({ ...d, full_name: v }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="CPF"
                    placeholder="000.000.000-00"
                    value={editData.cpf}
                    onChange={(v) => setEditData((d) => ({ ...d, cpf: maskCPF(v) }))}
                  />
                  {editCliente.source === "guest" && (
                    <Field
                      label="RG"
                      placeholder="00.000.000-0"
                      value={editData.rg}
                      onChange={(v) => setEditData((d) => ({ ...d, rg: maskRG(v) }))}
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Telefone"
                    placeholder="(51) 99999-0000"
                    value={editData.phone}
                    onChange={(v) => setEditData((d) => ({ ...d, phone: maskPhone(v) }))}
                  />
                  {editCliente.source === "guest" && (
                    <Field
                      label="E-mail"
                      placeholder="email@exemplo.com"
                      value={editData.email}
                      onChange={(v) => setEditData((d) => ({ ...d, email: v }))}
                    />
                  )}
                </div>
                {editCliente.source === "guest" && (
                  <>
                    <Field
                      label="Nacionalidade"
                      placeholder="Brasileira"
                      value={editData.nationality}
                      onChange={(v) => setEditData((d) => ({ ...d, nationality: v }))}
                    />
                    <Field
                      label="Endereço"
                      placeholder="Rua, número"
                      value={editData.address}
                      onChange={(v) => setEditData((d) => ({ ...d, address: v }))}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        label="Cidade"
                        placeholder="Cidade"
                        value={editData.city}
                        onChange={(v) => setEditData((d) => ({ ...d, city: v }))}
                      />
                      <Field
                        label="Estado"
                        placeholder="RS"
                        value={editData.state}
                        onChange={(v) => setEditData((d) => ({ ...d, state: v }))}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 shrink-0">
                <button
                  onClick={() => setEditCliente(null)}
                  className="px-4 py-2 text-sm text-white/40 hover:text-cream font-body transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-black text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                  style={goldBg}
                >
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {editSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ MODAL EXCLUIR ══ */}
      {deleteId && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
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
                  <p className="text-white/30 text-xs font-body mt-0.5">{deleteId.name}</p>
                </div>
              </div>
              <p className="text-white/25 text-xs font-body">
                Se o cliente tiver reservas, a exclusão pode falhar. Essa ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 text-sm text-white/40 hover:text-cream font-body border border-white/10 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteCliente.mutate({ id: deleteId.id, source: deleteId.source })}
                  disabled={deleteCliente.isPending}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25 transition-colors disabled:opacity-50"
                >
                  {deleteCliente.isPending ? "Excluindo..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <p className="text-[10px] text-white/25 font-body uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-cream/70 text-sm font-body">{value || "—"}</p>
  </div>
);

export default AdminClientes;
