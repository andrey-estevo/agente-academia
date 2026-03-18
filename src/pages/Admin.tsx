import { useEffect, useState } from "react";
import { getPlanos, updatePlano } from "@/services/firebasePlanos";
import { getHorarios, updateHorario } from "@/services/firebaseHorarios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Admin() {

  const [planos, setPlanos] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);

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

    // salvar planos
    for (const plano of planos) {
      await updatePlano(plano.id, {
        nome: plano.nome,
        preco: Number(plano.preco),
      });
    }

    // salvar horários
    for (const h of horarios) {
      await updateHorario(h.id, {
        dia: h.dia,
        abre: h.abre,
        fecha: h.fecha,
        ativo: h.ativo ?? true
      });
    }

    alert("Tudo salvo 🚀");
  }

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">
        Painel Admin 💪
      </h1>

      {/* PLANOS */}
      <Card>
        <CardHeader>
          <CardTitle>Planos</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {planos.map((p, i) => (
            <div key={p.id} className="flex gap-3">

              <Input
                value={p.nome}
                onChange={(e) =>
                  handlePlanoChange(i, "nome", e.target.value)
                }
              />

              <Input
                type="number"
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
            <div key={h.id} className="flex gap-3 items-center">

              <Input
                value={h.dia}
                onChange={(e) =>
                  handleHorarioChange(i, "dia", e.target.value)
                }
              />

              <Input
                value={h.abre}
                onChange={(e) =>
                  handleHorarioChange(i, "abre", e.target.value)
                }
              />

              <Input
                value={h.fecha}
                onChange={(e) =>
                  handleHorarioChange(i, "fecha", e.target.value)
                }
              />

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

            </div>
          ))}

        </CardContent>
      </Card>

      <Button onClick={salvarTudo} className="w-full">
        Salvar tudo
      </Button>

    </div>
  );
}