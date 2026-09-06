import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLogin() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Inloggen mislukt.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-beto-secondary flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-heading font-extrabold text-3xl tracking-tight text-white">
            VHM <span className="text-beto-primary">Renovation</span>
          </p>
          <p className="mt-2 font-body text-sm text-white/50 uppercase tracking-[0.2em]">Leadbeheer</p>
        </div>
        <form onSubmit={submit} data-testid="login-form" className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-beto-primary" />
            <h1 className="font-heading font-bold text-xl text-beto-ink">Beveiligde login</h1>
          </div>
          <label className="block font-body text-sm font-medium text-beto-ink mb-2">E-mailadres</label>
          <input
            data-testid="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-beto-borderstrong px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-beto-primary/40 focus:border-beto-primary transition mb-5"
            placeholder="admin@vhmconstructionrenovation.be"
          />
          <label className="block font-body text-sm font-medium text-beto-ink mb-2">Wachtwoord</label>
          <input
            data-testid="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-beto-borderstrong px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-beto-primary/40 focus:border-beto-primary transition mb-7"
            placeholder="••••••••"
          />
          <button
            type="submit"
            disabled={loading}
            data-testid="login-submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-beto-primary text-white px-6 py-3.5 font-body font-semibold hover:bg-beto-primaryhover transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Inloggen
          </button>
        </form>
      </div>
    </div>
  );
}
