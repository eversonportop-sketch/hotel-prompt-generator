import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { LangProvider } from "@/contexts/LangContext";
import AdminLayout from "@/components/layout/AdminLayout";
import { useEffect } from "react";

import Index from "./pages/Index";
import Quartos from "./pages/Quartos";
import QuartoDetalhe from "./pages/QuartoDetalhe";
import Salao from "./pages/Salao";
import Piscina from "./pages/Piscina";
import Promocoes from "./pages/Promocoes";
import Galeria from "./pages/Galeria";
import Contato from "./pages/Contato";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Portal from "./pages/Portal";
import Cardapio from "./pages/Cardapio";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReservas from "./pages/admin/AdminReservas";
import AdminCheckin from "./pages/admin/AdminCheckin";
import AdminCheckout from "./pages/admin/AdminCheckout";
import AdminQuartos from "./pages/admin/AdminQuartos";
import AdminClientes from "./pages/admin/AdminClientes";
import AdminPromocoes from "./pages/admin/AdminPromocoes";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminSalao from "./pages/admin/AdminSalao";
import AdminPiscina from "./pages/admin/AdminPiscina";
import AdminConsumo from "./pages/admin/AdminConsumo";
import AdminMidia from "./pages/admin/AdminMidia";
import AdminInformacoes from "./pages/admin/AdminInformacoes";
import AdminPopup from "./pages/admin/AdminPopup";
import AdminEstoque from "./pages/admin/AdminEstoque";
import AdminHomeDestaque from "./pages/admin/AdminHomeDestaque";
import AdminGaleria from "./pages/admin/AdminGaleria";
import AdminAvaliacoes from "./pages/admin/AdminAvaliacoes";
import AdminVisitantes from "./pages/admin/AdminVisitantes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Volta ao topo sempre que mudar de página
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LangProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* ── Site público ── */}
              <Route path="/" element={<Index />} />
              <Route path="/quartos" element={<Quartos />} />
              <Route path="/quartos/:id" element={<QuartoDetalhe />} />
              <Route path="/salao" element={<Salao />} />
              <Route path="/piscina" element={<Piscina />} />
              <Route path="/promocoes" element={<Promocoes />} />
              <Route path="/galeria" element={<Galeria />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/cardapio" element={<Cardapio />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/portal" element={<Portal />} />

              {/* ── Admin — todas as páginas dentro do AdminLayout ── */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="reservas" element={<AdminReservas />} />
                <Route path="checkin" element={<AdminCheckin />} />
                <Route path="checkout" element={<AdminCheckout />} />
                <Route path="quartos" element={<AdminQuartos />} />
                <Route path="clientes" element={<AdminClientes />} />
                <Route path="promocoes" element={<AdminPromocoes />} />
                <Route path="configuracoes" element={<AdminConfiguracoes />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="salao" element={<AdminSalao />} />
                <Route path="piscina" element={<AdminPiscina />} />
                <Route path="consumo" element={<AdminConsumo />} />
                <Route path="midia" element={<AdminMidia />} />
                <Route path="informacoes" element={<AdminInformacoes />} />
                <Route path="popup" element={<AdminPopup />} />
                <Route path="estoque" element={<AdminEstoque />} />
                <Route path="home-destaques" element={<AdminHomeDestaque />} />
                <Route path="galeria" element={<AdminGaleria />} />
                <Route path="avaliacoes" element={<AdminAvaliacoes />} />
                <Route path="visitantes" element={<AdminVisitantes />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LangProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
