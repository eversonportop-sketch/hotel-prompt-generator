import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, Pencil, Trash2, X, Loader2, CheckCircle2, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Cliente {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  created_at: string;
  source: "guest" | "profile";
}

const goldBg = { background: "linear-gradient(135deg,#C9A84C,#E5C97A)" };
const fmt = (d: string) => format(new Date(d), "dd MMM yyyy", { locale: ptBR });

// ═════════════════════════════════════════════════════════════════════════════
const AdminClientes = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [editData, setEditData] = useState({ full_name: "", phone: "", cpf: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<{ id: string; source: "guest" | "profile" } | null>(null);

  // ─── Query: todos os clientes (guests + profiles não-admin) ───────────────
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes-lista"],
    queryFn: async () => {
      const [g, p] = await Promise.all([
        supabase
          .from("guests")
          .select("id,full_name,email,phone,cpf,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id,full_name,phone,cpf,created_at")
          .neq("role", "admin")
          .order("created_at", { ascending: false }),
      ]);
      const guests: Cliente[] = (g.data || []).map((x: any) => ({
        ...x,
        email: x.email || null,
        source: "guest" as const,
      }));
      const profiles: Cliente[] = (p.data || []).map((x: any) => ({ ...x, email: null, source: "profile" as const }));
      return [...guests, ...profiles].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    },
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const saveEdit = async () => {
    if (!editCliente) return;
    if (!editData.full_name.trim()) return toast.error("Nome é obrigatório.");
    setEditSaving(true);
    try {
      const table = editCliente.source === "guest" ? "guests" : "profiles";
      const { error } = await supabase
        .from(table)
        .update({
          full_name: editData.full_name.trim(),
          phone: editData.phone || null,
          cpf: editData.cpf || null,
        })
        .eq("id", editCliente.id);
      if (error) throw error;
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

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = clientes.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.cpf?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const cadastradosHoje = clientes.filter((c) => c.created_at.slice(0, 10) === todayStr).length;

  const openEdit = (c: Cliente) => {
    setEditCliente(c);
    setEditData({ full_name: c.full_name, phone: c.phone || "", cpf: c.cpf || "" });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
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
            <p className="text-white/30 text-xs mt-0.5 font-body">Cadastro de hóspedes</p>
          </div>
        </div>
        <p className="text-white/20 text-xs font-body hidden md:block">
          Novos clientes são criados ao fazer uma reserva
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">Total</p>
          <p className="font-display text-3xl font-bold text-purple-400">{clientes.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">Cadastrados hoje</p>
          <p className="font-display text-3xl font-bold text-cream">{cadastradosHoje}</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          className="w-full pl-10 pr-4 py-2.5 bg-charcoal-light border border-white/5 rounded-xl text-cream text-sm focus:border-primary/40 focus:outline-none transition placeholder:text-white/20 font-body"
          placeholder="Buscar por nome, telefone, email, CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-white/20 gap-2 font-body">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-purple-400/20 mx-auto mb-3" />
          <p className="text-white/30 font-body text-sm">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="bg-charcoal-light border border-white/5 rounded-xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {["Cliente", "Contato", "CPF", "Cadastro", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3.5 text-[10px] uppercase tracking-widest text-white/25 font-body"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={`${c.source}-${c.id}`}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                        <span className="text-white/40 text-sm font-bold">{c.full_name[0]?.toUpperCase() ?? "?"}</span>
                      </div>
                      <div>
                        <p className="text-cream text-sm font-body font-medium">{c.full_name}</p>
                        {c.email && <p className="text-white/30 text-xs font-body">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-white/50 text-sm font-body">{c.phone || "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-white/40 text-sm font-body">{c.cpf || "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-white/30 text-xs font-body">{fmt(c.created_at)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {c.source === "profile" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25 font-body mr-1">
                          Portal
                        </span>
                      )}
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg text-white/25 hover:text-cream hover:bg-white/8 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId({ id: c.id, source: c.source })}
                        className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ MODAL EDITAR ═══ */}
      {editCliente && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setEditCliente(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl pointer-events-auto p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-primary" />
                  <h3 className="font-display text-lg font-semibold text-cream">Editar Cliente</h3>
                </div>
                <button
                  onClick={() => setEditCliente(null)}
                  className="text-white/25 hover:text-cream transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  ["Nome completo", "full_name", "text", "Nome do hóspede"],
                  ["Telefone", "phone", "text", "(51) 99999-0000"],
                  ["CPF", "cpf", "text", "000.000.000-00"],
                ].map(([label, key, type, ph]) => (
                  <div key={key as string}>
                    <label className="text-[10px] text-white/40 font-body uppercase tracking-widest block mb-1.5">
                      {label as string}
                    </label>
                    <input
                      type={type as string}
                      placeholder={ph as string}
                      value={(editData as any)[key as string]}
                      onChange={(e) => setEditData((d) => ({ ...d, [key as string]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/20"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditCliente(null)}
                  className="flex-1 py-2.5 text-sm text-white/40 hover:text-cream font-body border border-white/10 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-black text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
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

      {/* ═══ MODAL EXCLUIR ═══ */}
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
                  <p className="text-white/30 text-xs font-body mt-0.5">Essa ação não pode ser desfeita.</p>
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
                  onClick={() => deleteCliente.mutate(deleteId!)}
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

export default AdminClientes;
