import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ReviewSection = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nota, setNota] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !nota || !mensagem.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("avaliacoes" as any).insert({
      nome: nome.trim(),
      email: email.trim() || null,
      nota,
      mensagem: mensagem.trim(),
    } as any);

    setLoading(false);
    if (!error) setSubmitted(true);
  };

  return (
    <section className="relative py-16 md:py-24 bg-charcoal">
      {/* Linha dourada superior */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, hsl(38 45% 55% / 0.3), transparent)" }}
      />

      <div className="relative z-10 w-full max-w-lg mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8 md:w-12" style={{ background: "linear-gradient(90deg, transparent, hsl(38 45% 55%))" }} />
            <p className="font-body text-xs tracking-[0.25em] uppercase text-primary">Feedback</p>
            <div className="h-px w-8 md:w-12" style={{ background: "linear-gradient(90deg, hsl(38 45% 55%), transparent)" }} />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: "hsl(40 25% 78%)" }}>
            Compartilhe sua <span className="text-gradient-gold">experiência</span>
          </h2>
          <p className="font-body text-sm" style={{ color: "hsl(40 15% 55%)" }}>
            Sua opinião é muito importante para nós. Conte como foi sua estadia.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="thanks"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-12"
            >
              <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
              <h3 className="font-display text-2xl font-bold mb-2" style={{ color: "hsl(40 25% 78%)" }}>
                Obrigado pela sua avaliação!
              </h3>
              <p className="font-body text-sm" style={{ color: "hsl(40 15% 55%)" }}>
                Seu feedback nos ajuda a melhorar cada vez mais.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-5 bg-charcoal-light/50 border border-white/5 rounded-2xl p-6 md:p-8"
            >
              {/* Estrelas */}
              <div className="text-center">
                <p className="font-body text-xs uppercase tracking-widest mb-3" style={{ color: "hsl(40 15% 50%)" }}>
                  Sua nota
                </p>
                <div className="flex items-center justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setNota(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoveredStar || nota)
                            ? "fill-primary text-primary"
                            : "text-white/15"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome */}
              <div>
                <Input
                  placeholder="Seu nome *"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  maxLength={100}
                  className="bg-charcoal border-white/10 text-cream placeholder:text-white/25 focus-visible:ring-primary/40"
                />
              </div>

              {/* Email */}
              <div>
                <Input
                  type="email"
                  placeholder="Seu e-mail (opcional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  className="bg-charcoal border-white/10 text-cream placeholder:text-white/25 focus-visible:ring-primary/40"
                />
              </div>

              {/* Mensagem */}
              <div>
                <Textarea
                  placeholder="Conte-nos sobre sua experiência... *"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  required
                  maxLength={1000}
                  rows={4}
                  className="bg-charcoal border-white/10 text-cream placeholder:text-white/25 focus-visible:ring-primary/40 resize-none"
                />
              </div>

              <Button
                type="submit"
                variant="gold"
                disabled={loading || !nota || !nome.trim() || !mensagem.trim()}
                className="w-full h-12 text-base gap-2"
              >
                {loading ? (
                  <span className="animate-pulse">Enviando...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar avaliação
                  </>
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ReviewSection;
