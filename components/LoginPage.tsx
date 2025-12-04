
// components/LoginPage.tsx
import React, { useState, useEffect, useRef } from 'react';

interface LoginPageProps {
  onLoginAttempt: (role: 'admin' | 'staff', credential: string, isDemo?: boolean) => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginAttempt }) => {
  const [loginType, setLoginType] = useState<'admin' | 'staff'>('staff');
  const [credential, setCredential] = useState('');
  // Error state removed from UI render but kept logic for internal handling if needed later
  const [, setError] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  
  // Use a ref to track loading state independent of render closures
  const isLoadingRef = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleLogin = async (e?: React.FormEvent, isDemo = false) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);
    isLoadingRef.current = true;

    // Safety timeout: If request hangs for >8 seconds, force stop.
    const safetyTimeout = setTimeout(() => {
        if (isMounted.current && isLoadingRef.current) {
            setIsLoading(false);
            isLoadingRef.current = false;
            setError('Connection timed out. The backend server might be offline.');
        }
    }, 8000);

    try {
      const trimmedCredential = credential.trim();
      await onLoginAttempt(loginType, isDemo ? 'demo' : trimmedCredential, isDemo);
      // If we reach here, login was successful (or offline fallback triggered).
      if (isMounted.current) {
          clearTimeout(safetyTimeout);
      }
    } catch (e: any) {
      if (isMounted.current) {
          clearTimeout(safetyTimeout);
          setError(e.message || 'Login failed.');
          setIsLoading(false);
          isLoadingRef.current = false;
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="flex bg-gray-100 rounded-full p-1 mb-6">
          <button 
            type="button"
            disabled={isLoading}
            onClick={() => { setLoginType('admin'); setCredential(''); setError(''); }} 
            className={`flex-1 py-2 font-semibold text-sm rounded-full transition-all ${loginType === 'admin' ? 'bg-white text-primary shadow' : 'text-text-light'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Admin Login
          </button>
          <button 
            type="button"
            disabled={isLoading}
            onClick={() => { setLoginType('staff'); setCredential(''); setError(''); }} 
            className={`flex-1 py-2 font-semibold text-sm rounded-full transition-all ${loginType === 'staff' ? 'bg-white text-primary shadow' : 'text-text-light'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Store Login
          </button>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {loginType === 'admin' ? (
            <div>
              <h2 className="text-xl font-bold text-center text-text-dark">Admin Access</h2>
              <input 
                type="text" 
                placeholder="Admin Email" 
                value={credential} 
                onChange={(e) => setCredential(e.target.value)} 
                className="mt-2 w-full px-4 py-3 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary transition text-text-dark" 
                required={!isLoading} 
                disabled={isLoading}
              />
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-center text-text-dark">Store Access</h2>
              <input 
                type="text" 
                placeholder="Access Code" 
                value={credential} 
                onChange={(e) => setCredential(e.target.value)} 
                className="mt-2 w-full px-4 py-3 bg-gray-100 border-transparent rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary transition text-text-dark" 
                required={!isLoading} 
                disabled={isLoading}
              />
            </div>
          )}
          
          {/* Error Message Removed as per user request */}

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Logging in...</span>
                </>
            ) : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
