// ─── AdminConsumo ──────────────────────────────────────────────────────────────
// Módulo completo: consumo do frigobar e room service
// Tabelas Supabase: consumption_items (cardápio), consumption_orders (pedidos)
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  UtensilsCrossed,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Search,
  ShoppingCart,
  Package,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Clock,
  BedDouble,
  Bell,
  TrendingUp,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface ConsumptionItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  description: string | null;
  display_order: number;
}

interface ConsumptionOrder {
  id: string;
  room_number: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  status: string; // pending | delivered | billed
  notes: string | null;
  created_at: string;
}

const CATEGORIES = ["Bebidas", "Snacks", "Laticínios", "Sobremesas", "Room Service", "Outros"];

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  delivered: { label: "Entregue", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  billed: { label: "Faturado", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

const EMPTY_ITEM = { name: "", category: "Bebidas", price: 0, available: true, description: "", display_order: 0 };
const EMPTY_ORDER = { room_number: "", item_id: "", quantity: 1, notes: "", reservation_id: "" };

// ── PIN de supervisor ──────────────────────────────────────────────────────────
const SUPERVISOR_PIN = "Andre1982ok";

// ── Modal de PIN ───────────────────────────────────────────────────────────────
const PinModal = ({
  title,
  description,
  onClose,
  onSuccess,
}: {
  title: string;
  description: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);

  const handleConfirm = () => {
    if (pinValue === SUPERVISOR_PIN) {
      onSuccess();
      onClose();
    } else {
      setPinError(true);
      setPinValue("");
      setTimeout(() => setPinError(false), 1500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-charcoal border border-gold/20 rounded-2xl p-8 max-w-xs w-full text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
            pinError ? "bg-red-500/20 border border-red-500/40" : "bg-primary/10 border border-primary/20"
          }`}
        >
          <span className={`text-2xl ${pinError ? "text-red-400" : "text-primary"}`}>🔒</span>
        </div>
        <h3 className="font-display text-lg font-bold text-cream mb-1">{title}</h3>
        <p className="text-cream/40 text-sm font-body mb-6">{description}</p>
        <input
          type="password"
          maxLength={20}
          autoFocus
          className={`w-full text-center text-xl tracking-widest bg-black/50 border rounded-lg px-4 py-3 text-cream focus:outline-none transition mb-2 ${
            pinError ? "border-red-500/60" : "border-gold/20 focus:border-primary"
          }`}
          value={pinValue}
          onChange={(e) => setPinValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          placeholder="••••••••"
        />
        {pinError && <p className="text-red-400 text-xs font-body mb-2">Senha incorreta. Tente novamente.</p>}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border border-gold/20 text-cream/60 hover:text-cream rounded-lg py-2.5 text-sm font-body transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm rounded-lg py-2.5 transition hover:scale-[1.02]"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdminConsumo = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"orders" | "items">("orders");

  // ── Items (cardápio) state ────────────────────────────────────────────────────
  const [itemModal, setItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ConsumptionItem | null>(null);
  const [itemForm, setItemForm] = useState<typeof EMPTY_ITEM>(EMPTY_ITEM);
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState("");

  // ── Orders state ──────────────────────────────────────────────────────────────
  const [orderModal, setOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ConsumptionOrder | null>(null);
  const [orderForm, setOrderForm] = useState<typeof EMPTY_ORDER>(EMPTY_ORDER);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [deleteOrderConfirm, setDeleteOrderConfirm] = useState<string | null>(null);

  // ── Estado PIN ────────────────────────────────────────────────────────────────
  const [pinOrderOpen, setPinOrderOpen] = useState(false);
  const [pinItemOpen, setPinItemOpen] = useState(false);
  const pendingDeleteOrderRef = useRef<string | null>(null);
  const pendingDeleteItemRef = useRef<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────────
  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["consumption-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("consumption_items").select("*").order("display_order");
      if (error) throw error;
      return data as ConsumptionItem[];
    },
  });

  // ── Query: quartos ocupados agora ──────────────────────────────────────────
  const { data: quartosOcupados = [] } = useQuery({
    queryKey: ["consumo-quartos-ocupados"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("reservations")
        .select("id, room_id, rooms(name), profiles!reservations_profile_id_fkey(full_name)")
        .in("status", ["confirmed", "pending", "checked_in"])
        .lte("check_in", today)
        .gte("check_out", today);
      return (data || []).map((r: any) => ({
        reservation_id: r.id,
        room_id: r.room_id,
        room_name: r.rooms?.name || "—",
        guest_name: (r.profiles as any)?.full_name || "Hóspede",
      }));
    },
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["consumption-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consumption_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ConsumptionOrder[];
    },
  });

  // ── Realtime subscription ─────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "consumption_orders" }, (payload) => {
        const newOrder = payload.new as ConsumptionOrder;
        if (newOrder.status === "pending") {
          playNotificationSound();
          toast.success(
            `🔔 Novo pedido! Quarto ${newOrder.room_number} — ${newOrder.item_name} (×${newOrder.quantity})`,
            { duration: 8000 },
          );
        }
        qc.invalidateQueries({ queryKey: ["consumption-orders"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "consumption_orders" }, () => {
        qc.invalidateQueries({ queryKey: ["consumption-orders"] });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "consumption_orders" }, () => {
        qc.invalidateQueries({ queryKey: ["consumption-orders"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, playNotificationSound]);

  const saveItemMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: itemForm.name,
        category: itemForm.category,
        price: Number(itemForm.price),
        available: itemForm.available,
        description: itemForm.description || null,
        display_order: Number(itemForm.display_order),
      };
      if (editingItem) {
        const { error } = await supabase.from("consumption_items").update(payload).eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("consumption_items").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? "Item atualizado!" : "Item adicionado!");
      qc.invalidateQueries({ queryKey: ["consumption-items"] });
      setItemModal(false);
      setEditingItem(null);
      setItemForm(EMPTY_ITEM);
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar."),
  });

  const toggleItemMutation = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const { error } = await supabase.from("consumption_items").update({ available: !available }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["consumption-items"] }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("consumption_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item removido.");
      qc.invalidateQueries({ queryKey: ["consumption-items"] });
      setDeleteItemConfirm(null);
    },
    onError: () => toast.error("Erro ao remover."),
  });

  // ── Mutations: pedidos ────────────────────────────────────────────────────────
  const saveOrderMutation = useMutation({
    mutationFn: async () => {
      if (editingOrder) {
        const item = items.find((i) => i.id === orderForm.item_id);
        if (!item) throw new Error("Selecione um item válido.");
        const total = item.price * Number(orderForm.quantity);
        const { error } = await supabase
          .from("consumption_orders")
          .update({
            room_number: orderForm.room_number,
            item_id: item.id,
            item_name: item.name,
            quantity: Number(orderForm.quantity),
            unit_price: item.price,
            total,
            notes: orderForm.notes || null,
          })
          .eq("id", editingOrder.id);
        if (error) throw error;
      } else {
        const item = items.find((i) => i.id === orderForm.item_id);
        if (!item) throw new Error("Selecione um item válido.");
        const total = item.price * Number(orderForm.quantity);
        const { error } = await supabase.from("consumption_orders").insert({
          room_number: orderForm.room_number,
          item_id: item.id,
          item_name: item.name,
          quantity: Number(orderForm.quantity),
          unit_price: item.price,
          total,
          status: "pending",
          notes: orderForm.notes || null,
          reservation_id: orderForm.reservation_id || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingOrder ? "Pedido atualizado!" : "Pedido registrado!");
      qc.invalidateQueries({ queryKey: ["consumption-orders"] });
      setOrderModal(false);
      setOrderForm(EMPTY_ORDER);
      setEditingOrder(null);
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar pedido."),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("consumption_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado!");
      qc.invalidateQueries({ queryKey: ["consumption-orders"] });
    },
    onError: () => toast.error("Erro ao atualizar status."),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("consumption_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pedido removido.");
      qc.invalidateQueries({ queryKey: ["consumption-orders"] });
      setDeleteOrderConfirm(null);
      setOrderSearch("");
    },
    onError: () => toast.error("Erro ao remover pedido."),
  });

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const openEditItem = (item: ConsumptionItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category,
      price: item.price,
      available: item.available,
      description: item.description ?? "",
      display_order: item.display_order,
    });
    setItemModal(true);
  };

  const openEditOrder = (order: ConsumptionOrder) => {
    setEditingOrder(order);
    setOrderForm({
      room_number: order.room_number,
      item_id: order.item_id,
      quantity: order.quantity,
      notes: order.notes ?? "",
      reservation_id: "",
    });
    setOrderModal(true);
  };

  const filteredItems = items.filter(
    (i) =>
      !itemSearch ||
      i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      i.category.toLowerCase().includes(itemSearch.toLowerCase()),
  );
  const filteredOrders = orders.filter((o) => {
    const matchStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
    const q = orderSearch.toLowerCase();
    const matchSearch = !q || o.room_number.toLowerCase().includes(q) || o.item_name.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.created_at.startsWith(todayStr));
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);

  const itemCounts: Record<string, { name: string; qty: number }> = {};
  orders.forEach((o) => {
    if (!itemCounts[o.item_name]) itemCounts[o.item_name] = { name: o.item_name, qty: 0 };
    itemCounts[o.item_name].qty += o.quantity;
  });
  const topItem = Object.values(itemCounts).sort((a, b) => b.qty - a.qty)[0];
  const selectedItem = items.find((i) => i.id === orderForm.item_id);

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
        {/* Topo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-cream/50 hover:text-primary text-sm font-body transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span className="text-cream/20">/</span>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold text-cream">Consumo</h1>
            </div>
          </div>
          <button
            onClick={() => {
              setOrderModal(true);
              setOrderForm(EMPTY_ORDER);
              setEditingOrder(null);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:scale-[1.02] transition-all"
          >
            <ShoppingCart className="w-4 h-4" /> Novo Pedido
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: "Pedidos pendentes",
              value: pendingOrders,
              color: pendingOrders > 0 ? "text-yellow-400" : "text-green-400",
              icon: <Bell className="w-4 h-4 text-yellow-400/60" />,
            },
            {
              label: "Pedidos hoje",
              value: todayOrders.length,
              color: "text-cream",
              icon: <ShoppingCart className="w-4 h-4 text-cream/40" />,
            },
            {
              label: "Receita hoje",
              value: `R$ ${todayRevenue.toFixed(0)}`,
              color: "text-primary",
              icon: <TrendingUp className="w-4 h-4 text-primary/60" />,
            },
            {
              label: "Mais pedido",
              value: topItem ? topItem.name : "—",
              color: "text-cream",
              icon: <Star className="w-4 h-4 text-primary/60" />,
              sub: topItem ? `${topItem.qty}× pedidos` : undefined,
            },
            {
              label: "Itens cardápio",
              value: items.filter((i) => i.available).length,
              color: "text-green-400",
              icon: <Package className="w-4 h-4 text-green-400/60" />,
            },
          ].map((s: any) => (
            <div key={s.label} className="bg-charcoal-light border border-gold/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                {s.icon}
                <p className="text-cream/40 text-xs font-body uppercase tracking-wider">{s.label}</p>
              </div>
              <p className={`font-display text-2xl font-bold ${s.color} truncate`}>{s.value}</p>
              {s.sub && <p className="text-cream/30 text-xs font-body mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gold/10">
          {(["orders", "items"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 px-1 text-sm font-body transition-colors border-b-2 -mb-px ${
                tab === t ? "border-primary text-primary" : "border-transparent text-cream/40 hover:text-cream/60"
              }`}
            >
              {t === "orders" ? `Pedidos${pendingOrders > 0 ? ` (${pendingOrders} pendentes)` : ""}` : "Cardápio"}
            </button>
          ))}
        </div>

        {/* ── Tab: Pedidos ─────────────────────────────────────────────────────── */}
        {tab === "orders" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-charcoal-light border border-gold/10 rounded-lg text-cream text-sm placeholder:text-cream/30 focus:border-primary/40 focus:outline-none transition"
                  placeholder="Buscar por quarto ou item..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
              <select
                className="bg-charcoal-light border border-gold/10 rounded-lg px-4 py-2.5 text-cream text-sm focus:border-primary/40 focus:outline-none transition"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="all">Todos</option>
                {Object.entries(ORDER_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {loadingOrders ? (
              <div className="text-center py-20 text-cream/30 font-body">Carregando pedidos...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                <p className="text-cream/30 font-body">Nenhum pedido encontrado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((o, i) => {
                  const cfg = ORDER_STATUS[o.status] ?? ORDER_STATUS.pending;
                  return (
                    <motion.div
                      key={o.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-charcoal-light border border-gold/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-gold/20 transition-colors"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-body ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-cream/30 font-body">
                            {format(new Date(o.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <BedDouble className="w-4 h-4 text-primary/60" />
                          <span className="text-cream font-body font-medium">Quarto {o.room_number}</span>
                          {(() => {
                            const q = quartosOcupados.find((q) => q.room_name === o.room_number);
                            return q ? <span className="text-cream/40 text-xs font-body">({q.guest_name})</span> : null;
                          })()}
                          <span className="text-cream/40 text-sm font-body">
                            — {o.item_name} × {o.quantity}
                          </span>
                        </div>
                        {o.notes && <p className="text-cream/30 text-xs font-body italic">"{o.notes}"</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-display text-lg font-bold text-primary shrink-0">
                          R$ {Number(o.total).toFixed(2)}
                        </p>
                        <select
                          value={o.status}
                          onChange={(e) => updateOrderStatusMutation.mutate({ id: o.id, status: e.target.value })}
                          className="bg-charcoal border border-gold/10 text-cream text-xs rounded-lg px-3 py-2 focus:border-primary/40 focus:outline-none transition"
                        >
                          {Object.entries(ORDER_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => openEditOrder(o)}
                          className="p-1.5 text-cream/30 hover:text-primary border border-gold/15 hover:border-primary/40 rounded-lg transition-all"
                          title="Editar pedido"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            pendingDeleteOrderRef.current = o.id;
                            setPinOrderOpen(true);
                          }}
                          className="p-1.5 text-cream/30 hover:text-red-400 border border-gold/15 hover:border-red-400/40 rounded-lg transition-all"
                          title="Remover pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Tab: Cardápio ────────────────────────────────────────────────────── */}
        {tab === "items" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-charcoal-light border border-gold/10 rounded-lg text-cream text-sm placeholder:text-cream/30 focus:border-primary/40 focus:outline-none transition"
                  placeholder="Buscar item..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setItemForm(EMPTY_ITEM);
                  setItemModal(true);
                }}
                className="flex items-center gap-2 bg-charcoal-light border border-gold/20 hover:border-primary/40 text-cream/60 hover:text-primary text-sm px-5 py-2.5 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Novo Item
              </button>
            </div>

            {loadingItems ? (
              <div className="text-center py-20 text-cream/30 font-body">Carregando cardápio...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                <p className="text-cream/30 font-body">Nenhum item cadastrado no cardápio.</p>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setItemForm(EMPTY_ITEM);
                    setItemModal(true);
                  }}
                  className="mt-4 text-primary text-sm hover:underline font-body"
                >
                  Adicionar primeiro item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`bg-charcoal-light border rounded-xl p-5 ${item.available ? "border-gold/15" : "border-red-900/30 opacity-60"}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-xs text-primary font-body tracking-wider uppercase">{item.category}</span>
                        <h3 className="font-display text-base font-semibold text-cream mt-0.5">{item.name}</h3>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-body shrink-0 ${item.available ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                      >
                        {item.available ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-cream/40 text-xs font-body mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-gold/10">
                      <span className="font-display text-lg font-bold text-primary">
                        R$ {Number(item.price).toFixed(2)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleItemMutation.mutate({ id: item.id, available: item.available })}
                          className="p-1.5 text-cream/30 hover:text-yellow-400 border border-gold/15 hover:border-yellow-400/40 rounded-lg transition-all"
                        >
                          {item.available ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditItem(item)}
                          className="p-1.5 text-cream/30 hover:text-primary border border-gold/15 hover:border-primary/40 rounded-lg transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            pendingDeleteItemRef.current = item.id;
                            setPinItemOpen(true);
                          }}
                          className="p-1.5 text-cream/30 hover:text-red-400 border border-gold/15 hover:border-red-400/40 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Modal: Novo Pedido ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {orderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={(e) => e.target === e.currentTarget && setOrderModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-charcoal border border-gold/20 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-gold/10">
                <h2 className="font-display text-xl font-bold text-cream">
                  {editingOrder ? "Editar Pedido" : "Novo Pedido"}
                </h2>
                <button
                  onClick={() => {
                    setOrderModal(false);
                    setEditingOrder(null);
                  }}
                  className="text-cream/40 hover:text-cream"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveOrderMutation.mutate();
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">
                    Quarto Ocupado *
                  </label>
                  <select
                    className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={orderForm.reservation_id}
                    onChange={(e) => {
                      const q = quartosOcupados.find((q) => q.reservation_id === e.target.value);
                      setOrderForm({
                        ...orderForm,
                        reservation_id: e.target.value,
                        room_number: q?.room_name || "",
                      });
                    }}
                    required
                  >
                    <option value="">Selecione o quarto...</option>
                    {quartosOcupados.map((q) => (
                      <option key={q.reservation_id} value={q.reservation_id}>
                        {q.room_name} — {q.guest_name}
                      </option>
                    ))}
                  </select>
                  {quartosOcupados.length === 0 && (
                    <p className="text-cream/30 text-xs mt-1 font-body">Nenhum quarto ocupado no momento.</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Item *</label>
                  <select
                    className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={orderForm.item_id}
                    onChange={(e) => setOrderForm({ ...orderForm, item_id: e.target.value })}
                    required
                  >
                    <option value="">Selecione um item...</option>
                    {CATEGORIES.map((cat) => {
                      const catItems = items.filter((i) => i.category === cat && i.available);
                      if (!catItems.length) return null;
                      return (
                        <optgroup key={cat} label={cat}>
                          {catItems.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name} — R$ {Number(i.price).toFixed(2)}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Quantidade</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: Number(e.target.value) })}
                  />
                </div>
                {selectedItem && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="text-cream/60 text-sm font-body">Total do pedido</span>
                    <span className="font-display font-bold text-primary text-lg">
                      R$ {(selectedItem.price * Number(orderForm.quantity)).toFixed(2)}
                    </span>
                  </div>
                )}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Observações</label>
                  <textarea
                    rows={2}
                    className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition resize-none"
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                    placeholder="Sem gelo, sem açúcar..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderModal(false);
                      setEditingOrder(null);
                    }}
                    className="flex-1 border border-gold/20 text-cream/60 hover:text-cream rounded-lg py-3 text-sm font-body transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saveOrderMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm rounded-lg py-3 hover:scale-[1.01] transition-all disabled:opacity-50"
                  >
                    {saveOrderMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                      </>
                    ) : editingOrder ? (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        Registrar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Item do cardápio ───────────────────────────────────────────── */}
      <AnimatePresence>
        {itemModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={(e) => e.target === e.currentTarget && setItemModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-charcoal border border-gold/20 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-gold/10">
                <h2 className="font-display text-xl font-bold text-cream">
                  {editingItem ? "Editar Item" : "Novo Item"}
                </h2>
                <button onClick={() => setItemModal(false)} className="text-cream/40 hover:text-cream">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  saveItemMutation.mutate();
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Nome *</label>
                  <input
                    className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    required
                    placeholder="Ex: Água Mineral 500ml"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Categoria</label>
                    <select
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={itemForm.category}
                      onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={itemForm.price || ""}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, price: e.target.value === "" ? 0 : Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Descrição</label>
                  <input
                    className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Descrição breve (opcional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Ordem</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={itemForm.display_order}
                      onChange={(e) => setItemForm({ ...itemForm, display_order: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-2">Disponível</label>
                    <button
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, available: !itemForm.available })}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-body transition-all ${
                        itemForm.available
                          ? "border-green-500/40 bg-green-500/10 text-green-400"
                          : "border-gold/20 text-cream/40"
                      }`}
                    >
                      {itemForm.available ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      {itemForm.available ? "Sim" : "Não"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setItemModal(false)}
                    className="flex-1 border border-gold/20 text-cream/60 hover:text-cream rounded-lg py-3 text-sm font-body transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saveItemMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm rounded-lg py-3 hover:scale-[1.01] transition-all disabled:opacity-50"
                  >
                    {saveItemMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingItem ? "Salvar" : "Adicionar"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PIN: Excluir pedido ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {pinOrderOpen && (
          <PinModal
            key="pin-order"
            title="Remover pedido"
            description="Digite a senha de supervisor para remover este pedido."
            onClose={() => {
              setPinOrderOpen(false);
              pendingDeleteOrderRef.current = null;
            }}
            onSuccess={() => {
              if (pendingDeleteOrderRef.current) setDeleteOrderConfirm(pendingDeleteOrderRef.current);
              pendingDeleteOrderRef.current = null;
            }}
          />
        )}
      </AnimatePresence>

      {/* ── PIN: Excluir item do cardápio ─────────────────────────────────────── */}
      <AnimatePresence>
        {pinItemOpen && (
          <PinModal
            key="pin-item"
            title="Remover item do cardápio"
            description="Digite a senha de supervisor para remover este item."
            onClose={() => {
              setPinItemOpen(false);
              pendingDeleteItemRef.current = null;
            }}
            onSuccess={() => {
              if (pendingDeleteItemRef.current) setDeleteItemConfirm(pendingDeleteItemRef.current);
              pendingDeleteItemRef.current = null;
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Confirmar exclusão pedido ─────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteOrderConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-charcoal border border-red-900/40 rounded-2xl p-8 max-w-sm w-full text-center"
            >
              <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-cream mb-2">Remover pedido?</h3>
              <p className="text-cream/50 text-sm font-body mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteOrderConfirm(null)}
                  className="flex-1 border border-gold/20 text-cream/60 rounded-lg py-2.5 text-sm transition hover:text-cream"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteOrderMutation.mutate(deleteOrderConfirm)}
                  disabled={deleteOrderMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50"
                >
                  {deleteOrderMutation.isPending ? "Removendo..." : "Remover"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmar exclusão item ───────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteItemConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-charcoal border border-red-900/40 rounded-2xl p-8 max-w-sm w-full text-center"
            >
              <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-cream mb-2">Remover item?</h3>
              <p className="text-cream/50 text-sm font-body mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteItemConfirm(null)}
                  className="flex-1 border border-gold/20 text-cream/60 rounded-lg py-2.5 text-sm transition hover:text-cream"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteItemMutation.mutate(deleteItemConfirm)}
                  disabled={deleteItemMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50"
                >
                  {deleteItemMutation.isPending ? "Removendo..." : "Remover"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminConsumo;
