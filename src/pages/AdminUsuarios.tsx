import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminUsuarios() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    perfil: "atendente",
    unidade_id: ""
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // 🔒 PROTEÇÃO: só admin acessa
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
    <div className="p-6 max-w-xl mx-auto text-white">

      <h1 className="text-2xl font-bold mb-6">👤 Criar Usuário</h1>

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

        <Input
          placeholder="Unidade ID"
          name="unidade_id"
          value={form.unidade_id}
          onChange={handleChange}
          required
          className="bg-zinc-900 text-white border border-zinc-700 placeholder:text-zinc-400"
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Criando usuário..." : "Criar Usuário"}
        </Button>

        {msg && (
          <p className="text-sm text-center mt-2">
            {msg}
          </p>
        )}

      </form>
    </div>
  );
}