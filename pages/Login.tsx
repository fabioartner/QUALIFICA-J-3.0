
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQualificaStore } from '../store';
import { Lock, Mail, RefreshCcw, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, usuarios, resetData } = useQualificaStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }

    const success = login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Credenciais incorretas. Tente novamente ou use o Acesso Rápido.');
    }
  };

  const handleQuickLogin = (userEmail: string) => {
    setError('');
    const success = login(userEmail, '12345678');
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-10 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-10 flex flex-col items-center">
          <Logo iconSize={48} textSize="text-3xl" className="mb-2" />
          <p className="text-gray-400 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">Auditoria e Consultoria Digital</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-medium text-sm"
                placeholder="exemplo@qualificaja.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-medium text-sm"
                placeholder="********"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
          >
            ENTRAR NO SISTEMA
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-gray-50">
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Acesso Rápido para Testes</p>
            <button 
              onClick={() => { resetData(); window.location.reload(); }}
              className="text-[9px] flex items-center gap-1 text-gray-300 hover:text-red-500 font-bold transition-colors uppercase"
            >
              <RefreshCcw size={10} /> Resetar Banco
            </button>
          </div>
          <div className="space-y-2">
            {usuarios.slice(0, 3).map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u.email)}
                className="w-full text-left p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all flex justify-between items-center group border border-transparent hover:border-primary/10"
              >
                <div>
                  <p className="text-xs font-black text-gray-700">{u.nome}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{u.email}</p>
                </div>
                <span className="text-[9px] font-black bg-white px-2.5 py-1 rounded-lg border border-gray-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all uppercase tracking-tighter">
                  {u.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-8 text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">Qualifica Já • v1.0</p>
    </div>
  );
};

export default Login;
