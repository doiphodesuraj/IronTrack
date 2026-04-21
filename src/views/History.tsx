import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, collection, query, orderBy, onSnapshot } from '../lib/firebase';
import { useWorkout } from '../lib/WorkoutContext';
import { WorkoutSession } from '../types';
import { History as HistoryIcon, Calendar, Trash2, X, AlertTriangle } from 'lucide-react';

export default function History() {
  const { user } = useAuth();
  const { deleteSession } = useWorkout();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'sessions'), orderBy('startTime', 'desc'));
    return onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutSession)));
      setLoading(false);
    });
  }, [user]);

  const handleDelete = async (session: WorkoutSession) => {
    try {
      setDeletingId(session.id);
      await deleteSession(session.id);
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-neon-blue"></div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
      {pendingDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setPendingDelete(null)}
            aria-label="Close delete confirmation"
          />
          <div className="relative w-full max-w-md glass-card p-8 border border-red-500/30 shadow-[0_0_80px_rgba(239,68,68,0.15)]">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400 mb-2">Delete Workout</p>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{pendingDelete.name}</h2>
                <p className="mt-4 text-sm text-gray-300 leading-relaxed">
                  This will permanently remove the session from history and recalculate your PRs and workout stats from the remaining logs.
                </p>
              </div>
              <button
                onClick={() => setPendingDelete(null)}
                className="text-gray-500 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Cancel delete"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 glass-btn bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(pendingDelete)}
                disabled={deletingId === pendingDelete.id}
                className="flex-1 glass-btn bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === pendingDelete.id ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-300 border-t-transparent" />
                ) : (
                  <Trash2 size={18} />
                )}
                Delete Session
              </button>
            </div>
          </div>
        </div>
      )}

      <header>
        <h1 className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-3xl sm:text-5xl font-black italic uppercase tracking-tighter leading-tight max-w-full break-words">
          <HistoryIcon size={48} className="text-neon-blue" />
          <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">Workout History</span>
        </h1>
      </header>

      <div className="space-y-8">
        {sessions.length === 0 ? (
          <div className="glass-card p-20 text-center italic font-medium text-gray-500">
             No chronometric data detected. Initialize cycle to record history.
          </div>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="glass-card overflow-hidden group float-3d">
              <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center group-hover:bg-neon-blue/10 transition-colors">
                <div className="flex items-center gap-6">
                  <div className="p-3 bg-neon-blue/10 rounded-xl text-neon-blue">
                    <Calendar size={24} />
                  </div>
                  <span className="font-mono font-bold text-gray-300">
                    {session.startTime?.toDate().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none mb-1">Total Volume</p>
                  <p className="text-2xl font-black italic text-white tracking-tighter">
                    {(session.totalVolume || 0).toLocaleString()} <span className="text-xs text-neon-blue">KG</span>
                  </p>
                </div>
                <button
                  onClick={() => setPendingDelete(session)}
                  disabled={deletingId === session.id}
                  className="ml-4 p-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Delete ${session.name}`}
                  title="Delete workout history"
                >
                  {deletingId === session.id ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                  ) : (
                    <Trash2 size={20} />
                  )}
                </button>
              </div>
              
              <div className="p-8">
                <h3 className="text-3xl font-black uppercase italic mb-8 tracking-tight">{session.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                  {session.exercises.map((ex, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-4">
                       <div className="flex items-center gap-4">
                          <span className="text-[10px] font-mono text-neon-blue opacity-30">{(i+1).toString().padStart(2, '0')}</span>
                          <span className="font-black uppercase italic text-sm text-gray-300">{ex.name}</span>
                       </div>
                       <div className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {ex.sets.map((s, si) => (
                              <span key={si} className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded text-neon-blue border border-white/5">
                                {s.weight}×{s.reps}
                              </span>
                            ))}
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
