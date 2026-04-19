import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2, Eye, EyeOff, CheckCheck, ExternalLink, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// ─── Substitua pela URL real do seu Google Meu Negócio ───────────────────────
// Para encontrar: busque seu hotel no Google Maps → clique em "Avalie" → copie a URL
const GOOGLE_REVIEW_URL = "https://g.page/r/CY1hLxg7JrA5EBM/review";
// ─────────────────────────────────────────────────────────────────────────────

const AdminAvaliacoes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [googleUrl, setGoogleUrl] = useState(GOOGLE_REVIEW_URL);
  const [showUrlConfig, setShowUrlConfig] = useState(false);
  const [previewAvaliacao, setPreviewAvaliacao] = useState<Avaliacao | null>(null);

  const { data: avaliacoes = [], isLoading } = useQuery({
    queryKey: ["avaliacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[] as Avaliacao[];
    },
  });

  const unreadCount = avaliacoes.filter((a) => !a.lida).length;
  const boasAvaliacoes = avaliacoes.filter((a) => a.nota >= 4).length;
  const avisosAvaliacoes = avaliacoes.filter((a) => a.nota < 4).length;

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
      const { error } = await supabase
        .from("avaliacoes" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes"] });
      toast({ title: "Avaliação removida" });
      setPreviewAvaliacao(null);
    },
  });

  const handleAprovarGoogle = (avaliacao: Avaliacao) => {
    if (!avaliacao.lida) {
      toggleLida.mutate({ id: avaliacao.id, lida: true });
    }
    window.open(googleUrl, "_blank", "noopener,noreferrer");
    toast({
      title: "Abrindo Google Meu Negócio",
      description: "Incentive o cliente a replicar a avaliação lá também!",
    });
  };

  const Stars = ({ nota }: { nota: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= nota ? "fill-primary text-primary" : "text-white/15"}`} />
      ))}
    </div>
  );

  const cardBorder = (a: Avaliacao) => {
    if (!a.lida) return "border-primary/20 bg-primary/5";
    if (a.nota >= 4) return "border-emerald-500/20 bg-emerald-500/5";
    if (a.nota === 3) return "border-yellow-500/15 bg-yellow-500/5";
    return "border-red-500/20 bg-red-500/5";
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">Avaliações</h1>
          <p className="text-sm text-white/40 font-body mt-1">
            {avaliacoes.length} avaliação(ões) · {unreadCount} não lida(s)
          </p>
          <div className="flex gap-4 mt-2">
            <span className="text-xs text-emerald-400 font-body flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" /> {boasAvaliacoes} boas (4-5★)
            </span>
            <span className="text-xs text-red-400 font-body flex items-center gap-1">
              <ThumbsDown className="w-3 h-3" /> {avisosAvaliacoes} negativas (1-3★)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUrlConfig(true)}
            className="gap-2 border-white/10 text-white/50 hover:text-cream text-xs"
          >
            <ExternalLink className="w-3 h-3" />
            Config. Google
          </Button>
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
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-white/30 font-body">Carregando...</div>
      ) : avaliacoes.length === 0 ? (
        <div className="text-center py-20 text-white/30 font-body">Nenhuma avaliação recebida ainda.</div>
      ) : (
        <div className="space-y-3">
          {avaliacoes.map((a) => (
            <div key={a.id} className={`rounded-xl border p-5 transition-colors ${cardBorder(a)}`}>
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
                    {a.nota >= 4 ? (
                      <span className="text-[10px] uppercase tracking-widest bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-body font-semibold">
                        Boa avaliação
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-body font-semibold">
                        Atenção
                      </span>
                    )}
                  </div>
                  {a.email && <p className="text-xs text-white/30 font-body mb-2">{a.email}</p>}
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

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {/* Botão Aprovar para Google — só notas 4 e 5 */}
                  {a.nota >= 4 && (
                    <Button
                      size="sm"
                      onClick={() => setPreviewAvaliacao(a)}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-3"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Aprovar → Google
                    </Button>
                  )}

                  <div className="flex items-center gap-1">
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
                        <Button variant="ghost" size="icon" className="text-white/30 hover:text-red-400 h-8 w-8">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar avaliação?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {a.nota < 4
                              ? "Avaliação negativa. Ao deletar, ela não ficará registrada no sistema."
                              : "Essa ação não pode ser desfeita."}
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
            </div>
          ))}
        </div>
      )}

      {/* Modal de preview antes de enviar ao Google */}
      <Dialog open={!!previewAvaliacao} onOpenChange={(open) => !open && setPreviewAvaliacao(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-cream">Aprovar avaliação para o Google?</DialogTitle>
            <DialogDescription className="font-body text-white/50 text-sm">
              Revise o conteúdo abaixo. Se estiver boa, clique em "Aprovar e abrir Google" para ir direto ao Google Meu
              Negócio.
            </DialogDescription>
          </DialogHeader>

          {previewAvaliacao && (
            <div className="rounded-xl border border-white/10 bg-charcoal-light/40 p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-semibold text-cream text-sm">{previewAvaliacao.nome}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s <= previewAvaliacao.nota ? "fill-primary text-primary" : "text-white/15"}`}
                    />
                  ))}
                </div>
              </div>
              {previewAvaliacao.email && <p className="text-xs text-white/30 font-body">{previewAvaliacao.email}</p>}
              <p className="text-sm text-white/70 font-body leading-relaxed">{previewAvaliacao.mensagem}</p>
            </div>
          )}

          <DialogFooter className="gap-2 flex-wrap sm:justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-red-400 hover:text-red-300 gap-1.5 text-sm">
                  <Trash2 className="w-4 h-4" />
                  Excluir avaliação
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deletar avaliação?</AlertDialogTitle>
                  <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => previewAvaliacao && deleteAvaliacao.mutate(previewAvaliacao.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              onClick={() => previewAvaliacao && handleAprovarGoogle(previewAvaliacao)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <ExternalLink className="w-4 h-4" />
              Aprovar e abrir Google
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de configuração da URL do Google */}
      <Dialog open={showUrlConfig} onOpenChange={setShowUrlConfig}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-cream">Link do Google Meu Negócio</DialogTitle>
            <DialogDescription className="font-body text-white/50 text-sm">
              Cole aqui o link de avaliação do seu hotel no Google. Para encontrá-lo: pesquise seu hotel no Google Maps
              → clique em "Escrever uma avaliação" → copie a URL da página.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              placeholder="https://g.page/r/..."
              className="bg-charcoal border-white/10 text-cream placeholder:text-white/25 focus-visible:ring-primary/40 text-sm"
            />
            <p className="text-[11px] text-white/30 font-body">Exemplo: https://g.page/r/CbXXXXXXXXXX/review</p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowUrlConfig(false);
                toast({ title: "Link salvo!" });
              }}
              className="bg-primary text-charcoal hover:bg-primary/90"
            >
              Salvar link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAvaliacoes;
