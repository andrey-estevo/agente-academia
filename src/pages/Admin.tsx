import { useCallback, useEffect, useState } from "react";
import { getPlanos, updatePlano } from "@/services/firebasePlanos";
import { getHorarios, updateHorario } from "@/services/firebaseHorarios";
import { AdminShell } from "@/components/AdminShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CalendarClock, CircleDollarSign, Clock3, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface Plano {
  id: string;
  nome: string;
  preco: number | string;
}

interface Horario {
  id: string;
  dia: string;
  abre: string;
  fecha: string;
  ativo?: boolean;
  feriado?: boolean;
}

export default function Admin() {
  const { user } = useAuth();
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [plansData, schedulesData] = await Promise.all([getPlanos(), getHorarios()]);
      setPlanos(plansData as Plano[]);
      setHorarios(schedulesData as Horario[]);
      setDirty(false);
    } catch {
      toast.error("Não foi possível carregar as configurações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.perfil === "admin") void load();
  }, [load, user?.perfil]);

  if (user?.perfil !== "admin") return <Navigate to="/dashboard" replace />;

  function handlePlanoChange(index: number, field: keyof Plano, value: string) {
    setPlanos((current) => current.map((plano, position) => position === index ? { ...plano, [field]: value } : plano));
    setDirty(true);
  }

  function handleHorarioChange(index: number, field: keyof Horario, value: string | boolean) {
    setHorarios((current) => current.map((horario, position) => position === index ? { ...horario, [field]: value } : horario));
    setDirty(true);
  }

  async function salvarTudo() {
    try {
      setSaving(true);
      await Promise.all([
        ...planos.map((plano) => updatePlano(plano.id, { nome: plano.nome.trim(), preco: Number(plano.preco) })),
        ...horarios.map((horario) => updateHorario(horario.id, { dia: horario.dia, abre: horario.abre, fecha: horario.fecha, ativo: horario.ativo ?? true, feriado: horario.feriado ?? false }))
      ]);
      setDirty(false);
      toast.success("Configurações salvas com sucesso");
    } catch {
      toast.error("Erro ao salvar as configurações");
    } finally {
      setSaving(false);
    }
  }

  const saveButton = (
    <Button onClick={salvarTudo} disabled={saving || loading || !dirty} className="w-full sm:w-auto h-11 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-950/30 disabled:shadow-none">
      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
      {saving ? "Salvando..." : dirty ? "Salvar alterações" : "Tudo salvo"}
    </Button>
  );

  return (
    <AdminShell title="Planos e horários" description="Atualize os planos comerciais e o funcionamento da academia. As alterações só entram em vigor depois de salvar." action={saveButton}>
      {loading ? (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.4fr] animate-pulse">
          <div className="h-72 rounded-2xl bg-slate-900" />
          <div className="h-[480px] rounded-2xl bg-slate-900" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.4fr] items-start">
          <section className="rounded-2xl border border-white/[0.07] bg-[#020617] overflow-hidden">
            <div className="p-5 border-b border-white/[0.06] flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0"><CircleDollarSign className="w-5 h-5 text-emerald-400" /></div>
              <div><h2 className="font-semibold">Planos</h2><p className="text-xs text-slate-500 mt-0.5">Nome e mensalidade exibidos pelo atendimento.</p></div>
            </div>
            <div className="p-5 space-y-5">
              {planos.length === 0 ? <EmptyState icon={CircleDollarSign} text="Nenhum plano cadastrado" /> : planos.map((plano, index) => (
                <div key={plano.id} className="rounded-xl bg-slate-900/60 border border-white/[0.05] p-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plano {index + 1}</span></div>
                  <div className="space-y-2"><Label htmlFor={`plan-name-${plano.id}`} className="text-xs text-slate-300">Nome do plano</Label><Input id={`plan-name-${plano.id}`} value={plano.nome || ""} onChange={(event) => handlePlanoChange(index, "nome", event.target.value)} className="h-11 bg-slate-800 border-white/[0.07] text-white rounded-xl" /></div>
                  <div className="space-y-2"><Label htmlFor={`plan-price-${plano.id}`} className="text-xs text-slate-300">Mensalidade</Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">R$</span><Input id={`plan-price-${plano.id}`} type="number" min="0" step="0.01" value={plano.preco ?? ""} onChange={(event) => handlePlanoChange(index, "preco", event.target.value)} className="h-11 pl-10 bg-slate-800 border-white/[0.07] text-white rounded-xl" /></div></div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/[0.07] bg-[#020617] overflow-hidden">
            <div className="p-5 border-b border-white/[0.06] flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0"><CalendarClock className="w-5 h-5 text-blue-400" /></div>
              <div className="flex-1"><h2 className="font-semibold">Horários de funcionamento</h2><p className="text-xs text-slate-500 mt-0.5">Defina os períodos usados nas respostas automáticas.</p></div>
              <button type="button" onClick={load} aria-label="Recarregar horários" className="p-2 rounded-lg text-slate-500 hover:bg-white/5 hover:text-white"><RotateCcw className="w-4 h-4" /></button>
            </div>
            <div className="p-3 sm:p-5 space-y-2">
              {horarios.length === 0 ? <EmptyState icon={Clock3} text="Nenhum horário cadastrado" /> : horarios.map((horario, index) => {
                const isHoliday = horario.dia?.toLowerCase() === "feriado";
                return (
                  <div key={horario.id} className="rounded-xl border border-white/[0.06] bg-slate-900/50 p-4">
                    <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                      <div className="xl:w-32"><p className="font-medium text-sm">{isHoliday ? "Feriado" : horario.dia}</p><p className="text-[11px] text-slate-500 mt-0.5">{horario.ativo ?? true ? "Funcionando" : "Fechado"}</p></div>
                      <div className="grid grid-cols-2 gap-3 flex-1">
                        <div className="space-y-1.5"><Label htmlFor={`open-${horario.id}`} className="text-[11px] text-slate-500">Abertura</Label><Input id={`open-${horario.id}`} type="time" value={horario.abre || ""} disabled={!(horario.ativo ?? true)} onChange={(event) => handleHorarioChange(index, "abre", event.target.value)} className="h-10 bg-slate-800 border-white/[0.07] text-white rounded-lg disabled:opacity-40" /></div>
                        <div className="space-y-1.5"><Label htmlFor={`close-${horario.id}`} className="text-[11px] text-slate-500">Fechamento</Label><Input id={`close-${horario.id}`} type="time" value={horario.fecha || ""} disabled={!(horario.ativo ?? true)} onChange={(event) => handleHorarioChange(index, "fecha", event.target.value)} className="h-10 bg-slate-800 border-white/[0.07] text-white rounded-lg disabled:opacity-40" /></div>
                      </div>
                      <div className="flex xl:flex-col gap-4 xl:gap-2 xl:w-40">
                        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"><Switch checked={horario.ativo ?? true} onCheckedChange={(checked) => handleHorarioChange(index, "ativo", checked)} className="data-[state=unchecked]:bg-slate-700" /> Aberto</label>
                        {!isHoliday && <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer"><Switch checked={horario.feriado ?? false} onCheckedChange={(checked) => handleHorarioChange(index, "feriado", checked)} className="data-[state=checked]:bg-violet-600 data-[state=unchecked]:bg-slate-700" /> Usar feriado</label>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {dirty && <div className="sticky bottom-3 mt-5 rounded-2xl border border-blue-500/20 bg-slate-950/95 backdrop-blur-xl p-3 shadow-2xl flex items-center gap-3 sm:hidden"><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /><p className="text-xs text-slate-300 flex-1">Há alterações não salvas</p>{saveButton}</div>}
    </AdminShell>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Clock3; text: string }) {
  return <div className="py-12 text-center"><Icon className="w-6 h-6 text-slate-600 mx-auto mb-2" /><p className="text-sm text-slate-500">{text}</p></div>;
}
