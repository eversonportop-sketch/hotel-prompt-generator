// ─── AdminPiscina ──────────────────────────────────────────────────────────────
// Módulo completo: gestão da piscina
// Tabelas Supabase: pool_config (regras/horários), pool_incidents (ocorrências)
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Waves, Save, Loader2, Plus, Trash2, X, Pencil,
  Clock, AlertTriangle, CheckCircle2, Ban, Wrench, Users,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import hotelLogo from "@/assets/hotel-sb-logo.png";

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface PoolConfig {
  id: string;
  open_time: string;
  close_time: string;
  status: string;          // open | closed | maintenance
  max_capacity: number;
  rules: string[];
  updated_at: string;
}

interface PoolIncident {
  id: string;
  incident_date: string;
  incident_time: string;
  type: string;            // safety | maintenance | complaint | other
  description: string;
  resolved: boolean;
  created_at: string;
}

const POOL_STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open:        { label: "Aberta",        color: "text-green-400",  icon: CheckCircle2 },
  closed:      { label: "Fechada",       color: "text-red-400",    icon: Ban },
  maintenance: { label: "Manutenção",    color: "text-yellow-400", icon: Wrench },
};

const INCIDENT_TYPES: Record<string, string> = {
  safety:      "Segurança",
  maintenance: "Manutenção",
  complaint:   "Reclamação",
  other:       "Outro",
};

const DEFAULT_RULES = [
  "Horário: 7h às 22h",
  "Uso obrigatório de trajes de banho",
  "Menores de 12 anos acompanhados de responsável",
  "Não é permitido alimentos de vidro na área da piscina",
  "Proibido mergulho em área rasa",
];

const EMPTY_INCIDENT = {
  incident_date: new Date().toISOString().split("T")[0],
  incident_time: format(new Date(), "HH:mm"),
  type: "maintenance",
  description: "",
  resolved: false,
};

const AdminPiscina = () => {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"config" | "incidents">("config");

  // ── Config state ──────────────────────────────────────────────────────────────
  const [configForm, setConfigForm] = useState<{
    open_time: string; close_time: string; status: string; max_capacity: number; rules: string[];
  } | null>(null);
  const [newRule, setNewRule] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  // ── Incident state ────────────────────────────────────────────────────────────
  const [incidentModal, setIncidentModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<PoolIncident | null>(null);
  const [incidentForm, setIncidentForm] = useState<typeof EMPTY_INCIDENT>(EMPTY_INCIDENT);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────────
  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ["pool-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pool_config").select("*").limit(1).single();
      if (error && error.code !== "PGRST116") throw error;
      return data as PoolConfig | null;
    },
    onSuccess: (data) => {
      if (data && !configForm) {
        setConfigForm({
          open_time: data.open_time,
          close_time: data.close_time,
          status: data.status,
          max_capacity: data.max_capacity,
          rules: data.rules ?? DEFAULT_RULES,
        });
      } else if (!data && !configForm) {
        setConfigForm({ open_time: "07:00", close_time: "22:00", status: "open", max_capacity: 30, rules: DEFAULT_RULES });
      }
    },
  } as any);

  const { data: incidents = [], isLoading: loadingIncidents } = useQuery({
    queryKey: ["pool-incidents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pool_incidents").select("*").order("incident_date", { ascending: false });
      if (error) throw error;
      return data as PoolIncident[];
    },
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const saveConfig = async () => {
    if (!configForm) return;
    setSavingConfig(true);
    try {
      if (config?.id) {
        const { error } = await supabase.from("pool_config").update({ ...configForm, updated_at: new Date().toISOString() }).eq("id", config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pool_config").insert(configForm);
        if (error) throw error;
      }
      toast.success("Configurações salvas!");
      qc.invalidateQueries({ queryKey: ["pool-config"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar.");
    } finally {
      setSavingConfig(false);
    }
  };

  const saveIncidentMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        incident_date: incidentForm.incident_date,
        incident_time: incidentForm.incident_time,
        type: incidentForm.type,
        description: incidentForm.description,
        resolved: incidentForm.resolved,
      };
      if (editingIncident) {
        const { error } = await supabase.from("pool_incidents").update(payload).eq("id", editingIncident.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pool_incidents").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingIncident ? "Ocorrência atualizada!" : "Ocorrência registrada!");
      qc.invalidateQueries({ queryKey: ["pool-incidents"] });
      setIncidentModal(false);
      setEditingIncident(null);
      setIncidentForm(EMPTY_INCIDENT);
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar."),
  });

  const resolveToggleMutation = useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      const { error } = await supabase.from("pool_incidents").update({ resolved: !resolved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pool-incidents"] }),
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pool_incidents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ocorrência excluída.");
      qc.invalidateQueries({ queryKey: ["pool-incidents"] });
      setDeleteConfirm(null);
    },
  });

  const openEditIncident = (inc: PoolIncident) => {
    setEditingIncident(inc);
    setIncidentForm({
      incident_date: inc.incident_date,
      incident_time: inc.incident_time,
      type: inc.type,
      description: inc.description,
      resolved: inc.resolved,
    });
    setIncidentModal(true);
  };

  const activeStatus = configForm?.status ?? config?.status ?? "open";
  const StatusIcon = POOL_STATUS[activeStatus]?.icon ?? CheckCircle2;

  const pendingIncidents = incidents.filter(i => !i.resolved).length;

  return (
    <div className="min-h-screen bg-charcoal">
      <header className="bg-charcoal-light border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={hotelLogo} alt="SB Hotel" className="h-10 w-auto object-contain" />
          <span className="text-cream/40 text-xs font-body">Admin</span>
        </div>
        <Link to="/" className="text-cream/50 text-sm font-body hover:text-primary transition-colors">Ver Site →</Link>
      </header>

      <div className="p-6 md:p-10">
        {/* Topo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="inline-flex items-center gap-2 text-cream/50 hover:text-primary text-sm font-body transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span className="text-cream/20">/</span>
            <div className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-primary" />
              <h1 className="font-display text-2xl font-bold text-cream">Piscina</h1>
            </div>
          </div>
          {/* Status atual em destaque */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-body ${
            activeStatus === "open" ? "bg-green-500/10 border-green-500/30 text-green-400" :
            activeStatus === "maintenance" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" :
            "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            <StatusIcon className="w-4 h-4" />
            {POOL_STATUS[activeStatus]?.label}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Capacidade máx.", value: configForm?.max_capacity ?? config?.max_capacity ?? "—", color: "text-cream" },
            { label: "Horário abertura", value: configForm?.open_time ?? "—", color: "text-primary" },
            { label: "Horário fechamento", value: configForm?.close_time ?? "—", color: "text-primary" },
            { label: "Ocorrências abertas", value: pendingIncidents, color: pendingIncidents > 0 ? "text-yellow-400" : "text-green-400" },
          ].map(s => (
            <div key={s.label} className="bg-charcoal-light border border-gold/10 rounded-xl p-4">
              <p className="text-cream/40 text-xs font-body uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gold/10">
          {(["config", "incidents"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 px-1 text-sm font-body transition-colors border-b-2 -mb-px ${
                tab === t ? "border-primary text-primary" : "border-transparent text-cream/40 hover:text-cream/60"
              }`}>
              {t === "config" ? "Configurações" : `Ocorrências${pendingIncidents > 0 ? ` (${pendingIncidents})` : ""}`}
            </button>
          ))}
        </div>

        {/* ── Tab: Configurações ───────────────────────────────────────────────── */}
        {tab === "config" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {loadingConfig ? (
              <div className="text-center py-20 text-cream/30 font-body">Carregando configurações...</div>
            ) : configForm && (
              <div className="max-w-2xl space-y-6">
                <div className="bg-charcoal-light border border-gold/10 rounded-xl p-6 space-y-5">
                  <h2 className="font-display text-lg font-semibold text-cream">Horários e status</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Abertura</label>
                      <input type="time" className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                        value={configForm.open_time} onChange={e => setConfigForm({ ...configForm, open_time: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Fechamento</label>
                      <input type="time" className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                        value={configForm.close_time} onChange={e => setConfigForm({ ...configForm, close_time: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Capacidade (pessoas)</label>
                      <input type="number" min={1} className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                        value={configForm.max_capacity} onChange={e => setConfigForm({ ...configForm, max_capacity: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-2">Status atual</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(POOL_STATUS).map(([key, val]) => {
                        const Icon = val.icon;
                        return (
                          <button key={key} type="button" onClick={() => setConfigForm({ ...configForm, status: key })}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-body transition-all ${
                              configForm.status === key
                                ? "border-primary/50 bg-primary/10 text-cream"
                                : "border-gold/15 text-cream/40 hover:border-gold/30"
                            }`}>
                            <Icon className={`w-4 h-4 ${val.color}`} />
                            {val.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Regras */}
                <div className="bg-charcoal-light border border-gold/10 rounded-xl p-6 space-y-4">
                  <h2 className="font-display text-lg font-semibold text-cream">Regras de uso</h2>
                  <div className="space-y-2">
                    {configForm.rules.map((rule, i) => (
                      <div key={i} className="flex items-center gap-2 group">
                        <input className="flex-1 bg-black/50 border border-gold/10 rounded-lg px-3 py-2 text-cream text-sm focus:border-primary/40 focus:outline-none transition"
                          value={rule}
                          onChange={e => {
                            const r = [...configForm.rules];
                            r[i] = e.target.value;
                            setConfigForm({ ...configForm, rules: r });
                          }} />
                        <button type="button" onClick={() => setConfigForm({ ...configForm, rules: configForm.rules.filter((_, j) => j !== i) })}
                          className="text-cream/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input className="flex-1 bg-black/50 border border-gold/20 rounded-lg px-3 py-2 text-cream text-sm focus:border-primary/40 focus:outline-none transition"
                      value={newRule} onChange={e => setNewRule(e.target.value)}
                      placeholder="Nova regra..."
                      onKeyDown={e => {
                        if (e.key === "Enter" && newRule.trim()) {
                          e.preventDefault();
                          setConfigForm({ ...configForm, rules: [...configForm.rules, newRule.trim()] });
                          setNewRule("");
                        }
                      }} />
                    <button type="button" onClick={() => {
                      if (newRule.trim()) {
                        setConfigForm({ ...configForm, rules: [...configForm.rules, newRule.trim()] });
                        setNewRule("");
                      }
                    }} className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-sm transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button onClick={saveConfig} disabled={savingConfig}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm px-8 py-3 rounded-lg hover:scale-[1.02] transition-all disabled:opacity-50">
                  {savingConfig ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" /> Salvar configurações</>}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Tab: Ocorrências ─────────────────────────────────────────────────── */}
        {tab === "incidents" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-end mb-4">
              <button onClick={() => { setEditingIncident(null); setIncidentForm(EMPTY_INCIDENT); setIncidentModal(true); }}
                className="flex items-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:scale-[1.02] transition-all">
                <Plus className="w-4 h-4" /> Registrar Ocorrência
              </button>
            </div>

            {loadingIncidents ? (
              <div className="text-center py-20 text-cream/30 font-body">Carregando...</div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-20">
                <CheckCircle2 className="w-12 h-12 text-green-400/30 mx-auto mb-4" />
                <p className="text-cream/30 font-body">Nenhuma ocorrência registrada. Tudo certo!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((inc, i) => (
                  <motion.div key={inc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className={`bg-charcoal-light border rounded-xl p-4 flex items-start gap-4 transition-colors ${
                      inc.resolved ? "border-gold/10 opacity-60" : "border-yellow-500/20"
                    }`}>
                    <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${inc.resolved ? "bg-green-400" : "bg-yellow-400"}`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-primary font-body tracking-wider uppercase">{INCIDENT_TYPES[inc.type] ?? inc.type}</span>
                        <span className="text-cream/30 text-xs font-body">
                          {format(new Date(inc.incident_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })} às {inc.incident_time}
                        </span>
                        {inc.resolved && <span className="text-xs text-green-400 font-body">Resolvido</span>}
                      </div>
                      <p className="text-cream/80 text-sm font-body">{inc.description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => resolveToggleMutation.mutate({ id: inc.id, resolved: inc.resolved })}
                        className={`p-1.5 rounded-lg border text-xs transition-all ${
                          inc.resolved
                            ? "border-gold/15 text-cream/30 hover:border-yellow-400/40 hover:text-yellow-400"
                            : "border-green-500/30 text-green-400 hover:bg-green-500/10"
                        }`}
                        title={inc.resolved ? "Reabrir" : "Marcar como resolvido"}>
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditIncident(inc)} className="p-1.5 text-cream/30 hover:text-primary border border-gold/15 hover:border-primary/40 rounded-lg transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(inc.id)} className="p-1.5 text-cream/30 hover:text-red-400 border border-gold/15 hover:border-red-400/40 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Modal ocorrência ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {incidentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={e => e.target === e.currentTarget && setIncidentModal(false)}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-charcoal border border-gold/20 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gold/10">
                <h2 className="font-display text-xl font-bold text-cream">{editingIncident ? "Editar Ocorrência" : "Nova Ocorrência"}</h2>
                <button onClick={() => setIncidentModal(false)} className="text-cream/40 hover:text-cream"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={e => { e.preventDefault(); saveIncidentMutation.mutate(); }} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Data *</label>
                    <input type="date" className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={incidentForm.incident_date} onChange={e => setIncidentForm({ ...incidentForm, incident_date: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Hora</label>
                    <input type="time" className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                      value={incidentForm.incident_time} onChange={e => setIncidentForm({ ...incidentForm, incident_time: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Tipo</label>
                  <select className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition"
                    value={incidentForm.type} onChange={e => setIncidentForm({ ...incidentForm, type: e.target.value })}>
                    {Object.entries(INCIDENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-primary/70 mb-1.5">Descrição *</label>
                  <textarea rows={3} className="w-full bg-black/50 border border-gold/20 rounded-lg px-4 py-3 text-cream text-sm focus:border-primary focus:outline-none transition resize-none"
                    value={incidentForm.description} onChange={e => setIncidentForm({ ...incidentForm, description: e.target.value })} required placeholder="Descreva o ocorrido..." />
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setIncidentForm({ ...incidentForm, resolved: !incidentForm.resolved })}
                    className={`w-5 h-5 rounded border-2 transition-all ${incidentForm.resolved ? "bg-green-500 border-green-500" : "border-gold/30"}`}>
                    {incidentForm.resolved && <CheckCircle2 className="w-3 h-3 text-white m-auto" />}
                  </button>
                  <span className="text-cream/60 text-sm font-body">Marcar como resolvido</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIncidentModal(false)} className="flex-1 border border-gold/20 text-cream/60 hover:text-cream rounded-lg py-3 text-sm font-body transition-all">Cancelar</button>
                  <button type="submit" disabled={saveIncidentMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9A84C] to-[#E5C97A] text-black font-semibold text-sm rounded-lg py-3 hover:scale-[1.01] transition-all disabled:opacity-50">
                    {saveIncidentMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4" />Salvar</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmar exclusão ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-charcoal border border-red-900/40 rounded-2xl p-8 max-w-sm w-full text-center">
              <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-cream mb-2">Excluir ocorrência?</h3>
              <p className="text-cream/50 text-sm font-body mb-6">Esta ação não pode ser desfeita.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gold/20 text-cream/60 rounded-lg py-2.5 text-sm transition hover:text-cream">Cancelar</button>
                <button onClick={() => deleteIncidentMutation.mutate(deleteConfirm)} disabled={deleteIncidentMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50">
                  {deleteIncidentMutation.isPending ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPiscina;
