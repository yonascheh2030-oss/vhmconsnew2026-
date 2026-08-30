import { Reveal } from "@/components/Reveal";
import { useLang } from "@/i18n/LangContext";
import { IMAGES } from "@/constants/betodecor";

export const Realisaties = () => {
  const { t } = useLang();
  const tiles = [
    { src: IMAGES.living, tag: t.realisaties.tags[0], span: "lg:col-span-7 h-[280px] lg:h-[440px]" },
    { src: IMAGES.facade, tag: t.realisaties.tags[0], span: "lg:col-span-5 h-[280px] lg:h-[440px]" },
    { src: IMAGES.bathroom, tag: t.realisaties.tags[1], span: "lg:col-span-4 h-[240px] lg:h-[300px]" },
    { src: IMAGES.kitchen, tag: t.realisaties.tags[2], span: "lg:col-span-4 h-[240px] lg:h-[300px]" },
    { src: IMAGES.bathroom2, tag: t.realisaties.tags[1], span: "lg:col-span-4 h-[240px] lg:h-[300px]" },
    { src: IMAGES.construction, tag: t.realisaties.tags[3], span: "lg:col-span-8 h-[240px] lg:h-[320px]" },
    { src: IMAGES.blueprint, tag: t.realisaties.tags[3], span: "lg:col-span-4 h-[240px] lg:h-[320px]" },
  ];
  return (
    <section id="realisaties" className="bg-beto-surface py-20 lg:py-28 border-t border-beto-border">
      <div className="max-w-[1300px] mx-auto px-5 lg:px-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-beto-primary" />
            <span className="font-body text-xs font-semibold uppercase tracking-[0.25em] text-beto-primary">{t.realisaties.label}</span>
          </div>
          <h2 className="font-heading font-extrabold tracking-tight text-beto-ink text-3xl sm:text-4xl lg:text-5xl leading-tight">
            {t.realisaties.title}
          </h2>
          <p className="mt-5 font-body text-base md:text-lg text-beto-muted leading-relaxed">{t.realisaties.intro}</p>
        </div>

        <div className="mt-12 grid lg:grid-cols-12 gap-4">
          {tiles.map((tile, i) => (
            <Reveal key={i} delay={i * 0.05} className={tile.span}>
              <div data-testid={`realisatie-${i}`} className="group relative w-full h-full overflow-hidden rounded-xl border border-beto-border">
                <img
                  src={tile.src}
                  alt={`BetoDecor realisatie ${tile.tag}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-beto-ink/60 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full bg-white/90 backdrop-blur px-4 py-1.5 font-body text-xs font-semibold text-beto-ink">
                  {tile.tag}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
