import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  BedDouble,
  Waves,
  PartyPopper,
  Tag,
  Image,
  Info,
  Settings,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import hotelLogo from "@/assets/hotel-sb-logo.png";

// ─── Grupos da sidebar ────────────────────────────────────────────────────────
const sidebarGroups = [
  {
    label: "Operacional",
    items: [
      { icon: CalendarDays, label: "Reservas", href: "/admin/reservas" },
      { icon: UtensilsCrossed, label: "Consumo", href: "/admin/consumo" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { icon: BedDouble, label: "Quartos", href: "/admin/quartos" },
      { icon: Waves, label: "Piscina", href: "/admin/piscina" },
      { icon: PartyPopper, label: "Salão", href: "/admin/salao" },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { icon: Tag, label: "Promoções", href: "/admin/promocoes" },
      { icon: Image, label: "Banners", href: "/admin/banners" },
      { icon: Image, label: "Mídia", href: "/admin/midia" },
      { icon: Info, label: "Informações", href: "/admin/informacoes" },
      { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
      { icon: Sparkles, label: "Popup", href: "/admin/popup" },
    ],
  },
];

// ─── Sidebar interna ──────────────────────────────────────────────────────────
const SidebarContent = ({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <img src={hotelLogo} alt="Hotel SB" className="h-8 w-8 object-contain flex-shrink-0" />
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-display font-semibold text-cream leading-tight truncate">SB Hotel</span>
            <span className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-body">Admin</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {/* Dashboard */}
        <Link
          to="/admin"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all ${
            location.pathname === "/admin"
              ? "bg-primary/15 text-primary font-semibold"
              : "text-white/50 hover:text-cream hover:bg-white/5"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="truncate">Dashboard</span>}
        </Link>

        {/* Grupos */}
        {sidebarGroups.map((group) => (
          <div key={group.label} className="pt-4">
            {!collapsed ? (
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/20 font-body">
                {group.label}
              </p>
            ) : (
              <div className="mx-3 mb-2 border-t border-white/5" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body transition-all ${
                      active
                        ? "bg-primary/15 text-primary font-semibold"
                        : "text-white/40 hover:text-cream hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Ver site */}
      {!collapsed && (
        <div className="border-t border-white/5 p-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/30 hover:text-primary transition-colors font-body"
          >
            <ArrowRight className="w-3 h-3" />
            <span>Ver site</span>
          </Link>
        </div>
      )}
    </div>
  );
};

// ─── Layout principal ─────────────────────────────────────────────────────────
const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-charcoal text-cream">
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden lg:flex flex-col border-r border-white/5 bg-charcoal-light transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        <SidebarContent collapsed={collapsed} />

        {/* Toggle collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 border-t border-white/5 p-3 flex items-center justify-end text-white/20 hover:text-cream transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-charcoal-light border-r border-white/5 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 text-white/30 hover:text-cream transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent collapsed={false} onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Conteúdo ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <header className="flex lg:hidden items-center gap-3 px-4 py-3 border-b border-white/5 bg-charcoal/80 backdrop-blur-md sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="text-white/40 hover:text-cream transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <img src={hotelLogo} alt="Hotel SB" className="h-6 w-auto object-contain" />
          <span className="text-white/20 text-xs tracking-[0.2em] uppercase font-body">Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
