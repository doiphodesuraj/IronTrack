import React, { useState, useEffect } from 'react';
import { useWorkout } from '../lib/WorkoutContext';
import { useAuth } from '../lib/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Plus, Trash2, Check, X, Timer, Dumbbell, Save, LogOut, Trophy, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, getDocs, OperationType, handleFirestoreError } from '../lib/firebase';
import { PersonalRecord } from '../types';
import { PREDEFINED_EXERCISES, ExerciseDef } from '../lib/exerciseData';

export default function WorkoutActive() {
  const { user } = useAuth();
  const { 
    activeSession, 
    finishSession, 
    discardSession, 
    addSetToExercise, 
    updateSet, 
    removeSet,
    addExerciseToSession
  } = useWorkout();
  
  const [isFinishing, setIsFinishing] = useState(false);
  const [errorVisible, setErrorVisible] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [prs, setPrs] = useState<Record<string, PersonalRecord>>({});
  const [exerciseSuggestions, setExerciseSuggestions] = useState<ExerciseDef[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<ExerciseDef[]>([]);

  useEffect(() => {
    // Combine predefined with user history (from PRs)
    const historyExercises: ExerciseDef[] = Object.values(prs).map(pr => ({
      exerciseId: pr.exerciseId,
      name: pr.exerciseName,
      category: 'History'
    }));

    // Filter out duplicates from predefined if they exist in history
    const combined = [...historyExercises];
    PREDEFINED_EXERCISES.forEach(pre => {
      if (!combined.find(ex => ex.name.toLowerCase() === pre.name.toLowerCase())) {
        combined.push(pre);
      }
    });

    setExerciseSuggestions(combined);
  }, [prs]);

  useEffect(() => {
    if (newExName.trim().length > 0) {
      const filtered = exerciseSuggestions.filter(ex => 
        ex.name.toLowerCase().includes(newExName.toLowerCase())
      ).slice(0, 5); // Limit to top 5
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [newExName, exerciseSuggestions]);

  const selectExercise = (ex: ExerciseDef) => {
    addExerciseToSession(ex.name, ex.exerciseId);
    setNewExName('');
    setShowAddExercise(false);
  };

  useEffect(() => {
    if (!user || !activeSession) return;

    const fetchPRs = async () => {
      try {
        const prsRef = collection(db, 'users', user.uid, 'prs');
        const snap = await getDocs(prsRef);
        const prMap: Record<string, PersonalRecord> = {};
        snap.docs.forEach(doc => {
          const data = doc.data() as PersonalRecord;
          prMap[doc.id] = data;
        });
        setPrs(prMap);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/prs`);
      }
    };

    fetchPRs();
  }, [user, activeSession?.id]);

  useEffect(() => {
    if (!activeSession?.startTime) return;

    const calculateElapsed = () => {
      const start = Number(activeSession.startTime);
      const now = Date.now();
      setSeconds(Math.floor((now - start) / 1000));
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.startTime]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpdateSet = (exIdx: number, setIdx: number, updates: Partial<{weight: number, reps: number}>) => {
    if (!activeSession) return;
    const exercise = activeSession.exercises[exIdx];
    const exerciseId = exercise.exerciseId;
    
    // Get existing values to ensure we have both
    const currentSet = exercise.sets[setIdx];
    const weight = updates.weight !== undefined ? updates.weight : currentSet.weight;
    const reps = updates.reps !== undefined ? updates.reps : currentSet.reps;
    
    const historicalPR = prs[exerciseId]?.maxWeight || 0;
    const isPR = weight > historicalPR;
    
    updateSet(exIdx, setIdx, { ...updates, isPR });

    // Update local PR record so the header updates immediately
    if (isPR) {
      setPrs(prev => ({
        ...prev,
        [exerciseId]: {
          ...(prev[exerciseId] || {}),
          exerciseId,
          exerciseName: exercise.name,
          maxWeight: weight,
          date: { toDate: () => new Date() } as any // Temporary visual date
        } as PersonalRecord
      }));
    }
  };

  if (!activeSession) return <Navigate to="/" />;

  const handleFinish = async () => {
    try {
      setIsFinishing(true);
      setErrorVisible(null);
      await finishSession();
    } catch (error: any) {
      console.error("Failed to finish session", error);
      // Try to extract a clean message from our custom FirestoreErrorInfo if it exists
      let msg = "Uplink failure: Connection to database unstable.";
      try {
        const errObj = JSON.parse(error.message);
        if (errObj.error) msg = errObj.error;
      } catch (e) {
        msg = error.message || msg;
      }
      setErrorVisible(msg);
      // Auto-hide error after 6s
      setTimeout(() => setErrorVisible(null), 6000);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="space-y-12 pb-40 max-w-3xl mx-auto">
      <AnimatePresence>
        {errorVisible && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md pointer-events-none"
          >
            <div className="glass-card bg-red-500/10 border-red-500/50 p-4 flex items-center gap-3 backdrop-blur-2xl pointer-events-auto">
              <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <X size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">System Error</p>
                <p className="text-sm font-bold text-white/80 truncate">{errorVisible}</p>
              </div>
              <button onClick={() => setErrorVisible(null)} className="text-white/40 hover:text-white shrink-0">
                <Check size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <header className="fixed top-0 left-0 w-full bg-[#030303]/80 backdrop-blur-2xl border-b border-white/10 z-[60] px-6 py-4 shadow-2xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-neon-blue/20 flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-neon-blue/20 blur-xl animate-pulse group-hover:bg-neon-blue/40 transition-colors"></div>
              <Timer size={28} className="text-neon-blue relative z-10" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-blue leading-none mb-1">Mission Elapsed</p>
              <p className="text-3xl font-black font-mono leading-none tracking-tighter italic text-white">{formatTime(seconds)}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={discardSession} className="p-4 bg-white/5 hover:bg-red-500/20 text-red-500 rounded-2xl border border-white/10 transition-all active:scale-95">
              <LogOut size={24} />
            </button>
            <button 
              onClick={handleFinish} 
              disabled={isFinishing}
              className="glass-btn bg-neon-blue text-black font-black uppercase italic tracking-widest min-w-[140px] shadow-[0_0_30px_rgba(0,210,255,0.3)] disabled:opacity-50"
            >
              {isFinishing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
              ) : (
                <Save size={20} />
              )}
              {isFinishing ? 'UPLOADING...' : 'FINISH'}
            </button>
          </div>
        </div>
      </header>

      <div className="pt-32 space-y-12">
        <div className="px-2">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-2">Primary Objective</p>
          <h1 className="max-w-full break-words text-4xl sm:text-6xl font-black uppercase italic tracking-tighter leading-tight text-white">
            {activeSession.name}
          </h1>
          <div className="flex items-center gap-3 mt-4">
             <div className="h-2 w-2 rounded-full bg-neon-blue animate-pulse"></div>
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Telemetry initialized at {new Date(Number(activeSession.startTime)).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <section className="space-y-8">
          <AnimatePresence mode="popLayout">
            {activeSession.exercises.map((exercise, exIdx) => (
              <motion.div 
                key={exIdx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card overflow-hidden float-3d"
              >
                <div className="p-6 bg-white/5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black font-mono text-neon-blue opacity-50">{(exIdx + 1).toString().padStart(2, '0')}</span>
                      <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">{exercise.name}</h3>
                    </div>
                    {prs[exercise.exerciseId] && (
                      <div className="flex items-center gap-2 pl-7">
                        <Trophy size={14} className="text-neon-purple animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                          Personal Best: <span className="text-white">{prs[exercise.exerciseId].maxWeight}KG</span> 
                          <span className="mx-2 opacity-20">/</span> 
                          <span className="text-gray-400">{prs[exercise.exerciseId].date?.toDate().toLocaleDateString()}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => addSetToExercise(exIdx)} className="glass-btn p-2 bg-white/10 hover:bg-neon-blue/20 text-neon-blue border border-white/10 w-full sm:w-auto">
                    <Plus size={20} /> <span className="text-[10px]">ADD SET</span>
                  </button>
                </div>

                <div className="p-8 space-y-4">
                  <div className="grid grid-cols-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 px-4 mb-2">
                    <span>Rank</span>
                    <span className="text-center">Load (KG)</span>
                    <span className="text-center">Units</span>
                    <span className="text-right">Actions</span>
                  </div>
                  <div className="space-y-3">
                    {exercise.sets.map((set, setIdx) => (
                      <div key={setIdx} className="grid grid-cols-4 items-center bg-white/5 p-4 rounded-2xl group border border-transparent hover:border-white/10 hover:bg-white/[0.07] transition-all">
                        <span className="text-lg font-black font-mono italic text-gray-400">#{(setIdx + 1).toString().padStart(2, '0')}</span>
                        <div className="flex justify-center relative">
                          <input 
                            type="number"
                            value={set.weight || ''}
                            onChange={e => handleUpdateSet(exIdx, setIdx, { weight: parseFloat(e.target.value) || 0 })}
                            className={`w-24 glass-input text-center text-xl font-black italic bg-transparent border-0 focus:ring-1 focus:ring-neon-blue ${set.isPR ? 'text-neon-purple' : 'text-white'}`}
                            placeholder="0"
                          />
                          {set.isPR && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-2 -right-2 bg-neon-purple text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(157,80,187,0.5)] z-10"
                            >
                              PR!
                            </motion.div>
                          )}
                        </div>
                        <div className="flex justify-center">
                          <input 
                            type="number"
                            value={set.reps || ''}
                            onChange={e => handleUpdateSet(exIdx, setIdx, { reps: parseInt(e.target.value) || 0 })}
                            className="w-20 glass-input text-center text-xl font-black italic bg-transparent border-0 focus:ring-1 focus:ring-neon-blue"
                            placeholder="0"
                          />
                        </div>
                        <div className="flex justify-end pr-2">
                          <button onClick={() => removeSet(exIdx, setIdx)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {showAddExercise ? (
            <div className="glass-card p-10 flex flex-col gap-6 animate-in slide-in-from-bottom duration-500 relative">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2 relative">
                   <label className="text-[10px] font-black uppercase tracking-widest text-neon-blue">New Exercise Identifier</label>
                   <div className="relative">
                     <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                     <input 
                      autoFocus
                      value={newExName}
                      onChange={e => setNewExName(e.target.value)}
                      placeholder="SEARCH OR TYPE..."
                      className="w-full text-3xl font-black italic uppercase italic tracking-tight bg-transparent border-b-2 border-white/10 focus:border-neon-blue focus:outline-none transition-all pl-8"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (filteredSuggestions.length > 0) {
                            selectExercise(filteredSuggestions[0]);
                          } else if (newExName.trim()) {
                            addExerciseToSession(newExName, Math.random().toString());
                            setNewExName('');
                            setShowAddExercise(false);
                          }
                        }
                      }}
                    />
                   </div>

                   {/* Autocomplete Dropdown */}
                   <AnimatePresence>
                     {filteredSuggestions.length > 0 && (
                       <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-0 right-0 top-full mt-4 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden z-[70] shadow-2xl"
                       >
                         {filteredSuggestions.map((suggestion, idx) => (
                           <button 
                            key={idx}
                            onClick={() => selectExercise(suggestion)}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-0"
                           >
                             <div className="flex flex-col">
                               <span className="text-lg font-black uppercase italic text-white/80">{suggestion.name}</span>
                               <span className="text-[10px] font-bold text-neon-blue/50 uppercase tracking-widest">{suggestion.category}</span>
                             </div>
                             <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100">
                               <Plus size={16} />
                             </div>
                           </button>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
                <div className="flex gap-4 items-end">
                  <button 
                    onClick={() => { 
                      if (newExName.trim()) {
                        addExerciseToSession(newExName, Math.random().toString()); 
                        setNewExName(''); 
                        setShowAddExercise(false); 
                      }
                    }}
                    className="glass-btn bg-neon-blue text-black font-black uppercase italic p-5 shadow-lg shadow-neon-blue/20"
                  >
                    <Check size={28} />
                  </button>
                  <button onClick={() => setShowAddExercise(false)} className="glass-btn bg-white/5 text-gray-400 p-5 border border-white/10">
                    <X size={28} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowAddExercise(true)}
              className="w-full p-12 glass-card bg-white/5 border-2 border-dashed border-white/10 hover:border-neon-blue/30 hover:bg-neon-blue/5 text-gray-500 hover:text-neon-blue transition-all group overflow-hidden relative float-3d"
            >
              <div className="relative z-10 flex items-center justify-center gap-4 text-2xl font-black uppercase italic tracking-[0.2em]">
                <Plus size={32} className="group-hover:rotate-90 transition-transform duration-500" />
                <span>Reinforce Roster</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
