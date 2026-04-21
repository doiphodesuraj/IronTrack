import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, collection, doc, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, setDoc, updateDoc } from '../lib/firebase';
import { HealthProfile, WeightLog } from '../types';
import { Activity, Plus, Ruler, Save, Scale, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function formatDate(value: any) {
  if (!value?.toDate) return '';
  return value.toDate().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function getBmiCategory(bmi: number) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Healthy';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export default function Health() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [goalWeightKg, setGoalWeightKg] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [note, setNote] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingWeight, setSavingWeight] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'users', user.uid, 'health', 'profile');
    const logsQuery = query(
      collection(db, 'users', user.uid, 'health', 'profile', 'weightLogs'),
      orderBy('loggedAt', 'desc'),
      limit(20)
    );

    let profileReady = false;
    let logsReady = false;
    const markReady = () => {
      if (profileReady && logsReady) {
        setLoading(false);
      }
    };

    const unsubProfile = onSnapshot(profileRef, (snap) => {
      setLoadError(null);
      if (snap.exists()) {
        const next = snap.data() as HealthProfile;
        setProfile(next);
        setHeightCm(String(next.heightCm ?? ''));
        setGoalWeightKg(next.goalWeightKg != null ? String(next.goalWeightKg) : '');
      } else {
        setProfile(null);
      }
      profileReady = true;
      markReady();
    }, (error) => {
      setLoadError(error.message || 'Unable to load health profile.');
      profileReady = true;
      markReady();
    });

    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      setLoadError(null);
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WeightLog)));
      logsReady = true;
      markReady();
    }, (error) => {
      setLoadError(error.message || 'Unable to load weight history.');
      logsReady = true;
      markReady();
    });

    return () => {
      unsubProfile();
      unsubLogs();
    };
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    setHeightCm(String(profile.heightCm ?? ''));
    setGoalWeightKg(profile.goalWeightKg != null ? String(profile.goalWeightKg) : '');
  }, [profile?.heightCm, profile?.goalWeightKg]);

  const chronologicalLogs = useMemo(() => [...logs].reverse(), [logs]);
  const latestLog = logs[0];
  const latestWeight = latestLog?.weightKg ?? null;
  const heightValue = Number(heightCm);
  const bmi = latestWeight != null && heightValue > 0 ? latestWeight / Math.pow(heightValue / 100, 2) : null;
  const bmiCategory = bmi ? getBmiCategory(bmi) : null;
  const firstWeight = chronologicalLogs[0]?.weightKg ?? null;
  const latestChronologicalWeight = chronologicalLogs[chronologicalLogs.length - 1]?.weightKg ?? null;
  const weightChange = firstWeight != null && latestChronologicalWeight != null
    ? latestChronologicalWeight - firstWeight
    : null;

  const chartData = chronologicalLogs.map((entry) => ({
    date: formatDate(entry.loggedAt),
    weight: entry.weightKg
  }));

const handleSaveProfile = async () => {
  if (!user || !heightValue || Number.isNaN(heightValue)) return;

  try {
    setActionError(null);
    setSavingProfile(true);

    const profileRef = doc(db, 'users', user.uid, 'health', 'profile');

    if (profile) {
      await updateDoc(profileRef, {
        userId: user.uid, // ✅ REQUIRED
        heightCm: heightValue,
        goalWeightKg: goalWeightKg.trim() ? Number(goalWeightKg) : null,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(profileRef, {
        userId: user.uid,
        heightCm: heightValue,
        goalWeightKg: goalWeightKg.trim() ? Number(goalWeightKg) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error: any) {
    console.error('Failed to save health profile', error);
    setActionError(error?.code === 'permission-denied'
      ? 'Firestore rules blocking request.'
      : 'Unable to save health profile.');
  } finally {
    setSavingProfile(false);
  }
};
const handleLogWeight = async () => {
  if (!user || !weightKg.trim()) return;

  try {
    setActionError(null);
    setSavingWeight(true);

    await addDoc(
      collection(db, 'users', user.uid, 'health', 'profile', 'weightLogs'),
      {
        userId: user.uid,
        weightKg: Number(weightKg),
        note: note.trim() || null,
        loggedAt: serverTimestamp() // ✅ now supported by rules
      }
    );

    setWeightKg('');
    setNote('');
  } catch (error: any) {
    console.error('Failed to log weight', error);
    setActionError(error?.code === 'permission-denied'
      ? 'Firestore rules blocking request.'
      : 'Unable to log weight.');
  } finally {
    setSavingWeight(false);
  }
};

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-neon-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-700 pb-24">
      {loadError && (
        <div className="glass-card border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          Health data could not be loaded. Please check Firestore rules and refresh after redeploying them.
        </div>
      )}

      {actionError && (
        <div className="glass-card border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {actionError}
        </div>
      )}

      <header>
        <h1 className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-3xl sm:text-5xl font-black uppercase tracking-tighter leading-tight max-w-full break-words">
          <Activity size={48} className="text-neon-blue" />
          <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">Health</span>
        </h1>
        <p className="mt-4 max-w-3xl text-sm sm:text-base text-gray-400">
          Keep a simple health profile, log body weight over time, and use BMI to understand trends alongside your training data.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="glass-card p-6 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Latest Weight</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black tracking-tighter">{latestWeight != null ? latestWeight.toFixed(1) : '--'}</span>
            <span className="pb-1 text-sm font-black uppercase text-neon-blue">KG</span>
          </div>
        </div>
        <div className="glass-card p-6 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">BMI</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black tracking-tighter">{bmi != null ? bmi.toFixed(1) : '--'}</span>
            <span className="pb-1 text-sm font-black uppercase text-neon-blue">{bmiCategory || 'Set height'}</span>
          </div>
        </div>
        <div className="glass-card p-6 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Height</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black tracking-tighter">{heightValue || '--'}</span>
            <span className="pb-1 text-sm font-black uppercase text-neon-blue">CM</span>
          </div>
        </div>
        <div className="glass-card p-6 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Trend</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black tracking-tighter">
              {weightChange != null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}` : '--'}
            </span>
            <span className="pb-1 text-sm font-black uppercase text-neon-blue">KG</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Ruler size={24} className="text-neon-blue" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Health Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Height (cm)</span>
              <input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="glass-input w-full text-xl font-black"
                placeholder="175"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Goal Weight (kg)</span>
              <input
                type="number"
                value={goalWeightKg}
                onChange={(e) => setGoalWeightKg(e.target.value)}
                className="glass-input w-full text-xl font-black"
                placeholder="72"
              />
            </label>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile || !heightCm.trim()}
            className="glass-btn bg-neon-blue text-black font-black uppercase tracking-[0.2em] disabled:opacity-50"
          >
            <Save size={18} />
            {savingProfile ? 'Saving...' : profile ? 'Update Profile' : 'Save Profile'}
          </button>
        </div>

        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Scale size={24} className="text-neon-purple" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Log Weight</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Weight (kg)</span>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="glass-input w-full text-xl font-black"
                placeholder="74.2"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Note</span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="glass-input w-full text-lg font-bold"
                placeholder="Morning weigh-in"
              />
            </label>
          </div>

          <button
            onClick={handleLogWeight}
            disabled={savingWeight || !weightKg.trim()}
            className="glass-btn w-full bg-gradient-to-r from-neon-blue to-neon-purple text-black font-black uppercase tracking-[0.2em] disabled:opacity-50"
          >
            <Plus size={18} />
            {savingWeight ? 'Logging...' : 'Add Weight Entry'}
          </button>
        </div>
      </section>

      <section className="glass-card p-8 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-neon-blue" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Weight History</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
            {logs.length} logged entries
          </p>
        </div>

        <div className="h-[320px] w-full rounded-3xl border border-white/5 bg-white/[0.02] p-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
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
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontWeight: '900', color: '#fff' }}
                  itemStyle={{ color: '#00d2ff' }}
                />
                <Line type="monotone" dataKey="weight" stroke="#00d2ff" strokeWidth={4} dot={{ r: 4, fill: '#00d2ff', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-gray-500 italic">
              Log your first weigh-in to see the trend line.
            </div>
          )}
        </div>

        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-gray-500">
              No weight logs yet.
            </div>
          ) : (
            logs.map((entry, index) => {
              const previous = logs[index + 1];
              const delta = previous ? entry.weightKg - previous.weightKg : null;
              return (
                <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-tight text-white">{entry.weightKg.toFixed(1)} KG</p>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500">
                      {formatDate(entry.loggedAt)}
                      {entry.note ? ` • ${entry.note}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black uppercase tracking-[0.2em] ${delta == null ? 'text-gray-500' : delta <= 0 ? 'text-neon-blue' : 'text-red-400'}`}>
                      {delta == null ? 'Start' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} KG`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
