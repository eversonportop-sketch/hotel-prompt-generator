import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, User, Mail, Lock, Phone, FileText, MapPin, Star } from "lucide-react";

const Cadastro = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    cpf: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);

    // 1. Cria conta no Auth
    const { error } = await signUp(form.email, form.password, form.name);
    if (error) {
      setLoading(false);
      toast.error(error.message || "Erro ao cadastrar.");
      return;
    }

    // 2. Aguarda sessão e atualiza profile com campos extras
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          full_name: form.name,
          phone: form.phone || null,
          cpf: form.cpf || null,
          email: form.email || null,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
        })
        .eq("id", user.id);
    }

    setLoading(false);
    toast.success("Conta criada! Verifique seu e-mail para confirmar.");
    navigate(redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login");
  };

  const Field = ({
    label,
    icon: Icon,
    fieldKey,
    type = "text",
    placeholder,
  }: {
    label: string;
    icon: any;
    fieldKey: string;
    type?: string;
    placeholder: string;
  }) => (
    <div>
      <label className="block text-xs uppercase tracking-widest text-primary/70 mb-2 font-body">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
        <input
          type={type}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-charcoal border border-gold/20 rounded-xl text-cream text-sm placeholder:text-cream/25 focus:border-primary/50 focus:outline-none transition font-body"
          value={(form as any)[fieldKey]}
          onChange={set(fieldKey)}
        />
      </div>
    </div>
  );

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
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Dados pessoais */}
              <p className="text-[10px] uppercase tracking-widest text-primary/40 font-body">Dados Pessoais</p>

              <Field label="Nome Completo *" icon={User} fieldKey="name" placeholder="Seu nome completo" />

              <div className="grid grid-cols-2 gap-3">
                <Field label="CPF" icon={FileText} fieldKey="cpf" placeholder="000.000.000-00" />
                <Field label="Telefone" icon={Phone} fieldKey="phone" type="tel" placeholder="(51) 99999-9999" />
              </div>

              {/* Endereço */}
              <p className="text-[10px] uppercase tracking-widest text-primary/40 font-body pt-2">Endereço</p>

              <Field label="Endereço" icon={MapPin} fieldKey="address" placeholder="Rua, número" />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Cidade" icon={MapPin} fieldKey="city" placeholder="Butiá" />
                <Field label="Estado" icon={MapPin} fieldKey="state" placeholder="RS" />
              </div>

              {/* Acesso */}
              <p className="text-[10px] uppercase tracking-widest text-primary/40 font-body pt-2">Acesso</p>

              <Field label="E-mail *" icon={Mail} fieldKey="email" type="email" placeholder="seu@email.com" />
              <Field
                label="Senha *"
                icon={Lock}
                fieldKey="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-body font-semibold text-sm tracking-wide transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 mt-2"
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
