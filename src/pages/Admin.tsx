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
          preco: Number(plano.preco),
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
    <div className="min-h-screen bg-[#070F1F] p-6">

      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">

          <div>
            <button
              onClick={() => navigate(-1)}
              className="mb-2 text-sm text-gray-400 hover:text-white transition"
            >
              ← Voltar
            </button>

            <h1 className="text-2xl font-semibold text-white">
              Painel Admin 💪
            </h1>

            <p className="text-sm text-gray-400">
              Gerencie planos e horários da unidade
            </p>
          </div>

          <Button
            onClick={salvarTudo}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            {loading ? "Salvando..." : "Salvar Tudo"}
          </Button>

        </div>

        {/* PLANOS */}
        <div className="bg-[#020617] border border-white/5 rounded-2xl p-5 shadow-xl">

          <h2 className="text-white font-semibold mb-4">
            Planos
          </h2>

          <div className="space-y-4">

            {planos.map((p, i) => (
              <div key={p.id} className="grid grid-cols-2 gap-3">

                <Input
                  placeholder="Nome do plano"
                  value={p.nome}
                  onChange={(e) =>
                    handlePlanoChange(i, "nome", e.target.value)
                  }
                  className="bg-[#1e293b] border-none text-white placeholder:text-gray-400"
                />

                <Input
                  type="number"
                  placeholder="Preço"
                  value={p.preco}
                  onChange={(e) =>
                    handlePlanoChange(i, "preco", e.target.value)
                  }
                  className="bg-[#1e293b] border-none text-white placeholder:text-gray-400"
                />

              </div>
            ))}

          </div>

        </div>

        {/* HORÁRIOS */}
        <div className="bg-[#020617] border border-white/5 rounded-2xl p-5 shadow-xl">

          <h2 className="text-white font-semibold mb-4">
            Horários
          </h2>

          <div className="space-y-4">

            {horarios.map((h, i) => {

              const isFeriado = h.dia?.toLowerCase() === "feriado";

              return (
                <div key={h.id} className="grid grid-cols-5 gap-3 items-center">

                  <Input
                    value={isFeriado ? "Feriado (horário padrão)" : h.dia}
                    disabled
                    className="bg-[#0f172a] text-gray-400 font-medium cursor-not-allowed border-none"
                  />

                  <Input
                    placeholder="Abertura"
                    value={h.abre}
                    disabled={false}
                    onChange={(e) =>
                      handleHorarioChange(i, "abre", e.target.value)
                    }
                    className="bg-[#1e293b] border-none text-white placeholder:text-gray-400"
                  />

                  <Input
                    placeholder="Fechamento"
                    value={h.fecha}
                    onChange={(e) =>
                      handleHorarioChange(i, "fecha", e.target.value)
                    }
                    className="bg-[#1e293b] border-none text-white placeholder:text-gray-400"
                  />

                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={h.ativo ?? true}
                      onChange={(e) =>
                        handleHorarioChange(i, "ativo", e.target.checked)
                      }
                    />
                    Ativo
                  </label>

                  {/* 🔥 NÃO MOSTRAR CHECKBOX NO FERIADO */}
                  {!isFeriado && (
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={h.feriado ?? false}
                        onChange={(e) =>
                          handleHorarioChange(i, "feriado", e.target.checked)
                        }
                      />
                      Usar horário de feriado
                    </label>
                  )}

                </div>
              );
            })}

          </div>

        </div>

      </div>

    </div>
  );
}