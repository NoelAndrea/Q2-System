// src/App.jsx
// Planting Decision Tool – Frontend (v3)

import { useState, useEffect, useCallback } from 'react';
import {
  Sprout, LogOut, Shield, Plus, Trash2, UserPlus,
  Menu, X, RefreshCw, AlertCircle, CheckCircle, Clock,
  TrendingUp, Users, Activity, Database, Filter,
  Download, User, Lock, BarChart2
} from 'lucide-react';
import { authAPI, simAPI, adminAPI } from './api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  const bg   = type === 'error' ? 'bg-red-600' : 'bg-emerald-600';
  const Icon = type === 'error' ? AlertCircle : CheckCircle;
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] ${bg} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-medium max-w-[90%] sm:max-w-sm`}>
      <Icon className="w-5 h-5 shrink-0" /><span>{msg}</span>
    </div>
  );
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
function ImpactBadge({ value }) {
  const colors = {
    'Good': 'bg-emerald-500/20 text-emerald-400',
    'High': 'bg-emerald-500/20 text-emerald-400',
    'High Yield': 'bg-emerald-500/20 text-emerald-400',
    'Normal': 'bg-blue-500/20 text-blue-400',
    'Standard Yield': 'bg-blue-500/20 text-blue-400',
    'Moderate': 'bg-yellow-500/20 text-yellow-400',
    'Poor': 'bg-red-500/20 text-red-400',
    'Germination': 'bg-teal-500/20 text-teal-400',
    'Vegetative': 'bg-blue-500/20 text-blue-400',
    'Flowering': 'bg-purple-500/20 text-purple-400',
    'Maturity': 'bg-emerald-500/20 text-emerald-400',
  };
  const cls = colors[value] || 'bg-zinc-700 text-white/70';
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>{value}</span>;
}

// ── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]               = useState(null);
  const [page, setPage]               = useState('landing');
  const [toast, setToast]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [mobileOpen, setMobileOpen]   = useState(false);

  const notify = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  // Restore session from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(({ user: u }) => {
        setUser(u);
        // Admin goes to admin page, farmer goes to home
        setPage(u.role === 'admin' ? 'admin' : 'home');
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user: u } = await authAPI.login(email, password);
    localStorage.setItem('token', token);
    setUser(u);
    // Admin lands on admin page
    setPage(u.role === 'admin' ? 'admin' : 'home');
    notify(`Welcome back, ${u.name}!`);
  };

  const register = async (name, email, password) => {
    await authAPI.register(name, email, password);
    notify('Account created! Please log in.');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPage('landing');
    setMobileOpen(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-emerald-400 flex items-center gap-3 text-lg">
        <RefreshCw className="w-6 h-6 animate-spin" /> Loading…
      </div>
    </div>
  );

  if (page === 'landing') return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <nav className="bg-[#052e16] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sprout className="w-8 h-8 text-emerald-500" />
            <span className="text-xl font-bold tracking-tighter">Q2 Planting Decision Tool</span>
          </div>
          <button onClick={() => setPage('login')} className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-2xl font-semibold text-sm transition">
            Get Started
          </button>
        </div>
      </nav>
      <header className="min-h-screen bg-cover bg-center flex items-center relative px-6"
        style={{ backgroundImage: `linear-gradient(rgba(5,46,22,0.85),rgba(5,46,22,0.95)),url('https://picsum.photos/id/1015/2000/1200')` }}>
        <div className="max-w-4xl mx-auto text-center pt-20">
          <div className="inline-block bg-emerald-500/20 text-emerald-400 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-emerald-500/30">
            Digital Twin Prototype — Q2 System
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight mb-6">
            Smarter Maize<br />Planting Decisions
          </h1>
          <p className="text-lg md:text-2xl text-white/80 max-w-2xl mx-auto mb-10 px-4">
            Simulate maize crop growth, predict yield, and make informed farming decisions using our digital twin engine.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-10 text-sm text-white/60">
            {['Planting Date', 'Rainfall', 'Soil Type', 'Maize Variety', 'Fertilizer Type', 'Land Size'].map(i => (
              <span key={i} className="bg-white/10 px-3 py-1 rounded-full border border-white/10">{i}</span>
            ))}
          </div>
          <button onClick={() => setPage('login')}
            className="bg-emerald-500 hover:bg-emerald-600 text-lg md:text-2xl px-10 md:px-16 py-5 md:py-7 rounded-3xl font-semibold inline-flex items-center gap-3 shadow-xl transition-all">
            Start Simulation <Plus className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>
      </header>
    </div>
  );

  if (page === 'login') return (
    <AuthPage onLogin={login} onRegister={register} onBack={() => setPage('landing')} notify={notify} toast={toast} clearToast={() => setToast(null)} />
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Navbar */}
      <nav className="bg-[#052e16] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sprout className="w-8 h-8 text-emerald-500" />
              <span className="text-xl font-bold tracking-tighter hidden sm:block">Q2 Planting Decision Tool</span>
              <span className="text-xl font-bold tracking-tighter sm:hidden">Q2 System</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <button onClick={() => setPage('home')} className={`transition px-3 py-1 rounded-lg ${page==='home'?'text-emerald-400 bg-emerald-500/10':'hover:text-emerald-400'}`}>Dashboard</button>
              <button onClick={() => setPage('history')} className={`transition px-3 py-1 rounded-lg ${page==='history'?'text-emerald-400 bg-emerald-500/10':'hover:text-emerald-400'}`}>
                {user?.role === 'admin' ? 'Simulation History' : 'My History'}
              </button>
              {user?.role === 'admin' && (
                <button onClick={() => setPage('admin')} className={`flex items-center gap-2 transition px-3 py-1 rounded-lg ${page==='admin'?'text-emerald-400 bg-emerald-500/10':'hover:text-emerald-400'}`}>
                  <Shield className="w-4 h-4" /> Admin Panel
                </button>
              )}
              <button onClick={() => setPage('profile')} className={`flex items-center gap-2 transition px-3 py-1 rounded-lg ${page==='profile'?'text-emerald-400 bg-emerald-500/10':'hover:text-emerald-400'}`}>
                <User className="w-4 h-4" /> Profile
              </button>
              <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                <span className="text-white/40 text-xs bg-zinc-800 px-3 py-1 rounded-full">{user?.name} · {user?.role}</span>
                <button onClick={logout} className="flex items-center gap-1 text-red-400 hover:text-red-500 transition text-xs">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
              {mobileOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {mobileOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-white/10 flex flex-col gap-3 text-sm">
              <div className="text-white/40 text-xs px-2 pb-2 border-b border-white/10">{user?.name} ({user?.role})</div>
              <button onClick={() => { setPage('home'); setMobileOpen(false); }} className="py-2 px-2 text-left hover:text-emerald-400 transition">Dashboard</button>
              <button onClick={() => { setPage('history'); setMobileOpen(false); }} className="py-2 px-2 text-left hover:text-emerald-400 transition">
                {user?.role === 'admin' ? 'Simulation History' : 'My History'}
              </button>
              {user?.role === 'admin' && (
                <button onClick={() => { setPage('admin'); setMobileOpen(false); }} className="py-2 px-2 text-left flex items-center gap-2 hover:text-emerald-400 transition">
                  <Shield className="w-4 h-4" /> Admin Panel
                </button>
              )}
              <button onClick={() => { setPage('profile'); setMobileOpen(false); }} className="py-2 px-2 text-left flex items-center gap-2 hover:text-emerald-400 transition">
                <User className="w-4 h-4" /> Profile
              </button>
              <button onClick={logout} className="py-2 px-2 text-left text-red-400">Logout</button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {page === 'home'    && <SimulationPage notify={notify} user={user} />}
        {page === 'history' && <HistoryPage notify={notify} user={user} />}
        {page === 'admin' && user?.role === 'admin' && <AdminPanel notify={notify} user={user} />}
        {page === 'profile' && <ProfilePage notify={notify} user={user} setUser={setUser} />}
      </div>
    </div>
  );
}

// ── Auth Page ─────────────────────────────────────────────────────────────────
function AuthPage({ onLogin, onRegister, onBack, notify, toast, clearToast }) {
  const [showReg, setShowReg] = useState(false);
  const [busy, setBusy]       = useState(false);

  const wrap = (fn) => async (e) => {
    e.preventDefault(); setBusy(true);
    try { await fn(e); } catch (err) { notify(err.message, 'error'); } finally { setBusy(false); }
  };

  const ic = "w-full px-6 py-4 border border-gray-200 rounded-2xl text-base focus:outline-none focus:border-emerald-400 transition";

  return (
    <div className="min-h-screen bg-[#052e16] flex flex-col items-center justify-center p-4">
      {toast && <Toast {...toast} onClose={clearToast} />}
      <button onClick={onBack} className="text-white/50 hover:text-white mb-6 text-sm self-start max-w-md w-full mx-auto">← Back</button>
      <div className="bg-white text-zinc-900 p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6"><Sprout className="w-14 h-14 text-emerald-600" /></div>
        <h1 className="text-3xl font-bold text-center mb-1">{showReg ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">Q2 Planting Decision Tool</p>

        {!showReg ? (
          <form onSubmit={wrap(async (e) => onLogin(e.target.email.value, e.target.password.value))} className="space-y-5">
            <input name="email" type="email" placeholder="Email"  className={ic} required />
            <input name="password" type="password" placeholder="Password"  className={ic} required />
            <button type="submit" disabled={busy} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-4 rounded-3xl text-lg font-semibold flex items-center justify-center gap-2 transition">
              {busy && <RefreshCw className="w-5 h-5 animate-spin" />} Sign In
            </button>
            <button type="button" onClick={() => setShowReg(true)} className="w-full text-emerald-600 py-2 text-sm hover:underline">New user? Create account</button>
          </form>
        ) : (
          <form onSubmit={wrap(async (e) => { await onRegister(e.target.uname.value, e.target.email.value, e.target.password.value); setShowReg(false); })} className="space-y-5">
            <input name="uname" type="text" placeholder="Full Name" className={ic} required />
            <input name="email" type="email" placeholder="Email" className={ic} required />
            <input name="password" type="password" placeholder="Password (min 6 characters)" className={ic} required minLength={6} />
            <button type="submit" disabled={busy} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-4 rounded-3xl text-lg font-semibold flex items-center justify-center gap-2 transition">
              {busy && <RefreshCw className="w-5 h-5 animate-spin" />} Create Account
            </button>
            <button type="button" onClick={() => setShowReg(false)} className="w-full text-gray-400 py-2 text-sm hover:underline">Back to Sign In</button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Simulation Page ───────────────────────────────────────────────────────────
function SimulationPage({ notify, user }) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">New Simulation</h1>
        <p className="text-white/50 text-sm">Enter your farm parameters to run the digital twin simulation</p>
      </div>
      <SimulationForm notify={notify} />
    </>
  );
}

// ── Multi-select fertilizer checkbox component ────────────────────────────────
const FERTILIZER_OPTIONS = [
  { value: 'no fertilizer', label: 'No Fertilizer' },
  { value: 'organic',       label: 'Organic' },
  { value: 'npk',           label: 'NPK' },
  { value: 'urea',          label: 'Urea' },
];

function FertilizerPicker({ selected, onChange }) {
  const toggle = (val) => {
    if (val === 'no fertilizer') {
      // No Fertilizer is mutually exclusive
      onChange(['no fertilizer']);
      return;
    }
    let next = selected.filter(v => v !== 'no fertilizer');
    if (next.includes(val)) {
      next = next.filter(v => v !== val);
      if (next.length === 0) next = ['no fertilizer'];
    } else {
      next = [...next, val];
    }
    onChange(next);
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {FERTILIZER_OPTIONS.map(opt => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`px-3 py-3 rounded-xl text-sm font-medium border transition text-left
              ${isSelected
                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-800 border-white/10 text-white/60 hover:border-white/30'}`}
          >
            <span className={`inline-block w-3 h-3 rounded-full mr-2 border ${isSelected ? 'bg-emerald-400 border-emerald-400' : 'border-white/30'}`} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Simulation Form ──────────────────────────────
function SimulationForm({ notify }) {
  const [formData, setFormData] = useState({
    plantingDate:   '',
    rainfall:       '',
    soilType:       'loam',
    maizeVariety:   'hybrid',
    fertilizerType: ['npk'],
    landSize:       '',
  });
  const [result, setResult] = useState(null);
  const [busy, setBusy]     = useState(false);

  const ic = "w-full bg-zinc-800 border border-white/10 rounded-2xl px-5 py-4 text-base focus:outline-none focus:border-emerald-500 transition text-white appearance-none";
  const lc = "block text-sm text-white/60 mb-2 font-medium";

  const set = (k, v) => setFormData(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.plantingDate) { notify('Please enter a planting date', 'error'); return; }
    if (formData.rainfall === '') { notify('Please enter rainfall amount', 'error'); return; }
    if (!formData.landSize) { notify('Please enter land size', 'error'); return; }
    if (!formData.fertilizerType || formData.fertilizerType.length === 0) {
      notify('Please select at least one fertilizer type', 'error'); return;
    }

    setBusy(true);
    try {
      const payload = {
        ...formData,
        // Send as array; backend handles single or combo
        fertilizerType: formData.fertilizerType,
      };
      const { data } = await simAPI.run(payload);
      setResult(data);
      notify('Simulation complete and saved to database!');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const fertLabel = Array.isArray(formData.fertilizerType)
    ? formData.fertilizerType.map(v => FERTILIZER_OPTIONS.find(o => o.value === v)?.label || v).join(' + ')
    : formData.fertilizerType;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">

      {/* ── Input Form ── */}
      <div className="bg-zinc-900 rounded-3xl p-6 md:p-10 border border-white/5">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" /> Farm Parameters
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 1. Planting Date */}
          <div>
            <label className={lc}>1. Planting Date</label>
            <input type="date" value={formData.plantingDate} onChange={e => set('plantingDate', e.target.value)} className={ic} required />
          </div>

          {/* 2. Rainfall */}
          <div>
            <label className={lc}>2. Rainfall (mm) <span className="text-white/30 font-normal">- must be ≥ 0</span></label>
            <input type="number" value={formData.rainfall} onChange={e => set('rainfall', e.target.value)}
              min={0} max={3000} step={0.1} placeholder="e.g. 45" className={ic} required />
          </div>

          {/* 3 & 4 in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={lc}>3. Soil Type</label>
              <select value={formData.soilType} onChange={e => set('soilType', e.target.value)} className={ic}>
                <option value="sandy">Sandy</option>
                <option value="clay">Clay</option>
                <option value="loam">Loam</option>
              </select>
            </div>
            <div>
              <label className={lc}>4. Maize Variety</label>
              <select value={formData.maizeVariety} onChange={e => set('maizeVariety', e.target.value)} className={ic}>
                <option value="hybrid">Hybrid</option>
                <option value="local">Local</option>
              </select>
            </div>
          </div>

          {/* 5. Fertilizer Type — multi-select */}
          <div>
            <label className={lc}>
              5. Fertilizer Type
              <span className="text-white/30 font-normal ml-2">— select one or more</span>
            </label>
            <FertilizerPicker
              selected={formData.fertilizerType}
              onChange={(val) => set('fertilizerType', val)}
            />
            {formData.fertilizerType.length > 1 && (
              <div className="mt-2 text-xs text-emerald-400/70 bg-emerald-500/10 rounded-xl px-3 py-2">
                ✦ Combo: {fertLabel} — blended effect applied
              </div>
            )}
          </div>

          {/* 6. Land Size */}
          <div>
            <label className={lc}>6. Land Size (hectares)</label>
            <input type="number" value={formData.landSize} onChange={e => set('landSize', e.target.value)}
              min={0.01} max={10000} step={0.01} placeholder="e.g. 2.50" className={ic} required />
          </div>

          <button type="submit" disabled={busy}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 py-5 rounded-3xl text-lg md:text-xl font-semibold flex items-center justify-center gap-3 mt-2 transition">
            {busy
              ? <><RefreshCw className="w-5 h-5 animate-spin" /> Running Simulation…</>
              : <><TrendingUp className="w-5 h-5" /> Run Simulation</>}
          </button>
        </form>
      </div>

      {/* ── Output Panel ── */}
      <div className="bg-zinc-900 rounded-3xl p-6 md:p-10 border border-white/5">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" /> Simulation Results
        </h2>

        {result ? (
          <div className="space-y-6">
            {/* Predicted Yield — big number */}
            <div className="text-center py-8 bg-zinc-800 rounded-3xl border border-emerald-500/20">
              <div className="text-7xl md:text-8xl font-black text-emerald-400 tabular-nums">
                {result.predictedYield}
              </div>
              <div className="text-white/50 mt-2">tons · predicted yield</div>
              <div className="text-white/30 text-xs mt-1">{result.daysSincePlant} days since planting</div>
            </div>

            {/* Output categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                ['Growth Stage',   result.growthStage],
                ['Rainfall',       result.rainfallCategory],
                ['Soil Category',  result.soilCategory],
                ['Fertilizer',     result.fertilizerImpact],
                ['Variety Impact', result.varietyImpact],
              ].map(([label, val]) => (
                <div key={label} className="bg-zinc-800 p-5 rounded-2xl">
                  <div className="text-white/40 text-xs mb-2">{label}</div>
                  <ImpactBadge value={val} />
                </div>
              ))}

              {/* Inputs summary — now includes rainfall */}
              <div className="bg-zinc-800 p-5 rounded-2xl">
                <div className="text-white/40 text-xs mb-2">Inputs Used</div>
                <div className="text-xs text-white/60 space-y-1">
                  <div>{result.inputs?.soilType} soil · {result.inputs?.maizeVariety}</div>
                  <div>{result.inputs?.fertilizerType} · {result.inputs?.landSize} ha</div>
                  <div>Rainfall: {result.inputs?.rainfall} mm</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center text-white/20 text-center gap-4">
            <Sprout className="w-16 h-16 opacity-20" />
            <div>
              <p className="font-medium">No results yet</p>
              <p className="text-xs mt-1 text-white/15">Fill in all parameters and click Run Simulation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CSV Export helper ─────────────────────────────────────────────────────────
function exportCSV(rows, filename = 'simulations.csv') {
  const headers = ['ID','Sim Date','Planting Date','Variety','Yield (t)','Growth Stage',
                   'Soil Category','Rainfall (mm)','Fertilizer','Land (ha)','User'];
  const escape  = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines   = [
    headers.join(','),
    ...rows.map(s => [
      s.id,
      new Date(s.created_at).toLocaleString(),
      s.planting_date?.slice(0, 10) ?? '',
      s.maize_variety ?? '',
      s.predicted_yield,
      s.growth_stage,
      s.soil_category,
      s.rainfall_mm ?? '',
      s.fertilizer_type ?? '',
      s.land_size ?? '',
      s.user_name ? `${s.user_name} <${s.user_email}>` : '',
    ].map(escape).join(','))
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Yield Trend Chart ─────────────────────────────────────────────────────────
function YieldChart({ data }) {
  if (!data || data.length < 2) return null;
  const chartData = [...data]
    .reverse()
    .map((s, i) => ({
      name: `#${s.id}`,
      yield: parseFloat(s.predicted_yield),
    }));
  const avg = chartData.reduce((a, d) => a + d.yield, 0) / chartData.length;

  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-white/5 mb-6">
      <h3 className="text-white/70 font-semibold mb-4 flex items-center gap-2 text-sm">
        <BarChart2 className="w-4 h-4 text-emerald-400" /> Yield Trend (latest {chartData.length} simulations)
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
            itemStyle={{ color: '#34d399' }}
            formatter={(v) => [`${v} t`, 'Predicted Yield']}
          />
          <ReferenceLine y={avg} stroke="rgba(234,179,8,0.4)" strokeDasharray="4 4" label={{ value: `avg ${avg.toFixed(1)}t`, fill: 'rgba(234,179,8,0.6)', fontSize: 10 }} />
          <Line type="monotone" dataKey="yield" stroke="#34d399" strokeWidth={2} dot={{ fill: '#34d399', r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


function HistoryPage({ notify, user }) {
  const isAdmin = user?.role === 'admin';

  const [sims, setSims]           = useState([]);
  const [page, setPage]           = useState(1);
  const [meta, setMeta]           = useState({});
  const [loading, setLoading]     = useState(true);
  // Admin filter: 'all' or 'mine'
  const [viewFilter, setViewFilter] = useState('all');

  const fetchHistory = useCallback(async (p = 1, filter = viewFilter) => {
    setLoading(true);
    try {
      let res;
      if (isAdmin) {
        // Admin can see all or just their own
        const userId = filter === 'mine' ? user.id : null;
        res = await adminAPI.simulations(p, 20, userId);
      } else {
        res = await simAPI.myHistory(p);
      }
      setSims(res.data); setMeta(res.pagination); setPage(p);
    } catch (err) { notify(err.message, 'error'); }
    finally { setLoading(false); }
  }, [notify, isAdmin, user, viewFilter]);

  useEffect(() => { fetchHistory(1, viewFilter); }, [viewFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this simulation record?')) return;
    try {
      await simAPI.deleteOne(id);
      notify('Deleted.');
      fetchHistory(page);
    } catch (err) { notify(err.message, 'error'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">
            {isAdmin ? 'Simulation History' : 'My Simulation History'}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {isAdmin ? 'System-wide simulation records' : 'Data from your previous simulations'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Admin filter tabs */}
          {isAdmin && (
            <div className="flex gap-2 bg-zinc-800 p-1 rounded-xl">
              {[['all', 'All Users'], ['mine', 'My Simulations']].map(([val, label]) => (
                <button key={val}
                  onClick={() => setViewFilter(val)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewFilter === val ? 'bg-emerald-600 text-white' : 'text-white/50 hover:text-white'}`}>
                  <Filter className="w-3 h-3 inline mr-1" />{label}
                </button>
              ))}
            </div>
          )}
          {sims.length > 0 && (
            <button
              onClick={() => exportCSV(sims, `simulations_${new Date().toISOString().slice(0,10)}.csv`)}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-2xl text-sm transition text-emerald-400">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
          <button onClick={() => fetchHistory(page)} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-2xl text-sm transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 text-white/30 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>
      ) : sims.length === 0 ? (
        <div className="bg-zinc-900 rounded-3xl p-16 text-center text-white/30 border border-white/5">
          <Sprout className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No simulations yet</p>
          <p className="text-sm mt-1 text-white/20">Run your first simulation from the Dashboard</p>
        </div>
      ) : (
        <>
          <YieldChart data={sims} />
          <div className="bg-zinc-900 rounded-3xl overflow-x-auto border border-white/5">
            <table className="w-full min-w-[900px]">
              <thead className="bg-zinc-800 text-white/50 text-xs uppercase tracking-wider">
                <tr>
                  {isAdmin
                    ? ['Sim Date', 'User', 'Planting Date', 'Variety', 'Yield (t)', 'Stage', 'Soil', 'Fertilizer', 'Rainfall (mm)', 'Land (ha)', ''].map(h => (
                        <th key={h} className="p-5 text-left whitespace-nowrap">{h}</th>
                      ))
                    : ['Sim Time', 'Planting Date', 'Variety', 'Yield (t)', 'Stage', 'Soil', 'Fertilizer', 'Rainfall (mm)', 'Land (ha)', ''].map(h => (
                        <th key={h} className="p-5 text-left whitespace-nowrap">{h}</th>
                      ))
                  }
                </tr>
              </thead>
              <tbody>
                {sims.map(s => (
                  <tr key={s.id} className="border-t border-white/5 hover:bg-zinc-800/50 transition text-sm">
                    {isAdmin && (
                      <td className="p-5 text-white/50 whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1 opacity-50" />
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="p-5 font-medium text-emerald-300 whitespace-nowrap">{s.user_name}<br/><span className="text-white/30 text-xs">{s.user_email}</span></td>
                    )}
                    {!isAdmin && (
                      <td className="p-5 text-white/50 whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1 opacity-50" />
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                    )}
                    <td className="p-5 text-white/60 whitespace-nowrap">{s.planting_date?.slice(0,10)}</td>
                    <td className="p-5 text-white/70 capitalize">{s.maize_variety || '—'}</td>
                    <td className="p-5 font-black text-emerald-400 text-lg">{s.predicted_yield}</td>
                    <td className="p-5"><ImpactBadge value={s.growth_stage} /></td>
                    <td className="p-5"><ImpactBadge value={s.soil_category} /></td>
                    <td className="p-5 text-white/70 max-w-[160px] truncate">{s.fertilizer_type}</td>
                    <td className="p-5 text-white/70">{s.rainfall_mm != null ? `${s.rainfall_mm} mm` : '—'}</td>
                    <td className="p-5 text-white/70">{s.land_size != null ? `${s.land_size} ha` : '—'}</td>
                    <td className="p-5">
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-400 transition">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.pages > 1 && (
            <div className="flex justify-center gap-3 mt-6 flex-wrap">
              {Array.from({ length: meta.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => fetchHistory(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold transition ${p === page ? 'bg-emerald-600' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ notify, user }) {
  const [tab, setTab]         = useState('overview');
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [sims, setSims]       = useState([]);
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { adminAPI.stats().then(r => setStats(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    const fetchers = {
      users:      () => adminAPI.users().then(r => setUsers(r.data)),
      activities: () => adminAPI.simulations(1, 50).then(r => setSims(r.data)),
      logs:       () => adminAPI.logs().then(r => setLogs(r.data)),
    };
    (fetchers[tab] || (() => Promise.resolve()))()
      .catch(e => notify(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [tab, notify]);

  const refreshUsers = () => adminAPI.users().then(r => setUsers(r.data)).catch(() => {});

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addUser({ name: e.target.uname.value, email: e.target.email.value, password: e.target.password.value, role: e.target.role.value });
      notify('User created!'); setShowAdd(false);
      refreshUsers();
    } catch (err) { notify(err.message, 'error'); }
  };

  const handleToggleUser = async (u) => {
    const action = u.is_active ? 'suspend' : 'activate';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${u.name}?`)) return;
    try {
      await adminAPI.toggleUser(u.id);
      notify(`User ${action}d.`);
      refreshUsers();
    } catch (err) { notify(err.message, 'error'); }
  };

  const ic = "bg-zinc-800 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white w-full";
  const tabs = ['overview', 'users', 'activities', 'logs'];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Admin Oversight Panel</h1>
        <p className="text-white/40 text-sm mt-1">System management and monitoring - Q2 System</p>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="flex gap-2 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 rounded-2xl text-sm capitalize font-medium transition whitespace-nowrap ${tab===t?'bg-emerald-600 text-white':'bg-zinc-800 hover:bg-zinc-700 text-white/70'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {stats ? [
              ['Total Users',       stats.totalUsers,        'text-emerald-400', Users],
              ['Total Simulations', stats.totalSimulations,  'text-blue-400',    Activity],
              ['Average Yield (t)', stats.averageYield,      'text-yellow-400',  TrendingUp],
              ['Latest Yield (t)',  stats.latestYield,       'text-purple-400',  TrendingUp],
              ['Top Soil Type',     stats.topSoilType,       'text-orange-400',  Database],
            ].map(([label, val, color, Icon]) => (
              <div key={label} className="bg-zinc-900 p-8 rounded-3xl border border-white/5">
                <Icon className={`w-7 h-7 mb-3 ${color} opacity-70`} />
                <div className={`text-4xl md:text-5xl font-black mb-3 ${color}`}>{val ?? '—'}</div>
                <div className="text-white/50 text-sm">{label}</div>
              </div>
            )) : <div className="col-span-3 text-white/30 py-12 text-center">Loading stats…</div>}
          </div>

          <div className="bg-zinc-900 rounded-3xl p-6 border border-white/5 text-sm text-white/50">
            <h3 className="text-white/80 font-semibold mb-3">System Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><div className="text-white/30 text-xs mb-1">Database</div><div>MySQL · q2_system</div></div>
              <div><div className="text-white/30 text-xs mb-1">Backend</div><div>Node.js + Express</div></div>
              <div><div className="text-white/30 text-xs mb-1">Frontend</div><div>React.js + Vite</div></div>
              <div><div className="text-white/30 text-xs mb-1">Architecture</div><div>3-Tier REST API</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-semibold">Manage Users</h2>
            <button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold transition w-full sm:w-auto justify-center">
              <UserPlus className="w-5 h-5" /> Add New User
            </button>
          </div>

          {showAdd && (
            <form onSubmit={handleAddUser} className="bg-zinc-900 rounded-3xl p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border border-white/5">
              <input name="uname" placeholder="Full Name" required className={ic} />
              <input name="email" type="email" placeholder="Email" required className={ic} />
              <input name="password" type="password" placeholder="Password (min 6 chars)" required minLength={6} className={ic} />
              <select name="role" className={ic}><option value="farmer">Farmer</option><option value="admin">Admin</option></select>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 rounded-2xl text-sm font-semibold transition">Create</button>
                <button type="button" onClick={() => setShowAdd(false)} className="bg-zinc-700 hover:bg-zinc-600 px-8 py-3 rounded-2xl text-sm transition">Cancel</button>
              </div>
            </form>
          )}

          {loading ? <div className="text-white/30 text-center py-12">Loading…</div> : (
            <div className="bg-zinc-900 rounded-3xl overflow-x-auto border border-white/5">
              <table className="w-full min-w-[620px]">
                <thead className="bg-zinc-800 text-white/50 text-xs uppercase tracking-wider">
                  <tr>{['Name','Email','Role','Status','Joined','Action'].map(h => <th key={h} className="p-5 text-left">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t border-white/5 hover:bg-zinc-800/50 transition text-sm">
                      <td className="p-5 font-medium">{u.name}</td>
                      <td className="p-5 text-white/50">{u.email}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.role==='admin'?'bg-purple-500/20 text-purple-400':'bg-emerald-500/20 text-emerald-400'}`}>{u.role}</span>
                      </td>
                      <td className="p-5">
                        <button
                          onClick={() => handleToggleUser(u)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer hover:opacity-80
                            ${u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="p-5 text-white/40 text-xs whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-5">
                        <button
                          onClick={() => { if(window.confirm('Delete this user and all their data?')) adminAPI.deleteUser(u.id).then(() => { notify('User deleted.'); setUsers(x => x.filter(i=>i.id!==u.id)); }).catch(e=>notify(e.message,'error')); }}
                          className="text-red-500 hover:text-red-400 transition"><Trash2 className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All Simulations */}
      {tab === 'activities' && (
        <div>
          <h2 className="text-2xl font-semibold mb-2">All Simulation Results</h2>
          <p className="text-white/40 text-sm mb-6">System-wide · simulation_result table</p>
          {loading ? <div className="text-white/30 text-center py-12">Loading…</div> : (
            <div className="bg-zinc-900 rounded-3xl overflow-x-auto border border-white/5">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-zinc-800 text-white/50 text-xs uppercase tracking-wider">
                  <tr>{['Sim Date','User','Planting Date','Variety','Yield (t)','Stage','Soil','Rainfall (mm)','Fertilizer','Land (ha)'].map(h =>
                    <th key={h} className="p-5 text-left whitespace-nowrap">{h}</th>
                  )}</tr>
                </thead>
                <tbody>
                  {sims.length===0
                    ? <tr><td colSpan={10} className="p-12 text-center text-white/30">No simulations yet</td></tr>
                    : sims.map(s => (
                      <tr key={s.id} className="border-t border-white/5 hover:bg-zinc-800/50 transition text-sm">
                        <td className="p-5 text-white/50 whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</td>
                        <td className="p-5 font-medium text-emerald-300 whitespace-nowrap">{s.user_name}<br/><span className="text-white/30 text-xs">{s.user_email}</span></td>
                        <td className="p-5 text-white/60 whitespace-nowrap">{s.planting_date?.slice(0,10)}</td>
                        <td className="p-5 text-white/70 capitalize">{s.maize_variety || '—'}</td>
                        <td className="p-5 font-black text-emerald-400 text-base">{s.predicted_yield}</td>
                        <td className="p-5"><ImpactBadge value={s.growth_stage} /></td>
                        <td className="p-5"><ImpactBadge value={s.soil_category} /></td>
                        <td className="p-5 text-white/60">{s.rainfall_mm != null ? `${s.rainfall_mm} mm` : '—'}</td>
                        <td className="p-5 text-white/60 max-w-[160px] truncate">{s.fertilizer_type}</td>
                        <td className="p-5 text-white/60">{s.land_size != null ? `${s.land_size} ha` : '—'}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Audit Logs */}
      {tab === 'logs' && (
        <div>
          <h2 className="text-2xl font-semibold mb-2">Audit Logs</h2>
          <p className="text-white/40 text-sm mb-6">Security events — login attempts, simulation runs, admin actions</p>
          {loading ? <div className="text-white/30 text-center py-12">Loading…</div> : (
            <div className="bg-zinc-900 rounded-3xl overflow-x-auto border border-white/5">
              <table className="w-full min-w-[700px]">
                <thead className="bg-zinc-800 text-white/50 text-xs uppercase tracking-wider">
                  <tr>{['Timestamp','Action','User','IP Address'].map(h => <th key={h} className="p-5 text-left">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {logs.length===0
                    ? <tr><td colSpan={4} className="p-12 text-center text-white/30">No logs recorded yet</td></tr>
                    : logs.map(l => (
                      <tr key={l.id} className="border-t border-white/5 hover:bg-zinc-800/50 transition text-sm">
                        <td className="p-5 text-white/50 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                        <td className="p-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-mono ${l.action.includes('FAIL')?'bg-red-500/20 text-red-400':l.action.includes('SUSPEND')?'bg-yellow-500/20 text-yellow-400':'bg-zinc-700 text-white/60'}`}>{l.action}</span>
                        </td>
                        <td className="p-5 text-white/70">{l.user_name||'-'}</td>
                        <td className="p-5 font-mono text-xs text-white/40">{l.ip_address||'-'}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────────────
function ProfilePage({ notify, user, setUser }) {
  const [name, setName]             = useState(user?.name || '');
  const [curPwd, setCurPwd]         = useState('');
  const [newPwd, setNewPwd]         = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [busyName, setBusyName]     = useState(false);
  const [busyPwd, setBusyPwd]       = useState(false);

  const ic = "w-full bg-zinc-800 border border-white/10 rounded-2xl px-5 py-4 text-base focus:outline-none focus:border-emerald-500 transition text-white";
  const lc = "block text-sm text-white/60 mb-2 font-medium";

  const handleName = async (e) => {
    e.preventDefault();
    setBusyName(true);
    try {
      const { data } = await authAPI.updateProfile(name);
      setUser(prev => ({ ...prev, name: data.name }));
      notify('Display name updated!');
    } catch (err) {
      notify(err.message, 'error');
    } finally { setBusyName(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) { notify('New passwords do not match.', 'error'); return; }
    setBusyPwd(true);
    try {
      await authAPI.changePassword(curPwd, newPwd);
      notify('Password changed successfully!');
      setCurPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      notify(err.message, 'error');
    } finally { setBusyPwd(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
          <User className="w-8 h-8 text-emerald-400" /> My Profile
        </h1>
        <p className="text-white/50 text-sm">Manage your account information</p>
      </div>

      {/* Account info */}
      <div className="bg-zinc-900 rounded-3xl p-6 md:p-10 border border-white/5 mb-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 flex items-center justify-center text-2xl font-black text-emerald-400">
            {(user?.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-lg">{user?.name}</div>
            <div className="text-white/40 text-sm">{user?.email}</div>
            <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${user?.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {user?.role}
            </span>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Update Display Name</h2>
        <form onSubmit={handleName} className="space-y-4">
          <div>
            <label className={lc}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={ic} minLength={2} required />
          </div>
          <button type="submit" disabled={busyName}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-8 py-3 rounded-2xl text-sm font-semibold transition flex items-center gap-2">
            {busyName && <RefreshCw className="w-4 h-4 animate-spin" />} Save Name
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-zinc-900 rounded-3xl p-6 md:p-10 border border-white/5">
        <h2 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4" /> Change Password
        </h2>
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className={lc}>Current Password</label>
            <input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)} className={ic} required />
          </div>
          <div>
            <label className={lc}>New Password <span className="text-white/30 font-normal">(min 6 characters)</span></label>
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className={ic} minLength={6} required />
          </div>
          <div>
            <label className={lc}>Confirm New Password</label>
            <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className={ic} minLength={6} required />
          </div>
          <button type="submit" disabled={busyPwd}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-8 py-3 rounded-2xl text-sm font-semibold transition flex items-center gap-2">
            {busyPwd && <RefreshCw className="w-4 h-4 animate-spin" />} Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
