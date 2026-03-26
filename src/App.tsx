import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
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
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReservas from "./pages/admin/AdminReservas";
import AdminCheckin from "./pages/admin/AdminCheckin";
import NotFound from "./pages/NotFound";

// Páginas admin inline (placeholders prontos para expandir)
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Site público */}
            <Route path="/" element={<Index />} />
            <Route path="/quartos" element={<Quartos />} />
            <Route path="/quartos/:id" element={<QuartoDetalhe />} />
            <Route path="/salao" element={<Salao />} />
            <Route path="/piscina" element={<Piscina />} />
            <Route path="/promocoes" element={<Promocoes />} />
            <Route path="/galeria" element={<Galeria />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/reservas" element={<AdminReservas />} />
            <Route path="/admin/checkin" element={<AdminCheckin />} />
            <Route path="/admin/quartos" element={<AdminPlaceholder title="Quartos" />} />
            <Route path="/admin/salao" element={<AdminPlaceholder title="Salão de Festas" />} />
            <Route path="/admin/piscina" element={<AdminPlaceholder title="Piscina" />} />
            <Route path="/admin/consumo" element={<AdminPlaceholder title="Consumo" />} />
            <Route path="/admin/promocoes" element={<AdminPlaceholder title="Promoções" />} />
            <Route path="/admin/banners" element={<AdminPlaceholder title="Banners" />} />
            <Route path="/admin/clientes" element={<AdminPlaceholder title="Clientes" />} />
            <Route path="/admin/configuracoes" element={<AdminPlaceholder title="Configurações" />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
