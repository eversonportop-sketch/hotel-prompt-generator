// ─── AdminCheckout ─────────────────────────────────────────────────────────────
// Checkout completo: conta do hóspede, histórico e recibo PDF
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Receipt,
  Search,
  BedDouble,
  UtensilsCrossed,
  CheckCircle2,
  Loader2,
  X,
  FileText,
  DollarSign,
  History,
  Printer,
  Calendar,
  User,
  Star,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

interface Reservation {
  id: string;
  room_id: string;
  client_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  notes: string | null;
  rooms: { name: string; price: number } | null;
  profiles: { full_name: string | null; phone: string | null } | null;
}

interface ConsumptionOrder {
  id: string;
  room_number: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
}

const AdminCheckout = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"open" | "history">("open");
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [receiptRes, setReceiptRes] = useState<Reservation | null>(null);
  const [receiptOrders, setReceiptOrders] = useState<ConsumptionOrder[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // Contas abertas: checked_in_at NOT NULL e checked_out_at IS NULL
  const { data: openReservations = [], isLoading } = useQuery({
    queryKey: ["checkout-open"],
    queryFn: async () => {
      // Buscar reservas com check-in feito e check-out pendente
      // checked_in_at e checked_out_at estão diretamente na tabela reservations
      const { data, error } = await supabase
        .from("reservations")
        .select("*, rooms(name, price), profiles!reservations_profile_id_fkey(full_name, phone)")
        .eq("status", "checked_in")
        .not("checked_in_at", "is", null)
        .is("checked_out_at", null)
        .order("check_in", { ascending: false });
      if (error) throw error;

      // Todos os resultados já possuem check-in feito e checkout pendente
      const filtered = data || [];

      // Buscar consumo aberto agrupado por reservation_id
      const ids = filtered.map((r: any) => r.id);
      let consumoMap: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: consumos } = await supabase
          .from("consumption_orders")
          .select("reservation_id, total")
          .in("reservation_id", ids)
          .in("status", ["pending", "delivered"]);
        (consumos || []).forEach((c: any) => {
          consumoMap[c.reservation_id] = (consumoMap[c.reservation_id] || 0) + Number(c.total);
        });
      }

      return filtered.map((r: any) => ({ ...r, _consumoTotal: consumoMap[r.id] || 0 })) as (Reservation & {
        _consumoTotal: number;
      })[];
    },
  });

  // Histórico: reservas com status checked_out
  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["checkout-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, rooms(name, price), profiles!reservations_profile_id_fkey(full_name, phone)")
        .eq("status", "checked_out")
        .order("check_out", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Reservation[];
    },
  });

  // Consumos da reserva selecionada
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["checkout-orders", selectedRes?.id],
    enabled: !!selectedRes,
    queryFn: async () => {
      if (!selectedRes) return [];

      // Tenta primeiro por reservation_id (confiável, independe do nome do quarto)
      const { data: byResId } = await (supabase as any)
        .from("consumption_orders")
        .select("*")
        .eq("reservation_id", selectedRes.id)
        .in("status", ["pending", "delivered"])
        .order("created_at", { ascending: true });

      if (byResId && byResId.length > 0) return byResId as ConsumptionOrder[];

      // Fallback: busca por room_number (compatibilidade com dados antigos)
      const roomName = (selectedRes.rooms as any)?.name;
      if (!roomName) return [];
      const { data, error } = await supabase
        .from("consumption_orders")
        .select("*")
        .eq("room_number", roomName)
        .in("status", ["pending", "delivered"])
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ConsumptionOrder[];
    },
  });

  // Finalizar checkout
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRes) throw new Error("Nenhuma reserva selecionada.");
      if (orders.length > 0) {
        const { error } = await supabase
          .from("consumption_orders")
          .update({ status: "billed" })
          .in(
            "id",
            orders.map((o) => o.id),
          );
        if (error) throw error;
      }
      const { error } = await supabase.from("reservations").update({ status: "checked_out", checked_out_at: new Date().toISOString() }).eq("id", selectedRes.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Checkout finalizado!");
      // Salva para exibir recibo
      setReceiptRes(selectedRes);
      setReceiptOrders(orders);
      qc.invalidateQueries({ queryKey: ["checkout-open"] });
      qc.invalidateQueries({ queryKey: ["checkout-history"] });
      setConfirmModal(false);
      setSelectedRes(null);
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao finalizar checkout."),
  });

  // Calculos
  const nights = selectedRes
    ? Math.max(1, differenceInDays(new Date(selectedRes.check_out), new Date(selectedRes.check_in)))
    : 0;
  const roomPrice = (selectedRes?.rooms as any)?.price ?? 0;
  const roomTotal = (roomPrice * nights || selectedRes?.total_price) ?? 0;
  const consumoTotal = orders.reduce((s, o) => s + Number(o.total), 0);
  const grandTotal = roomTotal + consumoTotal;

  // Calculos do recibo
  const receiptNights = receiptRes
    ? Math.max(1, differenceInDays(new Date(receiptRes.check_out), new Date(receiptRes.check_in)))
    : 0;
  const receiptRoomPrice = (receiptRes?.rooms as any)?.price ?? 0;
  const receiptRoomTotal = (receiptRoomPrice * receiptNights || receiptRes?.total_price) ?? 0;
  const receiptConsumoTotal = receiptOrders.reduce((s, o) => s + Number(o.total), 0);
  const receiptGrandTotal = receiptRoomTotal + receiptConsumoTotal;

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Recibo - SB Hotel</title>
      <style>
        body { font-family: Georgia, serif; max-width: 500px; margin: 40px auto; color: #111; }
        .gold { color: #C9A84C; }
        .header { text-align: center; border-bottom: 2px solid #C9A84C; padding-bottom: 20px; margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
        .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: bold; border-top: 2px solid #C9A84C; margin-top: 8px; }
        .section-title { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #C9A84C; margin: 16px 0 8px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
        @media print { body { margin: 20px; } }
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
  };

  const filteredOpen = openReservations.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (r.profiles as any)?.full_name?.toLowerCase().includes(q) ||
      (r.rooms as any)?.name?.toLowerCase().includes(q)
    );
  });

  const filteredHistory = history.filter((r) => {
    const q = historySearch.toLowerCase();
    return (
      !q ||
      (r.profiles as any)?.full_name?.toLowerCase().includes(q) ||
      (r.rooms as any)?.name?.toLowerCase().includes(q)
    );
  });

  const ResCard = ({
    res,
    selected,
    onClick,
  }: {
    res: Reservation & { _consumoTotal?: number };
    selected: boolean;
    onClick: () => void;
  }) => {
    const n = Math.max(1, differenceInDays(new Date(res.check_out), new Date(res.check_in)));
    const rp = (res.rooms as any)?.price ?? 0;
    const diarias = rp * n || res.total_price || 0;
    const consumo = (res as any)._consumoTotal || 0;
    const estimado = diarias + consumo;
    return (
      <button
        onClick={onClick}
        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
          selected ? "border-primary/50 bg-primary/10" : "border-gold/10 bg-charcoal-light hover:border-gold/25"
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-cream font-body font-semibold text-sm">{(res.profiles as any)?.full_name ?? "Hóspede"}</p>
          <span className="font-display font-bold text-primary text-sm">R$ {estimado.toFixed(2)}</span>
        </div>
        <p className="text-cream/50 font-body text-xs mb-1">{(res.rooms as any)?.name ?? "—"}</p>
        <div className="flex items-center gap-3 text-xs text-cream/40 font-body">
          <span>
            <Calendar className="w-3 h-3 inline mr-1" />
            {format(new Date(res.check_in + "T12:00:00"), "dd/MM", { locale: ptBR })} →{" "}
            {format(new Date(res.check_out + "T12:00:00"), "dd/MM", { locale: ptBR })} · {n}n
          </span>
          {consumo > 0 && <span>+ consumo R$ {consumo.toFixed(2)}</span>}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <header className="bg-charcoal-light border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hotelLogo} alt="SB Hotel" className="h-10 w-auto object-contain" />
          <span className="text-cream/40 text-xs font-body">Admin</span>
        </div>
        <Link to="/" className="text-cream/50 text-sm font-body hover:text-primary transition-colors">
          Ver Site →
        </Link>
      </header>

      <div className="p-6 md:p-10">
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-cream/50 hover:text-primary text-sm font-body transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="text-cream/20">/</span>
          <Receipt className="w-5 h-5 text-primary" />
          <h1 className="font-display text-2xl font-bold text-cream">Checkout</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-charcoal-light border border-gold/10 rounded-xl p-1 w-fit">
          {[
            { key: "open", label: "Contas Abertas", icon: DollarSign },
            { key: "history", label: "Histórico", icon: History },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-body transition-all ${
                tab === t.key
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-cream/40 hover:text-cream/70"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Contas Abertas ── */}
        {tab === "open" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Lista */}
            <div className="lg:col-span-2 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-charcoal-light border border-gold/10 rounded-lg text-cream text-sm placeholder:text-cream/30 focus:border-primary/40 focus:outline-none transition"
                  placeholder="Buscar hóspede ou quarto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {isLoading ? (
                <div className="text-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary/40 mx-auto" />
                </div>
              ) : filteredOpen.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
                  <p className="text-cream/30 font-body text-sm">Nenhuma conta aberta</p>
                </div>
              ) : (
                filteredOpen.map((res) => (
                  <ResCard
                    key={res.id}
                    res={res}
                    selected={selectedRes?.id === res.id}
                    onClick={() => setSelectedRes(res)}
                  />
                ))
              )}
            </div>

            {/* Conta */}
            <div className="lg:col-span-3">
              {!selectedRes ? (
                <div className="flex flex-col items-center justify-center h-80 rounded-2xl border border-dashed border-gold/15">
                  <Receipt className="w-12 h-12 text-primary/20 mb-4" />
                  <p className="text-cream/30 font-body text-sm">Selecione uma reserva para ver a conta</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-charcoal-light border border-gold/15 rounded-2xl overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="relative p-6 border-b border-gold/10"
                    style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.02))" }}
                  >
                    <div
                      className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                      style={{ background: "radial-gradient(circle,#C9A84C,transparent)" }}
                    />
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-xs text-primary/70 font-body tracking-widest uppercase mb-1">
                          Conta do hóspede
                        </p>
                        <h2 className="font-display text-xl font-bold text-cream">
                          {(selectedRes.profiles as any)?.full_name ?? "Hóspede"} —{" "}
                          {(selectedRes.rooms as any)?.name ?? "Quarto"}
                        </h2>
                        <p className="text-cream/40 font-body text-sm mt-0.5">
                          {nights} {nights === 1 ? "noite" : "noites"}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedRes(null)}
                        className="text-cream/30 hover:text-cream transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Hospedagem */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BedDouble className="w-4 h-4 text-primary" />
                        <p className="text-xs text-primary/70 font-body tracking-widest uppercase">Hospedagem</p>
                      </div>
                      <div className="bg-charcoal rounded-xl border border-white/5 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-cream font-body text-sm font-medium">
                              {(selectedRes.rooms as any)?.name}
                            </p>
                            <p className="text-cream/40 font-body text-xs mt-0.5">
                              {format(new Date(selectedRes.check_in + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} →{" "}
                              {format(new Date(selectedRes.check_out + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} ·{" "}
                              {nights} {nights === 1 ? "noite" : "noites"} · R$ {roomPrice.toFixed(2)}/noite
                            </p>
                          </div>
                          <p className="font-display font-bold text-cream">R$ {roomTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Consumos */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <UtensilsCrossed className="w-4 h-4 text-primary" />
                        <p className="text-xs text-primary/70 font-body tracking-widest uppercase">Consumos</p>
                        {loadingOrders && <Loader2 className="w-3 h-3 animate-spin text-cream/30" />}
                      </div>
                      {orders.length === 0 ? (
                        <div className="bg-charcoal rounded-xl border border-white/5 p-4 text-center">
                          <p className="text-cream/30 font-body text-sm">Nenhum consumo pendente</p>
                        </div>
                      ) : (
                        <div className="bg-charcoal rounded-xl border border-white/5 divide-y divide-white/5">
                          {orders.map((o) => (
                            <div key={o.id} className="flex items-center justify-between px-4 py-3">
                              <div>
                                <p className="text-cream font-body text-sm">{o.item_name}</p>
                                <p className="text-cream/30 font-body text-xs">
                                  {o.quantity}× · R$ {Number(o.unit_price).toFixed(2)} ·{" "}
                                  {format(new Date(o.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                  {o.notes && ` · "${o.notes}"`}
                                </p>
                              </div>
                              <p className="font-body font-semibold text-cream text-sm">
                                R$ {Number(o.total).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div
                      className="relative overflow-hidden rounded-xl border border-gold/20 p-5"
                      style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.02))" }}
                    >
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm font-body text-cream/60">
                          <span>Hospedagem ({nights}n)</span>
                          <span>R$ {roomTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-body text-cream/60">
                          <span>Consumos ({orders.length} itens)</span>
                          <span>R$ {consumoTotal.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-gold/15 my-2" />
                        <div className="flex justify-between items-center">
                          <span className="font-display font-bold text-cream text-lg">Total</span>
                          <span className="font-display font-bold text-primary text-2xl">
                            R$ {grandTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setConfirmModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-body font-semibold text-sm tracking-wide transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(201,168,76,0.3)]"
                      style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)", color: "#000" }}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Finalizar Checkout — R$ {grandTotal.toFixed(2)}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Histórico ── */}
        {tab === "history" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative mb-4 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-charcoal-light border border-gold/10 rounded-lg text-cream text-sm placeholder:text-cream/30 focus:border-primary/40 focus:outline-none transition"
                placeholder="Buscar no histórico..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
            {loadingHistory ? (
              <div className="text-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary/40 mx-auto" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-20">
                <History className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                <p className="text-cream/30 font-body">Nenhum checkout concluído ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((res, i) => {
                  const n = Math.max(1, differenceInDays(new Date(res.check_out), new Date(res.check_in)));
                  const rp = (res.rooms as any)?.price ?? 0;
                  const rt = rp * n || res.total_price;
                  return (
                    <motion.div
                      key={res.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-charcoal-light border border-gold/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-gold/20 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-primary/60" />
                          <p className="text-cream font-body font-semibold text-sm">
                            {(res.profiles as any)?.full_name ?? "Hóspede"}
                          </p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-body">
                            Concluída
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-cream/40 font-body">
                          <span className="flex items-center gap-1">
                            <BedDouble className="w-3 h-3" />
                            {(res.rooms as any)?.name ?? "—"}
                          </span>
                          <span>
                            {format(new Date(res.check_in + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} →{" "}
                            {format(new Date(res.check_out + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <span>
                            {n} {n === 1 ? "noite" : "noites"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-display font-bold text-primary text-lg">R$ {rt.toFixed(2)}</p>
                        <button
                          onClick={async () => {
                            const roomName = (res.rooms as any)?.name;
                            if (roomName) {
                              const { data } = await supabase
                                .from("consumption_orders")
                                .select("*")
                                .eq("room_number", roomName)
                                .eq("status", "billed")
                                .gte("created_at", res.check_in)
                                .lte("created_at", res.check_out + "T23:59:59");
                              setReceiptOrders(data ?? []);
                            } else {
                              setReceiptOrders([]);
                            }
                            setReceiptRes(res);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gold/20 text-cream/60 hover:text-primary hover:border-primary/40 text-sm font-body transition-all"
                        >
                          <FileText className="w-4 h-4" /> Recibo
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Modal confirmação checkout ── */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-charcoal border border-gold/20 rounded-2xl p-8 max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-5">
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-cream mb-2">Confirmar Checkout?</h3>
              <p className="text-cream/50 text-sm font-body mb-1">
                {(selectedRes?.profiles as any)?.full_name ?? "Hóspede"} · {(selectedRes?.rooms as any)?.name}
              </p>
              <div className="my-4 space-y-1 text-sm font-body">
                <div className="flex justify-between text-cream/50 px-4">
                  <span>Hospedagem</span>
                  <span>R$ {roomTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-cream/50 px-4">
                  <span>Consumos</span>
                  <span>R$ {consumoTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-primary font-bold text-base px-4 pt-2 border-t border-gold/15">
                  <span>Total</span>
                  <span>R$ {grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
                <p className="text-yellow-400 text-xs font-body">A reserva será concluída e consumos faturados.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(false)}
                  className="flex-1 border border-gold/20 text-cream/60 rounded-lg py-3 text-sm font-body hover:text-cream transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  className="flex-1 rounded-lg py-3 text-sm font-semibold font-body transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)", color: "#000" }}
                >
                  {checkoutMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </span>
                  ) : (
                    "Confirmar"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Recibo ── */}
      <AnimatePresence>
        {receiptRes && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={(e) => e.target === e.currentTarget && setReceiptRes(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Conteúdo imprimível */}
              <div ref={printRef} className="p-8">
                <div className="header text-center border-b-2 border-[#C9A84C] pb-5 mb-5">
                  <p style={{ fontSize: 28, fontWeight: "bold", color: "#111", letterSpacing: 3 }}>SB HOTEL</p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#C9A84C",
                      letterSpacing: 4,
                      textTransform: "uppercase",
                      marginTop: 4,
                    }}
                  >
                    Sleep Better · Butiá, RS
                  </p>
                  <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>RECIBO DE HOSPEDAGEM</p>
                  <p style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
                    {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      fontSize: 11,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "#C9A84C",
                      marginBottom: 8,
                    }}
                  >
                    Hóspede
                  </p>
                  <p style={{ fontSize: 15, fontWeight: "bold", color: "#111" }}>
                    {(receiptRes.profiles as any)?.full_name ?? "Hóspede"}
                  </p>
                  {(receiptRes.profiles as any)?.phone && (
                    <p style={{ fontSize: 13, color: "#666" }}>{(receiptRes.profiles as any)?.phone}</p>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <p
                    style={{
                      fontSize: 11,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "#C9A84C",
                      marginBottom: 8,
                    }}
                  >
                    Hospedagem
                  </p>
                  <div
                    className="row"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px solid #eee",
                      fontSize: 14,
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: "bold", color: "#111" }}>{(receiptRes.rooms as any)?.name}</p>
                      <p style={{ color: "#888", fontSize: 12 }}>
                        {format(new Date(receiptRes.check_in + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} →{" "}
                        {format(new Date(receiptRes.check_out + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} ·{" "}
                        {receiptNights} {receiptNights === 1 ? "noite" : "noites"}
                      </p>
                    </div>
                    <p style={{ fontWeight: "bold", color: "#111" }}>R$ {receiptRoomTotal.toFixed(2)}</p>
                  </div>
                </div>

                {receiptOrders.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p
                      style={{
                        fontSize: 11,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        color: "#C9A84C",
                        marginBottom: 8,
                      }}
                    >
                      Consumos
                    </p>
                    {receiptOrders.map((o) => (
                      <div
                        key={o.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "6px 0",
                          borderBottom: "1px solid #eee",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ color: "#333" }}>
                          {o.item_name} × {o.quantity}
                        </span>
                        <span style={{ fontWeight: "bold", color: "#111" }}>R$ {Number(o.total).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "14px 0",
                    borderTop: "2px solid #C9A84C",
                    marginTop: 8,
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                >
                  <span style={{ color: "#111" }}>TOTAL</span>
                  <span style={{ color: "#C9A84C" }}>R$ {receiptGrandTotal.toFixed(2)}</span>
                </div>

                <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid #eee" }}>
                  <p style={{ fontSize: 12, color: "#999" }}>Obrigado pela sua estadia!</p>
                  <p style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>SB Hotel · Sleep Better · sbhotel.com</p>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 p-5 bg-gray-50 border-t">
                <button
                  onClick={() => setReceiptRes(null)}
                  className="flex-1 border border-gray-200 text-gray-500 rounded-lg py-2.5 text-sm font-body hover:bg-gray-100 transition"
                >
                  Fechar
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold font-body transition-all"
                  style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)", color: "#000" }}
                >
                  <Printer className="w-4 h-4" /> Imprimir / PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCheckout;
