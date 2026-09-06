import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { useLang, homePath } from "@/i18n/LangContext";
import { SITE } from "@/constants/betodecor";

export const Footer = () => {
  const { t, lang } = useLang();
  return (
    <footer className="bg-beto-ink text-white">
      <div className="max-w-[1300px] mx-auto px-5 lg:px-8 pt-16 pb-10">
        <Link to={homePath(lang)} data-testid="footer-logo" className="font-heading font-extrabold text-3xl tracking-tight">
          VHM <span className="text-beto-primary">Renovation</span>
        </Link>
        <p className="mt-4 max-w-md font-body text-sm text-white/60 leading-relaxed">{t.footer.blurb}</p>

        <div className="mt-12 grid md:grid-cols-4 gap-10 border-t border-white/10 pt-12">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-5">{t.footer.contactLabel}</p>
            <a href={SITE.phoneHref} data-testid="footer-phone" className="flex items-center gap-3 font-body font-medium hover:text-beto-primary transition-colors">
              <Phone className="w-4 h-4 text-beto-primary" /> {SITE.phoneDisplay}
            </a>
            <a href={`mailto:${SITE.email}`} data-testid="footer-email" className="mt-3 flex items-center gap-3 font-body font-medium hover:text-beto-primary transition-colors">
              <Mail className="w-4 h-4 text-beto-primary" /> {SITE.email}
            </a>
            <p className="mt-3 flex items-start gap-3 font-body text-sm text-white/60">
              <MapPin className="w-4 h-4 text-beto-primary mt-0.5" /> {SITE.address}
            </p>
          </div>

          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-5">{t.footer.servicesLabel}</p>
            <ul className="space-y-2 font-body text-sm text-white/60">
              {t.footer.services.map((s) => (
                <li key={s} className="hover:text-white transition-colors">{s}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-5">{t.footer.areaLabel}</p>
            <p className="font-body text-sm text-white/60 leading-relaxed">{t.footer.area}</p>
          </div>

          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-5">{SITE.name}</p>
            <p className="font-body text-sm text-white/60 leading-relaxed">
              BTW {SITE.vat}{SITE.iban ? <><br />IBAN {SITE.iban}</> : null}
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="font-body text-xs text-white/40">{t.footer.legal}</p>
          <Link to="/admin/login" data-testid="footer-admin-link" className="font-body text-xs text-white/40 hover:text-white transition-colors">
            {t.footer.adminLink}
          </Link>
        </div>
      </div>
    </footer>
  );
};
