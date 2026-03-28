// ─── AdminCheckout ─────────────────────────────────────────────────────────────
// Módulo de checkout: soma quarto + consumos e gera conta final do hóspede
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Receipt, Search, BedDouble, UtensilsCrossed,
  CheckCircle2, Loader2, X, Printer, AlertCircle, DollarSign,
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
  created_at: string;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const AdminCheckout = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["checkout-reservations"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reservations")
        .select("*, rooms(name, price), profiles(full_name, phone)")
        .in("status", ["confirmed", "pending"])
        .order("check_in", { ascending: false });
      if (error) throw error;
      return data as Reservation[];
    },
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["checkout-orders", selectedRes?.rooms?.name],
    enabled: !!selectedRes,
    queryFn: async () => {
      const roomName = selectedRes!.rooms?.name;
      if (!roomName) return [];
      const { data, error } = await (supabase as any)
        .from("consumption_orders")
        .select("*")
        .eq("room_number", roomName)
        .neq("status", "billed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ConsumptionOrder[];
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRes) throw new Error("Nenhuma reserva selecionada.");

      if (orders.length > 0) {
        const { error: ordersError } = await (supabase as any)
          .from("consumption_orders")
          .update({ status: "billed" })
          .in("id", orders.map((o) => o.id));
        if (ordersError) throw ordersError;
      }

      const { error: resError } = await (supabase as any)
        .from("reservations")
        .update({ status: "completed" })
        .eq("id", selectedRes.id);
      if (resError) throw resError;
    },
    onSuccess: () => {
      toast.success("Checkout finalizado com sucesso!");
      qc.invalidateQueries({ queryKey: ["checkout-reservations"] });
      qc.invalidateQueries({ queryKey: ["checkout-orders"] });
      setConfirmModal(false);
      setSelectedRes(null);
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao finalizar checkout."),
  });

  const nights = selectedRes
    ? Math.max(1, differenceInDays(new Date(selectedRes.check_out), new Date(selectedRes.check_in)))
    : 0;
  const roomTotal = selectedRes ? (selectedRes.rooms?.price ?? 0) * nights || selectedRes.total_price : 0;
  const consumoTotal = orders.reduce((s, o) => s + Number(o.total), 0);
  const grandTotal = roomTotal + consumoTotal;

  const filtered = reservations.filter((r) => {
    const q = search.toLowerCase();
    const name = r.profiles?.full_name?.toLowerCase() ?? "";
    const room = r.rooms?.name?.toLowerCase() ?? "";
    return !q || name.includes(q) || room.includes(q);
  });

  return (
    <div className="min-h-screen bg-charcoal text-cream">
      {/* NAV */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-charcoal/80 border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hotelLogo} alt="Hotel SB" className="h-8 w-auto object-contain" />
          <span className="text-white/20 text-xs tracking-[0.2em] uppercase font-body">Admin</span>
        </div>
        <Link to="/" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-primary transition-colors font-body">
          Ver Site →
        </Link>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <motion.div {...fadeUp(0)} className="flex items-center gap-2 text-sm font-body">
          <Link to="/admin" className="text-white/40 hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <span className="text-white/20">/</span>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/15">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-cream">Checkout</h1>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Lista de reservas ── */}
          <motion.div {...fadeUp(0.05)} className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Buscar hóspede ou quarto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-charcoal-light border border-white/10 text-cream placeholder:text-white/25 text-sm font-body focus:outline-none focus:border-primary/40 transition"
              />
            </div>

            {isLoading ? (
              <p className="text-white/30 text-sm font-body text-center py-8">Carregando...</p>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-8 h-8 text-white/15 mb-2" />
                <p className="text-white/30 text-sm font-body">Nenhuma reserva ativa.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                {filtered.map((res) => {
                  const name = res.profiles?.full_name ?? "Hóspede";
                  const room = res.rooms?.name ?? "—";
                  const isSelected = selectedRes?.id === res.id;
                  return (
                    <button
                      key={res.id}
                      onClick={() => setSelectedRes(res)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                        isSelected
                          ? "border-primary/40 bg-primary/10"
                          : "border-white/5 bg-charcoal-light hover:border-primary/25"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-cream font-body">{name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded font-body font-bold ${
                          res.status === "confirmed"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-amber-500/15 text-amber-400"
                        }`}>
                          {res.status === "confirmed" ? "Confirmada" : "Pendente"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-white/40 font-body">
                        <span>{room}</span>
                        <span>
                          {format(new Date(res.check_in + "T12:00:00"), "dd/MM", { locale: ptBR })} →{" "}
                          {format(new Date(res.check_out + "T12:00:00"), "dd/MM", { locale: ptBR })}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* ── Conta do hóspede ── */}
          <motion.div {...fadeUp(0.1)} className="lg:col-span-3">
            {!selectedRes ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <Receipt className="w-12 h-12 text-white/10 mb-3" />
                <p className="text-white/25 text-sm font-body">Selecione uma reserva para ver a conta</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/5 bg-charcoal-light overflow-hidden">
                {/* Header da conta */}
                <div className="p-5 border-b border-white/5 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-cream font-body">Conta do hóspede</h2>
                      <p className="text-xs text-white/50 font-body mt-0.5">
                        {selectedRes.profiles?.full_name ?? "Hóspede"}
                      </p>
                      <p className="text-xs text-white/30 font-body">
                        {selectedRes.rooms?.name} · {nights} {nights === 1 ? "noite" : "noites"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedRes(null)} className="text-white/30 hover:text-cream transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Hospedagem */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BedDouble className="w-4 h-4 text-primary" />
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-white/35 font-body">
                        Hospedagem
                      </h3>
                    </div>
                    <div className="bg-charcoal/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-cream font-body">{selectedRes.rooms?.name}</p>
                          <p className="text-xs text-white/40 font-body">
                            {format(new Date(selectedRes.check_in + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} →{" "}
                            {format(new Date(selectedRes.check_out + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} · {nights}{" "}
                            {nights === 1 ? "noite" : "noites"}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-cream font-body">R$ {roomTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Consumos */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <UtensilsCrossed className="w-4 h-4 text-primary" />
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-white/35 font-body">
                        Consumos
                      </h3>
                    </div>
                    {loadingOrders ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="bg-charcoal/50 rounded-lg p-3">
                        <p className="text-xs text-white/30 text-center font-body">Nenhum consumo registrado</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {orders.map((o) => (
                          <div key={o.id} className="flex items-center justify-between bg-charcoal/50 rounded-lg p-3">
                            <div>
                              <p className="text-sm text-cream font-body">{o.item_name}</p>
                              <p className="text-xs text-white/40 font-body">
                                {o.quantity}x · R$ {Number(o.unit_price).toFixed(2)} ·{" "}
                                {format(new Date(o.created_at), "dd/MM HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-cream font-body">R$ {Number(o.total).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-white/50 font-body">
                        <span>Hospedagem</span>
                        <span>R$ {roomTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-white/50 font-body">
                        <span>Consumos</span>
                        <span>R$ {consumoTotal.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-white/10 pt-2" />
                      <div className="flex items-center justify-between text-lg font-bold text-cream font-body">
                        <span>Total</span>
                        <span>R$ {grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botão checkout */}
                  <button
                    onClick={() => setConfirmModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-body font-semibold text-sm tracking-wide transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] bg-primary text-charcoal"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Finalizar Checkout — R$ {grandTotal.toFixed(2)}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modal confirmação */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-charcoal-light border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center space-y-4"
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-cream font-display">Confirmar Checkout?</h3>
              <p className="text-sm text-white/50 font-body">
                {selectedRes?.profiles?.full_name ?? "Hóspede"} · {selectedRes?.rooms?.name}
              </p>
              <p className="text-2xl font-bold text-cream font-body">R$ {grandTotal.toFixed(2)}</p>
              <div className="bg-charcoal/50 rounded-lg p-3">
                <p className="text-xs text-white/40 font-body">
                  A reserva será marcada como concluída e todos os consumos serão faturados.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(false)}
                  className="flex-1 border border-white/10 text-white/60 rounded-lg py-3 text-sm font-body hover:text-cream transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  className="flex-1 rounded-lg py-3 text-sm font-semibold font-body transition-all disabled:opacity-50 bg-primary text-charcoal"
                >
                  {checkoutMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Processando...
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
    </div>
  );
};

export default AdminCheckout;
