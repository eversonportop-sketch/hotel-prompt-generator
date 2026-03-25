import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";

const Contato = () => {
  return (
    <Layout>
      <section className="section-padding bg-background">
        <div className="container-hotel max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground">
              Fale <span className="text-gradient-gold">Conosco</span>
            </h1>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: Phone, label: "Telefone", value: "(00) 0000-0000", href: "tel:+5500000000000" },
              { icon: MessageCircle, label: "WhatsApp", value: "(00) 00000-0000", href: "https://wa.me/5500000000000" },
              { icon: Mail, label: "E-mail", value: "contato@sbhotel.com", href: "mailto:contato@sbhotel.com" },
              { icon: MapPin, label: "Endereço", value: "Endereço do Hotel, Cidade - Estado", href: "#" },
            ].map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card border border-border rounded-lg p-6 flex items-start gap-4 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-primary font-body tracking-wider uppercase mb-1">{item.label}</p>
                  <p className="text-foreground font-body">{item.value}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contato;
