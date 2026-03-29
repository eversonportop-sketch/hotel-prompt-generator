import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, Star } from "lucide-react";
import hotelLogo from "@/assets/hotel-sb-logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // URL para redirecionar após login (ex: /quartos/123 quando vem de uma reserva)
  const redirectTo = searchParams.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
      toast.error("E-mail ou senha incorretos.");
      return;
    }
    const {
      data: { user: loggedUser },
    } = await supabase.auth.getUser();
    let role = "user";
    if (loggedUser) {
      const { data: prof } = await supabase.from("profiles").select("role").eq("id", loggedUser.id).single();
      role = prof?.role ?? "user";
    }
    setLoading(false);
    toast.success("Login realizado com sucesso!");
    // Se veio de uma página específica (ex: tentou reservar), volta pra lá
    if (redirectTo) navigate(redirectTo);
    else if (role === "admin") navigate("/admin");
    else navigate("/portal");
  };

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center relative overflow-hidden px-4">
      {/* Fundo decorativo */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 30% 50%, #1a1200 0%, #0A0A0A 60%, #0d0800 100%)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #C9A84C 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #C0272D 0%, transparent 70%)" }}
      />

      {/* Partículas */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-primary"
          style={{ left: `${10 + i * 11}%`, top: `${10 + (i % 4) * 20}%`, opacity: 0.3 }}
          animate={{ y: [-6, 6, -6], opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}

      {/* Linha lateral esquerda */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3 opacity-20">
        <div className="w-px h-32 bg-gradient-to-b from-transparent to-gold" />
        <div className="w-1 h-1 rounded-full bg-gold" />
        <div className="w-px h-32 bg-gradient-to-b from-gold to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.03) 100%)",
            border: "1px solid rgba(201,168,76,0.2)",
          }}
        >
          <div className="bg-charcoal/90 backdrop-blur-md p-8 md:p-10">
            {/* Logo e título */}
            <div className="text-center mb-8">
              <motion.img
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                src={hotelLogo}
                alt="Hotel SB"
                className="h-20 w-auto mx-auto mb-5 drop-shadow-xl"
              />

              {/* Estrelas */}
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                  >
                    <Star className="w-3 h-3 fill-primary text-primary" />
                  </motion.div>
                ))}
              </div>

              <h1 className="font-display text-2xl md:text-3xl font-bold text-cream mb-2">
                Bem-vindo de <span className="text-gradient-gold">volta</span>
              </h1>
              <p className="text-cream/40 text-sm font-body">Entre com sua conta para acessar o SB Hotel</p>

              {/* Separador */}
              <div className="flex items-center gap-3 mt-5">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/20" />
                <span className="text-primary/40 text-xs font-body tracking-widest uppercase">Login</span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/20" />
              </div>
            </div>

            {/* Formulário */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* E-mail */}
              <div>
                <label className="block text-xs text-primary/70 font-body tracking-[0.15em] uppercase mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/20" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full bg-black/40 border border-gold/15 text-cream placeholder:text-cream/20 rounded-lg pl-10 pr-4 py-3 text-sm font-body focus:outline-none focus:border-gold/40 transition-colors"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs text-primary/70 font-body tracking-[0.15em] uppercase mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/20" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-black/40 border border-gold/15 text-cream placeholder:text-cream/20 rounded-lg pl-10 pr-11 py-3 text-sm font-body focus:outline-none focus:border-gold/40 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/20 hover:text-cream/60 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botão entrar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-lg font-body text-sm tracking-[0.2em] uppercase font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: loading ? "#555" : "linear-gradient(135deg, #C9A84C 0%, #E5C97A 50%, #C9A84C 100%)",
                    color: "#0A0A0A",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Entrando...
                    </span>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </div>
            </form>

            {/* Cadastro */}
            <p className="text-center text-sm text-cream/30 font-body mt-6">
              Não tem uma conta?{" "}
              <Link
                to={redirectTo ? `/cadastro?redirect=${encodeURIComponent(redirectTo)}` : "/cadastro"}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Cadastre-se
              </Link>
            </p>

            {/* Voltar ao site */}
            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-cream/20 hover:text-cream/50 text-xs font-body tracking-wider uppercase transition-colors"
              >
                ← Voltar ao site
              </Link>
            </div>
          </div>
        </div>

        {/* Tagline abaixo */}
        <p className="text-center text-cream/15 text-xs font-body tracking-[0.3em] uppercase mt-6">
          Sleep Better · Butiá · RS
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
