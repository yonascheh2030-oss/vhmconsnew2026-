import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Lenis from "lenis";
import { Toaster } from "sonner";
import { LangProvider, LANGS } from "@/i18n/LangContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import Home from "@/pages/Home";
import Wizard from "@/pages/Wizard";
import Confirmation from "@/pages/Confirmation";
import AdminLogin from "@/pages/admin/Login";
import Dashboard from "@/pages/admin/Dashboard";
import LeadDetail from "@/pages/admin/LeadDetail";
import Marketing from "@/pages/admin/Marketing";
import Inbox from "@/pages/admin/Inbox";

const PATHS = {
  home: { nl: "/", fr: "/fr", en: "/en", es: "/es" },
  wizard: { nl: "/aanvraag", fr: "/fr/demande", en: "/en/request", es: "/es/solicitud" },
  confirm: { nl: "/bedankt", fr: "/fr/merci", en: "/en/thank-you", es: "/es/gracias" },
};

const langRoutes = (lang) => [
  <Route key={`${lang}-home`} path={PATHS.home[lang]} element={<LangProvider lang={lang}><Home /></LangProvider>} />,
  <Route key={`${lang}-wiz`} path={PATHS.wizard[lang]} element={<LangProvider lang={lang}><Wizard /></LangProvider>} />,
  <Route key={`${lang}-conf`} path={PATHS.confirm[lang]} element={<LangProvider lang={lang}><Confirmation /></LangProvider>} />,
];

function App() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, anchors: true });
    window.__lenis = lenis;
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return (
    <div className="App">
      <HelmetProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {LANGS.map((lang) => langRoutes(lang))}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin/lead/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
              <Route path="/admin/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
              <Route path="/admin/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </HelmetProvider>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
