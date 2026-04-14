import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface HomeSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  description: string;
  image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  image_side: string;
  active: boolean;
  display_order: number;
}

const FALLBACK_IMAGES: Record<string, string> = {
  destaque_quarto: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80",
  experiencia: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80",
  promocoes_visuais: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80",
};

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80";

function SectionBlock({ section, index }: { section: HomeSection; index: number }) {
  const imageOnLeft = section.image_side !== "right";
  const imgSrc = section.image_url || FALLBACK_IMAGES[section.section_key] || DEFAULT_FALLBACK;

  const imageBlock = (
    <motion.div
      className="relative w-full md:w-1/2 h-72 md:h-[480px] overflow-hidden flex items-center justify-center"
      initial={{ opacity: 0, x: imageOnLeft ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="aspect-square w-full max-w-[420px] overflow-hidden rounded-sm relative">
          <img
            src={imgSrc}
            alt={section.title}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </div>
    </motion.div>
  );

  const textBlock = (
    <motion.div
      className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 py-12"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
    >
      {section.subtitle && (
        <span className="text-[hsl(var(--gold))] uppercase tracking-[0.3em] text-xs font-medium mb-4">
          {section.subtitle}
        </span>
      )}

      <h2 className="text-3xl md:text-4xl font-serif text-white mb-6 leading-tight">{section.title}</h2>

      {/* Gold divider */}
      <div className="w-16 h-px bg-[hsl(var(--gold))] mb-6" />

      <p className="text-white/70 leading-relaxed text-base mb-8">{section.description}</p>

      {section.cta_text && section.cta_link && (
        <div>
          {section.cta_link.startsWith("http") ? (
            <a
              href={section.cta_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]/80 transition-colors font-medium tracking-wide text-sm uppercase"
            >
              {section.cta_text}
              <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <Link
              to={section.cta_link}
              className="inline-flex items-center gap-2 text-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]/80 transition-colors font-medium tracking-wide text-sm uppercase"
            >
              {section.cta_text}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className={`flex flex-col md:flex-row items-stretch ${index > 0 ? "border-t border-white/5" : ""}`}>
      {imageOnLeft ? (
        <>
          {imageBlock}
          {textBlock}
        </>
      ) : (
        <>
          <div className="order-2 md:order-1">{textBlock}</div>
          <div className="order-1 md:order-2">{imageBlock}</div>
        </>
      )}
    </div>
  );
}

const HomeSectionsDisplay = () => {
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["home_sections_display"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("home_sections")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as HomeSection[];
    },
  });

  if (isLoading || sections.length === 0) return null;

  return (
    <section className="bg-[#1a1a1a]">
      <div>
        {sections.map((section, index) => (
          <SectionBlock key={section.id} section={section} index={index} />
        ))}
      </div>
    </section>
  );
};

export default HomeSectionsDisplay;
