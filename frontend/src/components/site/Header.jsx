import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useLang, wizardPath, homePath } from "@/i18n/LangContext";
import { LangSwitch } from "./LangSwitch";

const scrollTo = (id, close) => {
  close && close();
  const el = document.getElementById(id);
  if (window.__lenis && el) window.__lenis.scrollTo(el, { offset: -80, duration: 1.1 });
  else el?.scrollIntoView({ behavior: "smooth" });
};

export const Header = () => {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-beto-paper/85 backdrop-blur-xl border-b border-beto-border">
      <div className="max-w-[1300px] mx-auto px-5 lg:px-8 h-[72px] flex items-center justify-between">
        <Link to={homePath(lang)} data-testid="header-logo" className="font-heading font-extrabold text-2xl tracking-tight text-beto-ink">
          VHM <span className="text-beto-primary">Renovation</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8" data-testid="header-nav">
          {t.nav.map((item) => (
            <button
              key={item.page}
              onClick={() => scrollTo(item.page)}
              data-testid={`nav-${item.page}`}
              className="font-body text-sm font-medium text-beto-muted hover:text-beto-ink transition-colors"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block"><LangSwitch /></div>
          <Link
            to={wizardPath(lang)}
            data-testid="header-cta"
            className="hidden sm:inline-flex items-center rounded-full bg-beto-primary text-white px-5 py-2.5 text-sm font-semibold hover:bg-beto-primaryhover transition-colors"
          >
            {t.common.quoteShort}
          </Link>
          <button
            onClick={() => setOpen(!open)}
            data-testid="header-menu-toggle"
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-beto-border"
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-beto-border bg-beto-surface" data-testid="header-mobile">
          {t.nav.map((item) => (
            <button
              key={item.page}
              onClick={() => scrollTo(item.page, () => setOpen(false))}
              className="block w-full text-left px-5 py-4 font-heading font-bold text-lg border-b border-beto-border"
            >
              {item.label}
            </button>
          ))}
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <LangSwitch />
            <Link
              to={wizardPath(lang)}
              onClick={() => setOpen(false)}
              className="rounded-full bg-beto-primary text-white px-5 py-2.5 text-sm font-semibold"
            >
              {t.common.quoteShort}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
