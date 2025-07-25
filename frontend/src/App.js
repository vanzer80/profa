import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { 
  MessageSquare, 
  User, 
  Home, 
  BookOpen, 
  Trophy, 
  Settings,
  Send,
  HelpCircle,
  Lightbulb,
  CheckCircle,
  Moon,
  Sun,
  LogOut,
  Plus,
  Coins,
  Zap,
  Upload,
  Mic,
  MicOff,
  Volume2,
  Camera,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Theme context
const ThemeContext = React.createContext();

// Main App Component
function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <div className={darkMode ? 'dark' : ''}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </div>
    </ThemeContext.Provider>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-lg text-gray-600 dark:text-gray-300">Carregando...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AuthPage setUser={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <AuthPage setUser={setUser} isRegister />} />
        <Route 
          path="/*" 
          element={user ? <MainApp user={user} setUser={setUser} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </div>
  );
}

// Authentication Component
function AuthPage({ setUser, isRegister = false }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    full_name: '',
    grade: '6º EF',
    school: '',
    ai_style: 'paciente'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [grades] = useState([
    '1º EF', '2º EF', '3º EF', '4º EF', '5º EF', 
    '6º EF', '7º EF', '8º EF', '9º EF'
  ]);
  const [aiStyles] = useState([
    { key: 'paciente', name: 'Paciente', description: 'Explicações detalhadas e passo a passo' },
    { key: 'direto', name: 'Direto', description: 'Respostas objetivas e concisas' },
    { key: 'poético', name: 'Poético', description: 'Linguagem criativa e inspiradora' },
    { key: 'motivacional', name: 'Motivacional', description: 'Encorajador e positivo' }
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      localStorage.setItem('token', response.data.access_token);
      
      // Get user data
      const userResponse = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${response.data.access_token}` }
      });
      setUser(userResponse.data);
    } catch (error) {
      setError(error.response?.data?.detail || 'Erro de autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">ProfAI</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isRegister ? 'Crie sua conta' : 'Faça login para continuar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Nome completo"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
              <input
                type="text"
                placeholder="Nome de usuário"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              />
              <select
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Escola (opcional)"
                value={formData.school}
                onChange={(e) => setFormData({...formData, school: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <select
                value={formData.ai_style}
                onChange={(e) => setFormData({...formData, ai_style: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                required
              >
                {aiStyles.map(style => (
                  <option key={style.key} value={style.key}>{style.name} - {style.description}</option>
                ))}
              </select>
            </>
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            required
          />
          
          <input
            type="password"
            placeholder="Senha"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            required
          />
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Carregando...' : (isRegister ? 'Criar conta' : 'Entrar')}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400">
            {isRegister ? 'Já tem uma conta?' : 'Não tem conta?'}{' '}
            <a 
              href={isRegister ? '/login' : '/register'} 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isRegister ? 'Fazer login' : 'Criar conta'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Main App with Sidebar
function MainApp({ user, setUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar user={user} setUser={setUser} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">ProfAI</h1>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-yellow-600">
                <Zap className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">{user.xp}</span>
              </div>
              <div className="flex items-center text-yellow-500">
                <Coins className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">{user.coins}</span>
              </div>
            </div>
          </div>
        </div>

        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/chat/:conversationId?" element={<ChatInterface user={user} />} />
          <Route path="/perfil" element={<Profile user={user} />} />
          <Route path="/materias" element={<Navigate to="/chat" />} />
          <Route path="/conquistas" element={<Navigate to="/dashboard" />} />
          <Route path="/progresso" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar({ user, setUser, isOpen, onClose }) {
  const { darkMode, setDarkMode } = React.useContext(ThemeContext);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: BookOpen, label: 'Matérias', path: '/materias' },
    { icon: User, label: 'Perfil', path: '/perfil' }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white dark:bg-gray-800 shadow-lg flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ProfAI</h1>
          <div className="flex items-center mt-4">
            {user.avatar && (
              <img 
                src={`data:image/png;base64,${user.avatar}`}
                alt="Avatar"
                className="w-10 h-10 rounded-full mr-3"
              />
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{user.full_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.grade}</p>
            </div>
          </div>
          <div className="flex items-center mt-3 space-x-4">
            <div className="flex items-center text-yellow-600">
              <Zap className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">{user.xp} XP</span>
            </div>
            <div className="flex items-center text-yellow-500">
              <Coins className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">{user.coins}</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-6">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <a
                  href={item.path}
                  className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">ProfAI</h1>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            {user.avatar && (
              <img 
                src={`data:image/png;base64,${user.avatar}`}
                alt="Avatar"
                className="w-8 h-8 rounded-full mr-3"
              />
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{user.full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.grade}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item, index) => (
              <li key={index}>
                <a
                  href={item.path}
                  onClick={onClose}
                  className="flex items-center p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Dashboard Component
function Dashboard({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">
      <div className="text-lg text-gray-600 dark:text-gray-300">Carregando dashboard...</div>
    </div>;
  }

  const progressToNextLevel = dashboardData ? 
    ((dashboardData.user.xp % 100) / 100) * 100 : 0;

  return (
    <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Olá, {dashboardData?.user.full_name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base">
            Vamos continuar aprendendo hoje? 📚
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white dark:bg-gray-800 p-3 lg:p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Trophy className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-500 mr-2 lg:mr-3" />
              <div>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Nível</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData?.user.level}
                </p>
              </div>
            </div>
            <div className="mt-3 lg:mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 lg:h-2">
                <div 
                  className="bg-yellow-500 h-1.5 lg:h-2 rounded-full" 
                  style={{ width: `${progressToNextLevel}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {dashboardData?.user.xp % 100}/100 XP
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 lg:p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Zap className="w-6 h-6 lg:w-8 lg:h-8 text-blue-500 mr-2 lg:mr-3" />
              <div>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">XP</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData?.user.xp}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 lg:p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Coins className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-500 mr-2 lg:mr-3" />
              <div>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Moedas</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData?.user.coins}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 lg:p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <MessageSquare className="w-6 h-6 lg:w-8 lg:h-8 text-green-500 mr-2 lg:mr-3" />
              <div>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Conversas</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData?.stats.total_conversations}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Ações Rápidas
            </h2>
            <div className="space-y-3">
              <a 
                href="/chat"
                className="flex items-center p-3 lg:p-4 bg-blue-50 dark:bg-blue-900 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
              >
                <Plus className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400 mr-3" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100 text-sm lg:text-base">Nova Conversa</p>
                  <p className="text-xs lg:text-sm text-blue-600 dark:text-blue-300">Começar um novo chat</p>
                </div>
              </a>
              
              <a 
                href="/perfil"
                className="flex items-center p-3 lg:p-4 bg-green-50 dark:bg-green-900 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
              >
                <User className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400 mr-3" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100 text-sm lg:text-base">Editar Perfil</p>
                  <p className="text-xs lg:text-sm text-green-600 dark:text-green-300">Atualizar informações</p>
                </div>
              </a>
            </div>
          </div>

          {/* Conquistas */}
          <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Conquistas
            </h2>
            <div className="space-y-3">
              {dashboardData?.achievements.map((achievement, index) => (
                <div 
                  key={index}
                  className={`flex items-center p-3 rounded-lg ${
                    achievement.unlocked 
                      ? 'bg-yellow-50 dark:bg-yellow-900' 
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <Trophy className={`w-5 h-5 lg:w-6 lg:h-6 mr-3 ${
                    achievement.unlocked 
                      ? 'text-yellow-500' 
                      : 'text-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm lg:text-base ${
                      achievement.unlocked 
                        ? 'text-yellow-900 dark:text-yellow-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {achievement.name}
                    </p>
                    <p className={`text-xs lg:text-sm ${
                      achievement.unlocked 
                        ? 'text-yellow-600 dark:text-yellow-300' 
                        : 'text-gray-400'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.unlocked && (
                    <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-500 ml-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        {dashboardData?.recent_conversations.length > 0 && (
          <div className="mt-6 lg:mt-8 bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Conversas Recentes
            </h2>
            <div className="space-y-3">
              {dashboardData.recent_conversations.map((conversation) => (
                <a
                  key={conversation.id}
                  href={`/chat/${conversation.id}`}
                  className="flex items-center p-3 lg:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <BookOpen className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm lg:text-base truncate">
                      {conversation.title}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 truncate">
                      {conversation.subject} • {new Date(conversation.updated_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Chat Interface Component
function ChatInterface({ user }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showConversations, setShowConversations] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const subjects = [
    'Matemática', 'Português', 'Ciências', 'História', 'Geografia',
    'Inglês', 'Física', 'Química', 'Biologia', 'Redação', 'Artes',
    'Educação Física', 'Filosofia', 'Sociologia', 'Tema Livre'
  ];

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
      
      if (response.data.length > 0 && !currentConversation) {
        selectConversation(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const selectConversation = async (conversation) => {
    setCurrentConversation(conversation);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/conversations/${conversation.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createNewConversation = async (title, subject) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/conversations`, 
        { title, subject },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setConversations([response.data, ...conversations]);
      selectConversation(response.data);
      setShowNewChat(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const sendMessage = async (requestType = 'help', messageText = null) => {
    const messageToSend = messageText || newMessage;
    if (!messageToSend.trim() || !currentConversation) return;

    const userMessage = {
      id: Date.now().toString(),
      content: messageToSend,
      role: 'user',
      created_at: new Date().toISOString(),
      message_type: requestType
    };

    setMessages([...messages, userMessage]);
    setLoading(true);
    if (!messageText) setNewMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/chat`,
        {
          conversation_id: currentConversation.id,
          message: messageToSend,
          request_type: requestType,
          subject: currentConversation.subject
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setMessages(prev => [...prev, response.data]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (file) => {
    if (!currentConversation) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversation_id', currentConversation.id);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/files/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Send the extracted text as a message
      await sendMessage('help', response.data.message);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Erro ao processar arquivo');
    }
  };

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Erro ao acessar microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (audioBlob) => {
    if (!currentConversation) return;

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/audio/stt`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setNewMessage(response.data.text);
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Erro ao processar áudio');
    }
  };

  if (showNewChat) {
    return <NewChatModal 
      subjects={subjects}
      onClose={() => setShowNewChat(false)}
      onCreate={createNewConversation}
    />;
  }

  return (
    <div className="flex-1 flex h-full">
      {/* Mobile Conversations Backdrop */}
      {showConversations && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowConversations(false)}
        />
      )}

      {/* Conversations Sidebar */}
      <div className={`
        ${showConversations ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:relative fixed left-0 top-0 bottom-0 z-50 
        w-80 max-w-[80vw] bg-white dark:bg-gray-800 
        border-r border-gray-200 dark:border-gray-700 
        flex flex-col transition-transform duration-300 ease-in-out
      `}>
        {/* Mobile header for conversations */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Conversas</h3>
          <button
            onClick={() => setShowConversations(false)}
            className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowNewChat(true)}
            className="w-full flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Conversa
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                selectConversation(conv);
                setShowConversations(false);
              }}
              className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 ${
                currentConversation?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900' : ''
              }`}
            >
              <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                {conv.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {conv.subject}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(conv.updated_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-3 lg:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center">
              <button
                onClick={() => setShowConversations(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 mr-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {currentConversation.title}
                </h2>
                <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {currentConversation.subject}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {loading && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 lg:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {/* Action Buttons Row - Stack on mobile */}
              <div className="grid grid-cols-3 lg:flex lg:space-x-2 gap-2 mb-3">
                <button
                  onClick={() => sendMessage('help')}
                  disabled={!newMessage.trim() || loading}
                  className="flex items-center justify-center px-2 lg:px-3 py-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-300 rounded-full text-xs lg:text-sm disabled:opacity-50"
                >
                  <HelpCircle className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-1" />
                  <span className="hidden lg:inline ml-1">Ajuda (+10)</span>
                  <span className="lg:hidden ml-1">Ajuda</span>
                </button>
                <button
                  onClick={() => sendMessage('hint')}
                  disabled={!newMessage.trim() || loading}
                  className="flex items-center justify-center px-2 lg:px-3 py-1 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-full text-xs lg:text-sm disabled:opacity-50"
                >
                  <Lightbulb className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-1" />
                  <span className="hidden lg:inline ml-1">Dica (+5)</span>
                  <span className="lg:hidden ml-1">Dica</span>
                </button>
                <button
                  onClick={() => sendMessage('answer')}
                  disabled={!newMessage.trim() || loading}
                  className="flex items-center justify-center px-2 lg:px-3 py-1 bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700 text-green-700 dark:text-green-300 rounded-full text-xs lg:text-sm disabled:opacity-50"
                >
                  <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-1" />
                  <span className="hidden lg:inline ml-1">Resposta (+2)</span>
                  <span className="lg:hidden ml-1">Resp</span>
                </button>
              </div>

              {/* Multimedia Buttons Row */}
              <div className="flex space-x-2 mb-3 overflow-x-auto">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-3 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-800 dark:hover:bg-purple-700 text-purple-700 dark:text-purple-300 rounded-full text-xs whitespace-nowrap"
                  title="Upload PDF/Documento"
                >
                  <FileText className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                  Arquivo
                </button>
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center px-3 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700 text-indigo-700 dark:text-indigo-300 rounded-full text-xs whitespace-nowrap"
                  title="Upload Imagem"
                >
                  <ImageIcon className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                  Foto
                </button>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                    isRecording 
                      ? 'bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-300'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  title={isRecording ? "Parar gravação" : "Gravar áudio"}
                >
                  {isRecording ? <MicOff className="w-3 h-3 lg:w-4 lg:h-4 mr-1" /> : <Mic className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />}
                  {isRecording ? 'Parar' : 'Áudio'}
                </button>
              </div>
              
              {/* Text Input */}
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Digite sua pergunta..."
                  className="flex-1 p-2 lg:p-3 border border-gray-300 dark:border-gray-600 rounded-l-lg dark:bg-gray-700 dark:text-white text-sm lg:text-base"
                  disabled={loading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!newMessage.trim() || loading}
                  className="px-3 lg:px-4 py-2 lg:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-sm">
              <MessageSquare className="w-12 h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-base lg:text-lg text-gray-500 dark:text-gray-400 mb-2">
                Nenhuma conversa selecionada
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="px-4 lg:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm lg:text-base"
              >
                Começar nova conversa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isUser = message.role === 'user';
  
  const playAudio = async (text) => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('text', text);
      
      const response = await axios.post(`${API}/audio/tts`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Play audio from base64
      const audioBlob = new Blob([Uint8Array.from(atob(response.data.audio_base64), c => c.charCodeAt(0))], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };
  
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-xs lg:max-w-md px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg">
          <p className="text-sm lg:text-base">{message.content}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs opacity-75">
              {message.message_type === 'help' && '🆘 Ajuda'} 
              {message.message_type === 'hint' && '💡 Dica'}
              {message.message_type === 'answer' && '✅ Resposta'}
            </span>
            <span className="text-xs opacity-75">
              {new Date(message.created_at).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const aiResponse = message.ai_response;
  
  return (
    <div className="flex justify-start">
      <div className="max-w-[95%] sm:max-w-lg lg:max-w-2xl">
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 lg:p-4 shadow-sm">
          {aiResponse && (
            <>
              {/* Intro */}
              <div className="mb-3 p-2 lg:p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200 font-medium text-sm lg:text-base">
                  {aiResponse.intro}
                </p>
              </div>

              {/* Steps */}
              {aiResponse.steps && aiResponse.steps.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm lg:text-base">
                    Passos:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1">
                    {aiResponse.steps.map((step, index) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300 text-sm lg:text-base">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Explanation */}
              <div className="mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm lg:text-base">
                  Explicação:
                </h4>
                <p className="text-gray-700 dark:text-gray-300 text-sm lg:text-base leading-relaxed">
                  {aiResponse.explanation}
                </p>
              </div>

              {/* Final Answer (only for answer type) */}
              {aiResponse.final_answer && (
                <div className="mb-3 p-2 lg:p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 text-sm lg:text-base">
                    Resposta Final:
                  </h4>
                  <p className="text-green-700 dark:text-green-300 text-sm lg:text-base">
                    {aiResponse.final_answer}
                  </p>
                </div>
              )}

              {/* Examples */}
              {aiResponse.examples && aiResponse.examples.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm lg:text-base">
                    Exemplos:
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {aiResponse.examples.map((example, index) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300 text-sm lg:text-base">
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow-up Questions */}
              {aiResponse.follow_up_questions && aiResponse.follow_up_questions.length > 0 && (
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm lg:text-base">
                    Perguntas para refletir:
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {aiResponse.follow_up_questions.map((question, index) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300 text-sm lg:text-base">
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* XP and Coins earned + Audio Button */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-2 lg:space-x-4 flex-wrap">
                  <div className="flex items-center text-yellow-600">
                    <Zap className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                    <span className="text-xs lg:text-sm font-medium">+{aiResponse.xp} XP</span>
                  </div>
                  <div className="flex items-center text-yellow-500">
                    <Coins className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                    <span className="text-xs lg:text-sm font-medium">+{aiResponse.coins}</span>
                  </div>
                  <button
                    onClick={() => playAudio(aiResponse.explanation)}
                    disabled={isPlaying}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 disabled:opacity-50"
                    title="Ouvir resposta"
                  >
                    <Volume2 className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                    <span className="text-xs">{isPlaying ? 'Tocando...' : 'Ouvir'}</span>
                  </button>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                  {new Date(message.created_at).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// New Chat Modal Component
function NewChatModal({ subjects, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Matemática');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setLoading(true);
    await onCreate(title, subject);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Nova Conversa
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título da conversa
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Dúvidas sobre frações"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Matéria
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {subjects.map(subj => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Profile Component
function Profile({ user }) {
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    grade: user.grade,
    school: user.school,
    ai_style: user.ai_style
  });
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const grades = [
    '1º EF', '2º EF', '3º EF', '4º EF', '5º EF', 
    '6º EF', '7º EF', '8º EF', '9º EF'
  ];

  const aiStyles = [
    { key: 'paciente', name: 'Paciente', description: 'Explicações detalhadas e passo a passo' },
    { key: 'direto', name: 'Direto', description: 'Respostas objetivas e concisas' },
    { key: 'poético', name: 'Poético', description: 'Linguagem criativa e inspiradora' },
    { key: 'motivacional', name: 'Motivacional', description: 'Encorajador e positivo' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      if (avatar) {
        formDataToSend.append('avatar', avatar);
      }

      const token = localStorage.getItem('token');
      await axios.put(`${API}/auth/profile`, formDataToSend, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage('Perfil atualizado com sucesso!');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      setMessage('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Meu Perfil
        </h1>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center mb-6">
            {user.avatar ? (
              <img 
                src={`data:image/png;base64,${user.avatar}`}
                alt="Avatar"
                className="w-20 h-20 rounded-full mr-4"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-4">
                <User className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user.full_name}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center text-yellow-600">
                  <Zap className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">{user.xp} XP</span>
                </div>
                <div className="flex items-center text-yellow-500">
                  <Coins className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">{user.coins}</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome completo
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Série/Ano
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Escola
              </label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData({...formData, school: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Nome da sua escola"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estilo da IA
              </label>
              <select
                value={formData.ai_style}
                onChange={(e) => setFormData({...formData, ai_style: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {aiStyles.map(style => (
                  <option key={style.key} value={style.key}>
                    {style.name} - {style.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Foto de perfil
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatar(e.target.files[0])}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg ${
                message.includes('sucesso') 
                  ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;