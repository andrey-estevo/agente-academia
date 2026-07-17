import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { AdminShell } from "@/components/AdminShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Unit {
  id: string;
  nome: string;
}

interface UserForm {
  nome: string;
  email: string;
  password: string;
  perfil: "atendente" | "admin";
  unidade_id: string;
}

const emptyForm: UserForm = {
  nome: "",
  email: "",
  password: "",
  perfil: "atendente",
  unidade_id: "",
};

export default function AdminUsuarios() {
  const { user } = useAuth();
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [createdName, setCreatedName] = useState("");
  const [unidades, setUnidades] = useState<Unit[]>([]);

  useEffect(() => {
    if (user?.perfil !== "admin") return;
    fetch("https://noisygrasshopper-n8n.cloudfy.live/webhook/unidades")
      .then((response) => {
        if (!response.ok) throw new Error("Erro ao carregar unidades");
        return response.json() as Promise<Unit[]>;
      })
      .then(setUnidades)
      .catch(() => toast.error("Não foi possível carregar as unidades"))
      .finally(() => setLoadingUnits(false));
  }, [user?.perfil]);

  if (user?.perfil !== "admin") return <Navigate to="/dashboard" replace />;

  function updateForm<K extends keyof UserForm>(field: K, value: UserForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setCreatedName("");
  }

  async function criarUsuario(event: React.FormEvent) {
    event.preventDefault();
    if (form.password.length < 6) {
      toast.error("A senha precisa ter no mínimo 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "https://noisygrasshopper-n8n.cloudfy.live/webhook/criar-usuario",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const text = await response.text();
      const data = text ? (JSON.parse(text) as { message?: string }) : {};
      if (!response.ok) throw new Error(data.message || "Erro ao criar usuário");

      setCreatedName(form.nome);
      setForm(emptyForm);
      toast.success("Usuário criado com sucesso");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      toast.error(
        message.includes("EMAIL_EXISTS")
          ? "Este e-mail já está cadastrado"
          : "Não foi possível criar o usuário"
      );
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength =
    form.password.length >= 8
      ? "Forte"
      : form.password.length >= 6
        ? "Boa"
        : "Mínimo de 6 caracteres";

  return (
    <AdminShell
      title="Gestão de usuários"
      description="Crie acessos individuais para atendentes e administradores, vinculados à unidade correta."
    >
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr] items-start">
        <section className="rounded-2xl border border-white/[0.07] bg-[#020617] overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-white/[0.06] flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold">Novo usuário</h2>
              <p className="text-xs text-slate-500 mt-1">
                Preencha os dados abaixo para liberar um novo acesso.
              </p>
            </div>
          </div>

          <form onSubmit={criarUsuario} className="p-5 sm:p-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Nome completo" htmlFor="user-name">
                <div className="relative">
                  <Users className="field-icon" />
                  <Input
                    id="user-name"
                    value={form.nome}
                    onChange={(event) => updateForm("nome", event.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Ex.: Mariana Souza"
                    className="admin-input pl-10"
                  />
                </div>
              </Field>
              <Field label="E-mail profissional" htmlFor="user-email">
                <div className="relative">
                  <Mail className="field-icon" />
                  <Input
                    id="user-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateForm("email", event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="nome@academia.com"
                    className="admin-input pl-10"
                  />
                </div>
              </Field>
            </div>

            <Field label="Senha temporária" htmlFor="user-password" hint={passwordStrength}>
              <div className="relative">
                <LockKeyhole className="field-icon" />
                <Input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => updateForm("password", event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Mínimo de 6 caracteres"
                  className="admin-input pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="h-1 rounded-full bg-slate-800 overflow-hidden mt-2">
                <div
                  className={cn(
                    "h-full transition-all",
                    form.password.length >= 8
                      ? "w-full bg-emerald-500"
                      : form.password.length >= 6
                        ? "w-2/3 bg-blue-500"
                        : form.password.length
                          ? "w-1/3 bg-amber-500"
                          : "w-0"
                  )}
                />
              </div>
            </Field>

            <div className="space-y-3">
              <Label className="text-xs text-slate-300">Nível de acesso</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <RoleCard
                  active={form.perfil === "atendente"}
                  icon={Users}
                  title="Atendente"
                  description="Acessa e responde conversas."
                  onClick={() => updateForm("perfil", "atendente")}
                />
                <RoleCard
                  active={form.perfil === "admin"}
                  icon={ShieldCheck}
                  title="Administrador"
                  description="Também gerencia configurações."
                  onClick={() => updateForm("perfil", "admin")}
                />
              </div>
            </div>

            <Field label="Unidade" htmlFor="user-unit">
              <Select
                value={form.unidade_id}
                onValueChange={(value) => updateForm("unidade_id", value)}
                disabled={loadingUnits}
                required
              >
                <SelectTrigger id="user-unit" className="admin-input">
                  <SelectValue
                    placeholder={loadingUnits ? "Carregando unidades..." : "Selecione uma unidade"}
                  />
                </SelectTrigger>
                <SelectContent className="bg-slate-950 border-white/10 text-white">
                  {unidades.map((unit) => (
                    <SelectItem
                      key={unit.id}
                      value={unit.id}
                      className="focus:bg-slate-800 focus:text-white"
                    >
                      {unit.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {createdName && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-300">Acesso criado</p>
                  <p className="text-xs text-emerald-400/70 mt-0.5">
                    {createdName} já pode entrar no painel.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-white/[0.06]">
              <p className="text-[11px] text-slate-500">
                O usuário receberá acesso à unidade selecionada.
              </p>
              <Button
                type="submit"
                disabled={loading || loadingUnits || !form.unidade_id}
                className="h-11 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 shadow-lg shadow-blue-950/30"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {loading ? "Criando acesso..." : "Criar usuário"}
              </Button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/[0.07] bg-[#020617] p-5">
            <Building2 className="w-5 h-5 text-blue-400 mb-4" />
            <h3 className="font-semibold text-sm">Vínculo por unidade</h3>
            <p className="text-xs leading-relaxed text-slate-500 mt-2">
              Cada acesso visualiza apenas as conversas e dados da unidade selecionada.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.04] p-5">
            <ShieldCheck className="w-5 h-5 text-amber-400 mb-4" />
            <h3 className="font-semibold text-sm">Permissões</h3>
            <ul className="text-xs leading-relaxed text-slate-500 mt-2 space-y-2">
              <li>
                <strong className="text-slate-300">Atendente:</strong> opera as conversas.
              </li>
              <li>
                <strong className="text-slate-300">Administrador:</strong> acessa conversas, planos,
                horários e usuários.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-3">
        <Label htmlFor={htmlFor} className="text-xs text-slate-300">
          {label}
        </Label>
        {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function RoleCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof Users;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-xl border p-4 transition flex gap-3",
        active
          ? "border-blue-500/60 bg-blue-500/10"
          : "border-white/[0.07] bg-slate-900/50 hover:border-white/15"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          active ? "bg-blue-500/20 text-blue-400" : "bg-slate-800 text-slate-500"
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
      </div>
    </button>
  );
}
