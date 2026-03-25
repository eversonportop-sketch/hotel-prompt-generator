import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, BedDouble } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Quartos = () => {
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("status", "active")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <section className="section-padding bg-background">
        <div className="container-hotel">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-3">Acomodações</p>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground">
              Nossos <span className="text-gradient-gold">Quartos</span>
            </h1>
          </motion.div>

          {isLoading ? (
            <div className="text-center text-muted-foreground font-body py-12">Carregando quartos...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center text-muted-foreground font-body py-12">Nenhum quarto disponível no momento.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {rooms.map((room: any, index: number) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group bg-card rounded-lg border border-border hover:border-primary/30 overflow-hidden transition-all duration-500"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={room.image_url || "/placeholder.svg"}
                      alt={room.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs text-primary font-body tracking-wider uppercase">{room.category}</span>
                    <h3 className="font-display text-xl font-semibold text-foreground mt-1 mb-2">{room.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {room.capacity} pessoas</span>
                      <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" /> {room.beds}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-display font-bold text-primary">
                          R$ {Number(room.promotional_price || room.price).toFixed(0)}
                        </span>
                        <span className="text-sm text-muted-foreground"> /noite</span>
                      </div>
                      <Link to={`/quartos/${room.id}`}>
                        <Button variant="gold" size="sm">Ver Detalhes</Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Quartos;
