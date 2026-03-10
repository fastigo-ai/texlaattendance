import React, { useState, useEffect } from 'react';
import { Camera, LogOut, MapPin, Clock, Users, TrendingUp, Calendar, CheckCircle, XCircle, Loader } from 'lucide-react';

const API_URL = 'https://texlaattendance-backend.onrender.com/api';

// ============ Auth Context ============
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setUser(data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) throw new Error('Login failed');

    const data = await response.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============ Login Component ============
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),rgba(0,0,0,0))]"></div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Texla
            </h1>
            <p className="text-purple-200 text-sm">Sales Visit Tracking</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <p className="text-xs text-purple-200 mb-2">Demo Credentials:</p>
            <p className="text-xs text-white">Admin: admin@texla.com / admin123</p>
            <p className="text-xs text-white">Employee: employee@texla.com / emp123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ Employee Dashboard ============
const EmployeeDashboard = () => {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('visit');
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);

  // Visit form state
  const [shopName, setShopName] = useState('');
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [endDayPhoto, setEndDayPhoto] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    fetchVisits();
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await fetch(`${API_URL}/leave/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLeaves(data.leave_requests || []);
    } catch (err) {
      console.error('Failed to fetch leaves', err);
    }
  };

  const fetchVisits = async () => {
    try {
      const response = await fetch(`${API_URL}/visits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setVisits(data.visits || []);
    } catch (err) {
      console.error('Failed to fetch visits', err);
    }
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
        reject
      );
    });
  };

  const handleStartVisit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loc = await getLocation();
      setLocation(loc);

      const formData = new FormData();
      formData.append('shop_name', shopName);
      formData.append('latitude', loc.latitude);
      formData.append('longitude', loc.longitude);
      formData.append('photo', photo);

      const response = await fetch(`${API_URL}/visits/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to start visit');

      alert('Visit started successfully!');
      setShopName('');
      setPhoto(null);
      fetchVisits();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEndDay = async () => {
    if (!endDayPhoto) {
      alert('Please select a photo first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', endDayPhoto);

      const response = await fetch(`${API_URL}/visits/end-day`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to end day');

      alert('Day ended successfully!');
      setEndDayPhoto(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLeave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/leave/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leave_date: leaveDate, reason: leaveReason })
      });

      if (!response.ok) throw new Error('Failed to request leave');

      alert('Leave request submitted!');
      setLeaveDate('');
      setLeaveReason('');
      fetchLeaves();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>Texla</h1>
            <p className="text-sm text-gray-600">{user?.name}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-white rounded-lg p-2 shadow-sm">
          <button
            onClick={() => setActiveTab('visit')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${activeTab === 'visit'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Start Visit
          </button>
          <button
            onClick={() => setActiveTab('end')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${activeTab === 'end'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            End Day
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${activeTab === 'leave'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Leave
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${activeTab === 'history'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'visit' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Start New Visit</h2>
            <form onSubmit={handleStartVisit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter shop name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visit Photo (Required)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                  <Camera size={48} className="mx-auto text-gray-400 mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setPhoto(e.target.files[0])}
                    className="hidden"
                    id="visit-photo"
                    required
                  />
                  <label htmlFor="visit-photo" className="cursor-pointer text-blue-600 font-medium">
                    {photo ? photo.name : 'Tap to take photo'}
                  </label>
                </div>
              </div>

              {location && (
                <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
                  <MapPin size={20} className="text-blue-600" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Location Captured</p>
                    <p className="text-gray-600">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-600 hover:to-indigo-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="animate-spin" size={20} /> : <Camera size={20} />}
                {loading ? 'Starting Visit...' : 'Start Visit'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'end' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">End Your Day</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Day Photo (Required)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition">
                  <Camera size={48} className="mx-auto text-gray-400 mb-2" />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setEndDayPhoto(e.target.files[0])}
                    className="hidden"
                    id="end-day-photo"
                  />
                  <label htmlFor="end-day-photo" className="cursor-pointer text-blue-600 font-medium">
                    {endDayPhoto ? endDayPhoto.name : 'Tap to take photo'}
                  </label>
                </div>
              </div>

              <button
                onClick={handleEndDay}
                disabled={loading || !endDayPhoto}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                {loading ? 'Ending Day...' : 'End Day'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Request Leave</h2>
              <form onSubmit={handleRequestLeave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leave Date</label>
                  <input
                    type="date"
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <textarea
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Why do you need leave?"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Leave Status</h2>
              <div className="space-y-3">
                {leaves.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No leave requests found</p>
                ) : (
                  leaves.map((l) => (
                    <div key={l.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-900">{l.leave_date}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{l.reason}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${l.status === 'approved' ? 'bg-green-100 text-green-700' :
                        l.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                        {l.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Visit History</h2>
            {visits.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <p className="text-gray-500">No visits recorded yet</p>
              </div>
            ) : (
              visits.map((visit) => (
                <div key={visit.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{visit.shop_name}</h3>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Completed
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{visit.visit_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{visit.visit_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{visit.latitude.toFixed(6)}, {visit.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============ Admin Dashboard ============
const AdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [visits, setVisits] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [endDayRecords, setEndDayRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, visitsRes, employeesRes, leavesRes, endDayRes] = await Promise.all([
        fetch(`${API_URL}/admin/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/visits`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/admin/employees`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/leave/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/visits/end-day-photos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const visitsData = await visitsRes.json();
      const employeesData = await employeesRes.json();
      const leavesData = await leavesRes.json();
      const endDayData = await endDayRes.json();

      setStats(statsData);
      setVisits(visitsData.visits || []);
      setEmployees(employeesData.employees || []);
      setLeaves(leavesData.leave_requests || []);
      setEndDayRecords(endDayData.end_day_records || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateLeave = async (leaveId, status) => {
    try {
      const response = await fetch(`${API_URL}/leave/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ leave_id: leaveId, status })
      });

      if (!response.ok) throw new Error('Failed to update leave');

      alert(`Leave ${status} successfully!`);
      fetchDashboardData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-lg transform hover:scale-105 transition`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
        <div className="bg-white/20 p-3 rounded-xl">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Texla Admin</h1>
              <p className="text-indigo-100 mt-1">{user?.name}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-white rounded-xl p-2 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition ${activeTab === 'overview'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('visits')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition ${activeTab === 'visits'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Visits
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition ${activeTab === 'employees'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition ${activeTab === 'leaves'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            Leaves
          </button>
          <button
            onClick={() => setActiveTab('endday')}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition ${activeTab === 'endday'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            End Day
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin text-indigo-600" size={48} />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    title="Today's Visits"
                    value={stats.total_visits_today || 0}
                    icon={TrendingUp}
                    color="from-blue-500 to-cyan-500"
                  />
                  <StatCard
                    title="Active Employees"
                    value={stats.active_employees || 0}
                    icon={Users}
                    color="from-green-500 to-emerald-500"
                  />
                  <StatCard
                    title="Attendance"
                    value={`${stats.attendance_percentage || 0}%`}
                    icon={CheckCircle}
                    color="from-purple-500 to-pink-500"
                  />
                  <StatCard
                    title="Shops Covered"
                    value={stats.shops_covered || 0}
                    icon={MapPin}
                    color="from-orange-500 to-red-500"
                  />
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                  <div className="space-y-4">
                    {visits.slice(0, 5).map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                        <div>
                          <p className="font-semibold text-gray-900">{visit.employee_name}</p>
                          <p className="text-sm text-gray-600">{visit.shop_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{visit.visit_date}</p>
                          <p className="text-xs text-gray-500">{visit.visit_time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'visits' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500">
                  <h2 className="text-2xl font-bold text-white">All Visits</h2>
                </div>
                <div className="p-6">
                  {visits.length === 0 ? (
                    <p className="text-center text-gray-500 py-12">No visits recorded yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Employee</th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Shop Name</th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Date</th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Time</th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Photo</th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visits.map((visit) => (
                            <tr key={visit.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                              <td className="py-4 px-4">{visit.employee_name}</td>
                              <td className="py-4 px-4 font-medium">{visit.shop_name}</td>
                              <td className="py-4 px-4">{visit.visit_date}</td>
                              <td className="py-4 px-4">{visit.visit_time}</td>
                              <td className="py-4 px-4">
                                {visit.visit_photo ? (
                                  <a href={visit.visit_photo} target="_blank" rel="noopener noreferrer">
                                    <img src={visit.visit_photo} alt="Visit" className="w-12 h-12 rounded-lg object-cover border border-gray-200 hover:scale-110 transition cursor-pointer" />
                                  </a>
                                ) : (
                                  <span className="text-gray-400">No photo</span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-600">
                                {visit.latitude.toFixed(4)}, {visit.longitude.toFixed(4)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'employees' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500">
                  <h2 className="text-2xl font-bold text-white">Employees</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employees.map((employee) => (
                      <div key={employee.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 hover:shadow-md transition">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {employee.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{employee.name}</h3>
                            <p className="text-sm text-gray-600">{employee.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                            Active
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'leaves' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <h2 className="text-2xl font-bold">Leave Requests</h2>
                </div>
                <div className="p-6">
                  {leaves.length === 0 ? (
                    <p className="text-center text-gray-500 py-12">No leave requests found</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {leaves.map((leave) => (
                        <div key={leave.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-gray-900">{leave.employee_name}</h3>
                              <p className="text-sm text-gray-500">{leave.leave_date}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                              leave.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                              {leave.status}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mb-6">{leave.reason}</p>
                          {leave.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateLeave(leave.id, 'approved')}
                                className="flex-1 bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateLeave(leave.id, 'rejected')}
                                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'endday' && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <h2 className="text-2xl font-bold">End Day Records</h2>
                </div>
                <div className="p-6">
                  {endDayRecords.length === 0 ? (
                    <p className="text-center text-gray-500 py-12">No end-day records found</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {endDayRecords.map((record) => (
                        <div key={record.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-gray-900">{record.employee_name}</h3>
                              <p className="text-sm text-gray-500">{record.date} at {record.time}</p>
                            </div>
                          </div>
                          {record.photo ? (
                            <a href={record.photo} target="_blank" rel="noopener noreferrer">
                              <img src={record.photo} alt="End Day" className="w-full h-48 rounded-lg object-cover border border-gray-200 hover:opacity-90 transition cursor-pointer" />
                            </a>
                          ) : (
                            <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                              No photo
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============ Main App Component ============
function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return user.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />;
}

export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
