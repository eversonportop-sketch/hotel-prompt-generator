import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, Star, FileText, Phone, MapPin, Building2, Map, Globe, Hash, Eye, EyeOff, Search } from "lucide-react";

const inputClass =
  "w-full pl-10 pr-4 py-3 bg-charcoal border border-gold/20 rounded-xl text-cream text-sm placeholder:text-cream/25 focus:border-primary/50 focus:outline-none transition font-body";

const labelClass = "block text-xs uppercase tracking-widest text-primary/70 mb-2 font-body";

const SectionTitle = ({ children }: { children: string }) => (
  <p className="text-xs uppercase tracking-[0.2em] text-primary/40 font-body pt-2 border-t border-gold/10 mt-1">
    {children}
  </p>
);

const Cadastro = () => {
  // ── Dados pessoais ──
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [nationality, setNationality] = useState("Brasileira");
  const [phone, setPhone] = useState("");

  // ── Endereço ──
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  // ── Acesso ──
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  // ── Máscaras ──
  const handleCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    setCpf(
      d.length <= 3 ? d
      : d.length <= 6 ? `${d.slice(0,3)}.${d.slice(3)}`
      : d.length <= 9 ? `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
      : `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
    );
  };

  const handlePhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    setPhone(
      d.length <= 2 ? d
      : d.length <= 7 ? `(${d.slice(0,2)}) ${d.slice(2)}`
      : `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
    );
  };

  const handleCep = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    setCep(d.length <= 5 ? d : `${d.slice(0,5)}-${d.slice(5)}`);
  };

  // ── Busca CEP via ViaCEP ──
  const buscarCep = async () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return toast.error("CEP inválido.");
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) return toast.error("CEP não encontrado.");
      setAddress(data.logradouro || "");
      setCity(data.localidade || "");
      setUf(data.uf || "");
      toast.success("Endereço preenchido automaticamente!");
    } catch {
      toast.error("Erro ao buscar CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres.");
    if (password !== confirmPassword) return toast.error("As senhas não coincidem.");
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11) return toast.error("CPF obrigatório. Digite os 11 dígitos.");
    const phoneDigits = phone.replace(/\D/g, "");
    if (!phone || phoneDigits.length < 10) return toast.error("Telefone inválido. Digite DDD + número (ex: 51 99999-9999).");
    const cepDigits = cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) return toast.error("CEP obrigatório. Digite o CEP de 8 dígitos.");
    if (!address.trim()) return toast.error("Endereço é obrigatório.");
    if (!city.trim()) return toast.error("Cidade é obrigatória.");
    if (!uf.trim()) return toast.error("Estado é obrigatório.");
    setLoading(true);

    // Passa a URL do quarto como emailRedirectTo: se o Supabase exigir confirmação de e-mail,
    // o link enviado já leva direto de volta ao quarto (não à homepage)
    const quartoRedirectUrl = redirectTo
      ? `${window.location.origin}${redirectTo}`
      : undefined;

    const { error, userId, session: newSession } = await signUp(email, password, name, quartoRedirectUrl);
    if (error) {
      toast.error(error.message || "Erro ao cadastrar.");
      setLoading(false);
      return;
    }

    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        full_name: name,
        email,
        cpf,
        rg,
        nationality,
        phone,
        address,
        city,
        state: uf,
      });

      try {
        const cleanCpf = cpf.replace(/\D/g, "");
        const filters: string[] = [];
        if (cleanCpf.length === 11) filters.push(`cpf.eq.${cleanCpf}`);
        if (email) filters.push(`email.eq.${email}`);
        if (filters.length) {
          const { data: matchedGuests } = await supabase.from("guests").select("id").or(filters.join(","));
          if (matchedGuests?.length) {
            await supabase.from("reservations")
              .update({ profile_id: userId } as any)
              .in("guest_id", matchedGuests.map((g: any) => g.id))
              .is("profile_id", null);
          }
        }
      } catch { /* não impede o cadastro */ }
    }

    setLoading(false);

    // Usa a session retornada pelo próprio signUp (mais confiável que getSession() logo após)
    if (newSession) {
      toast.success("Conta criada com sucesso!");
      navigate(redirectTo || "/portal");
    } else {
      // Confirmação de e-mail obrigatória — emailRedirectTo já está apontando para o quarto
      toast.success("Conta criada! Verifique seu e-mail e clique no link para confirmar e continuar sua reserva.");
      navigate(redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login");
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
          className="relative z-10 w-full max-w-lg"
        >
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
              <SectionTitle>Dados Pessoais</SectionTitle>

              {/* Nome */}
              <div>
                <label className={labelClass}>Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                  <input type="text" placeholder="Seu nome completo" className={inputClass}
                    value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
                </div>
              </div>

              {/* CPF + RG */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>CPF *</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                    <input type="text" placeholder="000.000.000-00" className={inputClass}
                      value={cpf} onChange={(e) => handleCpf(e.target.value)} autoComplete="off" required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>RG</label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                    <input type="text" placeholder="00.000.000-0" className={inputClass}
                      value={rg} onChange={(e) => setRg(e.target.value)} autoComplete="off" />
                  </div>
                </div>
              </div>

              {/* Telefone + Nacionalidade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Telefone / WhatsApp *</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                    <input type="text" placeholder="(51) 99999-9999" className={inputClass}
                      value={phone} onChange={(e) => handlePhone(e.target.value)} required autoComplete="tel" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Nacionalidade</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                    <input type="text" placeholder="Brasileira" className={inputClass}
                      value={nationality} onChange={(e) => setNationality(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* ── ENDEREÇO ── */}
              <SectionTitle>Endereço</SectionTitle>

              {/* CEP com busca automática */}
              <div>
                <label className={labelClass}>CEP *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                    <input type="text" placeholder="00000-000" className={inputClass}
                      value={cep} onChange={(e) => handleCep(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), buscarCep())} />
                  </div>
                  <button type="button" onClick={buscarCep} disabled={cepLoading}
                    className="px-4 py-3 rounded-xl border border-gold/20 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center gap-1.5 text-sm font-body whitespace-nowrap"
                  >
                    {cepLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Buscar
                  </button>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label className={labelClass}>Endereço *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                  <input type="text" placeholder="Rua, número" className={inputClass}
                    value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" required />
                </div>
              </div>

              {/* Cidade + Estado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Cidade *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                    <input type="text" placeholder="Sua cidade" className={inputClass}
                      value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Estado *</label>
                  <div className="relative">
                    <Map className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                    <input type="text" placeholder="RS" maxLength={2} className={inputClass}
                      value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} autoComplete="address-level1" required />
                  </div>
                </div>
              </div>

              {/* ── ACESSO ── */}
              <SectionTitle>Acesso</SectionTitle>

              {/* E-mail */}
              <div>
                <label className={labelClass}>E-mail *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                  <input type="email" placeholder="seu@email.com" className={inputClass}
                    value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className={labelClass}>Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                  <input type={showPass ? "text" : "password"} placeholder="Mínimo 6 caracteres"
                    className={inputClass + " pr-10"}
                    value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className={labelClass}>Confirmar Senha *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
                  <input type={showConfirmPass ? "text" : "password"} placeholder="Repita a senha"
                    className={inputClass + " pr-10" + (confirmPassword && confirmPassword !== password ? " border-red-500/50" : confirmPassword && confirmPassword === password ? " border-emerald-500/40" : "")}
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors">
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-red-400 text-xs font-body mt-1">As senhas não coincidem.</p>
                )}
                {confirmPassword && confirmPassword === password && (
                  <p className="text-emerald-400 text-xs font-body mt-1">✓ Senhas conferem.</p>
                )}
              </div>

              {/* Botão */}
              <button
                type="submit"
                disabled={loading || (!!confirmPassword && confirmPassword !== password)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-semibold text-sm tracking-wide transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(201,168,76,0.3)] disabled:opacity-50 disabled:hover:scale-100 mt-2"
                style={{ background: "linear-gradient(135deg,#C9A84C,#E5C97A)", color: "#000" }}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Cadastrando...</>
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
