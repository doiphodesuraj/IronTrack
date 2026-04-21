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
      <div className="min-h-screen bg-black immersive-bg overflow-hidden">
        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center gap-12 px-6 py-10 lg:flex-row lg:items-center lg:px-10">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-neon-blue/15 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-neon-purple/15 blur-3xl" />

          <section className="relative z-10 flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-neon-blue">
              <span className="h-2 w-2 rounded-full bg-neon-blue shadow-[0_0_15px_rgba(0,210,255,0.8)]" />
              Elite Training OS
            </div>

            <div className="max-w-3xl space-y-6">
              <h1 className="text-5xl font-black uppercase tracking-tighter text-white sm:text-6xl lg:text-8xl leading-[1.08] pr-2">
                Build
                <span className="block bg-gradient-to-r from-neon-blue via-white to-neon-purple bg-clip-text text-transparent">
                  stronger
                </span>
                sessions.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-gray-300 sm:text-lg">
                Track every rep, every set, every PR. IronTrack turns your workouts into a focused performance system with templates, live timers, and progress analytics.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: 'Sessions Logged', value: '01K+' },
                { label: 'PR Tracking', value: 'Live' },
                { label: 'Template Flow', value: 'Fast' },
              ].map((item) => (
                <div key={item.label} className="glass-card p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">{item.label}</p>
                  <p className="mt-3 text-3xl font-black tracking-tighter text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {['Workout History', 'PR Detection', 'Live Rest Timer', 'Progress Charts'].map((item) => (
                <div key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-gray-300">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="relative z-10 w-full max-w-xl">
            <div className="relative group">
              <div className="absolute inset-0 rounded-[2.5rem] bg-neon-blue/20 blur-3xl group-hover:bg-neon-blue/30 transition-all" />
              <div className="relative glass-card overflow-hidden border border-white/15 p-8 sm:p-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-neon-blue">Ready to train</p>
                    <h2 className="mt-3 text-4xl font-black uppercase tracking-tighter text-white">Sign in</h2>
                  </div>
                  <div className="rounded-2xl border border-neon-blue/20 bg-neon-blue/10 p-4 text-neon-blue shadow-[0_0_30px_rgba(0,210,255,0.15)]">
                    <Dumbbell size={34} />
                  </div>
                </div>

                <div className="mb-8 space-y-4">
                  {[
                    'Save templates to your profile',
                    'Track PRs automatically after each session',
                    'Keep your active workout safe on refresh',
                  ].map((line) => (
                    <div key={line} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                      <span className="h-2 w-2 rounded-full bg-neon-blue" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={signInWithGoogle}
                  className="glass-btn w-full bg-gradient-to-r from-neon-blue to-neon-purple px-8 py-5 text-base font-black uppercase tracking-[0.2em] text-black shadow-[0_0_40px_rgba(0,210,255,0.35)] hover:brightness-110 active:scale-95"
                >
                  Login with Google
                </button>

                <p className="mt-5 text-center text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
                  Built for focused lifting sessions
                </p>
              </div>
            </div>
          </section>
        </div>
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
                <h2 className="text-2xl font-black tracking-tight">{activeSession.name}</h2>
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
