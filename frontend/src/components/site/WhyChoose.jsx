import { Reveal } from "@/components/Reveal";
import { useLang } from "@/i18n/LangContext";
import { Handshake, Users, ClipboardCheck, Gem } from "lucide-react";
import { IMAGES } from "@/constants/betodecor";

const ICONS = [Handshake, Users, ClipboardCheck, Gem];

export const WhyChoose = () => {
  const { t } = useLang();
  return (
    <section className="bg-beto-paper py-20 lg:py-28">
      <div className="max-w-[1300px] mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-beto-primary" />
            <span className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-beto-primary">{t.why.label}</span>
          </div>
          <h2 className="font-heading font-extrabold tracking-tight text-beto-ink text-3xl sm:text-4xl lg:text-5xl leading-tight">
            {t.why.title}
          </h2>
          <div className="mt-8 relative overflow-hidden rounded-2xl h-[280px] lg:h-[360px] shadow-[0_16px_50px_rgba(0,0,0,0.08)]">
            <img src={IMAGES.construction} alt="VHM Renovation schilder- en afwerkingswerk" className="w-full h-full object-cover" data-testid="why-image" />
            <div className="absolute inset-0 bg-gradient-to-t from-beto-ink/50 to-transparent" />
          </div>
        </div>

        <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4 self-center">
          {t.why.items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Reveal key={item.title} delay={i * 0.08}>
                <div data-testid={`why-card-${i}`} className="h-full rounded-xl border border-beto-border bg-beto-surface p-7 hover:-translate-y-1 transition-transform duration-300">
                  <span className="inline-flex w-11 h-11 items-center justify-center rounded-lg bg-beto-secondary text-white mb-5">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="font-heading font-bold text-lg text-beto-ink">{item.title}</h3>
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
