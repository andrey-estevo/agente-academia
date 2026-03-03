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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-4">
            <MessageSquare className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Painel de Atendimento</h1>
          <p className="text-muted-foreground mt-1">WhatsApp para Academias</p>
        </div>

        <div className="bg-card rounded-xl border p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="atendente@suaacademia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-destructive text-center"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-medium mb-2">Contas de demonstração:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>atendente1@fitmax.com — FitMax Centro</p>
              <p>atendente2@fitmax.com — FitMax Zona Sul</p>
              <p>atendente3@fitmax.com — FitMax Zona Norte</p>
              <p className="italic mt-1">Qualquer senha funciona</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
