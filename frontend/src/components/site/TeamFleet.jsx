import { Reveal } from "@/components/Reveal";
import { Check } from "lucide-react";
import { useLang } from "@/i18n/LangContext";
import { IMAGES } from "@/constants/betodecor";

export const TeamFleet = () => {
  const { t } = useLang();
  return (
    <section className="bg-beto-surface py-20 lg:py-28 border-t border-beto-border">
      <div className="max-w-[1300px] mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <Reveal>
          <div className="relative">
            <div className="absolute -inset-3 rounded-2xl border border-beto-primary/20 translate-x-3 translate-y-3 pointer-events-none" />
            <div className="relative overflow-hidden rounded-2xl h-[320px] lg:h-[460px] shadow-[0_16px_50px_rgba(0,0,0,0.10)]">
              <img src={IMAGES.team} alt="VHM Renovation vakman aan het werk" className="w-full h-full object-cover" data-testid="team-image" />
            </div>
            <div className="absolute -bottom-8 -right-3 lg:-right-8 w-44 lg:w-64 overflow-hidden rounded-xl border-4 border-beto-surface shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
              <img src={IMAGES.van} alt="Schilderwerk detail — VHM Renovation" className="w-full h-full object-cover aspect-[4/3]" data-testid="van-image" />
            </div>
          </div>
        </Reveal>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-beto-primary" />
            <span className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-beto-primary">{t.team.label}</span>
          </div>
          <h2 className="font-heading font-extrabold tracking-tight text-beto-ink text-3xl sm:text-4xl lg:text-5xl leading-tight">
            {t.team.title}
          </h2>
          <p className="mt-5 font-body text-base md:text-lg text-beto-muted leading-relaxed">{t.team.body}</p>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {t.team.points.map((p) => (
              <div key={p} className="flex items-center gap-3">
                <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-beto-primary/10 text-beto-primary shrink-0">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </span>
                <span className="font-body font-medium text-beto-ink">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
