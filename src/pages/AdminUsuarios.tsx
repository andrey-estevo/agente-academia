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

  // 🔥 busca unidades automático
  useEffect(() => {
    fetch("https://noisygrasshopper-n8n.cloudfy.live/webhook/unidades")
      .then(res => res.json())
      .then(data => setUnidades(data))
      .catch(() => setUnidades([]));
  }, []);

  // 🔒 PROTEÇÃO
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

      const res = await fetch("https://noisygrasshopper-n8n.cloudfy.live/webhook/criar-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

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
    <div className="p-6 max-w-xl mx-auto text-black">

      {/* 🔥 BOTÃO VOLTAR */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
      >
        ← Voltar
      </button>

      <h1 className="text-2xl font-bold mb-6">
        👤 Criar Usuário
      </h1>

      <form onSubmit={criarUsuario} className="space-y-4">

        <Input
          placeholder="Nome"
          name="nome"
          value={form.nome}
          onChange={handleChange}
          required
          className="bg-zinc-900 text-white border border-zinc-700 placeholder:text-zinc-400"
        />

        <Input
          placeholder="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
          className="bg-zinc-900 text-white border border-zinc-700 placeholder:text-zinc-400"
        />

        <Input
          placeholder="Senha"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
          className="bg-zinc-900 text-white border border-zinc-700 placeholder:text-zinc-400"
        />

        <select
          name="perfil"
          value={form.perfil}
          onChange={handleChange}
          className="w-full p-2 rounded bg-zinc-900 text-white border border-zinc-700"
        >
          <option value="atendente">Atendente</option>
          <option value="admin">Admin</option>
        </select>

        <select
          name="unidade_id"
          value={form.unidade_id}
          onChange={handleChange}
          required
          className="w-full p-3 rounded bg-zinc-900 text-white border border-zinc-700"
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold"
        >
          {loading ? "Criando usuário..." : "Criar Usuário"}
        </button>

        {msg && (
          <p className="text-sm text-center mt-2">
            {msg}
          </p>
        )}

      </form>
    </div>
  );
}