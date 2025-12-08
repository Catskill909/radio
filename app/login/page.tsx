'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function LoginForm() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get('redirect') || '/shows';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid password');
        setIsLoading(false);
        return;
      }

      // Redirect to the original destination
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <Image
            src="/images/stationdock2.png"
            alt="StationDock"
            width={200}
            height={200}
            priority
          />
        </div>

        <h1 className="login-title">Admin Access</h1>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              autoFocus
              disabled={isLoading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading || !password}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Signing in...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt" /> Sign In
              </>
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%);
          padding: 20px;
        }

        .login-card {
          background: rgba(30, 30, 45, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 48px 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
        }

        .login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .login-title {
          font-family: 'Oswald', sans-serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #ffffff;
          text-align: center;
          margin-bottom: 32px;
          letter-spacing: 0.5px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .password-field {
          position: relative;
          display: flex;
          align-items: center;
        }

        .password-field input {
          width: 100%;
          padding: 14px 50px 14px 16px;
          font-size: 16px;
          font-family: 'Inter', sans-serif;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .password-field input:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .password-field input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .toggle-password {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 8px;
          font-size: 16px;
          transition: color 0.2s ease;
        }

        .toggle-password:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .login-error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          color: #f87171;
          font-size: 14px;
          text-align: center;
        }

        .login-button {
          width: 100%;
          padding: 14px 24px;
          font-size: 16px;
          font-weight: 500;
          font-family: 'Inter', sans-serif;
          background: transparent;
          border: 1px solid rgba(59, 130, 246, 0.5);
          border-radius: 8px;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .login-button:hover:not(:disabled) {
          border-color: rgb(59, 130, 246);
          background: rgba(59, 130, 246, 0.05);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)'
      }}>
        <div style={{ color: '#fff' }}>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

