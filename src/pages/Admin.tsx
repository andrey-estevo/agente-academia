import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPlanos, updatePlano } from "@/services/firebasePlanos";
import { getHorarios, updateHorario } from "@/services/firebaseHorarios";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const navigate = useNavigate();

  const [planos, setPlanos] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const p = await getPlanos();
      const h = await getHorarios();

      setPlanos(p);
      setHorarios(h);
    }

    load();
  }, []);

  function handlePlanoChange(index: number, field: string, value: any) {
    const novos = [...planos];
    novos[index][field] = value;
    setPlanos(novos);
  }

  function handleHorarioChange(index: number, field: string, value: any) {
    const novos = [...horarios];
    novos[index][field] = value;
    setHorarios(novos);
  }

  async function salvarTudo() {
    try {
      setLoading(true);

      for (const plano of planos) {
        await updatePlano(plano.id, {
          nome: plano.nome,
          preco: Number(plano.preco)
        });
      }

      for (const h of horarios) {
        await updateHorario(h.id, {
          dia: h.dia,
          abre: h.abre,
          fecha: h.fecha,
          ativo: h.ativo ?? true,
          feriado: h.feriado ?? false
        });
      }

      alert("Tudo salvo 🚀");
    } catch {
      alert("Erro ao salvar ❌");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070F1F] px-4 py-5 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-2 text-sm text-gray-400 hover:text-white transition"
            >
              ← Voltar
            </button>

            <h1 className="text-xl sm:text-2xl font-semibold text-white">
              Painel Admin 💪
            </h1>

            <p className="text-sm text-gray-400">
              Gerencie planos e horários da unidade
            </p>
          </div>

          <Button
            onClick={salvarTudo}
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            {loading ? "Salvando..." : "Salvar Tudo"}
          </Button>
        </div>

        {/* PLANOS */}
        <div className="bg-[#020617] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl">
          <h2 className="text-white font-semibold mb-4">
            Planos
          </h2>

          <div className="space-y-4">
            {planos.map((p, i) => (
              <div
                key={p.id}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <Input
                  placeholder="Nome do plano"
                  value={p.nome}
                  onChange={(e) =>
                    handlePlanoChange(i, "nome", e.target.value)
                  }
                  className="h-11 bg-[#1e293b] border-none text-white placeholder:text-gray-400"
                />

                <Input
                  type="number"
                  placeholder="Preço"
                  value={p.preco}
                  onChange={(e) =>
                    handlePlanoChange(i, "preco", e.target.value)
                  }
                  className="h-11 bg-[#1e293b] border-none text-white placeholder:text-gray-400"
                />
              </div>
            ))}
          </div>
        </div>

        {/* HORÁRIOS */}
        <div className="bg-[#020617] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-xl">
          <h2 className="text-white font-semibold mb-4">
            Horários
          </h2>

          <div className="space-y-4">
            {horarios.map((h, i) => {
              const isFeriado = h.dia?.toLowerCase() === "feriado";

              return (
                <div
                  key={h.id}
                  className="rounded-xl border border-white/5 bg-[#0B1220] p-3 sm:p-0 sm:border-0 sm:bg-transparent"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:items-center">
                    <div className="space-y-1">
                      <span className="block sm:hidden text-[11px] text-gray-500">
                        Dia
                      </span>

                      <Input
                        value={isFeriado ? "Feriado (horário padrão)" : h.dia}
                        disabled
                        className="h-11 bg-[#0f172a] text-gray-400 font-medium cursor-not-allowed border-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block sm:hidden text-[11px] text-gray-500">
                        Abertura
                      </span>

                      <Input
                        placeholder="Abertura"
                        value={h.abre}
                        disabled={false}
                        onChange={(e) =>
                          handleHorarioChange(i, "abre", e.target.value)
                        }
                        className="h-11 bg-[#1e293b] border-none text-white placeholder:text-gray-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="block sm:hidden text-[11px] text-gray-500">
                        Fechamento
                      </span>

                      <Input
                        placeholder="Fechamento"
                        value={h.fecha}
                        onChange={(e) =>
                          handleHorarioChange(i, "fecha", e.target.value)
                        }
                        className="h-11 bg-[#1e293b] border-none text-white placeholder:text-gray-400"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-300 min-h-11">
                      <input
                        type="checkbox"
                        checked={h.ativo ?? true}
                        onChange={(e) =>
                          handleHorarioChange(i, "ativo", e.target.checked)
                        }
                        className="shrink-0"
                      />
                      Ativo
                    </label>

                    {/* NÃO MOSTRAR CHECKBOX NO FERIADO */}
                    {!isFeriado ? (
                      <label className="flex items-center gap-2 text-sm text-gray-300 min-h-11">
                        <input
                          type="checkbox"
                          checked={h.feriado ?? false}
                          onChange={(e) =>
                            handleHorarioChange(i, "feriado", e.target.checked)
                          }
                          className="shrink-0"
                        />
                        <span>Usar horário de feriado</span>
                      </label>
                    ) : (
                      <div className="hidden sm:block" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}