import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft,
  LogIn,
  LogOut,
  Search,
  BedDouble,
  Users,
  Phone,
  Clock,
  CheckCircle2,
  RefreshCw,
  Home,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";
import { computeOperationStatus, type OperationStatus } from "@/lib/operationStatus";

type HousekeepingStatus = "clean" | "dirty" | "inspected" | "out_of_order" | "do_not_disturb";

interface DailyOp {
  reservation_id: string;
  check_in: string;
  check_out: string;
  status: string;
  guests_count: number;
  total_price: number;
  notes: string | null;
  guest_name: string | null;
  profile_id: string | null;
  guest_phone: string | null;
  room_name: string;
  room_category: string;
  room_id: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  id_document: string | null;
  actual_guests: number | null;
  extra_charges: number | null;
  checkin_notes: string | null;
  checkout_notes: string | null;
  housekeeping_status: HousekeepingStatus | null;
  occupancy_status: string | null;
  operation_status: OperationStatus;
}

const opStatusConfig: Record<OperationStatus, { label: string; color: string; icon: React.ElementType }> = {
  arriving_today: {
    label: "Chegando hoje",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: LogIn,
  },
  departing_today: {
    label: "Saindo hoje",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: LogOut,
  },
  in_house: {
    label: "Hospedado",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: Home,
  },
  checked_out: {
    label: "Check-out feito",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    icon: CheckCircle2,
  },
  upcoming: {
    label: "Próximo",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: Clock,
  },
};

const hkLabels: Record<HousekeepingStatus, { label: string; dot: string }> = {
  clean: { label: "Limpo", dot: "bg-green-400" },
  dirty: { label: "Sujo", dot: "bg-red-400" },
  inspected: { label: "Inspecionado", dot: "bg-blue-400" },
  out_of_order: { label: "Fora de serviço", dot: "bg-gray-400" },
  do_not_disturb: { label: "Não perturbe", dot: "bg-orange-400" },
};

const AdminCheckin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const [checkinDialog, setCheckinDialog] = useState<DailyOp | null>(null);
  const [ciDoc, setCiDoc] = useState("");
  const [ciGuests, setCiGuests] = useState(1);
  const [ciNotes, setCiNotes] = useState("");

  const [checkoutDialog, setCheckoutDialog] = useState<DailyOp | null>(null);
  const [coExtras, setCoExtras] = useState(0);
  const [coNotes, setCoNotes] = useState("");

  const {
    data: operations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["daily-operations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_operations")
        .select("*")
        .order("check_in", { ascending: true });
      if (error) throw error;
      // Override operation_status with unified client-side logic
      return (data as unknown as DailyOp[]).map((op) => ({
        ...op,
        operation_status: computeOperationStatus(op),
      }));
    },
    refetchInterval: 60_000,
  });

  const checkinMutation = useMutation({
    mutationFn: async (op: DailyOp) => {
      const { data, error } = await supabase.rpc("perform_checkin" as any, {
        p_reservation_id: op.reservation_id,
        p_staff_id: user!.id,
        p_id_document: ciDoc || null,
        p_actual_guests: ciGuests,
        p_notes: ciNotes || null,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || "Erro no check-in");
      return result;
    },
    onSuccess: () => {
      toast.success("Check-in realizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["daily-operations"] });
      setCheckinDialog(null);
      setCiDoc("");
      setCiGuests(1);
      setCiNotes("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const checkoutMutation = useMutation({
    mutationFn: async (op: DailyOp) => {
      const { data, error } = await supabase.rpc("perform_checkout" as any, {
        p_reservation_id: op.reservation_id,
        p_staff_id: user!.id,
        p_extra_charges: coExtras,
        p_notes: coNotes || null,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || "Erro no check-out");
      return result;
    },
    onSuccess: () => {
      toast.success("Check-out realizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["daily-operations"] });
      setCheckoutDialog(null);
      setCoExtras(0);
      setCoNotes("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = operations.filter((op) => {
    const matchStatus = filter === "all" || op.operation_status === filter;
    const matchSearch =
      !search ||
      op.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      op.room_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts: Record<string, number> = {
    all: operations.length,
    arriving_today: operations.filter((o) => o.operation_status === "arriving_today").length,
    departing_today: operations.filter((o) => o.operation_status === "departing_today").length,
    in_house: operations.filter((o) => o.operation_status === "in_house").length,
    checked_out: operations.filter((o) => o.operation_status === "checked_out").length,
    upcoming: operations.filter((o) => o.operation_status === "upcoming").length,
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <header className="bg-charcoal-light border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hotelLogo} alt="Hotel SB" className="h-10 w-auto object-contain" />
          <span className="text-cream/40 text-xs font-body">Admin — Recepção</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-cream/30 text-xs font-body hidden md:block">
            {format(new Date(), "EEEE, dd 'de' MMMM yyyy", { locale: ptBR })}
          </span>
          <button onClick={() => refetch()} className="text-cream/40 hover:text-primary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link to="/" className="text-cream/50 text-sm font-body hover:text-primary transition-colors">
            Ver Site →
          </Link>
        </div>
      </header>

      <div className="p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-6">
            <Link to="/admin" className="text-cream/40 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <LogIn className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-display text-2xl font-bold text-cream">Check-in / Check-out</h1>
              <p className="text-cream/40 text-sm font-body">Painel operacional da recepção</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Chegando hoje", value: counts.arriving_today, color: "text-amber-400" },
              { label: "Saindo hoje", value: counts.departing_today, color: "text-blue-400" },
              { label: "Hospedados", value: counts.in_house, color: "text-green-400" },
              { label: "Check-outs feitos", value: counts.checked_out, color: "text-cream/40" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-charcoal-light border border-gold/10 rounded-lg p-4 text-center">
                <p className={`font-display text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-cream/40 text-xs font-body mt-1">{kpi.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
              <Input
                placeholder="Buscar hóspede ou quarto…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-charcoal-light border-gold/10 text-cream placeholder:text-cream/30"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {(["all", "arriving_today", "departing_today", "in_house", "checked_out", "upcoming"] as const).map(
              (tab) => {
                const cfg = tab === "all" ? null : opStatusConfig[tab];
                const isActive = filter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition-all ${
                      isActive
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-charcoal-light border-gold/10 text-cream/50 hover:border-gold/30"
                    }`}
                  >
                    {tab === "all" ? "Todos" : cfg!.label}
                    <span className="ml-1 opacity-60">{counts[tab]}</span>
                  </button>
                );
              },
            )}
          </div>

          {isLoading ? (
            <p className="text-cream/40 text-center py-10 font-body">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-cream/40 text-center py-10 font-body">Nenhum registro encontrado.</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filtered.map((op, i) => {
                  const opCfg = opStatusConfig[op.operation_status];
                  const Icon = opCfg.icon;
                  const hk = op.housekeeping_status ? hkLabels[op.housekeeping_status] : null;

                  return (
                    <motion.div
                      key={op.reservation_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                    >
                      <div className="bg-charcoal-light border border-gold/10 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4 hover:border-gold/20 transition-colors">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${opCfg.color}`}
                            >
                              <Icon className="w-3 h-3" />
                              {opCfg.label}
                            </span>
                            {hk && (
                              <span className="inline-flex items-center gap-1 text-xs text-cream/40">
                                <span className={`w-2 h-2 rounded-full ${hk.dot}`} />
                                {hk.label}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-cream/30" />
                            <span className="text-cream font-body font-medium">
                              {op.guest_name || "Hóspede sem nome"}
                            </span>
                            {op.profile_id ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                Online
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Presencial
                              </span>
                            )}
                            {op.guest_phone && (
                              <span className="text-cream/30 text-sm flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {op.guest_phone}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-cream/40 text-sm font-body">
                            <span className="flex items-center gap-1">
                              <BedDouble className="w-3.5 h-3.5" />
                              {op.room_name} · {op.room_category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {format(new Date(op.check_in + "T12:00:00"), "dd/MM")} →{" "}
                              {format(new Date(op.check_out + "T12:00:00"), "dd/MM/yyyy")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {op.guests_count} hóspede{op.guests_count !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {op.checked_in_at && (
                            <p className="text-cream/30 text-xs font-body">
                              Check-in: {format(new Date(op.checked_in_at), "dd/MM/yyyy HH:mm")}
                              {op.checked_out_at && (
                                <> · Check-out: {format(new Date(op.checked_out_at), "dd/MM/yyyy HH:mm")}</>
                              )}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-display text-lg font-bold text-primary">
                            R$ {Number(op.total_price).toFixed(2)}
                          </p>
                          {op.extra_charges ? (
                            <p className="text-cream/30 text-xs font-body">
                              + R$ {Number(op.extra_charges).toFixed(2)} extras
                            </p>
                          ) : null}
                        </div>

                        <div className="flex gap-2 shrink-0">
                          {op.operation_status === "arriving_today" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setCiGuests(op.guests_count);
                                setCheckinDialog(op);
                              }}
                              className="bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 font-body"
                            >
                              <LogIn className="w-4 h-4 mr-1" />
                              Check-in
                            </Button>
                          )}
                          {(op.operation_status === "departing_today" || op.operation_status === "in_house") && (
                            <Button
                              size="sm"
                              onClick={() => setCheckoutDialog(op)}
                              className="bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 font-body"
                            >
                              <LogOut className="w-4 h-4 mr-1" />
                              Check-out
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      <Dialog open={!!checkinDialog} onOpenChange={() => setCheckinDialog(null)}>
        <DialogContent className="bg-charcoal-light border border-gold/20 text-cream max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <LogIn className="w-5 h-5 text-amber-400" />
              Realizar Check-in
            </DialogTitle>
          </DialogHeader>

          {checkinDialog && (
            <div className="space-y-4 py-2">
              <div className="bg-charcoal rounded-lg p-3 border border-gold/10">
                <p className="text-cream font-body font-medium">{checkinDialog.guest_name}</p>
                <p className="text-cream/40 text-sm font-body">
                  {checkinDialog.room_name} · {format(new Date(checkinDialog.check_in + "T12:00:00"), "dd/MM")} →{" "}
                  {format(new Date(checkinDialog.check_out + "T12:00:00"), "dd/MM/yyyy")}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-cream/60 text-sm font-body">Documento (RG / CPF / Passaporte)</Label>
                <Input
                  value={ciDoc}
                  onChange={(e) => setCiDoc(e.target.value)}
                  placeholder="Ex: 123.456.789-00"
                  className="bg-charcoal border-gold/10 text-cream placeholder:text-cream/30"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-cream/60 text-sm font-body">Hóspedes que chegaram</Label>
                <Input
                  type="number"
                  min={1}
                  value={ciGuests}
                  onChange={(e) => setCiGuests(Number(e.target.value))}
                  className="bg-charcoal border-gold/10 text-cream"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-cream/60 text-sm font-body">Observações</Label>
                <Textarea
                  value={ciNotes}
                  onChange={(e) => setCiNotes(e.target.value)}
                  placeholder="Preferências, pedidos especiais…"
                  className="bg-charcoal border-gold/10 text-cream placeholder:text-cream/30 resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCheckinDialog(null)}
              className="border-gold/20 text-cream/50 font-body"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => checkinDialog && checkinMutation.mutate(checkinDialog)}
              disabled={checkinMutation.isPending}
              className="bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 font-body"
            >
              {checkinMutation.isPending ? "Processando…" : "Confirmar Check-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!checkoutDialog} onOpenChange={() => setCheckoutDialog(null)}>
        <DialogContent className="bg-charcoal-light border border-gold/20 text-cream max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <LogOut className="w-5 h-5 text-blue-400" />
              Realizar Check-out
            </DialogTitle>
          </DialogHeader>

          {checkoutDialog && (
            <div className="space-y-4 py-2">
              <div className="bg-charcoal rounded-lg p-3 border border-gold/10">
                <p className="text-cream font-body font-medium">{checkoutDialog.guest_name}</p>
                <p className="text-cream/40 text-sm font-body">
                  {checkoutDialog.room_name} · hospedado desde{" "}
                  {checkoutDialog.checked_in_at
                    ? format(new Date(checkoutDialog.checked_in_at), "dd/MM/yyyy HH:mm")
                    : "—"}
                </p>
              </div>

              <div className="space-y-1">
                <Label className="text-cream/60 text-sm font-body">Cobranças extras (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={coExtras}
                  onChange={(e) => setCoExtras(Number(e.target.value))}
                  placeholder="0.00"
                  className="bg-charcoal border-gold/10 text-cream placeholder:text-cream/30"
                />
                <p className="text-cream/30 text-xs font-body">Frigobar, room service, danos, etc.</p>
              </div>

              <div className="space-y-1">
                <Label className="text-cream/60 text-sm font-body">Observações</Label>
                <Textarea
                  value={coNotes}
                  onChange={(e) => setCoNotes(e.target.value)}
                  placeholder="Observações da saída…"
                  className="bg-charcoal border-gold/10 text-cream placeholder:text-cream/30 resize-none"
                  rows={3}
                />
              </div>

              <div className="bg-charcoal rounded-lg p-3 border border-gold/10 flex justify-between items-center">
                <span className="text-cream/60 font-body text-sm">Total da estadia</span>
                <span className="font-display text-lg font-bold text-primary">
                  R$ {(Number(checkoutDialog.total_price) + coExtras).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCheckoutDialog(null)}
              className="border-gold/20 text-cream/50 font-body"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => checkoutDialog && checkoutMutation.mutate(checkoutDialog)}
              disabled={checkoutMutation.isPending}
              className="bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 font-body"
            >
              {checkoutMutation.isPending ? "Processando…" : "Confirmar Check-out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCheckin;
