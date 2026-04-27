import { useState, useEffect } from 'react';
import { Sprout, LogOut, Shield, Plus, Trash2, UserPlus, Activity, Menu, X } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('landing');
  const [simulations, setSimulations] = useState([]);
  const [users, setUsers] = useState([]);
  const [showRegister, setShowRegister] = useState(false);
  const [adminTab, setAdminTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load data
  useEffect(() => {
    const savedSims = localStorage.getItem('simulations');
    if (savedSims) setSimulations(JSON.parse(savedSims));

    const savedUsers = localStorage.getItem('appUsers');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const initialUsers = [
        { id: 1, name: "John Farmer", email: "farmer@demo.com", password: "123", role: "user" },
        { id: 2, name: "System Admin", email: "admin@demo.com", password: "admin", role: "admin" },
      ];
      setUsers(initialUsers);
      localStorage.setItem('appUsers', JSON.stringify(initialUsers));
    }
  }, []);

  const saveSimulation = (result, formData) => {
    const newSim = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      userEmail: user?.email,
      userName: user?.name,
      ...formData,
      ...result
    };
    const updated = [...simulations, newSim];
    setSimulations(updated);
    localStorage.setItem('simulations', JSON.stringify(updated));
  };

  const login = (email, password) => {
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      setCurrentPage('home');
      return true;
    }
    alert("Invalid email or password!");
    return false;
  };

  const register = (name, email, password) => {
    if (users.find(u => u.email === email)) {
      alert("User with this email already exists!");
      return false;
    }
    const newUser = { id: Date.now(), name, email, password, role: "user" };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));
    alert("Registration successful! Please login.");
    setShowRegister(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setCurrentPage('landing');
    setIsMobileMenuOpen(false);
  };

  const deleteUser = (id) => {
    if (window.confirm("Delete this user?")) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem('appUsers', JSON.stringify(updated));
    }
  };

  const addUser = () => {
    const name = prompt("Enter full name:");
    const email = prompt("Enter email:");
    const password = prompt("Enter password:", "123");
    const role = prompt("Enter role (user/admin):", "user");
    if (name && email && password) {
      const newUser = { id: Date.now(), name, email, password, role };
      const updated = [...users, newUser];
      setUsers(updated);
      localStorage.setItem('appUsers', JSON.stringify(updated));
      alert("User added successfully!");
    }
  };

  // Simulation Engine
  const runSimulation = (data) => {
    const { plantingDate, rainfall, soilType, maizeVariety, fertilizerType, landSize } = data;

    const days = Math.max(0, Math.floor((Date.now() - new Date(plantingDate)) / (1000 * 60 * 60 * 24)));
    let growthStage = "Maturity";
    if (days <= 7) growthStage = "Germination";
    else if (days <= 30) growthStage = "Vegetative";
    else if (days <= 60) growthStage = "Flowering";

    let rainfallCategory = "Good";
    let rainfallFactor = 1.0;
    if (rainfall < 20) { rainfallCategory = "Poor"; rainfallFactor = 0.5; }
    else if (rainfall <= 50) { rainfallCategory = "Normal"; rainfallFactor = 0.8; }

    const soilMap = { sandy: { category: "Poor", factor: 0.7 }, clay: { category: "Moderate", factor: 0.8 }, loam: { category: "Good", factor: 1.0 } };
    const soilData = soilMap[soilType.toLowerCase()] || { category: "Good", factor: 1.0 };

    const fertMap = { organic: { impact: "Moderate", factor: 0.8 }, npk: { impact: "High", factor: 1.0 }, urea: { impact: "High", factor: 0.95 } };
    const fertData = fertMap[fertilizerType.toLowerCase()] || { impact: "Normal", factor: 1.0 };

    const varietyMap = { hybrid: { impact: "High Yield", factor: 1.1 }, local: { impact: "Standard Yield", factor: 0.9 } };
    const varietyData = varietyMap[maizeVariety.toLowerCase()] || { impact: "Normal", factor: 1.0 };

    const baseYield = 100;
    const stageWeights = { Germination: 0.3, Vegetative: 0.6, Flowering: 0.9, Maturity: 1.0 };
    const stageWeight = stageWeights[growthStage] || 1.0;

    const predictedYield = (baseYield * rainfallFactor * soilData.factor * fertData.factor * varietyData.factor * stageWeight * landSize).toFixed(2);

    const result = {
      growthStage,
      rainfallCategory,
      soilCategory: soilData.category,
      fertilizerImpact: fertData.impact,
      varietyImpact: varietyData.impact,
      predictedYield: parseFloat(predictedYield)
    };

    saveSimulation({ ...data, ...result });
    return result;
  };

  // ====================== LANDING PAGE ======================
  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <nav className="bg-[#052e16] border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Sprout className="w-8 h-8 text-emerald-500" />
              <div className="text-xl font-bold tracking-tighter">Planting Decision Tool</div>
            </div>
            <button 
              onClick={() => setCurrentPage('login')}
              className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-2xl font-semibold text-sm md:text-base transition"
            >
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero / Cover */}
        <header className="min-h-screen bg-cover bg-center flex items-center relative px-6" 
          style={{ backgroundImage: `linear-gradient(rgba(5,46,22,0.8), rgba(5,46,22,0.9)), url('https://picsum.photos/id/1015/2000/1200')` }}>
          <div className="max-w-4xl mx-auto text-center pt-20">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight mb-6">
              Smarter Maize<br />Planting Decisions
            </h1>
            <p className="text-lg md:text-2xl text-white/90 max-w-2xl mx-auto mb-10 px-4">
              Advanced digital twin simulation to predict yield, growth stages and optimize your farm.
            </p>
            <button 
              onClick={() => setCurrentPage('login')}
              className="bg-emerald-500 hover:bg-emerald-600 text-lg md:text-2xl px-10 md:px-16 py-5 md:py-7 rounded-3xl font-semibold inline-flex items-center gap-3 shadow-xl transition-all"
            >
              Start Simulation Now <Plus className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          </div>
        </header>
       {/* Key Features Section */}
        <section className="py-24 bg-white text-zinc-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-semibold mb-4">Why Farmers Trust Us</h2>
              <p className="text-xl text-gray-600">Powerful insights from real agricultural parameters</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {[
                { icon: "🌱", title: "Crop Growth Simulation", desc: "Accurate growth stage prediction" },
                { icon: "☔", title: "Rainfall Analysis", desc: "Impact of rainfall on your yield" },
                { icon: "🪴", title: "Soil & Fertilizer", desc: "Best recommendations for your field" }
              ].map((item, i) => (
                <div key={i} className="text-center p-10 bg-zinc-50 rounded-3xl hover:shadow-xl transition">
                  <div className="text-6xl mb-6">{item.icon}</div>
                  <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }


  // ====================== LOGIN / REGISTER ======================
  if (currentPage === 'login') {
    return (
      <div className="min-h-screen bg-[#052e16] flex items-center justify-center p-4 md:p-6">
        <div className="bg-white text-zinc-900 p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Sprout className="w-16 h-16 text-emerald-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">Welcome</h1>
          <p className="text-center text-gray-600 mb-10">Sign in to continue</p>

          {!showRegister ? (
            <form onSubmit={(e) => { e.preventDefault(); login(e.target.email.value, e.target.password.value); }} className="space-y-6">
              <input name="email" type="email" placeholder="Email" defaultValue="farmer@demo.com" className="w-full px-6 py-4 border border-gray-300 rounded-2xl text-base" required />
              <input name="password" type="password" placeholder="Password" defaultValue="123" className="w-full px-6 py-4 border border-gray-300 rounded-2xl text-base" required />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-3xl text-lg font-semibold">Login</button>
              <button type="button" onClick={() => setShowRegister(true)} className="w-full text-emerald-600 py-3 text-sm">New user? Create account</button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); register(e.target.name.value, e.target.email.value, e.target.password.value); }} className="space-y-6">
              <input name="name" type="text" placeholder="Full Name" className="w-full px-6 py-4 border border-gray-300 rounded-2xl text-base" required />
              <input name="email" type="email" placeholder="Email" className="w-full px-6 py-4 border border-gray-300 rounded-2xl text-base" required />
              <input name="password" type="password" placeholder="Password" className="w-full px-6 py-4 border border-gray-300 rounded-2xl text-base" required />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-3xl text-lg font-semibold">Create Account</button>
              <button type="button" onClick={() => setShowRegister(false)} className="w-full text-gray-500 py-3 text-sm">Back to Login</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ====================== MAIN APP ======================
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Responsive Navbar */}
      <nav className="bg-[#052e16] border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sprout className="w-8 h-8 text-emerald-500" />
              <div className="text-xl md:text-2xl font-bold tracking-tighter">Planting Decision Tool</div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <button onClick={() => setCurrentPage('home')} className="hover:text-emerald-400">Dashboard</button>
              {user?.role === 'admin' && (
                <button onClick={() => setCurrentPage('admin')} className="flex items-center gap-2 hover:text-emerald-400">
                  <Shield className="w-5 h-5" /> Admin
                </button>
              )}
              <button onClick={logout} className="flex items-center gap-2 text-red-400 hover:text-red-500">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-white/10 flex flex-col gap-4 text-sm">
              <button onClick={() => { setCurrentPage('home'); setIsMobileMenuOpen(false); }} className="py-2 text-left">Dashboard</button>
              {user?.role === 'admin' && (
                <button onClick={() => { setCurrentPage('admin'); setIsMobileMenuOpen(false); }} className="py-2 text-left flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Admin Panel
                </button>
              )}
              <button onClick={logout} className="py-2 text-left text-red-400">Logout</button>
            </div>
          )}
        </div>
      </nav>

      {/* USER DASHBOARD */}
      {currentPage === 'home' && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-semibold mb-8">New Simulation</h1>
          <SimulationForm runSimulation={runSimulation} saveSimulation={saveSimulation} />
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {currentPage === 'admin' && user?.role === 'admin' && (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-semibold mb-8">Admin Oversight Panel</h1>

          <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
            <button onClick={() => setAdminTab('overview')} className={`px-6 py-3 rounded-2xl text-sm md:text-base ${adminTab === 'overview' ? 'bg-emerald-600' : 'bg-zinc-800'}`}>Overview</button>
            <button onClick={() => setAdminTab('users')} className={`px-6 py-3 rounded-2xl text-sm md:text-base ${adminTab === 'users' ? 'bg-emerald-600' : 'bg-zinc-800'}`}>Manage Users</button>
            <button onClick={() => setAdminTab('activities')} className={`px-6 py-3 rounded-2xl text-sm md:text-base ${adminTab === 'activities' ? 'bg-emerald-600' : 'bg-zinc-800'}`}>All Activities</button>
          </div>

          {/* Overview Tab */}
          {adminTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-zinc-900 p-8 rounded-3xl">
                <div className="text-emerald-400 text-4xl md:text-5xl mb-4">{users.length}</div>
                <div className="text-xl font-semibold">Total Users</div>
              </div>
              <div className="bg-zinc-900 p-8 rounded-3xl">
                <div className="text-emerald-400 text-4xl md:text-5xl mb-4">{simulations.length}</div>
                <div className="text-xl font-semibold">Total Simulations</div>
              </div>
              <div className="bg-zinc-900 p-8 rounded-3xl">
                <div className="text-emerald-400 text-4xl md:text-5xl mb-4">{simulations.length > 0 ? simulations[simulations.length-1].predictedYield : 0}</div>
                <div className="text-xl font-semibold">Latest Yield</div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {adminTab === 'users' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-semibold">Manage Users</h2>
                <button onClick={addUser} className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-semibold w-full sm:w-auto justify-center">
                  <UserPlus className="w-5 h-5" /> Add New User
                </button>
              </div>
              <div className="bg-zinc-900 rounded-3xl overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-zinc-800">
                    <tr>
                      <th className="p-6 text-left">Name</th>
                      <th className="p-6 text-left">Email</th>
                      <th className="p-6 text-left">Role</th>
                      <th className="p-6 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-t border-white/10 hover:bg-zinc-800/50">
                        <td className="p-6">{u.name}</td>
                        <td className="p-6">{u.email}</td>
                        <td className="p-6">
                          <span className={`px-4 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-6">
                          <button onClick={() => deleteUser(u.id)} className="text-red-500 hover:text-red-600">
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Activities Tab */}
          {adminTab === 'activities' && (
            <div>
              <h2 className="text-2xl font-semibold mb-6">All System Activities & Logs</h2>
              <div className="bg-zinc-900 rounded-3xl overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-zinc-800">
                    <tr>
                      <th className="p-6 text-left">Date & Time</th>
                      <th className="p-6 text-left">User</th>
                      <th className="p-6 text-left">Yield (tons)</th>
                      <th className="p-6 text-left">Growth Stage</th>
                      <th className="p-6 text-left">Soil</th>
                      <th className="p-6 text-left">Rainfall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulations.length === 0 ? (
                      <tr><td colSpan="6" className="p-12 text-center text-white/50">No activities recorded yet</td></tr>
                    ) : (
                      simulations.slice().reverse().map(sim => (
                        <tr key={sim.id} className="border-t border-white/10 hover:bg-zinc-800/50">
                          <td className="p-6 whitespace-nowrap">{sim.date} {sim.time}</td>
                          <td className="p-6">{sim.userName || sim.userEmail}</td>
                          <td className="p-6 font-semibold text-emerald-400">{sim.predictedYield}</td>
                          <td className="p-6">{sim.growthStage}</td>
                          <td className="p-6">{sim.soilCategory}</td>
                          <td className="p-6">{sim.rainfallCategory}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simulation Form (Responsive)
function SimulationForm({ runSimulation, saveSimulation }) {
  const [formData, setFormData] = useState({
    plantingDate: '2026-05-15',
    rainfall: 45,
    soilType: 'loam',
    maizeVariety: 'hybrid',
    fertilizerType: 'npk',
    landSize: 8
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const simResult = runSimulation(formData);
    setResult(simResult);
    saveSimulation(simResult, formData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
      <div className="bg-zinc-900 rounded-3xl p-6 md:p-10">
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <div>
            <label className="block text-sm text-white/70 mb-2">Planting Date</label>
            <input type="date" name="plantingDate" value={formData.plantingDate} onChange={handleChange} className="w-full bg-zinc-800 border border-white/20 rounded-2xl px-6 py-4 text-base" required />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Rainfall (mm)</label>
            <input type="number" name="rainfall" value={formData.rainfall} onChange={handleChange} className="w-full bg-zinc-800 border border-white/20 rounded-2xl px-6 py-4 text-base" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-white/70 mb-2">Soil Type</label>
              <select name="soilType" value={formData.soilType} onChange={handleChange} className="w-full bg-zinc-800 border border-white/20 rounded-2xl px-6 py-4 text-base">
                <option value="sandy">Sandy</option>
                <option value="clay">Clay</option>
                <option value="loam">Loam</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Maize Variety</label>
              <select name="maizeVariety" value={formData.maizeVariety} onChange={handleChange} className="w-full bg-zinc-800 border border-white/20 rounded-2xl px-6 py-4 text-base">
                <option value="hybrid">Hybrid</option>
                <option value="local">Local</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-white/70 mb-2">Fertilizer Type</label>
              <select name="fertilizerType" value={formData.fertilizerType} onChange={handleChange} className="w-full bg-zinc-800 border border-white/20 rounded-2xl px-6 py-4 text-base">
                <option value="organic">Organic</option>
                <option value="npk">NPK</option>
                <option value="urea">Urea</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-2">Land Size (hectares)</label>
              <input type="number" name="landSize" value={formData.landSize} onChange={handleChange} className="w-full bg-zinc-800 border border-white/20 rounded-2xl px-6 py-4 text-base" required />
            </div>
          </div>

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 rounded-3xl text-lg md:text-2xl font-semibold mt-4">Run Simulation</button>
        </form>
      </div>

      <div className="bg-zinc-900 rounded-3xl p-6 md:p-10">
        <h2 className="text-2xl font-semibold mb-8">Simulation Results</h2>
        {result ? (
          <div className="space-y-6">
            <div className="text-center py-10 bg-zinc-800 rounded-3xl">
              <div className="text-6xl md:text-7xl font-bold text-emerald-400">{result.predictedYield}</div>
              <div className="text-white/70 text-lg">tons total yield</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-zinc-800 p-6 rounded-2xl">Growth Stage: <strong>{result.growthStage}</strong></div>
              <div className="bg-zinc-800 p-6 rounded-2xl">Rainfall: <strong>{result.rainfallCategory}</strong></div>
              <div className="bg-zinc-800 p-6 rounded-2xl">Soil: <strong>{result.soilCategory}</strong></div>
              <div className="bg-zinc-800 p-6 rounded-2xl">Fertilizer: <strong>{result.fertilizerImpact}</strong></div>
            </div>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-white/50 text-center px-4">
            Fill the form and run simulation to see results
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
