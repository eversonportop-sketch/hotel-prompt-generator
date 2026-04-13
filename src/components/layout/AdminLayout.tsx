import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  LogIn,
  LogOut as LogOutIcon,
  Receipt,
  UtensilsCrossed,
  BedDouble,
  Users,
  Waves,
  PartyPopper,
  Package,
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
  LogOut,
  Loader2,
  Home,
} from "lucide-react";
import hotelLogo from "@/assets/hotel-sb-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const sidebarGroups = [
  {
    label: "Operacional",
    items: [
      { icon: CalendarDays, label: "Reservas", href: "/admin/reservas" },
      { icon: LogIn, label: "Check-in", href: "/admin/checkin" },
      { icon: LogOutIcon, label: "Checkout", href: "/admin/checkout" },
      { icon: UtensilsCrossed, label: "Consumo", href: "/admin/consumo" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { icon: BedDouble, label: "Quartos", href: "/admin/quartos" },
      { icon: Users, label: "Clientes", href: "/admin/clientes" },
      { icon: Waves, label: "Piscina", href: "/admin/piscina" },
      { icon: PartyPopper, label: "Salão", href: "/admin/salao" },
      { icon: Package, label: "Estoque", href: "/admin/estoque" },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { icon: Tag, label: "Promoções", href: "/admin/promocoes" },
      { icon: Image, label: "Banners", href: "/admin/banners" },
      { icon: Image, label: "Mídia", href: "/admin/midia" },
      { icon: Image, label: "Galeria", href: "/admin/galeria" },
      { icon: Info, label: "Informações", href: "/admin/informacoes" },
      { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
      { icon: Sparkles, label: "Popup", href: "/admin/popup" },
      { icon: Home, label: "Home Sections", href: "/admin/home-destaques" },
    ],
  },
];

const SidebarContent = ({
  collapsed,
  onClose,
  adminName,
  onSignOut,
}: {
  collapsed: boolean;
  onClose?: () => void;
  adminName: string;
  onSignOut: () => void;
}) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <img src={hotelLogo} alt="Hotel SB" className="h-8 w-8 object-contain flex-shrink-0" />
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-display font-semibold text-cream leading-tight truncate">Hotel SB</span>
            <span className="text-[10px] text-white/25 uppercase tracking-[0.2em] font-body">Admin</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
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

      <div className="border-t border-white/5 p-3 space-y-1">
        {!collapsed && adminName && (
          <div className="px-3 py-2 mb-1">
            <p className="text-[11px] text-white/20 font-body uppercase tracking-wider">Logado como</p>
            <p className="text-xs text-cream/60 font-body truncate mt-0.5">{adminName}</p>
          </div>
        )}
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-xs text-white/30 hover:text-primary transition-colors font-body rounded-lg hover:bg-white/5"
        >
          <ArrowRight className="w-3 h-3" />
          {!collapsed && <span>Ver site</span>}
        </Link>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/30 hover:text-red-400 transition-colors font-body rounded-lg hover:bg-red-500/10"
        >
          <LogOut className="w-3 h-3" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminName, setAdminName] = useState("");
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.role !== "admin") {
          navigate("/portal", { replace: true });
        } else {
          setAdminName(data.full_name || user.email || "Admin");
          setChecking(false);
        }
      });
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src={hotelLogo} alt="Hotel SB" className="h-12 w-auto opacity-60" />
          <div className="flex items-center gap-2 text-white/30 text-sm font-body">
            <Loader2 className="w-4 h-4 animate-spin" />
            Verificando acesso...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-charcoal text-cream">
      <aside
        className={`hidden lg:flex flex-col border-r border-white/5 bg-charcoal-light transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
      >
        <SidebarContent collapsed={collapsed} adminName={adminName} onSignOut={handleSignOut} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 border-t border-white/5 p-3 flex items-center justify-end text-white/20 hover:text-cream transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

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
              <SidebarContent
                collapsed={false}
                onClose={() => setMobileOpen(false)}
                adminName={adminName}
                onSignOut={handleSignOut}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
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
