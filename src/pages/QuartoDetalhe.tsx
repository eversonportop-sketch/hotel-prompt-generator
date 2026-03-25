import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, BedDouble, CalendarIcon, CheckCircle, AlertCircle } from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const QuartoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guestsCount, setGuestsCount] = useState(1);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const checkAvailability = async () => {
    if (!checkIn || !checkOut || !id) return;
    setChecking(true);
    try {
      const { data, error } = await supabase.rpc("check_room_availability", {
        p_room_id: id,
        p_check_in: format(checkIn, "yyyy-MM-dd"),
        p_check_out: format(checkOut, "yyyy-MM-dd"),
      });
      if (error) throw error;
      setAvailable(data as boolean);
    } catch (err: any) {
      toast.error("Erro ao verificar disponibilidade");
    } finally {
      setChecking(false);
    }
  };

  const reservationMutation = useMutation({
    mutationFn: async () => {
      if (!user || !room || !checkIn || !checkOut) throw new Error("Dados incompletos");
      const nights = differenceInDays(checkOut, checkIn);
      const price = room.promotional_price || room.price;
      const totalPrice = nights * Number(price);

      const { error } = await supabase.from("reservations").insert({
        client_id: user.id,
        room_id: room.id,
        check_in: format(checkIn, "yyyy-MM-dd"),
        check_out: format(checkOut, "yyyy-MM-dd"),
        guests_count: guestsCount,
        total_price: totalPrice,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reserva criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setCheckIn(undefined);
      setCheckOut(undefined);
      setAvailable(null);
      setGuestsCount(1);
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("not available")
        ? "Quarto indisponível para as datas selecionadas."
        : err?.message || "Erro ao criar reserva.";
      toast.error(msg);
    },
  });

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const effectivePrice = room ? Number(room.promotional_price || room.price) : 0;
  const totalPrice = nights * effectivePrice;
  const today = new Date();

  if (isLoading) {
    return (
      <Layout>
        <div className="section-padding bg-background min-h-[60vh] flex items-center justify-center">
          <p className="text-muted-foreground font-body">Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (!room) {
    return (
      <Layout>
        <div className="section-padding bg-background min-h-[60vh] flex items-center justify-center">
          <p className="text-muted-foreground font-body">Quarto não encontrado.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding bg-background">
        <div className="container-hotel">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Image */}
              <div className="aspect-[4/3] rounded-lg overflow-hidden border border-border">
                <img
                  src={room.image_url || "/placeholder.svg"}
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div>
                <span className="text-xs text-primary font-body tracking-[0.3em] uppercase">
                  {room.category}
                </span>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4">
                  {room.name}
                </h1>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" /> {room.capacity} pessoas
                  </span>
                  <span className="flex items-center gap-1">
                    <BedDouble className="w-4 h-4" /> {room.beds}
                  </span>
                </div>

                {room.description && (
                  <p className="text-muted-foreground font-body mb-6 leading-relaxed">
                    {room.description}
                  </p>
                )}

                {room.amenities && (room.amenities as string[]).length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-display text-sm font-semibold text-foreground mb-2">Comodidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {(room.amenities as string[]).map((a: string) => (
                        <span key={a} className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full font-body">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  {room.promotional_price ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-display font-bold text-primary">
                        R$ {Number(room.promotional_price).toFixed(0)}
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        R$ {Number(room.price).toFixed(0)}
                      </span>
                      <span className="text-sm text-muted-foreground">/noite</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-display font-bold text-primary">
                        R$ {Number(room.price).toFixed(0)}
                      </span>
                      <span className="text-sm text-muted-foreground"> /noite</span>
                    </div>
                  )}
                </div>

                {/* Booking Form */}
                <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                  <h3 className="font-display text-lg font-semibold text-foreground">Fazer Reserva</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-body text-sm">Check-in</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !checkIn && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {checkIn ? format(checkIn, "dd/MM/yyyy") : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={checkIn}
                            onSelect={(d) => {
                              setCheckIn(d);
                              setAvailable(null);
                              if (d && checkOut && d >= checkOut) setCheckOut(undefined);
                            }}
                            disabled={(date) => date < today}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-body text-sm">Check-out</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !checkOut && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {checkOut ? format(checkOut, "dd/MM/yyyy") : "Selecionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={checkOut}
                            onSelect={(d) => { setCheckOut(d); setAvailable(null); }}
                            disabled={(date) => date < (checkIn ? addDays(checkIn, 1) : addDays(today, 1))}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-body text-sm">Hóspedes</Label>
                    <Input
                      type="number"
                      min={1}
                      max={room.capacity}
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Math.max(1, Math.min(room.capacity, parseInt(e.target.value) || 1)))}
                    />
                  </div>

                  {nights > 0 && (
                    <div className="bg-secondary/50 rounded p-3 text-sm font-body">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{nights} diária{nights > 1 ? "s" : ""} × R$ {effectivePrice.toFixed(0)}</span>
                        <span className="font-semibold text-foreground">R$ {totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {available !== null && (
                    <div className={cn("flex items-center gap-2 text-sm font-body p-2 rounded", available ? "text-green-600 bg-green-50" : "text-destructive bg-destructive/10")}>
                      {available ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {available ? "Quarto disponível!" : "Quarto indisponível para estas datas."}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="gold-outline"
                      className="flex-1"
                      disabled={!checkIn || !checkOut || checking}
                      onClick={checkAvailability}
                    >
                      {checking ? "Verificando..." : "Ver Disponibilidade"}
                    </Button>
                    <Button
                      variant="gold"
                      className="flex-1"
                      disabled={!checkIn || !checkOut || !available || reservationMutation.isPending}
                      onClick={() => {
                        if (!user) {
                          toast.error("Faça login para reservar.");
                          navigate("/login");
                          return;
                        }
                        reservationMutation.mutate();
                      }}
                    >
                      {reservationMutation.isPending ? "Reservando..." : "Reservar"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default QuartoDetalhe;
