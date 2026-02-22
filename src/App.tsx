import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar as CalendarIcon, 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2, 
  Send, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  getDay
} from 'date-fns';
import { uz } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { cn } from './lib/utils';
import { User, Group, Teacher, Subject, ScheduleItem, Message, TeacherStats } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(false);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      setUser(JSON.parse(saved));
      setView('dashboard');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        setView('dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Server bilan bog\'lanishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setView('login');
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[32px] shadow-xl w-full max-w-md border border-black/5"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif italic text-[#5A5A40] mb-2">Texnikum Tizimi</h1>
            <p className="text-sm text-gray-500">O'qituvchilar va Adminlar uchun</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 ml-1">Login</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                placeholder="Username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 ml-1">Parol</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#5A5A40] text-white py-3 rounded-full font-medium hover:bg-[#4A4A30] transition-all shadow-lg shadow-[#5A5A40]/20 disabled:opacity-50"
            >
              {loading ? 'Kirilmoqda...' : 'Kirish'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 border-b border-black/5 flex items-center justify-between sticky top-0 z-40">
        <h2 className="text-xl font-serif italic text-[#5A5A40]">Texnikum</h2>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-[#5A5A40]"
        >
          {isMobileMenuOpen ? <ChevronRight className="rotate-90" /> : <LayoutDashboard size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-black/5 flex flex-col transition-transform duration-300 md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-black/5 hidden md:block">
          <h2 className="text-xl font-serif italic text-[#5A5A40]">Texnikum</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {user?.role === 'admin' ? (
            <>
              <SidebarItem icon={<LayoutDashboard size={20}/>} label="Umumiy" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} />
              <SidebarItem icon={<Users size={20}/>} label="O'qituvchilar" active={activeTab === 'teachers'} onClick={() => { setActiveTab('teachers'); setIsMobileMenuOpen(false); }} />
              <SidebarItem icon={<BookOpen size={20}/>} label="Guruhlar" active={activeTab === 'groups'} onClick={() => { setActiveTab('groups'); setIsMobileMenuOpen(false); }} />
            </>
          ) : (
            <>
              <SidebarItem icon={<CalendarIcon size={20}/>} label="Dars Jadvali" active={activeTab === 'schedule'} onClick={() => { setActiveTab('schedule'); setIsMobileMenuOpen(false); }} />
              <SidebarItem icon={<BookOpen size={20}/>} label="Fanlarim" active={activeTab === 'subjects'} onClick={() => { setActiveTab('subjects'); setIsMobileMenuOpen(false); }} />
              <SidebarItem icon={<MessageSquare size={20}/>} label="Xabarlar" active={activeTab === 'messages'} onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }} />
            </>
          )}
        </nav>
        <div className="p-4 border-t border-black/5">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-[#5A5A40] flex items-center justify-center text-white font-bold">
              {user?.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut size={18} /> Chiqish
          </button>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {user?.role === 'admin' ? (
            <AdminView activeTab={activeTab} user={user} />
          ) : (
            <TeacherView activeTab={activeTab} user={user} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-medium",
        active ? "bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20" : "text-gray-500 hover:bg-gray-50"
      )}
    >
      {icon} {label}
    </button>
  );
}

const LESSON_TYPE_LABELS: Record<string, string> = {
  lecture: "Ma'ruza",
  seminar: "Seminar",
  lab: "Laboratoriya",
  practical: "Amaliy"
};

// --- CHAT COMPONENT ---

interface ChatViewProps {
  currentUser: User;
  targetUser: User | { id: number, name: string };
  onClose?: () => void;
}

function ChatView({ currentUser, targetUser, onClose }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch(`/api/messages/${currentUser.id}`);
    const data = await res.json();
    const conversation = data.filter((m: Message) => 
      (m.from_id === currentUser.id && m.to_id === targetUser.id) ||
      (m.from_id === targetUser.id && m.to_id === currentUser.id)
    );
    setMessages(conversation);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [targetUser.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      if (editingId) {
        await fetch(`/api/messages/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        setEditingId(null);
      } else {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from_id: currentUser.id,
            to_id: targetUser.id,
            content
          })
        });
      }
      setContent('');
      await fetchMessages();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xabarni o\'chirmoqchimisiz?')) return;
    try {
      const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchMessages();
    } catch (e) {
      alert("Xabarni o'chirib bo'lmadi");
    }
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setContent(msg.content);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-[32px] shadow-sm border border-black/5 overflow-hidden">
      <div className="p-4 border-b border-black/5 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#5A5A40] flex items-center justify-center text-white text-xs font-bold">
            {targetUser.name[0]}
          </div>
          <p className="font-bold text-[#5A5A40] text-sm">{targetUser.name}</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <ChevronRight className="rotate-90" />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F5F0]/30 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
            <MessageSquare size={48} className="mb-2" />
            <p className="text-sm italic">Xabarlar mavjud emas</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.from_id === currentUser.id;
            const prevMsg = messages[idx - 1];
            const showDate = !prevMsg || !isSameDay(new Date(m.created_at), new Date(prevMsg.created_at));
            
            return (
              <React.Fragment key={m.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-gray-200/50 text-gray-500 text-[10px] rounded-full uppercase tracking-widest font-bold">
                      {format(new Date(m.created_at), 'd-MMMM', { locale: uz })}
                    </span>
                  </div>
                )}
                <div className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm relative group transition-all",
                    isMe ? "bg-[#5A5A40] text-white rounded-tr-none shadow-md shadow-[#5A5A40]/10" : "bg-white text-gray-800 border border-black/5 rounded-tl-none shadow-sm"
                  )}>
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <div className={cn(
                      "text-[9px] mt-1 opacity-60 flex items-center gap-2",
                      isMe ? "justify-end" : "justify-start"
                    )}>
                      {format(new Date(m.created_at), 'HH:mm', { locale: uz })}
                      {isMe && (
                        <div className="hidden group-hover:flex gap-1 ml-2">
                          <button onClick={() => startEdit(m)} className="hover:text-white/80 transition-colors"><Edit2 size={10}/></button>
                          <button onClick={() => handleDelete(m.id)} className="hover:text-red-300 transition-colors"><Trash2 size={10}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-black/5 bg-white">
        <div className="flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={editingId ? "Xabarni tahrirlash..." : "Xabar yozing..."}
            className="flex-1 p-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#5A5A40]/20 text-sm resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!content.trim() || loading}
            className="w-10 h-10 bg-[#5A5A40] text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-transform active:scale-90"
          >
            {loading ? <Clock size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        {editingId && (
          <button 
            onClick={() => { setEditingId(null); setContent(''); }}
            className="text-[10px] text-gray-400 mt-1 ml-2 hover:text-gray-600"
          >
            Bekor qilish
          </button>
        )}
      </div>
    </div>
  );
}

// --- ADMIN VIEWS ---

function AdminView({ activeTab, user }: { activeTab: string, user: User | null }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [stats, setStats] = useState<TeacherStats[]>([]);
  const [msgContent, setMsgContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchGroups();
  }, []);

  const fetchTeachers = async () => {
    const res = await fetch('/api/admin/teachers');
    const data = await res.json();
    setTeachers(data);
  };

  const fetchGroups = async () => {
    const res = await fetch('/api/admin/groups');
    const data = await res.json();
    setGroups(data);
  };

  const fetchStats = async (tid: number) => {
    const res = await fetch(`/api/admin/stats/${tid}`);
    const data = await res.json();
    setStats(data);
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const payload = Object.fromEntries(formData);
      await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await fetchTeachers();
      (e.target as HTMLFormElement).reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const name = formData.get('name');
      await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      await fetchGroups();
      (e.target as HTMLFormElement).reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (isSubmitting) return;
    if (confirm('O\'qituvchini o\'chirmoqchimisiz?')) {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/admin/teachers/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        await fetchTeachers();
      } catch (e) {
        alert("O'qituvchini o'chirib bo'lmadi");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (isSubmitting) return;
    if (confirm('Guruhni o\'chirmoqchimisiz?')) {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        await fetchGroups();
      } catch (e) {
        alert("Guruhni o'chirib bo'lmadi");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTeacher || !msgContent || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_id: user?.id,
          to_id: selectedTeacher.id,
          content: msgContent
        })
      });
      setMsgContent('');
      alert('Xabar yuborildi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      key={activeTab}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-black/5">
            <h3 className="text-lg font-serif italic mb-4">O'qituvchilar Statistikasi</h3>
            <div className="space-y-4">
              {teachers.map(t => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-gray-400">@{t.username}</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedTeacher(t); fetchStats(t.id); }}
                    className="text-xs bg-[#5A5A40] text-white px-3 py-1 rounded-full"
                  >
                    Ko'rish
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedTeacher && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-black/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-serif italic">{selectedTeacher.name} - Dars soatlari</h3>
                  <button onClick={() => setSelectedTeacher(null)} className="text-gray-400"><ChevronRight/></button>
                </div>
                <div className="space-y-6">
                  {stats.map(s => (
                    <div key={s.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{s.name}</span>
                        <span className="font-mono">{s.completed}/{s.total} soat</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#5A5A40] transition-all duration-500" 
                          style={{ width: `${(s.completed / s.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Qolgan: {s.remaining} soat</p>
                    </div>
                  ))}
                </div>
              </div>

              <ChatView currentUser={user!} targetUser={selectedTeacher} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'teachers' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-black/5">
            <h3 className="text-lg font-serif italic mb-6">Yangi O'qituvchi Qo'shish</h3>
            <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="name" placeholder="F.I.O" className="px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#5A5A40]/20" required />
              <input name="username" placeholder="Login" className="px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#5A5A40]/20" required />
              <div className="flex gap-2">
                <input name="password" type="password" placeholder="Parol" className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#5A5A40]/20" required />
                <button type="submit" disabled={isSubmitting} className="bg-[#5A5A40] text-white p-3 rounded-2xl disabled:opacity-50">
                  {isSubmitting ? <Clock size={20} className="animate-spin" /> : <Plus/>}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-black/5 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-6 py-4">F.I.O</th>
                  <th className="px-6 py-4">Login</th>
                  <th className="px-6 py-4">Parol</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {teachers.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{t.name}</td>
                    <td className="px-6 py-4 text-gray-500">{t.username}</td>
                    <td className="px-6 py-4 font-mono text-xs">{t.password}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDeleteTeacher(t.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="max-w-2xl space-y-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-black/5">
            <h3 className="text-lg font-serif italic mb-6">Yangi Guruh Qo'shish</h3>
            <form onSubmit={handleAddGroup} className="flex gap-4">
              <input name="name" placeholder="Guruh nomi (masalan: F-1)" className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#5A5A40]/20" required />
              <button type="submit" disabled={isSubmitting} className="bg-[#5A5A40] text-white px-6 py-3 rounded-2xl font-medium disabled:opacity-50 flex items-center gap-2">
                {isSubmitting && <Clock size={18} className="animate-spin" />}
                Qo'shish
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {groups.map(g => (
              <div key={g.id} className="bg-white p-4 rounded-2xl border border-black/5 flex justify-between items-center">
                <span className="font-medium">{g.name}</span>
                <button onClick={() => handleDeleteGroup(g.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- TEACHER VIEWS ---

function TeacherView({ activeTab, user }: { activeTab: string, user: User | null }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date, pair: number } | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubjects();
      fetchGroups();
      fetchSchedule();
      fetchMessages();
    }
  }, [user]);

  const fetchSubjects = async () => {
    const res = await fetch(`/api/teacher/subjects/${user?.id}`);
    const data = await res.json();
    setSubjects(data);
  };

  const fetchGroups = async () => {
    const res = await fetch('/api/admin/groups');
    const data = await res.json();
    setGroups(data);
  };

  const fetchSchedule = async () => {
    const res = await fetch(`/api/teacher/schedule/${user?.id}`);
    const data = await res.json();
    setSchedule(data);
  };

  const fetchMessages = async () => {
    const res = await fetch(`/api/messages/${user?.id}`);
    const data = await res.json();
    setMessages(data);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    
    const selectedGroups = Array.from(form.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => parseInt((cb as HTMLInputElement).value));

    const payload = {
      teacher_id: user?.id,
      name: formData.get('name'),
      total_hours: parseInt(formData.get('total_hours') as string),
      lecture_hours: parseInt(formData.get('lecture_hours') as string),
      seminar_hours: parseInt(formData.get('seminar_hours') as string),
      lab_hours: parseInt(formData.get('lab_hours') as string),
      practical_hours: parseInt(formData.get('practical_hours') as string),
      group_ids: selectedGroups
    };

    try {
      if (editingSubject) {
        await fetch(`/api/teacher/subjects/${editingSubject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        setEditingSubject(null);
      } else {
        await fetch('/api/teacher/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      await fetchSubjects();
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (isSubmitting) return;
    if (confirm('Fanni o\'chirmoqchimisiz? Bu fanga tegishli barcha darslar ham o\'chiriladi.')) {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/teacher/subjects/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        await fetchSubjects();
        await fetchSchedule();
      } catch (e) {
        alert("Fanni o'chirib bo'lmadi");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const saveSchedulePair = async (pairNum: number, subjectId: string, groupId: string, type: string, date: Date = currentDate) => {
    if (getDay(date) === 0) {
      alert("Yakshanba kuni dars qo'shish mumkin emas!");
      return;
    }
    if (!subjectId || !groupId || !type || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/teacher/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: user?.id,
          date: format(date, 'yyyy-MM-dd'),
          pair_number: pairNum,
          subject_id: parseInt(subjectId),
          group_id: parseInt(groupId),
          lesson_type: type
        })
      });
      await fetchSchedule();
      setSelectedSlot(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteScheduleItem = async (id: number) => {
    if (isSubmitting) return;
    if (confirm('Darsni o\'chirmoqchimisiz?')) {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/teacher/schedule/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        await fetchSchedule();
        setSelectedSlot(null);
      } catch (e) {
        alert("Darsni o'chirib bo'lmadi");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const exportToExcel = async () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hisobot');

    // Title
    const title = `2-SON NAMANGAN ABU ALI IBN SINO NOMIDAGI JAMOAT SALOMATLIGI TEXNIKUMI MAXSUS FAN O'QITUVCHISI ${user?.name?.toUpperCase()}NING ${format(currentDate, 'yyyy-yyyy', { locale: uz })} O'QUV YILI ${format(currentDate, 'MMMM', { locale: uz }).toUpperCase()} OYIDA O'TILGAN DARSLARI XISOBOTI`;
    const titleRow = worksheet.addRow([title]);
    worksheet.mergeCells(1, 1, 1, days.length + 5);
    titleRow.getCell(1).font = { bold: true, color: { argb: 'FF1D4ED8' }, size: 12 };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    titleRow.height = 40;

    // Header Rows
    const header1 = ['№', 'Fanlar', 'Gurux', ...days.map(d => format(d, 'd')), 'Jami o\'tilgan soat', 'Bo\'lim boshlig\'i imzosi'];
    const hRow1 = worksheet.addRow(header1);
    
    // Styling headers
    hRow1.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.font = { bold: true, size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Sunday header color
      if (colNumber > 3 && colNumber <= days.length + 3) {
        const day = days[colNumber - 4];
        if (getDay(day) === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
        }
      }
    });

    // Group schedule by subject and group
    const grouped: Record<string, Record<string, number[]>> = {};
    schedule.forEach(item => {
      const itemDate = new Date(item.date);
      if (itemDate >= monthStart && itemDate <= monthEnd && getDay(itemDate) !== 0) {
        if (!grouped[item.subject_name!]) grouped[item.subject_name!] = {};
        if (!grouped[item.subject_name!][item.group_name!]) grouped[item.subject_name!][item.group_name!] = new Array(days.length).fill(0);
        const dayIdx = itemDate.getDate() - 1;
        grouped[item.subject_name!][item.group_name!][dayIdx] += 2;
      }
    });

    let rowIndex = 1;
    const dailyTotals = new Array(days.length).fill(0);
    let grandTotal = 0;

    Object.entries(grouped).forEach(([subject, groups]) => {
      const groupEntries = Object.entries(groups);
      const startRow = worksheet.lastRow!.number + 1;
      
      groupEntries.forEach(([group, hours], gIdx) => {
        const rowTotal = hours.reduce((a, b) => a + b, 0);
        grandTotal += rowTotal;
        hours.forEach((h, i) => dailyTotals[i] += h);

        const rowData = [rowIndex++, subject, group, ...hours.map(h => h || ''), rowTotal, ''];
        const row = worksheet.addRow(rowData);
        
        row.eachCell((cell, colNumber) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { size: 10 };

          if (colNumber === 2 || colNumber === 3) {
            cell.font = { bold: true, color: { argb: 'FF1D4ED8' }, size: 10 };
          }

          // Sunday column color
          if (colNumber > 3 && colNumber <= days.length + 3) {
            const day = days[colNumber - 4];
            if (getDay(day) === 0) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
              cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
            }
          }
        });
      });

      // Merge subject cells
      if (groupEntries.length > 1) {
        worksheet.mergeCells(startRow, 2, startRow + groupEntries.length - 1, 2);
      }
    });

    // Totals Row
    const totalsRowData = ['', 'Jami', '', ...dailyTotals, grandTotal, ''];
    const tRow = worksheet.addRow(totalsRowData);
    worksheet.mergeCells(tRow.number, 2, tRow.number, 3);
    
    tRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 10 };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      if (colNumber === 2) {
        cell.font = { bold: true, color: { argb: 'FFEF4444' }, size: 10 };
      }

      // Sunday column color
      if (colNumber > 3 && colNumber <= days.length + 3) {
        const day = days[colNumber - 4];
        if (getDay(day) === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        }
      }
    });

    // Column widths
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(3).width = 10;
    for (let i = 4; i <= days.length + 3; i++) {
      worksheet.getColumn(i).width = 4;
    }
    worksheet.getColumn(days.length + 4).width = 15;
    worksheet.getColumn(days.length + 5).width = 20;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Hisobot_${format(currentDate, 'MMMM_yyyy', { locale: uz })}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      key={activeTab}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-black/5">
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-50 rounded-full"><ChevronLeft/></button>
              <h2 className="text-xl font-serif italic">{format(currentDate, 'MMMM yyyy', { locale: uz })}</h2>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-50 rounded-full"><ChevronRight/></button>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-2xl">
              {(['daily', 'weekly', 'monthly'] as const).map(mode => (
                <button 
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-medium transition-all capitalize",
                    viewMode === mode ? "bg-white shadow-sm text-[#5A5A40]" : "text-gray-400"
                  )}
                >
                  {mode === 'daily' ? 'Kunlik' : mode === 'weekly' ? 'Haftalik' : 'Oylik'}
                </button>
              ))}
            </div>
            {viewMode === 'monthly' && (
              <button 
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-[#5A5A40] text-white px-4 py-2 rounded-2xl text-sm font-medium"
              >
                <Download size={16}/> Excel
              </button>
            )}
          </div>

          {viewMode === 'daily' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(pair => {
                const item = schedule.find(s => isSameDay(new Date(s.date), currentDate) && s.pair_number === pair);
                return (
                  <PairCard 
                    key={pair} 
                    pair={pair} 
                    item={item} 
                    subjects={subjects} 
                    onSave={(sid, gid, type) => { saveSchedulePair(pair, sid, gid, type); }}
                    onDelete={handleDeleteScheduleItem}
                    isSubmitting={isSubmitting}
                  />
                );
              })}
            </div>
          )}

          {viewMode === 'weekly' && (
            <div className="bg-white rounded-[32px] shadow-sm border border-black/5 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
                    <th className="px-4 py-4 border-r border-black/5">Vaqt</th>
                    {eachDayOfInterval({ 
                      start: startOfWeek(currentDate, { weekStartsOn: 1 }), 
                      end: endOfWeek(currentDate, { weekStartsOn: 1 }) 
                    }).map(day => (
                      <th key={day.toString()} className={cn("px-4 py-4 text-center", getDay(day) === 0 && "bg-red-50/50")}>
                        {format(day, 'EEE, d', { locale: uz })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {[1, 2, 3, 4].map(pair => (
                    <tr key={pair}>
                      <td className="px-4 py-8 font-serif italic text-gray-400 border-r border-black/5">{pair}-juftlik</td>
                      {eachDayOfInterval({ 
                        start: startOfWeek(currentDate, { weekStartsOn: 1 }), 
                        end: endOfWeek(currentDate, { weekStartsOn: 1 }) 
                      }).map(day => {
                        const item = schedule.find(s => isSameDay(new Date(s.date), day) && s.pair_number === pair);
                        return (
                          <td key={day.toString()} className="px-2 py-2">
                            <div className="relative group">
                              <button 
                                onClick={() => {
                                  if (getDay(day) === 0) {
                                    alert("Yakshanba kuni dars qo'shish mumkin emas!");
                                    return;
                                  }
                                  setSelectedSlot({ date: day, pair });
                                }}
                                className="w-full text-left transition-transform hover:scale-[1.02] active:scale-95"
                              >
                                {item ? (
                                  <div className="p-3 bg-gray-50 rounded-2xl border border-black/5 text-[10px]">
                                    <p className="font-bold text-[#5A5A40] truncate">{item.subject_name}</p>
                                    <p className="text-gray-400">{item.group_name}</p>
                                    <p className="capitalize italic opacity-60">{LESSON_TYPE_LABELS[item.lesson_type] || item.lesson_type}</p>
                                  </div>
                                ) : (
                                  <div className="h-16 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center">
                                    <Plus size={16} className="text-gray-200" />
                                  </div>
                                )}
                              </button>
                              {item && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteScheduleItem(item.id);
                                  }}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-black/5 rounded-full flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-red-500"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'monthly' && (
            <div className="bg-white rounded-[32px] shadow-sm border border-black/5 overflow-x-auto p-6">
              <div className="text-center mb-8">
                <h2 className="text-blue-700 font-bold text-lg uppercase">
                  2-Son Namangan Abu Ali Ibn Sino nomidagi Jamoat salomatligi texnikumi Maxsus fan o'qituvchisi {user?.name}ning {format(currentDate, 'yyyy-yyyy', { locale: uz })} o'quv yili {format(currentDate, 'MMMM', { locale: uz })} oyida o'tilgan darslari xisoboti
                </h2>
              </div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-black p-2" rowSpan={2}>№</th>
                    <th className="border border-black p-2" rowSpan={2}>Fanlar</th>
                    <th className="border border-black p-2" rowSpan={2}>Gurux</th>
                    {eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }).map(day => (
                      <th key={day.toString()} className={cn("border border-black p-1 w-8", getDay(day) === 0 ? "bg-red-600 text-white" : "bg-white")}>
                        {format(day, 'd')}
                      </th>
                    ))}
                    <th className="border border-black p-2" rowSpan={2}>Jami o'tilgan soat</th>
                    <th className="border border-black p-2" rowSpan={2}>Bo'lim boshlig'i imzosi</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Render rows based on grouped data */}
                  {(() => {
                    const monthStart = startOfMonth(currentDate);
                    const monthEnd = endOfMonth(currentDate);
                    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
                    const grouped: Record<string, Record<string, number[]>> = {};
                    
                    schedule.forEach(item => {
                      const itemDate = new Date(item.date);
                      if (itemDate >= monthStart && itemDate <= monthEnd && getDay(itemDate) !== 0) {
                        if (!grouped[item.subject_name!]) grouped[item.subject_name!] = {};
                        if (!grouped[item.subject_name!][item.group_name!]) grouped[item.subject_name!][item.group_name!] = new Array(days.length).fill(0);
                        const dayIdx = itemDate.getDate() - 1;
                        grouped[item.subject_name!][item.group_name!][dayIdx] += 2;
                      }
                    });

                    let rowIndex = 1;
                    const rows: React.ReactNode[] = [];
                    const dailyTotals = new Array(days.length).fill(0);
                    let grandTotal = 0;

                    Object.entries(grouped).forEach(([subject, groups]) => {
                      const groupEntries = Object.entries(groups);
                      groupEntries.forEach(([group, hours], gIdx) => {
                        const rowTotal = hours.reduce((a, b) => a + b, 0);
                        grandTotal += rowTotal;
                        hours.forEach((h, i) => dailyTotals[i] += h);

                        rows.push(
                          <tr key={`${subject}-${group}`}>
                            <td className="border border-black p-2 text-center">{rowIndex++}</td>
                            {gIdx === 0 ? (
                              <td className="border border-black p-2 font-bold text-blue-700" rowSpan={groupEntries.length}>{subject}</td>
                            ) : null}
                            <td className="border border-black p-2 font-bold text-blue-700 text-center">{group}</td>
                            {hours.map((h, i) => (
                              <td key={i} className={cn("border border-black p-1 text-center font-bold", getDay(days[i]) === 0 ? "bg-red-600 text-white" : "bg-white")}>
                                {h || ''}
                              </td>
                            ))}
                            <td className="border border-black p-2 text-center font-bold">{rowTotal}</td>
                            <td className="border border-black p-2"></td>
                          </tr>
                        );
                      });
                    });

                    rows.push(
                      <tr key="totals" className="font-bold">
                        <td className="border border-black p-2 text-center text-red-600" colSpan={3}>Jami</td>
                        {dailyTotals.map((t, i) => (
                          <td key={i} className={cn("border border-black p-1 text-center", getDay(days[i]) === 0 ? "bg-red-600 text-white" : "bg-white")}>
                            {t}
                          </td>
                        ))}
                        <td className="border border-black p-2 text-center">{grandTotal}</td>
                        <td className="border border-black p-2"></td>
                      </tr>
                    );

                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-serif italic text-[#5A5A40]">Fanlarim va Yuklamalar</h3>
            {!showSubjectForm && !editingSubject && (
              <button 
                onClick={() => setShowSubjectForm(true)}
                className="bg-[#5A5A40] text-white px-6 py-3 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-[#4A4A30] transition-colors shadow-lg shadow-[#5A5A40]/20"
              >
                <Plus size={18} /> Yangi fan qo'shish
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {(showSubjectForm || editingSubject) && (
              <div className="lg:col-span-1 bg-white p-6 rounded-[32px] shadow-sm border border-black/5 h-fit sticky top-8">
                <h3 className="text-lg font-serif italic mb-6">
                  {editingSubject ? 'Fanni Tahrirlash' : 'Yangi Fan Qo\'shish'}
                </h3>
                <form key={editingSubject?.id || 'new'} onSubmit={async (e) => {
                  await handleAddSubject(e);
                  setShowSubjectForm(false);
                }} className="space-y-4">
                  <input 
                    name="name" 
                    defaultValue={editingSubject?.name || ''} 
                    placeholder="Fan nomi" 
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-[#5A5A40]/20" 
                    required 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase text-gray-400 ml-1">Jami soat</label>
                      <input 
                        name="total_hours" 
                        type="number" 
                        defaultValue={editingSubject?.total_hours || ''} 
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-gray-400 ml-1">Ma'ruza</label>
                      <input 
                        name="lecture_hours" 
                        type="number" 
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none" 
                        defaultValue={editingSubject?.lecture_hours || 0} 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-gray-400 ml-1">Seminar</label>
                      <input 
                        name="seminar_hours" 
                        type="number" 
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none" 
                        defaultValue={editingSubject?.seminar_hours || 0} 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-gray-400 ml-1">Laboratoriya</label>
                      <input 
                        name="lab_hours" 
                        type="number" 
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none" 
                        defaultValue={editingSubject?.lab_hours || 0} 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-gray-400 ml-1">Amaliy</label>
                      <input 
                        name="practical_hours" 
                        type="number" 
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none" 
                        defaultValue={editingSubject?.practical_hours || 0} 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] uppercase text-gray-400 ml-1 mb-2 block">Guruhlarni tanlang</label>
                    <div className="grid grid-cols-2 gap-2">
                      {groups.map(g => (
                        <label key={g.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                          <input 
                            type="checkbox" 
                            value={g.id} 
                            defaultChecked={editingSubject?.groups?.some(eg => eg.id === g.id)}
                            className="rounded text-[#5A5A40]" 
                          />
                          <span className="text-xs">{g.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#5A5A40] text-white py-4 rounded-full font-medium shadow-lg shadow-[#5A5A40]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <Clock size={16} className="animate-spin" />}
                    {editingSubject ? 'Yangilash' : 'Saqlash'}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => { setEditingSubject(null); setShowSubjectForm(false); }}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 mt-2"
                  >
                    Bekor qilish
                  </button>
                </form>
              </div>
            )}

            <div className={cn("space-y-6", (showSubjectForm || editingSubject) ? "lg:col-span-2" : "lg:col-span-3")}>
              {subjects.map(s => (
                <div key={s.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-black/5 group">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h4 className="text-2xl font-serif italic text-[#5A5A40] mb-2">{s.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {s.groups?.map(g => (
                          <span key={g.id} className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-bold text-gray-400 border border-black/5 uppercase tracking-wider">{g.name}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingSubject(s)} className="p-2 text-gray-400 hover:text-[#5A5A40] rounded-xl hover:bg-gray-50 transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteSubject(s.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-gray-50 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {s.groups?.map(g => {
                      const groupSchedule = schedule.filter(item => item.subject_id === s.id && item.group_id === g.id);
                      
                      const stats = [
                        { label: 'Ma\'ruza', key: 'lecture', total: s.lecture_hours },
                        { label: 'Seminar', key: 'seminar', total: s.seminar_hours },
                        { label: 'Lab', key: 'lab', total: s.lab_hours },
                        { label: 'Amaliy', key: 'practical', total: s.practical_hours },
                      ];

                      return (
                        <div key={g.id} className="bg-gray-50/50 p-6 rounded-[32px] border border-black/5">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-bold text-sm text-gray-400 uppercase tracking-widest">{g.name} guruhi yuklamasi</h5>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-400 uppercase">Jami qoldi</p>
                              <p className="text-lg font-serif italic text-[#5A5A40]">
                                {s.total_hours - (groupSchedule.length * 2)} soat
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {stats.map(stat => {
                              const completed = groupSchedule.filter(item => item.lesson_type === stat.key).length * 2;
                              const remaining = stat.total - completed;
                              const percent = stat.total > 0 ? (completed / stat.total) * 100 : 0;

                              return (
                                <div key={stat.key} className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                                  <p className="text-[10px] text-gray-400 uppercase mb-1">{stat.label}</p>
                                  <div className="flex justify-between items-end mb-2">
                                    <p className="text-lg font-mono font-bold text-[#5A5A40]">{remaining}</p>
                                    <p className="text-[9px] text-gray-400">/{stat.total} soat</p>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full transition-all duration-500",
                                        percent >= 100 ? "bg-emerald-500" : "bg-[#5A5A40]"
                                      )}
                                      style={{ width: `${Math.min(percent, 100)}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between mt-2 text-[9px] text-gray-400">
                                    <span>O'tildi: {completed}</span>
                                    <span>Qoldi: {remaining}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="max-w-3xl mx-auto">
          <ChatView currentUser={user!} targetUser={{ id: 1, name: 'Administrator' }} />
        </div>
      )}

      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl relative"
          >
            <button 
              onClick={() => setSelectedSlot(null)} 
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-2"
            >
              <ChevronRight className="rotate-90" />
            </button>
            <div className="mb-6">
              <h3 className="text-xl font-serif italic">{format(selectedSlot.date, 'd-MMMM', { locale: uz })}</h3>
              <p className="text-sm text-gray-400">{selectedSlot.pair}-juftlik darsini kiritish</p>
            </div>
            
            <PairCard 
              pair={selectedSlot.pair}
              item={schedule.find(s => isSameDay(new Date(s.date), selectedSlot.date) && s.pair_number === selectedSlot.pair)}
              subjects={subjects}
              onSave={(sid, gid, type) => { saveSchedulePair(selectedSlot.pair, sid, gid, type, selectedSlot.date); }}
              onDelete={handleDeleteScheduleItem}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

interface PairCardProps {
  key?: any;
  pair: number;
  item?: ScheduleItem;
  subjects: Subject[];
  onSave: (sid: string, gid: string, type: string) => void;
  onDelete?: (id: number) => void;
  isSubmitting?: boolean;
}

function PairCard({ pair, item, subjects, onSave, onDelete, isSubmitting }: PairCardProps) {
  const [subjectId, setSubjectId] = useState(item?.subject_id.toString() || '');
  const [groupId, setGroupId] = useState(item?.group_id.toString() || '');
  const [type, setType] = useState(item?.lesson_type || '');

  useEffect(() => {
    setSubjectId(item?.subject_id.toString() || '');
    setGroupId(item?.group_id.toString() || '');
    setType(item?.lesson_type || '');
  }, [item]);

  const selectedSubject = subjects.find(s => s.id.toString() === subjectId);

  const types = [
    { id: 'lecture', label: 'Ma\'ruza', hours: selectedSubject?.lecture_hours },
    { id: 'seminar', label: 'Seminar', hours: selectedSubject?.seminar_hours },
    { id: 'lab', label: 'Laboratoriya', hours: selectedSubject?.lab_hours },
    { id: 'practical', label: 'Amaliy', hours: selectedSubject?.practical_hours }
  ].filter(t => t.hours && t.hours > 0);

  useEffect(() => {
    if (type && !types.find(t => t.id === type)) {
      setType('');
    }
  }, [subjectId, types, type]);

  useEffect(() => {
    if (groupId && selectedSubject && !selectedSubject.groups?.find(g => g.id.toString() === groupId)) {
      setGroupId('');
    }
  }, [subjectId, selectedSubject, groupId]);

  const handleSave = () => {
    onSave(subjectId, groupId, type);
  };

  const availableGroups = selectedSubject?.groups || [];

  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-black/5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">{pair}</span>
        <h4 className="text-sm font-serif italic text-gray-400">{pair}-juftlik</h4>
      </div>
      
      <select 
        value={subjectId} 
        onChange={(e) => setSubjectId(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-[#5A5A40]/20"
      >
        <option value="">Fanni tanlang</option>
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <select 
        value={groupId} 
        onChange={(e) => setGroupId(e.target.value)}
        disabled={!subjectId}
        className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none text-sm focus:ring-2 focus:ring-[#5A5A40]/20 disabled:opacity-50"
      >
        <option value="">Guruhni tanlang</option>
        {availableGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>

      <div className="space-y-2">
        {types.map(t => (
          <label key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input 
              type="radio" 
              name={`pair-${pair}-type`} 
              checked={type === t.id}
              onChange={() => setType(t.id)}
              className="text-[#5A5A40] focus:ring-[#5A5A40]"
            />
            <span className="text-xs font-medium text-gray-600">{t.label}</span>
          </label>
        ))}
      </div>

      <button 
        onClick={handleSave}
        disabled={isSubmitting || !subjectId || !groupId || !type}
        className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-400 hover:bg-[#5A5A40] hover:text-white py-3 rounded-full text-xs font-bold transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? <Clock size={14} className="animate-spin" /> : <CheckCircle2 size={14}/>} 
        Saqlash
      </button>

      {item && (
        <button 
          onClick={() => onDelete?.(item.id)}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-500 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
        >
          <Trash2 size={12}/> O'chirish
        </button>
      )}
    </div>
  );
}
