
import React, { useState } from 'react';
import { useQualificaStore } from '../store';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  User, 
  Mail, 
  Shield, 
  X, 
  Check, 
  LayoutGrid, 
  List, 
  CheckCircle2,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import { Usuario, Role } from '../types';

const Users: React.FC = () => {
  const { usuarios, upsertUsuario, currentUser } = useQualificaStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '12345678',
    role: 'AUDITOR' as Role,
    ativo: true,
  });

  const handleOpenModal = (user?: Usuario) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nome: user.nome,
        email: user.email,
        senha: user.senha || '12345678',
        role: user.role,
        ativo: user.ativo,
      });
    } else {
      setEditingUser(null);
      setFormData({
        nome: '',
        email: '',
        senha: '12345678',
        role: 'AUDITOR',
        ativo: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome.trim() || !formData.email.trim()) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    const newUser: Usuario = {
      id: editingUser?.id || `user-${Date.now()}`,
      ...formData,
    };
    upsertUsuario(newUser);
    setIsModalOpen(false);
  };

  const filtered = usuarios.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-lato">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight font-poppins">Gestão de Usuários</h1>
          <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest font-poppins">Administre os acessos à plataforma</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-primary'}`}
              title="Visualização em Grade"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-primary'}`}
              title="Visualização em Lista"
            >
              <List size={18} />
            </button>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-accent text-white font-black py-3 px-6 rounded-xl shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all uppercase tracking-widest text-xs font-poppins"
          >
            <Plus size={20} />
            NOVO USUÁRIO
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[20px] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-medium text-sm"
        />
      </div>

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(user => (
            <div key={user.id} className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/30 border border-gray-50 hover:border-primary transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all overflow-hidden font-poppins font-black text-xl">
                  {user.fotoUrl ? <img src={user.fotoUrl} className="w-full h-full object-cover" /> : user.nome.charAt(0)}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(user)} 
                    className="p-3 bg-gray-50 hover:bg-primary hover:text-white rounded-xl text-gray-400 border border-gray-100 transition-all shadow-sm"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
              
              <h3 className="font-black text-xl text-gray-800 mb-4 tracking-tighter group-hover:text-primary transition-colors font-poppins">{user.nome}</h3>
              
              <div className="space-y-4 text-xs text-gray-500 font-bold uppercase tracking-tight font-poppins">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-300 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-gray-300 shrink-0" />
                  <span className="text-[10px] font-black uppercase bg-gray-100 px-2 py-0.5 rounded border border-gray-100">{user.role}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                <span className={`flex items-center gap-1.5 text-[10px] font-black ${user.ativo ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'} px-3 py-1.5 rounded-full border uppercase tracking-widest font-poppins`}>
                  {user.ativo ? <CheckCircle2 size={12} /> : <X size={12} />}
                  {user.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/30 border border-gray-50 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] font-poppins">Usuário</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hidden md:table-cell font-poppins">E-mail</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hidden lg:table-cell font-poppins">Perfil</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center font-poppins">Status</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right font-poppins">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all overflow-hidden font-poppins font-black">
                        {user.fotoUrl ? <img src={user.fotoUrl} className="w-full h-full object-cover" /> : user.nome.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-800 text-sm tracking-tight font-poppins">{user.nome}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest md:hidden font-poppins">{user.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium font-poppins">
                      <Mail size={14} className="text-gray-300 shrink-0" />
                      {user.email}
                    </div>
                  </td>
                  <td className="p-6 hidden lg:table-cell">
                    <span className="text-[9px] font-black uppercase bg-gray-50 text-gray-400 px-2.5 py-1 rounded-lg border border-gray-100 font-poppins tracking-wider">{user.role}</span>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-black ${user.ativo ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'} px-2.5 py-1 rounded-full border uppercase tracking-widest font-poppins`}>
                      {user.ativo ? <CheckCircle2 size={10} /> : <X size={10} />}
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-gray-400 hover:text-primary transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight font-poppins">{editingUser ? 'Editar' : 'Novo'} Usuário</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 font-poppins">Defina as permissões de acesso</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-gray-400">
                <X size={24} />
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1 font-poppins">Nome Completo</label>
                <input 
                  type="text" 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm font-poppins"
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1 font-poppins">E-mail</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm font-poppins"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1 font-poppins">Perfil de Acesso</label>
                <div className="relative">
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as Role})}
                    className="w-full px-5 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm font-poppins appearance-none cursor-pointer"
                  >
                    <option value="ADMIN_GERAL">ADMIN_GERAL</option>
                    <option value="AUDITOR">AUDITOR</option>
                    <option value="INSPETOR">INSPETOR</option>
                    <option value="CLIENTE">CLIENTE</option>
                    <option value="GERENTE">GERENTE</option>
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                  className="w-5 h-5 text-primary rounded-lg border-gray-200 focus:ring-primary transition-all cursor-pointer"
                />
                <label htmlFor="ativo" className="text-xs font-black text-gray-700 uppercase tracking-widest cursor-pointer font-poppins">Usuário Ativo</label>
              </div>
            </div>
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4 justify-end">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-8 py-4 font-black text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest text-xs font-poppins"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                className="px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all uppercase tracking-widest text-xs font-poppins"
              >
                Salvar Acesso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
