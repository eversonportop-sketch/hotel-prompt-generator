import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Search, BedDouble, CalendarDays, Loader2, CheckCircle2, X, Clock, History } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Reservation {
  id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  guests_count: number;
  checked_in_at: string | null;
  checked_out_at: string | null;
  guest_id: string | null;
  profile_id: string | null;
  rooms: { name: string; category: string } | null;
  guestName: string;
}

const goldBg = { background: "linear-gradient(135deg,#C9A84C,#E5C97A)" };
const fmt = (d: string) => format(new Date(d + "T12:00:00"), "dd/MM/yyyy");
const fmtShort = (d: string) => format(new Date(d + "T12:00:00"), "dd MMM", { locale: ptBR });
const fmtDateTime = (d: string) => format(new Date(d), "dd/MM/yyyy HH:mm");

const fetchWithNames = async (status: string) => {
  const { data, error } = await supabase
    .from("reservations")
    .select(
      "id, check_in, check_out, total_price, guests_count, checked_in_at, checked_out_at, guest_id, profile_id, rooms(name,category)",
    )
    .eq("status", status)
    .order("check_in", { ascending: true });
  if (error) throw error;

  const rows = (data || []) as any[];
  const gids = [...new Set(rows.filter((r) => r.guest_id).map((r) => r.guest_id as string))];
  const pids = [...new Set(rows.filter((r) => r.profile_id).map((r) => r.profile_id as string))];
  const nameMap: Record<string, string> = {};

  if (gids.length) {
    const { data: gd } = await supabase.from("guests").select("id,full_name").in("id", gids);
    (gd || []).forEach((g: any) => {
      nameMap[g.id] = g.full_name;
    });
  }
  if (pids.length) {
    const { data: pd } = await supabase.from("profiles").select("id,full_name").in("id", pids);
    (pd || []).forEach((p: any) => {
      nameMap[p.id] = p.full_name;
    });
  }

  return rows.map((r) => ({
    ...r,
    guestName: (r.guest_id && nameMap[r.guest_id]) || (r.profile_id && nameMap[r.profile_id]) || "—",
  })) as Reservation[];
};

// ═════════════════════════════════════════════════════════════════════════════
const AdminCheckout = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pendentes" | "historico">("pendentes");
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: hospedados = [], isLoading: loadingHosp } = useQuery({
    queryKey: ["checkout-hospedados"],
    queryFn: () => fetchWithNames("checked_in"),
  });

  const { data: historico = [], isLoading: loadingHist } = useQuery({
    queryKey: ["checkout-historico"],
    queryFn: () => fetchWithNames("checked_out"),
    enabled: tab === "historico",
  });

  // ─── Mutation: confirmar checkout ─────────────────────────────────────────
  const checkoutMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reservations")
        .update({
          status: "checked_out",
          checked_out_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Check-out realizado!");
      qc.invalidateQueries({ queryKey: ["checkout-hospedados"] });
      qc.invalidateQueries({ queryKey: ["checkout-historico"] });
      qc.invalidateQueries({ queryKey: ["reservas-lista"] });
      setConfirmId(null);
    },
    onError: () => toast.error("Erro ao realizar check-out."),
  });

  const filter = (list: Reservation[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) => r.guestName.toLowerCase().includes(q) || (r.rooms as any)?.name?.toLowerCase().includes(q),
    );
  };

  const filteredHosp = filter(hospedados);
  const filteredHist = filter(historico);
  const confirmRes = hospedados.find((r) => r.id === confirmId);

  const todayStr = new Date().toISOString().slice(0, 10);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 space-y-6 text-cream">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <LogOut className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-cream leading-none">Checkout</h1>
          <p className="text-white/30 text-xs mt-0.5 font-body">Hóspedes hospedados e histórico</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("pendentes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body border transition-all ${
            tab === "pendentes"
              ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
              : "bg-white/5 border-white/8 text-white/40 hover:text-cream hover:border-white/20"
          }`}
        >
          <Clock className="w-4 h-4" /> Hospedados
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === "pendentes" ? "bg-blue-500/20 text-blue-300" : "bg-white/8 text-white/30"}`}
          >
            {hospedados.length}
          </span>
        </button>
        <button
          onClick={() => setTab("historico")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body border transition-all ${
            tab === "historico"
              ? "bg-white/10 border-white/20 text-cream"
              : "bg-white/5 border-white/8 text-white/40 hover:text-cream hover:border-white/20"
          }`}
        >
          <History className="w-4 h-4" /> Histórico
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          className="w-full pl-10 pr-4 py-2.5 bg-charcoal-light border border-white/5 rounded-xl text-cream text-sm focus:border-primary/40 focus:outline-none transition placeholder:text-white/20 font-body"
          placeholder="Buscar hóspede ou quarto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ═══ TAB HOSPEDADOS ═══ */}
      {tab === "pendentes" && (
        <>
          {loadingHosp ? (
            <div className="flex items-center justify-center py-20 text-white/20 gap-2 font-body">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : filteredHosp.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle2 className="w-12 h-12 text-emerald-400/20 mx-auto mb-3" />
              <p className="text-white/30 font-body text-sm">
                {hospedados.length === 0 ? "Nenhum hóspede hospedado no momento." : "Nenhum resultado para a busca."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHosp.map((r) => {
                const n = differenceInDays(new Date(r.check_out + "T12:00:00"), new Date(r.check_in + "T12:00:00"));
                const saidaHoje = r.check_out === todayStr;
                return (
                  <div
                    key={r.id}
                    className={`bg-charcoal-light border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 transition-colors ${
                      saidaHoje ? "border-blue-500/25 hover:border-blue-500/40" : "border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex-1 space-y-2.5">
                      {saidaHoje && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 font-body">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Saindo hoje
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                          <span className="text-white/40 text-sm font-bold">
                            {r.guestName[0]?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <p className="text-cream font-body font-medium text-sm">{r.guestName}</p>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/40 text-xs font-body">
                        <span className="flex items-center gap-1">
                          <BedDouble className="w-3.5 h-3.5" />
                          <strong className="text-cream/70">{(r.rooms as any)?.name ?? "—"}</strong> ·{" "}
                          {(r.rooms as any)?.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {fmtShort(r.check_in)} → {fmtShort(r.check_out)} · {n}n
                        </span>
                      </div>
                      {r.checked_in_at && (
                        <p className="text-white/20 text-xs font-body">Entrada: {fmtDateTime(r.checked_in_at)}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display text-lg font-bold text-primary">
                        R$ {Number(r.total_price).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmId(r.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 transition-colors shrink-0"
                    >
                      <LogOut className="w-4 h-4" /> Check-out
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ TAB HISTÓRICO ═══ */}
      {tab === "historico" && (
        <>
          {loadingHist ? (
            <div className="flex items-center justify-center py-20 text-white/20 gap-2 font-body">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : filteredHist.length === 0 ? (
            <div className="text-center py-20">
              <History className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 font-body text-sm">Nenhuma hospedagem finalizada ainda.</p>
            </div>
          ) : (
            <div className="bg-charcoal-light border border-white/5 rounded-xl overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Hóspede", "Quarto", "Período", "Total", "Saída"].map((h) => (
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
                  {filteredHist.map((r) => {
                    const n = differenceInDays(new Date(r.check_out + "T12:00:00"), new Date(r.check_in + "T12:00:00"));
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                              <span className="text-white/40 text-[10px] font-bold">
                                {r.guestName[0]?.toUpperCase() ?? "?"}
                              </span>
                            </div>
                            <span className="text-cream/70 text-sm font-body">{r.guestName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-cream/70 text-sm font-body">{(r.rooms as any)?.name ?? "—"}</p>
                          <p className="text-white/25 text-xs font-body">{(r.rooms as any)?.category}</p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-white/50 text-xs font-body">
                            {fmt(r.check_in)} → {fmt(r.check_out)}
                          </p>
                          <p className="text-white/25 text-xs font-body">{n}n</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-primary font-semibold text-sm">
                            R$ {Number(r.total_price).toFixed(2).replace(".", ",")}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-white/5 border-white/10 text-white/30 font-body">
                            <CheckCircle2 className="w-3 h-3" />
                            {r.checked_out_at ? fmtDateTime(r.checked_out_at) : fmt(r.check_out)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ═══ MODAL CONFIRMAR CHECKOUT ═══ */}
      {confirmRes && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-[#111114] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl pointer-events-auto p-6 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <LogOut className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-cream">Confirmar Check-out</h3>
                </div>
                <button onClick={() => setConfirmId(null)} className="text-white/25 hover:text-cream transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-1">
                <p className="text-cream font-body font-semibold">{confirmRes.guestName}</p>
                <p className="text-white/40 text-sm font-body">
                  {(confirmRes.rooms as any)?.name} · {(confirmRes.rooms as any)?.category}
                </p>
                <p className="text-white/30 text-xs font-body">
                  {fmt(confirmRes.check_in)} → {fmt(confirmRes.check_out)}
                </p>
                {confirmRes.checked_in_at && (
                  <p className="text-white/20 text-xs font-body">Entrada: {fmtDateTime(confirmRes.checked_in_at)}</p>
                )}
                <p className="text-primary font-semibold text-sm font-display mt-2">
                  R$ {Number(confirmRes.total_price).toFixed(2).replace(".", ",")}
                </p>
              </div>

              <p className="text-white/30 text-xs font-body text-center">
                Isso vai marcar como <span className="text-white/50 font-semibold">Finalizada</span> e registrar o
                horário de saída.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmId(null)}
                  className="flex-1 py-2.5 text-sm text-white/40 hover:text-cream font-body border border-white/10 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => checkoutMutation.mutate(confirmId!)}
                  disabled={checkoutMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25 transition-colors disabled:opacity-50"
                >
                  {checkoutMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {checkoutMutation.isPending ? "Processando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCheckout;
