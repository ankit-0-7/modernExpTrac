import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle, Code, DollarSign, Star } from 'lucide-react'; // Added icons
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';

// --- IMPORT PATHS ---
import backgroundImage from "./Untitled design.png"; 
import logo from "./ExpenseLogo.png"; 

const API_BASE_URL = "https://probable-waddle-v9xw9q9gxvj24pg-5000.app.github.dev";

// --- ANIMATION VARIANTS ---
const fadeUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay) => ({
    opacity: 1, y: 0, transition: { duration: 0.6, delay: delay * 0.2, ease: 'easeOut' },
  }),
};

// --- REUSABLE COMPONENTS ---
const InputField = ({ icon, type, placeholder, value, onChange }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{icon}</div>
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      className="w-full pl-10 pr-4 py-3 bg-[#27272a] border border-white/10 rounded-xl text-gray-200 placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
    />
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-[#18181b] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition"><X size={24} /></button>
            <div className="p-8"><h2 className="text-2xl font-bold text-white mb-6 text-center">{title}</h2>{children}</div>
          </motion.div>
        </div>
      </>
    )}
  </AnimatePresence>
);

const LandingPage = ({ onLoginSuccess }) => {
  // Login/Register States
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  
  // NEW: Info Modal States
  const [showFeatures, setShowFeatures] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const [imgLoaded, setImgLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); 
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // Animation Text
  const words = ["Master", "Manage", "Analyze", "Track", "Save"];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIndex((prev) => (prev + 1) % words.length), 2500);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
      setError(""); 
      setFormData({ ...formData, [e.target.type === 'text' ? 'name' : e.target.type]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); 
    try {
        await axios.post(`${API_BASE_URL}/api/auth/register`, {
            name: formData.name, email: formData.email, password: formData.password
        });
        alert("Registration Successful! Please Login."); 
        setShowRegister(false); setShowLogin(true);
    } catch (err) {
        setError(err.response?.data?.error || "Registration Failed. Try again.");
    } finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); 
    try {
        const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: formData.email, password: formData.password
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userName', res.data.user.name);
        onLoginSuccess();
    } catch (err) {
        setError(err.response?.data?.error || "Login Failed. Please check your details.");
    } finally { setLoading(false); }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
        const res = await axios.post(`${API_BASE_URL}/api/auth/google`, {
            token: credentialResponse.credential
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userName', res.data.user.name);
        onLoginSuccess();
    } catch (err) {
        console.error(err);
        setError("Google Login Failed. Please try again.");
    } finally { setLoading(false); }
  };

  const switchMode = (mode) => {
      setError("");
      setFormData({ name: '', email: '', password: '' });
      if(mode === 'login') { setShowRegister(false); setShowLogin(true); }
      else { setShowLogin(false); setShowRegister(true); }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden relative">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className={`absolute inset-0 bg-[#121212] transition-opacity duration-700 ${imgLoaded ? 'opacity-0' : 'opacity-100'}`} />
        <img src={backgroundImage} alt="Background" onLoad={() => setImgLoaded(true)} className={`w-full h-full object-cover scale-105 transition-opacity duration-1000 ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* NAVBAR */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2"><img src={logo} alt="Xpense Logo" className="h-16 w-auto object-contain" /></div>
        <div className="hidden md:flex gap-8 text-gray-300 font-medium">
            {/* UPDATED LINKS TO BUTTONS */}
            <button onClick={() => setShowFeatures(true)} className="hover:text-emerald-400 transition-colors">Features</button>
            <button onClick={() => setShowPricing(true)} className="hover:text-emerald-400 transition-colors">Pricing</button>
            <button onClick={() => setShowAbout(true)} className="hover:text-emerald-400 transition-colors">About</button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 flex flex-col items-center justify-center min-h-[69vh] relative z-10 text-center">
        <div className="mt-10 lg:mt-0 flex flex-col items-center">
          <motion.div custom={0} variants={fadeUpVariants} initial="hidden" animate="visible" className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight flex flex-col items-center gap-2 drop-shadow-2xl">
            <div className="flex flex-wrap justify-center gap-3 lg:gap-4">
              <div className="relative h-[1.1em] w-[4.5em] lg:w-[5em] text-right">
                <AnimatePresence mode="wait"><motion.span key={words[index]} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="absolute right-0 bg-gradient-to-r from-emerald-400 to-purple-500 bg-clip-text text-transparent">{words[index]}</motion.span></AnimatePresence>
              </div>
              <span className="text-white">Your Finances,</span>
            </div>
            <span className="bg-gradient-to-r from-emerald-400 to-purple-500 bg-clip-text text-transparent">Effortlessly</span>
          </motion.div>
          
          <motion.p custom={1} variants={fadeUpVariants} initial="hidden" animate="visible" className="text-gray-200 text-lg lg:text-xl mt-8 max-w-2xl mx-auto font-medium drop-shadow-md">Track expenses, manage budgets, and get AI-powered insights.</motion.p>

          <motion.div custom={2} variants={fadeUpVariants} initial="hidden" animate="visible" className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={() => switchMode('login')} className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]">Login</button>
            <button onClick={() => switchMode('register')} className="px-8 py-3.5 rounded-xl bg-[#2e1065] hover:bg-[#3b0764] border border-purple-500/30 text-purple-300 hover:text-white font-bold text-lg transition-all">Register</button>
          </motion.div>
        </div>
      </main>

      {/* --- NEW MODALS --- */}

      {/* FEATURES MODAL */}
      <Modal isOpen={showFeatures} onClose={() => setShowFeatures(false)} title="🔥 Key Features">
        <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-400"><Star size={20}/></div>
                <div><h4 className="font-bold text-white">AI Prediction Engine</h4><p className="text-sm text-gray-400">Uses Facebook Prophet model to forecast your next month's spending.</p></div>
            </div>
            <div className="flex items-start gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><Code size={20}/></div>
                <div><h4 className="font-bold text-white">GenAI Risk Analyst</h4><p className="text-sm text-gray-400">Llama-3 powered advisor that analyzes your habits and warns you of risks.</p></div>
            </div>
            <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><CheckCircle size={20}/></div>
                <div><h4 className="font-bold text-white">Smart Expense Tracking</h4><p className="text-sm text-gray-400">Categorize, track, and visualize your daily expenses with ease.</p></div>
            </div>
        </div>
      </Modal>

      {/* PRICING MODAL */}
      <Modal isOpen={showPricing} onClose={() => setShowPricing(false)} title="💰 Pricing Plans">
        <div className="text-center space-y-4">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/50 p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-emerald-400">Student Plan</h3>
                <div className="text-4xl font-extrabold text-white my-2">Free<span className="text-sm font-normal text-gray-400"> </span></div>
                <p className="text-gray-300 text-sm">Access to all AI features, Prediction Engine, and Unlimited tracking.</p>
                <div className="mt-4 text-xs text-emerald-200 bg-emerald-500/20 py-1 px-3 rounded-full inline-block">
                    Current Status: Active
                </div>
            </div>
        </div>
      </Modal>

      {/* ABOUT MODAL */}
      <Modal isOpen={showAbout} onClose={() => setShowAbout(false)} title="👨‍💻 About Developer">
        <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-emerald-500 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                AS
            </div>
            <div>
                <h3 className="text-2xl font-bold text-white">Ankit Sharma</h3>
                <p className="text-emerald-400 font-medium">Full Stack Developer & AI Enthusiast</p>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
                This project was built to solve the problem of unpredictable spending. By combining MERN stack with Python (Prophet) and GenAI, it helps users see the future of their finances.
            </p>
            
            <div className="border-t border-white/10 pt-4">
                <p className="text-gray-400 text-sm mb-2">For any help or collaboration:</p>
                <a href="mailto:ankit.personal11@gmail.com" className="flex items-center justify-center gap-2 text-white bg-white/10 hover:bg-white/20 py-2 rounded-lg transition-colors">
                    <Mail size={18} /> ankit.personal11@gmail.com
                </a>
            </div>
        </div>
      </Modal>

      {/* LOGIN MODAL */}
      <Modal isOpen={showLogin} onClose={() => setShowLogin(false)} title="Welcome Back">
        <AnimatePresence>
            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 flex items-center gap-2 text-red-200 text-sm">
                    <AlertCircle size={16} className="text-red-500" />{error}
                </motion.div>
            )}
        </AnimatePresence>
        <form onSubmit={handleLogin} className="space-y-4">
          <InputField icon={<Mail size={20} />} type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
          <InputField icon={<Lock size={20} />} type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold text-lg transition flex items-center justify-center gap-2 group">
            {loading ? <Loader2 className="animate-spin"/> : <>Login <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></>}
          </button>
        </form>
        <div className="flex items-center my-4"><div className="flex-grow h-px bg-white/10"></div><span className="px-3 text-sm text-gray-500">OR</span><div className="flex-grow h-px bg-white/10"></div></div>
        <div className="flex justify-center w-full"><GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google Login Failed")} theme="filled_black" shape="pill" width="300" /></div>
        <p className="mt-6 text-center text-gray-400">Don't have an account? <span onClick={() => switchMode('register')} className="text-emerald-400 font-bold cursor-pointer hover:underline">Register</span></p>
      </Modal>

      {/* REGISTER MODAL */}
      <Modal isOpen={showRegister} onClose={() => setShowRegister(false)} title="Create Account">
        <AnimatePresence>
            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 flex items-center gap-2 text-red-200 text-sm">
                    <AlertCircle size={16} className="text-red-500" />{error}
                </motion.div>
            )}
        </AnimatePresence>
        <form onSubmit={handleRegister} className="space-y-4">
          <InputField icon={<User size={20} />} type="text" placeholder="Full Name" value={formData.name} onChange={handleChange} />
          <InputField icon={<Mail size={20} />} type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} />
          <InputField icon={<Lock size={20} />} type="password" placeholder="Password" value={formData.password} onChange={handleChange} />
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-purple-700 hover:bg-purple-600 rounded-xl text-white font-bold text-lg transition flex items-center justify-center gap-2 group">
            {loading ? <Loader2 className="animate-spin"/> : <>Create Account <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></>}
          </button>
        </form>
        <div className="flex items-center my-4"><div className="flex-grow h-px bg-white/10"></div><span className="px-3 text-sm text-gray-500">OR</span><div className="flex-grow h-px bg-white/10"></div></div>
        <div className="flex justify-center w-full"><GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google Login Failed")} theme="filled_black" shape="pill" width="300" /></div>
        <p className="mt-6 text-center text-gray-400">Already have an account? <span onClick={() => switchMode('login')} className="text-emerald-400 font-bold cursor-pointer hover:underline">Login</span></p>
      </Modal>
    </div>
  );
};

export default LandingPage;