import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('INR'); // Default
  const [rates, setRates] = useState({ INR: 1, USD: 0.011, EUR: 0.010 }); // Fallback values
  const [loading, setLoading] = useState(true);

  // Fetch live rates when app starts
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Free API: Base currency is INR
        const res = await axios.get('https://api.exchangerate-api.com/v4/latest/INR');
        setRates(res.data.rates);
        setLoading(false);
      } catch (err) {
        console.error("Currency API Error:", err);
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  // Helper function to format money (e.g., 500 => "₹500" or "$5.50")
  const formatAmount = (amountInINR) => {
    const rate = rates[currency] || 1;
    const converted = amountInINR * rate;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, rates, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);