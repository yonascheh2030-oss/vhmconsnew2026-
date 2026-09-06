import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLang, wizardPath } from "@/i18n/LangContext";
import { IMAGES } from "@/constants/betodecor";

const scrollToRealisaties = () => {
  const el = document.getElementById("realisaties");
  if (window.__lenis && el) window.__lenis.scrollTo(el, { offset: -60, duration: 1.2 });
  else el?.scrollIntoView({ behavior: "smooth" });
};

export const Hero = () => {
  const { t, lang } = useLang();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 90]);

  return (
    <section ref={ref} className="relative pt-[72px] bg-beto-paper overflow-hidden">
      <div className="max-w-[1300px] mx-auto px-5 lg:px-8 grid lg:grid-cols-12 gap-10 lg:gap-8 pt-14 lg:pt-20 pb-16 lg:pb-24">
        <div className="lg:col-span-6 flex flex-col justify-center">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 self-start rounded-full border border-beto-border bg-white px-4 py-1.5 text-xs font-semibold tracking-wide text-beto-muted mb-7"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-beto-primary" />
            {t.hero.badge}
          </motion.span>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-body text-sm font-semibold uppercase tracking-[0.25em] text-beto-primary mb-4"
          >
            {t.hero.titleTop}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading font-extrabold tracking-tight text-beto-ink text-4xl sm:text-5xl lg:text-6xl leading-[1.03]"
          >
            {t.hero.titleMain}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-6 max-w-xl font-body text-base md:text-lg text-beto-muted leading-relaxed"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              to={wizardPath(lang)}
              data-testid="hero-cta"
              className="group inline-flex items-center gap-2 rounded-full bg-beto-primary text-white px-7 py-4 font-semibold hover:bg-beto-primaryhover transition-colors"
            >
              {t.hero.primary}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={scrollToRealisaties}
              data-testid="hero-secondary"
              className="inline-flex items-center gap-2 rounded-full border border-beto-borderstrong px-7 py-4 font-semibold text-beto-ink hover:border-beto-ink transition-colors"
            >
              {t.hero.secondary}
            </button>
          </motion.div>

          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-beto-border pt-8">
            {t.hero.stats.map((s) => (
              <div key={s.l}>
                <p className="font-heading font-extrabold text-2xl text-beto-ink">{s.v}</p>
                <p className="font-body text-xs uppercase tracking-wider text-beto-muted mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-2xl border border-beto-primary/25 translate-x-4 translate-y-4 pointer-events-none" />
            <div className="relative overflow-hidden rounded-2xl h-[360px] lg:h-[560px] shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
              <motion.img
                style={{ y: imgY, scale: 1.15 }}
                src={IMAGES.hero}
                alt="VHM Renovation strak geschilderd interieur"
                className="w-full h-full object-cover"
                data-testid="hero-image"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="absolute -bottom-6 left-6 bg-white rounded-xl border border-beto-border ring-1 ring-black/5 px-6 py-4 shadow-[0_10px_40px_rgba(0,0,0,0.12)]"
            >
              <p className="font-heading font-extrabold text-xl text-beto-ink leading-none">Rode · Brussel-Zuid</p>
              <p className="font-body text-xs uppercase tracking-wider text-beto-muted mt-1.5">Brabant & omstreken</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
