import { Link } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import hotelLogo from "@/assets/hotel-sb-logo.png";

interface AdminPlaceholderProps {
  title: string;
}

const AdminPlaceholder = ({ title }: AdminPlaceholderProps) => {
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
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-cream/50 hover:text-primary text-sm font-body transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>

        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Construction className="w-16 h-16 text-primary/40 mb-6" />
          <h1 className="font-display text-3xl font-bold text-cream mb-3">{title}</h1>
          <p className="text-cream/40 font-body text-sm max-w-sm">
            Esta seção está em desenvolvimento. Em breve estará disponível.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
