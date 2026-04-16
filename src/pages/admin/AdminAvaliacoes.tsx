import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2, Eye, EyeOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Avaliacao {
  id: string;
  nome: string;
  email: string | null;
  nota: number;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

const AdminAvaliacoes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: avaliacoes = [], isLoading } = useQuery({
    queryKey: ["avaliacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) as Avaliacao[];
    },
  });

  const unreadCount = avaliacoes.filter((a) => !a.lida).length;

  const toggleLida = useMutation({
    mutationFn: async ({ id, lida }: { id: string; lida: boolean }) => {
      const { error } = await supabase
        .from("avaliacoes" as any)
        .update({ lida } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["avaliacoes"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("avaliacoes" as any)
        .update({ lida: true } as any)
        .eq("lida", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
      toast({ title: "Todas marcadas como lidas" });
    },
  });

  const deleteAvaliacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("avaliacoes" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
      toast({ title: "Avaliação removida" });
    },
  });

  const Stars = ({ nota }: { nota: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= nota ? "fill-primary text-primary" : "text-white/15"}`} />
      ))}
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">Avaliações</h1>
          <p className="text-sm text-white/40 font-body mt-1">
            {avaliacoes.length} avaliação(ões) · {unreadCount} não lida(s)
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="gap-2 border-white/10 text-white/50 hover:text-cream"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-white/30 font-body">Carregando...</div>
      ) : avaliacoes.length === 0 ? (
        <div className="text-center py-20 text-white/30 font-body">Nenhuma avaliação recebida ainda.</div>
      ) : (
        <div className="space-y-3">
          {avaliacoes.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border p-5 transition-colors ${
                a.lida
                  ? "border-white/5 bg-charcoal-light/30"
                  : "border-primary/20 bg-primary/5"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-display font-semibold text-cream text-sm">{a.nome}</span>
                    <Stars nota={a.nota} />
                    {!a.lida && (
                      <span className="text-[10px] uppercase tracking-widest bg-primary/20 text-primary px-2 py-0.5 rounded-full font-body font-semibold">
                        Nova
                      </span>
                    )}
                  </div>
                  {a.email && (
                    <p className="text-xs text-white/30 font-body mb-2">{a.email}</p>
                  )}
                  <p className="text-sm text-white/60 font-body leading-relaxed whitespace-pre-wrap">{a.mensagem}</p>
                  <p className="text-[11px] text-white/20 font-body mt-3">
                    {new Date(a.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleLida.mutate({ id: a.id, lida: !a.lida })}
                    className="text-white/30 hover:text-cream h-8 w-8"
                    title={a.lida ? "Marcar como não lida" : "Marcar como lida"}
                  >
                    {a.lida ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/30 hover:text-red-400 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deletar avaliação?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteAvaliacao.mutate(a.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Deletar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAvaliacoes;
