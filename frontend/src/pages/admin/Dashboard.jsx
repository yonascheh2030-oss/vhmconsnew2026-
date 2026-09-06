import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Search, RefreshCw, Flame, TrendingUp, Building2, Euro, Megaphone, Inbox as InboxIcon } from "lucide-react";
import { api, authHeaders } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CategoryBadge, ScoreBadge, StatusBadge } from "@/components/admin/badges";
import { L, eur, fmtDate } from "@/lib/labels";

const Kpi = ({ label, value, accent, icon: Icon, testid }) => (
  <div data-testid={testid} className="rounded-xl border border-beto-border bg-white p-5 hover:-translate-y-0.5 transition-transform">
    <div className="flex items-center justify-between">
      <p className="font-body text-xs font-semibold uppercase tracking-wider text-beto-muted">{label}</p>
      {Icon && <Icon className="w-4 h-4" style={{ color: accent || "#78716C" }} />}
    </div>
    <p className="mt-2 font-heading font-extrabold text-2xl text-beto-ink">{value}</p>
  </div>
);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/stats", { headers: authHeaders() });
      setStats(data);
    } catch (e) {
      if (e?.response?.status === 401) logout();
    }
  }, [logout]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (status) params.status = status;
      if (category) params.category = category;
      const { data } = await api.get("/admin/leads", { headers: authHeaders(), params });
      setLeads(data);
    } catch (e) {
      if (e?.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  }, [q, status, category, logout]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    const t = setTimeout(loadLeads, 250);
    return () => clearTimeout(t);
  }, [loadLeads]);

  const doLogout = () => { logout(); navigate("/admin/login", { replace: true }); };

  return (
    <div className="min-h-screen bg-beto-dash">
      <header className="bg-white border-b border-beto-border sticky top-0 z-20">
        <div className="max-w-[1300px] mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-heading font-extrabold text-xl tracking-tight text-beto-ink">Beto<span className="text-beto-primary">Decor</span></span>
            <span className="hidden sm:inline font-body text-sm text-beto-muted border-l border-beto-border pl-3">Leadbeheer</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin/inbox" data-testid="nav-inbox" className="inline-flex items-center gap-2 rounded-lg border border-beto-border px-3.5 py-2 font-body text-sm font-medium text-beto-ink hover:border-beto-primary hover:text-beto-primary transition-colors">
              <InboxIcon className="w-4 h-4" /> Inbox
            </Link>
            <Link to="/admin/marketing" data-testid="nav-marketing" className="inline-flex items-center gap-2 rounded-lg border border-beto-border px-3.5 py-2 font-body text-sm font-medium text-beto-ink hover:border-beto-primary hover:text-beto-primary transition-colors">
              <Megaphone className="w-4 h-4" /> Mailmarketing
            </Link>
            <span className="hidden sm:inline font-body text-sm text-beto-muted" data-testid="admin-user">{user?.email}</span>
            <button onClick={doLogout} data-testid="admin-logout" className="inline-flex items-center gap-2 rounded-lg border border-beto-border px-3.5 py-2 font-body text-sm font-medium text-beto-ink hover:border-beto-ink transition-colors">
              <LogOut className="w-4 h-4" /> Uitloggen
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1300px] mx-auto px-5 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-extrabold text-2xl text-beto-ink">Overzicht</h1>
          <button onClick={() => { loadStats(); loadLeads(); }} data-testid="admin-refresh" className="inline-flex items-center gap-2 font-body text-sm text-beto-muted hover:text-beto-ink transition-colors">
            <RefreshCw className="w-4 h-4" /> Vernieuwen
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi testid="kpi-new" label="Nieuwe leads" value={stats?.new ?? "—"} accent="#075985" icon={TrendingUp} />
          <Kpi testid="kpi-hot" label="HOT leads" value={stats?.by_category?.hot ?? "—"} accent="#991B1B" icon={Flame} />
          <Kpi testid="kpi-total" label="Totaal aanvragen" value={stats?.total ?? "—"} accent="#9C5B3E" icon={Building2} />
          <Kpi testid="kpi-value" label="Totale projectwaarde" value={stats ? eur(stats.total_value) : "—"} accent="#166534" icon={Euro} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <Kpi testid="kpi-high" label="High priority" value={stats?.by_category?.high ?? "—"} accent="#92400E" />
          <Kpi testid="kpi-normal" label="Normaal" value={stats?.by_category?.normal ?? "—"} accent="#075985" />
          <Kpi testid="kpi-low" label="Lage prioriteit" value={stats?.by_category?.low ?? "—"} accent="#57534E" />
          <Kpi testid="kpi-avg" label="Gem. budget" value={stats ? eur(stats.avg_budget) : "—"} accent="#9C5B3E" />
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-beto-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              data-testid="filter-search"
              placeholder="Zoek op naam, e-mail of gemeente…"
              className="w-full rounded-lg border border-beto-border bg-white pl-9 pr-4 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-beto-primary/30 focus:border-beto-primary transition"
            />
          </div>
          <select data-testid="filter-category" value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-beto-border bg-white px-3 py-2.5 font-body text-sm focus:outline-none focus:border-beto-primary">
            <option value="">Alle categorieën</option>
            <option value="hot">HOT</option>
            <option value="high">High</option>
            <option value="normal">Normaal</option>
            <option value="low">Laag</option>
          </select>
          <select data-testid="filter-status" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-beto-border bg-white px-3 py-2.5 font-body text-sm focus:outline-none focus:border-beto-primary">
            <option value="">Alle statussen</option>
            <option value="nieuw">Nieuw</option>
            <option value="bezocht">Bezocht</option>
            <option value="offerte_verzonden">Offerte verzonden</option>
          </select>
        </div>

        {/* Table */}
        <div className="mt-5 rounded-xl border border-beto-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left" data-testid="leads-table">
              <thead>
                <tr className="border-b border-beto-border bg-beto-dash">
                  {["Score", "Categorie", "Status", "Naam", "Gemeente", "Projecttype", "m²", "Budget", "Aanvraag"].map((h) => (
                    <th key={h} className="px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-beto-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center font-body text-beto-muted">Laden…</td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center font-body text-beto-muted" data-testid="leads-empty">Geen leads gevonden.</td></tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => navigate(`/admin/lead/${lead.id}`)}
                      data-testid={`lead-row-${lead.id}`}
                      className="border-b border-beto-border last:border-0 hover:bg-beto-dash cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3"><ScoreBadge score={lead.score} category={lead.category} /></td>
                      <td className="px-4 py-3"><CategoryBadge category={lead.category} /></td>
                      <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                      <td className="px-4 py-3 font-body text-sm font-medium text-beto-ink whitespace-nowrap">{lead.voornaam} {lead.achternaam}</td>
                      <td className="px-4 py-3 font-body text-sm text-beto-muted whitespace-nowrap">{lead.gemeente || "—"}</td>
                      <td className="px-4 py-3 font-body text-sm text-beto-muted whitespace-nowrap">{(lead.project_types || []).map(L.projectType).join(", ")}</td>
                      <td className="px-4 py-3 font-body text-sm text-beto-muted">{lead.oppervlakte || "—"}</td>
                      <td className="px-4 py-3 font-body text-sm text-beto-muted whitespace-nowrap">{L.budget(lead.budget)}</td>
                      <td className="px-4 py-3 font-body text-sm text-beto-muted whitespace-nowrap">{fmtDate(lead.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
