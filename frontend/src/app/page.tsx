'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, User, Lock, Building2, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import API from '../lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    router.push('/dashboard/queue');
  }
}, [router]);


  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isRegister, setIsRegister] = useState(false); // NEW toggle

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const res = await API.post(endpoint, { username, password });
      localStorage.setItem('token', res.data.access_token);
      router.push('/dashboard/queue');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-slate-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      {/* Geometric BG */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-96 h-96 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full blur-3xl opacity-40"
          style={{
            left: `${20 + mousePosition.x * 0.02}%`,
            top: `${10 + mousePosition.y * 0.02}%`,
            transition: 'all 2s ease-out',
          }}
        />
        <div
          className="absolute w-80 h-80 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full blur-3xl opacity-30"
          style={{
            right: `${15 + mousePosition.x * -0.02}%`,
            bottom: `${15 + mousePosition.y * -0.02}%`,
            transition: 'all 2s ease-out',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-6 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
              Healthcare Portal
            </h1>
            <p className="text-slate-600 font-medium">Front Desk Management System</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/60 overflow-hidden">
            <div className="px-8 pt-8 pb-2">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">
                {isRegister ? 'Create Account' : 'Welcome back'}
              </h2>
              <p className="text-slate-500 text-sm">
                {isRegister ? 'Register to get started' : 'Please sign in to your account'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8">
              <div className="space-y-5 mt-6">
                {/* Error */}
                {error && (
                  <Alert className="border-red-200 bg-red-50 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Username</label>
                  <div className="relative">
                    <User
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'username' ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Enter username"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition-all duration-200"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <div className="relative">
                    <Lock
                      className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                        focusedField === 'password' ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition-all duration-200"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !username || !password}
                  className="group relative w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-xl"
                >
                  <div className="flex items-center justify-center space-x-2">
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{isRegister ? 'Registering...' : 'Signing in...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isRegister ? 'Register' : 'Sign In'}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>

                {/* Toggle */}
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setIsRegister(!isRegister)}
                    className="text-sm text-slate-600 hover:text-black hover:underline cursor-pointer"
                  >
                    {isRegister
                      ? 'Already have an account? Login'
                      : "Don't have an account? Register"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-slate-100/60 rounded-2xl border border-slate-200/60">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-1">Secure Access</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  This system uses enterprise-grade security protocols. All sessions are encrypted and monitored for compliance.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              Need help? Contact IT Support •{' '}
              <button className="ml-1 text-slate-600 hover:text-slate-900 transition-colors font-medium">
                vilaspgowda1000@gmail.com
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
