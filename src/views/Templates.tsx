import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useWorkout } from '../lib/WorkoutContext';
import { db, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from '../lib/firebase';
import { WorkoutTemplate, ExerciseTemplate } from '../types';
import { Plus, Trash2, Play, Dumbbell, X, Search } from 'lucide-react';
import { PREDEFINED_EXERCISES, ExerciseDef } from '../lib/exerciseData';
import { motion, AnimatePresence } from 'motion/react';

export default function Templates() {
  const { user } = useAuth();
  const { startSession } = useWorkout();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [exercises, setExercises] = useState<ExerciseTemplate[]>([]);
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
  const [filteredSuggestions, setFilteredSuggestions] = useState<ExerciseDef[]>([]);

  useEffect(() => {
    if (activeSearchIdx !== null && exercises[activeSearchIdx]) {
      const queryStr = exercises[activeSearchIdx].name.trim().toLowerCase();
      if (queryStr.length > 0) {
        const filtered = PREDEFINED_EXERCISES.filter(ex => 
          ex.name.toLowerCase().includes(queryStr)
        ).slice(0, 5);
        setFilteredSuggestions(filtered);
      } else {
        setFilteredSuggestions([]);
      }
    } else {
      setFilteredSuggestions([]);
    }
  }, [activeSearchIdx, exercises]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'templates'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutTemplate)));
    });
  }, [user]);

  const addExercise = () => {
    setExercises([...exercises, {
      exerciseId: Math.random().toString(36).substr(2, 9),
      name: '',
      defaultSets: 3,
      defaultReps: 10,
      defaultWeight: 0
    }]);
  };

  const updateExercise = (index: number, updated: Partial<ExerciseTemplate>) => {
    const next = [...exercises];
    next[index] = { ...next[index], ...updated };
    setExercises(next);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!user || !newName || exercises.length === 0) return;
    
    try {
      await addDoc(collection(db, 'users', user.uid, 'templates'), {
        userId: user.uid,
        name: newName,
        exercises: exercises.filter(ex => ex.name),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsCreating(false);
      setNewName('');
      setExercises([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'templates', id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-tight max-w-full break-words">
          <Dumbbell size={48} className="text-neon-blue" />
          <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">Templates</span>
        </h1>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="glass-btn bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/20"
          >
            <Plus size={20} /> <span className="font-black">NEW BLUEPRINT</span>
          </button>
        )}
      </header>

      {isCreating && (
        <div className="glass-card p-10 space-y-8 relative overflow-hidden backdrop-blur-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/10 blur-[100px] -z-10"></div>
          <button onClick={() => setIsCreating(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all">
            <X size={24} />
          </button>
          
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-blue">Architecture Name</label>
            <input 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. ULTIMATE PUSH PROTOCOL"
              className="w-full text-4xl font-black uppercase tracking-tight bg-transparent border-b-2 border-white/10 focus:border-neon-blue focus:outline-none transition-all placeholder:text-gray-700"
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Exercise Sequential Units</p>
              <button 
                onClick={addExercise}
                className="text-[10px] font-black uppercase tracking-widest text-neon-blue hover:text-white flex items-center gap-2 transition-colors"
              >
                <Plus size={14} /> Add Unit
              </button>
            </div>
            
            <div className="space-y-4">
              {exercises.map((ex, idx) => (
                <div key={ex.exerciseId} className="flex flex-col md:flex-row gap-6 p-6 glass-card bg-white/5 items-end border-white/5 group hover:border-white/20 transition-all">
                  <div className="flex-1 space-y-3 w-full relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Exercise Identity</label>
                    <div className="relative">
                      <input 
                        value={ex.name}
                        onChange={e => updateExercise(idx, { name: e.target.value })}
                        onFocus={() => setActiveSearchIdx(idx)}
                        onBlur={() => setTimeout(() => setActiveSearchIdx(null), 200)}
                        className="w-full font-black uppercase text-lg bg-transparent border-b border-white/10 focus:border-neon-blue focus:outline-none placeholder:text-gray-700"
                        placeholder="e.g. FLAT BENCH PRESS"
                      />
                      {activeSearchIdx === idx && filteredSuggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute left-0 right-0 top-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden z-[100] shadow-2xl"
                        >
                          {filteredSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.exerciseId}
                              onClick={() => {
                                updateExercise(idx, { 
                                  name: suggestion.name,
                                  exerciseId: suggestion.exerciseId 
                                });
                                setActiveSearchIdx(null);
                              }}
                              className="w-full p-4 flex flex-col items-start hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                            >
                              <span className="text-sm font-black uppercase text-white">{suggestion.name}</span>
                              <span className="text-[10px] font-bold text-neon-blue/50 uppercase tracking-widest">{suggestion.category}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-20 space-y-2 text-center">
                      <label className="text-[10px] font-black uppercase text-gray-500">Sets</label>
                      <input 
                        type="number"
                        value={ex.defaultSets}
                        onChange={e => updateExercise(idx, { defaultSets: parseInt(e.target.value) })}
                        className="w-full font-mono text-xl text-center bg-white/5 rounded-xl py-2 focus:ring-1 focus:ring-neon-blue outline-none"
                      />
                    </div>
                    <div className="w-20 space-y-2 text-center">
                      <label className="text-[10px] font-black uppercase text-gray-500">Reps</label>
                      <input 
                        type="number"
                        value={ex.defaultReps}
                        onChange={e => updateExercise(idx, { defaultReps: parseInt(e.target.value) })}
                        className="w-full font-mono text-xl text-center bg-white/5 rounded-xl py-2 focus:ring-1 focus:ring-neon-blue outline-none"
                      />
                    </div>
                  </div>
                  <button onClick={() => removeExercise(idx)} className="p-3 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all mb-1">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button onClick={handleCreate} className="flex-1 glass-btn bg-neon-blue text-black font-black uppercase text-xl shadow-[0_0_30px_rgba(0,210,255,0.3)]">Deploy Template</button>
            <button onClick={() => setIsCreating(false)} className="px-8 glass-btn bg-white/5 text-gray-400 font-black uppercase border border-white/10">Abort</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {templates.map(template => (
          <div key={template.id} className="glass-card flex flex-col h-full group float-3d overflow-hidden hover:border-neon-blue/30 transition-all">
            <div className="p-8 flex-1 space-y-6">
              <div className="flex justify-between items-start">
                <h3 className="text-3xl font-black uppercase leading-none tracking-tight group-hover:text-neon-blue transition-colors">{template.name}</h3>
                <button onClick={() => handleDelete(template.id)} className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="space-y-4">
                {template.exercises.map((ex, i) => (
                  <div key={ex.exerciseId} className="flex items-center justify-between text-xs">
                    <p className="font-black uppercase text-gray-400">
                      <span className="text-[10px] text-neon-blue mr-3 opacity-50">{(i+1).toString().padStart(2, '0')}</span>
                      {ex.name}
                    </p>
                    <p className="font-mono text-[10px] text-neon-blue bg-neon-blue/5 px-2 py-0.5 rounded">
                      {ex.defaultSets}S × {ex.defaultReps}R
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <button 
              onClick={() => startSession(template.name, template.id, template.exercises)}
              className="w-full py-6 bg-white/5 text-white font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 group/btn relative overflow-hidden transition-all hover:bg-neon-blue hover:text-black"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
              <Play size={20} className="relative z-10 fill-current" /> <span className="relative z-10">Initialize Force</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
