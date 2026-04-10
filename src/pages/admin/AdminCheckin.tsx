import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, Search, BedDouble, Users, CalendarDays, Loader2, CheckCircle2, X } from "lucide-react";
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
  notes: string | null;
  guest_id: string | null;
  profile_id: string | null;
  rooms: { name: string; category: string } | null;
  guestName: string;
  guestPhone: string | null;
}

const goldBg = { background: "linear-gradient(135deg,#C9A84C,#E5C97A)" };
const fmt = (d: string) => format(new Date(d + "T12:00:00"), "dd/MM/yyyy");
const fmtShort = (d: string) => format(new Date(d + "T12:00:00"), "dd MMM", { locale: ptBR });

// ═════════════════════════════════════════════════════════════════════════════
const AdminCheckin = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // ─── Query: apenas reservas confirmed ─────────────────────────────────────
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["checkin-confirmed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, check_in, check_out, total_price, guests_count, notes, guest_id, profile_id, rooms(name,category)")
        .eq("status", "confirmed")
        .order("check_in", { ascending: true });
      if (error) throw error;

      const rows = (data || []) as any[];
      const gids = [...new Set(rows.filter((r) => r.guest_id).map((r) => r.guest_id as string))];
      const pids = [...new Set(rows.filter((r) => r.profile_id).map((r) => r.profile_id as string))];
      const nameMap: Record<string, string> = {};
      const phoneMap: Record<string, string> = {};

      if (gids.length) {
        const { data: gd } = await supabase.from("guests").select("id,full_name,phone").in("id", gids);
        (gd || []).forEach((g: any) => {
          nameMap[g.id] = g.full_name;
          phoneMap[g.id] = g.phone;
        });
      }
      if (pids.length) {
        const { data: pd } = await supabase.from("profiles").select("id,full_name,phone").in("id", pids);
        (pd || []).forEach((p: any) => {
          nameMap[p.id] = p.full_name;
          phoneMap[p.id] = p.phone;
        });
      }

      return rows.map((r) => {
        const ref = r.guest_id || r.profile_id;
        return {
          ...r,
          guestName: (ref && nameMap[ref]) || "—",
          guestPhone: (ref && phoneMap[ref]) || null,
        };
      }) as Reservation[];
    },
  });

  // ─── Mutation: confirmar check-in ─────────────────────────────────────────
  const checkinMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reservations")
        .update({
          status: "checked_in",
          checked_in_at: new Date().toISOString(),
        } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Check-in realizado!");
      qc.invalidateQueries({ queryKey: ["checkin-confirmed"] });
      qc.invalidateQueries({ queryKey: ["reservas-lista"] });
      setConfirmId(null);
    },
    onError: () => toast.error("Erro ao realizar check-in."),
  });

  // ─── Filtro ───────────────────────────────────────────────────────────────
  const filtered = reservations.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.guestName.toLowerCase().includes(q) || (r.rooms as any)?.name?.toLowerCase().includes(q);
  });

  function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const todayStr = localToday();
  const chegandoHoje = reservations.filter((r) => r.check_in === todayStr).length;

  const confirmRes = reservations.find((r) => r.id === confirmId);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 space-y-6 text-cream">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <LogIn className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-cream leading-none">Check-in</h1>
          <p className="text-white/30 text-xs mt-0.5 font-body">Reservas confirmadas aguardando entrada</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">Chegando hoje</p>
          <p className="font-display text-3xl font-bold text-amber-400">{chegandoHoje}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-white/30 text-xs font-body uppercase tracking-wider mb-1">Aguardando check-in</p>
          <p className="font-display text-3xl font-bold text-cream">{reservations.length}</p>
        </div>
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

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-white/20 gap-2 font-body">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 className="w-12 h-12 text-emerald-400/20 mx-auto mb-3" />
          <p className="text-white/30 font-body text-sm">
            {reservations.length === 0 ? "Nenhuma reserva confirmada no momento." : "Nenhum resultado para a busca."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const n = differenceInDays(new Date(r.check_out + "T12:00:00"), new Date(r.check_in + "T12:00:00"));
            const isToday = r.check_in === todayStr;
            return (
              <div
                key={r.id}
                className={`bg-charcoal-light border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 transition-colors ${
                  isToday ? "border-amber-500/25 hover:border-amber-500/40" : "border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex-1 space-y-2.5">
                  {/* Badge chegando hoje / entrada atrasada */}
                  {isToday && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 font-body">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Chegando hoje
                    </span>
                  )}
                  {r.check_in < todayStr && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 font-body">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" /> Entrada atrasada
                    </span>
                  )}

                  {/* Nome */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                      <span className="text-white/40 text-sm font-bold">{r.guestName[0]?.toUpperCase() ?? "?"}</span>
                    </div>
                    <div>
                      <p className="text-cream font-body font-medium text-sm">{r.guestName}</p>
                      {r.guestPhone && <p className="text-white/30 text-xs font-body">{r.guestPhone}</p>}
                    </div>
                  </div>

                  {/* Quarto + datas */}
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
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {r.guests_count} hóspede{r.guests_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Valor */}
                <div className="text-right shrink-0">
                  <p className="font-display text-lg font-bold text-primary">
                    R$ {Number(r.total_price).toFixed(2).replace(".", ",")}
                  </p>
                </div>

                {/* Botão */}
                <button
                  onClick={() => setConfirmId(r.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-black text-sm font-semibold hover:brightness-110 transition-all shrink-0"
                  style={goldBg}
                >
                  <LogIn className="w-4 h-4" /> Check-in
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ MODAL CONFIRMAÇÃO ═══ */}
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
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <LogIn className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-cream">Confirmar Check-in</h3>
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
                <p className="text-primary font-semibold text-sm font-display mt-2">
                  R$ {Number(confirmRes.total_price).toFixed(2).replace(".", ",")}
                </p>
              </div>

              {confirmRes.check_in < todayStr && (
                <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-3 text-yellow-400 text-xs font-body text-center">
                  ⚠️ Atenção: a data de entrada prevista já passou. Confirme apenas se o hóspede está chegando hoje.
                </div>
              )}

              <p className="text-white/30 text-xs font-body text-center">
                Isso vai marcar o status como <span className="text-blue-400 font-semibold">Hospedado</span> e registrar
                o horário de entrada.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmId(null)}
                  className="flex-1 py-2.5 text-sm text-white/40 hover:text-cream font-body border border-white/10 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => checkinMutation.mutate(confirmId!)}
                  disabled={checkinMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-black text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                  style={goldBg}
                >
                  {checkinMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {checkinMutation.isPending ? "Processando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCheckin;
