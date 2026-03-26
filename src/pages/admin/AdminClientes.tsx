import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Search, Phone, Mail, Crown, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import hotelLogo from "@/assets/hotel-sb-logo.png";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
}

interface ProfileWithEmail extends Profile {
  email?: string;
  reservations_count?: number;
}

const AdminClientes = () => {
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const total = profiles.length;
  const admins = profiles.filter((p) => p.role === "admin").length;
  const clients = total - admins;

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
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="font-display text-2xl font-bold text-cream">Clientes</h1>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total", value: total, color: "text-cream" },
            { label: "Hóspedes", value: clients, color: "text-blue-400" },
            { label: "Admins", value: admins, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-charcoal-light border border-gold/10 rounded-xl p-4">
              <p className="text-cream/40 text-xs font-body uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
          <input
            className="w-full bg-charcoal-light border border-gold/15 rounded-xl pl-11 pr-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition placeholder:text-cream/25 font-body"
            placeholder="Buscar por nome, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="text-center py-20 text-cream/30 font-body">Carregando clientes...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-primary/20 mx-auto mb-4" />
            <p className="text-cream/30 font-body">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="bg-charcoal-light border border-gold/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/10">
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-cream/30 font-body">Cliente</th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-cream/30 font-body hidden md:table-cell">Telefone</th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-cream/30 font-body hidden md:table-cell">Cadastro</th>
                  <th className="text-left px-6 py-4 text-xs uppercase tracking-widest text-cream/30 font-body">Perfil</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-gold/5 hover:bg-black/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <span className="text-primary text-sm font-display font-bold">
                            {(p.full_name ?? "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-cream text-sm font-body font-medium">{p.full_name ?? "Sem nome"}</p>
                          <p className="text-cream/30 text-xs font-body">{p.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-cream/50 text-sm font-body flex items-center gap-1.5">
                        {p.phone ? (
                          <><Phone className="w-3.5 h-3.5" />{p.phone}</>
                        ) : (
                          <span className="text-cream/20">—</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-cream/40 text-sm font-body">
                        {format(new Date(p.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-body ${
                        p.role === "admin"
                          ? "bg-primary/15 text-primary border border-primary/25"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {p.role === "admin" ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {p.role === "admin" ? "Admin" : "Hóspede"}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClientes;
