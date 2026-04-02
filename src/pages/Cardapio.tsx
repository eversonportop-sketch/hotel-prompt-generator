import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  UtensilsCrossed,
  Coffee,
  Wine,
  IceCream,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
};

const categoryIcons: Record<string, React.ReactNode> = {
  Bebidas: <Coffee className="w-4 h-4" />,
  Drinks: <Wine className="w-4 h-4" />,
  Lanches: <UtensilsCrossed className="w-4 h-4" />,
  Sobremesas: <IceCream className="w-4 h-4" />,
  Outros: <Package className="w-4 h-4" />,
};

const Cardapio = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  // Detect active reservation for logged-in user
  const { data: activeReservation, isLoading: loadingRes } = useQuery({
    queryKey: ["active-reservation", user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      // First try: reserva ativa com datas exatas
      const { data, error } = await supabase
        .from("reservations")
        .select("id, room_id, rooms:room_id(name)")
        .or(`profile_id.eq.${user!.id},client_id.eq.${user!.id}`)
        .in("status", ["confirmed", "pending"])
        .lte("check_in", today)
        .gte("check_out", today)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;

      // Fallback: qualquer reserva confirmed/pending do usuário
      const { data: fallback, error: fallbackError } = await supabase
        .from("reservations")
        .select("id, room_id, rooms:room_id(name)")
        .or(`profile_id.eq.${user!.id},client_id.eq.${user!.id}`)
        .in("status", ["confirmed", "pending"])
        .order("check_in", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fallbackError) throw fallbackError;
      return fallback;
    },
    enabled: !!user,
  });

  // Fetch available items
  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["consumption-items-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consumption_items")
        .select("*")
        .eq("available", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const categories = useMemo(() => {
    const cats = [...new Set(items.map((i) => i.category))];
    return ["Todos", ...cats];
  }, [items]);

  const filteredItems = useMemo(
    () => (selectedCategory === "Todos" ? items : items.filter((i) => i.category === selectedCategory)),
    [items, selectedCategory],
  );

  const addToCart = (item: (typeof items)[0]) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, category: item.category }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c)).filter((c) => c.quantity > 0),
    );
  };

  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const roomName = activeReservation && (activeReservation as any).rooms ? (activeReservation as any).rooms.name : null;

  const orderMutation = useMutation({
    mutationFn: async () => {
      if (!activeReservation) throw new Error("Sem reserva ativa");
      const rows = cart.map((c) => ({
        item_id: c.id,
        item_name: c.name,
        quantity: c.quantity,
        unit_price: c.price,
        total: c.price * c.quantity,
        room_number: roomName || "N/A",
        reservation_id: activeReservation.id,
        status: "pending",
      }));
      const { error } = await supabase.from("consumption_orders").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Pedido enviado!", description: "Seu pedido foi registrado com sucesso." });
      setCart([]);
      setCartOpen(false);
      queryClient.invalidateQueries({ queryKey: ["consumption-orders"] });
    },
    onError: () => {
      toast({ title: "Erro ao enviar pedido", variant: "destructive" });
    },
  });

  // ── Not logged in ──
  if (!authLoading && !user) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
          <AlertCircle className="w-16 h-16 text-primary" />
          <h1 className="font-display text-3xl text-cream">Cardápio do Hotel</h1>
          <p className="text-cream/50 max-w-md">
            Faça login para acessar o cardápio e fazer pedidos diretamente do seu quarto.
          </p>
          <Link to="/login">
            <Button variant="gold" size="lg">
              Entrar
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (authLoading || loadingRes || loadingItems) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }


  return (
    <Layout>
      <section className="pt-28 pb-20 min-h-screen bg-charcoal">
        <div className="container-hotel">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl text-cream mb-2">Cardápio</h1>
            <p className="text-cream/50">
              Quarto: <span className="text-primary font-medium">{roomName || "—"}</span>
            </p>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-body whitespace-nowrap transition-all duration-200 border ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-charcoal-light text-cream/50 border-gold/10 hover:border-primary/50"
                }`}
              >
                {cat !== "Todos" && (categoryIcons[cat] || <Package className="w-4 h-4" />)}
                {cat}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const inCart = cart.find((c) => c.id === item.id);
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-charcoal-light border border-gold/10 rounded-lg p-5 flex flex-col justify-between hover:border-primary/30 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-display text-lg text-cream leading-tight">{item.name}</h3>
                      <Badge variant="outline" className="text-xs shrink-0 ml-2 border-primary/30 text-primary">
                        {item.category}
                      </Badge>
                    </div>
                    {item.description && <p className="text-cream/50 text-sm mb-3">{item.description}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary font-semibold text-lg">R$ {item.price.toFixed(2)}</span>
                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-full border border-gold/10 flex items-center justify-center text-cream/50 hover:text-destructive hover:border-destructive transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-medium text-cream">{inCart.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-full border border-primary bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <Button variant="gold-outline" size="sm" onClick={() => addToCart(item)} className="gap-1">
                        <Plus className="w-4 h-4" /> Adicionar
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <p className="text-center text-cream/50 py-12">Nenhum item disponível nesta categoria.</p>
          )}
        </div>
      </section>

      {/* Floating cart button */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-accent transition-colors"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cartCount}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 z-50 bg-black/60"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-charcoal-light border-l border-gold/10 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-gold/10">
                <h2 className="font-display text-xl text-cream">Seu Pedido</h2>
                <button onClick={() => setCartOpen(false)} className="text-cream/50 hover:text-cream">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-charcoal/50 rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-cream font-medium text-sm truncate">{item.name}</p>
                      <p className="text-cream/50 text-xs">
                        R$ {item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-primary font-semibold text-sm whitespace-nowrap">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-full border border-gold/10 flex items-center justify-center text-cream/50 hover:text-destructive transition-colors"
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 border-t border-gold/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-cream font-medium">Total</span>
                  <span className="text-primary font-display text-2xl">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <Button
                  variant="gold"
                  className="w-full gap-2"
                  size="lg"
                  disabled={orderMutation.isPending}
                  onClick={() => orderMutation.mutate()}
                >
                  {orderMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {orderMutation.isPending ? "Enviando..." : "Confirmar Pedido"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Cardapio;
