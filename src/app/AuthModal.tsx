"use client";

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function AuthModal({ onClose }: { onClose?: () => void }) {
  const { signIn, user, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSignIn = async () => {
    try {
      await signIn(email);
      setMessage('Magic link sent — check your email.');
    } catch (err) {
      console.error(err);
      setMessage('Failed to send magic link');
    }
  };

  if (user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h2 className="text-lg font-semibold">Signed in</h2>
          <p className="text-sm text-gray-600 mt-2">{user.email}</p>
          <div className="mt-4 flex justify-end gap-2">
            <a href="/profile" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">View Profile</a>
            <button onClick={() => signOut()} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Sign out</button>
            <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold">Sign in</h2>
        <p className="text-sm text-gray-600 mt-2">Enter your email and we will send a magic link.</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-4 w-full px-3 py-2 border rounded"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={handleSignIn} className="px-4 py-2 bg-blue-600 text-white rounded">Send link</button>
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
        </div>
        {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
