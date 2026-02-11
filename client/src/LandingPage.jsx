import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google'; // NEW IMPORT

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
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  // Animation
  const words = ["Master", "Manage", "Analyze", "Track", "Save"];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIndex((prev) => (prev + 1) % words.length), 2500);
    return () => clearInterval(interval);
  }, []);

  // --- HANDLERS ---

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await axios.post(`${API_BASE_URL}/api/auth/register`, {
            name: formData.name, email: formData.email, password: formData.password
        });
        alert("Registration Successful! Please Login.");
        setShowRegister(false); setShowLogin(true);
    } catch (err) {
        alert(err.response?.data?.error || "Registration Failed");
    } finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: formData.email, password: formData.password
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userName', res.data.user.name);
        onLoginSuccess();
    } catch (err) {
        alert(err.response?.data?.error || "Login Failed");
    } finally { setLoading(false); }
  };

  // --- GOOGLE HANDLER ---
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
        const res = await axios.post(`${API_BASE_URL}/api/auth/google`, {
            token: credentialResponse.credential
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userName', res.data.user.name);
        onLoginSuccess();
    } catch (err) {
        console.error(err);
        alert("Google Login Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden relative">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className={`absolute inset-0 bg-[#121212] transition-opacity duration-700 ${imgLoaded ? 'opacity-0' : 'opacity-100'}`} />
        <img src={backgroundImage} alt="Background" onLoad={() => setImgLoaded(true)} className={`w-full h-full object-cover scale-105 transition-opacity duration-1000 ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2"><img src={logo} alt="Xpense Logo" className="h-16 w-auto object-contain" /></div>
        <div className="hidden md:flex gap-8 text-gray-300 font-medium"><a href="#" className="hover:text-white">Features</a><a href="#" className="hover:text-white">Pricing</a><a href="#" className="hover:text-white">About</a></div>
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
            <button onClick={() => setShowLogin(true)} className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]">Login</button>
            <button onClick={() => setShowRegister(true)} className="px-8 py-3.5 rounded-xl bg-[#2e1065] hover:bg-[#3b0764] border border-purple-500/30 text-purple-300 hover:text-white font-bold text-lg transition-all">Register</button>
          </motion.div>
          
          {/* GOOGLE LOGIN BUTTON (Visible on Hero)
          <motion.div custom={3} variants={fadeUpVariants} initial="hidden" animate="visible" className="mt-6">
             <GoogleLogin 
                onSuccess={handleGoogleSuccess} 
                onError={() => console.log('Login Failed')} 
                theme="filled_black" 
                shape="pill"
             />
          </motion.div> */}

        </div>
      </main>

      {/* LOGIN MODAL */}
      <Modal isOpen={showLogin} onClose={() => setShowLogin(false)} title="Welcome Back">
        <form onSubmit={handleLogin} className="space-y-4">
          <InputField icon={<Mail size={20} />} type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <InputField icon={<Lock size={20} />} type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold text-lg transition flex items-center justify-center gap-2 group">
            {loading ? <Loader2 className="animate-spin"/> : <>Login <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></>}
          </button>
        </form>
        
        {/* GOOGLE BUTTON INSIDE MODAL */}
        <div className="mt-4 flex justify-center w-full">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => console.log('Login Failed')} theme="filled_black" shape="pill" width="100%" />
        </div>

        <p className="mt-6 text-center text-gray-400">Don't have an account? <span onClick={() => {setShowLogin(false); setShowRegister(true)}} className="text-emerald-400 font-bold cursor-pointer hover:underline">Register</span></p>
      </Modal>

      {/* REGISTER MODAL */}
      <Modal isOpen={showRegister} onClose={() => setShowRegister(false)} title="Create Account">
        <form onSubmit={handleRegister} className="space-y-4">
          <InputField icon={<User size={20} />} type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <InputField icon={<Mail size={20} />} type="email" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <InputField icon={<Lock size={20} />} type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-purple-700 hover:bg-purple-600 rounded-xl text-white font-bold text-lg transition flex items-center justify-center gap-2 group">
            {loading ? <Loader2 className="animate-spin"/> : <>Create Account <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/></>}
          </button>
        </form>

        {/* GOOGLE BUTTON INSIDE MODAL */}
        <div className="mt-4 flex justify-center w-full">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => console.log('Login Failed')} theme="filled_black" shape="pill" width="100%" />
        </div>

        <p className="mt-6 text-center text-gray-400">Already have an account? <span onClick={() => {setShowRegister(false); setShowLogin(true)}} className="text-emerald-400 font-bold cursor-pointer hover:underline">Login</span></p>
      </Modal>
    </div>
  );
};

export default LandingPage;