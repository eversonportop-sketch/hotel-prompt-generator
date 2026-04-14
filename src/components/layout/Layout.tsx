import { ReactNode, useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { supabase } from "@/integrations/supabase/client";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    supabase
      .from("hotel_settings" as any)
      .select("value")
      .eq("key", "whatsapp")
      .single()
      .then(({ data }) => {
        if (data?.value) setWhatsapp(data.value);
      });
  }, []);

  const handleWhatsApp = () => {
    const number = whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/55${number}`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 md:pt-20">{children}</main>
      <Footer />

      {whatsapp && (
        <button
          onClick={handleWhatsApp}
          aria-label="Falar no WhatsApp"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
          style={{ backgroundColor: "#25D366" }}
        >
          {/* Anel pulsante */}
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-50"
            style={{ backgroundColor: "#25D366" }}
          />
          {/* Anel externo mais suave */}
          <span
            className="absolute inset-[-6px] rounded-full animate-pulse opacity-20"
            style={{ backgroundColor: "#25D366" }}
          />
          {/* Ícone WhatsApp SVG oficial */}
          <svg className="relative w-7 h-7" viewBox="0 0 32 32" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16c0 2.347.63 4.64 1.827 6.653L2.667 29.333l6.88-1.8A13.267 13.267 0 0 0 16.003 29.333C23.37 29.333 29.333 23.363 29.333 16S23.37 2.667 16.003 2.667Zm0 24.267a11.04 11.04 0 0 1-5.627-1.547l-.4-.24-4.08 1.067 1.093-3.973-.267-.413A11.04 11.04 0 0 1 4.933 16c0-6.107 4.967-11.067 11.067-11.067S27.067 9.893 27.067 16 22.107 26.934 16.003 26.934Zm6.08-8.267c-.333-.167-1.973-.973-2.28-1.08-.307-.107-.533-.167-.76.167-.227.333-.88 1.08-1.08 1.307-.2.227-.4.253-.733.087-.333-.167-1.413-.52-2.693-1.66-.993-.887-1.667-1.98-1.86-2.313-.2-.333-.02-.513.147-.68.153-.147.333-.387.5-.58.167-.193.22-.333.333-.553.113-.22.053-.413-.027-.58-.08-.167-.76-1.833-.04-2.513.347-.333.787-.187 1.04.04.28.24.987 1.207 1.2 1.633.213.427-.04.64-.147.787-.12.16-.267.353-.387.527-.107.16-.24.347-.1.627.14.28.613 1.013 1.313 1.64.907.813 1.667 1.067 1.907 1.187.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.393.657 1.633.777.24.12.4.18.46.28.06.1.06.573-.113 1.127Z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Layout;
