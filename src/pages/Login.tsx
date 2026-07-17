import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Headphones,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";

const Login = () => {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(email.trim(), password);
    setLoading(false);
    if (success) {
      const storedUser = sessionStorage.getItem("wa_panel_user");
      const parsedUser = storedUser ? (JSON.parse(storedUser) as { perfil?: string }) : null;
      navigate(parsedUser?.perfil === "super_admin" ? "/super-admin" : "/dashboard");
    } else setError("Não foi possível entrar. Confira seu e-mail e sua senha.");
  }

  async function handlePasswordReset() {
    if (!email.trim()) {
      setError("Digite seu e-mail para receber o link de recuperação.");
      return;
    }
    setError("");
    setResetting(true);
    const success = await resetPassword(email.trim());
    setResetting(false);
    if (success) toast.success("Enviamos o link de recuperação para o seu e-mail");
    else setError("Não foi possível enviar o link. Verifique o e-mail informado.");
  }

  return (
    <main className="min-h-[100dvh] bg-[#070F1F] text-white relative overflow-hidden">
      <div className="absolute -top-44 -left-44 w-[520px] h-[520px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-56 -right-44 w-[620px] h-[620px] rounded-full bg-indigo-500/[0.08] blur-[150px] pointer-events-none" />

      <div className="min-h-[100dvh] max-w-7xl mx-auto grid lg:grid-cols-[1.08fr_0.92fr] relative z-10">
        <section className="hidden lg:flex flex-col justify-between px-12 xl:px-20 py-12 border-r border-white/[0.06] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.08] via-transparent to-transparent pointer-events-none" />
          <img
            src="/logo-sky.png"
            alt=""
            aria-hidden="true"
            className="absolute w-[560px] max-w-[82%] opacity-[0.035] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          />

          <div className="relative max-w-xl flex justify-center">
            <img
              src="/logo-sky.png"
              alt="Sky Fit Academia"
              className="w-52 xl:w-56 h-auto object-contain"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative max-w-xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300 mb-6">
              <Headphones className="w-3.5 h-3.5" /> Central de atendimento
            </span>
            <h1 className="text-[2.65rem] xl:text-5xl font-bold tracking-tight leading-[1.08] max-w-[640px]">
              <span className="block whitespace-nowrap">Atendimento mais rápido,</span>
              <span className="block">organizado e próximo</span>
              <span className="block">dos seus alunos.</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed mt-6 max-w-lg">
              Gerencie conversas, acompanhe solicitações e mantenha sua equipe conectada em um só
              lugar.
            </p>
            <div className="flex items-center gap-3 mt-8 text-sm text-slate-400">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Acesso protegido e exclusivo para colaboradores</span>
            </div>
          </motion.div>

          <p className="relative text-xs text-slate-600">
            © {new Date().getFullYear()} Sky Fit Academia. Todos os direitos reservados.
          </p>
        </section>

        <section className="flex min-h-[100dvh] items-center justify-center px-4 sm:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >
            <div className="lg:hidden flex justify-center mb-7">
              <img
                src="/logo-sky.png"
                alt="Sky Fit Academia"
                className="w-40 h-auto object-contain"
              />
            </div>

            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400 mb-2">
                Painel Sky Fit
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Bem-vindo de volta</h2>
              <p className="text-sm text-slate-400 mt-2">Entre para gerenciar seus atendimentos.</p>
            </div>

            <div className="relative rounded-2xl border border-blue-400/20 bg-[#020617]/90 p-5 sm:p-7 shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_0_42px_rgba(37,99,235,0.18),0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl before:absolute before:inset-0 before:rounded-2xl before:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.14),transparent_42%)] before:pointer-events-none">
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs text-slate-300">
                    E-mail
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="seuemail@empresa.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError("");
                      }}
                      className="h-12 pl-10 rounded-xl bg-slate-800/90 border-white/[0.07] text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label htmlFor="password" className="text-xs text-slate-300">
                      Senha
                    </Label>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={resetting}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50 transition"
                    >
                      {resetting ? "Enviando..." : "Esqueci minha senha"}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setError("");
                      }}
                      className="h-12 pl-10 pr-11 rounded-xl bg-slate-800/90 border-white/[0.07] text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/5 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 flex items-start gap-2.5 text-xs text-red-300"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-950/40 transition disabled:shadow-none"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {loading ? "Entrando..." : "Entrar no painel"}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
                <div className="inline-flex items-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5" /> Acesso exclusivo para colaboradores
                  autorizados
                </div>
                <p className="text-[11px] text-slate-600 mt-2">
                  Precisa de ajuda? Fale com o administrador da sua unidade.
                </p>
              </div>
            </div>

            <p className="lg:hidden text-center text-[10px] text-slate-600 mt-6">
              © {new Date().getFullYear()} Sky Fit Academia
            </p>
          </motion.div>
        </section>
      </div>
    </main>
  );
};

export default Login;
