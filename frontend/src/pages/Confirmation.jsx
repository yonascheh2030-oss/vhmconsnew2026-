import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useLang, homePath } from "@/i18n/LangContext";
import { Footer } from "@/components/site/Footer";

export default function Confirmation() {
  const { t, lang } = useLang();
  const c = t.confirmation;
  return (
    <div className="min-h-screen bg-beto-paper flex flex-col">
      <Helmet>
        <html lang={lang} />
        <title>{`${c.title} — VHM Renovation`}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <header className="h-[72px] border-b border-beto-border flex items-center px-5 lg:px-8">
        <Link to={homePath(lang)} className="font-heading font-extrabold text-2xl tracking-tight text-beto-ink">
          VHM <span className="text-beto-primary">Renovation</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl text-center"
          data-testid="confirmation-card"
        >
          <span className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-beto-primary/10 text-beto-primary mb-7">
            <CheckCircle2 className="w-9 h-9" strokeWidth={1.75} />
          </span>
          <h1 className="font-heading font-extrabold tracking-tight text-beto-ink text-3xl sm:text-4xl leading-tight">
            {c.title}
          </h1>
          <p className="mt-5 font-body text-base md:text-lg text-beto-muted leading-relaxed">{c.body}</p>
          <p className="mt-6 rounded-xl border border-beto-border bg-white px-6 py-4 font-body text-sm text-beto-muted leading-relaxed">
            {c.note}
          </p>
          <Link
            to={homePath(lang)}
            data-testid="confirmation-home"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-beto-primary text-white px-7 py-3.5 font-semibold hover:bg-beto-primaryhover transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {c.home}
          </Link>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
