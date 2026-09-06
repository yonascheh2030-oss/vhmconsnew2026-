import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, Phone, Mail, MessageCircle, CalendarClock, Loader2, FileText, MapPin,
  ExternalLink, Download, Send, Eye,
} from "lucide-react";
import { api, authHeaders, fileUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CategoryBadge, ScoreBadge } from "@/components/admin/badges";
import { L, eur, fmtDate } from "@/lib/labels";

const STATUSES = [
  { key: "nieuw", label: "Nieuw" },
  { key: "bezocht", label: "Bezocht" },
  { key: "offerte_verzonden", label: "Offerte verzonden" },
];

const TYPE_LABEL = { notification: "Melding", confirmation: "Bevestiging", manual: "Handmatig", campaign: "Campagne" };

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-6 py-2.5 border-b border-beto-border last:border-0">
    <span className="font-body text-sm text-beto-muted">{label}</span>
    <span className="font-body text-sm font-medium text-beto-ink text-right">{value || "—"}</span>
  </div>
);

const Action = ({ href, icon: Icon, label, testid, onClick }) => (
  <a
    href={href}
    onClick={onClick}
    target={href && href.startsWith("http") ? "_blank" : undefined}
    rel="noopener noreferrer"
    data-testid={testid}
    className="inline-flex items-center gap-2 rounded-lg border border-beto-border bg-white px-4 py-2.5 font-body text-sm font-medium text-beto-ink hover:border-beto-primary hover:text-beto-primary transition-colors"
  >
    <Icon className="w-4 h-4" /> {label}
  </a>
);

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [emails, setEmails] = useState([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendingMail, setSendingMail] = useState(false);

  const loadEmails = useCallback(async () => {
    try {
      const { data } = await api.get(`/admin/leads/${id}/emails`, { headers: authHeaders() });
      setEmails(data);
    } catch { /* ignore */ }
  }, [id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/leads/${id}`, { headers: authHeaders() });
      setLead(data);
    } catch (e) {
      if (e?.response?.status === 401) logout();
      else if (e?.response?.status === 404) toast.error("Lead niet gevonden.");
    } finally {
      setLoading(false);
    }
  }, [id, logout]);

  useEffect(() => { load(); loadEmails(); }, [load, loadEmails]);

  const setStatus = async (status) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/leads/${id}/status`, { status }, { headers: authHeaders() });
      setLead(data);
      toast.success("Status bijgewerkt.");
    } catch {
      toast.error("Bijwerken mislukt.");
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const res = await api.get(`/admin/leads/${id}/pdf`, { headers: authHeaders(), responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VHM-Renovation-aanvraag-${lead?.achternaam || "lead"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF genereren mislukt.");
    } finally {
      setPdfLoading(false);
    }
  };

  const sendMail = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Vul een onderwerp en bericht in.");
      return;
    }
    setSendingMail(true);
    try {
      await api.post(`/admin/leads/${id}/email`, { subject, body }, { headers: authHeaders() });
      toast.success("E-mail verzonden.");
      setSubject("");
      setBody("");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Versturen mislukt.");
    } finally {
      setSendingMail(false);
      loadEmails();
    }
  };

  const viewEmail = (html) => {
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
    else toast.error("Sta pop-ups toe om de e-mail te bekijken.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-beto-dash flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-beto-primary" />
      </div>
    );
  }
  if (!lead) {
    return (
      <div className="min-h-screen bg-beto-dash flex flex-col items-center justify-center gap-4">
        <p className="font-body text-beto-muted">Lead niet gevonden.</p>
        <Link to="/admin" className="text-beto-primary font-semibold">Terug naar overzicht</Link>
      </div>
    );
  }

  const digits = (lead.telefoon || "").replace(/\D/g, "");
  const naam = `${lead.voornaam} ${lead.achternaam}`;
  const streetPart = [lead.straat, lead.huisnummer].filter(Boolean).join(" ");
  const cityPart = [lead.postcode, lead.gemeente].filter(Boolean).join(" ");
  const adres = [streetPart, cityPart].filter(Boolean).join(", ");
  const bd = lead.score_breakdown || {};

  return (
    <div className="min-h-screen bg-beto-dash">
      <header className="bg-white border-b border-beto-border sticky top-0 z-20">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/admin")} data-testid="detail-back" className="inline-flex items-center gap-2 font-body text-sm font-medium text-beto-ink hover:text-beto-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Terug
          </button>
          <span className="font-heading font-extrabold text-lg tracking-tight text-beto-ink">VHM <span className="text-beto-primary">Renovation</span></span>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-5 lg:px-8 py-8">
        <div className="rounded-xl border border-beto-border bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <ScoreBadge score={lead.score} category={lead.category} />
              <div>
                <h1 className="font-heading font-extrabold text-2xl text-beto-ink" data-testid="detail-name">{naam}</h1>
                <div className="mt-1.5 flex items-center gap-2">
                  <CategoryBadge category={lead.category} testid="detail-category" />
                  <span className="font-body text-sm text-beto-muted">{fmtDate(lead.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={downloadPdf} disabled={pdfLoading} data-testid="detail-pdf" className="inline-flex items-center gap-2 rounded-lg bg-beto-primary text-white px-4 py-2.5 font-body text-sm font-semibold hover:bg-beto-primaryhover transition-colors disabled:opacity-60">
                {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
              </button>
              <Action href={`tel:${lead.telefoon}`} icon={Phone} label="Bellen" testid="action-call" />
              <Action href={`mailto:${lead.email}`} icon={Mail} label="E-mail" testid="action-email" />
              {digits && <Action href={`https://wa.me/${digits}`} icon={MessageCircle} label="WhatsApp" testid="action-whatsapp" />}
              <Action href={`mailto:${lead.email}?subject=Plaatsbezoek%20VHM%20Renovation`} icon={CalendarClock} label="Plaatsbezoek" testid="action-visit" />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-beto-border">
            <p className="font-body text-sm font-medium text-beto-ink mb-3">Status wijzigen</p>
            <div className="flex flex-wrap gap-2" data-testid="status-control">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  disabled={saving}
                  data-testid={`status-${s.key}`}
                  className={`rounded-full px-4 py-2 font-body text-sm font-semibold transition-colors disabled:opacity-60 ${
                    lead.status === s.key ? "bg-beto-primary text-white" : "border border-beto-borderstrong text-beto-ink hover:border-beto-primary"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-xl border border-beto-border bg-white p-6">
              <h2 className="font-heading font-bold text-lg text-beto-ink mb-4">Project</h2>
              <Row label="Projecttype" value={(lead.project_types || []).map(L.projectType).join(", ")} />
              <Row label="Renovatie" value={lead.renovatie_type ? L.renoType(lead.renovatie_type) : "—"} />
              <Row label="Oppervlakte" value={lead.oppervlakte ? `${lead.oppervlakte} m²` : "—"} />
              <Row label="Verdiepingen" value={lead.verdiepingen} />
              <Row label="Kamers" value={lead.kamers} />
              <Row label="Bouwjaar" value={lead.bouwjaar} />
              <Row label="Bewoond" value={lead.bewoond ? L.bewoond(lead.bewoond) : "—"} />
              <Row label="Budget" value={<span>{L.budget(lead.budget)} <span className="text-beto-muted">({eur(lead.geschatte_waarde)})</span></span>} />
              <Row label="Start" value={L.timing(lead.starttermijn)} />
              <Row label="Deadline" value={lead.heeft_deadline ? (lead.deadline || "Ja") : "Nee"} />
              <Row label="Voorkeur plaatsbezoek" value={lead.plaatsbezoek_datum ? fmtDate(lead.plaatsbezoek_datum) : "—"} />
              {(lead.works || []).length > 0 && (
                <div className="pt-4">
                  <p className="font-body text-sm text-beto-muted mb-2">Werken</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.works.map((k) => (
                      <span key={k} className="rounded-full bg-beto-dash px-3 py-1 font-body text-xs text-beto-ink">{L.work(k)}</span>
                    ))}
                  </div>
                </div>
              )}
              {lead.beschrijving && (
                <div className="pt-4">
                  <p className="font-body text-sm text-beto-muted mb-2">Omschrijving</p>
                  <p className="font-body text-sm text-beto-ink bg-beto-dash rounded-lg p-4 leading-relaxed">{lead.beschrijving}</p>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-beto-border bg-white p-6">
              <h2 className="font-heading font-bold text-lg text-beto-ink mb-4">Foto's & plannen</h2>
              {(lead.files || []).length === 0 ? (
                <p className="font-body text-sm text-beto-muted">Geen bestanden geüpload.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" data-testid="detail-media">
                  {lead.files.map((f) => {
                    const isImg = (f.content_type || "").startsWith("image/");
                    const url = fileUrl(f.storage_path);
                    return isImg ? (
                      <a key={f.id} href={url} target="_blank" rel="noopener noreferrer" className="group block rounded-lg overflow-hidden border border-beto-border aspect-square">
                        <img src={url} alt={f.original_filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </a>
                    ) : (
                      <a key={f.id} href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2 rounded-lg border border-beto-border aspect-square bg-beto-dash text-beto-muted hover:text-beto-primary hover:border-beto-primary transition-colors p-3">
                        <FileText className="w-7 h-7" />
                        <span className="text-[11px] text-center truncate w-full">{f.original_filename}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    );
                  })}
                </div>
              )}
            </section>

            {/* E-mail: versturen + geschiedenis */}
            <section className="rounded-xl border border-beto-border bg-white p-6" data-testid="email-section">
              <h2 className="font-heading font-bold text-lg text-beto-ink mb-1">E-mail naar klant</h2>
              <p className="font-body text-sm text-beto-muted mb-4">Wordt verzonden met de professionele VHM Renovation-handtekening.</p>
              <input
                data-testid="email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Onderwerp"
                className="w-full rounded-lg border border-beto-borderstrong px-4 py-2.5 font-body text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-beto-primary/30 focus:border-beto-primary transition"
              />
              <textarea
                data-testid="email-body"
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Beste ${lead.voornaam},\n\n…`}
                className="w-full rounded-lg border border-beto-borderstrong px-4 py-3 font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-beto-primary/30 focus:border-beto-primary transition"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="font-body text-xs text-beto-muted">Aan: {lead.email}</span>
                <button onClick={sendMail} disabled={sendingMail} data-testid="email-send" className="inline-flex items-center gap-2 rounded-lg bg-beto-primary text-white px-5 py-2.5 font-body text-sm font-semibold hover:bg-beto-primaryhover transition-colors disabled:opacity-60">
                  {sendingMail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Versturen
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-beto-border">
                <p className="font-body text-sm font-medium text-beto-ink mb-3">Verzonden e-mails</p>
                {emails.length === 0 ? (
                  <p className="font-body text-sm text-beto-muted">Nog geen e-mails.</p>
                ) : (
                  <div className="space-y-2" data-testid="email-history">
                    {emails.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-beto-border px-3 py-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-beto-dash px-2 py-0.5 font-body text-[10px] font-semibold uppercase text-beto-muted">{TYPE_LABEL[m.type] || m.type}</span>
                            <span className={`font-body text-[11px] font-semibold ${m.status === "verzonden" ? "text-green-700" : "text-red-600"}`}>{m.status}</span>
                          </div>
                          <p className="font-body text-sm text-beto-ink truncate mt-1">{m.subject}</p>
                          <p className="font-body text-xs text-beto-muted">{fmtDate(m.created_at)}</p>
                        </div>
                        <button onClick={() => viewEmail(m.html)} data-testid={`email-view-${m.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-beto-border px-3 py-2 font-body text-xs font-medium text-beto-ink hover:border-beto-primary hover:text-beto-primary transition-colors shrink-0">
                          <Eye className="w-3.5 h-3.5" /> Bekijk
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-beto-border bg-white p-6">
              <h2 className="font-heading font-bold text-lg text-beto-ink mb-4">Contact</h2>
              <Row label="Naam" value={naam} />
              <Row label="Telefoon" value={lead.telefoon} />
              <Row label="E-mail" value={lead.email} />
              <Row label="Bedrijf" value={lead.bedrijfsnaam} />
              <Row label="BTW" value={lead.btw} />
              <div className="pt-3 flex items-start gap-2 text-beto-muted">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-beto-primary" />
                <span className="font-body text-sm text-beto-ink">{adres || "—"}</span>
              </div>
              {lead.opmerkingen && (
                <p className="mt-3 font-body text-sm text-beto-ink bg-beto-dash rounded-lg p-3">{lead.opmerkingen}</p>
              )}
            </section>

            <section className="rounded-xl border border-beto-border bg-white p-6">
              <h2 className="font-heading font-bold text-lg text-beto-ink mb-4">Leadscore</h2>
              <div className="text-center mb-4">
                <p className="font-heading font-extrabold text-4xl text-beto-ink">{lead.score}<span className="text-beto-muted text-xl">/100</span></p>
                <CategoryBadge category={lead.category} />
              </div>
              <Row label="Budget" value={`${bd.budget ?? "—"} / 30`} />
              <Row label="Projecttype" value={`${bd.project ?? "—"} / 25`} />
              <Row label="Locatie" value={`${bd.location ?? "—"} / 20`} />
              <Row label="Timing" value={`${bd.timing ?? "—"} / 15`} />
              <Row label="Compleetheid" value={`${bd.completeness ?? "—"} / 10`} />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
