import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BedDouble, PartyPopper, Waves, Tag, Image, Users, Settings, LayoutDashboard, UtensilsCrossed, CalendarDays } from "lucide-react";
import hotelLogo from "@/assets/hotel-sb-logo.png";

const adminModules = [
  { icon: BedDouble, label: "Quartos", href: "/admin/quartos", description: "Gerenciar quartos e acomodações" },
  { icon: CalendarDays, label: "Reservas", href: "/admin/reservas", description: "Gestão de reservas" },
  { icon: PartyPopper, label: "Salão de Festas", href: "/admin/salao", description: "Gerenciar salão de eventos" },
  { icon: Waves, label: "Piscina", href: "/admin/piscina", description: "Configurações da piscina" },
  { icon: UtensilsCrossed, label: "Consumo", href: "/admin/consumo", description: "Frigobar e alimentos" },
  { icon: Tag, label: "Promoções", href: "/admin/promocoes", description: "Gerenciar promoções" },
  { icon: Image, label: "Banners", href: "/admin/banners", description: "Banners do site" },
  { icon: Users, label: "Clientes", href: "/admin/clientes", description: "Cadastro de clientes" },
  { icon: Settings, label: "Configurações", href: "/admin/configuracoes", description: "Dados do hotel" },
];

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-charcoal">
      {/* Sidebar header */}
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
            <LayoutDashboard className="w-6 h-6 text-primary" />
            <h1 className="font-display text-2xl font-bold text-cream">Dashboard</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminModules.map((mod, index) => (
              <motion.div
                key={mod.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link
                  to={mod.href}
                  className="block bg-charcoal-light border border-gold/10 rounded-lg p-6 hover:border-primary/30 transition-all duration-300 group"
                >
                  <mod.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-display text-lg text-cream mb-1">{mod.label}</h3>
                  <p className="text-cream/40 text-sm font-body">{mod.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
