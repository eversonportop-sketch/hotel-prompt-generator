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
        };
      });
    },
    enabled: authorized,
    refetchInterval: 30000,
  });

  const marcarLimpoMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase
        .from("rooms")
        .update({ needs_cleaning: false } as any)
        .eq("id", roomId);
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
