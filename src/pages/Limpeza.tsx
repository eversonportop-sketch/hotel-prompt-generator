import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";

const SECRET_TOKEN = "sb2024";

interface Room {
  id: string;
  name: string;
  needs_cleaning: boolean;
}

const Limpeza = () => {
  const [searchParams] = useSearchParams();
  const [authorized, setAuthorized] = useState(false);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  useEffect(() => {
    if (searchParams.get("token") === SECRET_TOKEN) {
      setAuthorized(true);
    }
  }, [searchParams]);

  const { data: rooms = [], isLoading, refetch, isFetching } = useQuery<Room[]>({
    queryKey: ["limpeza-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, needs_cleaning")
        .eq("needs_cleaning", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Room[];
    },
    enabled: authorized,
    refetchInterval: 30000,
  });

  const markCleanMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const { data, error } = await supabase.functions.invoke("marcar-limpo", {
        body: { room_id: roomId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onMutate: (roomId) => {
      setMarkedIds((prev) => new Set(prev).add(roomId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["limpeza-rooms"] });
    },
    onError: (_, roomId) => {
      setMarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(roomId);
        return next;
      });
    },
  });

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-white/50 text-sm">Acesso não autorizado.</p>
          <p className="text-white/30 text-xs mt-2">Solicite o link correto à recepção.</p>
        </div>
      </div>
    );
  }

  const pendingRooms = rooms.filter((r) => !markedIds.has(r.id));

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">🧹 Quartos para Limpar</h1>
          <p className="text-white/40 text-xs">
            {pendingRooms.length === 0
              ? "Nenhum quarto pendente"
              : `${pendingRooms.length} quarto${pendingRooms.length > 1 ? "s" : ""} pendente${pendingRooms.length > 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-full bg-white/10 active:bg-white/20 transition"
        >
          <RefreshCw className={`w-5 h-5 text-white/60 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white/30" />
          </div>
        ) : pendingRooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-white/60 text-base font-medium">Tudo limpo!</p>
            <p className="text-white/30 text-sm mt-1">Nenhum quarto pendente no momento.</p>
          </div>
        ) : (
          pendingRooms.map((room) => {
            const isPending = markCleanMutation.isPending && markCleanMutation.variables === room.id;
            return (
              <div
                key={room.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">🧹</span>
                  <p className="text-white font-semibold text-base truncate">{room.name}</p>
                </div>
                <button
                  onClick={() => markCleanMutation.mutate(room.id)}
                  disabled={isPending}
                  className="flex-shrink-0 flex items-center gap-1.5 bg-green-600/80 hover:bg-green-600 active:bg-green-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Limpo
                </button>
              </div>
            );
          })
        )}
      </div>

      {!isLoading && (
        <p className="text-center text-white/20 text-xs pb-8 pt-2">
          Atualiza automaticamente a cada 30s
        </p>
      )}
    </div>
  );
};

export default Limpeza;
