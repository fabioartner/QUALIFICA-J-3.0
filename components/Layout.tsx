
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  ClipboardCheck, 
  Calendar, 
  LogOut, 
  Menu, 
  X, 
  UserCircle2,
  ChevronDown,
  Users as UsersIcon,
  ShieldCheck,
  User,
  Camera,
  Mail,
  Phone,
  Lock,
  ChevronUp,
  PlusCircle,
  CalendarDays,
  Bell
} from 'lucide-react';
import { useQualificaStore } from '../store';
import Logo from './Logo';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, usuarios, switchProfile, logout, updateCurrentUser, agendamentos } = useQualificaStore();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const mainContentRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [profileForm, setProfileForm] = useState({
    nome: currentUser?.nome || '',
    email: currentUser?.email || '',
    telefone: currentUser?.telefone || '',
    senha: currentUser?.senha || '',
    fotoUrl: currentUser?.fotoUrl || ''
  });

  // Listener de Scroll para efeito de sombra no Header
  useEffect(() => {
    const handleScroll = () => {
      if (mainContentRef.current) {
        setIsScrolled(mainContentRef.current.scrollTop > 10);
      }
    };

    const container = mainContentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  if (!currentUser) return <>{children}</>;

  const isAdmin = currentUser.role === 'ADMIN_GERAL';
  const pendingRequestsCount = agendamentos.filter(a => a.status === 'pendente').length;

  const getMenuItems = () => {
    if (currentUser.role === 'CLIENTE' || currentUser.role === 'GERENTE') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Minhas Empresas', icon: Building2, path: '/estabelecimentos' },
        { name: 'Auditorias Realizadas', icon: ClipboardCheck, path: '/minhas-auditorias' },
        { name: 'Cronograma de Visitas', icon: CalendarDays, path: '/agendamentos' },
        { name: 'Agendar uma Auditoria', icon: PlusCircle, path: '/agendamentos?novo=true' },
      ];
    }

    return [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['ADMIN_GERAL', 'AUDITOR', 'INSPETOR'] },
      { name: 'Estabelecimentos', icon: Building2, path: '/estabelecimentos', roles: ['ADMIN_GERAL', 'AUDITOR', 'INSPETOR'] },
      { name: 'Checklists', icon: ClipboardCheck, path: '/checklists', roles: ['ADMIN_GERAL', 'AUDITOR'] },
      { name: 'Centro de Auditoria', icon: ShieldCheck, path: '/audit-center', roles: ['ADMIN_GERAL', 'AUDITOR', 'INSPETOR'] },
      { name: 'Agendamentos', icon: Calendar, path: '/agendamentos', roles: ['ADMIN_GERAL', 'AUDITOR', 'INSPETOR'] },
      { name: 'Usuários', icon: UsersIcon, path: '/usuarios', roles: ['ADMIN_GERAL'] },
    ].filter(item => !item.roles || item.roles.includes(currentUser.role));
  };

  const menuItems = getMenuItems();

  const handleSaveProfile = () => {
    updateCurrentUser(profileForm);
    setIsEditProfileOpen(false);
    setIsUserMenuOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, fotoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-screen bg-[#f8fafb] flex flex-col md:flex-row font-lato overflow-hidden">
      {/* HEADER MOBILE FIXO */}
      <header className={`
        md:hidden fixed top-0 left-0 right-0 z-[60] bg-primary text-white p-4 flex justify-between items-center transition-all duration-300
        ${isScrolled ? 'shadow-xl' : ''}
      `}>
        <Logo variant="light" iconSize={24} textSize="text-lg" />
        <div className="flex items-center gap-4">
          {isAdmin && pendingRequestsCount > 0 && (
             <button onClick={() => navigate('/agendamentos?tab=pendentes')} className="relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-primary"></span>
             </button>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* SIDEBAR DESKTOP FIXA / MOBILE OVERLAY */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-64 bg-primary text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:flex md:flex-col md:shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 h-full flex flex-col overflow-y-auto no-scrollbar">
          <div className="mb-12 py-4 px-2 flex items-center overflow-hidden shrink-0">
            <Logo variant="light" iconSize={32} textSize="text-xl" />
          </div>
          
          <nav className="space-y-1.5 flex-1">
            {menuItems.map(item => {
              const isActive = item.path.includes('?') 
                ? location.pathname + location.search === item.path
                : location.pathname === item.path && location.search === '';

              return (
                <NavLink
                  key={item.path + item.name}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    relative flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-poppins
                    ${isActive ? 'bg-accent text-white shadow-xl shadow-accent/20 font-bold scale-[1.02]' : 'hover:bg-white/10 text-white/60 font-medium'}
                  `}
                >
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />}
                  <item.icon size={20} className={isActive ? 'text-white' : 'text-white/40'} />
                  <span className="text-sm tracking-tight">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/10 mt-auto shrink-0">
             <div className="relative">
                {isUserMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-4 w-full bg-white rounded-[24px] shadow-2xl border border-gray-100 py-3 z-[100] animate-in fade-in slide-in-from-bottom-3 text-gray-800 overflow-hidden font-poppins">
                     <button 
                        onClick={() => { setIsEditProfileOpen(true); setIsUserMenuOpen(false); }}
                        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <User size={18} className="text-primary" />
                        <span className="text-sm font-bold">Editar Perfil</span>
                      </button>
                      <button 
                        onClick={() => { logout(); navigate('/login'); }}
                        className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-red-500"
                      >
                        <LogOut size={18} />
                        <span className="text-sm font-bold">Sair</span>
                      </button>
                  </div>
                )}
                
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`
                    w-full bg-white/5 p-4 rounded-[20px] border border-white/10 flex items-center gap-3 transition-all
                    ${isUserMenuOpen ? 'ring-2 ring-accent' : ''}
                  `}
                >
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-black shrink-0 overflow-hidden font-poppins">
                    {currentUser.fotoUrl ? <img src={currentUser.fotoUrl} className="w-full h-full object-cover" /> : currentUser.nome.charAt(0)}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold truncate font-poppins">{currentUser.nome}</p>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest truncate font-poppins">{currentUser.role}</p>
                  </div>
                  <ChevronUp size={16} className={`text-white/20 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
             </div>
          </div>
        </div>
      </aside>

      {/* OVERLAY PARA MOBILE QUANDO SIDEBAR ABERTA */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[65] md:hidden backdrop-blur-sm animate-in fade-in duration-300" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* AREA DE CONTEUDO PRINCIPAL COM SCROLL INDEPENDENTE */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* HEADER DESKTOP STICKY */}
        <header className={`
          hidden md:flex bg-white h-16 items-center justify-between px-10 border-b transition-all duration-300 sticky top-0 z-50
          ${isScrolled ? 'shadow-md border-gray-200' : 'border-gray-100'}
        `}>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium font-lato">Bem-vindo, </span>
            <span className="font-bold text-primary font-poppins">{currentUser.nome}</span>
            <span className="ml-2 px-2.5 py-1 bg-gray-50 text-gray-500 text-[9px] rounded-lg uppercase font-black tracking-widest border border-gray-100 font-poppins">
              {currentUser.role}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {isAdmin && (
              <button 
                onClick={() => navigate('/agendamentos?tab=pendentes')}
                className="relative p-2.5 text-gray-400 hover:text-primary transition-all bg-gray-50 rounded-full border border-gray-100 group"
                title="Solicitações Pendentes"
              >
                <Bell size={20} />
                {pendingRequestsCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            )}

            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-full hover:bg-gray-50 transition-all border border-gray-100 shadow-sm"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary overflow-hidden">
                  {currentUser.fotoUrl ? <img src={currentUser.fotoUrl} className="w-full h-full object-cover" /> : <UserCircle2 size={20} />}
                </div>
                <span className="text-sm font-bold text-gray-600 font-poppins">Trocar Perfil</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-[24px] shadow-2xl border border-gray-100 py-3 z-[100] animate-in fade-in slide-in-from-top-3">
                  <p className="px-6 py-2.5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] font-poppins">Contas Disponíveis</p>
                  {usuarios.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchProfile(u.id);
                        setIsUserMenuOpen(false);
                        navigate('/');
                      }}
                      className={`
                        w-full flex flex-col items-start px-6 py-3 hover:bg-gray-50 transition-colors
                        ${currentUser.id === u.id ? 'bg-primary/5 border-l-4 border-primary' : ''}
                      `}
                    >
                      <span className="text-sm font-bold text-gray-800 font-poppins">{u.nome}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase font-poppins">{u.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTAINER DE CONTEUDO COM SCROLL */}
        <main 
          ref={mainContentRef}
          className={`
            flex-1 overflow-y-auto p-4 md:p-12 no-scrollbar scroll-smooth
            pt-20 md:pt-12
          `}
        >
          {children}
        </main>
      </div>

      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-primary/30 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-10 flex flex-col items-center">
              <div className="w-full flex justify-center items-center relative mb-10">
                <h2 className="text-2xl font-black text-primary uppercase tracking-tighter font-poppins">EDITAR PERFIL</h2>
                <button 
                  onClick={() => setIsEditProfileOpen(false)}
                  className="absolute right-0 p-2 text-gray-300 hover:text-gray-600 transition-colors"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="relative mb-12">
                <div className="w-32 h-32 bg-gray-50 rounded-[32px] border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                  {profileForm.fotoUrl ? (
                    <img src={profileForm.fotoUrl} className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} className="text-gray-300" />
                  )}
                </div>
                <label className="absolute bottom-[-10px] right-[-10px] w-12 h-12 bg-accent text-white rounded-2xl shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <Camera size={24} />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 text-center font-poppins">Toque para alterar foto</p>
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-12">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-poppins">Seu Nome</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      value={profileForm.nome}
                      onChange={(e) => setProfileForm({ ...profileForm, nome: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm text-gray-700 font-poppins"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-poppins">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="email" 
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm text-gray-700 font-poppins"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-poppins">Telefone / Whatsapp</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" 
                      value={profileForm.telefone}
                      onChange={(e) => setProfileForm({ ...profileForm, telefone: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm text-gray-700 font-poppins"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 font-poppins">Alterar Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="password" 
                      value={profileForm.senha}
                      onChange={(e) => setProfileForm({ ...profileForm, senha: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all font-bold text-sm text-gray-700 font-poppins"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full flex gap-4">
                <button 
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-5 bg-gray-100 text-gray-500 font-black rounded-3xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-sm font-poppins"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="flex-[1.5] py-5 bg-accent text-white font-black rounded-3xl shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all uppercase tracking-widest text-sm font-poppins"
                >
                  SALVAR ALTERAÇÕES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
