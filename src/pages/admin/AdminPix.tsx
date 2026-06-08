import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  Phone,
  User,
  BedDouble,
  CalendarDays,
  DollarSign,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending_payment: {
    label: "Aguardando PIX",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  confirmed: {
    label: "Confirmada",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  canceled: {
    label: "Cancelada",
    bg: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
  },
};

const AdminPix = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending_payment" | "all">("pending_payment");
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  /* ── Reservas ── */
  const { data: reservas = [], isLoading } = useQuery({
    queryKey: ["pix-reservas", filter],
    queryFn: async () => {
      let query = supabase
        .from("reservations")
        .select(
          `id, check_in, check_out, guests_count, total_price, status, created_at, profile_id,
           profiles(full_name, phone, email),
           guests(full_name, phone, email),
           rooms(name, category)`
        )
        .order("created_at", { ascending: false });

      if (filter === "pending_payment") {
        query = query.eq("status", "pending_payment");
      } else {
        query = query.in("status", ["pending_payment", "confirmed", "canceled"]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // auto-refresh a cada 30s
  });

  /* ── Configurações PIX ── */
  const { data: pixSettings } = useQuery({
    queryKey: ["pix-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hotel_settings" as any)
        .select("key, value")
        .in("key", ["pix_key", "whatsapp"]);
      const obj: Record<string, string> = {};
      (data || []).forEach((d: any) => { obj[d.key] = d.value; });
      return obj;
    },
  });

  /* ── Confirmar pagamento ── */
  const confirmMutation = useMutation({
    mutationFn: async ({ reservaId }: { reservaId: string }) => {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "confirmed" })
        .eq("id", reservaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("PIX confirmado! Clique em 'Avisar cliente' para enviar a mensagem.");
      qc.invalidateQueries({ queryKey: ["pix-reservas"] });
      qc.invalidateQueries({ queryKey: ["dash-reservations-all"] });
      qc.invalidateQueries({ queryKey: ["dash-pix-pendente"] });
      setConfirmandoId(null);
    },
    onError: () => toast.error("Erro ao confirmar pagamento."),
  });

  const buildMsgConfirmacao = (nome: string) =>
    encodeURIComponent(
      `✅ *Reserva Confirmada — Hotel SB*

Olá, ${nome}! Recebemos seu pagamento PIX e sua reserva foi *confirmada com sucesso*.

Em caso de dúvidas, entre em contato conosco. Até breve! 🏨`
    );

  /* ── Cancelar reserva ── */
  const cancelMutation = useMutation({
    mutationFn: async (reservaId: string) => {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "canceled" })
        .eq("id", reservaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva cancelada.");
      qc.invalidateQueries({ queryKey: ["pix-reservas"] });
      qc.invalidateQueries({ queryKey: ["dash-reservations-all"] });
    },
    onError: () => toast.error("Erro ao cancelar reserva."),
  });

  const pendingCount = reservas.filter((r: any) => r.status === "pending_payment").length;

  return (
    <div className="p-6 md:p-8 space-y-6 text-cream">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-cream/40 hover:text-primary text-sm font-body transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <span className="text-cream/20">/</span>
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-cream">Pagamentos PIX</h1>
        </div>
        {pendingCount > 0 && (
          <span className="ml-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold font-body animate-pulse">
            {pendingCount} aguardando
          </span>
        )}
      </div>

      {/* Info PIX configurado */}
      {pixSettings?.pix_key ? (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-sm text-emerald-300 font-body">
            Chave PIX ativa: <strong>{pixSettings.pix_key}</strong>
          </span>
          <Link to="/admin/configuracoes" className="ml-auto text-xs text-emerald-400/60 hover:text-emerald-400 font-body transition-colors">
            Editar →
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-sm text-amber-300 font-body">
            Chave PIX não configurada.{" "}
            <Link to="/admin/configuracoes" className="underline hover:text-amber-200">
              Configure agora →
            </Link>
          </span>
        </div>
      )}

      {/* Filtros + Refresh */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-charcoal-light border border-gold/10 rounded-lg p-1 gap-1">
          {[
            { key: "pending_payment", label: "Aguardando PIX" },
            { key: "all", label: "Todas" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-body font-semibold transition-all ${
                filter === f.key
                  ? "bg-primary text-black"
                  : "text-cream/40 hover:text-cream/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["pix-reservas"] })}
          className="flex items-center gap-1.5 text-xs text-cream/40 hover:text-primary font-body transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
        <span className="text-xs text-cream/20 font-body ml-auto">
          Atualiza automaticamente a cada 30s
        </span>
      </div>

      {/* Lista de reservas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-16">
          <QrCode className="w-12 h-12 text-cream/10 mx-auto mb-3" />
          <p className="text-cream/30 font-body text-sm">
            {filter === "pending_payment"
              ? "Nenhum pagamento PIX pendente 🎉"
              : "Nenhuma reserva encontrada"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservas.map((r: any) => {
            const guestName =
              r.profiles?.full_name || r.guests?.full_name || "Cliente não identificado";
            const guestPhone = r.profiles?.phone || r.guests?.phone || null;
            const guestEmail = r.profiles?.email || r.guests?.email || null;
            const cfg = statusConfig[r.status] || statusConfig["pending_payment"];
            const isPending = r.status === "pending_payment";

            return (
              <div
                key={r.id}
                className={`rounded-xl border p-5 transition-all ${
                  isPending
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-charcoal-light border-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Info principal */}
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Status + Data */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`flex items-center gap-1.5 text-xs font-semibold font-body px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${isPending ? "animate-pulse" : ""}`} />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-cream/25 font-body">
                        {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    {/* Cliente */}
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
                      <span className="text-cream font-semibold font-body text-sm">{guestName}</span>
                    </div>

                    {guestPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-cream/25 flex-shrink-0" />
                        <span className="text-cream/50 font-body text-xs">{guestPhone}</span>
                      </div>
                    )}

                    {/* Quarto + Datas */}
                    <div className="flex flex-wrap gap-4 text-xs font-body text-cream/50">
                      <span className="flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-primary/40" />
                        {r.rooms?.name || "—"} · {r.rooms?.category || ""}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-primary/40" />
                        {r.check_in?.split("-").reverse().join("/")} → {r.check_out?.split("-").reverse().join("/")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-primary/40" />
                        <strong className="text-primary">R$ {Number(r.total_price).toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  {isPending && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {confirmandoId !== r.id ? (
                        <button
                          onClick={() => setConfirmandoId(r.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-semibold font-body hover:bg-emerald-500/25 transition-all"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Confirmar PIX
                        </button>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-xs text-amber-400 font-body font-semibold">Confirmar pagamento?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmMutation.mutate({ reservaId: r.id })}
                              disabled={confirmMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold font-body hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                            >
                              {confirmMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              Sim
                            </button>
                            <button
                              onClick={() => setConfirmandoId(null)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 text-cream/40 text-xs font-body hover:bg-white/10 transition-all"
                            >
                              Não
                            </button>
                          </div>
                          {guestPhone && (
                            <a
                              href={`https://wa.me/55${guestPhone.replace(/\D/g, "")}?text=${buildMsgConfirmacao(guestName)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold font-body hover:bg-[#25D366]/20 transition-all"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Avisar cliente
                            </a>
                          )}
                        </div>
                      )}

                      {guestPhone && (
                        <a
                          href={`https://wa.me/55${guestPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${guestName}! Precisamos confirmar seu pagamento PIX para a reserva do ${r.rooms?.name}. Você já realizou o pagamento?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold font-body hover:bg-[#25D366]/20 transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Contatar cliente
                        </a>
                      )}

                      <button
                        onClick={() => {
                          if (window.confirm("Cancelar esta reserva?")) {
                            cancelMutation.mutate(r.id);
                          }
                        }}
                        disabled={cancelMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold font-body hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPix;
