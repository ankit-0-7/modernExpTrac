import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, PlusCircle, BarChart3, FileText, Upload, Settings, 
  Bell, ChevronRight, Trash2, Loader2, Camera, Menu, X, Wallet, IndianRupee, 
  Edit3, CreditCard, Calendar, PieChart as PieIcon, Save, Download, AlertTriangle, User, LogOut, CheckCircle, UploadCloud
} from 'lucide-react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, PieChart, Pie, ReferenceLine, BarChart, 
  AreaChart, Area 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import ReactMarkdown from 'react-markdown'; 
import LandingPage from './LandingPage';
import logo from "./ExpenseLogo.png"; // Ensure this image is in client/src/

const API_BASE_URL = "https://probable-waddle-v9xw9q9gxvj24pg-5000.app.github.dev";

// --- REUSABLE COMPONENTS ---
const Card = ({ children, className = "" }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`bg-[#1c1c1e] rounded-2xl p-5 border-t border-white/10 shadow-xl ${className}`}
  >
    {children}
  </motion.div>
);

const Sidebar = ({ activeTab, setActiveTab, onUploadClick, isOpen, toggleSidebar, onLogout }) => {
  // Get User Name and Initial
  const userName = localStorage.getItem('userName') || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}
  
      {/* Sidebar Content */}
      <div className={`fixed left-0 top-0 h-screen w-64 bg-[#18181b] border-r border-white/5 z-50 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 flex flex-col p-6 font-sans`}>
        
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
             <img src={logo} alt="Xpense" className="h-12 w-auto object-contain" />
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-gray-400">
            <X size={24} />
          </button>
        </div>
  
        <nav className="flex-1 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); toggleSidebar(); }} />
          <NavItem icon={<BarChart3 size={20} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); toggleSidebar(); }} />
          <NavItem icon={<FileText size={20} />} label="AI Reports" active={activeTab === 'reports'} onClick={() => { setActiveTab('reports'); toggleSidebar(); }} />
          <div onClick={() => { onUploadClick(); toggleSidebar(); }}>
            <NavItem icon={<Upload size={20} />} label="Upload Receipt" />
          </div>
          <NavItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); toggleSidebar(); }} />
        </nav>
  
        <div className="mt-auto">
           <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium">
              <LogOut size={20}/> Logout
           </button>
           
           {/* UPDATED PROFILE SECTION */}
           <div className="bg-[#27272a] rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                    {userInitial}
                 </div>
                 <div>
                    <h4 className="text-sm font-semibold text-white">{userName}</h4>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </>
  );
};

const NavItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
    active ? 'bg-[#27272a] text-emerald-400 border-l-4 border-emerald-400' : 'text-gray-400 hover:bg-white/5'
  }`}>
    {icon} <span className="text-sm font-medium">{label}</span>
  </div>
);

const AddTransactionModal = ({ isOpen, onClose, onSubmit, categories, isSubmitting }) => {
  if (!isOpen) return null;
  const [localData, setLocalData] = useState({
    title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0],
    paymentMode: 'UPI', description: ''
  });

  const handleSubmit = () => {
    if(!localData.title || !localData.amount) return alert("Title and Amount are required!");
    onSubmit(localData);
    setLocalData({ ...localData, title: '', amount: '', description: '' });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#18181b] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Add Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="text-xs text-gray-400 font-medium ml-1">Amount</label>
            <div className="relative mt-1">
              <span className="absolute left-4 top-3.5 text-emerald-400 font-bold text-lg">₹</span>
              <input type="number" className="w-full bg-[#27272a] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-lg focus:outline-none focus:border-emerald-500 transition-colors" 
                placeholder="0.00" value={localData.amount} onChange={e => setLocalData({...localData, amount: e.target.value})} autoFocus />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 font-medium ml-1">Title</label>
              <input className="w-full mt-1 bg-[#27272a] border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none" 
                placeholder="e.g. Lunch" value={localData.title} onChange={e => setLocalData({...localData, title: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium ml-1">Category</label>
              <select className="w-full mt-1 bg-[#27272a] border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                value={localData.category} onChange={e => setLocalData({...localData, category: e.target.value})}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="custom">+ Custom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 font-medium ml-1">Date</label>
              <div className="relative mt-1">
                <input type="date" className="w-full bg-[#27272a] border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none"
                  value={localData.date} onChange={e => setLocalData({...localData, date: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium ml-1">Payment Mode</label>
              <div className="flex mt-1 bg-[#27272a] rounded-xl p-1 border border-white/10">
                <button onClick={() => setLocalData({...localData, paymentMode: 'UPI'})} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${localData.paymentMode === 'UPI' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>UPI</button>
                <button onClick={() => setLocalData({...localData, paymentMode: 'Cash'})} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${localData.paymentMode === 'Cash' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Cash</button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium ml-1">Description (Optional)</label>
            <textarea className="w-full mt-1 bg-[#27272a] border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none resize-none h-20"
              placeholder="Add notes..." value={localData.description} onChange={e => setLocalData({...localData, description: e.target.value})} />
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-transparent border border-white/10 text-gray-300 hover:bg-white/5 transition font-medium">Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition flex justify-center items-center gap-2">
            {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : "Save Expense"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- DASHBOARD COMPONENT ---
function DashboardComponent({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [forecast, setForecast] = useState([]); // Store future data
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // NEW: 'idle', 'uploading', 'success', 'error'
  
  // Settings State
  const [monthlyBudget, setMonthlyBudget] = useState(10000);
  const [dailyBudget, setDailyBudget] = useState(500);
  const [categories, setCategories] = useState(['Food', 'Travel', 'Shopping', 'Bills', 'Rent', 'Medical', 'Utilities']);
  const [newCategory, setNewCategory] = useState('');
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiReport, setAiReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [analyticsView, setAnalyticsView] = useState('monthly'); 
  
  const fileInputRef = useRef(null);

  // --- GET TOKEN ---
  const token = localStorage.getItem('token');
  // --- ATTACH TOKEN TO HEADERS ---
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [expRes, setRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/expenses`, authHeader),
        axios.get(`${API_BASE_URL}/api/settings`, authHeader)
      ]);
      setExpenses(expRes.data);
      if (setRes.data) {
        setMonthlyBudget(setRes.data.monthlyBudget || 10000);
        setDailyBudget(setRes.data.dailyBudget || 500);
        if(setRes.data.categories?.length > 0) setCategories(setRes.data.categories);
      }

      // --- NEW: Try to get forecast ---
      try {
        const predRes = await axios.get(`${API_BASE_URL}/api/predict`, authHeader);
        setForecast(predRes.data.forecast);
      } catch (err) {
        console.log("Prediction not available yet (need more data)");
      }
      // --------------------------------

    } catch (err) { console.error(err); }
  };

  const handleUpdateLimits = async () => {
    const newM = prompt("Set Monthly Budget (₹):", monthlyBudget);
    const newD = prompt("Set Daily Spend Limit (₹):", dailyBudget);
    
    if (newM && !isNaN(newM) && newD && !isNaN(newD)) {
      setMonthlyBudget(Number(newM));
      setDailyBudget(Number(newD));
      await axios.post(`${API_BASE_URL}/api/settings/budget`, { 
        monthlyBudget: Number(newM),
        dailyBudget: Number(newD)
      }, authHeader);
      fetchData();
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory) return;
    await axios.post(`${API_BASE_URL}/api/settings/categories`, { category: newCategory }, authHeader);
    setCategories(prev => [...prev, newCategory]);
    setNewCategory('');
  };

  const handleExportCSV = () => {
    const headers = ["Title,Amount,Category,Date,Mode,Description"];
    const rows = expenses.map(e => `${e.title},${e.amount},${e.category},${new Date(e.date).toLocaleDateString()},${e.paymentMode || 'Cash'},${e.description || ''}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleResetData = async () => {
    if(confirm("⚠️ ARE YOU SURE?\nThis will permanently delete ALL expenses.\nThis action cannot be undone.")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/expenses/all`, authHeader);
        setExpenses([]);
        alert("All data reset successfully.");
      } catch (err) {
        alert("Failed to reset data. Check connection.");
      }
    }
  };

  const handleModalSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      let finalCategory = data.category;
      if (data.category === 'custom') {
        const custom = prompt("Enter new category name:");
        if (!custom) { setIsSubmitting(false); return; }
        finalCategory = custom;
        await axios.post(`${API_BASE_URL}/api/settings/categories`, { category: custom }, authHeader);
        setCategories(prev => [...prev, custom]);
      }

      await axios.post(`${API_BASE_URL}/api/expenses`, { ...data, category: finalCategory }, authHeader);
      await fetchData();
      setIsModalOpen(false);
    } catch (err) { alert("Failed to save"); } 
    finally { setIsSubmitting(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Start the "Uploading" animation (Spinner)
    setUploadStatus('uploading'); 

    const data = new FormData();
    data.append('receipt', file);

    try {
      await axios.post(`${API_BASE_URL}/api/scan`, data, authHeader);
      
      // 2. Show "Success" animation (Checkmark)
      setUploadStatus('success'); 
      
      fetchData(); // Refresh your list

      // 3. Reset button to normal after 3 seconds
      setTimeout(() => setUploadStatus('idle'), 3000);

    } catch (err) {
      console.error("Scan error:", err);
      
      // 4. Show "Error" animation (Red X)
      setUploadStatus('error');
      
      // Reset button to normal after 3 seconds
      setTimeout(() => setUploadStatus('idle'), 3000);
    } finally {
      e.target.value = null; // Clear input so you can select the same file again
    }
  };

  const generateAIReport = async () => {
    setReportLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/analyze-spending`, {}, authHeader);
      setAiReport(res.data.report);
    } catch (err) { alert("AI Error"); }
    finally { setReportLoading(false); }
  };

  const deleteExpense = async (id) => {
    try { await axios.delete(`${API_BASE_URL}/api/expenses/${id}`, authHeader); fetchData(); } 
    catch (err) { console.error(err); }
  };

  // --- ANALYTICS CALCULATIONS ---
  const filteredData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      if (analyticsView === 'monthly') {
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      } else {
        return expDate.getFullYear() === currentYear;
      }
    });
  }, [expenses, analyticsView]);

  const chartData = useMemo(() => {
    const map = {};
    filteredData.forEach(exp => {
       const dateObj = new Date(exp.date);
       let key = analyticsView === 'monthly' ? dateObj.getDate() : dateObj.toLocaleDateString('en-US', { month: 'short' });
       let sortKey = analyticsView === 'monthly' ? dateObj.getDate() : dateObj.getMonth();

       if (!map[key]) map[key] = { name: key, expense: 0, sortIdx: sortKey };
       map[key].expense += exp.amount;
    });

    let result = Object.values(map);
    result.sort((a, b) => a.sortIdx - b.sortIdx);
    
    result = result.map(item => ({
      ...item,
      limit: analyticsView === 'monthly' ? dailyBudget : monthlyBudget,
      saving: Math.max((analyticsView === 'monthly' ? dailyBudget : monthlyBudget) - item.expense, 0)
    }));

    return result.length > 0 ? result : [{ name: 'No Data', expense: 0, limit: 0, saving: 0 }];
  }, [filteredData, analyticsView, dailyBudget, monthlyBudget]);

  const pieChartData = useMemo(() => {
    const map = {};
    filteredData.forEach(exp => {
      if (!map[exp.category]) map[exp.category] = 0;
      map[exp.category] += exp.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const analyticsTotal = filteredData.reduce((sum, item) => sum + item.amount, 0);
  const analyticsMaxCategory = pieChartData.length > 0 ? pieChartData[0] : { name: 'None', value: 0 };

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'];

  const currentMonth = new Date().getMonth();
  const monthlySpent = expenses.filter(e => new Date(e.date).getMonth() === currentMonth).reduce((a, c) => a + c.amount, 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const dailySpent = expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === todayStr).reduce((a, c) => a + c.amount, 0);
  const dailySaving = Math.max(dailyBudget - dailySpent, 0);
  const monthlySaving = Math.max(monthlyBudget - monthlySpent, 0);

  const dashChartData = useMemo(() => {
    const map = {};
    expenses.forEach(exp => {
       const dateObj = new Date(exp.date);
       let key = dateObj.getDate(); 
       if (!map[key]) map[key] = { name: key, expense: 0 };
       map[key].expense += exp.amount;
    });
    let result = Object.values(map);
    result.sort((a, b) => a.name - b.name);
    return result.length > 0 ? result : [{ name: 'Today', expense: 0 }];
  }, [expenses]);

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onUploadClick={() => fileInputRef.current.click()} isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={onLogout} />
      
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleModalSubmit} 
        categories={categories}
        isSubmitting={isSubmitting}
      />

      <div className="md:pl-64 transition-all duration-300">
        <header className="flex justify-between items-center p-6 gap-4 border-b border-white/5 sticky top-0 bg-[#121212]/80 backdrop-blur z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-400 hover:text-white bg-[#1c1c1e] rounded-lg"><Menu size={24} /></button>
             <h2 className="text-xl md:text-2xl font-bold capitalize text-gray-200">{activeTab}</h2>
          </div>
          <div className="flex gap-3">
             {/* === NEW ANIMATED UPLOAD BUTTON === */}
             <div className="relative h-[42px] min-w-[140px]"> 
                 <input 
                     type="file" 
                     ref={fileInputRef} // Keep the ref so we can trigger it if needed
                     id="receipt-upload" 
                     className="hidden" 
                     accept="image/*,application/pdf" 
                     onChange={handleFileUpload} 
                     disabled={uploadStatus === 'uploading'} 
                 />
                 <label 
                     htmlFor="receipt-upload" 
                     className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition border h-full relative overflow-hidden
                     ${uploadStatus === 'uploading' ? 'bg-[#27272a] border-emerald-500/50 cursor-not-allowed' : ''}
                     ${uploadStatus === 'success' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-[#1c1c1e] hover:bg-[#32323a] border-white/10 text-white'}
                     ${uploadStatus === 'error' ? 'bg-red-500/20 border-red-500 text-red-400' : ''}
                     `}
                 >
                     <AnimatePresence mode="wait">
                         {uploadStatus === 'idle' && (
                             <motion.div 
                                 key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                 className="flex items-center gap-2"
                             >
                                 <UploadCloud size={18} /> <span className="hidden md:inline text-sm font-medium">Scan Bill</span>
                             </motion.div>
                         )}

                         {uploadStatus === 'uploading' && (
                             <motion.div 
                                 key="uploading" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                                 className="absolute inset-0 flex items-center justify-center"
                             >
                                 <Loader2 className="animate-spin text-emerald-500" size={22} />
                             </motion.div>
                         )}

                         {uploadStatus === 'success' && (
                             <motion.div 
                                 key="success" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1.2 }} exit={{ opacity: 0, scale: 0.5 }}
                                 className="absolute inset-0 flex items-center justify-center"
                             >
                                 <CheckCircle className="text-emerald-500 font-bold" size={24} />
                             </motion.div>
                         )}
                          {uploadStatus === 'error' && (
                             <motion.div 
                                 key="error" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                                 className="absolute inset-0 flex items-center justify-center"
                             >
                                 <X className="text-red-500" size={22} />
                             </motion.div>
                         )}
                     </AnimatePresence>
                 </label>
             </div>
          </div>
        </header>

        <main className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* === DASHBOARD === */}
          {activeTab === 'dashboard' && (
            <>
              {/* Row 1: Limit Cards */}
              <Card className="col-span-1 md:col-span-6 lg:col-span-4 relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-400 text-sm font-medium">Monthly Budget</h3>
                    <h2 className="text-3xl font-bold mt-1 text-white">₹{monthlyBudget.toLocaleString()}</h2>
                    <p className="text-xs text-gray-500 mt-1">Spent: ₹{monthlySpent.toLocaleString()}</p>
                  </div>
                  <button onClick={handleUpdateLimits} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-emerald-400"><Edit3 size={18}/></button>
                </div>
                <div className="w-full h-1.5 bg-gray-700 rounded-full mt-4 overflow-hidden">
                   <div className={`h-full ${monthlySpent > monthlyBudget ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((monthlySpent/monthlyBudget)*100, 100)}%` }}></div>
                </div>
              </Card>

              <Card className="col-span-1 md:col-span-6 lg:col-span-4">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className="text-gray-400 text-sm font-medium">Daily Limit</h3>
                      <h2 className="text-3xl font-bold mt-1 text-white">₹{dailyBudget.toLocaleString()}</h2>
                      <p className={`text-xs mt-1 ${dailySpent > dailyBudget ? 'text-red-400' : 'text-emerald-400'}`}>
                        Today's Spend: ₹{dailySpent}
                      </p>
                   </div>
                   <div className={`p-2 rounded-lg ${dailySpent > dailyBudget ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {dailySpent > dailyBudget ? <p className="text-xs font-bold">OVER</p> : <p className="text-xs font-bold">SAFE</p>}
                   </div>
                </div>
              </Card>

              <Card className="col-span-1 md:col-span-12 lg:col-span-4">
                 <h3 className="text-gray-400 text-sm font-medium">Total Savings (Month)</h3>
                 <h2 className="text-3xl font-bold mt-1 text-emerald-400">₹{monthlySaving.toLocaleString()}</h2>
                 <p className="text-xs text-gray-500 mt-1">Available to spend: ₹{Math.max(monthlyBudget - monthlySpent, 0).toLocaleString()}</p>
              </Card>

              {/* Row 2: Graph & Stack */}
              <Card className="col-span-1 md:col-span-12 lg:col-span-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Daily Expenses</h3>
                    <p className="text-xs text-gray-400">Daily spending vs limit</p>
                  </div>
                  <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-medium transition shadow-lg shadow-emerald-900/20">
                    <PlusCircle size={18} /> Add New
                  </button>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dashChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c1c1e', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                      <Legend />
                      <Bar name="Expense" dataKey="expense" barSize={30} fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <ReferenceLine y={dailyBudget} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top',  value: 'Limit', fill: '#10b981', fontSize: 10 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Stack: Pie & Today's Health */}
              <div className="col-span-1 md:col-span-12 lg:col-span-4 flex flex-col gap-6">
                <Card className="h-[220px]">
                   <h3 className="text-sm font-semibold mb-2">Category Breakdown</h3>
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                         {pieChartData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                     </PieChart>
                   </ResponsiveContainer>
                </Card>

                {/* Today's Health Section */}
                <Card className="flex-1">
                   <h3 className="text-sm font-semibold mb-4">Today's Health</h3>
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Daily Limit</span>
                      <span className="text-white font-bold">₹{dailyBudget}</span>
                   </div>
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400 text-sm">Spent</span>
                      <span className="text-red-400 font-bold">-₹{dailySpent}</span>
                   </div>
                   <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Saved Today</span>
                      <span className="text-emerald-400 font-bold text-xl">+₹{dailySaving}</span>
                   </div>
                </Card>
              </div>

              {/* Row 3: Transactions */}
              <Card className="col-span-1 md:col-span-12">
                <h3 className="text-lg font-semibold mb-4">Expense History</h3>
                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-white/5">
                        <th className="py-2 font-medium">Title & Description</th>
                        <th className="py-2 font-medium">Date</th>
                        <th className="py-2 font-medium">Category</th>
                        <th className="py-2 font-medium">Mode</th>
                        <th className="py-2 font-medium">Amount</th>
                        <th className="py-2 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {expenses.map((t) => (
                          <motion.tr key={t._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b border-white/5 text-sm group hover:bg-white/5 transition-colors">
                            <td className="py-4 font-medium">
                              <div className="text-white">{t.title}</div>
                              {t.description && <div className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{t.description}</div>}
                            </td>
                            <td className="py-4 text-gray-400">{new Date(t.date).toLocaleDateString()}</td>
                            <td className="py-4 text-gray-400"><span className="bg-white/5 px-2 py-1 rounded text-xs">{t.category}</span></td>
                            <td className="py-4 text-gray-400 text-xs">{t.paymentMode || 'Cash'}</td>
                            <td className="py-4 font-bold text-emerald-400">₹{t.amount.toFixed(2)}</td>
                            <td className="py-4 text-right">
                              <button onClick={() => deleteExpense(t._id)} className="p-2 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition"><Trash2 size={14}/></button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* === ANALYTICS VIEW === */}
          {activeTab === 'analytics' && (
             <div className="col-span-1 md:col-span-12 space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-center bg-[#1c1c1e] p-4 rounded-xl border border-white/10">
                   <div>
                      <h2 className="text-xl font-bold">Performance Report</h2>
                      <p className="text-xs text-gray-400">{analyticsView === 'monthly' ? "Showing Current Month" : "Showing Current Year"}</p>
                   </div>
                   <select className="bg-[#27272a] text-white py-2 px-4 rounded-lg border border-white/10 outline-none cursor-pointer hover:bg-zinc-700 transition"
                      value={analyticsView} onChange={e => setAnalyticsView(e.target.value)}>
                      <option value="monthly">Monthly Report</option>
                      <option value="yearly">Yearly Report</option>
                   </select>
                </div>

                {/* Summary Cards - Fixed Orientation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="p-5 flex flex-row items-center gap-4 overflow-hidden">
                      <div className="p-3 bg-red-500/10 rounded-full text-red-500 shrink-0"><IndianRupee size={24} /></div>
                      <div className="min-w-0">
                         <p className="text-xs text-gray-400 truncate">Total Spent</p>
                         <h3 className="text-2xl font-bold truncate">₹{analyticsTotal.toLocaleString()}</h3>
                      </div>
                   </Card>
                   <Card className="p-5 flex flex-row items-center gap-4 overflow-hidden">
                      <div className="p-3 bg-blue-500/10 rounded-full text-blue-500 shrink-0"><PieIcon size={24} /></div>
                      <div className="min-w-0">
                         <p className="text-xs text-gray-400 truncate">Top Category</p>
                         <h3 className="text-xl font-bold truncate">{analyticsMaxCategory.name}</h3>
                         <p className="text-xs text-gray-500 truncate">₹{analyticsMaxCategory.value.toLocaleString()}</p>
                      </div>
                   </Card>
                   <Card className="p-5 flex flex-row items-center gap-4 overflow-hidden">
                      <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500 shrink-0"><Wallet size={24} /></div>
                      <div className="min-w-0">
                         <p className="text-xs text-gray-400 truncate">Est. Savings</p>
                         <h3 className="text-2xl font-bold truncate">₹{Math.max(((analyticsView === 'monthly' ? monthlyBudget : monthlyBudget * 12) - analyticsTotal), 0).toLocaleString()}</h3>
                      </div>
                   </Card>
                </div>
                {/* PREDICTION CHART */}
                <Card className="col-span-1 md:col-span-12 mb-6 border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                                🔮 AI Future Forecast
                            </h3>
                            <p className="text-xs text-gray-400">Predicted spending for next 30 days (Prophet Model)</p>
                        </div>
                        {forecast.length === 0 && (
                            <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                                Need data from 5+ days
                            </span>
                        )}
                    </div>
                    
                    {forecast.length > 0 ? (
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={forecast}>
                                    <defs>
                                        <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        tick={{ fill: '#6b7280', fontSize: 10 }} 
                                        tickFormatter={(str) => {
                                            const date = new Date(str);
                                            return `${date.getDate()}/${date.getMonth()+1}`;
                                        }}
                                    />
                                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1c1c1e', border: '1px solid #333' }}
                                        itemStyle={{ color: '#10b981' }}
                                        labelFormatter={(label) => `Date: ${label}`}
                                        formatter={(value) => [`₹${value}`, "Predicted Spend"]}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="predicted_amount" 
                                        stroke="#10b981" 
                                        fillOpacity={1} 
                                        fill="url(#colorPred)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[150px] flex flex-col items-center justify-center text-gray-500 text-sm">
                            <p>Not enough history to predict the future.</p>
                            <p className="text-xs mt-1">Try adding expenses for different dates!</p>
                        </div>
                    )}
                </Card>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                   <Card className="lg:col-span-2 h-[400px]">
                      <h3 className="text-sm font-semibold mb-4">Expense Trend</h3>
                      <ResponsiveContainer width="100%" height="100%">
                         <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false}/>
                            <XAxis dataKey="name" tick={{fill: '#888'}} />
                            <YAxis tick={{fill: '#888'}} tickFormatter={val => `₹${val}`} />
                            <Tooltip contentStyle={{backgroundColor: '#121212', border: '1px solid #333'}} />
                            <Legend />
                            <Bar name="Expense" dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} barSize={20} />
                            <Line name="Savings" type="monotone" dataKey="saving" stroke="#10b981" strokeWidth={2} dot={false} />
                         </ComposedChart>
                      </ResponsiveContainer>
                   </Card>

                   <Card className="h-[400px]">
                      <h3 className="text-sm font-semibold mb-2">Category Split</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {pieChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                        </PieChart>
                      </ResponsiveContainer>
                   </Card>
                </div>
             </div>
          )}

          {/* === REPORTS VIEW === */}
          {activeTab === 'reports' && (
             <div className="col-span-1 md:col-span-12">
                <Card className="min-h-[400px]">
                   <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-6">
                      <div>
                         <h3 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">✨ AI Financial Advisor</h3>
                         <p className="text-gray-400 text-sm mt-1">Powered by Groq</p>
                      </div>
                      <button onClick={generateAIReport} disabled={reportLoading} className="bg-emerald-600 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                         {reportLoading ? <Loader2 className="animate-spin" /> : <FileText size={18}/>}
                         {reportLoading ? "Analyzing..." : "Generate New Report"}
                      </button>
                   </div>
                   {aiReport ? <div className="prose prose-invert max-w-none text-gray-300"><ReactMarkdown>{aiReport}</ReactMarkdown></div> : 
                     <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
                        <div className="bg-zinc-800 p-6 rounded-full mb-4"><FileText size={48} className="text-emerald-500" /></div>
                        <p className="text-lg font-medium text-gray-300">No report generated yet.</p>
                     </div>
                   }
                </Card>
             </div>
          )}

          {/* === SETTINGS VIEW === */}
          {activeTab === 'settings' && (
             <div className="col-span-1 md:col-span-12 space-y-6">
                <Card>
                   <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Settings size={20} className="text-emerald-400"/> General Settings</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                         <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Financial Goals</h4>
                         <div className="bg-[#27272a] p-4 rounded-xl border border-white/5">
                            <label className="text-xs text-gray-400">Monthly Budget (₹)</label>
                            <input type="number" className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-emerald-500 outline-none" 
                               value={monthlyBudget} 
                               onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setMonthlyBudget(val);
                                  axios.post(`${API_BASE_URL}/api/settings/budget`, { monthlyBudget: val }, authHeader);
                               }}
                            />
                         </div>
                         <div className="bg-[#27272a] p-4 rounded-xl border border-white/5">
                            <label className="text-xs text-gray-400">Daily Spend Limit (₹)</label>
                            <input type="number" className="w-full bg-transparent border-b border-white/10 py-2 text-white focus:border-emerald-500 outline-none" 
                               value={dailyBudget} 
                               onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setDailyBudget(val);
                                  axios.post(`${API_BASE_URL}/api/settings/budget`, { dailyBudget: val }, authHeader);
                               }}
                            />
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Category Management</h4>
                         <div className="flex gap-2">
                            <input className="flex-1 bg-[#27272a] rounded-lg px-4 py-2 border border-white/10 text-sm outline-none focus:border-emerald-500" 
                               placeholder="New Category Name" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                            <button onClick={handleAddCategory} className="bg-emerald-600 px-4 rounded-lg hover:bg-emerald-500 transition"><PlusCircle size={20}/></button>
                         </div>
                         <div className="flex flex-wrap gap-2">
                            {categories.map((c, i) => (
                               <span key={i} className="bg-white/5 px-3 py-1 rounded-full text-xs text-gray-300 border border-white/10">{c}</span>
                            ))}
                         </div>
                      </div>
                   </div>
                </Card>

                <Card>
                   <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-red-400"/> Data & Privacy</h3>
                   <div className="flex flex-wrap gap-4">
                      <button onClick={handleExportCSV} className="flex items-center gap-2 bg-[#27272a] hover:bg-zinc-700 px-5 py-3 rounded-xl border border-white/10 transition">
                         <Download size={18}/> Export Data (CSV)
                      </button>
                      <button onClick={handleResetData} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-5 py-3 rounded-xl border border-red-500/30 transition">
                         <Trash2 size={18}/> Reset All Data
                      </button>
                   </div>
                </Card>
             </div>
          )}
        </main>
      </div>
    </div>
  );
}

// =========================================
// MAIN APP COMPONENT (HANDLES ROUTING)
// =========================================
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- PERSIST LOGIN STATE ---
  useEffect(() => {
    // Check if a token exists when the app loads
    const token = localStorage.getItem('token');
    if (token) {
        setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = () => {
      setIsLoggedIn(true);
  };

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      setIsLoggedIn(false);
  };

  return (
      <>
          {isLoggedIn ? (
              <DashboardComponent onLogout={handleLogout} />
          ) : (
              <LandingPage onLoginSuccess={handleLoginSuccess} />
          )}
      </>
  );
}