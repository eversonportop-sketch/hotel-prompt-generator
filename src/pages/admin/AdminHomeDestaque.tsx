import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Table not yet in generated types — use explicit typing
const fromHomeSections = () => supabase.from("home_sections" as any);
import { toast } from "sonner";
import { Save, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Loader2 } from "lucide-react";

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

const emptySection: Omit<HomeSection, "id"> = {
  section_key: "",
  title: "",
  subtitle: "",
  description: "",
  image_url: "",
  cta_text: "",
  cta_link: "",
  image_side: "left",
  active: true,
  display_order: 0,
};

const AdminHomeDestaque = () => {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<HomeSection, "id">>(emptySection);
  const [isNew, setIsNew] = useState(false);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("home_sections")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar seções: " + error.message);
    } else {
      setSections((data as HomeSection[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const openEdit = (section: HomeSection) => {
    setEditingId(section.id);
    setForm({
      section_key: section.section_key,
      title: section.title,
      subtitle: section.subtitle || "",
      description: section.description,
      image_url: section.image_url || "",
      cta_text: section.cta_text || "",
      cta_link: section.cta_link || "",
      image_side: section.image_side,
      active: section.active,
      display_order: section.display_order,
    });
    setIsNew(false);
  };

  const openNew = () => {
    setEditingId("new");
    setForm({ ...emptySection, display_order: sections.length + 1 });
    setIsNew(true);
  };

  const handleSave = async () => {
    if (!form.section_key.trim() || !form.title.trim() || !form.description.trim()) {
      toast.error("Preencha section_key, título e descrição.");
      return;
    }

    setSaving(editingId);

    const payload = {
      section_key: form.section_key.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle?.trim() || null,
      description: form.description.trim(),
      image_url: form.image_url?.trim() || null,
      cta_text: form.cta_text?.trim() || null,
      cta_link: form.cta_link?.trim() || null,
      image_side: form.image_side,
      active: form.active,
      display_order: form.display_order,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (isNew) {
      ({ error } = await supabase.from("home_sections").insert([payload]));
    } else {
      ({ error } = await supabase.from("home_sections").update(payload).eq("id", editingId));
    }

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success(isNew ? "Seção criada!" : "Seção atualizada!");
      setEditingId(null);
      fetchSections();
    }
    setSaving(null);
  };

  const toggleActive = async (section: HomeSection) => {
    const { error } = await supabase
      .from("home_sections")
      .update({ active: !section.active, updated_at: new Date().toISOString() })
      .eq("id", section.id);

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      fetchSections();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta seção?")) return;
    const { error } = await supabase.from("home_sections").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      toast.success("Seção excluída.");
      if (editingId === id) setEditingId(null);
      fetchSections();
    }
  };

  const inputClass =
    "w-full rounded-lg border border-primary/20 bg-charcoal text-cream px-3 py-2 text-sm font-body placeholder:text-white/30 focus:outline-none focus:border-primary/50 transition-colors";
  const labelClass = "block text-xs text-white/40 font-body uppercase tracking-wider mb-1";

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-cream">Destaques da Home</h1>
          <p className="text-sm text-white/40 font-body mt-1">Gerencie as seções visuais da página inicial</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 text-primary text-sm font-body hover:bg-primary/10 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Seção
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-20 text-white/30 font-body">
          Nenhuma seção cadastrada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl border transition-colors ${
                editingId === s.id
                  ? "border-primary/40 bg-charcoal-light"
                  : "border-white/5 bg-charcoal-light/50 hover:border-white/10"
              }`}
            >
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-semibold text-cream truncate">{s.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 font-body">
                      {s.section_key}
                    </span>
                    {!s.active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-body">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/30 font-body mt-0.5 truncate">{s.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(s)}
                    className="p-2 rounded-lg text-white/30 hover:text-primary hover:bg-white/5 transition-colors"
                    title={s.active ? "Desativar" : "Ativar"}
                  >
                    {s.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => (editingId === s.id ? setEditingId(null) : openEdit(s))}
                    className="px-3 py-1.5 rounded-lg text-xs font-body border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                  >
                    {editingId === s.id ? "Fechar" : "Editar"}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingId === s.id && (
                <div className="border-t border-white/5 p-4">
                  <SectionForm
                    form={form}
                    setForm={setForm}
                    onSave={handleSave}
                    saving={saving === s.id}
                    inputClass={inputClass}
                    labelClass={labelClass}
                    isNew={false}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editingId === "new" && (
        <div className="rounded-xl border border-primary/30 bg-charcoal-light p-4 space-y-4">
          <h2 className="text-sm font-display font-semibold text-cream">Nova Seção</h2>
          <SectionForm
            form={form}
            setForm={setForm}
            onSave={handleSave}
            saving={saving === "new"}
            inputClass={inputClass}
            labelClass={labelClass}
            isNew={true}
          />
          <button
            onClick={() => setEditingId(null)}
            className="text-xs text-white/30 hover:text-white/50 font-body transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

const SectionForm = ({
  form,
  setForm,
  onSave,
  saving,
  inputClass,
  labelClass,
  isNew,
}: {
  form: Omit<HomeSection, "id">;
  setForm: (f: Omit<HomeSection, "id">) => void;
  onSave: () => void;
  saving: boolean;
  inputClass: string;
  labelClass: string;
  isNew: boolean;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {isNew && (
      <div>
        <label className={labelClass}>Section Key</label>
        <input
          className={inputClass}
          placeholder="ex: destaque_quarto"
          value={form.section_key}
          onChange={(e) => setForm({ ...form, section_key: e.target.value })}
        />
      </div>
    )}
    <div>
      <label className={labelClass}>Título</label>
      <input
        className={inputClass}
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
    </div>
    <div>
      <label className={labelClass}>Subtítulo</label>
      <input
        className={inputClass}
        value={form.subtitle || ""}
        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
      />
    </div>
    <div className="md:col-span-2">
      <label className={labelClass}>Descrição</label>
      <textarea
        className={inputClass + " min-h-[80px] resize-y"}
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
    </div>
    <div>
      <label className={labelClass}>URL da Imagem</label>
      <input
        className={inputClass}
        placeholder="https://..."
        value={form.image_url || ""}
        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
      />
    </div>
    <div>
      <label className={labelClass}>Lado da Imagem</label>
      <select
        className={inputClass}
        value={form.image_side}
        onChange={(e) => setForm({ ...form, image_side: e.target.value })}
      >
        <option value="left">Esquerda</option>
        <option value="right">Direita</option>
      </select>
    </div>
    <div>
      <label className={labelClass}>Texto do Botão</label>
      <input
        className={inputClass}
        value={form.cta_text || ""}
        onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
      />
    </div>
    <div>
      <label className={labelClass}>Link do Botão</label>
      <input
        className={inputClass}
        placeholder="/quartos"
        value={form.cta_link || ""}
        onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
      />
    </div>
    <div>
      <label className={labelClass}>Ordem de Exibição</label>
      <input
        className={inputClass}
        type="number"
        value={form.display_order}
        onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
      />
    </div>
    <div className="flex items-end">
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-body font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar
      </button>
    </div>
  </div>
);

export default AdminHomeDestaque;
