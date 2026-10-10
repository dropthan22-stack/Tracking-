import React, { useState } from 'react';
import { BrandProfile } from '../types';
import { Phone, Lock, ArrowRight, Building2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SignInPanelProps {
  onSuccess: (profile: BrandProfile, isNewRegistration?: boolean) => void;
  onRegister: (companyName: string, phone: string) => { success: boolean; profile?: BrandProfile; error?: string };
  onLogin: (phone: string, pass: string) => { success: boolean; profile?: BrandProfile; error?: string };
}

export const SignInPanel: React.FC<SignInPanelProps> = ({
  onSuccess,
  onRegister,
  onLogin
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isRegisterMode) {
      if (!companyName.trim()) {
        setErrorMsg('Please enter your Company Name.');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg('Please enter your Phone Number.');
        return;
      }
      if (!password.trim()) {
        setErrorMsg('Please enter your Password.');
        return;
      }
      const res = onRegister(companyName, phone);
      if (res.success && res.profile) {
        setSuccessMsg(`Company "${res.profile.brand_name}" created! Initializing secure API Key...`);
        setTimeout(() => onSuccess(res.profile!, true), 350);
      } else {
        setErrorMsg(res.error || 'Failed to register company.');
      }
    } else {
      if (!phone.trim()) {
        setErrorMsg('Please enter your Phone Number.');
        return;
      }
      if (!password.trim()) {
        setErrorMsg('Please enter your Password.');
        return;
      }
      const res = onLogin(phone, password);
      if (res.success && res.profile) {
        setSuccessMsg(`Welcome back to ${res.profile.brand_name}!`);
        setTimeout(() => onSuccess(res.profile!, false), 250);
      } else {
        setErrorMsg(res.error || 'Invalid credentials.');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-10 px-4">
      {/* Top Banner Kicker */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
          <span>Multi-Tenant Supabase RLS Protected</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
          LeadLens Admin
        </h1>
        <p className="text-neutral-500 text-xs sm:text-sm mt-1">
          Monitor real-time visitor activity &amp; abandoned carts.
        </p>
      </div>

      {/* Main Sign In Box (Pure White & Orange Minimalist Card) */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xl shadow-neutral-100">
        
        {/* Toggle Sign In / Register */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-neutral-100">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              {isRegisterMode ? 'Register Company' : 'Welcome Back to LeadLens'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {isRegisterMode ? 'Creates unique company ID and secure API key' : 'Phone Number & Password Only'}
            </p>
          </div>

          <div className="flex rounded-xl bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMsg('');
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                !isRegisterMode ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMsg('');
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                isRegisterMode ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Company Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your company name..."
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number..."
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 font-mono placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password..."
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 group active:scale-[0.99]"
          >
            <span>{isRegisterMode ? 'Register Company & Generate API Key' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

      </div>
    </div>
  );
};
