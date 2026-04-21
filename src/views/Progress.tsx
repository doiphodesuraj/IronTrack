import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, collection, query, orderBy, onSnapshot, limit, where } from '../lib/firebase';
import { WorkoutSession, PersonalRecord } from '../types';
import { TrendingUp, Trophy, ChartBar, Dumbbell, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { PREDEFINED_EXERCISES } from '../lib/exerciseData';

const EXERCISE_CATEGORY_BY_ID = new Map(
  PREDEFINED_EXERCISES.map((exercise) => [exercise.exerciseId, exercise.category])
);

const EXERCISE_CATEGORY_BY_NAME = new Map(
  PREDEFINED_EXERCISES.map((exercise) => [normalizeExerciseName(exercise.name), exercise.category])
);

function normalizeExerciseName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function inferMuscleGroup(exercise: { exerciseId?: string; name: string }) {
  const byId = exercise.exerciseId ? EXERCISE_CATEGORY_BY_ID.get(exercise.exerciseId) : undefined;
  if (byId) return byId;

  const normalized = normalizeExerciseName(exercise.name);
  const byName = EXERCISE_CATEGORY_BY_NAME.get(normalized);
  if (byName) return byName;

  if (/\b(bench|fly|pec|push up|pushups?|chest dip|dip chest|chest)\b/.test(normalized)) return 'Chest';
  if (/\b(deadlift|row|pull up|pulldown|lat|face pull|back)\b/.test(normalized)) return 'Back';
  if (/\b(squat|leg press|lunge|leg curl|leg extension|calf|romanian)\b/.test(normalized)) return 'Legs';
  if (/\b(overhead press|shoulder|lateral raise|front raise|reverse fly|upright row)\b/.test(normalized)) return 'Shoulders';
  if (/\b(curl|tricep|skullcrusher|pushdown|dip tricep|arm)\b/.test(normalized)) return 'Arms';
  if (/\b(plank|crunch|leg raise|russian twist|core|abs)\b/.test(normalized)) return 'Core';

  return 'Other';
}

export default function Progress() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Get last 30 sessions for more data points in sub-charts
    const sessionsQ = query(
      collection(db, 'users', user.uid, 'sessions'), 
      where('status', '==', 'completed'),
      orderBy('startTime', 'asc'),
      limit(30)
    );

    const prsQ = query(
      collection(db, 'users', user.uid, 'prs'),
      orderBy('maxWeight', 'desc')
    );

    const unsubSessions = onSnapshot(sessionsQ, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutSession)));
    });

    const unsubPrs = onSnapshot(prsQ, (snap) => {
      setPrs(snap.docs.map(d => ({ ...d.data() } as PersonalRecord)));
    });

    return () => {
      unsubSessions();
      unsubPrs();
    };
  }, [user]);

  const volumeData = sessions.slice(-15).map(s => ({
    date: s.startTime?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    volume: s.totalVolume || 0
  }));

  const prData = prs.slice(0, 5).map(p => ({
    name: p.exerciseName,
    weight: p.maxWeight
  }));

  // Muscle Group Analysis
  const muscleGroups: Record<string, number> = {};
  sessions.forEach(s => {
    s.exercises.forEach(ex => {
      const cat = inferMuscleGroup(ex);
      muscleGroups[cat] = (muscleGroups[cat] || 0) + 1;
    });
  });

  const muscleData = Object.entries(muscleGroups).map(([name, value]) => ({ name, value }));
  const sortedMuscleData = [...muscleData].sort((a, b) => b.value - a.value);
  const COLORS = ['#00d2ff', '#9d50bb', '#00f2fe', '#6a11cb', '#2575fc', '#ff0080'];

  // Template Comparison
  const templateStats: Record<string, { count: number, totalVolume: number }> = {};
  sessions.forEach(s => {
    const name = s.name || 'Custom';
    if (!templateStats[name]) {
      templateStats[name] = { count: 0, totalVolume: 0 };
    }
    templateStats[name].count++;
    templateStats[name].totalVolume += (s.totalVolume || 0);
  });

  const templateData = Object.entries(templateStats).map(([name, stats]) => ({
    name,
    avgVolume: Math.round(stats.totalVolume / stats.count),
    frequency: stats.count
  })).sort((a, b) => b.frequency - a.frequency).slice(0, 5);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700 pb-20">
      <header>
        <h1 className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-3xl sm:text-5xl font-black italic uppercase tracking-tighter leading-tight max-w-full break-words">
          <TrendingUp size={48} className="text-neon-blue" />
          <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">Analytics</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* volume Chart */}
        <section className="glass-card p-10 space-y-8 float-3d lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
              <ChartBar size={28} className="text-neon-blue" /> Volume Trajectory
            </h2>
          </div>
          <div className="h-[350px] w-full bg-white/[0.02] rounded-3xl p-4 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00d2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.3)' }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.3)' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontWeight: '900', color: '#fff' }}
                  itemStyle={{ color: '#00d2ff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#00d2ff" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: '#00d2ff', strokeWidth: 0 }}
                  activeDot={{ r: 8, fill: '#fff', stroke: '#00d2ff', strokeWidth: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* PR Rankings */}
        <section className="glass-card p-10 space-y-8 float-3d">
          <h2 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
            <Trophy size={28} className="text-neon-purple" /> Elite Benchmarks
          </h2>
          <div className="h-[350px] w-full bg-white/[0.02] rounded-3xl p-4 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prData} layout="vertical">
                <CartesianGrid strokeDasharray="10 10" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.3)' }}
                  width={100}
                />
                <Tooltip 
                   cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                   contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontWeight: '900', color: '#fff' }}
                />
                <Bar 
                  dataKey="weight" 
                  fill="#9d50bb" 
                  radius={[0, 10, 10, 0]}
                  barSize={40}
                >
                  {prData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#9d50bb' : '#00d2ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Muscle Distribution */}
        <section className="glass-card p-10 space-y-8 float-3d">
          <h2 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
            <Dumbbell size={28} className="text-neon-blue" /> Muscle Bias
          </h2>
          <div className="h-[350px] w-full bg-white/[0.02] rounded-3xl p-4 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={muscleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {muscleData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontWeight: '900', color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Template Comparison */}
        <section className="glass-card p-10 space-y-8 float-3d lg:col-span-2">
          <h2 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
             <Save size={28} className="text-neon-blue" /> Protocol Potency
          </h2>
          <div className="h-[350px] w-full bg-white/[0.02] rounded-3xl p-4 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={templateData}>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.3)' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(255,255,255,0.3)' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontWeight: '900', color: '#fff' }}
                />
                <Bar dataKey="avgVolume" name="Avg Volume" fill="#00d2ff" radius={[10, 10, 0, 0]} />
                <Bar dataKey="frequency" name="Frequency" fill="#9d50bb" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8 bg-gradient-to-br from-neon-blue/20 to-transparent border-neon-blue/20">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-blue mb-4">Strategic Analytics</p>
          <div className="text-2xl font-black italic tracking-tight leading-tight">
            {muscleData.length > 0 ? (
              <>
                Concentration peak in <span className="text-neon-blue uppercase">{sortedMuscleData[0].name}</span>. 
                Consider balanced recovery for {sortedMuscleData[sortedMuscleData.length - 1].name}.
              </>
            ) : (
              "Analyze more missions to generate performance analytics."
            )}
          </div>
        </div>
        <div className="glass-card p-8 bg-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6">Cycle Consistency</p>
          <div className="flex gap-3">
             {[1,2,3,4,5,6,7].map(i => (
               <div key={i} className="flex-1 h-3 relative">
                 <div className={`absolute inset-0 rounded-full ${i < 5 ? 'bg-neon-blue shadow-[0_0_15px_rgba(0,210,255,0.5)]' : 'bg-white/5'}`}></div>
               </div>
             ))}
          </div>
          <p className="text-[10px] font-black mt-6 uppercase tracking-widest text-gray-500 text-center">4 / 7 CYCLES VERIFIED</p>
        </div>
      </section>
    </div>
  );
}
