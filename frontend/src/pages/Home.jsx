import { Helmet } from "react-helmet-async";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Services } from "@/components/site/Services";
import { WhyChoose } from "@/components/site/WhyChoose";
import { Process } from "@/components/site/Process";
import { Realisaties } from "@/components/site/Realisaties";
import { TeamFleet } from "@/components/site/TeamFleet";
import { Region } from "@/components/site/Region";
import { CTASection } from "@/components/site/CTASection";
import { Footer } from "@/components/site/Footer";
import { FloatingWhatsApp } from "@/components/site/FloatingWhatsApp";
import { useLang, homePath } from "@/i18n/LangContext";
import { SITE } from "@/constants/betodecor";

export default function Home() {
  const { t, lang } = useLang();
  return (
    <>
      <Helmet>
        <html lang={lang} />
        <title>{t.meta.title}</title>
        <meta name="description" content={t.meta.description} />
        <link rel="canonical" href={`${SITE.domain}${homePath(lang) === "/" ? "" : homePath(lang)}`} />
      </Helmet>
      <Header />
      <main>
        <Hero />
        <Services />
        <WhyChoose />
        <Process />
        <Realisaties />
        <TeamFleet />
        <Region />
        <CTASection />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
