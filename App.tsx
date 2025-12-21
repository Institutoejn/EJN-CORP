

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { User, UserRole, Task, TaskStatus, Submission, Redemption, RedemptionStatus, Reward, CommunityPost, CommunityComment, AnonymousFeedback, FeedbackCategory, FeedbackStatus, TaskStatusTag, Notification, NotificationType, ChatMessage } from './types';
import { ICONS, LEVELS, STORE_CATEGORIES, CATEGORIES, TEAM_OPTIONS } from './constants';

// --- HELPERS ---
// getStorage foi removido pois os dados agora vêm do Supabase

interface EJNLogoProps {
  dark?: boolean;
  className?: string;
}

const EJNLogo: React.FC<EJNLogoProps> = ({ dark = false, className = "" }) => (
  <div className={`font-poppins font-black flex flex-col items-center leading-none ${className}`}>
    <div className="flex items-center gap-1.5 uppercase tracking-tighter">
      <span className={dark ? "text-white" : "text-brand-dark"}>EJN</span>
      <span className="text-brand-yellow">CORPORATE</span>
    </div>
    <span className={`text-[8px] font-extrabold tracking-ultra mt-1 opacity-60 ${dark ? "text-white" : "text-slate-400"}`}>
      PERFORMANCE HUB
    </span>
  </div>
);

const getStatusColor = (status: FeedbackStatus) => {
  switch(status) {
    case 'RECEIVED': return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'ANALYZING': return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'SOLVED': return 'bg-purple-50 text-purple-600 border-purple-100';
    case 'APPLIED': return 'bg-green-50 text-green-600 border-green-100';
    case 'ARCHIVED': return 'bg-slate-50 text-slate-400 border-slate-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  'RECEIVED': 'Recebida',
  'ANALYZING': 'Em análise',
  'SOLVED': 'Solução definida',
  'APPLIED': 'Ação aplicada',
  'ARCHIVED': 'Arquivada'
};

const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  'SUGGESTION': 'Sugestão de melhoria',
  'CRITICISM': 'Crítica construtiva',
  'COMPLAINT': 'Algo incomodando',
  'OTHER': 'Outro'
};

// --- CORE COMPONENTS ---

const Layout: React.FC<{
  user: User | null;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  children: React.ReactNode;
}> = ({ user, onLogout, notifications, onMarkAsRead, onClearAll, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const location = useLocation();

  if (!user) return null;

  const adminNav = [
    { label: 'Início', path: '/', icon: ICONS.Points },
    { label: 'Comunidade', path: '/comunidade', icon: ICONS.Community },
    { label: 'Chat Suporte', path: '/chat', icon: ICONS.Chat },
    { label: 'Painel Admin', path: '/admin', icon: ICONS.Admin },
    { label: 'Perfil', path: '/perfil', icon: ICONS.User },
  ];

  const collabNav = [
    { label: 'Início', path: '/', icon: ICONS.Points },
    { label: 'Missões', path: '/missoes', icon: ICONS.Task },
    { label: 'Loja', path: '/loja', icon: ICONS.Store },
    { label: 'Comunidade', path: '/comunidade', icon: ICONS.Community },
    { label: 'Chat Suporte', path: '/chat', icon: ICONS.Chat },
    { label: 'SAC Anônimo', path: '/sac', icon: ICONS.Voice },
    { label: 'Perfil', path: '/perfil', icon: ICONS.User },
  ];

  const navItems = user.role === UserRole.ADMIN ? adminNav : collabNav;

  const myNotifs = notifications.filter(n => n.userId === user.id || n.userId === 'ALL' || (user.role === UserRole.ADMIN && n.userId === 'ADMIN'));
  const unreadCount = myNotifs.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 w-80 bg-brand-dark transition-transform duration-300 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full p-8">
          <div className="mb-12 flex justify-between items-center">
            <EJNLogo dark className="scale-110" />
            <button className="lg:hidden text-white" onClick={() => setIsSidebarOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <nav className="flex-1 space-y-3">
            {navItems.map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-ultra transition-all ${location.pathname === item.path ? 'bg-brand-yellow text-brand-dark shadow-xl shadow-brand-yellow/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <button onClick={onLogout} className="mt-auto flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-ultra text-red-400 hover:bg-red-400/10 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            Sair do Hub
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <button className="lg:hidden p-3 bg-slate-100 rounded-xl" onClick={() => setIsSidebarOpen(true)}>
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
          </button>

          <div className="hidden lg:block text-slate-300 font-bold text-[9px] uppercase tracking-widest">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative">
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all relative ${unreadCount > 0 ? 'bg-brand-yellow/10 text-brand-dark' : 'bg-slate-50 text-slate-400'}`}>
                <ICONS.Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-2 sm:top-3 right-2 sm:right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-bounce" />}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 z-[70] animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Central de Alertas</h4>
                      <button onClick={onClearAll} className="text-[8px] font-bold text-slate-400 uppercase hover:text-brand-dark">Limpar tudo</button>
                    </div>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-hide">
                      {myNotifs.length === 0 ? (
                        <p className="text-[9px] text-slate-300 uppercase italic text-center py-8">Nenhum alerta no momento.</p>
                      ) : (
                        [...myNotifs].reverse().map(n => (
                          <div key={n.id} onClick={() => { onMarkAsRead(n.id); setIsNotifOpen(false); }} className={`p-4 rounded-2xl transition-all cursor-pointer relative border ${n.read ? 'opacity-40 border-transparent' : 'bg-slate-50 border-brand-yellow/10 hover:bg-slate-100'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <p className="text-[9px] font-black uppercase text-brand-dark pr-4">{n.title}</p>
                                {!n.read && <div className="w-1.5 h-1.5 bg-brand-yellow rounded-full shrink-0" />}
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">{n.message}</p>
                            <p className="text-[7px] font-bold text-slate-300 uppercase mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link to="/perfil" className="flex items-center gap-4 sm:pl-6 sm:border-l border-slate-200">
               <div className="text-right hidden sm:block">
                 <p className="text-[10px] font-black text-brand-dark uppercase tracking-tight">{user.name}</p>
                 <p className="text-[8px] font-bold text-brand-yellow uppercase tracking-widest">{user.points} Coins</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-brand-dark text-brand-yellow flex items-center justify-center font-black overflow-hidden shadow-lg border-2 border-white shrink-0">
                 {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" /> : user.name.charAt(0)}
               </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// --- SAC ANÔNIMO: PAINEL DE GESTÃO AVANÇADO ---

const AdminSACDashboard: React.FC<{
  feedbacks: AnonymousFeedback[];
  onUpdateFeedback: (id: string, updates: Partial<AnonymousFeedback>) => void;
}> = ({ feedbacks, onUpdateFeedback }) => {
  const [filterCategory, setFilterCategory] = useState<FeedbackCategory | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);

  const selectedFeedback = useMemo(() => 
    feedbacks.find(f => f.id === selectedFeedbackId) || null, 
    [feedbacks, selectedFeedbackId]
  );

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      const catMatch = filterCategory === 'ALL' || f.category === filterCategory;
      const statMatch = filterStatus === 'ALL' || f.status === filterStatus;
      const searchMatch = f.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.message.toLowerCase().includes(searchTerm.toLowerCase());
      return catMatch && statMatch && searchMatch;
    });
  }, [feedbacks, filterCategory, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const resolved = feedbacks.filter(f => f.status === 'APPLIED' || f.status === 'SOLVED').length;
    const byCategory = feedbacks.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, resolved, byCategory };
  }, [feedbacks]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-brand-dark uppercase tracking-tighter leading-none">Painel de Gestão SAC</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Central de Escuta Ativa e Melhoria Organizacional</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Total Relatos</p>
            <p className="text-2xl font-black text-brand-dark">{stats.total}</p>
          </div>
          <div className="bg-brand-dark p-6 rounded-[2.5rem] shadow-xl text-center">
            <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Resolvidos</p>
            <p className="text-2xl font-black text-brand-yellow">{stats.resolved}</p>
          </div>
        </div>
      </header>

      {/* Cluster Analysis & Quick Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {Object.entries(FEEDBACK_CATEGORY_LABELS).map(([key, label]) => (
          <div key={key} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
              <p className="text-xl font-black text-brand-dark mt-1">{stats.byCategory[key as FeedbackCategory] || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-6 md:p-8 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
           <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
           <input 
             type="text" 
             placeholder="Filtrar por palavras-chave..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-slate-50 border-none pl-12 pr-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 ring-brand-yellow/10 transition-all"
           />
        </div>
        <div className="flex gap-2 sm:gap-4">
           <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)} className="flex-1 bg-slate-50 border-none px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors">
              <option value="ALL">Categorias</option>
              {Object.entries(FEEDBACK_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
           </select>
           <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="flex-1 bg-slate-50 border-none px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-colors">
              <option value="ALL">Status</option>
              {Object.entries(FEEDBACK_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
           </select>
        </div>
      </div>

      {/* Table of Anonymous Reports */}
      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-widest text-slate-400">Recebido em</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-widest text-slate-400">Assunto</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-widest text-slate-400">Status Atual</th>
                <th className="px-10 py-7 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFeedbacks.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedFeedbackId(f.id)}>
                  <td className="px-10 py-7 text-[10px] font-bold text-slate-400">{new Date(f.createdAt).toLocaleDateString()}</td>
                  <td className="px-10 py-7">
                    <p className="text-[11px] font-black text-brand-dark uppercase tracking-tight">{f.subject}</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">{FEEDBACK_CATEGORY_LABELS[f.category]}</p>
                  </td>
                  <td className="px-10 py-7">
                    <span className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full border ${getStatusColor(f.status)}`}>
                      {FEEDBACK_STATUS_LABELS[f.status]}
                    </span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <button className="p-3 bg-brand-dark text-brand-yellow rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 active:scale-95 shadow-lg">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredFeedbacks.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="max-w-xs mx-auto space-y-4 opacity-30">
                       <ICONS.Voice className="w-12 h-12 mx-auto" />
                       <p className="text-[10px] font-black uppercase tracking-widest italic">Nenhum relato para exibir.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution & Management Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-brand-dark/40 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
              <header className="p-8 md:p-12 pb-6 md:pb-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                 <div className="space-y-3">
                    <div className="flex items-center gap-3">
                       <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${getStatusColor(selectedFeedback.status)} shadow-sm`}>
                          {FEEDBACK_STATUS_LABELS[selectedFeedback.status]}
                       </span>
                       <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Protocolo: {selectedFeedback.id.slice(-6)}</span>
                    </div>
                    <h3 className="text-xl md:text-3xl font-black text-brand-dark uppercase tracking-tighter leading-tight max-w-xl">{selectedFeedback.subject}</h3>
                 </div>
                 <button onClick={() => setSelectedFeedbackId(null)} className="p-3 bg-white hover:bg-slate-100 rounded-2xl transition-all shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 scrollbar-hide">
                 <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-brand-yellow rounded-full" /> Conteúdo do Relato
                    </h4>
                    <div className="bg-brand-dark text-white p-8 rounded-[2.5rem] text-sm font-medium leading-relaxed italic relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                          <ICONS.Voice className="w-24 h-24" />
                       </div>
                       <p className="relative z-10">"{selectedFeedback.message}"</p>
                    </div>
                 </section>

                 <section className="pt-12 border-t border-slate-100 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Atualizar Status</label>
                          <select 
                            value={selectedFeedback.status} 
                            onChange={(e) => onUpdateFeedback(selectedFeedback.id, { status: e.target.value as FeedbackStatus })}
                            className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-4 ring-brand-yellow/10 transition-all appearance-none cursor-pointer"
                          >
                            {Object.entries(FEEDBACK_STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                          <div className="bg-slate-100 p-5 rounded-2xl text-[11px] font-black uppercase text-slate-500 border border-slate-200">
                             {FEEDBACK_CATEGORY_LABELS[selectedFeedback.category]}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Anotações Internas</label>
                       <textarea 
                         value={selectedFeedback.internalNotes || ''} 
                         onChange={(e) => onUpdateFeedback(selectedFeedback.id, { internalNotes: e.target.value })} 
                         placeholder="Registre aqui investigações..." 
                         rows={4} 
                         className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[2.5rem] text-xs font-medium outline-none focus:ring-4 ring-brand-yellow/10 resize-none transition-all" 
                       />
                    </div>

                    <div className="space-y-3">
                       <label className="text-[9px] font-black text-brand-dark uppercase tracking-widest ml-1">Plano de Ação</label>
                       <textarea 
                         value={selectedFeedback.solutionAdopted || ''} 
                         onChange={(e) => onUpdateFeedback(selectedFeedback.id, { solutionAdopted: e.target.value })} 
                         placeholder="Descreva a solução implementada..." 
                         rows={4} 
                         className="w-full bg-brand-yellow/5 border border-brand-yellow/20 p-6 rounded-[2.5rem] text-xs font-medium outline-none focus:ring-4 ring-brand-yellow/10 resize-none transition-all" 
                       />
                    </div>
                 </section>
              </div>

              <footer className="p-8 md:p-12 pt-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                 <button 
                   onClick={() => setSelectedFeedbackId(null)} 
                   className="bg-brand-dark text-brand-yellow px-10 md:px-14 py-4 md:py-5 rounded-2xl md:rounded-3xl text-[10px] md:text-[11px] font-black uppercase tracking-ultra shadow-xl hover:scale-105 active:scale-95 transition-all"
                 >
                   Salvar
                 </button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

// --- COMMUNITY ---

const CommunityFeed: React.FC<{
  user: User;
  users: User[];
  posts: CommunityPost[];
  onLike: (postId: string) => void;
  onComment: (postId: string, text: string) => void;
  onPost: (content: string, image?: string) => void;
  onDelete: (postId: string) => void;
}> = ({ user, users, posts, onLike, onComment, onPost, onDelete }) => {
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | undefined>();
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewPostImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const handleViewProfile = (userId: string) => {
    const userToView = users.find(u => u.id === userId);
    if (userToView) setViewingProfile(userToView);
  }

  if (!user) return null;
  
  const getUserById = (id: string) => users.find(u => u.id === id);

  return (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 pb-20">
      {viewingProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-brand-dark/40" onClick={() => setViewingProfile(null)}>
          <div className="bg-white rounded-[3.5rem] shadow-2xl max-w-sm w-full text-center p-12 pt-20 relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-[3rem] bg-brand-dark text-brand-yellow flex items-center justify-center text-5xl font-black shadow-2xl overflow-hidden ring-8 ring-white">
              {viewingProfile.avatarUrl ? <img src={viewingProfile.avatarUrl} className="w-full h-full object-cover" alt="" /> : viewingProfile.name.charAt(0)}
            </div>
            <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">{viewingProfile.name}</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{viewingProfile.email}</p>
            {viewingProfile.bio && <p className="text-xs text-slate-600 mt-6 italic">"{viewingProfile.bio}"</p>}
          </div>
        </div>
      )}

      <div className="bg-white p-6 sm:p-8 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-yellow text-brand-dark flex items-center justify-center font-black shrink-0 overflow-hidden shadow-md">
            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" /> : user.name.charAt(0)}
          </div>
          <textarea placeholder={`O que está acontecendo?`} value={newPostText} onChange={(e) => setNewPostText(e.target.value)} className="flex-1 bg-slate-50 border-none p-4 rounded-2xl text-xs font-medium outline-none resize-none h-24 focus:ring-4 ring-brand-yellow/10 transition-all" />
        </div>
        
        {newPostImage && (
          <div className="relative rounded-2xl overflow-hidden border border-slate-100 group">
            <img src={newPostImage} className="w-full h-48 object-cover" alt="" />
            <button onClick={() => setNewPostImage(undefined)} className="absolute top-2 right-2 p-2 bg-brand-dark/80 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-brand-yellow/10 hover:text-brand-dark transition-all text-[9px] font-black uppercase tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            Incluir Foto
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
          
          <button 
            disabled={!newPostText.trim() && !newPostImage}
            onClick={() => { onPost(newPostText, newPostImage); setNewPostText(''); setNewPostImage(undefined); }}
            className="bg-brand-dark text-brand-yellow px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-ultra shadow-xl hover:scale-105 transition-all disabled:opacity-30"
          >Publicar (+5 C)</button>
        </div>
      </div>

      <div className="space-y-8 pb-20">
        {[...posts].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(post => {
            const author = getUserById(post.userId);
            return (
              <div key={post.id} className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 pb-0 flex items-center justify-between group">
                  <button onClick={() => handleViewProfile(post.userId)} className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-brand-dark flex items-center justify-center font-black overflow-hidden shadow-sm shrink-0">
                      {post.userAvatar ? <img src={post.userAvatar} className="w-full h-full object-cover" alt="" /> : post.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-[11px] font-black text-brand-dark uppercase tracking-tight leading-none">{post.userName}</h4>
                        {author?.role === UserRole.ADMIN && <span className="text-[7px] font-black bg-brand-yellow text-brand-dark px-2 py-0.5 rounded-md">GESTOR</span>}
                      </div>
                      <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">{new Date(post.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </button>
                  {(user.role === UserRole.ADMIN || post.userId === user.id) && (
                    <button onClick={() => onDelete(post.id)} className="p-2 text-slate-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
                <div className="p-6 sm:p-8 space-y-4">
                  {post.content && <p className="text-xs font-medium text-slate-700 leading-relaxed">{post.content}</p>}
                  {post.imageUrl && <div className="rounded-[2.5rem] overflow-hidden border border-slate-100"><img src={post.imageUrl} className="w-full h-auto max-h-[500px] object-cover" alt="" /></div>}
                </div>
                <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 flex items-center gap-6">
                  <button disabled={post.userId === user.id} onClick={() => onLike(post.id)} className={`flex items-center gap-2 group transition-all disabled:opacity-40 ${post.likes.includes(user.id) ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}>
                    <div className={`p-2 rounded-xl transition-all ${post.likes.includes(user.id) ? 'bg-red-50' : 'bg-slate-50'}`}><svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${post.likes.includes(user.id) ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{post.likes.length}</span>
                  </button>
                  <button onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)} className="flex items-center gap-2 group text-slate-400 hover:text-brand-dark transition-all">
                    <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-brand-yellow/10 transition-all"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785 0.247 0.247 0 00.09.403 7.057 7.057 0 002.693.535c.99 0 1.932-.215 2.783-.599.508-.23 1.08-.237 1.588-.005.824.376 1.724.581 2.673.581z" /></svg></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{post.comments.length}</span>
                  </button>
                </div>
                {commentingOn === post.id && (
                  <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-6 mt-6 border-t border-slate-100 space-y-6 animate-in fade-in duration-300">
                    {post.comments.length > 0 && (
                      <div className="space-y-4 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                        {[...post.comments].reverse().map(comment => {
                           const commentAuthor = getUserById(comment.userId);
                           return (
                            <div key={comment.id} className="flex items-start gap-3">
                              <button onClick={() => handleViewProfile(comment.userId)} className="w-8 h-8 rounded-lg bg-slate-100 text-brand-dark flex items-center justify-center font-black shrink-0 overflow-hidden shadow-sm">
                                {comment.userAvatar ? <img src={comment.userAvatar} className="w-full h-full object-cover" alt="" /> : comment.userName.charAt(0)}
                              </button>
                              <div className="flex-1 bg-slate-50 p-3 rounded-xl">
                                <button onClick={() => handleViewProfile(comment.userId)} className="text-[9px] font-black text-brand-dark uppercase tracking-tight text-left flex items-center gap-2">
                                  {comment.userName}
                                  {commentAuthor?.role === UserRole.ADMIN && <span className="text-[6px] font-black bg-brand-yellow text-brand-dark px-1.5 py-0.5 rounded">GESTOR</span>}
                                </button>
                                <p className="text-[10px] text-slate-600 font-medium mt-1">{comment.text}</p>
                              </div>
                            </div>
                           )
                        })}
                      </div>
                    )}
                    {post.userId !== user.id && (
                      <form onSubmit={(e) => { e.preventDefault(); if(commentText.trim()) { onComment(post.id, commentText); setCommentText(''); } }} className="flex gap-3 items-center">
                        <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Adicionar um comentário..." className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs font-medium outline-none focus:ring-2 ring-brand-yellow/30" />
                        <button type="submit" className="p-3 bg-brand-dark text-brand-yellow rounded-lg shadow-md hover:scale-105 transition-transform">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )
        })}
      </div>
    </div>
  );
};

// --- VIEWS ---

const HomeView: React.FC<{ 
  user: User | null; 
  users: User[]; 
  tasks: Task[]; 
  submissions: Submission[];
  redemptions: Redemption[];
  posts: CommunityPost[];
  onUpdateProfile: (userId: string, updatedData: Partial<User>) => void;
}> = ({ user, users, tasks, submissions, redemptions, posts, onUpdateProfile }) => {
  if (!user) return null;

  if (user.role === UserRole.ADMIN) {
    const colaboradores = users.filter(u => u.role === UserRole.COLABORADOR);
    const missionsCompleted = (userId: string) => submissions.filter(s => s.userId === userId && s.status === TaskStatus.APPROVED).length;

    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        <header>
          <h2 className="text-3xl md:text-4xl font-black text-brand-dark uppercase tracking-tighter leading-none">Visão Estratégica</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-3">God View do Hub EJN</p>
        </header>

        <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100">
             <h3 className="text-lg font-black text-brand-dark uppercase tracking-tighter">Status dos Colaboradores</h3>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Nome do Colaborador</th>
                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Missões Concluídas</th>
                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Saldo Atual (Coins)</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {colaboradores.map(colab => (
                      <tr key={colab.id}>
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black overflow-hidden shrink-0">
                                  {colab.avatarUrl ? <img src={colab.avatarUrl} className="w-full h-full object-cover" /> : colab.name.charAt(0)}
                               </div>
                               <div>
                                  <p className="text-xs font-black text-brand-dark">{colab.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">{colab.team}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-5 text-sm font-bold">{missionsCompleted(colab.id)}</td>
                         <td className="px-8 py-5 text-sm font-bold text-brand-yellow">{colab.points.toLocaleString()}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    );
  }
  
  // Colaborador Strategic Dashboard
  const handleStatusToggle = () => {
    if (!user) return;
    const newStatus = user.availabilityStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    onUpdateProfile(user.id, { availabilityStatus: newStatus });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getDeadlineInfo = (deadline: string | undefined): { text: string; color: string; urgent: boolean } | null => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    now.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Atrasado', color: 'bg-red-100 text-red-600', urgent: true };
    if (diffDays === 0) return { text: 'Entrega Hoje', color: 'bg-amber-100 text-amber-600', urgent: true };
    return null; // Don't show for future tasks
  }

  const myPendingTasks = tasks
    .filter(t => (t.targetTeam === 'TODOS' || t.targetTeam === user.team) && t.statusTag === 'PENDENTE')
    .map(task => ({ ...task, deadlineInfo: getDeadlineInfo(task.deadline) }))
    .sort((a, b) => {
        if (a.deadlineInfo?.urgent && !b.deadlineInfo?.urgent) return -1;
        if (!a.deadlineInfo?.urgent && b.deadlineInfo?.urgent) return 1;
        if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;
        return 0;
    });

  const mostLikedPost = [...posts]
    .filter(p => new Date(p.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000))
    .sort((a, b) => b.likes.length - a.likes.length)[0] || [...posts].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
  const HeaderContent = () => (
    <div className="bg-white p-6 sm:p-8 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-brand-dark uppercase tracking-tighter leading-none">{getGreeting()}, {user.name.split(' ')[0]}!</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Seu painel de comando</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right">
                <p className="text-xl sm:text-2xl font-black text-brand-yellow">{user.points}</p>
                <p className="text-[8px] font-black text-slate-300 uppercase">EJN Coins</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-full">
                <button onClick={handleStatusToggle} className={`px-4 py-2 text-[9px] font-black uppercase rounded-full transition-all ${user.availabilityStatus === 'ONLINE' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`}>Online</button>
                <button onClick={handleStatusToggle} className={`px-4 py-2 text-[9px] font-black uppercase rounded-full transition-all ${user.availabilityStatus !== 'ONLINE' ? 'bg-white shadow-sm text-slate-600' : 'text-slate-400'}`}>Focado</button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <header className="lg:hidden">
                    <HeaderContent />
                </header>

                <section>
                  <div className="grid grid-cols-3 gap-4">
                      <Link to="/sac" className="bg-white rounded-3xl p-6 text-center flex flex-col items-center justify-center gap-2 border border-slate-200 shadow-sm hover:border-brand-yellow/50 transition-all">
                          <ICONS.Voice className="w-6 h-6 text-slate-400"/>
                          <span className="text-[9px] font-black uppercase tracking-widest">Novo SAC</span>
                      </Link>
                      <Link to="/comunidade" className="bg-white rounded-3xl p-6 text-center flex flex-col items-center justify-center gap-2 border border-slate-200 shadow-sm hover:border-brand-yellow/50 transition-all">
                          <ICONS.Community className="w-6 h-6 text-slate-400"/>
                          <span className="text-[9px] font-black uppercase tracking-widest">Postar</span>
                      </Link>
                      <Link to="/chat" className="bg-white rounded-3xl p-6 text-center flex flex-col items-center justify-center gap-2 border border-slate-200 shadow-sm hover:border-brand-yellow/50 transition-all">
                          <ICONS.Chat className="w-6 h-6 text-slate-400"/>
                          <span className="text-[9px] font-black uppercase tracking-widest">Chamados</span>
                      </Link>
                  </div>
                </section>

                <section>
                    <div className="bg-white p-6 sm:p-8 rounded-[3.5rem] border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-brand-dark uppercase tracking-tighter">Foco do Dia</h3>
                        {myPendingTasks.length > 0 ? (
                            <div className="space-y-4 mt-6">
                                {myPendingTasks.slice(0, 5).map(task => (
                                    <div key={task.id} className="bg-slate-50/70 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-100">
                                        <div>
                                            <div className="flex items-center gap-3">
                                               {task.deadlineInfo && <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${task.deadlineInfo.color}`}>{task.deadlineInfo.text}</span>}
                                               <h4 className="text-xs font-black text-brand-dark uppercase tracking-tight">{task.title}</h4>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Criado por: {task.creatorName}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button className="px-5 py-2.5 rounded-lg bg-white shadow-sm text-[9px] font-black uppercase tracking-widest hover:bg-slate-100">Iniciar</button>
                                            <Link to={`/chat?managerId=${task.creatorId}&taskId=${task.id}`} className="p-2.5 rounded-lg bg-white shadow-sm text-slate-500 hover:bg-slate-100"><ICONS.Chat className="w-4 h-4"/></Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <ICONS.Task className="w-12 h-12 mx-auto opacity-20 mb-4" />
                                <p className="text-xs font-bold max-w-xs mx-auto">Tudo limpo por aqui! Aproveite para interagir na comunidade ou resgatar prêmios.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <div className="lg:col-span-1 space-y-8">
                <header className="hidden lg:block">
                    <HeaderContent />
                </header>
                
                <section>
                    <div className="bg-white p-6 sm:p-8 rounded-[3.5rem] border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-black text-brand-dark uppercase tracking-tighter mb-6">Pulse da Comunidade</h3>
                        {mostLikedPost ? (
                            <div className="space-y-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black overflow-hidden shrink-0">
                                      {mostLikedPost.userAvatar ? <img src={mostLikedPost.userAvatar} alt="" className="w-full h-full object-cover" /> : mostLikedPost.userName.charAt(0)}
                                  </div>
                                  <div>
                                     <p className="text-xs font-black text-brand-dark uppercase">{mostLikedPost.userName}</p>
                                     <p className="text-[8px] font-bold text-slate-400 uppercase">Post Destaque</p>
                                  </div>
                               </div>
                               {mostLikedPost.content && <p className="text-xs text-slate-600 leading-relaxed max-h-24 overflow-hidden text-ellipsis">"{mostLikedPost.content}"</p>}
                               <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                  <div className="flex items-center gap-2 text-red-500">
                                    <ICONS.User className="w-4 h-4" />
                                    <span className="text-[9px] font-black">{mostLikedPost.likes.length} Curtidas</span>
                                  </div>
                                  <Link to="/comunidade" className="text-[9px] font-black uppercase tracking-widest text-brand-dark">Ver Mais →</Link>
                               </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <p className="text-xs font-bold">A comunidade está quieta... Que tal fazer o primeiro post?</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    </div>
  );
};

const MissoesView: React.FC<{ user: User; tasks: Task[]; }> = ({ user, tasks }) => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const myTasks = useMemo(() => tasks.filter(t => (t.targetTeam === 'TODOS' || t.targetTeam === user.team) && t.statusTag === 'PENDENTE'), [tasks, user.team]);

  const filteredTasks = useMemo(() => {
    if (selectedCategory === 'Todos') {
      return myTasks;
    }
    return myTasks.filter(task => task.category === selectedCategory);
  }, [myTasks, selectedCategory]);

  const getDeadlineInfo = (deadline: string | undefined): { text: string; color: string; urgent: boolean } | null => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    now.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Atrasado', color: 'bg-red-100 text-red-600 border-red-200', urgent: true };
    if (diffDays === 0) return { text: 'Entrega Hoje', color: 'bg-amber-100 text-amber-600 border-amber-200', urgent: true };
    
    const daysLeft = diffDays > 1 ? `${diffDays} dias` : `${diffDays} dia`;
    return { text: `Vence em ${daysLeft}`, color: 'bg-slate-100 text-slate-500 border-slate-200', urgent: false };
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl md:text-4xl font-black text-brand-dark uppercase tracking-tighter leading-none">Central de Missões</h2>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Você tem {myTasks.length} missões pendentes. Execute e seja recompensado.</p>
      </header>
      
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {['Todos', ...CATEGORIES].map(category => (
          <button 
            key={category} 
            onClick={() => setSelectedCategory(category)}
            className={`shrink-0 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedCategory === category ? 'bg-brand-dark text-brand-yellow shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:border-brand-dark/20'}`}
          >
            {category}
          </button>
        ))}
      </div>

      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTasks.map(task => {
            const deadlineInfo = getDeadlineInfo(task.deadline);
            const isExpanded = expandedTasks.includes(task.id);
            return (
              <div key={task.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-8 flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex-1">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center flex-wrap gap-2">
                            <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">{task.category}</span>
                            {deadlineInfo && (
                                <span className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-full border ${deadlineInfo.color}`}>{deadlineInfo.text}</span>
                            )}
                        </div>
                        <span className="text-lg font-black text-brand-yellow shrink-0">+{task.points} C</span>
                    </div>

                    <h3 className="text-xl font-black text-brand-dark uppercase tracking-tighter my-5 leading-tight">{task.title}</h3>
                    
                    <div className="mb-6">
                      <p className={`text-xs text-slate-500 leading-relaxed transition-all duration-300 ${!isExpanded && task.description.length > 100 ? 'line-clamp-3' : ''}`}>
                          {task.description}
                      </p>
                      {task.description.length > 100 && ( 
                          <button 
                              onClick={() => toggleExpand(task.id)} 
                              className="text-[9px] font-black uppercase tracking-widest text-brand-dark hover:text-brand-yellow transition-colors mt-2"
                          >
                              {isExpanded ? 'VER MENOS' : 'VER MAIS'}
                          </button>
                      )}
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-100 space-y-5">
                    <div className="text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CRIADO POR</p>
                        <p className="text-[10px] font-black text-brand-dark uppercase tracking-wider">{task.creatorName}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex-1 bg-brand-dark text-brand-yellow px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-ultra shadow-lg hover:scale-105 transition-transform">
                            {task.evidenceRequired ? 'Enviar Evidência' : 'Concluir'}
                        </button>
                        <Link to={`/chat?managerId=${task.creatorId}&taskId=${task.id}`} className="p-4 bg-slate-100 text-slate-500 rounded-2xl hover:bg-brand-yellow/20 transition-colors">
                            <ICONS.Chat className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-24 text-slate-400">
          <ICONS.Task className="w-16 h-16 mx-auto opacity-20 mb-6" />
          <h3 className="text-lg font-black text-slate-400 uppercase tracking-tight">Nenhuma Missão Encontrada</h3>
          <p className="text-xs mt-2 max-w-xs mx-auto">Não há missões disponíveis para a categoria "{selectedCategory}". Tente outro filtro.</p>
        </div>
      )}
    </div>
  );
};


const ChatView: React.FC<{ 
  user: User; 
  users: User[]; 
  tasks: Task[];
  messages: ChatMessage[]; 
  onSendMessage: (receiverId: string, text: string, taskId?: string) => void;
}> = ({ user, users, tasks, messages, onSendMessage }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(searchParams.get('managerId'));
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const managers = users.filter(u => u.role === UserRole.ADMIN);
  const selectedManager = users.find(u => u.id === selectedManagerId);
  
  const taskId = searchParams.get('taskId');
  const taskInContext = taskId ? tasks.find(t => t.id === taskId) : null;

  const conversation = useMemo(() => {
    if (!selectedManagerId) return [];
    return messages.filter(m => 
      (m.senderId === user.id && m.receiverId === selectedManagerId) || 
      (m.senderId === selectedManagerId && m.receiverId === user.id)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, user.id, selectedManagerId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const isOnline = (manager: User) => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= 8 && currentHour < 18;
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedManagerId) {
      onSendMessage(selectedManagerId, newMessage, taskId || undefined);
      setNewMessage('');
    }
  };

  const handleSelectManager = (managerId: string) => {
    setSelectedManagerId(managerId);
    setSearchParams(params => {
        params.delete('taskId');
        return params;
    });
  }

  const showChatList = !selectedManagerId;

  return (
    <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] flex overflow-hidden">
      <aside className={`w-full md:w-96 border-r border-slate-100 flex flex-col transition-all duration-300 ${showChatList ? 'block' : 'hidden md:flex'}`}>
        <header className="p-8 border-b border-slate-100">
          <h2 className="text-xl font-black text-brand-dark uppercase tracking-tighter">Chat Suporte</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {managers.map(manager => (
            <button key={manager.id} onClick={() => handleSelectManager(manager.id)} className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-colors ${selectedManagerId === manager.id ? 'bg-brand-yellow/10' : 'hover:bg-slate-50'}`}>
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-brand-dark text-brand-yellow flex items-center justify-center font-black overflow-hidden shadow-sm shrink-0">
                  {manager.avatarUrl ? <img src={manager.avatarUrl} alt="" className="w-full h-full object-cover"/> : manager.name.charAt(0)}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isOnline(manager) ? 'bg-green-500' : 'bg-slate-400'}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-brand-dark uppercase">{manager.name}</p>
                <p className={`text-[8px] font-bold uppercase tracking-widest ${isOnline(manager) ? 'text-green-600' : 'text-slate-400'}`}>{isOnline(manager) ? 'Online' : 'Offline'}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>
      <main className={`flex-1 flex-col ${!showChatList ? 'flex' : 'hidden md:flex'}`}>
        {selectedManager ? (
          <>
            <header className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedManagerId(null)} className="md:hidden p-2 bg-slate-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div>
                    <h3 className="text-sm font-black text-brand-dark uppercase">{selectedManager.name}</h3>
                    {taskInContext && <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Dúvida sobre: "{taskInContext.title}"</p>}
                  </div>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {conversation.map(msg => (
                <div key={msg.id} className={`flex items-end gap-3 ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  {msg.senderId !== user.id && <div className="w-8 h-8 rounded-lg bg-slate-100 text-brand-dark flex items-center justify-center font-black shrink-0">{selectedManager.name.charAt(0)}</div>}
                  <div className={`max-w-md p-4 rounded-2xl ${msg.senderId === user.id ? 'bg-brand-dark text-white rounded-br-none' : (msg.isAutoReply ? 'bg-amber-50 text-amber-800 border border-amber-100 rounded-bl-none italic' : 'bg-slate-100 text-slate-700 rounded-bl-none')}`}>
                    <p className="text-xs leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-8 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1 bg-transparent p-3 text-xs font-medium outline-none" />
                <button type="submit" className="p-4 bg-brand-dark text-brand-yellow rounded-xl shadow-lg hover:scale-105 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" /></svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-12 text-slate-400">
            <ICONS.Chat className="w-16 h-16 opacity-20 mb-6" />
            <h3 className="text-lg font-black text-slate-400 uppercase tracking-tight">Selecione um gestor</h3>
            <p className="text-xs mt-1">para iniciar uma conversa ou tirar dúvidas.</p>
          </div>
        )}
      </main>
    </div>
  );
};

// --- ADMIN PANEL ---
const AdminPanelView: React.FC<{
  user: User;
  tasks: Task[];
  rewards: Reward[];
  onAddTask: (task: Omit<Task, 'id' | 'creatorId' | 'creatorName' | 'creatorTeam'>) => void;
  onUpdateTask: (id: string, task: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onAddReward: (reward: Omit<Reward, 'id'>) => void;
  onUpdateReward: (id: string, reward: Partial<Reward>) => void;
  onDeleteReward: (id: string) => void;
}> = ({ user, tasks, rewards, onAddTask, onUpdateTask, onDeleteTask, onAddReward, onUpdateReward, onDeleteReward }) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'rewards'>('missions');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Task | Reward | null>(null);
  const [modalType, setModalType] = useState<'task' | 'reward' | null>(null);

  const handleOpenModal = (item: Task | Reward | null, type: 'task' | 'reward') => {
    setEditingItem(item);
    setModalType(type);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setModalType(null);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-brand-dark uppercase tracking-tighter leading-none">Painel Admin</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-3">Fábrica de Conteúdo e Recompensas</p>
          </div>
          <button 
            onClick={() => handleOpenModal(null, activeTab === 'missions' ? 'task' : 'reward')}
            className="bg-brand-dark text-brand-yellow px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-ultra shadow-xl hover:scale-105 transition-transform"
          >
            {activeTab === 'missions' ? 'Nova Missão' : 'Novo Brinde'}
          </button>
      </header>

      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm p-4">
        <div className="flex border-b border-slate-100">
           <button onClick={() => setActiveTab('missions')} className={`px-8 py-4 text-sm font-bold transition-colors ${activeTab === 'missions' ? 'text-brand-dark border-b-2 border-brand-dark' : 'text-slate-400 hover:text-brand-dark'}`}>Gestão de Missões</button>
           <button onClick={() => setActiveTab('rewards')} className={`px-8 py-4 text-sm font-bold transition-colors ${activeTab === 'rewards' ? 'text-brand-dark border-b-2 border-brand-dark' : 'text-slate-400 hover:text-brand-dark'}`}>Gestão de Loja</button>
        </div>
        
        <div className="p-4">
          {activeTab === 'missions' ? (
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="bg-slate-50/70 p-4 rounded-2xl flex items-center justify-between">
                   <div>
                      <p className="text-xs font-black text-brand-dark uppercase tracking-tight">{task.title}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{task.points} Coins | {task.targetTeam}</p>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => handleOpenModal(task, 'task')} className="p-3 bg-white shadow-sm rounded-xl hover:bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                     <button onClick={() => onDeleteTask(task.id)} className="p-3 bg-white shadow-sm rounded-xl text-red-500 hover:bg-red-50"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {rewards.map(reward => (
                <div key={reward.id} className="bg-slate-50/70 p-4 rounded-2xl flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                         {reward.imageUrl && <img src={reward.imageUrl} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                         <p className="text-xs font-black text-brand-dark uppercase tracking-tight">{reward.name}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase">{reward.cost} Coins | Estoque: {reward.stock}</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => handleOpenModal(reward, 'reward')} className="p-3 bg-white shadow-sm rounded-xl hover:bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                     <button onClick={() => onDeleteReward(reward.id)} className="p-3 bg-white shadow-sm rounded-xl text-red-500 hover:bg-red-50"><svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {isModalOpen && (
        <AdminModal
          item={editingItem}
          type={modalType}
          onClose={handleCloseModal}
          onSave={(data) => {
            if (modalType === 'task') {
              if (editingItem) onUpdateTask(editingItem.id, data);
              else onAddTask(data as any);
            } else {
              if (editingItem) onUpdateReward(editingItem.id, data);
              else onAddReward(data as any);
            }
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
};


const AdminModal: React.FC<{
  item: Task | Reward | null;
  type: 'task' | 'reward' | null;
  onClose: () => void;
  onSave: (data: Partial<Task & Reward>) => void;
}> = ({ item, type, onClose, onSave }) => {
  const [formData, setFormData] = useState<any>(item || {});

  useEffect(() => {
    setFormData(item || (type === 'task' ? { points: 100, difficulty: 'EASY', recurrence: 'ONCE', targetTeam: 'TODOS', category: CATEGORIES[0] } : { cost: 100, stock: 1, category: STORE_CATEGORIES[1] }));
  }, [item, type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setFormData((prev: any) => ({ ...prev, [name]: isNumber ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!type) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-brand-dark/40 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <header className="p-8 pb-6 border-b border-slate-100 flex justify-between items-start">
          <h3 className="text-xl font-black text-brand-dark uppercase tracking-tighter">
            {item ? 'Editar' : 'Criar'} {type === 'task' ? 'Missão' : 'Brinde'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl"><svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          {type === 'task' ? (
            <>
              <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Título</label><input required name="title" value={formData.title || ''} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold" /></div>
              <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label><textarea required name="description" value={formData.description || ''} onChange={handleChange} rows={4} className="w-full bg-slate-50 p-4 rounded-xl text-sm" /></div>
              <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Link de Referência</label><input name="referenceLinks" value={formData.referenceLinks?.[0] || ''} onChange={e => setFormData({...formData, referenceLinks: [e.target.value]})} className="w-full bg-slate-50 p-4 rounded-xl text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pontos</label><input required type="number" name="points" value={formData.points || ''} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-xl text-sm" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label><select name="category" value={formData.category} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-xl text-sm"><option disabled>Selecione</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Time Alvo</label><select name="targetTeam" value={formData.targetTeam} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-xl text-sm"><option disabled>Selecione</option>{TEAM_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Prazo</label><input type="date" name="deadline" value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''} onChange={e => setFormData({...formData, deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="w-full bg-slate-50 p-4 rounded-xl text-sm" /></div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Brinde</label><input required name="name" value={formData.name || ''} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold" /></div>
              <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label><textarea required name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="w-full bg-slate-50 p-4 rounded-xl text-sm" /></div>
              <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">URL da Foto</label><input name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-xl text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Custo (Coins)</label><input required type="number" name="cost" value={formData.cost || ''} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-xl text-sm" /></div>
                <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Estoque</label><input required type="number" name="stock" value={formData.stock || ''} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-xl text-sm" /></div>
                <div className="space-y-1.5 col-span-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label><select name="category" value={formData.category} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-xl text-sm"><option disabled>Selecione</option>{STORE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
            </>
          )}
        </form>
        <footer className="p-8 pt-6 border-t border-slate-100 flex justify-end">
          <button onClick={handleSubmit} className="bg-brand-dark text-brand-yellow px-14 py-5 rounded-3xl text-[11px] font-black uppercase tracking-ultra shadow-xl hover:scale-105 transition-transform">Salvar</button>
        </footer>
      </div>
    </div>
  );
};

// --- LOJA VIEW ---
const LojaView: React.FC<{
  user: User;
  rewards: Reward[];
  onRedeem: (rewardId: string) => Promise<boolean>;
}> = ({ user, rewards, onRedeem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redeemedItem, setRedeemedItem] = useState<Reward | null>(null);

  const filteredRewards = useMemo(() => {
    return rewards.filter(r => {
      const categoryMatch = selectedCategory === 'Todos' || r.category === selectedCategory;
      const searchMatch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [rewards, searchTerm, selectedCategory]);

  const handleRedeemClick = async (reward: Reward) => {
    const success = await onRedeem(reward.id);
    if (success) {
      setRedeemedItem(reward);
      setShowSuccessModal(true);
    }
  };

  if (showSuccessModal && redeemedItem) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-brand-yellow rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-brand-yellow/20">
          <svg className="w-10 h-10 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-brand-dark uppercase tracking-tighter">Parabéns!</h2>
        <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
          Você resgatou <span className="font-black text-brand-dark">"{redeemedItem.name}"</span> com sucesso. A administração foi notificada e em breve entrará em contato para a entrega.
        </p>
        <button onClick={() => setShowSuccessModal(false)} className="bg-brand-dark text-brand-yellow px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-ultra shadow-lg hover:scale-105 transition-all">Voltar para Loja</button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="space-y-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-brand-dark uppercase tracking-tighter leading-none">Loja de Recompensas</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Troque seus EJN Coins por prêmios incríveis.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Buscar brinde pelo nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-12 pr-6 py-4 rounded-2xl text-xs font-bold outline-none focus:ring-4 ring-brand-yellow/20 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {STORE_CATEGORIES.map(category => (
              <button 
                key={category} 
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedCategory === category ? 'bg-brand-dark text-brand-yellow' : 'bg-white border border-slate-200 text-slate-500 hover:border-brand-dark/20'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredRewards.map(reward => {
          const canAfford = user.points >= reward.cost;
          const isAvailable = reward.stock > 0;
          return (
            <div key={reward.id} className={`bg-white rounded-[3rem] border border-slate-200 shadow-sm p-8 flex flex-col transition-opacity ${!isAvailable ? 'opacity-40' : ''}`}>
              <div className="aspect-[3/2] rounded-2xl bg-slate-100 overflow-hidden mb-6 relative">
                {reward.imageUrl && <img src={reward.imageUrl} className="w-full h-full object-cover" alt={reward.name} />}
                {!isAvailable && <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white text-xs font-black uppercase tracking-widest">Esgotado</div>}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-brand-dark uppercase tracking-tight">{reward.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-2 mb-6 h-12">{reward.description}</p>
              </div>
              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-lg font-black text-brand-yellow">{reward.cost.toLocaleString()}</p>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">EJN Coins</p>
                </div>
                <button 
                  onClick={() => handleRedeemClick(reward)}
                  disabled={!canAfford || !isAvailable}
                  className="bg-brand-dark text-brand-yellow px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-ultra shadow-lg hover:scale-105 transition-transform disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100"
                >
                  Resgatar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// --- MAIN APP ---

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [feedbacks, setFeedbacks] = useState<AnonymousFeedback[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [authRole, setAuthRole] = useState<UserRole | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      const fetchProfile = async () => {
        // FIX: Use .maybeSingle() to prevent an error when no profile is found.
        // This handles cases where a user exists in auth but not in the profiles table.
        const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        
        if (error) {
          // FIX: Log error.message for a more descriptive error.
          console.error('Error fetching profile:', error.message);
        } else {
          setProfile(data as User | null);
        }
      };
      
      const fetchAllData = async () => {
        const [
          usersRes, tasksRes, rewardsRes, submissionsRes, 
          redemptionsRes, postsRes, messagesRes, feedbacksRes, notificationsRes
        ] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('tasks').select('*'),
          supabase.from('rewards').select('*'),
          supabase.from('submissions').select('*'),
          supabase.from('redemptions').select('*'),
          supabase.from('community_posts').select('*, comments:community_comments(*)'),
          supabase.from('chat_messages').select('*'),
          supabase.from('anonymous_feedbacks').select('*'),
          supabase.from('notifications').select('*'),
        ]);

        setUsers(usersRes.data || []);
        setTasks(tasksRes.data || []);
        setRewards(rewardsRes.data || []);
        setSubmissions(submissionsRes.data || []);
        setRedemptions(redemptionsRes.data || []);
        setPosts(postsRes.data || []);
        setMessages(messagesRes.data || []);
        setFeedbacks(feedbacksRes.data || []);
        setNotifications(notificationsRes.data || []);
      };

      fetchProfile();
      fetchAllData();
    } else {
      setProfile(null);
    }
  }, [session]);

  useEffect(() => {
    const channels = [
      supabase.channel('community_posts').on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => supabase.from('community_posts').select('*, comments:community_comments(*)').then(res => setPosts(res.data || []))).subscribe(),
      supabase.channel('chat_messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => setMessages(prev => [...prev, payload.new as ChatMessage])).subscribe(),
      supabase.channel('notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => setNotifications(prev => [...prev, payload.new as Notification])).subscribe()
    ];
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);


  // --- HANDLERS (converted to async Supabase calls) ---
  const handleLogout = () => supabase.auth.signOut();
  
  const addNotification = async (targetId: string, title: string, message: string, type: NotificationType) => {
    await supabase.from('notifications').insert({ userId: targetId, title, message, type });
  };
  
  const awardCoins = async (userId: string, amount: number) => {
    const { data: userToUpdate, error } = await supabase.from('profiles').select('points, totalAccumulated').eq('id', userId).single();
    if (error || !userToUpdate) return;
    await supabase.from('profiles').update({ points: userToUpdate.points + amount, totalAccumulated: userToUpdate.totalAccumulated + amount }).eq('id', userId);
  };
  
  const handleUpdateProfile = async (userId: string, updatedData: Partial<User>) => {
    const { error } = await supabase.from('profiles').update(updatedData).eq('id', userId);
    if (!error) setProfile(prev => prev ? { ...prev, ...updatedData } : null);
  };

  const handleSendMessage = async (receiverId: string, text: string, taskId?: string) => {
    if (!profile) return;
    const newMessage = { senderId: profile.id, senderName: profile.name, receiverId, text, taskId };
    await supabase.from('chat_messages').insert(newMessage);
  };

  const handleUpdateFeedback = async (id: string, updates: Partial<AnonymousFeedback>) => {
    await supabase.from('anonymous_feedbacks').update(updates).eq('id', id);
  };

  const handleAddFeedback = async (f: Omit<AnonymousFeedback, 'id' | 'createdAt' | 'status'>) => {
    await supabase.from('anonymous_feedbacks').insert({ ...f, status: 'RECEIVED' });
  };

  const handleLikePost = async (postId: string) => {
    if (!profile) return;
    const { data: post } = await supabase.from('community_posts').select('likes, userId').eq('id', postId).single();
    if (!post || post.userId === profile.id || post.likes.includes(profile.id)) return;

    await supabase.from('community_posts').update({ likes: [...post.likes, profile.id] }).eq('id', postId);
    await awardCoins(post.userId, 3);
  };

  const handlePost = async (content: string, image?: string) => {
    if (!profile) return;
    const newPost = { userId: profile.id, userName: profile.name, userAvatar: profile.avatarUrl, content, imageUrl: image };
    await supabase.from('community_posts').insert(newPost);
    await awardCoins(profile.id, 5);
  };

  const handleCommentOnPost = async (postId: string, text: string) => {
    if (!profile) return;
    const newComment = { postId, userId: profile.id, userName: profile.name, userAvatar: profile.avatarUrl, text };
    await supabase.from('community_comments').insert(newComment);
    // Awarding points/notifying can be handled by a db function/trigger for better performance.
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta publicação?')) {
      await supabase.from('community_posts').delete().eq('id', postId);
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    if (!profile) return false;
    // This logic should ideally be a database function (RPC) to ensure atomicity.
    const { data: reward } = await supabase.from('rewards').select('*').eq('id', rewardId).single();
    if (!reward || reward.stock <= 0 || profile.points < reward.cost) {
      alert('Resgate falhou. Verifique seu saldo ou o estoque do item.');
      return false;
    }
    
    if (window.confirm(`Resgatar "${reward.name}" por ${reward.cost} EJN Coins?`)) {
        const [, , redemption] = await Promise.all([
          supabase.from('profiles').update({ points: profile.points - reward.cost }).eq('id', profile.id),
          supabase.from('rewards').update({ stock: reward.stock - 1 }).eq('id', rewardId),
          supabase.from('redemptions').insert({ rewardId, userId: profile.id, userName: profile.name, rewardName: reward.name, cost: reward.cost, status: RedemptionStatus.REQUESTED })
        ]);
        if(redemption.error) {
            // Rollback logic would be needed here in a real-world scenario
            return false;
        }
        await addNotification('ADMIN', 'Novo Resgate Realizado!', `${profile.name} resgatou: "${reward.name}".`, NotificationType.REWARD_READY);
        return true;
    }
    return false;
  };
  
  // --- ADMIN HANDLERS ---
  const handleAddTask = async (taskData: Omit<Task, 'id' | 'creatorId' | 'creatorName' | 'creatorTeam'>) => {
    if (!profile) return;
    const newTask = { ...taskData, creatorId: profile.id, creatorName: profile.name, creatorTeam: profile.team };
    await supabase.from('tasks').insert(newTask);
  };
  
  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    await supabase.from('tasks').update(updates).eq('id', id);
  };
  
  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Tem certeza?')) await supabase.from('tasks').delete().eq('id', id);
  };
  
  const handleAddReward = async (rewardData: Omit<Reward, 'id'>) => {
    await supabase.from('rewards').insert(rewardData);
  };
  
  const handleUpdateReward = async (id: string, updates: Partial<Reward>) => {
    await supabase.from('rewards').update(updates).eq('id', id);
  };
  
  const handleDeleteReward = async (id: string) => {
    if (window.confirm('Tem certeza?')) await supabase.from('rewards').delete().eq('id', id);
  };


  // --- AUTH ---
  const AuthModal: React.FC<{ 
    role: UserRole; 
    isOpen: boolean; 
    onClose: () => void; 
  }> = ({ role, isOpen, onClose }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [team, setTeam] = useState(TEAM_OPTIONS[1]);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
              team: role === UserRole.ADMIN ? 'DIRETORIA' : team,
            }
          }
        });
        if (error) alert(error.message);
        else onClose(); // Success, onAuthStateChange will handle the rest
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
        else onClose(); // Success
      }
      setIsLoading(false);
    };

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-brand-dark/95 backdrop-blur-md" onClick={onClose} />
        <div className="bg-white w-full max-w-[480px] rounded-[3.5rem] relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          <div className={`p-12 text-center relative overflow-hidden transition-colors duration-500 ${role === UserRole.ADMIN ? 'bg-brand-dark text-white' : 'bg-brand-yellow text-brand-dark'}`}>
            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none relative z-10">
              {isRegistering ? 'Nova Conta' : 'Acesso Restrito'}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-60 relative z-10">
              {role === UserRole.ADMIN ? 'Nível Gestão' : 'Hub Colaborador'}
            </p>
          </div>
          <form className="p-12 pt-10 space-y-5" onSubmit={handleSubmit}>
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Nome</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Como quer ser chamado?" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xs font-bold outline-none focus:ring-4 ring-brand-yellow/10" />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="exemplo@ejn.com.br" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xs font-bold outline-none focus:ring-4 ring-brand-yellow/10" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xs font-bold outline-none focus:ring-4 ring-brand-yellow/10" />
            </div>
            {isRegistering && role === UserRole.COLABORADOR && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Seu Time Principal</label>
                <select value={team} onChange={e => setTeam(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xs font-bold outline-none">
                  {TEAM_OPTIONS.filter(t => t !== 'DIRETORIA' && t !== 'TODOS').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            <div className="pt-4">
              <button type="submit" disabled={isLoading} className="w-full py-6 bg-brand-dark text-brand-yellow rounded-2xl font-black uppercase text-[11px] tracking-ultra shadow-xl">
                {isLoading ? 'Validando...' : 'Acessar Plataforma'}
              </button>
            </div>
            <div className="text-center pt-2">
              <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-[9px] font-black uppercase text-slate-400 hover:text-brand-dark transition-colors tracking-widest">
                {isRegistering ? 'Já possui conta? Entrar agora' : 'Não tem conta? Cadastrar-se no Hub'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 text-center bg-brand-gradient overflow-hidden">
        <div className="animate-in fade-in duration-700 space-y-12 text-center">
            <EJNLogo dark className="scale-150 mx-auto" />
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Plataforma Hub</h1>
            <div className="flex flex-col sm:flex-row gap-5 w-full max-w-sm mx-auto">
                <button onClick={() => setAuthRole(UserRole.COLABORADOR)} className="flex-1 bg-brand-yellow text-brand-dark px-10 py-5 rounded-full font-black uppercase text-xs tracking-widest shadow-2xl shadow-brand-yellow/20 hover:scale-105 transition-all duration-300">Colaborador</button>
                <button onClick={() => setAuthRole(UserRole.ADMIN)} className="flex-1 bg-white/10 text-white px-10 py-5 rounded-full font-black uppercase text-xs tracking-widest border border-white/20 hover:bg-white/20 transition-all duration-300">Diretoria</button>
            </div>
        </div>
        <AuthModal 
          role={authRole || UserRole.COLABORADOR} 
          isOpen={!!authRole} 
          onClose={() => setAuthRole(null)} 
        />
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout 
        user={profile} 
        onLogout={handleLogout} 
        notifications={notifications} 
        onMarkAsRead={async id => await supabase.from('notifications').update({ read: true }).eq('id', id)} 
        onClearAll={async () => await supabase.from('notifications').update({ read: true }).eq('read', false)}
      >
        <Routes>
          <Route path="/" element={<HomeView user={profile} users={users} tasks={tasks} submissions={submissions} redemptions={redemptions} posts={posts} onUpdateProfile={handleUpdateProfile} />} />
          <Route path="/missoes" element={profile.role === UserRole.COLABORADOR ? <MissoesView user={profile} tasks={tasks} /> : <Navigate to="/" />} />
          <Route path="/loja" element={profile.role === UserRole.COLABORADOR ? <LojaView user={profile} rewards={rewards} onRedeem={handleRedeemReward} /> : <Navigate to="/" />} />
          <Route path="/chat" element={<ChatView user={profile} users={users} tasks={tasks} messages={messages} onSendMessage={handleSendMessage} />} />
          <Route path="/comunidade" element={<div className="space-y-12">
               <header className="max-w-2xl mx-auto"><h2 className="text-3xl md:text-4xl font-black text-brand-dark uppercase tracking-tighter leading-none text-center">Comunidade</h2></header>
               <CommunityFeed user={profile} users={users} posts={posts} onLike={handleLikePost} onComment={handleCommentOnPost} onPost={handlePost} onDelete={handleDeletePost} />
          </div>} />
          
          <Route path="/sac" element={
            profile.role === UserRole.ADMIN ? (
              <AdminSACDashboard 
                feedbacks={feedbacks} 
                onUpdateFeedback={handleUpdateFeedback} 
              />
            ) : (
              <SACView user={profile} onAddFeedback={handleAddFeedback} />
            )
          } />

          <Route path="/admin" element={profile.role === UserRole.ADMIN ? <AdminPanelView user={profile} tasks={tasks} rewards={rewards} onAddTask={handleAddTask} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} onAddReward={handleAddReward} onUpdateReward={handleUpdateReward} onDeleteReward={handleDeleteReward} /> : <Navigate to="/" />} />
          <Route path="/perfil" element={<ProfileView user={profile} posts={posts} submissions={submissions} onUpdateProfile={handleUpdateProfile} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

const ProfileView: React.FC<{ 
  user: User; 
  posts: CommunityPost[];
  submissions: Submission[];
  onUpdateProfile: (userId: string, updatedData: Partial<User>) => void; 
}> = ({ user, posts, submissions, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, email: user.email, phone: user.phone || '', bio: user.bio || '', avatarUrl: user.avatarUrl });
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({ name: user.name, email: user.email, phone: user.phone || '', bio: user.bio || '', avatarUrl: user.avatarUrl });
  }, [user, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, avatarUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(user.id, { name: formData.name, email: formData.email, phone: formData.phone, bio: formData.bio, avatarUrl: formData.avatarUrl });
    setIsEditing(false);
  };
  
  const communityPosts = posts.filter(p => p.userId === user.id);
  const communityLikes = communityPosts.reduce((acc, p) => acc + p.likes.length, 0);
  const missionsCompleted = submissions.filter(s => s.userId === user.id && s.status === TaskStatus.APPROVED).length;

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-12 rounded-[3rem] sm:rounded-[4rem] border border-slate-200 shadow-xl space-y-8 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="w-32 h-32 rounded-[3.5rem] bg-slate-100 flex items-center justify-center font-black overflow-hidden shadow-inner">
                {formData.avatarUrl ? <img src={formData.avatarUrl} className="w-full h-full object-cover" alt="" /> : <ICONS.User className="w-12 h-12 text-slate-300" />}
              </div>
              <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-2 -right-2 p-3 bg-brand-dark text-brand-yellow rounded-full shadow-lg hover:scale-110 transition-transform">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
            </div>
            <div className="flex-1 space-y-3 w-full">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome de Exibição</label>
                <input name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-50 border-none p-4 rounded-xl text-sm font-bold outline-none focus:ring-4 ring-brand-yellow/10" />
              </div>
               <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                <input name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-50 border-none p-4 rounded-xl text-sm font-bold outline-none focus:ring-4 ring-brand-yellow/10" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone/WhatsApp</label>
              <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(XX) XXXXX-XXXX" className="w-full bg-slate-50 border-none p-4 rounded-xl text-sm font-bold outline-none focus:ring-4 ring-brand-yellow/10" />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bio (Apresentação Curta)</label>
            <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} placeholder="Apaixonado por edição e café..." className="w-full bg-slate-50 border-none p-4 rounded-xl text-sm font-medium outline-none focus:ring-4 ring-brand-yellow/10 resize-none" />
          </div>
          <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
            <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-ultra bg-slate-100 hover:bg-slate-200 transition-colors">Cancelar</button>
            <button type="submit" className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-ultra bg-brand-dark text-brand-yellow hover:scale-105 transition-transform">Salvar Alterações</button>
          </div>
        </form>
      ) : (
        <div className="bg-white p-8 sm:p-14 rounded-[3rem] sm:rounded-[4rem] border border-slate-200 text-center shadow-xl relative animate-in fade-in">
          <button onClick={() => setIsEditing(true)} className="absolute top-6 right-6 sm:top-8 sm:right-8 flex items-center gap-2 px-4 py-3 sm:px-6 rounded-xl bg-slate-50 hover:bg-brand-yellow/10 text-[9px] font-black uppercase tracking-widest transition-all">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            <span className="hidden sm:inline">Editar Perfil</span>
          </button>
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2.5rem] sm:rounded-[3.5rem] bg-brand-dark text-brand-yellow flex items-center justify-center text-4xl sm:text-5xl font-black mx-auto mb-8 shadow-2xl overflow-hidden ring-8 ring-slate-50">
            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" /> : user.name.charAt(0)}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-dark uppercase tracking-tighter">{user.name}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{user.team}</p>
          {user.bio && <p className="text-xs text-slate-500 mt-6 max-w-md mx-auto italic">"{user.bio}"</p>}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-8 border-t pt-8">
            <div><p className="text-xl sm:text-2xl font-black text-brand-yellow">{user.points}</p><p className="text-[8px] font-black text-slate-300 uppercase">Coins Atuais</p></div>
            <div><p className="text-xl sm:text-2xl font-black text-brand-dark">{user.totalAccumulated}</p><p className="text-[8px] font-black text-slate-300 uppercase">XP Vitalício</p></div>
          </div>
        </div>
      )}
      
      <div className="bg-white p-8 sm:p-10 rounded-[3rem] sm:rounded-[4rem] border border-slate-200 shadow-sm animate-in fade-in">
          <h3 className="text-center text-md sm:text-lg font-black text-brand-dark uppercase tracking-tighter mb-8">Dashboard de Atividades</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                  <p className="text-2xl sm:text-3xl font-black text-brand-dark">{missionsCompleted}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Missões Concluídas</p>
              </div>
              <div>
                  <p className="text-2xl sm:text-3xl font-black text-brand-dark">{communityPosts.length}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Publicações Feitas</p>
              </div>
              <div>
                  <p className="text-2xl sm:text-3xl font-black text-brand-dark">{communityLikes}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Curtidas Recebidas</p>
              </div>
          </div>
      </div>
    </div>
  );
}


const SACView: React.FC<{ user: User | null; onAddFeedback: (f: Omit<AnonymousFeedback, 'id' | 'createdAt' | 'status'>) => void; }> = ({ user, onAddFeedback }) => {
  const [category, setCategory] = useState<FeedbackCategory>('SUGGESTION');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddFeedback({ category, subject, message });
    setSent(true);
  };

  return sent ? (
    <div className="max-w-2xl mx-auto py-24 text-center space-y-8 animate-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-brand-yellow rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-brand-yellow/20">
         <svg className="w-10 h-10 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
      </div>
      <h2 className="text-3xl sm:text-4xl font-black text-brand-dark uppercase tracking-tighter">Relato Enviado!</h2>
      <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto">Sua contribuição foi processada e o anonimato está garantido. Obrigado por ajudar a EJN a crescer.</p>
      <button onClick={() => { setSent(false); setSubject(''); setMessage(''); }} className="bg-brand-dark text-brand-yellow px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-ultra shadow-lg hover:scale-105 transition-all">Novo Relato</button>
    </div>
  ) : (
    <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6">
      <header className="text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-brand-dark uppercase tracking-tighter leading-none">SAC Anônimo</h2>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-3">Canal seguro de escuta do colaborador</p>
      </header>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-12 rounded-[3rem] sm:rounded-[4rem] border border-slate-200 shadow-sm space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ICONS.Voice className="w-24 h-24" />
        </div>

        <div className="space-y-2 relative z-10">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Feedback</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {Object.entries(FEEDBACK_CATEGORY_LABELS).map(([k, v]) => (
               <button 
                 type="button" 
                 key={k} 
                 onClick={() => setCategory(k as any)} 
                 className={`px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${category === k ? 'bg-brand-dark text-brand-yellow border-brand-dark' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-brand-yellow/40'}`}
               >
                 {v}
               </button>
             ))}
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assunto Curto</label>
          <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Melhoria no refeitório..." className="w-full bg-slate-50 border-none p-5 rounded-2xl text-xs font-bold outline-none focus:ring-4 ring-brand-yellow/10 transition-all" />
        </div>

        <div className="space-y-2 relative z-10">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relato Detalhado</label>
          <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={6} placeholder="Conte-nos o que está acontecendo sem receios. Nenhuma informação pessoal será coletada..." className="w-full bg-slate-50 border-none p-6 rounded-[2.5rem] text-xs font-medium outline-none focus:ring-4 ring-brand-yellow/10 resize-none transition-all" />
        </div>

        <button type="submit" className="w-full py-6 bg-brand-dark text-brand-yellow rounded-3xl font-black uppercase text-xs tracking-ultra shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
          Enviar com Anonimato Garantido
        </button>

        <div className="pt-4 border-t border-slate-50 flex items-center justify-center gap-3 opacity-40">
           <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
           <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Criptografia de ponta a ponta e remoção de metadados ativada</span>
        </div>
      </form>
    </div>
  );
};

export default App;