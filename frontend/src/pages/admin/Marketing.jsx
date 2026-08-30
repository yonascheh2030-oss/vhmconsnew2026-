import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Send, Loader2, Eye, Megaphone } from "lucide-react";
import { api, authHeaders } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { fmtDate } from "@/lib/labels";
import { SITE } from "@/constants/betodecor";

const AUDIENCES = [
  { key: "", label: "Alle leads" },
  { key: "hot", label: "Alleen HOT" },
  { key: "high", label: "Alleen HIGH" },
  { key: "normal", label: "Alleen NORMAAL" },
  { key: "low", label: "Alleen LAAG" },
];

const TYPE_LABEL = { notification: "Melding", confirmation: "Bevestiging", manual: "Handmatig", campaign: "Campagne" };

export default function Marketing() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("");
  const [cta, setCta] = useState(true);
  const [sending, setSending] = useState(false);
  const [recent, setRecent] = useState([]);

  const loadRecent = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/emails", { headers: authHeaders(), params: { limit: 60 } });
      setRecent(data);
    } catch (e) {
      if (e?.response?.status === 401) logout();
    }
  }, [logout]);

  useEffect(() => { loadRecent(); }, [loadRecent]);

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Vul een onderwerp en bericht in.");
      return;
    }
    setSending(true);
    try {
      const payload = { subject, body };
      if (audience) payload.category = audience;
      if (cta) { payload.cta_url = SITE.domain; payload.cta_label = "Vraag een renovatieofferte aan"; }
      const { data } = await api.post("/admin/campaign", payload, { headers: authHeaders() });
      if (data.recipients === 0) toast.warning("Geen ontvangers voor deze selectie.");
      else toast.success(`Verzonden naar ${data.sent} van ${data.recipients} ontvanger(s).`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Verzenden mislukt.");
    } finally {
      setSending(false);
      loadRecent();
    }
  };

  const viewEmail = (html) => {
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
    else toast.error("Sta pop-ups toe om de e-mail te bekijken.");
  };

  const campaigns = recent.filter((m) => m.type === "campaign");

  return (
    <div className="min-h-screen bg-beto-dash">
      <header className="bg-white border-b border-beto-border sticky top-0 z-20">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/admin")} data-testid="marketing-back" className="inline-flex items-center gap-2 font-body text-sm font-medium text-beto-ink hover:text-beto-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="font-heading font-extrabold text-lg tracking-tight text-beto-ink">Beto<span className="text-beto-primary">Decor</span></span>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-5 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Megaphone className="w-6 h-6 text-beto-primary" />
          <h1 className="font-heading font-extrabold text-2xl text-beto-ink">Mailmarketing</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Composer */}
          <section className="rounded-xl border border-beto-border bg-white p-6">
            <h2 className="font-heading font-bold text-lg text-beto-ink mb-4">Nieuwe campagne</h2>
            <label className="block font-body text-sm font-medium text-beto-ink mb-2">Doelgroep</label>
            <select data-testid="campaign-audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full rounded-lg border border-beto-borderstrong px-4 py-2.5 font-body text-sm mb-4 focus:outline-none focus:border-beto-primary">
              {AUDIENCES.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>

            <label className="block font-body text-sm font-medium text-beto-ink mb-2">Onderwerp</label>
            <input data-testid="campaign-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Bv. Plan uw renovatie voor het najaar" className="w-full rounded-lg border border-beto-borderstrong px-4 py-2.5 font-body text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-beto-primary/30 focus:border-beto-primary transition" />

            <label className="block font-body text-sm font-medium text-beto-ink mb-2">Bericht</label>
            <textarea data-testid="campaign-body" rows={7} value={body} onChange={(e) => setBody(e.target.value)} placeholder={"Beste,\n\nBij BetoDecor verzorgen wij uw volledige renovatie van A tot Z…"} className="w-full rounded-lg border border-beto-borderstrong px-4 py-3 font-body text-sm resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-beto-primary/30 focus:border-beto-primary transition" />

            <label className="flex items-center gap-2 font-body text-sm text-beto-ink mb-5">
              <input type="checkbox" data-testid="campaign-cta" checked={cta} onChange={(e) => setCta(e.target.checked)} className="w-4 h-4 accent-beto-primary" />
              Knop "Vraag een renovatieofferte aan" toevoegen
            </label>

            <button onClick={send} disabled={sending} data-testid="campaign-send" className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-beto-primary text-white px-6 py-3.5 font-body font-semibold hover:bg-beto-primaryhover transition-colors disabled:opacity-60">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Campagne versturen
            </button>
            <p className="mt-3 font-body text-xs text-beto-muted">De e-mail wordt verstuurd met een professionele BetoDecor-template en handtekening.</p>
          </section>

          {/* Recent campaigns */}
          <section className="rounded-xl border border-beto-border bg-white p-6">
            <h2 className="font-heading font-bold text-lg text-beto-ink mb-4">Recent verzonden</h2>
            {campaigns.length === 0 ? (
              <p className="font-body text-sm text-beto-muted">Nog geen campagnes verzonden.</p>
            ) : (
              <div className="space-y-2" data-testid="campaign-history">
                {campaigns.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-beto-border px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="font-body text-sm font-medium text-beto-ink truncate">{m.subject}</p>
                      <p className="font-body text-xs text-beto-muted">{m.to} · {fmtDate(m.created_at)} · <span className={m.status === "verzonden" ? "text-green-700" : "text-red-600"}>{m.status}</span></p>
                    </div>
                    <button onClick={() => viewEmail(m.html)} data-testid={`campaign-view-${m.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-beto-border px-3 py-2 font-body text-xs font-medium text-beto-ink hover:border-beto-primary hover:text-beto-primary transition-colors shrink-0">
                      <Eye className="w-3.5 h-3.5" /> Bekijk
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
