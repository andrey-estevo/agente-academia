import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

export default function AdminUsuarios() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    perfil: "atendente",
    unidade_id: ""
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [unidades, setUnidades] = useState<any[]>([]);

  useEffect(() => {
    fetch("https://noisygrasshopper-n8n.cloudfy.live/webhook/unidades")
      .then((res) => res.json())
      .then((data) => setUnidades(data))
      .catch(() => setUnidades([]));
  }, []);

  if (user?.perfil !== "admin") {
    return <Navigate to="/" />;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function criarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    if (form.password.length < 6) {
      setMsg("Senha precisa ter no mínimo 6 caracteres ❌");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "https://noisygrasshopper-n8n.cloudfy.live/webhook/criar-usuario",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(data?.message || "Erro ao criar usuário");
      }

      setMsg("Usuário criado com sucesso ✅");

      setForm({
        nome: "",
        email: "",
        password: "",
        perfil: "atendente",
        unidade_id: ""
      });
    } catch (err: any) {
      if (err.message?.includes("EMAIL_EXISTS")) {
        setMsg("Email já existe ❌");
      } else {
        setMsg("Erro ao criar usuário ❌");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070F1F] flex items-center justify-center px-4 py-6 sm:p-6">
      {/* CARD */}
      <div className="w-full max-w-xl bg-[#020617] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl">
        {/* HEADER */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-xl font-semibold text-white">
            👤 Criar Usuário
          </h1>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="self-start sm:self-auto text-sm text-gray-400 hover:text-white transition"
          >
            ← Voltar
          </button>
        </div>

        <form onSubmit={criarUsuario} className="space-y-4">
          <Input
            placeholder="Nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
            className="h-11 bg-[#1e293b] border-none text-white placeholder:text-gray-400"
          />

          <Input
            placeholder="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="h-11 bg-[#1e293b] border-none text-white placeholder:text-gray-400"
          />

          <Input
            placeholder="Senha"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            className="h-11 bg-[#1e293b] border-none text-white placeholder:text-gray-400"
          />

          <select
            name="perfil"
            value={form.perfil}
            onChange={handleChange}
            className="w-full h-11 px-3 rounded-md bg-[#1e293b] text-white border-none outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="atendente">Atendente</option>
            <option value="admin">Admin</option>
          </select>

          <select
            name="unidade_id"
            value={form.unidade_id}
            onChange={handleChange}
            required
            className="w-full h-11 px-3 rounded-md bg-[#1e293b] text-white border-none outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione a unidade</option>

            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-60"
          >
            {loading ? "Criando usuário..." : "Criar Usuário"}
          </button>

          {msg && (
            <p className="text-sm text-center mt-2 text-gray-300 break-words">
              {msg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}