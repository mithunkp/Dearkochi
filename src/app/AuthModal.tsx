'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Mail, Key } from 'lucide-react';

export default function AuthModal({ onClose }: { onClose?: () => void }) {
  const { signInWithEmail, signInWithGoogle, user, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin'); // Simplified for now

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      onClose?.();
    } catch (err: any) {
      alert('Sign in failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose?.();
    } catch (err: any) {
      alert('Google Sign in failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
          <h2 className="text-xl font-bold text-slate-800">Signed in</h2>
          <p className="text-sm text-slate-500 mt-2">{user.email}</p>
          <div className="mt-6 flex flex-col gap-3">
            <a href="/profile" className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-center font-medium transition-colors">View Profile</a>
            <button onClick={() => signOut()} className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-medium transition-colors">Sign out</button>
            <button onClick={onClose} className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Sign In</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100"></div>
            <span className="text-xs text-slate-400 font-medium">OR</span>
            <div className="h-px flex-1 bg-slate-100"></div>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
