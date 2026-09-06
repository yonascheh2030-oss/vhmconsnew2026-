import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Check, Upload, X, FileText, Loader2, Send, Info,
} from "lucide-react";
import { useLang, homePath, confirmPath } from "@/i18n/LangContext";
import { LangSwitch } from "@/components/site/LangSwitch";
import { api } from "@/lib/api";
import { WIZARD } from "@/constants/betodecor";

const TOTAL = 7;

const inputCls =
  "w-full rounded-lg border border-beto-borderstrong bg-white px-4 py-3 font-body text-beto-ink placeholder:text-beto-muted/60 focus:outline-none focus:ring-2 focus:ring-beto-primary/40 focus:border-beto-primary transition";

const labelCls = "block font-body text-sm font-medium text-beto-ink mb-2";

const Choice = ({ active, onClick, children, testid, className = "" }) => (
  <button
    type="button"
    data-testid={testid}
    onClick={onClick}
    className={`relative text-left rounded-xl border px-5 py-4 font-body transition-all duration-200 ${
      active
        ? "border-beto-primary bg-beto-primary/5 ring-1 ring-beto-primary"
        : "border-beto-border bg-white hover:border-beto-borderstrong"
    } ${className}`}
  >
    {children}
    {active && (
      <span className="absolute top-3 right-3 inline-flex w-5 h-5 items-center justify-center rounded-full bg-beto-primary text-white">
        <Check className="w-3 h-3" strokeWidth={3} />
      </span>
    )}
  </button>
);

const empty = {
  project_types: [], oppervlakte: "", verdiepingen: "", kamers: "", bouwjaar: "",
  bewoond: "", renovatie_type: "", works: [], beschrijving: "", budget: "",
  starttermijn: "", heeft_deadline: false, deadline: "", plaatsbezoek_datum: "", straat: "", huisnummer: "",
  postcode: "", gemeente: "", land: "België", files: [], voornaam: "", achternaam: "",
  telefoon: "", email: "", bedrijfsnaam: "", btw: "", opmerkingen: "",
};

export default function Wizard() {
  const { t, lang } = useLang();
  const w = t.wizard;
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInput = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (k, val) =>
    setForm((f) => {
      const arr = f[k];
      return { ...f, [k]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });

  const go = (delta) => {
    if (delta > 0 && step === 0 && form.project_types.length === 0) {
      toast.error(w.errType);
      return;
    }
    setDir(delta);
    setStep((s) => Math.min(TOTAL - 1, Math.max(0, s + delta)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onFiles = async (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const room = WIZARD.maxFiles - form.files.length;
    if (room <= 0) {
      toast.error(`Max. ${WIZARD.maxFiles}`);
      return;
    }
    setUploading(true);
    for (const file of picked.slice(0, room)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        setForm((f) => ({
          ...f,
          files: [...f.files, { ...data, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null }],
        }));
      } catch (err) {
        toast.error(err?.response?.data?.detail || w.errFail);
      }
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const removeFile = (id) => setForm((f) => ({ ...f, files: f.files.filter((x) => x.id !== id) }));

  const num = (v) => (v === "" || v == null ? null : Number(v));

  const submit = async () => {
    if (!form.voornaam.trim() || !form.achternaam.trim() || !form.telefoon.trim() || !form.email.trim()) {
      toast.error(w.errContact);
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      toast.error(w.errEmail);
      return;
    }
    setSending(true);
    const payload = {
      project_types: form.project_types,
      oppervlakte: num(form.oppervlakte),
      verdiepingen: num(form.verdiepingen),
      kamers: num(form.kamers),
      bouwjaar: num(form.bouwjaar),
      bewoond: form.bewoond || null,
      renovatie_type: form.renovatie_type || null,
      works: form.works,
      beschrijving: form.beschrijving || null,
      budget: form.budget || "unknown",
      starttermijn: form.starttermijn || "unknown",
      heeft_deadline: form.heeft_deadline,
      deadline: form.deadline || null,
      plaatsbezoek_datum: form.plaatsbezoek_datum || null,
      straat: form.straat || null,
      huisnummer: form.huisnummer || null,
      postcode: form.postcode || null,
      gemeente: form.gemeente || null,
      land: form.land || "België",
      files: form.files.map(({ id, storage_path, original_filename, content_type, size }) => ({
        id, storage_path, original_filename, content_type, size,
      })),
      voornaam: form.voornaam,
      achternaam: form.achternaam,
      telefoon: form.telefoon,
      email: form.email,
      bedrijfsnaam: form.bedrijfsnaam || null,
      btw: form.btw || null,
      opmerkingen: form.opmerkingen || null,
      lang,
    };
    try {
      await api.post("/leads", payload);
      navigate(confirmPath(lang));
    } catch (err) {
      toast.error(err?.response?.data?.detail || w.errFail);
      setSending(false);
    }
  };

  const stepMeta = w.steps[step];

  return (
    <div className="min-h-screen bg-beto-paper flex flex-col">
      <Helmet>
        <html lang={lang} />
        <title>{`${w.heading} — VHM Renovation`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <header className="h-[72px] border-b border-beto-border bg-beto-paper/85 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-5 lg:px-8">
        <Link to={homePath(lang)} className="font-heading font-extrabold text-2xl tracking-tight text-beto-ink">
          VHM <span className="text-beto-primary">Renovation</span>
        </Link>
        <LangSwitch />
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-10 lg:py-14">
        {/* Progress */}
        <div className="mb-8" data-testid="wizard-progress">
          <div className="flex items-center justify-between mb-3">
            <p className="font-body text-sm font-semibold text-beto-primary">
              {w.common?.stepOf || t.common.stepOf.replace("{n}", step + 1).replace("{total}", TOTAL)}
            </p>
            <p className="font-body text-sm text-beto-muted">{stepMeta.t}</p>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i <= step ? "bg-beto-primary" : "bg-beto-border"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-beto-border bg-beto-surface shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8 lg:p-10 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir > 0 ? 40 : -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir > 0 ? -40 : 40 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-heading font-extrabold tracking-tight text-beto-ink text-2xl sm:text-3xl leading-tight">
                {stepQuestion(w, step)}
              </h1>
              <p className="mt-2 font-body text-sm text-beto-muted">{stepMeta.s}</p>

              <div className="mt-7">{renderStep({ step, form, set, toggle, setForm, w, onFiles, removeFile, uploading, fileInput })}</div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav buttons */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={step === 0}
            data-testid="wizard-back"
            className="inline-flex items-center gap-2 rounded-full border border-beto-borderstrong px-6 py-3 font-body font-semibold text-beto-ink hover:border-beto-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.common.back}
          </button>

          {step < TOTAL - 1 ? (
            <button
              type="button"
              onClick={() => go(1)}
              data-testid="wizard-next"
              className="inline-flex items-center gap-2 rounded-full bg-beto-primary text-white px-7 py-3 font-body font-semibold hover:bg-beto-primaryhover transition-colors"
            >
              {t.common.next}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={sending}
              data-testid="wizard-submit"
              className="inline-flex items-center gap-2 rounded-full bg-beto-primary text-white px-7 py-3 font-body font-semibold hover:bg-beto-primaryhover transition-colors disabled:opacity-60"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? t.common.sending : t.common.submit}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function stepQuestion(w, step) {
  return [w.q.type, w.q.size, w.q.works, w.q.budget, w.q.planning, w.q.location, w.q.contact][step];
}

function renderStep(ctx) {
  const { step } = ctx;
  switch (step) {
    case 0: return <StepType {...ctx} />;
    case 1: return <StepSize {...ctx} />;
    case 2: return <StepWorks {...ctx} />;
    case 3: return <StepBudget {...ctx} />;
    case 4: return <StepPlanning {...ctx} />;
    case 5: return <StepLocation {...ctx} />;
    case 6: return <StepContact {...ctx} />;
    default: return null;
  }
}

const StepType = ({ form, toggle, w }) => (
  <>
    <p className="mb-4 font-body text-sm text-beto-muted flex items-center gap-2">
      <Info className="w-4 h-4 text-beto-primary" /> {w.projectHint}
    </p>
    <div className="grid sm:grid-cols-2 gap-3">
      {WIZARD.projectTypes.map((key) => (
        <Choice key={key} testid={`type-${key}`} active={form.project_types.includes(key)} onClick={() => toggle("project_types", key)}>
          <span className="font-medium text-beto-ink pr-6">{w.projectTypes[key]}</span>
        </Choice>
      ))}
    </div>
  </>
);

const StepSize = ({ form, set, setForm, w }) => (
  <div className="space-y-6">
    <div className="grid sm:grid-cols-2 gap-5">
      <div><label className={labelCls}>{w.size.oppervlakte}</label><input data-testid="size-oppervlakte" type="number" min="0" value={form.oppervlakte} onChange={set("oppervlakte")} className={inputCls} placeholder="120" /></div>
      <div><label className={labelCls}>{w.size.verdiepingen}</label><input data-testid="size-verdiepingen" type="number" min="0" value={form.verdiepingen} onChange={set("verdiepingen")} className={inputCls} placeholder="2" /></div>
      <div><label className={labelCls}>{w.size.kamers}</label><input data-testid="size-kamers" type="number" min="0" value={form.kamers} onChange={set("kamers")} className={inputCls} placeholder="6" /></div>
      <div><label className={labelCls}>{w.size.bouwjaar}</label><input data-testid="size-bouwjaar" type="number" min="1800" value={form.bouwjaar} onChange={set("bouwjaar")} className={inputCls} placeholder="1975" /></div>
    </div>
    <div>
      <label className={labelCls}>{w.size.bewoond}</label>
      <div className="grid grid-cols-3 gap-3">
        {WIZARD.bewoond.map((key) => (
          <Choice key={key} testid={`bewoond-${key}`} active={form.bewoond === key} onClick={() => setForm((f) => ({ ...f, bewoond: key }))} className="text-center">
            <span className="font-medium text-beto-ink">{w.bewoond[key]}</span>
          </Choice>
        ))}
      </div>
    </div>
    <div>
      <label className={labelCls}>{w.size.renoType}</label>
      <div className="grid sm:grid-cols-3 gap-3">
        {WIZARD.renovatieType.map((key) => (
          <Choice key={key} testid={`renotype-${key}`} active={form.renovatie_type === key} onClick={() => setForm((f) => ({ ...f, renovatie_type: key }))}>
            <span className="font-medium text-beto-ink pr-6">{w.renoType[key]}</span>
          </Choice>
        ))}
      </div>
    </div>
  </div>
);

const StepWorks = ({ form, set, toggle, w }) => (
  <div className="space-y-7">
    {Object.entries(WIZARD.works).map(([cat, keys]) => (
      <div key={cat}>
        <p className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-beto-primary mb-3">{w.worksCats[cat]}</p>
        <div className="flex flex-wrap gap-2">
          {keys.map((key) => {
            const active = form.works.includes(key);
            return (
              <button
                key={key}
                type="button"
                data-testid={`work-${key}`}
                onClick={() => toggle("works", key)}
                className={`rounded-full border px-4 py-2 font-body text-sm transition-all ${
                  active ? "border-beto-primary bg-beto-primary text-white" : "border-beto-borderstrong bg-white text-beto-ink hover:border-beto-primary"
                }`}
              >
                {w.works[key]}
              </button>
            );
          })}
        </div>
      </div>
    ))}
    <div>
      <label className={labelCls}>{w.worksDesc}</label>
      <textarea data-testid="works-beschrijving" rows={4} value={form.beschrijving} onChange={set("beschrijving")} className={`${inputCls} resize-none`} placeholder={w.worksDescPh} />
    </div>
  </div>
);

const StepBudget = ({ form, setForm, w }) => (
  <>
    <div className="grid sm:grid-cols-2 gap-3">
      {WIZARD.budget.map((key) => (
        <Choice key={key} testid={`budget-${key}`} active={form.budget === key} onClick={() => setForm((f) => ({ ...f, budget: key }))}>
          <span className="font-medium text-beto-ink pr-6">{w.budget[key]}</span>
        </Choice>
      ))}
    </div>
    <p className="mt-5 rounded-lg bg-beto-dash px-4 py-3 font-body text-sm text-beto-muted flex items-start gap-2">
      <Info className="w-4 h-4 text-beto-primary mt-0.5 shrink-0" /> {w.budgetNote}
    </p>
  </>
);

const StepPlanning = ({ form, set, setForm, w }) => (
  <div className="space-y-7">
    <div className="grid sm:grid-cols-2 gap-3">
      {WIZARD.starttermijn.map((key) => (
        <Choice key={key} testid={`start-${key}`} active={form.starttermijn === key} onClick={() => setForm((f) => ({ ...f, starttermijn: key }))}>
          <span className="font-medium text-beto-ink pr-6">{w.starttermijn[key]}</span>
        </Choice>
      ))}
    </div>
    <div>
      <label className={labelCls}>{w.deadlineQ}</label>
      <div className="flex gap-3">
        <Choice testid="deadline-yes" active={form.heeft_deadline === true} onClick={() => setForm((f) => ({ ...f, heeft_deadline: true }))} className="flex-1 text-center">
          <span className="font-medium text-beto-ink">{w.deadlineYes}</span>
        </Choice>
        <Choice testid="deadline-no" active={form.heeft_deadline === false} onClick={() => setForm((f) => ({ ...f, heeft_deadline: false, deadline: "" }))} className="flex-1 text-center">
          <span className="font-medium text-beto-ink">{w.deadlineNo}</span>
        </Choice>
      </div>
      {form.heeft_deadline && (
        <div className="mt-4">
          <label className={labelCls}>{w.deadlineDate}</label>
          <input data-testid="deadline-date" type="date" value={form.deadline} onChange={set("deadline")} className={inputCls} />
        </div>
      )}
    </div>
    <div>
      <label className={labelCls}>{w.plaatsbezoek}</label>
      <input data-testid="plaatsbezoek-datum" type="date" value={form.plaatsbezoek_datum} onChange={set("plaatsbezoek_datum")} className={inputCls} />
    </div>
  </div>
);

const StepLocation = ({ form, set, w }) => (
  <div className="grid sm:grid-cols-6 gap-5">
    <div className="sm:col-span-4"><label className={labelCls}>{w.loc.straat}</label><input data-testid="loc-straat" value={form.straat} onChange={set("straat")} className={inputCls} /></div>
    <div className="sm:col-span-2"><label className={labelCls}>{w.loc.huisnummer}</label><input data-testid="loc-huisnummer" value={form.huisnummer} onChange={set("huisnummer")} className={inputCls} /></div>
    <div className="sm:col-span-2"><label className={labelCls}>{w.loc.postcode}</label><input data-testid="loc-postcode" value={form.postcode} onChange={set("postcode")} className={inputCls} placeholder="1930" /></div>
    <div className="sm:col-span-4"><label className={labelCls}>{w.loc.gemeente}</label><input data-testid="loc-gemeente" value={form.gemeente} onChange={set("gemeente")} className={inputCls} placeholder="Sint-Genesius-Rode" /></div>
    <div className="sm:col-span-6"><label className={labelCls}>{w.loc.land}</label><input data-testid="loc-land" value={form.land} onChange={set("land")} className={inputCls} /></div>
  </div>
);

const StepContact = ({ form, set, w, onFiles, removeFile, uploading, fileInput }) => (
  <div className="space-y-8">
    <div>
      <p className="font-body text-sm font-semibold text-beto-ink mb-1">{w.upload.title}</p>
      <p className="font-body text-xs text-beto-muted mb-4">{w.upload.hint}</p>
      <input ref={fileInput} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={onFiles} className="hidden" data-testid="upload-input" />
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        data-testid="upload-button"
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-beto-borderstrong bg-beto-dash px-5 py-3 font-body text-sm font-medium text-beto-ink hover:border-beto-primary transition-colors disabled:opacity-60"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? w.upload.uploading : w.upload.add}
      </button>
      {form.files.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3" data-testid="upload-previews">
          {form.files.map((f) => (
            <div key={f.id} className="relative group rounded-lg border border-beto-border overflow-hidden bg-beto-dash aspect-square">
              {f.previewUrl ? (
                <img src={f.previewUrl} alt={f.original_filename} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-beto-muted p-2">
                  <FileText className="w-6 h-6" />
                  <span className="mt-1 text-[10px] text-center truncate w-full">{f.original_filename}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                data-testid={`remove-file-${f.id}`}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-beto-ink/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={w.upload.remove}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="border-t border-beto-border pt-7 grid sm:grid-cols-2 gap-5">
      <div><label className={labelCls}>{w.contact.voornaam} *</label><input data-testid="contact-voornaam" value={form.voornaam} onChange={set("voornaam")} className={inputCls} /></div>
      <div><label className={labelCls}>{w.contact.achternaam} *</label><input data-testid="contact-achternaam" value={form.achternaam} onChange={set("achternaam")} className={inputCls} /></div>
      <div><label className={labelCls}>{w.contact.telefoon} *</label><input data-testid="contact-telefoon" type="tel" value={form.telefoon} onChange={set("telefoon")} className={inputCls} placeholder="+32 …" /></div>
      <div><label className={labelCls}>{w.contact.email} *</label><input data-testid="contact-email" type="email" value={form.email} onChange={set("email")} className={inputCls} placeholder="naam@voorbeeld.be" /></div>
      <div><label className={labelCls}>{w.contact.bedrijf}</label><input data-testid="contact-bedrijf" value={form.bedrijfsnaam} onChange={set("bedrijfsnaam")} className={inputCls} /></div>
      <div><label className={labelCls}>{w.contact.btw}</label><input data-testid="contact-btw" value={form.btw} onChange={set("btw")} className={inputCls} /></div>
      <div className="sm:col-span-2"><label className={labelCls}>{w.contact.opmerkingen}</label><textarea data-testid="contact-opmerkingen" rows={3} value={form.opmerkingen} onChange={set("opmerkingen")} className={`${inputCls} resize-none`} /></div>
    </div>

    <p className="rounded-lg bg-beto-dash px-4 py-3 font-body text-sm text-beto-muted flex items-start gap-2">
      <Info className="w-4 h-4 text-beto-primary mt-0.5 shrink-0" /> {w.priceNote}
    </p>
  </div>
);
