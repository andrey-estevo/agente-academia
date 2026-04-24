import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);
    setLoading(false);

    if (success) {
      navigate('/dashboard');
    } else {
      setError('Email ou senha inválidos');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070F1F] p-4 relative overflow-hidden">

      {/* FUNDO COM LOGO */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src="/logo-sky.png"
          className="w-[500px] opacity-[0.04]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >

        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white">
            Painel de Atendimento
          </h1>

          <p className="text-gray-400 mt-1 text-sm">
            WhatsApp para Academias
          </p>
        </div>

        {/* CARD */}
        <div className="bg-[#020617] border border-white/5 rounded-2xl p-8 shadow-2xl backdrop-blur">

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* EMAIL */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                <Input
                  id="email"
                  type="email"
                  placeholder="atendente@suaacademia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[#1e293b] border-none text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* SENHA */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Senha
              </Label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-[#1e293b] border-none text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* ERRO */}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-400 text-center"
              >
                {error}
              </motion.p>
            )}

            {/* BOTÃO */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>

          </form>

          {/* DEMO */}
          <div className="mt-6 p-4 bg-[#1e293b] rounded-lg border border-white/5">
            <p className="text-xs text-gray-300 font-medium mb-2">
              Contas de demonstração:
            </p>

            <div className="space-y-1 text-xs text-gray-400">
              <p>atendente1@fitmax.com — FitMax Centro</p>
              <p>atendente2@fitmax.com — FitMax Zona Sul</p>
              <p>atendente3@fitmax.com — FitMax Zona Norte</p>
              <p className="italic mt-1 text-gray-500">
                Qualquer senha funciona
              </p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Login;