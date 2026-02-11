import dotenv from 'dotenv';
dotenv.config(); 
import { OAuth2Client } from 'google-auth-library';
import express from 'express';
import axios from 'axios'; // NEW: To talk to Python
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import Groq from "groq-sdk"; 
import bcrypt from 'bcryptjs';      // SECURITY: Encrypts passwords
import jwt from 'jsonwebtoken';     // SECURITY: Creates login tokens
import { analyzeReceipt } from './services/aiService.js'; 

const app = express();

// --- MIDDLEWARE ---
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow tokens
}));
app.use(express.json());

// --- CONFIG ---
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

// --- DATABASE ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.log("❌ DB Error:", err));

// --- MODELS ---

// 1. User Model (New)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// 2. Settings Model (Linked to User)
const SettingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  monthlyBudget: { type: Number, default: 10000 },
  dailyBudget: { type: Number, default: 500 },
  categories: { type: [String], default: ['Food', 'Travel', 'Shopping', 'Bills', 'Rent', 'Medical', 'Utilities'] }
});
const Settings = mongoose.model('Settings', SettingsSchema);

// 3. Expense Model (Linked to User)
const ExpenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  amount: Number,
  category: String,
  date: { type: Date, default: Date.now },
  paymentMode: { type: String, default: 'Cash' },
  description: { type: String, default: '' },
  isAIProcessed: { type: Boolean, default: false }
});
const Expense = mongoose.model('Expense', ExpenseSchema);

// --- AUTH MIDDLEWARE (The Guard) ---
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: "Access Denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Attaches the User ID to the request
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid Token" });
  }
};

// --- ROUTES ---

// 1. AUTHENTICATION (Register/Login)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already exists" });

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    const savedUser = await newUser.save();

    // Create default settings for new user
    await new Settings({ user: savedUser._id }).save();

    res.status(201).json({ message: "User registered!" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: "Invalid password" });

    // Create Token
    const token = jwt.sign({ _id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
// GOOGLE LOGIN ROUTE
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // 1. Verify the "Golden Ticket" with Google
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    const { name, email, picture } = ticket.getPayload();

    // 2. Check if user exists in our DB
    let user = await User.findOne({ email });

    if (!user) {
        // 3. If new user, create them (random password since they use Google)
        const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        user = new User({ name, email, password: hashedPassword });
        await user.save();

        // Create settings for new user
        await new Settings({ user: user._id }).save();
    }

    // 4. Generate OUR App Token
    const appToken = jwt.sign({ _id: user._id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token: appToken, user: { name: user.name, email: user.email } });

  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(400).json({ error: "Google Login Failed" });
  }
});

// 2. SETTINGS ROUTES (Protected)
app.get('/api/settings', auth, async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.user._id });
    if (!settings) {
      settings = new Settings({ user: req.user._id });
      await settings.save();
    }
    res.json(settings);
  } catch (error) { res.status(500).json({ error: "Settings Error" }); }
});

app.post('/api/settings/budget', auth, async (req, res) => {
  try {
    const { monthlyBudget, dailyBudget } = req.body;
    const update = {};
    if (monthlyBudget !== undefined) update.monthlyBudget = Number(monthlyBudget);
    if (dailyBudget !== undefined) update.dailyBudget = Number(dailyBudget);
    
    await Settings.findOneAndUpdate({ user: req.user._id }, update, { upsert: true });
    res.json({ message: "Budgets updated" });
  } catch (error) { res.status(500).json({ error: "Update Failed" }); }
});

app.post('/api/settings/categories', auth, async (req, res) => {
  try {
    await Settings.findOneAndUpdate({ user: req.user._id }, { $addToSet: { categories: req.body.category } });
    res.json({ message: "Category added" });
  } catch (error) { res.status(500).json({ error: "Category Error" }); }
});

// 3. EXPENSE ROUTES (Protected)
app.get('/api/expenses', auth, async (req, res) => {
  try {
    // Only get expenses for THIS user
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) { res.status(500).json({ error: "Fetch Error" }); }
});

app.post('/api/expenses', auth, async (req, res) => {
  try {
    const { title, amount, category, date, paymentMode, description } = req.body;
    const newExpense = new Expense({
      user: req.user._id, // Attach User ID
      title, 
      amount: Number(amount), 
      category: category || 'Other',
      date: date || new Date(), 
      paymentMode: paymentMode || 'Cash', 
      description: description || '',
      isAIProcessed: false 
    });
    const saved = await newExpense.save();
    res.status(201).json(saved);
  } catch (error) { res.status(500).json({ error: "Save Failed" }); }
});

app.delete('/api/expenses/:id', auth, async (req, res) => {
  try {
    // Only delete if it belongs to THIS user
    await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Deleted" });
  } catch (error) { res.status(500).json({ error: "Delete Failed" }); }
});

app.delete('/api/expenses/all', auth, async (req, res) => {
  try {
    await Expense.deleteMany({ user: req.user._id });
    res.json({ message: "All data reset" });
  } catch (error) { res.status(500).json({ error: "Reset Failed" }); }
});

app.post('/api/scan', auth, upload.single('receipt'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const extractedData = await analyzeReceipt(req.file.buffer, req.file.mimetype);
    
    const newExpense = new Expense({
      user: req.user._id,
      title: extractedData.merchant, 
      amount: extractedData.amount,
      category: extractedData.category, 
      date: new Date(), 
      paymentMode: 'Cash', 
      description: 'Scanned Receipt',
      isAIProcessed: true
    });
    
    await newExpense.save();
    res.json(newExpense);
  } catch (error) { res.status(500).json({ error: error.message }); }
});
// 5. PREDICTION ROUTE (Talks to Python)

app.get('/api/predict', auth, async (req, res) => {
  try {
    // 1. We ask the Python Service for the forecast
    // Note: We send the User ID so Python knows whose data to fetch
    const pythonResponse = await axios.get(`http://127.0.0.1:5001/predict/${req.user._id}`);
    
    // 2. We send the Python answer back to our Frontend
    res.json(pythonResponse.data);
  } catch (error) {
    console.error("Prediction Error:", error.message);
    if (error.response && error.response.status === 400) {
        return res.status(400).json({ error: "Not enough data. Add expenses for at least 5 different days." });
    }
    res.status(500).json({ error: "Prediction Service is unavailable." });
  }
});

// 4. SMART AI REPORT ROUTE (Now with Future Prediction!)
app.post('/api/analyze-spending', auth, async (req, res) => {
  try {
    // 1. Get Past Data (MongoDB)
    const expenses = await Expense.find({ user: req.user._id });
    const settings = await Settings.findOne({ user: req.user._id });
    const mBudget = settings ? settings.monthlyBudget : 10000;
    
    // Calculate totals
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Create a text summary of last 30 transactions for the AI
    const summary = expenses.slice(0, 30).map(e => `- ${e.title}: ₹${e.amount} (${e.category})`).join('\n');

    // 2. Get Future Data (Ask Python Service)
    let predictionText = "Prediction data unavailable (not enough history).";
    let predictedAmount = 0;
    
    try {
        // We ask Python: "What is the forecast for this user?"
        // Note: We use 127.0.0.1 to talk to the local Python server
        const predResponse = await axios.get(`http://127.0.0.1:5001/predict/${req.user._id}`);
        const forecast = predResponse.data;
        predictedAmount = forecast.total_predicted_spend;
        
        predictionText = `
        - Predicted Total Spend Next 30 Days: ₹${predictedAmount}
        - Trend Analysis: The model predicts spending will ${predictedAmount > totalSpent ? 'INCREASE' : 'DECREASE'} compared to previous history.
        `;
    } catch (err) {
        console.log("AI could not fetch prediction (User might need more data).");
    }

    // 3. The Super-Prompt (Feeding Past + Future to Llama 3)
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const prompt = `
    Act as a ruthlessly efficient Indian financial advisor (CA style).
    
    **FINANCIAL CONTEXT:**
    - Monthly Budget: ₹${mBudget}
    - Total Past Spending: ₹${totalSpent}
    - **AI FORECAST (Next 30 Days):** ₹${predictedAmount}
    
    **DETAILS:**
    ${predictionText}
    
    **RECENT TRANSACTIONS:**
    ${summary}

    **YOUR TASK:**
    Analyze the gap between the budget and the PREDICTED future spending.
    
    **OUTPUT FORMAT (Markdown):**
    1. **🚨 Risk Status:** (Safe / Warning / Critical) - Use an emoji.
       - *Logic: If Forecast > Budget, set status to Critical.*
    2. **🔮 Future Outlook:** Explain the prediction. "Based on your habits, you are on track to spend ₹${predictedAmount}..."
    3. **💡 Action Plan:** 3 specific ways to cut costs based on their actual categories (e.g., "Cut down on Swiggy").
    4. **🔥 The Roast:** One short, funny, slightly mean sentence about their spending habits.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    res.json({ report: chatCompletion.choices[0]?.message?.content });

  } catch (error) { 
    console.error("AI Error:", error);
    res.status(500).json({ error: "AI Failed to generate report" }); 
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));