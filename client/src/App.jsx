import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, PlusCircle, BarChart3, FileText, Upload, Settings, 
  Bell, ChevronRight, Trash2, Loader2, Camera, Wallet 
} from 'lucide-react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown'; 

// --- CONFIGURATION ---
const API_BASE_URL = "https://probable-waddle-v9xw9q9gxvj24pg-5000.app.github.dev";

// --- REUSABLE COMPONENTS ---

// 1. Matte Card Component
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

// 2. Sidebar Component (Updated with Tabs)
const Sidebar = ({ activeTab, setActiveTab, onUploadClick }) => (
  <div className="w-64 bg-[#18181b] h-screen fixed left-0 top-0 flex flex-col p-6 border-r border-white/5 z-50 font-sans">
    {/* Logo */}
    <div className="flex items-center gap-3 mb-10 text-emerald-400">
      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
        <span className="font-bold text-lg">₹</span>
      </div>
      <h1 className="text-xl font-bold text-gray-200 tracking-wide">Xpense</h1>
    </div>

    {/* Navigation */}
    <nav className="flex-1 space-y-2">
      <NavItem 
        icon={<LayoutDashboard size={20} />} 
        label="Dashboard" 
        active={activeTab === 'dashboard'} 
        onClick={() => setActiveTab('dashboard')} 
      />
      <NavItem 
        icon={<BarChart3 size={20} />} 
        label="Analytics" 
        active={activeTab === 'analytics'} 
        onClick={() => setActiveTab('analytics')} 
      />
      <NavItem 
        icon={<FileText size={20} />} 
        label="AI Reports" 
        active={activeTab === 'reports'} 
        onClick={() => setActiveTab('reports')} 
      />
      
      {/* File Upload Trigger */}
      <div onClick={onUploadClick}>
        <NavItem icon={<Upload size={20} />} label="Upload Receipt" />
      </div>
      
      <NavItem icon={<Settings size={20} />} label="Settings" />
    </nav>

    {/* Profile Section */}
    <div className="mt-auto bg-[#27272a] rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-900/50 rounded-full flex items-center justify-center border border-emerald-500/30">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20" /> 
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white">Elite User</h4>
          <p className="text-xs text-gray-400">Pro Member</p>
        </div>
      </div>
      <button className="w-full bg-[#18181b] hover:bg-black text-gray-400 text-xs font-medium py-2 rounded-lg border border-white/5 transition-colors">
        Log Out
      </button>
    </div>
  </div>
);

const NavItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
    active 
      ? 'bg-[#27272a] text-emerald-400 border-l-4 border-emerald-400' 
      : 'text-gray-400 hover:bg-white/5 hover:text-white'
  }`}>
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </div>
);

// --- MAIN APPLICATION ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // New Tab State
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // New States for Features
  const [budget, setBudget] = useState(10000); // Default Budget
  const [categories, setCategories] = useState(['Food', 'Travel', 'Shopping', 'Bills', 'Rent', 'Medical']);
  const [aiReport, setAiReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [analyticsView, setAnalyticsView] = useState('monthly');

  const [formData, setFormData] = useState({ title: '', amount: '', category: 'Food' });
  const fileInputRef = useRef(null); 

  // 1. Fetch Data on Load (Expenses + Settings)
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, setRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/expenses`),
        axios.get(`${API_BASE_URL}/api/settings`)
      ]);
      setExpenses(expRes.data);
      if (setRes.data) {
        setBudget(setRes.data.budget);
        setCategories(setRes.data.categories);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // 2. Logic Functions
  const handleManualSubmit = async () => {
    if (!formData.title || !formData.amount) return alert("Please enter title and amount");
    
    // Custom Category Logic
    let finalCategory = formData.category;
    if (formData.category === 'custom') {
      const custom = prompt("Enter new category name:");
      if (!custom) return;
      finalCategory = custom;
      // Save new category to backend
      await axios.post(`${API_BASE_URL}/api/settings/categories`, { category: custom });
      setCategories(prev => [...prev, custom]);
    }

    const payload = {
      title: formData.title,
      amount: Number(formData.amount),
      category: finalCategory,
      date: new Date().toISOString(),
      isAIProcessed: false
    };

    try {
      await axios.post(`${API_BASE_URL}/api/expenses`, payload);
      setFormData({ title: '', amount: '', category: 'Food' });
      fetchData();
    } catch (err) {
      alert("Failed to add expense.");
    }
  };

  const handleUpdateBudget = async () => {
    const newBudget = prompt("Set your Monthly Budget (₹):", budget);
    if (newBudget && !isNaN(newBudget)) {
      setBudget(Number(newBudget));
      await axios.post(`${API_BASE_URL}/api/settings/budget`, { budget: Number(newBudget) });
    }
  };

  const generateAIReport = async () => {
    setReportLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/analyze-spending`);
      setAiReport(res.data.report);
    } catch (err) { alert("AI Service Error"); }
    finally { setReportLoading(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return alert("File too large (Max 1MB)");

    setLoading(true);
    const data = new FormData();
    data.append('receipt', file);

    try {
      await axios.post(`${API_BASE_URL}/api/scan`, data);
      alert("Receipt Scanned Successfully!");
      fetchData();
    } catch (err) {
      alert("Scan Failed. Check server logs.");
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const deleteExpense = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/expenses/${id}`);
      fetchData();
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  // 3. Dynamic Data Calculations
  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlySpent = expenses
    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  // Prepare Graph Data
  const chartData = useMemo(() => {
    // Analytics View Logic
    const dataMap = {};
    expenses.forEach(exp => {
       const date = new Date(exp.date);
       // If Monthly view: Group by Day. If Yearly view: Group by Month.
       let key = analyticsView === 'monthly' ? date.getDate() : date.toLocaleDateString('en-US', { month: 'short' });
       
       if (!dataMap[key]) dataMap[key] = { name: key, expense: 0, income: budget / 2 }; // Mock income line relative to budget
       dataMap[key].expense += exp.amount;
    });

    let result = Object.values(dataMap);
    // Sort days correctly
    if (analyticsView === 'monthly') result.sort((a, b) => a.name - b.name);
    
    return result.length > 0 ? result : [
      { name: 'Jan', income: budget, expense: 0 },
    ];
  }, [expenses, budget, analyticsView]);

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans">
      {/* SIDEBAR WITH TABS */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onUploadClick={() => fileInputRef.current.click()} 
      />

      {/* MAIN CONTENT AREA */}
      <div className="pl-64"> 
        
        {/* Header */}
        <header className="flex justify-between items-center p-6 gap-4">
          <h2 className="text-2xl font-bold capitalize text-gray-200">{activeTab}</h2>
          
          <div className="flex items-center gap-4">
            <button className="p-3 bg-[#1c1c1e] rounded-xl border border-white/5 text-gray-400 hover:text-white">
              <Bell size={20} />
            </button>
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              onChange={handleFileUpload} 
              accept="image/*,application/pdf"
              disabled={loading} 
            />
            
            <button 
              onClick={() => fileInputRef.current.click()}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-white/5 transition-all ${loading ? 'bg-emerald-600' : 'bg-[#1c1c1e] hover:bg-zinc-800'}`}
            >
              {loading ? <Loader2 className="animate-spin" size={20}/> : <Camera size={20}/>}
              <span className="text-sm font-medium">{loading ? "Scanning..." : "Quick Scan"}</span>
            </button>
          </div>
        </header>

        <main className="p-8 pt-0 grid grid-cols-12 gap-6">
          
          {/* ======================= */}
          {/* DASHBOARD VIEW       */}
          {/* ======================= */}
          {activeTab === 'dashboard' && (
            <>
              {/* TOP STATS */}
              <Card className="col-span-4 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">Monthly Budget</h3>
                    <div className="flex items-end gap-2">
                       <h2 className="text-3xl font-bold text-white cursor-pointer hover:text-emerald-400" onClick={handleUpdateBudget}>
                         ₹{budget.toLocaleString()}
                       </h2>
                       <Edit2 size={16} className="text-gray-500 mb-1.5"/>
                    </div>
                    
                    <div className="w-32 h-1.5 bg-gray-700 rounded-full mt-2 overflow-hidden">
                      <div className={`h-full rounded-full ${totalSpent > budget ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((totalSpent / budget) * 100, 100)}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Remaining: ₹{Math.max(budget - totalSpent, 0).toLocaleString()}</p>
                  </div>
                </div>
              </Card>

              <Card className="col-span-4">
                <h3 className="text-gray-400 text-sm font-medium">Total Spent</h3>
                <h2 className={`text-3xl font-bold mt-2 ${totalSpent > budget ? 'text-red-500' : 'text-white'}`}>₹{totalSpent.toLocaleString()}</h2>
                {totalSpent > budget && <span className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">Over Budget</span>}
              </Card>

              <Card className="col-span-4">
                <h3 className="text-gray-400 text-sm font-medium">Items Tracked</h3>
                <h2 className="text-3xl font-bold text-white mt-2">{expenses.length}</h2>
              </Card>

              {/* GRAPH & QUICK ADD */}
              <Card className="col-span-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Expenses Overview</h3>
                  
                  {/* Quick Add Form */}
                  <div className="flex gap-2">
                    <input 
                      className="bg-zinc-800 border-none rounded-lg px-3 py-1 text-sm outline-none w-32 text-white placeholder-gray-500" 
                      placeholder="Title" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                    />
                    <input 
                      className="bg-zinc-800 border-none rounded-lg px-3 py-1 text-sm outline-none w-20 text-white placeholder-gray-500" 
                      placeholder="₹" 
                      type="number" 
                      value={formData.amount} 
                      onChange={e => setFormData({...formData, amount: e.target.value})} 
                    />
                    <select 
                      className="bg-zinc-800 border-none rounded-lg px-3 py-1 text-sm outline-none text-white cursor-pointer" 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="custom" className="text-emerald-400 font-bold">+ Add New</option>
                    </select>

                    <button onClick={handleManualSubmit} className="bg-emerald-600 px-3 rounded-lg hover:bg-emerald-500 transition">
                      <PlusCircle size={18} color="white" />
                    </button>
                  </div>
                </div>
                
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                      <Tooltip contentStyle={{ backgroundColor: '#1c1c1e', border: '1px solid #333' }} itemStyle={{ color: '#fff' }} />
                      <Bar dataKey="expense" barSize={20} fillOpacity={0.6}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#52525b' : '#3f3f46'} />
                        ))}
                      </Bar>
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* ANALYTICS PREVIEW */}
              <div className="col-span-4 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <p className="text-xs text-gray-400">Daily Average</p>
                      <h2 className="text-2xl font-bold mt-1">₹{(monthlySpent / 30).toFixed(0)}</h2>
                    </Card>
                    <Card className="p-4 relative">
                      <p className="text-xs text-gray-400">Top Category:</p>
                      <h2 className="text-md font-bold mt-1 text-white">Food</h2>
                      <ChevronRight size={16} className="absolute right-3 top-4 text-gray-600" />
                    </Card>
                    <Card className="p-4 col-span-2 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-2">
                          <h2 className="text-xl font-bold text-white">₹1,200</h2>
                          <span className="text-xs text-gray-500">Highest Spent &gt;</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2">
                          <div className="w-[80%] h-full bg-[#5a6b4c] rounded-full"></div>
                      </div>
                    </Card>
                </div>
              </div>

              {/* TRANSACTIONS */}
              <Card className="col-span-8">
                <h3 className="text-lg font-semibold mb-4">Transactions</h3>
                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-white/5">
                        <th className="py-2 font-medium">Name</th>
                        <th className="py-2 font-medium">Date</th>
                        <th className="py-2 font-medium">Amount</th>
                        <th className="py-2 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {expenses.map((t) => (
                          <motion.tr 
                            key={t._id} 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="border-b border-white/5 text-sm group hover:bg-white/5 transition-colors"
                          >
                            <td className="py-4 font-medium">{t.title}</td>
                            <td className="py-4 text-gray-400">{new Date(t.date).toLocaleDateString()}</td>
                            <td className="py-4 font-bold text-emerald-400">₹{t.amount.toFixed(2)}</td>
                            <td className="py-4 text-right flex justify-end gap-2">
                              <button onClick={() => deleteExpense(t._id)} className="p-1.5 rounded bg-[#27272a] text-gray-400 hover:text-red-400 transition">
                                <Trash2 size={14}/>
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* BUDGET STACK */}
              <div className="col-span-4 flex flex-col gap-6">
                <Card>
                    <h3 className="text-sm font-semibold mb-4">Budget Utilization</h3>
                    <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min((monthlySpent / budget) * 100, 100)}%` }}
                        className={`h-full ${totalSpent > budget ? 'bg-red-500' : 'bg-[#5a6b4c]'}`} 
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      <span className="text-white font-bold">{Math.min((monthlySpent / budget) * 100, 100).toFixed(0)}%</span> of ₹{budget.toLocaleString()} Budget Used
                    </p>
                </Card>

                <button 
                    onClick={() => fileInputRef.current.click()}
                    className="w-full py-4 bg-[#27272a] hover:bg-[#3f3f46] rounded-2xl border border-white/10 shadow-lg flex items-center justify-center gap-3 transition-all group"
                >
                    <Upload size={20} className="text-gray-400 group-hover:text-white" />
                    <span className="font-semibold text-gray-200">Upload Receipt</span>
                    <ChevronRight size={16} className="text-gray-500 absolute right-8" />
                </button>
              </div>
            </>
          )}

          {/* ======================= */}
          {/* ANALYTICS VIEW       */}
          {/* ======================= */}
          {activeTab === 'analytics' && (
             <div className="col-span-12 space-y-6">
               <div className="flex justify-end mb-4">
                  <select 
                    className="bg-[#1c1c1e] text-white p-2 px-4 rounded-lg border border-white/10 outline-none cursor-pointer hover:bg-zinc-800"
                    value={analyticsView} 
                    onChange={e => setAnalyticsView(e.target.value)}
                  >
                    <option value="monthly">Last 30 Days (Daily View)</option>
                    <option value="yearly">This Year (Monthly View)</option>
                  </select>
               </div>

               <Card className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false}/>
                        <XAxis dataKey="name" tick={{fill: '#888'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fill: '#888'}} axisLine={false} tickLine={false} tickFormatter={val => `₹${val}`} />
                        <Tooltip cursor={{fill: '#2a2a2a'}} contentStyle={{backgroundColor: '#121212', border: '1px solid #333'}} />
                        <Legend />
                        <Bar name="Expense" dataKey="expense" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                     </ComposedChart>
                  </ResponsiveContainer>
               </Card>
             </div>
          )}

          {/* ======================= */}
          {/* AI REPORTS VIEW      */}
          {/* ======================= */}
          {activeTab === 'reports' && (
             <div className="col-span-12">
                <Card className="min-h-[500px]">
                   <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-6">
                      <div>
                         <h3 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                            ✨ AI Financial Advisor
                         </h3>
                         <p className="text-gray-400 text-sm mt-1">Powered by Google Gemini</p>
                      </div>
                      <button 
                         onClick={generateAIReport} 
                         disabled={reportLoading} 
                         className="bg-emerald-600 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                         {reportLoading ? <Loader2 className="animate-spin" /> : <FileText size={18}/>}
                         {reportLoading ? "Analyzing Finances..." : "Generate New Report"}
                      </button>
                   </div>
                   
                   {aiReport ? (
                     <div className="prose prose-invert max-w-none text-gray-300">
                        <ReactMarkdown>{aiReport}</ReactMarkdown>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
                        <div className="bg-zinc-800 p-6 rounded-full mb-4">
                           <FileText size={48} className="text-emerald-500" />
                        </div>
                        <p className="text-lg font-medium text-gray-300">No report generated yet.</p>
                        <p className="text-sm opacity-50 max-w-md text-center mt-2">
                           Click the button above to let AI analyze your spending patterns, categories, and budget health.
                        </p>
                     </div>
                   )}
                </Card>
             </div>
          )}

        </main>
      </div>
    </div>
  );
}

// Icon component needed for edit button near budget
const Edit2 = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);