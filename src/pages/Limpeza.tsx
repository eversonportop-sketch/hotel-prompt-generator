import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";

const SECRET_TOKEN = "sb2024";

const Limpeza = () => {
  const [searchParams] = useSearchParams();
  const [authorized, setAuthorized] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (searchParams.get("token") === SECRET_TOKEN) {
      setAuthorized(true);
    }
  }, [searchParams]);

  const { data: quartos = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["limpeza-mapa"],
    queryFn: async () => {
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("id, name, category, needs_cleaning")
        .eq("status", "active")
        .order("name");

      const { data: resData } = await supabase
        .from("reservations")
        .select(
          "id, room_id, check_out, status, profile_id, guest_id, guests_count, profiles!reservations_profile_id_fkey(full_name), guests!reservations_guest_id_fkey(full_name)"
        )
        .eq("status", "checked_in");

      // Busca última reserva checked_out por quarto (para consumo na limpeza)
      const cleaningRooms = (roomsData || []).filter((r: any) => r.needs_cleaning);

      let consumoMap: Record<string, { item_name: string; quantity: number }[]> = {};

      if (cleaningRooms.length > 0) {
        const cleaningRoomIds = cleaningRooms.map((r: any) => r.id);

        const { data: checkoutRes } = await supabase
          .from("reservations")
          .select("id, room_id, check_in, updated_at")
          .eq("status", "checked_out")
          .in("room_id", cleaningRoomIds)
          .order("updated_at", { ascending: false });

        // Pega as 2 reservas mais recentes por quarto:
        // - latest: a que acabou de sair (define o fim)
        // - prev: a anterior (define o início — quando o hóspede anterior saiu)
        const latestPerRoom: Record<string, {
          resId: string;
          checkIn: string;
          checkedOutAt: string;
          prevCheckedOutAt: string | null;
        }> = {};

        (checkoutRes || []).forEach((r: any) => {
          if (!latestPerRoom[r.room_id]) {
            latestPerRoom[r.room_id] = {
              resId: r.id,
              checkIn: r.check_in,
              checkedOutAt: r.updated_at,
              prevCheckedOutAt: null,
            };
          } else if (!latestPerRoom[r.room_id].prevCheckedOutAt) {
            // Segunda reserva mais recente = checkout anterior
            latestPerRoom[r.room_id].prevCheckedOutAt = r.updated_at;
          }
        });

        // Busca pedidos por room_number (nome do quarto) + data >= check_in da última estadia
        // Cobre pedidos com ou sem reservation_id
        for (const room of cleaningRooms) {
          const latest = latestPerRoom[room.id];

          let query = supabase
            .from("consumption_orders")
            .select("item_name, quantity")
            .eq("room_number", room.name)
            .not("status", "eq", "canceled");

          // Define início da busca:
          // - Se tem checkout anterior: usa esse como ponto de corte (hóspede anterior saiu)
          // - Se é a primeira reserva do quarto: usa check_in - 3 dias (buffer para registro antecipado)
          // - Se não achou reserva nenhuma: fallback 30 dias
          if (latest) {
            const startDate = latest.prevCheckedOutAt ||
              new Date(new Date(latest.checkIn).getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
            query = query.gte("created_at", startDate);
          } else {
            const fallback = new Date();
            fallback.setDate(fallback.getDate() - 30);
            query = query.gte("created_at", fallback.toISOString());
          }

          const { data: ordersData } = await query;

          if (ordersData && ordersData.length > 0) {
            // Agrupa itens iguais somando quantidades
            const grouped: Record<string, number> = {};
            ordersData.forEach((o: any) => {
              grouped[o.item_name] = (grouped[o.item_name] || 0) + o.quantity;
            });
            consumoMap[room.id] = Object.entries(grouped).map(([item_name, quantity]) => ({
              item_name,
              quantity,
            }));
          }
        }
      }

      return (roomsData || []).map((room: any) => {
        const res = (resData || []).find((r: any) => r.room_id === room.id);
        const guestName = res
          ? (res.profiles as any)?.full_name || (res.guests as any)?.full_name || null
          : null;
        return {
          ...room,
          ocupado: !!res,
          needs_cleaning: !!room.needs_cleaning,
          hospede: guestName,
          check_out: res?.check_out || null,
          guests_count: res?.guests_count || null,
          consumo: consumoMap[room.id] || [],
        };
      });
    },
    enabled: authorized,
    refetchInterval: 30000,
  });

  const marcarLimpoMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase.functions.invoke("marcar-limpo", {
        body: { room_id: roomId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["limpeza-mapa"] });
    },
  });

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0e0e11] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-white/50 text-sm">Acesso não autorizado.</p>
          <p className="text-white/30 text-xs mt-2">Solicite o link correto à recepção.</p>
        </div>
      </div>
    );
  }

  const emLimpeza = quartos.filter((q: any) => q.needs_cleaning).length;

  return (
    <div className="min-h-screen bg-[#0e0e11]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0e0e11]/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Mapa de Quartos
          </h1>
          <p className="text-white/30 text-xs mt-0.5">
            {emLimpeza > 0
              ? `${emLimpeza} quarto${emLimpeza > 1 ? "s" : ""} aguardando limpeza`
              : "Tudo limpo!"}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white transition"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Legenda */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-4 text-xs text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60 inline-block" /> Ocupado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60 inline-block" /> Em limpeza
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 inline-block" /> Disponível
        </span>
      </div>

      {/* Mapa */}
      <div className="px-4 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-white/20" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(quartos as any[]).map((q) => {
              const isOcupado = q.ocupado;
              const isLimpeza = !q.ocupado && q.needs_cleaning;
              const isDisponivel = !q.ocupado && !q.needs_cleaning;
              const isPending = marcarLimpoMutation.isPending && marcarLimpoMutation.variables === q.id;

              return (
                <div
                  key={q.id}
                  className={`rounded-xl px-3 py-3 border transition-all ${
                    isOcupado
                      ? "bg-red-500/10 border-red-500/20"
                      : isLimpeza
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-emerald-500/10 border-emerald-500/20"
                  }`}
                >
                  <p className={`text-sm font-bold ${
                    isOcupado ? "text-red-300" : isLimpeza ? "text-amber-300" : "text-emerald-300"
                  }`}>
                    {q.name}
                  </p>

                  {isOcupado && (
                    <>
                      <p className="text-xs text-red-400/80 truncate mt-0.5">{q.hospede || "—"}</p>
                      {q.guests_count && (
                        <p className="text-[10px] text-red-400/50 mt-0.5">
                          👤 {q.guests_count} adulto{q.guests_count > 1 ? "s" : ""}
                        </p>
                      )}
                      <p className="text-[10px] text-red-400/50 mt-0.5">
                        Saída: {q.check_out ? q.check_out.split("-").reverse().slice(0, 2).join("/") : "—"}
                      </p>
                    </>
                  )}

                  {isLimpeza && (
                    <div className="mt-1.5">
                      <p className="text-[10px] text-amber-400/70 flex items-center gap-1 mb-1.5">
                        <Sparkles className="w-3 h-3" /> Em limpeza
                      </p>

                      {/* Itens consumidos para repor */}
                      {q.consumo && q.consumo.length > 0 && (
                        <div className="mb-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-2">
                          <p className="text-[10px] text-amber-300/60 uppercase tracking-wider mb-1.5 font-semibold">
                            🛒 Repor no quarto
                          </p>
                          <ul className="space-y-0.5">
                            {q.consumo.map((item: any, i: number) => (
                              <li key={i} className="flex items-center justify-between text-[11px]">
                                <span className="text-amber-200/70 truncate pr-2">{item.item_name}</span>
                                <span className="text-amber-400 font-bold shrink-0">×{item.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        onClick={() => marcarLimpoMutation.mutate(q.id)}
                        disabled={isPending}
                        className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)" }}
                      >
                        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "✓ Pronto"}
                      </button>
                    </div>
                  )}

                  {isDisponivel && (
                    <p className="text-[10px] text-emerald-400/60 mt-0.5">Disponível</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-center text-white/15 text-xs pb-6">
        Atualiza automaticamente a cada 30s
      </p>
    </div>
  );
};

export default Limpeza;
