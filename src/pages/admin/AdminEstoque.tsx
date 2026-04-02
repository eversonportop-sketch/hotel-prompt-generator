import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Search,
  Plus,
  ArrowUpDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Geral", "Limpeza", "Alimentos", "Bebidas", "Descartáveis", "Manutenção", "Escritório"];
const UNITS = ["un", "kg", "g", "L", "ml", "cx", "pct", "par", "rolo"];

interface StockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  cost_price: number;
  notes: string | null;
}

interface NewItemForm {
  name: string;
  category: string;
  unit: string;
  current_quantity: number;
  min_quantity: number;
  cost_price: number;
  notes: string;
}

const emptyItem: NewItemForm = {
  name: "",
  category: "Geral",
  unit: "un",
  current_quantity: 0,
  min_quantity: 0,
  cost_price: 0,
  notes: "",
};

interface MovementForm {
  item_id: string;
  type: "entrada" | "saida" | "ajuste";
  quantity: number;
  notes: string;
}

const AdminEstoque = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [itemModal, setItemModal] = useState(false);
  const [moveModal, setMoveModal] = useState(false);
  const [form, setForm] = useState<NewItemForm>(emptyItem);
  const [moveForm, setMoveForm] = useState<MovementForm>({
    item_id: "",
    type: "entrada",
    quantity: 0,
    notes: "",
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["stock_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_items" as any)
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as unknown as StockItem[];
    },
  });

  const filtered = items.filter((i) => {
    const matchSearch =
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const categories = [...new Set(items.map((i) => i.category))];

  const createItem = useMutation({
    mutationFn: async (f: NewItemForm) => {
      const { error } = await supabase.from("stock_items" as any).insert({
        name: f.name,
        category: f.category,
        unit: f.unit,
        current_quantity: f.current_quantity,
        min_quantity: f.min_quantity,
        unit_cost: f.unit_cost,
        notes: f.notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock_items"] });
      setItemModal(false);
      setForm(emptyItem);
      toast({ title: "Item criado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao criar item", variant: "destructive" }),
  });

  const createMovement = useMutation({
    mutationFn: async (f: MovementForm) => {
      const item = items.find((i) => i.id === f.item_id);
      if (!item) throw new Error("Item não encontrado");

      let newQty = item.current_quantity;
      if (f.type === "entrada") newQty += f.quantity;
      else if (f.type === "saida") newQty -= f.quantity;
      else newQty = f.quantity; // ajuste

      if (newQty < 0) throw new Error("Estoque não pode ficar negativo");

      const { error: moveErr } = await supabase.from("stock_movements" as any).insert({
        item_id: f.item_id,
        type: f.type,
        quantity: f.quantity,
        previous_quantity: item.current_quantity,
        new_quantity: newQty,
        notes: f.notes || null,
      } as any);
      if (moveErr) throw moveErr;

      const { error: upErr } = await supabase
        .from("stock_items" as any)
        .update({ current_quantity: newQty, updated_at: new Date().toISOString() } as any)
        .eq("id", f.item_id);
      if (upErr) throw upErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock_items"] });
      setMoveModal(false);
      setMoveForm({ item_id: "", type: "entrada", quantity: 0, notes: "" });
      toast({ title: "Movimentação registrada" });
    },
    onError: (e: any) =>
      toast({ title: e.message || "Erro na movimentação", variant: "destructive" }),
  });

  const openMoveFor = (id: string) => {
    setMoveForm({ item_id: id, type: "entrada", quantity: 0, notes: "" });
    setMoveModal(true);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-cream flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> Estoque
          </h1>
          <p className="text-sm text-white/40 font-body mt-1">
            Controle manual de estoque
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="gold-outline" size="sm" onClick={() => { setForm(emptyItem); setItemModal(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Novo Item
          </Button>
          <Button variant="gold" size="sm" onClick={() => setMoveModal(true)}>
            <ArrowUpDown className="w-4 h-4 mr-1" /> Movimentar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Buscar item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-charcoal-light border-white/10 text-cream placeholder:text-white/30"
          />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-charcoal-light border-white/10 text-cream">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-charcoal-light border-white/10">
            <SelectItem value="all" className="text-cream">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="text-cream">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30 font-body">
          {items.length === 0 ? "Nenhum item cadastrado" : "Nenhum resultado encontrado"}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((item) => {
            const isLow = item.current_quantity <= item.min_quantity && item.min_quantity > 0;
            return (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-charcoal-light border border-white/5 hover:border-primary/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-cream font-medium font-body truncate">{item.name}</span>
                    <Badge variant="outline" className="text-[10px] text-white/40 border-white/10">
                      {item.category}
                    </Badge>
                    {isLow && (
                      <Badge className="text-[10px] bg-red-500/20 text-red-400 border-red-500/30">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Baixo
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-white/30 font-body">
                    <span>
                      Qtd: <span className={`font-semibold ${isLow ? "text-red-400" : "text-cream"}`}>
                        {item.current_quantity}
                      </span>{" "}
                      {item.unit}
                    </span>
                    <span>Mín: {item.min_quantity} {item.unit}</span>
                    {item.unit_cost > 0 && (
                      <span>Custo: R$ {item.unit_cost.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary hover:bg-primary/10 shrink-0"
                  onClick={() => openMoveFor(item.id)}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Novo Item */}
      <Dialog open={itemModal} onOpenChange={setItemModal}>
        <DialogContent className="bg-charcoal-light border-white/10 text-cream max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-cream">Novo Item de Estoque</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <Label className="text-white/50">Nome *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-charcoal border-white/10 text-cream mt-1"
              />
            </div>
            <div>
              <Label className="text-white/50">Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-charcoal border-white/10 text-cream mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-charcoal-light border-white/10">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-cream">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/50">Unidade</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger className="bg-charcoal border-white/10 text-cream mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-charcoal-light border-white/10">
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u} className="text-cream">{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/50">Qtd Inicial</Label>
              <Input
                type="number"
                min={0}
                value={form.current_quantity}
                onChange={(e) => setForm({ ...form, current_quantity: +e.target.value })}
                className="bg-charcoal border-white/10 text-cream mt-1"
              />
            </div>
            <div>
              <Label className="text-white/50">Qtd Mínima</Label>
              <Input
                type="number"
                min={0}
                value={form.min_quantity}
                onChange={(e) => setForm({ ...form, min_quantity: +e.target.value })}
                className="bg-charcoal border-white/10 text-cream mt-1"
              />
            </div>
            <div>
              <Label className="text-white/50">Custo Unitário (R$)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.unit_cost}
                onChange={(e) => setForm({ ...form, unit_cost: +e.target.value })}
                className="bg-charcoal border-white/10 text-cream mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-white/50">Observação</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-charcoal border-white/10 text-cream mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setItemModal(false)} className="text-white/40">
              Cancelar
            </Button>
            <Button
              variant="gold"
              disabled={!form.name || createItem.isPending}
              onClick={() => createItem.mutate(form)}
            >
              {createItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Movimentar */}
      <Dialog open={moveModal} onOpenChange={setMoveModal}>
        <DialogContent className="bg-charcoal-light border-white/10 text-cream max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-cream">Movimentar Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/50">Item *</Label>
              <Select value={moveForm.item_id} onValueChange={(v) => setMoveForm({ ...moveForm, item_id: v })}>
                <SelectTrigger className="bg-charcoal border-white/10 text-cream mt-1">
                  <SelectValue placeholder="Selecione o item" />
                </SelectTrigger>
                <SelectContent className="bg-charcoal-light border-white/10">
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id} className="text-cream">
                      {i.name} ({i.current_quantity} {i.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/50">Tipo *</Label>
              <div className="flex gap-2 mt-1">
                {([
                  { value: "entrada", label: "Entrada", icon: ArrowDownToLine, color: "text-green-400 border-green-500/30" },
                  { value: "saida", label: "Saída", icon: ArrowUpFromLine, color: "text-red-400 border-red-500/30" },
                  { value: "ajuste", label: "Ajuste", icon: RefreshCw, color: "text-blue-400 border-blue-500/30" },
                ] as const).map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setMoveForm({ ...moveForm, type: t.value })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-body transition-all ${
                      moveForm.type === t.value
                        ? `${t.color} bg-white/5`
                        : "border-white/10 text-white/30 hover:text-white/50"
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-white/50">
                {moveForm.type === "ajuste" ? "Nova quantidade" : "Quantidade"}
              </Label>
              <Input
                type="number"
                min={0}
                value={moveForm.quantity}
                onChange={(e) => setMoveForm({ ...moveForm, quantity: +e.target.value })}
                className="bg-charcoal border-white/10 text-cream mt-1"
              />
            </div>
            <div>
              <Label className="text-white/50">Observação</Label>
              <Input
                value={moveForm.notes}
                onChange={(e) => setMoveForm({ ...moveForm, notes: e.target.value })}
                className="bg-charcoal border-white/10 text-cream mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setMoveModal(false)} className="text-white/40">
              Cancelar
            </Button>
            <Button
              variant="gold"
              disabled={!moveForm.item_id || moveForm.quantity <= 0 || createMovement.isPending}
              onClick={() => createMovement.mutate(moveForm)}
            >
              {createMovement.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEstoque;
