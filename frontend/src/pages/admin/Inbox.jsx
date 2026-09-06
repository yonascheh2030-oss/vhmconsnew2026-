import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, RefreshCw, Inbox as InboxIcon, PenSquare, Reply, Forward,
  Paperclip, X, Send, Loader2, Mail, Download,
} from "lucide-react";
import { api, authHeaders, API, getToken } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const fmtWhen = (iso) => {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("nl-BE", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
};

const fmtFull = (iso) => {
  try {
    return new Date(iso).toLocaleString("nl-BE", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const fmtBytes = (n) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Inbox() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState("all");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [openMsg, setOpenMsg] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(false);

  const [compose, setCompose] = useState(null); // { from_account, to, cc, subject, body, in_reply_to, references }
  const [sending, setSending] = useState(false);

  const handle401 = (e) => { if (e?.response?.status === 401) logout(); };

  const loadAccounts = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/mailboxes", { headers: authHeaders() });
      setAccounts(data.accounts || []);
      if (!data.configured) toast.error("Mailbox is niet geconfigureerd op de server.");
    } catch (e) { handle401(e); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInbox = useCallback(async (acc) => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/inbox", {
        headers: authHeaders(),
        params: { account: acc, folder: "INBOX", limit: 40 },
      });
      setMessages(data);
    } catch (e) {
      handle401(e);
      if (e?.response?.status !== 401) toast.error(e?.response?.data?.detail || "Inbox laden mislukt.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => { loadInbox(account); }, [account, loadInbox]);

  const openMessage = async (m) => {
    setSelected(m);
    setOpenMsg(null);
    setLoadingMsg(true);
    try {
      const { data } = await api.get("/admin/inbox/message", {
        headers: authHeaders(),
        params: { account: m.account, uid: m.uid, folder: m.folder },
      });
      setOpenMsg(data);
      setMessages((prev) => prev.map((x) => (x.uid === m.uid && x.account === m.account ? { ...x, seen: true } : x)));
    } catch (e) {
      handle401(e);
      if (e?.response?.status !== 401) toast.error("Bericht laden mislukt.");
    } finally {
      setLoadingMsg(false);
    }
  };

  const startCompose = () => {
    const from = accounts[0]?.key || "roberto";
    setCompose({ from_account: from, to: "", cc: "", subject: "", body: "", showCc: false });
  };

  const startReply = () => {
    if (!openMsg) return;
    const from = openMsg.account;
    const subj = openMsg.subject?.toLowerCase().startsWith("re:") ? openMsg.subject : `Re: ${openMsg.subject}`;
    const quoted = `\n\n\n--- Op ${fmtFull(openMsg.date)} schreef ${openMsg.from_name} <${openMsg.from_email}>: ---\n${openMsg.text || ""}`;
    setCompose({
      from_account: from,
      to: openMsg.from_email,
      cc: "",
      subject: subj,
      body: quoted,
      in_reply_to: openMsg.message_id,
      references: (openMsg.references ? openMsg.references + " " : "") + openMsg.message_id,
      showCc: false,
    });
  };

  const startForward = () => {
    if (!openMsg) return;
    const subj = openMsg.subject?.toLowerCase().startsWith("fwd:") ? openMsg.subject : `Fwd: ${openMsg.subject}`;
    const quoted = `\n\n\n--- Doorgestuurd bericht ---\nVan: ${openMsg.from_name} <${openMsg.from_email}>\nDatum: ${fmtFull(openMsg.date)}\nOnderwerp: ${openMsg.subject}\nAan: ${openMsg.to}\n\n${openMsg.text || ""}`;
    setCompose({ from_account: openMsg.account, to: "", cc: "", subject: subj, body: quoted, showCc: false });
  };

  const send = async () => {
    if (!compose.to.trim()) { toast.error("Vul een ontvanger in."); return; }
    setSending(true);
    try {
      await api.post("/admin/inbox/send", {
        from_account: compose.from_account,
        to: compose.to,
        cc: compose.cc || null,
        subject: compose.subject,
        body: compose.body,
        in_reply_to: compose.in_reply_to || null,
        references: compose.references || null,
      }, { headers: authHeaders() });
      toast.success("E-mail verzonden.");
      setCompose(null);
    } catch (e) {
      handle401(e);
      if (e?.response?.status !== 401) toast.error(e?.response?.data?.detail || "Verzenden mislukt.");
    } finally {
      setSending(false);
    }
  };

  const attUrl = (a) =>
    `${API}/admin/inbox/attachment?account=${encodeURIComponent(openMsg.account)}&uid=${encodeURIComponent(openMsg.uid)}&folder=${encodeURIComponent(openMsg.folder)}&index=${a.index}&token=${encodeURIComponent(getToken() || "")}`;

  const tabs = [{ key: "all", email: "Alle mailboxen", label: "Alle", unread: accounts.reduce((s, a) => s + (a.unread || 0), 0) }, ...accounts];

  return (
    <div className="min-h-screen bg-beto-dash">
      <header className="bg-white border-b border-beto-border sticky top-0 z-20">
        <div className="max-w-[1300px] mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/admin")} data-testid="inbox-back" className="inline-flex items-center gap-2 font-body text-sm font-medium text-beto-ink hover:text-beto-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <span className="font-heading font-extrabold text-lg tracking-tight text-beto-ink">Beto<span className="text-beto-primary">Decor</span></span>
        </div>
      </header>

      <main className="max-w-[1300px] mx-auto px-5 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <InboxIcon className="w-6 h-6 text-beto-primary" />
            <h1 className="font-heading font-extrabold text-2xl text-beto-ink">Inbox</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { loadInbox(account); loadAccounts(); }} data-testid="inbox-refresh" className="inline-flex items-center gap-2 rounded-lg border border-beto-border px-3.5 py-2 font-body text-sm font-medium text-beto-ink hover:border-beto-primary hover:text-beto-primary transition-colors">
              <RefreshCw className="w-4 h-4" /> Vernieuwen
            </button>
            <button onClick={startCompose} data-testid="inbox-compose" className="inline-flex items-center gap-2 rounded-lg bg-beto-primary text-white px-4 py-2 font-body text-sm font-semibold hover:bg-beto-primaryhover transition-colors">
              <PenSquare className="w-4 h-4" /> Nieuwe e-mail
            </button>
          </div>
        </div>

        {/* Account tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap" data-testid="inbox-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setAccount(t.key); setSelected(null); setOpenMsg(null); }}
              data-testid={`inbox-tab-${t.key}`}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-body text-sm font-medium border transition-colors ${account === t.key ? "bg-beto-ink text-white border-beto-ink" : "bg-white text-beto-ink border-beto-border hover:border-beto-primary"}`}
            >
              {t.key === "all" ? "Alle" : t.email}
              {t.unread > 0 && <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-beto-primary text-white text-[11px] font-bold">{t.unread}</span>}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-5">
          {/* Message list */}
          <section className="rounded-xl border border-beto-border bg-white overflow-hidden">
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-beto-border" data-testid="inbox-list">
              {loading ? (
                <div className="p-8 text-center font-body text-sm text-beto-muted">Laden…</div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center" data-testid="inbox-empty">
                  <Mail className="w-8 h-8 text-beto-muted/50 mx-auto mb-3" />
                  <p className="font-body text-sm text-beto-muted">Geen berichten in deze inbox.</p>
                </div>
              ) : (
                messages.map((m) => (
                  <button
                    key={`${m.account}-${m.uid}`}
                    onClick={() => openMessage(m)}
                    data-testid={`inbox-item-${m.account}-${m.uid}`}
                    className={`w-full text-left px-4 py-3 hover:bg-beto-dash transition-colors ${selected?.uid === m.uid && selected?.account === m.account ? "bg-beto-dash" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={`font-body text-sm truncate ${m.seen ? "text-beto-ink" : "font-bold text-beto-ink"}`}>{m.from_name || m.from_email}</p>
                      <span className="font-body text-xs text-beto-muted shrink-0">{fmtWhen(m.date)}</span>
                    </div>
                    <p className={`font-body text-sm truncate ${m.seen ? "text-beto-muted" : "font-semibold text-beto-ink"}`}>{m.subject}</p>
                    {account === "all" && (
                      <span className="inline-block mt-1 rounded px-1.5 py-0.5 bg-beto-dash border border-beto-border font-body text-[11px] text-beto-muted">{m.account}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </section>

          {/* Reader */}
          <section className="rounded-xl border border-beto-border bg-white min-h-[70vh]" data-testid="inbox-reader">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center py-24 text-center">
                <Mail className="w-10 h-10 text-beto-muted/40 mb-4" />
                <p className="font-body text-sm text-beto-muted">Selecteer een bericht om te lezen.</p>
              </div>
            ) : loadingMsg ? (
              <div className="h-full flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-beto-primary" /></div>
            ) : openMsg ? (
              <div className="flex flex-col h-full">
                <div className="p-5 border-b border-beto-border">
                  <h2 className="font-heading font-bold text-lg text-beto-ink mb-2" data-testid="reader-subject">{openMsg.subject}</h2>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-body text-sm text-beto-ink"><span className="font-semibold">{openMsg.from_name}</span> <span className="text-beto-muted">&lt;{openMsg.from_email}&gt;</span></p>
                      <p className="font-body text-xs text-beto-muted mt-0.5">aan {openMsg.to}{openMsg.cc ? ` · cc ${openMsg.cc}` : ""}</p>
                      <p className="font-body text-xs text-beto-muted mt-0.5">{fmtFull(openMsg.date)} · via {openMsg.account}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={startReply} data-testid="reader-reply" className="inline-flex items-center gap-1.5 rounded-lg bg-beto-primary text-white px-3 py-2 font-body text-xs font-semibold hover:bg-beto-primaryhover transition-colors">
                        <Reply className="w-3.5 h-3.5" /> Beantwoorden
                      </button>
                      <button onClick={startForward} data-testid="reader-forward" className="inline-flex items-center gap-1.5 rounded-lg border border-beto-border px-3 py-2 font-body text-xs font-medium text-beto-ink hover:border-beto-primary hover:text-beto-primary transition-colors">
                        <Forward className="w-3.5 h-3.5" /> Doorsturen
                      </button>
                    </div>
                  </div>
                  {openMsg.attachments?.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap" data-testid="reader-attachments">
                      {openMsg.attachments.map((a) => (
                        <a key={a.index} href={attUrl(a)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-beto-border px-3 py-1.5 font-body text-xs text-beto-ink hover:border-beto-primary hover:text-beto-primary transition-colors">
                          <Paperclip className="w-3.5 h-3.5" /> {a.filename} <span className="text-beto-muted">{fmtBytes(a.size)}</span> <Download className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <iframe
                  title="berichtinhoud"
                  sandbox=""
                  srcDoc={openMsg.html}
                  data-testid="reader-body"
                  className="w-full flex-1 min-h-[420px] bg-white"
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center py-24"><p className="font-body text-sm text-beto-muted">Bericht kon niet worden geladen.</p></div>
            )}
          </section>
        </div>
      </main>

      {/* Compose modal */}
      {compose && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-6" data-testid="compose-modal">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-xl border border-beto-border shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-beto-border">
              <h3 className="font-heading font-bold text-base text-beto-ink">Nieuw bericht</h3>
              <button onClick={() => setCompose(null)} data-testid="compose-close" className="text-beto-muted hover:text-beto-ink"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto">
              <div className="flex items-center gap-3">
                <label className="font-body text-sm text-beto-muted w-16">Van</label>
                <select data-testid="compose-from" value={compose.from_account} onChange={(e) => setCompose({ ...compose, from_account: e.target.value })} className="flex-1 rounded-lg border border-beto-borderstrong px-3 py-2 font-body text-sm focus:outline-none focus:border-beto-primary">
                  {accounts.map((a) => <option key={a.key} value={a.key}>{a.email}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="font-body text-sm text-beto-muted w-16">Aan</label>
                <input data-testid="compose-to" value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} placeholder="ontvanger@voorbeeld.be" className="flex-1 rounded-lg border border-beto-borderstrong px-3 py-2 font-body text-sm focus:outline-none focus:border-beto-primary" />
                {!compose.showCc && <button onClick={() => setCompose({ ...compose, showCc: true })} className="font-body text-xs text-beto-primary hover:underline shrink-0">Cc</button>}
              </div>
              {compose.showCc && (
                <div className="flex items-center gap-3">
                  <label className="font-body text-sm text-beto-muted w-16">Cc</label>
                  <input data-testid="compose-cc" value={compose.cc} onChange={(e) => setCompose({ ...compose, cc: e.target.value })} placeholder="cc@voorbeeld.be" className="flex-1 rounded-lg border border-beto-borderstrong px-3 py-2 font-body text-sm focus:outline-none focus:border-beto-primary" />
                </div>
              )}
              <div className="flex items-center gap-3">
                <label className="font-body text-sm text-beto-muted w-16">Onderwerp</label>
                <input data-testid="compose-subject" value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} placeholder="Onderwerp" className="flex-1 rounded-lg border border-beto-borderstrong px-3 py-2 font-body text-sm focus:outline-none focus:border-beto-primary" />
              </div>
              <textarea data-testid="compose-body" rows={12} value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} placeholder="Schrijf uw bericht…" className="w-full rounded-lg border border-beto-borderstrong px-3 py-3 font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-beto-primary/30 focus:border-beto-primary transition" />
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-beto-border">
              <button onClick={() => setCompose(null)} className="rounded-lg border border-beto-border px-4 py-2.5 font-body text-sm font-medium text-beto-ink hover:border-beto-ink transition-colors">Annuleren</button>
              <button onClick={send} disabled={sending} data-testid="compose-send" className="inline-flex items-center gap-2 rounded-lg bg-beto-primary text-white px-5 py-2.5 font-body text-sm font-semibold hover:bg-beto-primaryhover transition-colors disabled:opacity-60">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Verzenden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
