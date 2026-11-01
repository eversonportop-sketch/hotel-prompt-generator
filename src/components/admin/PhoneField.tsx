import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  COUNTRIES,
  DEFAULT_ISO,
  detectCountry,
  dialOf,
  formatInternational,
  formatNationalDisplay,
  isInternational,
  nationalDigits,
} from "@/lib/phone";

interface PhoneFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Máscara brasileira de cada tela — mantida como está para não alterar o comportamento atual. */
  maskBR: (v: string) => string;
}

// Mercosul/vizinhos no topo (público principal do hotel); o resto em ordem alfabética.
const PINNED = ["BR", "AR", "UY", "PY", "CL"];

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

let namesCache: { iso: string; dial: string; name: string; key: string }[] | null = null;
const getCountryList = () => {
  if (namesCache) return namesCache;
  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames(["pt-BR"], { type: "region" });
  } catch {
    dn = null;
  }
  namesCache = COUNTRIES.map((c) => {
    let name = c.iso;
    try {
      name = dn?.of(c.iso) || c.iso;
    } catch {
      /* mantém o ISO */
    }
    return { ...c, name, key: norm(`${name} ${c.iso} +${c.dial}`) };
  }).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return namesCache;
};

const Flag = ({ iso }: { iso: string }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className="w-5 text-center text-[9px] font-body text-white/40 shrink-0">{iso}</span>;
  }
  return (
    <img
      src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`}
      alt=""
      width={20}
      height={15}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-5 h-[15px] rounded-[2px] object-cover shrink-0"
    />
  );
};

const PhoneField = ({ label, value, onChange, maskBR }: PhoneFieldProps) => {
  const [iso, setIso] = useState<string>(() =>
    isInternational(value) ? detectCountry(value)?.iso ?? DEFAULT_ISO : DEFAULT_ISO,
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Valor trocado de fora (ex.: abrir a edição de outro cliente): acompanha o país do número.
  // Só troca se o DDI mudar, para não "pular" de Canadá para EUA (ambos +1) enquanto digita.
  useEffect(() => {
    if (!value) return;
    const target = isInternational(value) ? detectCountry(value)?.iso : DEFAULT_ISO;
    if (target && dialOf(target) !== dialOf(iso)) setIso(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const isBR = iso === DEFAULT_ISO;
  const shown = isBR ? value : formatNationalDisplay(iso, nationalDigits(value, iso));

  const emit = (nextIso: string, raw: string) => {
    if (nextIso === DEFAULT_ISO) onChange(maskBR(raw));
    else onChange(formatInternational(nextIso, raw));
  };

  const handleInput = (raw: string) => {
    // Colou um número completo com "+" (ex.: copiado do WhatsApp): detecta o país sozinho.
    if (raw.trim().startsWith("+")) {
      const det = detectCountry(raw);
      if (det) {
        setIso(det.iso);
        emit(det.iso, det.national);
        return;
      }
    }
    emit(iso, raw);
  };

  const selectCountry = (nextIso: string) => {
    const digits = nationalDigits(value, iso);
    setIso(nextIso);
    if (digits) emit(nextIso, digits);
    else onChange("");
    setOpen(false);
    setQuery("");
  };

  const list = useMemo(() => {
    const all = getCountryList();
    const q = norm(query.trim());
    if (q) return all.filter((c) => c.key.includes(q));
    const pinned = PINNED.map((p) => all.find((c) => c.iso === p)!).filter(Boolean);
    return [...pinned, ...all.filter((c) => !PINNED.includes(c.iso))];
  }, [query]);

  const showSeparator = !query.trim();

  return (
    <div>
      <label className="text-[10px] text-white/30 font-body uppercase tracking-widest block mb-1.5">{label}</label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Selecionar país do telefone"
              className="flex items-center gap-1.5 shrink-0 bg-white/[0.03] border border-white/8 rounded-lg px-2.5 py-2.5 text-cream text-sm font-body hover:border-primary/40 focus:outline-none focus:border-primary/40 transition"
            >
              <Flag key={iso} iso={iso} />
              <span className="text-white/50 text-xs">+{dialOf(iso)}</span>
              <ChevronDown className="w-3 h-3 text-white/30" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-0 bg-[#14141a] border-white/10 text-cream">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8">
              <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Procurar país ou código"
                className="w-full bg-transparent text-cream text-sm font-body focus:outline-none placeholder:text-white/20"
              />
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {list.length === 0 && (
                <p className="px-3 py-3 text-xs text-white/30 font-body">Nenhum país encontrado.</p>
              )}
              {list.map((c, i) => (
                <React.Fragment key={c.iso}>
                  <button
                    type="button"
                    onClick={() => selectCountry(c.iso)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-sm font-body hover:bg-white/[0.06] transition ${
                      c.iso === iso ? "bg-white/[0.04]" : ""
                    }`}
                  >
                    <Flag iso={c.iso} />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-white/30 text-xs">+{c.dial}</span>
                  </button>
                  {showSeparator && i === PINNED.length - 1 && <div className="my-1 border-t border-white/8" />}
                </React.Fragment>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder={isBR ? "(51) 99999-0000" : "Número"}
          value={shown}
          onChange={(e) => handleInput(e.target.value)}
          className="min-w-0 flex-1 w-full bg-white/[0.03] border border-white/8 rounded-lg px-3.5 py-2.5 text-cream text-sm font-body focus:outline-none focus:border-primary/40 transition placeholder:text-white/15"
        />
      </div>
    </div>
  );
};

export default PhoneField;
