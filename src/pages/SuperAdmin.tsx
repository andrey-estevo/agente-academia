import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

type UnitStatus = "em_dia" | "inadimplente" | "trial" | "cancelado";
type ManagedUserRole = "admin" | "atendente";

interface ManagedUnit {
  id: string;
  nome: string;
  ativo: boolean;
  status_pagamento: UnitStatus;
  plano: string;
  instance_name?: string;
  numero_whatsapp?: string;
}

interface ManagedUser {
  id: string;
  nome: string;
  email: string;
  perfil: "super_admin" | ManagedUserRole;
  unidade_id: string;
  ativo: boolean;
}

interface UnitForm {
  id: string;
  nome: string;
  instance_name: string;
  numero_whatsapp: string;
  plano: string;
}

interface UserForm {
  nome: string;
  email: string;
  password: string;
  perfil: ManagedUserRole;
  unidade_id: string;
}

const emptyUnitForm: UnitForm = {
  id: "",
  nome: "",
  instance_name: "",
  numero_whatsapp: "",
  plano: "mensal"
};

const emptyUserForm: UserForm = {
  nome: "",
  email: "",
  password: "",
  perfil: "admin",
  unidade_id: ""
};

const statusLabels: Record<UnitStatus, string> = {
  em_dia: "Em dia",
  inadimplente: "Inadimplente",
  trial: "Teste",
  cancelado: "Cancelado"
};

export default function SuperAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [units, setUnits] = useState<ManagedUnit[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all");
  const [unitForm, setUnitForm] = useState<UnitForm>(emptyUnitForm);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const [unitSnap, userSnap] = await Promise.all([
        getDocs(collection(db, "unidades")),
        getDocs(collection(db, "usuarios"))
      ]);

      const loadedUnits = unitSnap.docs
        .map((item) => {
          const data = item.data();
          return {
            id: item.id,
            nome: String(data.nome || item.id),
            ativo: data.ativo !== false,
            status_pagamento: (data.status_pagamento || "em_dia") as UnitStatus,
            plano: String(data.plano || "mensal"),
            instance_name: data.instance_name ? String(data.instance_name) : "",
            numero_whatsapp: data.numero_whatsapp ? String(data.numero_whatsapp) : ""
          };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome));

      const loadedUsers = userSnap.docs
        .map((item) => {
          const data = item.data();
          return {
            id: item.id,
            nome: String(data.nome || "Usuário"),
            email: String(data.email || ""),
            perfil: (data.perfil || "atendente") as ManagedUser["perfil"],
            unidade_id: String(data.unidade_id || ""),
            ativo: data.ativo !== false
          };
        })
        .sort((a, b) => a.nome.localeCompare(b.nome));

      setUnits(loadedUnits);
      setUsers(loadedUsers);
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível carregar o painel master");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.perfil === "super_admin") void load();
  }, [load, user?.perfil]);

  const metrics = useMemo(() => {
    const customerUsers = users.filter((item) => item.perfil !== "super_admin");

    return {
      totalUnits: units.length,
      activeUnits: units.filter((item) => item.ativo).length,
      blockedUnits: units.filter((item) => !item.ativo).length,
      totalUsers: customerUsers.length,
      blockedUsers: customerUsers.filter((item) => !item.ativo).length
    };
  }, [units, users]);

  const filteredUnits = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return units;

    return units.filter((unit) =>
      `${unit.id} ${unit.nome} ${unit.instance_name || ""} ${unit.numero_whatsapp || ""}`
        .toLowerCase()
        .includes(needle)
    );
  }, [query, units]);

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return users.filter((item) => {
      if (item.perfil === "super_admin") return false;
      if (selectedUnitId !== "all" && item.unidade_id !== selectedUnitId) return false;
      if (!needle) return true;

      return `${item.nome} ${item.email} ${item.perfil} ${item.unidade_id}`.toLowerCase().includes(needle);
    });
  }, [query, selectedUnitId, users]);

  if (user?.perfil !== "super_admin") return <Navigate to="/dashboard" replace />;

  async function toggleUnit(unit: ManagedUnit, checked: boolean) {
    try {
      await updateDoc(doc(db, "unidades", unit.id), {
        ativo: checked,
        status_pagamento: checked && unit.status_pagamento === "inadimplente" ? "em_dia" : unit.status_pagamento
      });

      setUnits((current) =>
        current.map((item) =>
          item.id === unit.id
            ? {
                ...item,
                ativo: checked,
                status_pagamento: checked && item.status_pagamento === "inadimplente" ? "em_dia" : item.status_pagamento
              }
            : item
        )
      );

      toast.success(checked ? "Unidade ativada" : "Unidade inativada");
    } catch {
      toast.error("Não foi possível alterar a unidade");
    }
  }

  async function updateUnitStatus(unit: ManagedUnit, status: UnitStatus) {
    try {
      await updateDoc(doc(db, "unidades", unit.id), {
        status_pagamento: status,
        ativo: status === "inadimplente" || status === "cancelado" ? false : unit.ativo
      });

      setUnits((current) =>
        current.map((item) =>
          item.id === unit.id
            ? {
                ...item,
                status_pagamento: status,
                ativo: status === "inadimplente" || status === "cancelado" ? false : item.ativo
              }
            : item
        )
      );

      toast.success("Status da unidade atualizado");
    } catch {
      toast.error("Não foi possível atualizar o status");
    }
  }

  async function toggleUser(item: ManagedUser, checked: boolean) {
    if (item.id === user?.id) {
      toast.error("Você não pode inativar seu próprio acesso");
      return;
    }

    try {
      await updateDoc(doc(db, "usuarios", item.id), { ativo: checked });
      setUsers((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, ativo: checked } : candidate));
      toast.success(checked ? "Usuário ativado" : "Usuário inativado");
    } catch {
      toast.error("Não foi possível alterar o usuário");
    }
  }

  async function createUnit(event: React.FormEvent) {
    event.preventDefault();

    const unitId = unitForm.id.trim();
    if (!unitId) {
      toast.error("Informe o ID da unidade, exemplo: unidade_3");
      return;
    }

    try {
      setSaving(true);
      await setDoc(doc(db, "unidades", unitId), {
        nome: unitForm.nome.trim(),
        instance_name: unitForm.instance_name.trim(),
        numero_whatsapp: unitForm.numero_whatsapp.replace(/\D/g, ""),
        plano: unitForm.plano.trim() || "mensal",
        status_pagamento: "em_dia",
        ativo: true
      });

      setUnitForm(emptyUnitForm);
      toast.success("Unidade criada com sucesso");
      await load();
    } catch {
      toast.error("Não foi possível criar a unidade");
    } finally {
      setSaving(false);
    }
  }

  async function createUser(event: React.FormEvent) {
    event.preventDefault();

    if (userForm.password.length < 6) {
      toast.error("A senha precisa ter no mínimo 6 caracteres");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("https://noisygrasshopper-n8n.cloudfy.live/webhook/criar-usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...userForm,
          ativo: true
        })
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) as { message?: string } : {};
      if (!response.ok) throw new Error(data.message || "Erro ao criar usuário");

      setUserForm(emptyUserForm);
      toast.success("Usuário criado com sucesso");
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast.error(message.includes("EMAIL_EXISTS") ? "Este e-mail já está cadastrado" : "Não foi possível criar o usuário");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUserAccess() {
    if (!deleteTarget) return;

    if (deleteTarget.id === user?.id) {
      toast.error("Você não pode excluir seu próprio acesso");
      setDeleteTarget(null);
      return;
    }

    try {
      await deleteDoc(doc(db, "usuarios", deleteTarget.id));
      setUsers((current) => current.filter((item) => item.id !== deleteTarget.id));
      toast.success("Acesso removido do sistema");
    } catch {
      toast.error("Não foi possível remover o acesso");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#070F1F] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#020617]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-[env(safe-area-inset-top)] min-h-16 flex items-center gap-3">
          <button type="button" onClick={() => navigate("/dashboard")} aria-label="Voltar ao atendimento" className="w-10 h-10 rounded-xl border border-white/[0.08] bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight">Super Admin</p>
            <p className="text-[11px] text-slate-500 truncate">Gestão geral do sistema</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={load} disabled={loading} className="hidden sm:flex h-10 rounded-xl bg-slate-900 text-slate-200 hover:bg-slate-800 border border-white/[0.08]">
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} /> Atualizar
            </Button>
            <Button type="button" variant="secondary" onClick={() => { logout(); navigate("/"); }} className="h-10 rounded-xl bg-slate-900 text-slate-200 hover:bg-slate-800 border border-white/[0.08]">
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-blue-400 mb-1">Painel master</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Unidades e acessos</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">Controle academias, pagamento, bloqueios e usuários vinculados a cada unidade.</p>
          </div>
          <div className="relative w-full lg:w-[340px]">
            <Search className="field-icon" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar unidade, usuário ou e-mail" className="admin-input pl-10" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
          <MetricCard icon={Building2} label="Unidades" value={metrics.totalUnits} />
          <MetricCard icon={CheckCircle2} label="Ativas" value={metrics.activeUnits} tone="emerald" />
          <MetricCard icon={XCircle} label="Bloqueadas" value={metrics.blockedUnits} tone="red" />
          <MetricCard icon={Users} label="Usuários" value={metrics.totalUsers} />
          <MetricCard icon={LockKeyhole} label="Usuários inativos" value={metrics.blockedUsers} tone="amber" />
        </div>

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] animate-pulse">
            <div className="h-[520px] rounded-2xl bg-slate-900" />
            <div className="h-[520px] rounded-2xl bg-slate-900" />
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr] items-start">
            <section className="space-y-5">
              <Panel title="Unidades cadastradas" description="Inative uma unidade para bloquear todos os usuários dela.">
                <div className="space-y-3">
                  {filteredUnits.length === 0 ? <EmptyState text="Nenhuma unidade encontrada" /> : filteredUnits.map((unit) => (
                    <div key={unit.id} className="rounded-2xl border border-white/[0.07] bg-slate-900/50 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold truncate">{unit.nome}</h3>
                            <StatusPill active={unit.ativo} />
                            <span className="rounded-full border border-white/[0.08] bg-slate-950 px-2.5 py-1 text-[10px] text-slate-400">{statusLabels[unit.status_pagamento] || unit.status_pagamento}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{unit.id} {unit.instance_name ? `• ${unit.instance_name}` : ""}</p>
                          <p className="text-xs text-slate-500 mt-1">WhatsApp: {unit.numero_whatsapp || "não informado"} • Plano: {unit.plano || "mensal"}</p>
                        </div>
                        <div className="flex flex-col sm:items-end gap-3">
                          <label className="flex items-center gap-2 text-xs text-slate-300">
                            <Switch checked={unit.ativo} onCheckedChange={(checked) => void toggleUnit(unit, checked)} className="data-[state=unchecked]:bg-slate-700" />
                            {unit.ativo ? "Ativa" : "Inativa"}
                          </label>
                          <Select value={unit.status_pagamento} onValueChange={(value) => void updateUnitStatus(unit, value as UnitStatus)}>
                            <SelectTrigger className="h-9 w-full sm:w-40 rounded-xl bg-slate-950 border-white/[0.08] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950 border-white/10 text-white">
                              {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Criar nova unidade" description="Use um ID simples, como unidade_3. Esse ID será usado para vincular usuários e dados.">
                <form onSubmit={createUnit} className="grid sm:grid-cols-2 gap-4">
                  <Field label="ID da unidade" htmlFor="unit-id">
                    <Input id="unit-id" value={unitForm.id} onChange={(event) => setUnitForm((current) => ({ ...current, id: event.target.value }))} placeholder="unidade_3" required className="admin-input" />
                  </Field>
                  <Field label="Nome da academia" htmlFor="unit-name">
                    <Input id="unit-name" value={unitForm.nome} onChange={(event) => setUnitForm((current) => ({ ...current, nome: event.target.value }))} placeholder="Sky Fit Centro" required className="admin-input" />
                  </Field>
                  <Field label="Instance name" htmlFor="unit-instance">
                    <Input id="unit-instance" value={unitForm.instance_name} onChange={(event) => setUnitForm((current) => ({ ...current, instance_name: event.target.value }))} placeholder="skyfit" className="admin-input" />
                  </Field>
                  <Field label="WhatsApp" htmlFor="unit-phone">
                    <Input id="unit-phone" value={unitForm.numero_whatsapp} onChange={(event) => setUnitForm((current) => ({ ...current, numero_whatsapp: event.target.value }))} placeholder="5519999999999" className="admin-input" />
                  </Field>
                  <Field label="Plano" htmlFor="unit-plan">
                    <Input id="unit-plan" value={unitForm.plano} onChange={(event) => setUnitForm((current) => ({ ...current, plano: event.target.value }))} className="admin-input" />
                  </Field>
                  <div className="flex items-end">
                    <Button type="submit" disabled={saving} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500">
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                      Criar unidade
                    </Button>
                  </div>
                </form>
              </Panel>
            </section>

            <section className="space-y-5">
              <Panel title="Usuários por unidade" description="Inative funcionários desligados ou remova o acesso do Firestore.">
                <div className="mb-4">
                  <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                    <SelectTrigger className="admin-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-white/10 text-white">
                      <SelectItem value="all">Todas as unidades</SelectItem>
                      {units.map((unit) => <SelectItem key={unit.id} value={unit.id}>{unit.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {filteredUsers.length === 0 ? <EmptyState text="Nenhum usuário encontrado" /> : filteredUsers.map((item) => {
                    const unit = units.find((candidate) => candidate.id === item.unidade_id);
                    return (
                      <div key={item.id} className="rounded-2xl border border-white/[0.07] bg-slate-900/50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            {item.perfil === "admin" ? <ShieldCheck className="w-5 h-5 text-blue-400" /> : <Users className="w-5 h-5 text-slate-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-sm truncate">{item.nome}</h3>
                              <StatusPill active={item.ativo} />
                            </div>
                            <p className="text-xs text-slate-400 mt-1 truncate">{item.email}</p>
                            <p className="text-[11px] text-slate-500 mt-1">{item.perfil === "admin" ? "Administrador" : "Atendente"} • {unit?.nome || item.unidade_id || "sem unidade"}</p>
                          </div>
                          <div className="flex flex-col items-end gap-3">
                            <Switch checked={item.ativo} onCheckedChange={(checked) => void toggleUser(item, checked)} className="data-[state=unchecked]:bg-slate-700" />
                            <button type="button" onClick={() => setDeleteTarget(item)} className="text-slate-500 hover:text-red-400 transition" aria-label={`Remover ${item.nome}`}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Criar acesso" description="Cria o login no Authentication via n8n e vincula o usuário à unidade.">
                <form onSubmit={createUser} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Nome" htmlFor="new-user-name">
                      <Input id="new-user-name" value={userForm.nome} onChange={(event) => setUserForm((current) => ({ ...current, nome: event.target.value }))} required className="admin-input" />
                    </Field>
                    <Field label="E-mail" htmlFor="new-user-email">
                      <div className="relative">
                        <Mail className="field-icon" />
                        <Input id="new-user-email" type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} required className="admin-input pl-10" />
                      </div>
                    </Field>
                  </div>
                  <Field label="Senha temporária" htmlFor="new-user-password">
                    <div className="relative">
                      <LockKeyhole className="field-icon" />
                      <Input id="new-user-password" type={showPassword ? "text" : "password"} value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} minLength={6} required className="admin-input pl-10 pr-11" />
                      <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Perfil" htmlFor="new-user-role">
                      <Select value={userForm.perfil} onValueChange={(value) => setUserForm((current) => ({ ...current, perfil: value as ManagedUserRole }))}>
                        <SelectTrigger id="new-user-role" className="admin-input"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-slate-950 border-white/10 text-white">
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="atendente">Atendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Unidade" htmlFor="new-user-unit">
                      <Select value={userForm.unidade_id} onValueChange={(value) => setUserForm((current) => ({ ...current, unidade_id: value }))} required>
                        <SelectTrigger id="new-user-unit" className="admin-input"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent className="bg-slate-950 border-white/10 text-white">
                          {units.map((unit) => <SelectItem key={unit.id} value={unit.id}>{unit.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Button type="submit" disabled={saving || !userForm.unidade_id} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Criar acesso
                  </Button>
                </form>
              </Panel>
            </section>
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Isso remove o documento do usuário no Firestore e bloqueia o login no sistema. O registro no Firebase Authentication pode continuar existindo até ser removido por backend/Admin SDK.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-900 border-white/10 text-white hover:bg-slate-800">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUserAccess} className="bg-red-600 hover:bg-red-500">Remover acesso</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone = "blue" }: { icon: LucideIcon; label: string; value: number; tone?: "blue" | "emerald" | "red" | "amber" }) {
  const tones = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#020617] p-4">
      <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center mb-4", tones[tone])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#020617] overflow-hidden">
      <div className="p-5 border-b border-white/[0.06]">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-xs text-slate-300">{label}</Label>
      {children}
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold", active ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300")}>
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-10 text-center rounded-2xl border border-dashed border-white/[0.08] bg-slate-900/30">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
