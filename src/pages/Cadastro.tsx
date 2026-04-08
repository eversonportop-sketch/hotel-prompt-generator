import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, Star, FileText, Phone, MapPin, Building2, Map } from "lucide-react";

const inputClass =
  "w-full pl-10 pr-4 py-3 bg-charcoal border border-gold/20 rounded-xl text-cream text-sm placeholder:text-cream/25 focus:border-primary/50 focus:outline-none transition font-body";

const labelClass = "block text-xs uppercase tracking-widest text-primary/70 mb-2 font-body";

const Cadastro = () => {
  // ── State separado por campo (evita re-render que perde o foco) ──
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  // ── Máscara CPF ──
  const handleCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    setCpf(
      d.length <= 3
        ? d
        : d.length <= 6
          ? `${d.slice(0, 3)}.${d.slice(3)}`
          : d.length <= 9
            ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
            : `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`,
    );
  };

  // ── Máscara Telefone ──
  const handlePhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    setPhone(
      d.length <= 2
        ? d
        : d.length <= 7
          ? `(${d.slice(0, 2)}) ${d.slice(2)}`
          : `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);

    // 1. Cria o usuário no Auth
    const { error, userId } = await signUp(email, password, name);

    if (error) {
      toast.error(error.message || "Erro ao cadastrar.");
      setLoading(false);
      return;
    }

    // 2. Salva dados extras no profile
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: name,
        email,
        cpf,
        phone,
        address,
        city,
        state,
      });
    }

    setLoading(false);

    // 3. Verifica se o signup já logou automaticamente (confirmação de email desativada)
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      // Já está logado → redireciona direto para a página de destino
      toast.success("Conta criada com sucesso!");
      navigate(redirectTo || "/portal");
    } else {
      // Email confirmation ativada → precisa confirmar antes de logar
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      navigate(redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-charcoal flex items-center justify-center px-4 py-20">
        {/* Background decorativo */}
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
          className="relative z-10 w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
            </div>
            <h1 className="font-display text-4xl font-bold text-cream mb-2">
              Criar <span className="text-gradient-gold">Conta</span>
            </h1>
            <p className="text-cream/40 text-sm font-body">Preencha seus dados para fazer a reserva</p>
          </div>

          <div
            className="bg-charcoal-light border border-gold/15 rounded-2xl p-8"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
          >
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* ── DADOS PESSOAIS ── */}
              <p className="text-xs uppercase tracking-[0.2em] text-primary/40 font-body pt-1">Dados Pessoais</p>

              {/* Nome */}
              <div>
                <label className={labelClass}>Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* CPF + Telefone lado a lado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>CPF</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      className={inputClass}
                      value={cpf}
                      onChange={(e) => handleCpf(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                    <input
                      type="text"
                      placeholder="(51) 99999-9999"
                      className={inputClass}
                      value={phone}
                      onChange={(e) => handlePhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              {/* ── ENDEREÇO ── */}
              <p className="text-xs uppercase tracking-[0.2em] text-primary/40 font-body pt-2">Endereço</p>

              {/* Endereço */}
              <div>
                <label className={labelClass}>Endereço</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                  <input
                    type="text"
                    placeholder="Rua, número"
                    className={inputClass}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    autoComplete="street-address"
                  />
                </div>
              </div>

              {/* Cidade + Estado lado a lado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Cidade</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                    <input
                      type="text"
                      placeholder="Sua cidade"
                      className={inputClass}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      autoComplete="address-level2"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Estado</label>
                  <div className="relative">
                    <Map className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                    <input
                      type="text"
                      placeholder="RS"
                      maxLength={2}
                      className={inputClass}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      autoComplete="address-level1"
                    />
                  </div>
                </div>
              </div>

              {/* ── ACESSO ── */}
              <p className="text-xs uppercase tracking-[0.2em] text-primary/40 font-body pt-2">Acesso</p>

              {/* E-mail */}
              <div>
                <label className={labelClass}>E-mail *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className={labelClass}>Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Botão */}
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
            <Link
              to={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
              className="text-primary hover:text-primary/80 transition-colors font-semibold"
            >
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
