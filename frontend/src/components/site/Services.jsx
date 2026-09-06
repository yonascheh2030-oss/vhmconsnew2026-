import { Reveal } from "@/components/Reveal";
import { useLang } from "@/i18n/LangContext";
import {
  PaintRoller, Paintbrush, Layers, Ruler, Hammer, SprayCan, Home, Building2,
} from "lucide-react";

const ICONS = [PaintRoller, Building2, Layers, Ruler, Hammer, Home, Paintbrush, SprayCan];

const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="w-8 h-px bg-beto-primary" />
    <span className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-beto-primary">{children}</span>
  </div>
);

export const Services = () => {
  const { t } = useLang();
  return (
    <section id="services" className="bg-beto-surface py-20 lg:py-28 border-t border-beto-border">
      <div className="max-w-[1300px] mx-auto px-5 lg:px-8">
        <div className="max-w-2xl">
          <SectionLabel>{t.services.label}</SectionLabel>
          <h2 className="font-heading font-extrabold tracking-tight text-beto-ink text-3xl sm:text-4xl lg:text-5xl leading-tight">
            {t.services.title}
          </h2>
          <p className="mt-5 font-body text-base md:text-lg text-beto-muted leading-relaxed">{t.services.intro}</p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {t.services.items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Reveal key={item.name} delay={i * 0.05}>
                <div
                  data-testid={`service-card-${i}`}
                  className="group h-full rounded-xl border border-beto-border bg-beto-paper p-6 hover:border-beto-primary hover:-translate-y-1 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
                >
                  <span className="inline-flex w-11 h-11 items-center justify-center rounded-lg bg-beto-primary/10 text-beto-primary mb-5 group-hover:bg-beto-primary group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="font-heading font-bold text-lg text-beto-ink leading-snug">{item.name}</h3>
                  <p className="mt-2 font-body text-sm text-beto-muted leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
