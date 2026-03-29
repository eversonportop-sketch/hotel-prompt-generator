import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import hotelLogo from "@/assets/hotel-sb-logo.png";

const AdminPopup = () => {
  return (
    <div className="min-h-screen bg-charcoal text-cream">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-charcoal/80 border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hotelLogo} alt="Hotel SB" className="h-8 w-auto object-contain" />
          <span className="text-white/20 text-xs tracking-[0.2em] uppercase font-body">Admin</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-2 text-sm text-white/30 font-body">
          <Link to="/admin" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <span>/</span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="font-display text-xl font-semibold text-cream">Popup</h1>
          </div>
        </div>

        <div className="rounded-xl bg-charcoal-light border border-white/5 p-8 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-white/40 font-body">Módulo Popup — em construção.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPopup;
