// ─── AdminCheckout ─────────────────────────────────────────────────────────────
// Checkout completo: conta do hóspede, histórico e recibo PDF
import React, { useState, useRef } from "react";
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
  profiles: { full_name: string | null; phone: string | null; cpf?: string | null; email?: string | null; address?: string | null; city?: string | null; state?: string | null } | null;
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

// ── helper fora do componente: busca cpf/email/phone/address de guests e profiles ──
const enrichRows = async (rows: any[]) => {
  const gids = [...new Set(rows.filter((r) => r.guest_id).map((r) => r.guest_id as string))];
  const pids = [...new Set(rows.filter((r) => r.profile_id).map((r) => r.profile_id as string))];
  const nameMap: Record<string, string> = {};
  const phoneMap: Record<string, string> = {};
  const cpfMap: Record<string, string> = {};
  const emailMap: Record<string, string> = {};
  const addressMap: Record<string, string> = {};
  const cityMap: Record<string, string> = {};
  const stateMap: Record<string, string> = {};

  if (gids.length) {
    const { data: gd } = await supabase.from("guests").select("id,full_name,phone,cpf,email").in("id", gids);
    (gd || []).forEach((g: any) => {
      nameMap[g.id] = g.full_name;
      phoneMap[g.id] = g.phone;
      cpfMap[g.id] = g.cpf;
      emailMap[g.id] = g.email;
    });
  }
  if (pids.length) {
    const { data: pd } = await supabase.from("profiles").select("id,full_name,phone,cpf,email,address,city,state").in("id", pids);
    (pd || []).forEach((p: any) => {
      nameMap[p.id] = p.full_name;
      phoneMap[p.id] = p.phone;
      cpfMap[p.id] = p.cpf;
      emailMap[p.id] = p.email;
      addressMap[p.id] = p.address;
      cityMap[p.id] = p.city;
      stateMap[p.id] = p.state;
    });
  }

  return rows.map((r: any) => {
    const ref = r.guest_id || r.profile_id;
    return {
      ...r,
      profiles: {
        full_name: (ref && nameMap[ref]) || null,
        phone: (ref && phoneMap[ref]) || null,
        cpf: (ref && cpfMap[ref]) || null,
        email: (ref && emailMap[ref]) || null,
        address: (ref && addressMap[ref]) || null,
        city: (ref && cityMap[ref]) || null,
        state: (ref && stateMap[ref]) || null,
      },
    };
  });
};

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

  // Dados do hotel (endereço, telefone) para o cabeçalho do recibo
  const { data: hotelInfo } = useQuery({
    queryKey: ["hotel-settings-receipt"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hotel_settings" as any)
        .select("key, value")
        .in("key", ["address", "city", "phone", "whatsapp"]);
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        if (row.value) map[row.key] = row.value;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Contas abertas
  const { data: openReservations = [], isLoading } = useQuery({
    queryKey: ["checkout-open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, rooms(name, price)")
        .eq("status", "checked_in")
        .not("checked_in_at", "is", null)
        .is("checked_out_at", null)
        .order("check_in", { ascending: false });
      if (error) throw error;

      const rows = data || [];
      const ids = rows.map((r: any) => r.id);
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

      const enriched = await enrichRows(rows);
      return enriched.map((r: any) => ({ ...r, _consumoTotal: consumoMap[r.id] || 0 })) as (Reservation & { _consumoTotal: number })[];
    },
  });

  // Histórico
  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["checkout-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, rooms(name, price)")
        .eq("status", "checked_out")
        .order("check_out", { ascending: false })
        .limit(50);
      if (error) throw error;
      return enrichRows(data || []) as Promise<Reservation[]>;
    },
  });

  // Consumos da reserva selecionada
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["checkout-orders", selectedRes?.id],
    enabled: !!selectedRes,
    queryFn: async () => {
      if (!selectedRes) return [];
      const { data: byResId } = await (supabase as any)
        .from("consumption_orders")
        .select("*")
        .eq("reservation_id", selectedRes.id)
        .in("status", ["pending", "delivered"])
        .order("created_at", { ascending: true });
      if (byResId && byResId.length > 0) return byResId as ConsumptionOrder[];

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
          .in("id", orders.map((o) => o.id));
        if (error) throw error;
      }
      const { error } = await supabase
        .from("reservations")
        .update({ status: "checked_out", checked_out_at: new Date().toISOString() } as any)
        .eq("id", selectedRes.id);
      if (error) throw error;
      if (selectedRes.room_id) {
        await supabase.from("rooms").update({ needs_cleaning: true } as any).eq("id", selectedRes.room_id);
      }
    },
    onSuccess: () => {
      toast.success("Checkout finalizado!");
      setReceiptRes(selectedRes);
      setReceiptOrders(orders);
      qc.invalidateQueries({ queryKey: ["checkout-open"] });
      qc.invalidateQueries({ queryKey: ["checkout-history"] });
      setConfirmModal(false);
      setSelectedRes(null);
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao finalizar checkout."),
  });

  // Calculos conta aberta
  const nights = selectedRes
    ? Math.max(1, differenceInDays(new Date(selectedRes.check_out), new Date(selectedRes.check_in)))
    : 0;
  const roomTotal = selectedRes?.total_price ?? 0;
  const roomPrice = nights > 0 ? roomTotal / nights : 0;
  const consumoTotal = orders.reduce((s, o) => s + Number(o.total), 0);
  const grandTotal = roomTotal + consumoTotal;

  // Calculos recibo
  const receiptNights = receiptRes
    ? Math.max(1, differenceInDays(new Date(receiptRes.check_out), new Date(receiptRes.check_in)))
    : 0;
  const receiptRoomTotal = receiptRes?.total_price ?? 0;
  const receiptRoomPrice = receiptNights > 0 ? receiptRoomTotal / receiptNights : 0;
  const receiptConsumoTotal = receiptOrders.reduce((s, o) => s + Number(o.total), 0);
  const receiptGrandTotal = receiptRoomTotal + receiptConsumoTotal;

  // ── Impressão / PDF ──────────────────────────────────────────────────────
  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Recibo - SB Hotel</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Georgia, serif; max-width: 520px; margin: 30px auto; color: #111; background: #fff; padding: 0 10px; }
        .gold { color: #C9A84C; }
        .header { text-align: center; padding-bottom: 18px; margin-bottom: 18px; border-bottom: 2px solid #C9A84C; }
        .header-logo { font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #111; }
        .header-sub { font-size: 10px; color: #C9A84C; letter-spacing: 4px; text-transform: uppercase; margin-top: 4px; }
        .header-title { font-size: 12px; color: #666; margin-top: 8px; letter-spacing: 1px; }
        .header-date { font-size: 11px; color: #999; margin-top: 3px; }
        .section { margin-bottom: 18px; }
        .section-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #C9A84C; margin-bottom: 10px; font-weight: bold; }
        .guest-block { background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: 12px 14px; }
        .guest-name { font-size: 15px; font-weight: bold; color: #111; margin-bottom: 6px; }
        .guest-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 14px; }
        .guest-field { font-size: 12px; color: #555; }
        .guest-field span { color: #888; display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1px; }
        .row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; gap: 12px; }
        .row-label { color: #333; }
        .row-sub { color: #888; font-size: 11px; margin-top: 2px; }
        .row-value { font-weight: bold; color: #111; white-space: nowrap; }
        .total-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0 8px; border-top: 2px solid #C9A84C; margin-top: 8px; }
        .total-label { font-size: 16px; font-weight: bold; color: #111; }
        .total-value { font-size: 22px; font-weight: bold; color: #C9A84C; }
        .subtotals { background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; }
        .subtotal-row { display: flex; justify-content: space-between; font-size: 12px; color: #666; padding: 3px 0; }
        .signature-section { margin-top: 28px; padding-top: 18px; border-top: 1px dashed #ddd; }
        .signature-title { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #C9A84C; margin-bottom: 20px; font-weight: bold; }
        .signature-block { display: flex; gap: 24px; }
        .sig-line { flex: 1; }
        .sig-line-bar { border-bottom: 1px solid #999; margin-bottom: 5px; height: 36px; }
        .sig-line-label { font-size: 10px; color: #888; text-align: center; }
        .payment-section { margin-top: 16px; padding: 10px 14px; background: #fafafa; border: 1px solid #eee; border-radius: 6px; }
        .payment-row { display: flex; justify-content: space-between; font-size: 12px; color: #555; padding: 3px 0; }
        .footer { text-align: center; margin-top: 24px; padding-top: 14px; border-top: 1px solid #eee; }
        .footer p { font-size: 11px; color: #999; margin-bottom: 3px; }
        .receipt-number { font-size: 10px; color: #bbb; margin-top: 4px; }
        @media print {
          body { margin: 10px auto; }
          @page { size: A4; margin: 12mm; }
        }
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const filteredOpen = openReservations.filter((r) => {
    const q = search.toLowerCase();
    return !q || (r.profiles as any)?.full_name?.toLowerCase().includes(q) || (r.rooms as any)?.name?.toLowerCase().includes(q);
  });

  const filteredHistory = history.filter((r) => {
    const q = historySearch.toLowerCase();
    return !q || (r.profiles as any)?.full_name?.toLowerCase().includes(q) || (r.rooms as any)?.name?.toLowerCase().includes(q);
  });

  const ResCard = ({ res, selected, onClick }: { res: Reservation & { _consumoTotal?: number }; selected: boolean; onClick: () => void }) => {
    const n = Math.max(1, differenceInDays(new Date(res.check_out), new Date(res.check_in)));
    const diarias = res.total_price || 0;
    const consumo = (res as any)._consumoTotal || 0;
    const estimado = diarias + consumo;
    return (
      <button
        onClick={onClick}
        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selected ? "border-primary/50 bg-primary/10" : "border-gold/10 bg-charcoal-light hover:border-gold/25"}`}
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

  // ── Recibo HTML para impressão ───────────────────────────────────────────
  // Função (não componente) para evitar desmontagem/remontagem a cada render do pai
  const renderReceipt = () => {
    const p = receiptRes?.profiles as any;
    const receiptId = receiptRes?.id?.slice(-8).toUpperCase() ?? "—";
    const hasAddress = p?.address || p?.city;
    const GOLD = "#C9A84C";
    const sectionLabel: React.CSSProperties = { fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: GOLD, marginBottom: 10, fontWeight: "bold", display: "block" };
    const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #eee", fontSize: 13, gap: 12, breakInside: "avoid", pageBreakInside: "avoid" };
    const rowValue: React.CSSProperties = { fontWeight: "bold", color: "#111", whiteSpace: "nowrap" };
    const rowSub: React.CSSProperties = { color: "#888", fontSize: 11, marginTop: 2 };
    const subtotalRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#666", padding: "3px 0" };

    return (
      <>
        {/* CABEÇALHO */}
        <div style={{ textAlign: "center", paddingBottom: 14, marginBottom: 14, borderBottom: `2px solid ${GOLD}`, breakInside: "avoid", pageBreakInside: "avoid" }}>
          <div style={{ fontSize: 26, fontWeight: "bold", letterSpacing: 4, color: "#111" }}>SB HOTEL</div>
          <div style={{ fontSize: 10, color: GOLD, letterSpacing: 4, textTransform: "uppercase", marginTop: 4 }}>Sleep Better · {hotelInfo?.city || "Butiá, RS"}</div>
          {(hotelInfo?.address || hotelInfo?.phone) && (
            <div style={{ fontSize: 10, color: "#999", marginTop: 5 }}>
              {hotelInfo?.address}
              {hotelInfo?.address && hotelInfo?.phone ? " · " : ""}
              {hotelInfo?.phone}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#666", marginTop: 8, letterSpacing: 1 }}>RECIBO DE HOSPEDAGEM</div>
          <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
          <div style={{ fontSize: 10, color: "#bbb", marginTop: 3 }}>Nº {receiptId}</div>
        </div>

        {/* HÓSPEDE */}
        <div style={{ marginBottom: 14, breakInside: "avoid", pageBreakInside: "avoid" }}>
          <span style={sectionLabel}>Hóspede</span>
          <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 6, padding: "12px 14px" }}>
            <div style={{ fontSize: 15, fontWeight: "bold", color: "#111", marginBottom: 8 }}>{p?.full_name ?? "Hóspede"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 14px" }}>
              {p?.cpf && (
                <div style={{ fontSize: 12, color: "#555" }}>
                  <span style={{ color: "#888", display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 1 }}>CPF</span>
                  {p.cpf}
                </div>
              )}
              {p?.phone && (
                <div style={{ fontSize: 12, color: "#555" }}>
                  <span style={{ color: "#888", display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 1 }}>Telefone</span>
                  {p.phone}
                </div>
              )}
              {p?.email && (
                <div style={{ fontSize: 12, color: "#555", gridColumn: "1 / -1" }}>
                  <span style={{ color: "#888", display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 1 }}>E-mail</span>
                  {p.email}
                </div>
              )}
              {hasAddress && (
                <div style={{ fontSize: 12, color: "#555", gridColumn: "1 / -1" }}>
                  <span style={{ color: "#888", display: "block", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 1 }}>Endereço</span>
                  {[p.address, p.city, p.state].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HOSPEDAGEM */}
        <div style={{ marginBottom: 14 }}>
          <span style={sectionLabel}>Hospedagem</span>
          <div style={rowStyle}>
            <div>
              <div style={{ fontWeight: "bold", color: "#111", fontSize: 13 }}>{(receiptRes?.rooms as any)?.name}</div>
              <div style={rowSub}>
                {format(new Date(receiptRes!.check_in + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} →{" "}
                {format(new Date(receiptRes!.check_out + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} ·{" "}
                {receiptNights} {receiptNights === 1 ? "noite" : "noites"} · R$ {receiptRoomPrice.toFixed(2)}/noite
              </div>
            </div>
            <div style={rowValue}>R$ {receiptRoomTotal.toFixed(2)}</div>
          </div>
        </div>

        {/* CONSUMOS */}
        {receiptOrders.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <span style={sectionLabel}>Consumos</span>
            {receiptOrders.map((o) => (
              <div key={o.id} style={rowStyle}>
                <div>
                  <div style={{ color: "#333", fontSize: 13 }}>{o.item_name} × {o.quantity}</div>
                  <div style={rowSub}>R$ {Number(o.unit_price).toFixed(2)}/un · {format(new Date(o.created_at), "dd/MM HH:mm", { locale: ptBR })}</div>
                </div>
                <div style={rowValue}>R$ {Number(o.total).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}

        {/* SUBTOTAIS */}
        <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 6, padding: "10px 14px", marginBottom: 8, breakInside: "avoid", pageBreakInside: "avoid" }}>
          <div style={subtotalRow}>
            <span>Hospedagem ({receiptNights} {receiptNights === 1 ? "noite" : "noites"})</span>
            <span>R$ {receiptRoomTotal.toFixed(2)}</span>
          </div>
          {receiptOrders.length > 0 && (
            <div style={subtotalRow}>
              <span>Consumos ({receiptOrders.length} {receiptOrders.length === 1 ? "item" : "itens"})</span>
              <span>R$ {receiptConsumoTotal.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* TOTAL */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 8px", borderTop: `2px solid ${GOLD}`, marginTop: 4, breakInside: "avoid", pageBreakInside: "avoid" }}>
          <span style={{ fontSize: 16, fontWeight: "bold", color: "#111" }}>TOTAL</span>
          <span style={{ fontSize: 22, fontWeight: "bold", color: GOLD }}>R$ {receiptGrandTotal.toFixed(2)}</span>
        </div>

        {/* PAGAMENTO */}
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#fafafa", border: "1px solid #eee", borderRadius: 6, breakInside: "avoid", pageBreakInside: "avoid" }}>
          <span style={{ ...sectionLabel, marginBottom: 8 }}>Pagamento</span>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555", padding: "3px 0" }}>
            <span>Forma de pagamento</span>
            <span style={{ fontWeight: "bold", borderBottom: "1px solid #999", minWidth: 140, display: "inline-block" }}>&nbsp;</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#555", padding: "6px 0 3px" }}>
            <span>Data do pagamento</span>
            <span>{format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
        </div>

        {/* ASSINATURA */}
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px dashed #ddd", breakInside: "avoid", pageBreakInside: "avoid" }}>
          <span style={{ ...sectionLabel, marginBottom: 12 }}>Declaração e Assinatura</span>
          <p style={{ fontSize: 11, color: "#666", marginBottom: 18, lineHeight: 1.6 }}>
            Declaro que recebi os serviços acima descritos em conformidade e que as informações prestadas são verdadeiras.
          </p>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: "1px solid #999", height: 36, marginBottom: 6 }} />
              <div style={{ fontSize: 10, color: "#888", textAlign: "center" }}>Assinatura do Hóspede</div>
              {p?.cpf && <div style={{ fontSize: 10, color: "#bbb", textAlign: "center", marginTop: 3 }}>CPF: {p.cpf}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: "1px solid #999", height: 36, marginBottom: 6 }} />
              <div style={{ fontSize: 10, color: "#888", textAlign: "center" }}>Atendente / Carimbo</div>
            </div>
          </div>
        </div>

        {/* RODAPÉ */}
        <div style={{ textAlign: "center", marginTop: 16, paddingTop: 10, borderTop: "1px solid #eee", breakInside: "avoid", pageBreakInside: "avoid" }}>
          <p style={{ fontSize: 12, color: "#999" }}>Obrigado pela sua estadia! Volte sempre.</p>
          <p style={{ fontSize: 10, color: "#bbb", marginTop: 4 }}>
            SB Hotel · Sleep Better · {hotelInfo?.address ? `${hotelInfo.address}, ` : ""}{hotelInfo?.city || "Butiá, RS"}
            {hotelInfo?.phone ? ` · ${hotelInfo.phone}` : ""}
          </p>
          <p style={{ fontSize: 10, color: "#ddd", marginTop: 2 }}>Nº {receiptId} · Emitido em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
      </>
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
          <Link to="/admin" className="inline-flex items-center gap-2 text-cream/50 hover:text-primary text-sm font-body transition-colors">
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
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-body transition-all ${tab === t.key ? "bg-primary/20 text-primary border border-primary/30" : "text-cream/40 hover:text-cream/70"}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Contas Abertas ── */}
        {tab === "open" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
                <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary/40 mx-auto" /></div>
              ) : filteredOpen.length === 0 ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
                  <p className="text-cream/30 font-body text-sm">Nenhuma conta aberta</p>
                </div>
              ) : (
                filteredOpen.map((res) => (
                  <ResCard key={res.id} res={res} selected={selectedRes?.id === res.id} onClick={() => setSelectedRes(res)} />
                ))
              )}
            </div>

            <div className="lg:col-span-3">
              {!selectedRes ? (
                <div className="flex flex-col items-center justify-center h-80 rounded-2xl border border-dashed border-gold/15">
                  <Receipt className="w-12 h-12 text-primary/20 mb-4" />
                  <p className="text-cream/30 font-body text-sm">Selecione uma reserva para ver a conta</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-charcoal-light border border-gold/15 rounded-2xl overflow-hidden">
                  <div className="relative p-6 border-b border-gold/10" style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.02))" }}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10" style={{ background: "radial-gradient(circle,#C9A84C,transparent)" }} />
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-xs text-primary/70 font-body tracking-widest uppercase mb-1">Conta do hóspede</p>
                        <h2 className="font-display text-xl font-bold text-cream">
                          {(selectedRes.profiles as any)?.full_name ?? "Hóspede"} — {(selectedRes.rooms as any)?.name ?? "Quarto"}
                        </h2>
                        <p className="text-cream/40 font-body text-sm mt-0.5">
                          {nights} {nights === 1 ? "noite" : "noites"}
                        </p>
                      </div>
                      <button onClick={() => setSelectedRes(null)} className="text-cream/30 hover:text-cream transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BedDouble className="w-4 h-4 text-primary" />
                        <p className="text-xs text-primary/70 font-body tracking-widest uppercase">Hospedagem</p>
                      </div>
                      <div className="bg-charcoal rounded-xl border border-white/5 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-cream font-body text-sm font-medium">{(selectedRes.rooms as any)?.name}</p>
                            <p className="text-cream/40 font-body text-xs mt-0.5">
                              {format(new Date(selectedRes.check_in + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} →{" "}
                              {format(new Date(selectedRes.check_out + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} · {nights} {nights === 1 ? "noite" : "noites"} · R$ {roomPrice.toFixed(2)}/noite
                            </p>
                          </div>
                          <p className="font-display font-bold text-cream">R$ {roomTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

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
                                  {o.quantity}× · R$ {Number(o.unit_price).toFixed(2)} · {format(new Date(o.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                  {o.notes && ` · "${o.notes}"`}
                                </p>
                              </div>
                              <p className="font-body font-semibold text-cream text-sm">R$ {Number(o.total).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-gold/20 p-5" style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.1),rgba(201,168,76,0.02))" }}>
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
                          <span className="font-display font-bold text-primary text-2xl">R$ {grandTotal.toFixed(2)}</span>
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
              <div className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary/40 mx-auto" /></div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-20">
                <History className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                <p className="text-cream/30 font-body">Nenhum checkout concluído ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((res, i) => {
                  const n = Math.max(1, differenceInDays(new Date(res.check_out), new Date(res.check_in)));
                  const rt = res.total_price || 0;
                  return (
                    <motion.div key={res.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="bg-charcoal-light border border-gold/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-gold/20 transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-primary/60" />
                          <p className="text-cream font-body font-semibold text-sm">{(res.profiles as any)?.full_name ?? "Hóspede"}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-body">Finalizada</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-cream/40 font-body">
                          <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" />{(res.rooms as any)?.name ?? "—"}</span>
                          <span>
                            {format(new Date(res.check_in + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} →{" "}
                            {format(new Date(res.check_out + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <span>{n} {n === 1 ? "noite" : "noites"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-display font-bold text-primary text-lg">R$ {rt.toFixed(2)}</p>
                        <button
                          onClick={async () => {
                            const { data: byResId } = await supabase.from("consumption_orders").select("*").eq("reservation_id", res.id).eq("status", "billed");
                            if (byResId && byResId.length > 0) {
                              setReceiptOrders(byResId);
                            } else {
                              const roomName = (res.rooms as any)?.name;
                              if (roomName) {
                                const { data } = await supabase.from("consumption_orders").select("*").eq("room_number", roomName).eq("status", "billed").gte("created_at", res.check_in).lte("created_at", res.check_out + "T23:59:59");
                                setReceiptOrders(data ?? []);
                              } else {
                                setReceiptOrders([]);
                              }
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-charcoal border border-gold/20 rounded-2xl p-8 max-w-sm w-full text-center">
              <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-5">
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-cream mb-2">Confirmar Checkout?</h3>
              <p className="text-cream/50 text-sm font-body mb-1">
                {(selectedRes?.profiles as any)?.full_name ?? "Hóspede"} · {(selectedRes?.rooms as any)?.name}
              </p>
              <div className="my-4 space-y-1 text-sm font-body">
                <div className="flex justify-between text-cream/50 px-4"><span>Hospedagem</span><span>R$ {roomTotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-cream/50 px-4"><span>Consumos</span><span>R$ {consumoTotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-primary font-bold text-base px-4 pt-2 border-t border-gold/15"><span>Total</span><span>R$ {grandTotal.toFixed(2)}</span></div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6">
                <p className="text-yellow-400 text-xs font-body">A reserva será concluída e consumos faturados.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(false)} className="flex-1 border border-gold/20 text-cream/60 rounded-lg py-3 text-sm font-body hover:text-cream transition">Cancelar</button>
                <button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  className="flex-1 rounded-lg py-3 text-sm font-semibold font-body transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)", color: "#000" }}
                >
                  {checkoutMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Processando...</span>
                  ) : ("Confirmar")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Recibo ── */}
      <AnimatePresence>
        {receiptRes && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center px-4 py-6 overflow-y-auto"
            onClick={(e) => e.target === e.currentTarget && setReceiptRes(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] my-auto">

              {/* Conteúdo imprimível */}
              <div ref={printRef} className="p-8 overflow-y-auto flex-1" style={{ fontFamily: "Georgia, serif", color: "#111" }}>
                {renderReceipt()}
              </div>

              {/* Botões */}
              <div className="flex gap-3 p-5 bg-gray-50 border-t shrink-0">
                <button onClick={() => setReceiptRes(null)} className="flex-1 border border-gray-200 text-gray-500 rounded-lg py-2.5 text-sm font-body hover:bg-gray-100 transition">
                  Fechar
                </button>
                <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold font-body transition-all"
                  style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)", color: "#000" }}>
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
