import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { WorkoutProvider, useWorkout } from './lib/WorkoutContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
  Dumbbell, 
  LayoutDashboard, 
  History as HistoryIcon, 
  TrendingUp, 
  Plus, 
  LogOut,
  Play,
  ClipboardList
} from 'lucide-react';
import Dashboard from './views/Dashboard';
import Templates from './views/Templates';
import WorkoutActive from './views/WorkoutActive';
import History from './views/History';
import Progress from './views/Progress';

function AppContent() {
  const { user, loading, signInWithGoogle } = useAuth();
  const { activeSession } = useWorkout();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black immersive-bg">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-neon-blue"></div>
          <div className="absolute inset-0 animate-pulse bg-neon-blue/20 blur-xl rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black immersive-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-12 relative group">
          <div className="absolute inset-0 bg-neon-blue/30 blur-3xl group-hover:bg-neon-blue/50 transition-all"></div>
          <div className="relative glass-card p-12 float-3d">
            <Dumbbell size={80} className="mx-auto mb-6 text-neon-blue" />
            <h1 className="text-6xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
              IronTrack
            </h1>
            <p className="text-xl font-medium mt-6 text-gray-300 max-w-sm">
              The next dimension of performance tracking. Immersive. Strategic. Irontight.
            </p>
          </div>
        </div>
        <button 
          onClick={signInWithGoogle} 
          className="glass-btn bg-white/10 hover:bg-white/20 text-white scale-125 px-8 py-4 border border-white/20 backdrop-blur-md active:scale-110 disabled:opacity-50"
        >
          <span className="text-neon-blue">✦</span> Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black immersive-bg relative flex flex-col md:flex-row">
      {/* Dynamic Glass Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg h-20 glass-card !rounded-full z-50 px-8 flex items-center justify-between shadow-[0_0_50px_rgba(0,210,255,0.1)] border-white/20">
        <Link to="/" className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${location.pathname === '/' ? 'text-neon-blue bg-white/10 shadow-lg shadow-neon-blue/20' : 'text-gray-400'}`}>
          <LayoutDashboard size={28} />
        </Link>
        <Link to="/templates" className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${location.pathname === '/templates' ? 'text-neon-blue bg-white/10 shadow-lg shadow-neon-blue/20' : 'text-gray-400'}`}>
          <Plus size={28} />
        </Link>
        {activeSession && (
          <Link to="/workout" className="relative group p-4 bg-gradient-to-br from-neon-blue to-neon-purple text-white rounded-full shadow-2xl scale-125 -translate-y-4 hover:scale-135 transition-all">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping group-hover:animate-none"></div>
            <Play size={28} />
          </Link>
        )}
        <Link to="/history" className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${location.pathname === '/history' ? 'text-neon-blue bg-white/10 shadow-lg shadow-neon-blue/20' : 'text-gray-400'}`}>
          <HistoryIcon size={28} />
        </Link>
        <Link to="/progress" className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${location.pathname === '/progress' ? 'text-neon-blue bg-white/10 shadow-lg shadow-neon-blue/20' : 'text-gray-400'}`}>
          <TrendingUp size={28} />
        </Link>
        <button onClick={() => auth.signOut()} className="hidden md:flex p-3 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all">
          <LogOut size={28} />
        </button>
      </nav>

      <main className="flex-1 p-6 md:p-12 max-w-6xl mx-auto pb-32 w-full">
        {activeSession && location.pathname !== '/workout' && (
          <div className="mb-12 glass-card p-6 flex items-center justify-between animate-in fade-in slide-in-from-top duration-700 bg-gradient-to-r from-neon-blue/10 to-transparent">
            <div className="flex items-center gap-6">
              <div className="h-12 w-12 rounded-full bg-neon-blue/20 flex items-center justify-center animate-pulse">
                <Dumbbell size={24} className="text-neon-blue" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neon-blue">Live Processing</p>
                <h2 className="text-2xl font-black italic tracking-tight">{activeSession.name}</h2>
              </div>
            </div>
            <Link to="/workout" className="glass-btn bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/30">
              Continue <Play size={16} fill="currentColor" />
            </Link>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/workout" element={<WorkoutActive />} />
          <Route path="/history" element={<History />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

import { auth } from './lib/firebase';

export default function App() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <ErrorBoundary>
        <AuthProvider>
          <WorkoutProvider>
            <Router>
              <AppContent />
            </Router>
          </WorkoutProvider>
        </AuthProvider>
      </ErrorBoundary>
    </div>
  );
}
