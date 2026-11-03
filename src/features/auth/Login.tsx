import React, { useState } from 'react';
import { useStore } from '@/core/store';
import { authService } from '@/core/services/authService';
import { LogIn, KeyRound, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {

// ==========================================
// FITUR: AUTH
// Komponen utama untuk fitur AUTH
// ==========================================

  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Email dan password harus diisi');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      login(response.token, response.user);
    } catch (err: any) {
      setError(err?.message || 'Gagal masuk. Periksa email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-red-100/50 blur-3xl opacity-60 mix-blend-multiply"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-rose-100/40 blur-3xl opacity-60 mix-blend-multiply"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-red-950/5 border border-gray-100 overflow-hidden">
          
          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 ring-4 ring-white shadow-sm border border-red-100">
                <LogIn className="w-8 h-8 text-[#740A03]" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Selamat Datang</h1>
              <p className="text-sm font-medium text-gray-500 mt-2">
                Sistem Manajemen DNA Tour & Travel
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-200 flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <p>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email Anda"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-[#740A03] focus:bg-white transition-all outline-none font-semibold placeholder:font-medium placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Password
                  </label>
                  <a href="#" className="text-xs font-bold text-[#740A03] hover:text-[#580802] transition-colors">
                    Lupa password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password Anda"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-red-900/20 focus:border-[#740A03] focus:bg-white transition-all outline-none font-semibold placeholder:font-medium placeholder:text-gray-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-4 bg-[#740A03] hover:bg-[#580802] text-white font-bold rounded-xl shadow-md shadow-red-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    Masuk ke Sistem
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 text-center">
            <p className="text-xs font-medium text-gray-500">
              Butuh bantuan? <a href="#" className="font-bold text-[#740A03] hover:text-[#580802]">Hubungi Administrator</a>
            </p>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="text-center mt-8">
          <p className="text-xs font-medium text-gray-400">
            &copy; 2026 DNA Tour & Travel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
