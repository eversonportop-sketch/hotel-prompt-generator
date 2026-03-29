import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, Star } from "lucide-react";

const Cadastro = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, name);
    setLoading(false);
    if (error) {
      toast.error(error.message || "Erro ao cadastrar.");
    } else {
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      navigate("/login");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-charcoal flex items-center justify-center px-4 py-20">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#C9A84C 1px,transparent 1px),linear-gradient(90deg,#C9A84C 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl opacity-5"
          style={{ background: "radial-gradient(circle,#C9A84C,transparent)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo/stars */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>
            <h1 className="font-display text-4xl font-bold text-cream mb-2">
              Criar <span className="text-gradient-gold">Conta</span>
            </h1>
            <p className="text-cream/40 text-sm font-body">Acesse o portal do hóspede e benefícios exclusivos</p>
          </div>

          <div
            className="bg-charcoal-light border border-gold/15 rounded-2xl p-8"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
          >
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs uppercase tracking-widest text-primary/70 mb-2 font-body">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-3 bg-charcoal border border-gold/20 rounded-xl text-cream text-sm placeholder:text-cream/25 focus:border-primary/50 focus:outline-none transition font-body"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-primary/70 mb-2 font-body">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-charcoal border border-gold/20 rounded-xl text-cream text-sm placeholder:text-cream/25 focus:border-primary/50 focus:outline-none transition font-body"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-primary/70 mb-2 font-body">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-4 py-3 bg-charcoal border border-gold/20 rounded-xl text-cream text-sm placeholder:text-cream/25 focus:border-primary/50 focus:outline-none transition font-body"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-semibold text-sm tracking-wide transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] disabled:opacity-50 disabled:hover:scale-100 mt-2"
                style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)", color: "#000" }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Cadastrando...
                  </>
                ) : (
                  "Criar minha conta"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-cream/40 font-body mt-6">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-semibold">
                Entrar
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Cadastro;
