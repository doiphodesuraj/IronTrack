import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useWorkout } from '../lib/WorkoutContext';
import { db, collection, query, orderBy, limit, onSnapshot, where } from '../lib/firebase';
import { WorkoutSession, PersonalRecord } from '../types';
import { Dumbbell, Plus, TrendingUp, Trophy, History as HistoryIcon, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { startSession } = useWorkout();
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);
  const [topPrs, setTopPrs] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const sessionsQuery = query(
      collection(db, 'users', user.uid, 'sessions'),
      orderBy('startTime', 'desc'),
      limit(3)
    );

    const prsQuery = query(
      collection(db, 'users', user.uid, 'prs'),
      orderBy('maxWeight', 'desc'),
      limit(5)
    );

    const unsubSessions = onSnapshot(sessionsQuery, (snap) => {
      setRecentSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutSession)));
      setLoading(false);
    });

    const unsubPrs = onSnapshot(prsQuery, (snap) => {
      setTopPrs(snap.docs.map(d => ({ ...d.data() } as PersonalRecord)));
    });

    return () => {
      unsubSessions();
      unsubPrs();
    };
  }, [user]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-neon-blue mb-2">Operational Dashboard</p>
          <h1 className="max-w-full break-words text-4xl sm:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter leading-tight text-white">
            {user?.displayName?.split(' ')[0] || 'Athlete'}
          </h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => startSession('Quick Workout')}
            className="glass-btn bg-white/10 hover:bg-neon-blue/20 text-white border border-white/10 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-neon-blue/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <Play size={20} className="relative z-10" /> <span className="relative z-10 font-black italic">QUICK START</span>
          </button>
          <Link to="/templates" className="glass-btn bg-neon-purple/20 hover:bg-neon-purple/30 text-white border border-neon-purple/30 group">
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" /> <span className="font-black italic">NEW TEMPLATE</span>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Dumbbell, label: 'Sessions Logged', value: profile?.stats?.totalWorkouts || 0, color: 'text-neon-blue' },
          { icon: Trophy, label: 'Active Records', value: topPrs.length, color: 'text-neon-purple' },
          { icon: TrendingUp, label: 'Training Streak', value: profile?.stats?.streak || 0, color: 'text-accent' }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-8 float-3d group">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</span>
            </div>
            <p className="text-6xl font-black font-mono tracking-tighter italic">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Recent Activity */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
              <HistoryIcon size={28} className="text-neon-blue" /> Previous Cycles
            </h2>
            <Link to="/history" className="text-[10px] font-black uppercase tracking-widest text-neon-blue hover:underline">Full Logs</Link>
          </div>
          <div className="space-y-4">
            {recentSessions.length === 0 ? (
              <div className="glass-card p-12 text-center text-gray-500 italic font-medium">
                No telemetry recorded. Initializing first cycle recommended.
              </div>
            ) : (
              recentSessions.map(session => (
                <div key={session.id} className="glass-card p-6 flex items-center justify-between group hover:bg-white/5 transition-all float-3d">
                  <div className="flex items-center gap-6">
                    <div className="text-center bg-white/5 p-3 rounded-2xl min-w-[70px]">
                      <p className="text-[10px] font-black uppercase text-gray-500 leading-none">
                        {session.startTime?.toDate().toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-2xl font-black font-mono mt-1">
                        {session.startTime?.toDate().getDate()}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase italic tracking-tight">{session.name}</h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Dumbbell size={12} className="text-neon-blue" />
                        {session.exercises.length} Exercises • {session.totalVolume?.toLocaleString()} KG Volume
                      </p>
                    </div>
                  </div>
                  <Link to="/history" className="glass-btn p-3 bg-white/5 hover:bg-neon-blue/20 text-neon-blue opacity-0 group-hover:opacity-100 transition-all">
                    <TrendingUp size={24} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Top PRs */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3 px-2">
            <Trophy size={28} className="text-neon-purple" /> Peak Performance
          </h2>
          <div className="glass-card overflow-hidden divide-y divide-white/5">
            {topPrs.length === 0 ? (
              <div className="p-12 text-center text-gray-500 italic font-medium">
                Baseline metrics required. Continue training to establish records.
              </div>
            ) : (
              topPrs.map(pr => (
                <div key={pr.exerciseId} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-12 bg-neon-purple rounded-full scale-y-0 group-hover:scale-y-100 transition-transform"></div>
                    <div>
                      <h3 className="text-lg font-black uppercase italic tracking-tight">{pr.exerciseName}</h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{pr.date?.toDate().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black font-mono italic tracking-tighter text-white">{pr.maxWeight}</span>
                    <span className="text-xs font-black text-neon-purple ml-2">KG</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
