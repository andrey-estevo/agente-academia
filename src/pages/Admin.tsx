import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPlanos, updatePlano } from "@/services/firebasePlanos";
import { getHorarios, updateHorario } from "@/services/firebaseHorarios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-2 text-sm text-gray-500 hover:text-black"
          >
            ← Voltar
          </button>

          <h1 className="text-2xl font-bold">
            Painel Admin 💪
          </h1>

          <p className="text-sm text-gray-500">
            Gerencie planos e horários da unidade
          </p>
        </div>

        <Button
          onClick={salvarTudo}
          disabled={loading}
          className="bg-[#0B3CFF] text-white"
        >
          {loading ? "Salvando..." : "Salvar Tudo"}
        </Button>

      </div>

      {/* PLANOS */}
      <Card>
        <CardHeader>
          <CardTitle>Planos</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {planos.map((p, i) => (
            <div key={p.id} className="grid grid-cols-2 gap-3">

              <Input
                placeholder="Nome do plano"
                value={p.nome}
                onChange={(e) =>
                  handlePlanoChange(i, "nome", e.target.value)
                }
              />

              <Input
                type="number"
                placeholder="Preço"
                value={p.preco}
                onChange={(e) =>
                  handlePlanoChange(i, "preco", e.target.value)
                }
              />

            </div>
          ))}

        </CardContent>
      </Card>

      {/* HORÁRIOS */}
      <Card>
        <CardHeader>
          <CardTitle>Horários</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {horarios.map((h, i) => (
            <div key={h.id} className="grid grid-cols-5 gap-3 items-center">

              {/* 🔒 DIA TRAVADO */}
              <Input
                value={h.dia}
                disabled
                className="bg-gray-200 text-gray-600 font-medium cursor-not-allowed"
              />

              <Input
                placeholder="Abertura"
                value={h.abre}
                onChange={(e) =>
                  handleHorarioChange(i, "abre", e.target.value)
                }
              />

              <Input
                placeholder="Fechamento"
                value={h.fecha}
                onChange={(e) =>
                  handleHorarioChange(i, "fecha", e.target.value)
                }
              />

              {/* ATIVO */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={h.ativo}
                  onChange={(e) =>
                    handleHorarioChange(i, "ativo", e.target.checked)
                  }
                />
                Ativo
              </label>

              {/* FERIADO */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={h.feriado ?? false}
                  onChange={(e) =>
                    handleHorarioChange(i, "feriado", e.target.checked)
                  }
                />
                Feriado
              </label>

            </div>
          ))}

        </CardContent>
      </Card>

    </div>
  );
}