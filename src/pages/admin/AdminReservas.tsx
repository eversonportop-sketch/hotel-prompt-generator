import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CalendarDays, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmada",
  canceled: "Cancelada",
  completed: "Concluída",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-green-500/20 text-green-400",
  canceled: "bg-red-500/20 text-red-400",
  completed: "bg-blue-500/20 text-blue-400",
};

const AdminReservas = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*, rooms(name, category), profiles(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("reservations")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status."),
  });

  const filtered = reservations.filter((r: any) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const clientName = (r.profiles as any)?.full_name || "";
    const roomName = (r.rooms as any)?.name || "";
    const matchesSearch =
      !searchTerm ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roomName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-charcoal">
      <header className="bg-charcoal-light border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hotelLogo} alt="Hotel SB" className="h-10 w-auto object-contain" />
          <span className="text-cream/40 text-xs font-body">Admin</span>
        </div>
        <Link to="/" className="text-cream/50 text-sm font-body hover:text-primary transition-colors">
          Ver Site →
        </Link>
      </header>

      <div className="p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-8">
            <Link to="/admin" className="text-cream/50 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <CalendarDays className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-cream">Reservas</h1>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
              <Input
                placeholder="Buscar por cliente ou quarto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-charcoal-light border-gold/10 text-cream placeholder:text-cream/30"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-charcoal-light border-gold/10 text-cream">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-charcoal-light border border-gold/10 rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-cream/40 font-body">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-cream/40 font-body">Nenhuma reserva encontrada.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gold/10 hover:bg-transparent">
                    <TableHead className="text-cream/60">Cliente</TableHead>
                    <TableHead className="text-cream/60">Quarto</TableHead>
                    <TableHead className="text-cream/60">Check-in</TableHead>
                    <TableHead className="text-cream/60">Check-out</TableHead>
                    <TableHead className="text-cream/60">Hóspedes</TableHead>
                    <TableHead className="text-cream/60">Total</TableHead>
                    <TableHead className="text-cream/60">Status</TableHead>
                    <TableHead className="text-cream/60">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r: any) => (
                    <TableRow key={r.id} className="border-gold/10 hover:bg-charcoal/50">
                      <TableCell className="text-cream font-body text-sm">
                        {(r.profiles as any)?.full_name || "—"}
                      </TableCell>
                      <TableCell className="text-cream font-body text-sm">
                        {(r.rooms as any)?.name || "—"}
                      </TableCell>
                      <TableCell className="text-cream/70 font-body text-sm">
                        {format(new Date(r.check_in), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-cream/70 font-body text-sm">
                        {format(new Date(r.check_out), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-cream/70 font-body text-sm">{r.guests_count}</TableCell>
                      <TableCell className="text-primary font-display font-semibold">
                        R$ {Number(r.total_price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-body ${statusColors[r.status] || ""}`}>
                          {statusLabels[r.status] || r.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={r.status}
                          onValueChange={(val) => updateStatusMutation.mutate({ id: r.id, status: val })}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs bg-charcoal border-gold/10 text-cream">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="confirmed">Confirmada</SelectItem>
                            <SelectItem value="canceled">Cancelada</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminReservas;
