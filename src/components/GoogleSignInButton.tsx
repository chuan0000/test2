import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { LogOut, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { googleSignIn, logoutGoogle, initAuth, getAccessToken } from '../services/googleAuth';

interface GoogleSignInButtonProps {
  onAuthChange?: (user: User | null, token: string | null) => void;
  compact?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onAuthChange,
  compact = false,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        if (onAuthChange) onAuthChange(user, token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
        if (onAuthChange) onAuthChange(null, null);
      }
    );

    getAccessToken().then((token) => {
      if (token) setAccessToken(token);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        if (onAuthChange) onAuthChange(res.user, res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setErrorMsg(err.message || 'Google 登入授權失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setCurrentUser(null);
      setAccessToken(null);
      if (onAuthChange) onAuthChange(null, null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // If already logged in, show user badge and sign out option
  if (currentUser) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'Google User'}
              className="w-4 h-4 rounded-full border border-emerald-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span className="font-semibold max-w-[130px] truncate">
            {currentUser.displayName || currentUser.email || '已連結 Google'}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-stone-100 transition-colors cursor-pointer"
          title="登出 Google 帳號"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Official Standard Google Sign-In Button
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="gsi-material-button inline-flex items-center justify-center gap-2.5 px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-semibold shadow-xs hover:bg-stone-50 active:bg-stone-100 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        title="使用 Google 帳號登入並授權 Docs / Slides / Drive"
      >
        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="w-4 h-4 block"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
        </div>
        <span className="whitespace-nowrap">
          {isLoading ? '連線中...' : compact ? 'Google 登入' : 'Sign in with Google'}
        </span>
      </button>
      {errorMsg && (
        <span className="text-[10px] text-red-500 font-medium">{errorMsg}</span>
      )}
    </div>
  );
};
